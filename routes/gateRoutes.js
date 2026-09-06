const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/login', (req, res) => {
  res.render('gate-login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.GATE_USERNAME && password === process.env.GATE_PASSWORD) {
    const token = jwt.sign({ role: 'visitor' }, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.cookie('gate_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 60 * 60 * 1000,
    });
    return res.redirect('/');
  }

  res.render('gate-login', { error: 'Invalid username or password' });
});

router.get('/logout', (req, res) => {
  res.clearCookie('gate_token');
  res.redirect('/login');
});

module.exports = router;