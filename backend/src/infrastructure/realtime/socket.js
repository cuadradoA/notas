let io;

const users = new Map(); // userId -> socketId

exports.initSocket = (server) => {
  io = require("socket.io")(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Usuario conectado:", socket.id);

    socket.on("register", (userId) => {
      users.set(userId, socket.id);
      console.log("👤 Usuario registrado en socket:", userId);
    });

    socket.on("disconnect", () => {
      for (let [key, value] of users.entries()) {
        if (value === socket.id) {
          users.delete(key);
          break;
        }
      }
      console.log("❌ Usuario desconectado");
    });
  });
};

exports.sendNotification = (userId, notification) => {
  const socketId = users.get(userId);
  if (socketId && io) {
    io.to(socketId).emit("notification", notification);
  }
};