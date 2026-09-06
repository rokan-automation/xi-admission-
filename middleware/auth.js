const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) return res.redirect('/admin/login');

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.clearCookie('admin_token');
    return res.redirect('/admin/login');
  }
}

module.exports = { requireAdmin };
