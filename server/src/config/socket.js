const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    // Check if token is passed via auth or cookie
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split(';')
      .find(c => c.trim().startsWith('careflow_access_token='))
      ?.split('=')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
        socket.user = decoded;
      } catch (err) {
        // Token invalid, still allow public guest tracking connection
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    // Join clinic room
    socket.on('join:clinic', (clinicId) => {
      if (clinicId) {
        socket.join(`clinic:${clinicId}`);
      }
    });

    // Join department room
    socket.on('join:department', ({ clinicId, departmentId }) => {
      if (clinicId && departmentId) {
        socket.join(`department:${clinicId}:${departmentId}`);
      }
    });

    // Join guest patient tracker token room
    socket.on('join:token', (trackingToken) => {
      if (trackingToken) {
        socket.join(`token:${trackingToken}`);
      }
    });

    // Join user personal notification room
    socket.on('join:user', (userId) => {
      if (socket.user && socket.user.id === userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
