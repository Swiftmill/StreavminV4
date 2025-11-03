export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.session?.user || req.session.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

export function attachUser(req, res, next) {
  res.locals.user = req.session?.user || null;
  next();
}
