import 'dotenv/config';  // Add this to load environment variables
import { startBorzoTracker } from "../services/borzoTracker.js";
import { connectRabbit } from "../services/rabbitmq.js";
import connectDB from "../db/mongoDriver.js";

async function start() {
  await connectDB();
  await connectRabbit();
  await startBorzoTracker();
}

start().catch(err => {
  console.error("Borzo tracker worker failed:", err);
  process.exit(1);
});