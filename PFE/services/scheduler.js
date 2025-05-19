const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const xlsx = require('xlsx');
const Notification = require('../models/Notification');
const User = require('../models/User');
const SchedulerHistory = require('../models/SchedulerHistory');
const { config } = require('dotenv');
const NotificationService = require('../services/notificationService');
const UserSettings = require('../models/UserSettings');

config();

class DataScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJobs = [];
    // Chemins des fichiers de données corrigés
    this.dataFilePaths = {
      fuel_data: process.env.FUEL_DATA_PATH || 'C:/Users/lenovo/Desktop/PFE/datax/data/all_fuel_data.xlsx',
      flight_data: process.env.FLIGHT_DATA_PATH || 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaportProcessed.xlsx', // Corrigé : FLIGHT_DATA_PATH
      merged_data: process.env.MERGED_DATA_PATH || 'C:/Users/lenovo/Desktop/PFE/megred_data.xlsx'
    };
    this.pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
    this.previousRecordCounts = {
      fuel_data: 0,
      flight_data: 0
    };
    this.newRecordsReport = {
      fuel_data: { newRecords: 0, newData: [] },
      flight_data: { newRecords: 0, newData: [] }
    };
    console.log('Initialized DataScheduler with dataFilePaths:', this.dataFilePaths);
  }

  async init() {
    try {
      console.log('🚀 Début de l\'initialisation du scheduler...');
      await this.validateDependencies();
      console.log('✅ Dépendances validées');
      await this.validateFilePaths();
      console.log('✅ Chemins de fichiers validés');
      await this.updateRecordCounts();
      console.log('✅ Comptes de records mis à jour:', this.previousRecordCounts);
      await this.scheduleUserCronJobs();
      console.log('✅ Scheduler initialisé avec succès');
    } catch (error) {
      console.error('❌ Échec de l\'initialisation du scheduler:', error.message, error.stack);
      throw error;
    }
  }

  async scheduleUserCronJobs() {
    try {
      // Arrêter les tâches cron existantes
      if (this.cronJobs && this.cronJobs.length > 0) {
        console.log(`Arrêt de ${this.cronJobs.length} cron jobs existants...`);
        this.cronJobs.forEach((job, index) => {
          console.log(`Arrêt du cron job ${index}`);
          job.stop();
        });
      }
      this.cronJobs = [];

      // Récupérer les paramètres des utilisateurs autorisés
      const allowedRoles = ['admin', 'fueldatamaster', 'fueluser'];
      const settings = await UserSettings.find().populate({
        path: 'userId',
        match: { role: { $in: allowedRoles } },
      });

      console.log(`Configurations utilisateur récupérées : ${settings.length} trouvées`);

      // Filtrer les paramètres valides
      const validSettings = settings.filter(s => s.userId && s.schedulerConfig?.enabled);
      console.log(`Configurations valides : ${validSettings.length}`);

      for (const setting of validSettings) {
        const { schedulerConfig, userId } = setting;
        const { hours, days, months, weekdays } = schedulerConfig;

        // Créer une expression cron
        const cronExpression = this.createCronExpression(
          hours, days, months, weekdays, schedulerConfig.startDate
        );
        

        if (cronExpression) {
          console.log(`📅 Programmation pour userId ${userId}: ${cronExpression}`);
          const job = cron.schedule(
            cronExpression,
            async () => {
              console.log(`⏰ Cron job déclenché pour userId ${userId} à: ${new Date().toLocaleString('fr-TN', { timeZone: 'Africa/Tunis' })}`);
              await this.runDataProcessing();
          
              // Exécution unique : on arrête après
              if (schedulerConfig.startDate) {
                console.log(`🛑 Exécution unique atteinte pour userId ${userId}, arrêt de la tâche`);
                job.stop();
              }
            },
            { timezone: 'Africa/Tunis' }
          );
          
          // ✅ Démarrer le job ici
          job.start();
          this.cronJobs.push(job);
          
                  } else {
          console.warn(`⚠️ Aucune expression cron valide pour userId ${userId}`);
        }
      }

      console.log(`✅ ${this.cronJobs.length} tâches cron programmées`);
    } catch (error) {
      console.error('❌ Erreur lors de la planification des cron jobs:', error.message, error.stack);
      throw error;
    }
  }

  createCronExpression(hours, days, months, weekdays, startDate) {
    const now = new Date();
  
    if (startDate) {
      const date = new Date(startDate);
      if (date > now) {
        const minute = date.getMinutes();
        const hour = date.getHours();
        const dayOfMonth = date.getDate();
        const month = date.getMonth() + 1;
        return `${minute} ${hour} ${dayOfMonth} ${month} *`;
      } else {
        console.warn(`⚠️ startDate (${startDate}) est déjà passé. Ignoré.`);
      }
    }
    
  
    // fallback normal
    const minute = '0';
    const h = hours?.length ? hours.join(',') : '*';
    const d = days?.length ? days.join(',') : '*';
    const m = months?.length ? months.join(',') : '*';
    const w = weekdays?.length ? weekdays.join(',') : '*';
  
    if (h === '*' && d === '*' && m === '*' && w === '*') return null;
  
    return `${minute} ${h} ${d} ${m} ${w}`;
  }
  
  async updateSchedulerConfigs() {
    console.log('🔄 Mise à jour des configurations du scheduler...');
    await this.scheduleUserCronJobs();
    console.log('✅ Configurations mises à jour');
  }

  async validateDependencies() {
    try {
      await this.executeCommand(`${this.pythonCommand} --version`);
      console.log('✅ Python version check passed');
    } catch (error) {
      throw new Error(`Python n'est pas installé ou n'est pas accessible: ${error.message}`);
    }

    const scripts = [
      '../extraction.py',
      '../scripts/extract_flight_data.py',
      '../scripts/megred.py',
      '../scripts/missing_data_checker.py'
    ];
    for (const script of scripts) {
      const scriptPath = path.join(__dirname, script);
      try {
        await fs.access(scriptPath);
        console.log(`✅ Script trouvé: ${scriptPath}`);
      } catch (error) {
        throw new Error(`Script introuvable: ${scriptPath}`);
      }
    }
  }

  async validateFilePaths() {
    for (const [fileType, filePath] of Object.entries(this.dataFilePaths)) {
      if (!filePath) {
        throw new Error(`Chemin du fichier pour ${fileType} non défini (variable d'environnement manquante)`);
      }
      try {
        await fs.access(filePath);
        console.log(`✅ Chemin valide pour ${fileType}: ${filePath}`);
      } catch (error) {
        throw new Error(`Chemin du fichier inaccessible pour ${fileType}: ${filePath} (${error.message})`);
      }
    }
  }

  async updateRecordCounts() {
    for (const fileType of ['fuel_data', 'flight_data']) {
      const result = await this.getDataFromFile(fileType);
      if (result.success) {
        this.previousRecordCounts[fileType] = result.total;
        console.log(`✅ Record count updated for ${fileType}: ${result.total}`);
      } else {
        console.error(`❌ Failed to update record count for ${fileType}: ${result.error}`);
      }
    }
  }

  async checkNewData() {
    console.log('🔍 Vérification des nouvelles données...');
    this.newRecordsReport = {
      fuel_data: { newRecords: 0, newData: [] },
      flight_data: { newRecords: 0, newData: [] }
    };

    for (const fileType of ['fuel_data', 'flight_data']) {
      const result = await this.getDataFromFile(fileType);
      console.log(`📊 Résultat pour ${fileType}:`, result);
      if (result.success) {
        const currentCount = result.total;
        const previousCount = this.previousRecordCounts[fileType];
        const newRecords = Math.max(0, currentCount - previousCount);
        console.log(`${fileType} - Current: ${currentCount}, Previous: ${previousCount}, New: ${newRecords}`);

        if (newRecords > 0) {
          this.newRecordsReport[fileType].newRecords = newRecords;
          this.newRecordsReport[fileType].newData = result.data.slice(-newRecords);
          await this.notifyNewData(fileType, newRecords);
        }
        this.previousRecordCounts[fileType] = currentCount;
      } else {
        console.error(`❌ Échec de la vérification des nouvelles données pour ${fileType}: ${result.error}`);
      }
    }
    return this.newRecordsReport;
  }

  async updateNewData(fileType, rowIndex, updates) {
    console.log(`🔧 Mise à jour de la ligne ${rowIndex} dans ${fileType} avec :`, updates);
    if (!['fuel_data', 'flight_data'].includes(fileType)) {
      throw new Error(`Type de fichier invalide : ${fileType}`);
    }

    const dataArray = this.newRecordsReport[fileType]?.newData;
    if (!Array.isArray(dataArray)) {
      throw new Error(`Aucune nouvelle donnée pour ${fileType}`);
    }

    if (rowIndex < 0 || rowIndex >= dataArray.length) {
      throw new Error(`Index ${rowIndex} invalide pour ${fileType}`);
    }

    const originalRow = dataArray[rowIndex];
    const updatedRow = { ...originalRow, ...updates };
    this.newRecordsReport[fileType].newData[rowIndex] = updatedRow;
    console.log(`✅ Ligne mise à jour :`, updatedRow);
    return updatedRow;
  }

  async notifyNewData(fileType, newRecords) {
    try {
      const users = await User.find({});
      await Promise.all(users.map(user => {
        return NotificationService.createNotification(
          user._id,
          'info',
          `${newRecords} nouveaux enregistrements ont été ajoutés à ${fileType}.`,
          { fileType, newRecords }
        );
      }));
      console.log(`📬 Notifications temps réel envoyées pour ${newRecords} enregistrements (${fileType})`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi des notifications temps réel:`, error.message);
    }
  }

  async runDataProcessing() {
    if (this.isRunning) {
      console.log('⚠️ Le traitement des données est déjà en cours...');
      return;
    }

    console.log('🚀 Début de runDataProcessing à:', new Date().toISOString());
    this.isRunning = true;
    let historyEntry;
    try {
      console.log('📝 Création de l\'entrée d\'historique...');
      historyEntry = await SchedulerHistory.create({
        startTime: new Date(),
        status: 'started',
        details: {
          scriptsExecuted: [],
          notificationsSent: 0,
          newRecords: { fuel_data: 0, flight_data: 0 }
        },
      });

      console.log('📜 Traitement des scripts Python...');
      const scripts = [
        '../extraction.py',
        '../scripts/extract_flight_data.py',
        '../scripts/megred.py',
        '../scripts/missing_data_checker.py'
      ];

      for (const script of scripts) {
        const scriptPath = path.join(__dirname, script);
        console.log(`🔄 Exécution du script: ${scriptPath}`);
        await this.executeScript(scriptPath);
        historyEntry.details.scriptsExecuted.push(path.basename(script));
        await historyEntry.save();
        console.log(`✅ Script exécuté: ${scriptPath}`);
      }

      console.log('📊 Vérification des données mergées...');
      const mergedDataResult = await this.getDataFromFile('merged_data');
      if (!mergedDataResult.success || mergedDataResult.total === 0) {
        throw new Error('Échec de l\'extraction des données de merged_data: fichier vide ou corrompu');
      }
      console.log(`✅ Données de merged_data extraites: ${mergedDataResult.total} enregistrements`);

      console.log('🔍 Vérification des nouvelles données...');
      const newDataReport = await this.checkNewData();
      historyEntry.details.newRecords = {
        fuel_data: newDataReport.fuel_data.newRecords,
        flight_data: newDataReport.flight_data.newRecords
      };

      console.log('⚠️ Vérification des données manquantes...');
      const missingReport = await this.checkAndNotifyMissingData();
      historyEntry.details.notificationsSent += missingReport?.notifications || 0;

      console.log('📬 Envoi des notifications de mise à jour...');
      historyEntry.details.notificationsSent += await User.countDocuments();
      await historyEntry.save();

      historyEntry.status = 'completed';
      historyEntry.endTime = new Date();
      await historyEntry.save();

      console.log('🎉 Traitement des données terminé avec succès à:', new Date().toISOString());
    } catch (error) {
      console.error('❌ Erreur lors du traitement des données:', error.message, error.stack);
      if (historyEntry) {
        historyEntry.status = 'failed';
        historyEntry.error = error.message;
        historyEntry.endTime = new Date();
        await historyEntry.save();
      }
      await this.sendErrorNotification(error);
    } finally {
      this.isRunning = false;
      console.log('🏁 Fin de runDataProcessing à:', new Date().toISOString());
    }
  }

  async executeScript(scriptPath) {
    console.log(`Exécution du script : ${scriptPath}`);
    const stdout = await this.executeCommand(`${this.pythonCommand} "${scriptPath}"`);
    console.log(`Sortie du script : ${stdout}`);
    return stdout;
  }

  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      console.log(`🔧 Exécution de la commande: ${command}`);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Erreur lors de l'exécution de ${command}:`, error.message);
          reject(error);
        } else if (stderr && stderr.includes('Traceback')) {
          console.error(`❌ Erreur Python dans ${command}:`, stderr);
          reject(new Error(stderr));
        } else {
          console.log(`✅ Exécution réussie: ${command}\nSortie: ${stdout.trim()}`);
          resolve(stdout);
        }
      });
    });
  }

  async checkAndNotifyMissingData() {
    try {
      console.log('🔍 Vérification des données manquantes...');
      const missingReport = await this.getMissingDataReport();

      if (!missingReport) {
        throw new Error('Rapport de données manquantes vide ou non défini');
      }

      let parsedReport;
      try {
        parsedReport = JSON.parse(missingReport);
      } catch (parseError) {
        throw new Error(`Échec de l'analyse du rapport de données manquantes: ${parseError.message}`);
      }

      if (!parsedReport || typeof parsedReport !== 'object' || !parsedReport.hasOwnProperty('success')) {
        throw new Error('Structure de rapport de données manquantes invalide');
      }

      let notifications = 0;
      if (!parsedReport.success && parsedReport.details) {
        const users = await User.find({});

        for (const user of users) {
          for (const [file, details] of Object.entries(parsedReport.details)) {
            const missingDetails = Object.entries(details)
              .filter(([key]) => key !== 'error' && details[key]?.count && Array.isArray(details[key]?.rows))
              .map(([column, info]) => ({
                column,
                count: info.count,
                rows: info.rows,
                link: `/data/${file}?row=${info.rows[0] || ''}&column=${column}`
              }));

            if (missingDetails.length > 0) {
              const message = missingDetails
                .map(d => `- ${d.column}: ${d.count} valeurs manquantes`)
                .join('\n');

              try {
                await NotificationService.createNotification(
                  user._id,
                  'warning',
                  `Données manquantes dans ${file}:\n${message}`,
                  { missingDetails }
                );
                notifications++;
              } catch (notificationError) {
                console.error(`❌ Échec de l'envoi de la notification pour l'utilisateur ${user._id}:`, notificationError.message);
              }
            }
          }
        }
      }

      console.log(`📬 ${notifications} notifications de données manquantes envoyées via WebSocket`);
      return { notifications };
    } catch (error) {
      console.error('❌ Erreur lors de checkAndNotifyMissingData():', error.message);
      throw error;
    }
  }

  async getMissingDataReport() {
    const scriptPath = path.join(__dirname, '../scripts/missing_data_checker.py');
    return this.executeScript(scriptPath);
  }

  async sendNotifications() {
    try {
      const users = await User.find({});
      await Promise.all(users.map(user => {
        return NotificationService.createNotification(
          user._id,
          'success',
          'Les données ont été mises à jour avec succès.',
          {}
        );
      }));
      console.log('📬 Notifications succès envoyées via WebSocket');
    } catch (error) {
      console.error('❌ Erreur WebSocket succès:', error.message);
    }
  }

  async sendErrorNotification(error) {
    try {
      const adminUsers = await User.find({ isAdmin: true });
      await Promise.all(adminUsers.map(user => {
        return NotificationService.createNotification(
          user._id,
          'error',
          `Le traitement des données a échoué: ${error.message}`,
          {}
        );
      }));
      console.log('📬 Notifications d’erreur envoyées via WebSocket');
    } catch (err) {
      console.error('❌ Erreur envoi des notifications d’erreur:', err.message);
    }
  }

  async getDataFromFile(fileType) {
    if (!this.dataFilePaths[fileType]) {
      console.error(`❌ Type de fichier inconnu: ${fileType}`);
      return { success: false, error: `Type de fichier inconnu: ${fileType}`, file: fileType };
    }

    try {
      const filePath = this.dataFilePaths[fileType];
      console.log(`📂 Tentative de lecture du fichier: ${filePath}`);
      await fs.access(filePath);

      const workbook = xlsx.readFile(filePath, { cellDates: true, dateNF: 'yyyy-mm-dd' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('Aucune feuille trouvée dans le fichier Excel');
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { defval: null, raw: false });
      console.log(`📊 Lu ${data.length} lignes depuis ${fileType}`);

      return {
        success: true,
        data,
        total: data.length,
        file: fileType,
        path: filePath
      };
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des données ${fileType}:`, error.message);
      return {
        success: false,
        error: error.message,
        file: fileType
      };
    }
  }

  async triggerDataProcessing() {
    if (!this.isRunning) {
      console.log('🛠️ Déclenchement manuel du traitement des données...');
      await this.runDataProcessing();
      return { success: true, message: 'Traitement des données lancé avec succès' };
    }
    return { success: false, message: 'Le traitement des données est déjà en cours' };
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: new Date(),
    };
  }

  async getHistory(limit = 10) {
    try {
      const validatedLimit = Math.max(1, Math.min(Number(limit) || 10, 100));
      const history = await SchedulerHistory.find({})
        .sort({ startTime: -1 })
        .limit(validatedLimit)
        .lean();

      return {
        success: true,
        data: history,
        count: history.length
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'historique:', {
        message: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getNewDataReport() {
    await this.checkNewData();
    return {
      success: true,
      data: this.newRecordsReport
    };
  }
}

module.exports = DataScheduler;