const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const xlsx = require('xlsx');
const { parse } = require('json2csv');
const connectDB = require('./config/database');
const { authMiddleware } = require('./middlewares/authMiddleware');
const User = require('./models/User');
const upload = require('./middlewares/multerConfig');
const Notification = require('./models/Notification');
const DataScheduler = require('./services/scheduler');
const XLSX = require('xlsx');
const http = require('http');
const jwt = require('jsonwebtoken');
const socket = require('./socket');

const app = express();
const server = http.createServer(app);
const io = socket.init(server);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  console.log("🔐 Tentative de connexion socket avec token:", token);


  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    next();
  } catch (err) {
    return next(new Error("Authentication failed"));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Utilisateur ${socket.userId} connecté avec le socket ${socket.id}`);
  socket.join(socket.userId);
  socket.on('disconnect', () => {
    console.log(`❌ Utilisateur ${socket.userId} déconnecté`);
  });
});

app.set('io', io);

const uploadsDir = path.join(__dirname, 'uploads'); // <-- minuscule

const outputDir = path.join(__dirname, 'output');
const scriptsDir = path.join(__dirname, 'scripts');
[uploadsDir, outputDir, scriptsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

connectDB();
const scheduler = new DataScheduler();
(async () => {
  try {
    console.log('🚀 Initialisation du scheduler...');
    await scheduler.init();
    console.log("✅ Scheduler démarré automatiquement.");
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du scheduler:", error.message, error.stack);
  }
})();

app.set('scheduler', scheduler);

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));
app.use('/output', express.static(outputDir));

app.use((req, res, next) => {
  if (req.body) {
    const payloadSize = JSON.stringify(req.body).length / 1024;
    console.log(`Incoming payload size: ${payloadSize.toFixed(2)} KB for ${req.method} ${req.url}`);
  }
  next();
});

const FUEL_DATA_PATH = path.join(__dirname, 'datax', 'data', 'all_fuel_data.xlsx');
const MERGED_DATA_PATH = path.join(__dirname, 'merged_data.xlsx');
const FLIGHT_DATA_PATH = path.join(__dirname, 'sample_data', 'dataRaportProcessed.xlsx');

const readExcelFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Le fichier n'a pas été trouvé à l'emplacement : ${filePath}`);
  }
  const workbook = xlsx.readFile(filePath);
  return xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
};

const dataRouter = express.Router();

dataRouter.get('/json/:dataType', (req, res) => {
  try {
    let filePath;
    switch (req.params.dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Type de données invalide' });
    }

    const data = readExcelFile(filePath);
    res.json({ success: true, data });
  } catch (error) {
    console.error(`Erreur lors de la lecture des données ${req.params.dataType}:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

dataRouter.get('/excel/:dataType', (req, res) => {
  try {
    let filePath, fileName;
    switch (req.params.dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        fileName = 'fuel_data.xlsx';
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        fileName = 'flight_data.xlsx';
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        fileName = 'merged_data.xlsx';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Type de données invalide' });
    }

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Le fichier n'existe pas à l'emplacement : ${filePath}`);
      return res.status(404).json({ success: false, message: `Le fichier ${fileName} n'a pas été trouvé.` });
    }

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(`❌ Erreur lors du téléchargement de ${fileName}:`, err.message);
        res.status(500).json({ success: false, message: 'Erreur lors du téléchargement du fichier.' });
      }
    });
  } catch (error) {
    console.error(`Erreur lors du traitement de la requête excel/${req.params.dataType}:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

dataRouter.get('/csv/:dataType', (req, res) => {
  try {
    let filePath, fileName;
    switch (req.params.dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        fileName = 'fuel_data.csv';
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        fileName = 'flight_data.csv';
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        fileName = 'merged_data.csv';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Type de données invalide' });
    }

    const data = readExcelFile(filePath);
    const csv = parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    res.send(csv);
  } catch (error) {
    console.error(`Erreur lors de la conversion en CSV pour ${req.params.dataType}:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

dataRouter.get('/xml/:dataType', (req, res) => {
  try {
    let filePath, fileName;
    switch (req.params.dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        fileName = 'fuel_data.xml';
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        fileName = 'flight_data.xml';
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        fileName = 'merged_data.xml';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Type de données invalide' });
    }

    const data = readExcelFile(filePath);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
    data.forEach(item => {
      xml += '  <record>\n';
      for (const [key, value] of Object.entries(item)) {
        xml += `    <${key}>${value}</${key}>\n`;
      }
      xml += '  </record>\n';
    });
    xml += '</data>';

    res.header('Content-Type', 'application/xml');
    res.attachment(fileName);
    res.send(xml);
  } catch (error) {
    console.error(`Erreur lors de la conversion en XML pour ${req.params.dataType}:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use('/api/data', dataRouter);

app.get('/api/download/merged-data', (req, res) => {
  const filePath = MERGED_DATA_PATH;
  const fileName = 'merged_data.xlsx';
  if (fs.existsSync(filePath)) {
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error(`❌ Erreur lors du téléchargement de ${fileName}:`, err.message);
        res.status(500).json({ success: false, message: 'Erreur lors du téléchargement du fichier.' });
      }
    });
  } else {
    console.error(`❌ Le fichier n'existe pas à l'emplacement : ${filePath}`);
    res.status(404).json({
      success: false,
      message: `Le fichier ${fileName} n'a pas été trouvé. Assurez-vous que l'extraction a été effectuée.`
    });
  }
});

const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach((file) => {
  if (file.endsWith('Routes.js')) {
    const routeName = file.replace('Routes.js', '');
    try {
      const route = require(`./routes/${file}`);
      app.use(`/api/${routeName.toLowerCase()}`, route);
      console.log(`✅ Route /api/${routeName.toLowerCase()} chargée`);
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de /api/${routeName}:`, error.message);
    }
  }
});

const fuelFlightRoutes = require('./routes/fuelFlightRoutes');
app.use('/api', fuelFlightRoutes);
const excelRoutes = require('./routes/excelRoutes');
app.use('/api', excelRoutes);
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);
const notificationsRouter = require('./routes/notifications');
app.use('/api/notifications', notificationsRouter);
const userSettingsRoutes = require('./routes/userSettingsRoutes');
app.use('/api/user-settings', userSettingsRoutes);
const contactRoutes = require('./routes/contactRoutes');
app.use('/api/contact', contactRoutes);
const editDataRouter = require('./routes/editDataRouter');
app.use('/api/edit', editDataRouter);
console.log('✅ Route /api/edit chargée');
const transferDataRoutes = require('./routes/transferDataRoutes');
app.use('/api/transfer', transferDataRoutes);
console.log('✅ Route /api/transfer chargée');
const missingDataRoutes = require('./routes/donnesmanquanteroute');
app.use('/api/missing-data', missingDataRoutes);
console.log('✅ Route /api/missing-data chargée');
const powerbiRoutes = require('./routes/powerbiRoutes');
app.use('/api/powerbi', powerbiRoutes);
console.log('Route/api/powerbi Loaded');

app.post('/api/run-python', async (req, res) => {
  const scriptPath1 = path.join(__dirname, 'extraction.py');
  const scriptPath2 = path.join(__dirname, 'scripts', 'extract_flight_data.py');
  const scriptPath3 = path.join(__dirname, 'scripts', 'megred.py');
  const pythonCommand = process.platform === "win32" ? "py" : "python3";

  console.log(`🟢 Exécution des scripts : ${scriptPath1}, ${scriptPath2}, ${scriptPath3} avec ${pythonCommand}`);

  const runPythonScript = (scriptPath) => {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(scriptPath)) {
        console.error(`❌ Script not found: ${scriptPath}`);
        return reject(`Script file not found: ${scriptPath}`);
      }
      exec(`${pythonCommand} "${scriptPath}"`, (error, stdout, stderr) => {
        if (error || stderr.trim()) {
          console.error(`❌ Erreur script Python ${scriptPath}:`, error ? error.message : stderr.trim());
          reject(`Erreur lors de l'exécution du script ${scriptPath}: ${stderr.trim() || error.message}`);
        } else {
          console.log(`🟢 Sortie du script Python ${scriptPath} : ${stdout}`);
          try {
            const output = stdout.trim();
            const result = output.startsWith('{') || output.startsWith('[') ? JSON.parse(output) : { success: true, message: output };
            resolve(result);
          } catch (parseError) {
            console.error(`❌ Erreur parsing JSON dans ${scriptPath}: ${parseError}`);
            reject(`Erreur parsing JSON pour ${scriptPath}`);
          }
        }
      });
    });
  };

  try {
    const results = await Promise.all([
      runPythonScript(scriptPath1),
      runPythonScript(scriptPath2),
      runPythonScript(scriptPath3)
    ]);

    res.json({
      success: true,
      data: {
        script1: results[0],
        script2: results[1],
        script3: results[2],
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error
    });
  }
});

app.post('/api/predict', (req, res) => {
  const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
  const scriptPath = path.join(__dirname, 'scripts', 'predict.py');

  if (!fs.existsSync(scriptPath)) {
    return res.status(500).json({
      success: false,
      message: 'Le script Python predict.py est introuvable.'
    });
  }

  exec(`${pythonCommand} "${scriptPath}"`, (error, stdout, stderr) => {
    console.log('=== Python Execution Details ===');
    console.log('Command:', `${pythonCommand} "${scriptPath}"`);
    console.log('Stdout:', stdout);
    console.log('Stderr:', stderr);
    console.log('Error:', error ? error.message : 'None');
    console.log('===============================');

    const isNonCriticalWarning = stderr && stderr.includes('openpyxl') && stderr.includes('UserWarning');
    if (error && !isNonCriticalWarning) {
      console.error('Python Execution Error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la prédiction',
        error: error.message,
        stderr: stderr.trim()
      });
    }

    if (!stdout.trim()) {
      console.error('Error: Python script produced no output');
      return res.status(500).json({
        success: false,
        message: 'Le script Python n\'a produit aucune sortie'
      });
    }

    try {
      const result = JSON.parse(stdout.trim());
      if (result.success === false) {
        return res.status(500).json({
          success: false,
          message: result.message || 'Erreur retournée par le script Python'
        });
      }
      res.json({
        success: true,
        data: result
      });
    } catch (parseErr) {
      console.error('JSON Parse Error:', parseErr.message, { stdout });
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du parsing du résultat JSON',
        error: parseErr.message
      });
    }
  });
});

app.get('/api/download/extracted-fuel-data', (req, res) => {
  const filePath = path.join(__dirname, 'extracted_fuel_data.xlsx');
  if (fs.existsSync(filePath)) {
    const workbook = XLSX.readFile(filePath);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', 'attachment; filename=extracted_fuel_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
  } else {
    console.error(`❌ Le fichier extracted_fuel_data.xlsx n'existe pas à cet emplacement : ${filePath}`);
    res.status(404).json({ success: false, message: "Le fichier extracted_fuel_data.xlsx n'a pas été trouvé. Assurez-vous que l'extraction a été effectuée." });
  }
});

app.get('/api/notifications', authMiddleware, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/notifications/:id/mark-as-read', authMiddleware, async (req, res, next) => {
  try {
    const updatedNotification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    res.json(updatedNotification);
  } catch (error) {
    next(error);
  }
});

app.post('/api/trigger-update', authMiddleware, async (req, res) => {
  try {
    await scheduler.runDataProcessing();
    res.json({ success: true, message: 'Mise à jour déclenchée avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use((req, res) => {
  console.log(`❌ Route non trouvée : ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur :", err.stack);
  res.status(500).json({
    message: 'Une erreur serveur est survenue',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

   server.listen(3000, '0.0.0.0', () => {
  console.log('✅ Serveur WebSocket prêt sur 0.0.0.0:3000');
});




module.exports = { app };