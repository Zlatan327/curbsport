import { Server } from 'socket.io';

let io: Server;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a pitch-specific room (for Banter and Lobbies)
    socket.on('join_pitch', (pitchId: string) => {
      socket.join(`pitch:${pitchId}`);
      console.log(`User ${socket.id} joined pitch:${pitchId}`);
    });

    // Join a city-specific room (for N1P alerts)
    socket.on('join_city', (cityId: string) => {
      socket.join(`city:${cityId}`);
      console.log(`User ${socket.id} joined city:${cityId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}
