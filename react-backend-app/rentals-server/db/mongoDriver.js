import mongoose from 'mongoose';

export default async function connectDB() {
  try {
    await mongoose.connect("mongodb+srv://ythipsay:2ChUNuXD94tFmZis@jambro.fhlfx.mongodb.net/?retryWrites=true&w=majority&appName=jambro", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}