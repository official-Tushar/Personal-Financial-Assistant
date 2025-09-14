import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function setAuthCookie(res, token) {
  const isSecure = String(process.env.COOKIE_SECURE).toLowerCase() === 'true' || process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecure,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

