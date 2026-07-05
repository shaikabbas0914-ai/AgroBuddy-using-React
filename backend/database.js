const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('WARNING: MONGODB_URI environment variable is not defined. Please define it in your environment or .env file.');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB database successfully.');
    })
    .catch((err) => {
      console.error('Error connecting to MongoDB:', err.message);
    });
}

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Number, // Storing timestamp as number to match previous design (Date.now() + 3600000)
    default: null
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
