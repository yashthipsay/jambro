import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (typeof uri !== 'string' || uri.trim() === '') {
    throw new Error('Environment variable MONGODB_URI must be set and non-empty');
  }

  if (mongoose.connection.readyState === 1) {
    console.log('[rentals-server] MongoDB already connected');
    return;
  }

  await mongoose.connect(uri, {
    autoIndex: true
  });
  console.log('[rentals-server] MongoDB connected to', uri);
}