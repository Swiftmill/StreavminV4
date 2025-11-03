import express from 'express';
import session from 'express-session';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { bootstrap as bootstrapUsers } from './server/lib/userStore.js';
import authRoutes from './server/routes/auth.js';
import adminRoutes from './server/routes/admin.js';
import catalogRoutes from './server/routes/catalog.js';
import { attachUser } from './server/middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

await bootstrapUsers();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(
  cors({
    origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'streavmin-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use(attachUser);

app.use('/api', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/admin', adminRoutes);

app.use('/data/images', express.static(path.join(__dirname, 'data', 'images')));

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  if (err.isJoi) {
    return res.status(400).json({
      error: err.details?.map((d) => d.message).join(', ') || err.message
    });
  }
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Server error' });
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
