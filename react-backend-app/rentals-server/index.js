import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bookingRoutes from './routes/bookingRoutes.js';
import borzoRoutes from './routes/borzoRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import connectDB from './db/mongoDriver.js';
import { connectRabbit } from './services/rabbitmq.js';
import './services/borzoWebsocket.js'; // initialize WS tracking

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/borzo', borzoRoutes);

const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('track_order', (orderId) => {
    socket.join(`order_${orderId}`);
  });
});

async function start() {
  await connectDB();
  await connectRabbit(); // worker can be a separate process; keep lightweight here
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log('[server] listening on', port));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});