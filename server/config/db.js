// config/db.js
// Mongoose connection with graceful error handling
// Demonstrates: Node.js async patterns, EventEmitter, non-blocking I/O (Lecture 28-30)

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1); // Exit process on connection failure
  }
};

// Mongoose connection events (EventEmitter pattern – Lecture 29)
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});

module.exports = connectDB;
