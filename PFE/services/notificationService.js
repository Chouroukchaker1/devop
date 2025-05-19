const Notification = require('../models/Notification');
const UserSettings = require('../models/UserSettings'); // Supprimez si inutilisé
const { getIO } = require('../socket'); // 🧠 plus de boucle
 // 🔥 Assurez-vous que `getIO` est exporté depuis server.js

class NotificationService {
  /**
   * Crée une notification pour un utilisateur, en respectant ses paramètres de notification
   * @param {String} userId - ID de l'utilisateur
   * @param {String} type - Type de notification (system, update, etc.)
   * @param {String} message - Message de la notification
   * @param {Object} metadata - Données supplémentaires (ex. missingDetails)
   * @returns {Object|null} Notification créée ou null si désactivée
   */
  async createNotification(userId, type, message, metadata) {
    // Vérifier les préférences utilisateur (facultatif)
    const userSettings = await UserSettings.findOne({ userId });
        //  Vérifier si les notifications sont complètement désactivées
        if (userSettings?.notifications?.enable === false) {
          return null; // Ne pas créer si notifications désactivées globalement
        }
    
        //  Vérifier si ce type est autorisé dans allowedNotificationTypes
        const allowedTypes = userSettings?.notifications?.allowedTypes;
        if (Array.isArray(allowedTypes) && !allowedTypes.includes(type)) {
          console.log(`🔕 Type "${type}" bloqué pour l'utilisateur ${userId}`);
          return null; //  Ne pas créer si le type n’est pas autorisé
        }
    

    // Créer et sauvegarder la notification
    const notification = new Notification({
      userId,
      type,
      message,
      metadata,
      read: false,
    });
    const savedNotification = await notification.save();

    // ✅ Emettre la notification via WebSocket en temps réel
    const io = getIO(); // <-- récupérer l’instance de socket.io
    if (io) {
      io.to(userId.toString()).emit('notification', savedNotification); // 🔥 c’est ici que ça se joue
    }

    return savedNotification;
  }

  /**
   * Marque une notification comme lue
   * @param {String} notificationId - ID de la notification
   * @param {String} userId - ID de l'utilisateur
   * @returns {Object|null} Notification mise à jour ou null si non trouvée/non autorisée
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) return null;
    if (notification.userId.toString() !== userId.toString()) return null;

    notification.read = true;
    return await notification.save();
  }
}

module.exports = new NotificationService();
