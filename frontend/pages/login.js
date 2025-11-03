import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { apiFetch } from '../lib/api';

async function fetchCsrf() {
  const res = await apiFetch('/api/csrf');
  if (!res.ok) throw new Error('Impossible de récupérer le token CSRF');
  const data = await res.json();
  return data.csrfToken;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          router.replace('/app');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const csrfToken = await fetchCsrf();
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'csrf-token': csrfToken
        },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Connexion impossible');
      }
      router.replace('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top, #1f1f3a, #050505)' }}>
      <form onSubmit={handleSubmit} style={{ background: 'rgba(12, 12, 20, 0.85)', padding: '3rem', borderRadius: '24px', width: 'min(420px, 90vw)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <h1 style={{ marginTop: 0, fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>Streavmin</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem', color: '#b5b5ff' }}>
            Identifiant
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', borderRadius: '999px', border: '1px solid #2f2f4f', background: '#141422', color: 'white' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem', color: '#b5b5ff' }}>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', borderRadius: '999px', border: '1px solid #2f2f4f', background: '#141422', color: 'white' }}
            />
          </label>
          {error && (
            <div style={{ color: '#ff6b6b', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.85rem 1rem',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #e50914, #b20710)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>
      </form>
    </div>
  );
}
