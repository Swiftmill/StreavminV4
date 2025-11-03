import Image from 'next/image';
import { motion } from 'framer-motion';

export default function HeroBanner({ item, onPlay }) {
  if (!item) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', marginBottom: '3rem', minHeight: '420px' }}
    >
      {item.heroImage || item.poster ? (
        <Image
          src={item.heroImage || item.poster}
          alt={item.title}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', filter: 'brightness(0.65)' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #111, #000)' }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, padding: '4rem', maxWidth: '60%' }}>
        <h1 style={{ fontSize: '3rem', margin: 0 }}>{item.title}</h1>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#e0e0e0', maxWidth: '640px' }}>{item.synopsis}</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => onPlay?.(item)}
            style={{
              padding: '0.9rem 2.2rem',
              borderRadius: '999px',
              border: 'none',
              background: 'linear-gradient(135deg, #e50914, #b20710)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Lecture
          </button>
          <button
            style={{
              padding: '0.9rem 2.2rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.4)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Ajouter à ma liste
          </button>
        </div>
      </div>
    </motion.section>
  );
}
