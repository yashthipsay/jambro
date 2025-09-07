import { Server } from 'socket.io';
let io;

export function initSocket(server) {
  io = new Server(server, { cors: { origin: '*' } });
  
  io.on('connection', (socket) => {
    console.log('socket connected', socket.id);
    socket.on('track_order', (orderId) => {
      socket.join(`order_${orderId}`);
    });
  });

  return io;
}

export function emitToClient(clientId, { type, data }) {
  if (!io) return;
  io.to(clientId).emit(type, data);
}

export function getIO() {
  return io;
}