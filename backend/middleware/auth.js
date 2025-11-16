const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
