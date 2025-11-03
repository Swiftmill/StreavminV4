import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Carousel({ title, items = [], onSelect }) {
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{title}</h2>
      </div>
      <div style={{ position: 'relative' }}>
        <motion.div
          style={{ display: 'grid', gridAutoFlow: 'column', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}
          whileTap={{ cursor: 'grabbing' }}
        >
          {items.map((item) => (
            <motion.article
              key={item.id || `${item.seriesName}-${item.season}-${item.ep}`}
              whileHover={{ y: -10, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                position: 'relative',
                width: '200px',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)'
              }}
              onClick={() => onSelect?.(item)}
            >
              {item.poster ? (
                <Image
                  src={item.poster}
                  alt={item.title || item.seriesName}
                  width={200}
                  height={300}
                  sizes="200px"
                  style={{ width: '100%', height: 'auto' }}
                />
              ) : (
                <div style={{ paddingTop: '150%', background: 'linear-gradient(135deg, #222, #111)' }} />
              )}
              <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '1rem', background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.8))' }}>
                <strong style={{ fontSize: '0.9rem' }}>{item.title || item.seriesName}</strong>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
