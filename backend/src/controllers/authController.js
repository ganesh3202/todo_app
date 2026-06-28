const jwt     = require('jsonwebtoken');
const { User } = require('../models');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

const safeUser = (u) => ({
  id:    u.id,
  name:  u.name,
  email: u.email,
  role:  u.role,
  avatar: u.avatar,
  bio:   u.bio,
  theme: u.theme
});

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });

    const exists = await User.findOne({ where: { email: email.toLowerCase() } });
    if (exists)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user  = await User.create({ name, email: email.toLowerCase(), password });
    const token = generateToken(user.id);

    res.status(201).json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    // Explicitly include password for comparison
    const user = await User.findOne({
      where: { email: email.toLowerCase(), isActive: true },
      attributes: { include: ['password'] }
    });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user.id);
    res.json({ success: true, token, user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, theme, avatar } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.update({ name, bio, theme, avatar });
    res.json({ success: true, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findOne({
      where: { id: req.user.id },
      attributes: { include: ['password'] }
    });

    const match = await user.comparePassword(currentPassword);
    if (!match)
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    await user.update({ password: newPassword });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
