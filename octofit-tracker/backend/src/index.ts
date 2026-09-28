import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { connectDatabase } from './config/database';
import apiRouter from './routes';

const app = express();
const port = Number(process.env.PORT) || 8000;

const allowedOrigins = new Set([
  process.env.CORS_ORIGIN,
  process.env.CODESPACE_NAME
    ? `https://${process.env.CODESPACE_NAME}-5173.app.github.dev`
    : 'http://localhost:5173',
].filter((origin): origin is string => Boolean(origin)));

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('This origin is not allowed.'));
  },
}));
app.use(express.json());

app.use('/api', apiRouter);

const handleApiError: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error?.code === 11000) {
    response.status(409).json({ message: 'That value is already in use.' });
    return;
  }
  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    response.status(400).json({ message: 'Some submitted details are not valid.' });
    return;
  }
  console.error('API request failed:', error);
  response.status(500).json({ message: 'Something went wrong. Please try again.' });
};

app.use(handleApiError);

connectDatabase()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`OctoFit API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error);
    process.exit(1);
  });