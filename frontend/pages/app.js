import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '../components/Layout';
import HeroBanner from '../components/HeroBanner';
import Carousel from '../components/Carousel';
import VideoPlayer from '../components/VideoPlayer';
import { apiFetch } from '../lib/api';

const fetcher = (url) => apiFetch(url).then((res) => res.json());

function useSession() {
  const { data, mutate } = useSWR('/api/session', fetcher);
  return {
    user: data?.user,
    mutate
  };
}

export default function AppPage() {
  const router = useRouter();
  const { user, mutate } = useSession();
  const { data } = useSWR(user ? '/api/catalog' : null, fetcher, { refreshInterval: 60000 });
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`streavmin-history-${user.username}`);
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, [user]);

  const updateHistory = useCallback(
    (item) => {
      if (!user) return;
      setHistory((prev) => {
        const next = [item, ...prev.filter((entry) => entry.id !== item.id)].slice(0, 12);
        localStorage.setItem(`streavmin-history-${user.username}`, JSON.stringify(next));
        return next;
      });
    },
    [user]
  );

  const handleSelect = useCallback(
    (item) => {
      setSelected(item);
      updateHistory({
        id: item.id || `${item.seriesName}-${item.season}-${item.ep}`,
        title: item.title || `${item.seriesName} S${item.season}E${item.ep}`,
        poster: item.poster,
        streamUrl: item.streamUrl,
        subtitles: item.subtitles
      });
    },
    [updateHistory]
  );

  const handleLogout = async () => {
    const res = await apiFetch('/api/logout', {
      method: 'POST',
      headers: {
        'csrf-token': (await fetcher('/api/csrf')).csrfToken
      }
    });
    if (res.ok) {
      await mutate();
      router.replace('/login');
    }
  };

  const featuredMovie = useMemo(() => data?.movies?.find((m) => m.featured) || data?.movies?.[0], [data]);

  const categories = useMemo(() => {
    if (!data) return [];
    return data.categories.map((category) => ({
      ...category,
      items: data.movies.filter(
        (movie) =>
          movie.published &&
          (movie.tags?.includes(category.slug) ||
            movie.genres?.some((genre) => genre.toLowerCase().includes(category.slug)))
      )
    }));
  }, [data]);

  const seriesCarousels = useMemo(() => {
    if (!data) return [];
    return data.series.map((serie) => ({
      id: serie.id,
      title: serie.seriesName,
      items: serie.seasons.flatMap((season) =>
        season.episodes
          .filter((episode) => episode.published !== false)
          .map((episode) => ({
            ...episode,
            id: `${serie.slug}-s${season.season}-e${episode.ep}`,
            poster: episode.poster || serie.heroImage,
            title: `${serie.seriesName} S${season.season}E${episode.ep}`
          }))
      )
    }));
  }, [data]);

  const filteredMovies = useMemo(() => {
    if (!data) return [];
    return data.movies.filter((movie) => {
      if (!movie.published) return false;
      if (filterType !== 'all' && filterType !== 'movie') return false;
      if (query && !`${movie.title} ${movie.synopsis}`.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      if (filterGenre && !movie.genres.some((genre) => genre.toLowerCase().includes(filterGenre.toLowerCase()))) {
        return false;
      }
      if (filterYear && Number(filterYear) !== Number(movie.year)) {
        return false;
      }
      return true;
    });
  }, [data, filterGenre, filterType, filterYear, query]);

  const filteredSeries = useMemo(() => {
    if (!data) return [];
    return data.series.filter((serie) => {
      if (filterType !== 'all' && filterType !== 'series') return false;
      if (query && !`${serie.seriesName} ${serie.synopsis}`.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      if (filterGenre) {
        const hasGenre = serie.seasons.some((season) =>
          season.episodes.some((episode) => episode.tags?.some((tag) => tag.toLowerCase().includes(filterGenre.toLowerCase())))
        );
        if (!hasGenre) return false;
      }
      return true;
    });
  }, [data, filterGenre, filterType, query]);

  const seriesSearchItems = useMemo(() => {
    return filteredSeries
      .map((serie) => {
        const allEpisodes = serie.seasons.flatMap((season) =>
          season.episodes.map((episode) => ({ season: season.season, ...episode }))
        );
        const firstPublished = allEpisodes.find((episode) => episode.published !== false);
        if (!firstPublished) {
          return null;
        }
        return {
          ...firstPublished,
          id: `${serie.slug}-search-${firstPublished.ep}`,
          title: serie.seriesName,
          seriesName: serie.seriesName
        };
      })
      .filter(Boolean);
  }, [filteredSeries]);

  const showSearchResults = query || filterGenre || filterYear || filterType !== 'all';

  if (!user) {
    return null;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <section
        style={{
          marginBottom: '2rem',
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          background: 'rgba(255,255,255,0.04)',
          padding: '1.5rem',
          borderRadius: '16px'
        }}
      >
        <div style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>Recherche</h2>
          <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>
            Filtrez le catalogue par titre, genre, année ou type de contenu.
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un titre..."
          style={{ padding: '0.75rem 1rem', borderRadius: '999px', border: 'none', background: 'rgba(0,0,0,0.35)', color: 'white' }}
        />
        <input
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
          placeholder="Genre (ex: action)"
          style={{ padding: '0.75rem 1rem', borderRadius: '999px', border: 'none', background: 'rgba(0,0,0,0.35)', color: 'white' }}
        />
        <input
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          placeholder="Année"
          type="number"
          min="1900"
          max="2100"
          style={{ padding: '0.75rem 1rem', borderRadius: '999px', border: 'none', background: 'rgba(0,0,0,0.35)', color: 'white' }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '0.75rem 1rem', borderRadius: '999px', border: 'none', background: 'rgba(0,0,0,0.35)', color: 'white' }}
        >
          <option value="all">Films & séries</option>
          <option value="movie">Films uniquement</option>
          <option value="series">Séries uniquement</option>
        </select>
      </section>

      {showSearchResults ? (
        <>
          <Carousel title="Films trouvés" items={filteredMovies} onSelect={handleSelect} />
          <Carousel title="Séries trouvées" items={seriesSearchItems} onSelect={handleSelect} />
        </>
      ) : null}

      <HeroBanner item={featuredMovie} onPlay={handleSelect} />
      {history.length > 0 && (
        <Carousel title="Continuer la lecture" items={history} onSelect={handleSelect} />
      )}
      {categories.filter((category) => category.items.length).map((category) => (
        <Carousel key={category.id} title={category.name} items={category.items} onSelect={handleSelect} />
      ))}
      {seriesCarousels.map((serie) => (
        <Carousel key={serie.id} title={serie.title} items={serie.items} onSelect={handleSelect} />
      ))}
      <VideoPlayer media={selected} onClose={() => setSelected(null)} />
    </Layout>
  );
}
