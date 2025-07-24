// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // Ensures no two users can have the same email
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// --- Mongoose Middleware: Hash password before saving ---
// This runs before a user document is saved to the database
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) { // Only hash if the password has been modified (or is new)
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10); // Generate a salt (cost factor 10)
    this.password = await bcrypt.hash(this.password, salt); // Hash the password
    next();
  } catch (error) {
    next(error); // Pass any error to the next middleware/errorHandler
  }
});

// --- Mongoose Method: Compare password for login ---
// This is a custom method added to the User model instance
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);