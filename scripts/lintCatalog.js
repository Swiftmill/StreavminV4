import { listMovies, listCategories, listSeries } from '../server/lib/catalogStore.js';

(async () => {
  try {
    const [categories, movies, series] = await Promise.all([
      listCategories(),
      listMovies(),
      listSeries()
    ]);
    if (!Array.isArray(categories) || !Array.isArray(movies)) {
      throw new Error('Catalog files malformed');
    }
    for (const serie of series) {
      if (!serie.slug || !Array.isArray(serie.seasons)) {
        throw new Error(`Invalid series file: ${serie?.slug}`);
      }
    }
    console.log('Catalog looks good.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
