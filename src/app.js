import express, { urlencoded } from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from '#routes/auth.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';

const app = express();
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(
  morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } })
);
app.use(cookieParser());

app.use(securityMiddleware);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions !');
  res.status(200).send('Hello from Acquisitions !');
});

app.get('/api', (req, res) => {
  res.status(200).send('API is running');
});

app.use('/api/auth', authRoutes); // api/auth/* goes to authRoutes

export default app;
