const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // Step 1 — Check if Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    // Step 2 — Extract token from header
    // Header format: "Bearer eyJhbGciOiJIUzI1NiIs..."
    const token = authHeader.split(' ')[1];

    // Step 3 — Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 4 — Find user from token's id
    // We exclude password using select('-password')
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Step 5 — Pass control to the next function
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(500).json({ message: 'Server error in auth middleware' });
  }
};

module.exports = { protect };