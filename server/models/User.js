// models/User.js
// Mongoose User schema and model
// Demonstrates: Mongoose schemas, validation, indexes (Lecture 43-44)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,               // Creates a unique index in MongoDB
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,              // Never returned in queries by default
    },
  },
  {
    timestamps: true,             // Adds createdAt and updatedAt automatically
  }
);

// Instance method: compare entered password with stored hash
// bcryptjs – Lecture 46
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Transform output: never expose passwordHash or __v in JSON responses
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
