const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const meetingRoutes = require('./routes/meeting.routes');
const taskRoutes = require('./routes/task.routes');
const paymentRoutes = require('./routes/payment.routes');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());




const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3005')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);


['http://localhost:3005', 'http://localhost:5173', 'http://localhost:3000'].forEach(o => {
  if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
});

app.use(cors({
  origin: (origin, callback) => {
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

const apiRouter = express.Router();
app.use('/api/v1', apiRouter);

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/workspaces', workspaceRoutes);
apiRouter.use('/meetings', meetingRoutes);
apiRouter.use('/tasks', taskRoutes);
apiRouter.use('/payments', paymentRoutes);

app.use((req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server`);
  err.statusCode = 404;
  next(err);
});

app.use(errorHandler);

module.exports = app;
