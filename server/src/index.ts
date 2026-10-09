import express from 'express';
import { createServer } from 'http';
import { initSocket } from './lib/socket';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { pitchRouter } from './routes/pitches';
import { lobbyRouter } from './routes/lobbies';
import { banterRouter } from './routes/banter';
import { userRouter } from './routes/users';
import { matchRouter } from './routes/matches';
import { getJwtSecret } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 4000;

// Validate security environment variables on initialization
try {
  getJwtSecret();
} catch (envError: any) {
  console.error('Security configuration error:', envError.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Security middleware
app.use(helmet());

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server) or matching allowed origins
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked request from origin: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Routes
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/pitches', pitchRouter);
app.use('/api/lobbies', lobbyRouter);
app.use('/api/banter', banterRouter);
app.use('/api/users', userRouter);
app.use('/api/matches', matchRouter);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Inside Life server & Socket.IO running on port ${PORT}`);
});

export default app;
