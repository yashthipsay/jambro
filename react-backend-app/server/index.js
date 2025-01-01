const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const neo4jDriver = require('./db/neo4jDriver');  // Import the neo4jDriver module
const { startApolloServer } = require('./db/neo4jDriver');   // Import the calldB function

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Function to call the database
const callDatabase = async () => {
  await startApolloServer();  // Calling the calldB function from neo4jDriver
};

// Call the database when the server starts
callDatabase();

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
