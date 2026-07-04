require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const redis = require('./src/config/redis');


const PORT = process.env.PORT || 5005;

const server = http.createServer(app);


const { Server } = require('socket.io');

// Use same multi-origin CORS logic as app.js
const allowedSocketOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3005')
  .split(',')
  .map(o => o.trim())
  .concat(['http://localhost:3005', 'http://localhost:5173', 'http://localhost:3000'])
  .filter((v, i, a) => a.indexOf(v) === i); // dedupe

const io = new Server(server, {
  cors: {
    origin: allowedSocketOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  }
});



require('./src/sockets/meeting.sockets')(io);


process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});


connectDB().then(() => {

  redis.initRedis();

  // Initialize background workers
  require('./src/workers/summaryWorker');

  server.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to DB, server not started.');
  console.error(err);
  process.exit(1);
});


process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
