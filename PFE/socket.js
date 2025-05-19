// socket.js
let io;

module.exports = {
  init: (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
      }
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
