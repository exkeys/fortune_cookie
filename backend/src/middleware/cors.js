import cors from 'cors';
import { config } from '../config/index.js';

export const corsMiddleware = cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
});
