const jwt = require('jsonwebtoken');

function requireGate(req, res, next) {
  const token = req.cookies.gate_token;
  if (!token) return res.redirect('/login');

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.clearCookie('gate_token');
    return res.redirect('/login');
  }
}

module.exports = { requireGate };
