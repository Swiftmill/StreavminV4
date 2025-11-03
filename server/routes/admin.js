import express from 'express';
import csrf from 'csurf';
import {
  upsertMovie,
  deleteMovie,
  upsertCategory,
  deleteCategory,
  upsertEpisode,
  deleteEpisode,
  listMovies,
  listCategories,
  listSeries
} from '../lib/catalogStore.js';
import {
  listUsers,
  createUser,
  updateUser
} from '../lib/userStore.js';
import { requireRole, requireAuth } from '../middleware/auth.js';

const router = express.Router();
const csrfProtection = csrf({ cookie: false });

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', async (req, res) => {
  const [movies, categories, series, users] = await Promise.all([
    listMovies(),
    listCategories(),
    listSeries(),
    listUsers()
  ]);
  const safeUsers = users.map(({ passHash, ...rest }) => rest);
  res.json({ movies, categories, series, users: safeUsers });
});

router.post('/categories', express.json(), csrfProtection, async (req, res, next) => {
  try {
    const category = await upsertCategory(req.session.user.username, req.body);
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete('/categories/:id', csrfProtection, async (req, res, next) => {
  try {
    const removed = await deleteCategory(req.session.user.username, req.params.id);
    res.json(removed);
  } catch (err) {
    next(err);
  }
});

router.post('/movies', express.json({ limit: '2mb' }), csrfProtection, async (req, res, next) => {
  try {
    const movie = await upsertMovie(req.session.user.username, req.body);
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

router.delete('/movies/:id', csrfProtection, async (req, res, next) => {
  try {
    const removed = await deleteMovie(req.session.user.username, req.params.id);
    res.json(removed);
  } catch (err) {
    next(err);
  }
});

router.post('/series/episodes', express.json({ limit: '2mb' }), csrfProtection, async (req, res, next) => {
  try {
    const series = await upsertEpisode(req.session.user.username, req.body);
    res.json(series);
  } catch (err) {
    next(err);
  }
});

router.delete('/series/:slug/seasons/:season/episodes/:ep', csrfProtection, async (req, res, next) => {
  try {
    const { slug, season, ep } = req.params;
    const updated = await deleteEpisode(
      req.session.user.username,
      slug,
      Number(season),
      Number(ep)
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res) => {
  const users = await listUsers();
  res.json(users.map(({ passHash, ...rest }) => rest));
});

router.post('/users', express.json(), csrfProtection, async (req, res, next) => {
  try {
    const user = await createUser(req.session.user.username, req.body);
    const { passHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

router.put('/users/:username', express.json(), csrfProtection, async (req, res, next) => {
  try {
    const user = await updateUser(req.session.user.username, req.params.username, req.body);
    const { passHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

export default router;
