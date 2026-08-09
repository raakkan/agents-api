module.exports = (req, res, next) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    // Self-hosted mode, no auth required
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== apiKey) {
    return res.status(403).json({ success: false, error: 'Invalid API key' });
  }

  next();
};
