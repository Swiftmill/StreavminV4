import Link from 'next/link';

export default function Layout({ user, onLogout, children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a14, #050505)', color: 'white' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 3rem', position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(180deg, rgba(5,5,15,0.95), rgba(5,5,15,0.5))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/app" style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '0.15rem' }}>Streavmin</Link>
          <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Link href="/app">Accueil</Link>
            <Link href="/app?tab=films">Films</Link>
            <Link href="/app?tab=series">Séries</Link>
            {user?.role === 'admin' && <Link href="/admin">Admin</Link>}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#aaa' }}>{user?.username}</span>
          <button
            onClick={onLogout}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>
      <main style={{ padding: '0 3rem 4rem', overflow: 'hidden' }}>{children}</main>
    </div>
  );
}
