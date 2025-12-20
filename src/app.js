import express, { urlencoded } from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(
  morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } })
);
app.use(cookieParser());

app.get('/', (req, res) => {
  logger.info('Hello from Acquisitions !');
  res.status(200).send('Hello from Acquisitions !');
});

export default app;
