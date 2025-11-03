import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import Joi from 'joi';
import { nanoid } from 'nanoid';
import { readJson, writeJson, updateJson, ensureDir } from './fileStorage.js';
import { appendAudit } from './userStore.js';

const CATALOG_DIR = 'catalog';
const MOVIES_FILE = path.join(CATALOG_DIR, 'movies.json');
const CATEGORIES_FILE = path.join(CATALOG_DIR, 'categories.json');
const SERIES_DIR = path.join(CATALOG_DIR, 'series');

const urlRegex = /^https?:\/\//i;
const subtitleSchema = Joi.object({
  lang: Joi.string().required(),
  label: Joi.string().allow('').default(''),
  url: Joi.string().pattern(urlRegex).required()
});

const movieSchema = Joi.object({
  id: Joi.string().default(() => nanoid(10)),
  title: Joi.string().required(),
  synopsis: Joi.string().allow(''),
  year: Joi.number().integer().min(1900).max(2100).required(),
  duration: Joi.number().integer().positive().required(),
  genres: Joi.array().items(Joi.string()).default([]),
  tags: Joi.array().items(Joi.string()).default([]),
  poster: Joi.string().pattern(urlRegex).allow(''),
  heroImage: Joi.string().pattern(urlRegex).allow(''),
  trailerUrl: Joi.string().pattern(urlRegex).allow(''),
  streamUrl: Joi.string().pattern(urlRegex).required(),
  subtitles: Joi.array().items(subtitleSchema).default([]),
  published: Joi.boolean().default(false),
  featured: Joi.boolean().default(false)
});

const categorySchema = Joi.object({
  id: Joi.string().default(() => nanoid(8)),
  name: Joi.string().required(),
  slug: Joi.string().default((_, ctx) =>
    slugify(ctx?.prefs?.context?.name || ctx?.state?.name || ctx?.parent?.name || '', {
      lower: true,
      strict: true
    })
  ),
  order: Joi.number().integer().min(0).default(0)
});

const episodeSchema = Joi.object({
  seriesName: Joi.string().required(),
  season: Joi.number().integer().min(1).required(),
  ep: Joi.number().integer().min(1).required(),
  title: Joi.string().required(),
  synopsis: Joi.string().allow(''),
  poster: Joi.string().pattern(urlRegex).allow(''),
  streamUrl: Joi.string().pattern(urlRegex).required(),
  subtitles: Joi.array().items(subtitleSchema).default([]),
  published: Joi.boolean().default(false),
  duration: Joi.number().integer().positive(),
  tags: Joi.array().items(Joi.string()).default([])
});

async function listMovies() {
  return readJson(MOVIES_FILE, []);
}

async function saveMovies(movies) {
  await writeJson(MOVIES_FILE, movies);
}

async function upsertMovie(actor, movie) {
  const value = await movieSchema.validateAsync(movie, { abortEarly: false });
  const movies = await listMovies();
  const idx = movies.findIndex((m) => m.id === value.id);
  if (idx === -1) {
    movies.push(value);
    await appendAudit(actor, `created movie ${value.title}`);
  } else {
    movies[idx] = { ...movies[idx], ...value };
    await appendAudit(actor, `updated movie ${value.title}`);
  }
  await saveMovies(movies);
  return value;
}

async function deleteMovie(actor, movieId) {
  const movies = await listMovies();
  const idx = movies.findIndex((m) => m.id === movieId);
  if (idx === -1) {
    const error = new Error('Movie not found');
    error.status = 404;
    throw error;
  }
  const [removed] = movies.splice(idx, 1);
  await saveMovies(movies);
  await appendAudit(actor, `deleted movie ${removed.title}`);
  return removed;
}

async function listCategories() {
  return readJson(CATEGORIES_FILE, []);
}

async function saveCategories(categories) {
  await writeJson(CATEGORIES_FILE, categories);
}

async function upsertCategory(actor, category) {
  const value = await categorySchema.validateAsync(category, {
    abortEarly: false,
    context: category
  });
  const categories = await listCategories();
  const idx = categories.findIndex((c) => c.id === value.id || c.slug === value.slug);
  if (idx === -1) {
    categories.push(value);
    await appendAudit(actor, `created category ${value.name}`);
  } else {
    categories[idx] = { ...categories[idx], ...value };
    await appendAudit(actor, `updated category ${value.name}`);
  }
  categories.sort((a, b) => a.order - b.order);
  await saveCategories(categories);
  return value;
}

async function deleteCategory(actor, id) {
  const categories = await listCategories();
  const idx = categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    const error = new Error('Category not found');
    error.status = 404;
    throw error;
  }
  const [removed] = categories.splice(idx, 1);
  await saveCategories(categories);
  await appendAudit(actor, `deleted category ${removed.name}`);
  return removed;
}

async function listSeries() {
  const dirPath = path.join('data', SERIES_DIR);
  await ensureDir(dirPath);
  const files = await fs.promises.readdir(dirPath).catch((err) => {
    if (err.code === 'ENOENT') return [];
    throw err;
  });
  const series = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const data = await readJson(path.join(SERIES_DIR, file), null);
    if (data) series.push(data);
  }
  return series;
}

async function upsertEpisode(actor, payload) {
  const value = await episodeSchema.validateAsync(payload, { abortEarly: false });
  const slug = slugify(value.seriesName, { lower: true, strict: true });
  if (!slug) {
    throw new Error('Invalid series name');
  }
  const fileRelative = path.join(SERIES_DIR, `${slug}.json`);
  const updated = await updateJson(
    fileRelative,
    async (current) => {
      const series = current || {
        id: nanoid(10),
        seriesName: value.seriesName,
        slug,
        synopsis: value.synopsis || '',
        seasons: []
      };
      series.seriesName = value.seriesName;
      if (value.synopsis) {
        series.synopsis = value.synopsis;
      }
      const seasons = series.seasons || [];
      let season = seasons.find((s) => s.season === value.season);
      if (!season) {
        season = { season: value.season, episodes: [] };
        seasons.push(season);
      }
      let episode = season.episodes.find((e) => e.ep === value.ep);
      if (!episode) {
        episode = { ep: value.ep };
        season.episodes.push(episode);
      }
      Object.assign(episode, value);
      season.episodes.sort((a, b) => a.ep - b.ep);
      seasons.sort((a, b) => a.season - b.season);
      series.seasons = seasons;
      return series;
    },
    null
  );
  await appendAudit(actor, `upserted episode ${value.seriesName} S${value.season}E${value.ep}`);
  return updated;
}

async function deleteEpisode(actor, seriesSlug, seasonNumber, episodeNumber) {
  const fileRelative = path.join(SERIES_DIR, `${seriesSlug}.json`);
  const updated = await updateJson(
    fileRelative,
    async (series) => {
      if (!series) {
        const error = new Error('Series not found');
        error.status = 404;
        throw error;
      }
      const seasons = series.seasons || [];
      const season = seasons.find((s) => s.season === seasonNumber);
      if (!season) {
        const error = new Error('Season not found');
        error.status = 404;
        throw error;
      }
      const idx = season.episodes.findIndex((e) => e.ep === episodeNumber);
      if (idx === -1) {
        const error = new Error('Episode not found');
        error.status = 404;
        throw error;
      }
      season.episodes.splice(idx, 1);
      if (!season.episodes.length) {
        const seasonIdx = seasons.indexOf(season);
        seasons.splice(seasonIdx, 1);
      }
      series.seasons = seasons;
      return series;
    },
    null
  );
  await appendAudit(actor, `deleted episode ${seriesSlug} S${seasonNumber}E${episodeNumber}`);
  return updated;
}

export {
  listMovies,
  upsertMovie,
  deleteMovie,
  listCategories,
  upsertCategory,
  deleteCategory,
  listSeries,
  upsertEpisode,
  deleteEpisode
};
