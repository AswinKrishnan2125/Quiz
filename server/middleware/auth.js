// D:\React\Quiz\server\middleware\auth.js
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;
console.log('Auth Middleware - JWT_SECRET:', jwtSecret); // From Step 1

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');
  console.log('Auth Middleware - Received Authorization Header:', authHeader); // <--- ADD THIS

  if (!authHeader) {
    console.log('Auth Middleware - No Authorization header found.');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Expects "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');
  console.log('Auth Middleware - Extracted Token:', token); // <--- ADD THIS

  if (!token || token === authHeader) {
    console.log('Auth Middleware - Token extraction failed or token is empty.');
    return res.status(401).json({ msg: 'Invalid token format.' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Auth Middleware - Token Verified. Decoded User:', decoded.user); // <--- ADD THIS
    req.user = decoded.user;
    next();
  } catch (err) {
    console.log('Auth Middleware - Token Verification Failed:', err.message); // <--- ADD THIS
    res.status(401).json({ msg: 'Token is not valid or expired' });
  }
};