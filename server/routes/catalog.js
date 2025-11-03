import express from 'express';
import { listMovies, listCategories, listSeries } from '../lib/catalogStore.js';

const router = express.Router();

router.get('/catalog', async (req, res) => {
  const [categories, movies, series] = await Promise.all([
    listCategories(),
    listMovies(),
    listSeries()
  ]);
  res.json({ categories, movies, series });
});

export default router;
