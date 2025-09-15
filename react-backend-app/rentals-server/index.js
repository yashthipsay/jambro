import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bookingRoutes from './routes/bookingRoutes.js';
import borzoRoutes from './routes/borzoRoutes.js';
import razorpayRoutes from './routes/razorpayRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import connectDB from './db/mongoDriver.js';
import { connectRabbit } from './services/rabbitmq.js';
import { initSocket } from './services/socket.js';
import { startShipmentStatusMonitor } from './services/shipmentStatusMonitor.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/borzo', borzoRoutes);
app.use('/api/razorpay', razorpayRoutes);
const server = http.createServer(app);
const io = initSocket(server); // Initialize socket.io

async function start() {
  await connectDB();
  await connectRabbit();
  startShipmentStatusMonitor(); 
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log('[server] listening on', port));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});