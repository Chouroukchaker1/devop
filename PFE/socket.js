// socket.js
const jwt = require('jsonwebtoken');
const jwtConfig = require('./config/jwt');
const User = require('./models/User'); // Assure-toi que ce chemin est correct

let io; // ✅ Doit être déclaré en haut

module.exports = {
  init: (server) => {
    const { Server } = require('socket.io');

    io = new Server(server, {
      cors: {
        origin: "http://localhost:3001", // ⚠️ adapte si ton front est hébergé ailleurs
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // 🔐 Middleware d'authentification WebSocket
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          console.warn('❌ Aucun token JWT fourni dans WebSocket');
          return next(new Error("Authentication failed"));
        }

        const decoded = jwt.verify(token, jwtConfig.secret);
        const user = await User.findById(decoded.id);

        if (!user) {
          console.warn('❌ Utilisateur non trouvé avec ID :', decoded.id);
          return next(new Error("Authentication failed"));
        }

        socket.user = user; // 👈 Attache l'utilisateur à la socket
        next();
      } catch (err) {
        console.error('❌ Erreur d\'authentification WebSocket :', err.message);
        return next(new Error("Authentication failed"));
      }
    });

    // ✅ Connexion réussie
    io.on('connection', (socket) => {
      console.log(`🟢 Utilisateur connecté via WebSocket : ${socket.user.username} (${socket.user._id})`);

      socket.on('disconnect', () => {
        console.log(`🔌 Déconnexion WebSocket : ${socket.user.username}`);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io non initialisé !");
    }
    return io;
  }
};
