import { Server } from 'socket.io';

let io: Server;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Permit vercel, localhost, and configured clients
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a pitch-specific room (for Banter and Lobbies)
    socket.on('join_pitch', (pitchId: string) => {
      socket.join(`pitch:${pitchId}`);
      console.log(`User ${socket.id} joined pitch:${pitchId}`);
    });

    // Join a school-specific room (for N1P alerts)
    socket.on('join_school', (schoolId: string) => {
      socket.join(`school:${schoolId}`);
      console.log(`User ${socket.id} joined school:${schoolId}`);
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
