require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const authRoutes = require('./auth');
const apiRoutes = require('./api');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet()); // Sets various HTTP headers for security

// Logging
app.use(morgan('combined')); // Log HTTP requests

// Body and Cookie parsers
app.use(express.json());
app.use(cookieParser());

// CORS configuration (allow frontend to connect and send cookies)
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('AgroBuddy Backend is running securely.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
