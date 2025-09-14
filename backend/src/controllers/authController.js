import jwt from 'jsonwebtoken';
import validator from 'validator';
import { User } from '../models/User.js';
import { setAuthCookie } from '../middleware/auth.js';
import { sanitizeString } from '../utils/sanitize.js';
import { validateLoginInput, validateRegisterInput } from '../utils/validators.js';

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    const errors = validateRegisterInput({ name, email, password });
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    const cleanName = sanitizeString(name);
    const cleanEmail = String(email).toLowerCase().trim();

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({ name: cleanName, email: cleanEmail, password });

    const token = signToken(user._id);
    setAuthCookie(res, token);

    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const errors = validateLoginInput({ email, password });
    if (errors.length) return res.status(400).json({ message: errors.join(', ') });

    const cleanEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(user._id);
    setAuthCookie(res, token);

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const isSecure = String(process.env.COOKIE_SECURE).toLowerCase() === 'true' || process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      expires: new Date(0),
    });
    return res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    next(err);
  }
}

