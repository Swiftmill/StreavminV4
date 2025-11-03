import express from 'express';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import { authenticate, appendAudit } from '../lib/userStore.js';

const router = express.Router();
const csrfProtection = csrf({ cookie: false });

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/session', (req, res) => {
  res.json({ user: req.session.user || null });
});

router.get('/csrf', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

router.post('/login', limiter, express.json(), csrfProtection, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = await authenticate(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.user = { username: user.username, role: user.role };
  await appendAudit(user.username, 'login');
  res.json({ user: req.session.user });
});

router.post('/logout', limiter, csrfProtection, async (req, res, next) => {
  try {
    const username = req.session?.user?.username;
    await new Promise((resolve) => {
      req.session.destroy(resolve);
    });
    if (username) {
      await appendAudit(username, 'logout');
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
