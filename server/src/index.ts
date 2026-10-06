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

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '500kb' }));
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
