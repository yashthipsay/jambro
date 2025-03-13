const express = require("express");
const bodyParser = require("body-parser");
const { createServer } = require("http");
const helmet = require("helmet");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./db/mongoDriver"); // Import the connectDB function
const userRoutes = require("./routes/userRoutes");
const jamRoomRoutes = require("./routes/jamRoomRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const bnkVerification = require("./routes/bnkVerification");
const payoutRoutes = require("./routes/payoutRoutes");
const subscriptionRoutes = require('./routes/subscriptions/subscriptionRoutes');
const authRoutes = require("./routes/authRoutes");
const createReservationRouter = require("./routes/reservationRoutes");
const Booking = require("./models/BookingSchema");
const User = require("./models/User");
const SessionMonitor = require("./services/sessionMonitor");
const PayoutMonitor = require("./services/PayoutMonitor");
const rabbitmqService = require("./services/rabbitmqService");
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const server = createServer(app);
const spotifyRoutes = require("./routes/spotifyRoutes");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(helmet());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/jamrooms", jamRoomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/bank-verification", bnkVerification);
app.use("/api/payouts", payoutRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/reservations', createReservationRouter(io));
app.use("/proxy", async (req, res) => {
  console.log("start");
  const { lat, lon, apiKey } = req.query;
  const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lon}&api_key=${apiKey}`;
  const response = await fetch(url, {
    headers: {
      "X-Request-Id": "a623e8cd-bcd5-4d9a-beb3-ea7df3f5092e",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await response.json();
  console.log("Reverse geocoding response:", data);
  res.set("Access-Control-Allow-Origin", "*");
  res.json(data);
});

// Function to call the database
const callDatabase = async () => {
  await connectDB(); // Connect to MongoDB
};

// Initialize RabbitMQ before starting the server
async function startServer() {
  try {
    await rabbitmqService.connect();

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Call the database when the server starts
callDatabase();

// Socket.io connection
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("getBookings", async (jamRoomId) => {
    try {
      const bookings = await Booking.find({ jamRoom: jamRoomId });
      socket.emit("bookings", bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// Start the server
startServer();

// After your socket.io setup
const sessionMonitor = new SessionMonitor(io);
sessionMonitor.start();

const payoutMonitor = new PayoutMonitor(io);
payoutMonitor.start();

// Start the Express server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
