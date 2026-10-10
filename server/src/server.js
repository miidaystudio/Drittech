const http = require('http');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start Server
const start = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`🏥 CareFlow by Drittech Server is running on port ${env.PORT}`);
    console.log(`📡 WebSocket server initialized`);
    console.log(`🌐 Client Origin: ${env.CLIENT_ORIGIN}`);
    console.log(`====================================================`);
  });
};

start();

module.exports = server;
