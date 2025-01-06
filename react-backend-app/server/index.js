const express = require('express');
const bodyParser = require('body-parser');
const {createServer} = require('http');
const {Server} = require('socket.io');
const cors = require('cors');
const neo4jDriver = require('./db/neo4jDriver');  // Import the neo4jDriver module
const { startApolloServer } = require('./db/neo4jDriver');   // Import the calldB function
const connectDB = require('./db/mongoDriver');  // Import the connectDB function
const userRoutes = require('./routes/userRoutes');
const jamRoomRoutes = require('./routes/jamRoomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const Booking = require('./models/BookingSchema');
const User = require('./models/User');
const app = express();
const PORT = 5000;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/jamrooms', jamRoomRoutes);
app.use('/api/bookings', bookingRoutes);

// Function to call the database
const callDatabase = async () => {
  await startApolloServer();  // Calling the calldB function from neo4jDriver
  await connectDB(); // Connect to MongoDB
};

// Call the database when the server starts
callDatabase();

// Socket.io connection
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('getBookings', async (jamRoomId) => {
    try {
      const bookings = await Booking.find({ jamRoom: jamRoomId });
      socket.emit('bookings', bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
