import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Layout from '../components/Layout';
import { apiFetch } from '../lib/api';

const fetcher = (url) => apiFetch(url).then((res) => res.json());

async function getCsrf() {
  const res = await apiFetch('/api/csrf');
  const data = await res.json();
  return data.csrfToken;
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session } = useSWR('/api/session', fetcher);
  const { data, mutate } = useSWR(session?.user?.role === 'admin' ? '/api/admin/dashboard' : null, fetcher);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session && session.user?.role !== 'admin') {
      router.replace('/app');
    }
  }, [session, router]);

  const handleSubmit = async (url, payload, method = 'POST') => {
    setMessage('');
    const csrfToken = await getCsrf();
    const res = await apiFetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'csrf-token': csrfToken
      },
      body: payload ? JSON.stringify(payload) : undefined
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(body.error || 'Action impossible');
    } else {
      setMessage('Action réalisée.');
      await mutate();
    }
  };

  const categories = data?.categories || [];
  const movies = data?.movies || [];
  const series = data?.series || [];
  const users = data?.users || [];

  const [categoryForm, setCategoryForm] = useState({ name: '', order: 0 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [movieForm, setMovieForm] = useState({
    title: '',
    synopsis: '',
    year: 2023,
    duration: 120,
    genres: '',
    tags: '',
    poster: '',
    heroImage: '',
    streamUrl: '',
    subtitles: '[]',
    published: true
  });
  const [episodeForm, setEpisodeForm] = useState({
    seriesName: '',
    season: 1,
    ep: 1,
    title: '',
    synopsis: '',
    streamUrl: '',
    poster: '',
    duration: '',
    tags: '',
    subtitles: '[]',
    published: true
  });
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'user' });

  const handleCategory = (event) => {
    event.preventDefault();
    handleSubmit('/api/admin/categories', {
      ...categoryForm,
      order: Number(categoryForm.order)
    });
    setCategoryForm({ name: '', order: 0 });
    setEditingCategory(null);
  };

  const handleMovie = (event) => {
    event.preventDefault();
    const {
      subtitles: subtitlesInput,
      genres: genresInput,
      tags: tagsInput,
      ...moviePayload
    } = movieForm;
    let subtitles = [];
    if (subtitlesInput.trim()) {
      try {
        subtitles = JSON.parse(subtitlesInput);
      } catch (err) {
        setMessage('Format de sous-titres invalide (JSON attendu).');
        return;
      }
    }
    handleSubmit('/api/admin/movies', {
      ...moviePayload,
      subtitles,
      year: Number(moviePayload.year),
      duration: Number(moviePayload.duration),
      genres: genresInput.split(',').map((s) => s.trim()).filter(Boolean),
      tags: tagsInput.split(',').map((s) => s.trim()).filter(Boolean)
    });
  };

  const handleEpisode = (event) => {
    event.preventDefault();
    const {
      subtitles: subtitlesInput,
      tags: tagsInput,
      duration: durationInput,
      ...episodePayload
    } = episodeForm;
    let subtitles = [];
    if (subtitlesInput.trim()) {
      try {
        subtitles = JSON.parse(subtitlesInput);
      } catch (err) {
        setMessage('Format de sous-titres invalide (JSON attendu).');
        return;
      }
    }
    handleSubmit('/api/admin/series/episodes', {
      ...episodePayload,
      subtitles,
      tags: tagsInput.split(',').map((s) => s.trim()).filter(Boolean),
      duration: durationInput ? Number(durationInput) : undefined,
      season: Number(episodePayload.season),
      ep: Number(episodePayload.ep)
    });
  };

  const handleUser = (event) => {
    event.preventDefault();
    handleSubmit('/api/admin/users', userForm);
    setUserForm({ username: '', password: '', role: 'user' });
  };

  const disableUser = (username, disabled) => {
    handleSubmit(`/api/admin/users/${username}`, { disabled }, 'PUT');
  };

  const inputStyle = {
    width: '100%',
    marginBottom: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: '999px',
    border: 'none',
    background: 'rgba(0,0,0,0.35)',
    color: 'white'
  };

  const textareaStyle = {
    width: '100%',
    marginBottom: '0.5rem',
    minHeight: '90px',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    border: 'none',
    background: 'rgba(0,0,0,0.35)',
    color: 'white'
  };

  if (!session?.user) return null;

  return (
    <Layout user={session.user} onLogout={async () => {
      const csrfToken = await getCsrf();
      await apiFetch('/api/logout', { method: 'POST', headers: { 'csrf-token': csrfToken } });
      router.replace('/login');
    }}>
      <h1 style={{ fontSize: '2rem' }}>Administration</h1>
      {message && <p style={{ color: '#6cf' }}>{message}</p>}
      <section style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <form onSubmit={handleCategory} style={{ background: 'rgba(255,255,255,0.04)', padding: '1.5rem', borderRadius: '16px' }}>
          <h2>Catégories</h2>
          <input placeholder="Nom" value={categoryForm.name} onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))} required style={inputStyle} />
          <input type="number" placeholder="Ordre" value={categoryForm.order} onChange={(e) => setCategoryForm((f) => ({ ...f, order: e.target.value }))} style={inputStyle} />
          <button type="submit">{editingCategory ? 'Mettre à jour' : 'Enregistrer'}</button>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categories.map((category) => (
              <div key={category.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                <div>
                  <strong>{category.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Ordre {category.order}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryForm({ name: category.name, order: category.order, id: category.id, slug: category.slug });
                      setEditingCategory(category.id);
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(`/api/admin/categories/${category.id}`, null, 'DELETE')}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form onSubmit={handleMovie} style={{ background: 'rgba(255,255,255,0.04)', padding: '1.5rem', borderRadius: '16px' }}>
          <h2>Film</h2>
          <input
            placeholder="Titre"
            value={movieForm.title}
            onChange={(e) => setMovieForm((f) => ({ ...f, title: e.target.value }))}
            required
            style={inputStyle}
          />
          <textarea
            placeholder="Synopsis"
            value={movieForm.synopsis}
            onChange={(e) => setMovieForm((f) => ({ ...f, synopsis: e.target.value }))}
            style={textareaStyle}
          />
          <input
            placeholder="Poster"
            value={movieForm.poster}
            onChange={(e) => setMovieForm((f) => ({ ...f, poster: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Hero Image"
            value={movieForm.heroImage}
            onChange={(e) => setMovieForm((f) => ({ ...f, heroImage: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="URL Stream"
            value={movieForm.streamUrl}
            onChange={(e) => setMovieForm((f) => ({ ...f, streamUrl: e.target.value }))}
            required
            style={inputStyle}
          />
          <input type="number" placeholder="Année" value={movieForm.year} onChange={(e) => setMovieForm((f) => ({ ...f, year: e.target.value }))} style={inputStyle} />
          <input type="number" placeholder="Durée" value={movieForm.duration} onChange={(e) => setMovieForm((f) => ({ ...f, duration: e.target.value }))} style={inputStyle} />
          <input placeholder="Genres (séparés par ,)" value={movieForm.genres} onChange={(e) => setMovieForm((f) => ({ ...f, genres: e.target.value }))} style={inputStyle} />
          <input placeholder="Tags (séparés par ,)" value={movieForm.tags} onChange={(e) => setMovieForm((f) => ({ ...f, tags: e.target.value }))} style={inputStyle} />
          <textarea
            placeholder='Sous-titres JSON (ex: [{"lang":"fr","label":"Fr","url":"..."}])'
            value={movieForm.subtitles}
            onChange={(e) => setMovieForm((f) => ({ ...f, subtitles: e.target.value }))}
            style={{ ...textareaStyle, minHeight: '80px' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input type="checkbox" checked={movieForm.published} onChange={(e) => setMovieForm((f) => ({ ...f, published: e.target.checked }))} />
            Publié
          </label>
          <button type="submit">Enregistrer</button>
        </form>

        <form onSubmit={handleEpisode} style={{ background: 'rgba(255,255,255,0.04)', padding: '1.5rem', borderRadius: '16px' }}>
          <h2>Épisode</h2>
          <input
            placeholder="Nom de la série"
            value={episodeForm.seriesName}
            onChange={(e) => setEpisodeForm((f) => ({ ...f, seriesName: e.target.value }))}
            required
            style={inputStyle}
          />
          <input
            placeholder="Titre"
            value={episodeForm.title}
            onChange={(e) => setEpisodeForm((f) => ({ ...f, title: e.target.value }))}
            required
            style={inputStyle}
          />
          <textarea
            placeholder="Synopsis"
            value={episodeForm.synopsis}
            onChange={(e) => setEpisodeForm((f) => ({ ...f, synopsis: e.target.value }))}
            style={{ ...textareaStyle, minHeight: '80px' }}
          />
          <input
            placeholder="URL Stream"
            value={episodeForm.streamUrl}
            onChange={(e) => setEpisodeForm((f) => ({ ...f, streamUrl: e.target.value }))}
            required
            style={inputStyle}
          />
          <input
            placeholder="Poster"
            value={episodeForm.poster}
            onChange={(e) => setEpisodeForm((f) => ({ ...f, poster: e.target.value }))}
            style={inputStyle}
          />
          <input type="number" placeholder="Saison" value={episodeForm.season} onChange={(e) => setEpisodeForm((f) => ({ ...f, season: e.target.value }))} style={inputStyle} />
          <input type="number" placeholder="Épisode" value={episodeForm.ep} onChange={(e) => setEpisodeForm((f) => ({ ...f, ep: e.target.value }))} style={inputStyle} />
          <input
            type="number"
            placeholder="Durée (minutes)"
            value={episodeForm.duration}
            onChange={(e) => setEpisodeForm((f) => ({ ...f, duration: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="Tags (séparés par ,)"
            value={episodeForm.tags}
            onChange={(e) => setEpisodeForm((f) => ({ ...f, tags: e.target.value }))}
            style={inputStyle}
          />
          <textarea
            placeholder='Sous-titres JSON (ex: [{"lang":"fr","label":"Fr","url":"..."}])'
            value={episodeForm.subtitles}
            onChange={(e) => setEpisodeForm((f) => ({ ...f, subtitles: e.target.value }))}
            style={{ ...textareaStyle, minHeight: '80px' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input type="checkbox" checked={episodeForm.published} onChange={(e) => setEpisodeForm((f) => ({ ...f, published: e.target.checked }))} />
            Publié
          </label>
          <button type="submit">Enregistrer</button>
        </form>

        <form onSubmit={handleUser} style={{ background: 'rgba(255,255,255,0.04)', padding: '1.5rem', borderRadius: '16px' }}>
          <h2>Utilisateur</h2>
          <input placeholder="Identifiant" value={userForm.username} onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))} required style={inputStyle} />
          <input type="password" placeholder="Mot de passe" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} required style={inputStyle} />
          <select value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))} style={inputStyle}>
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
          <button type="submit">Créer</button>
        </form>
      </section>

      <section style={{ marginTop: '3rem' }}>
        <h2>Catalogue</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {movies.map((movie) => (
            <article key={movie.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '12px', minWidth: '240px' }}>
              <h3>{movie.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#bbb' }}>{movie.synopsis}</p>
              <button onClick={() => handleSubmit(`/api/admin/movies/${movie.id}`, null, 'DELETE')}>Supprimer</button>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '3rem' }}>
        <h2>Séries</h2>
        {series.map((serie) => (
          <div key={serie.id} style={{ marginBottom: '1.5rem' }}>
            <h3>{serie.seriesName}</h3>
            {serie.seasons.map((season) => (
              <div key={season.season} style={{ marginLeft: '1rem' }}>
                <strong>Saison {season.season}</strong>
                <ul>
                  {season.episodes.map((episode) => (
                    <li key={episode.ep}>
                      {episode.title}
                      <button style={{ marginLeft: '1rem' }} onClick={() => handleSubmit(`/api/admin/series/${serie.slug}/seasons/${season.season}/episodes/${episode.ep}`, null, 'DELETE')}>
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section style={{ marginTop: '3rem' }}>
        <h2>Utilisateurs</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Identifiant</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Rôle</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Statut</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.username}>
                <td style={{ padding: '0.5rem' }}>{user.username}</td>
                <td style={{ padding: '0.5rem' }}>{user.role}</td>
                <td style={{ padding: '0.5rem' }}>{user.disabled ? 'Désactivé' : 'Actif'}</td>
                <td style={{ padding: '0.5rem' }}>
                  <button onClick={() => disableUser(user.username, !user.disabled)}>
                    {user.disabled ? 'Réactiver' : 'Désactiver'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  );
}
