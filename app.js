require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const gateRoutes = require('./routes/gateRoutes');
const { requireGate } = require('./middleware/gateAuth');

const app = express();
app.use(compression());
app.use((req, res, next) => {
  res.setHeader('Content-Language', 'en');
  next();
});
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/public', express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  etag: true,
}));

// সাইটে ঢোকার গেট (শেয়ারড ইমেইল/পাসওয়ার্ড) — /login, /logout এখানে, বাকি সব স্টুডেন্ট রুট এর আগে requireGate
app.use('/', gateRoutes);
app.use('/', requireGate, studentRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('404');
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Server চলছে: http://localhost:${PORT}`));
}

module.exports = app;