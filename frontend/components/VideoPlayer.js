import { useEffect, useRef } from 'react';

export default function VideoPlayer({ media, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!media) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999
      }}
      onClick={onClose}
    >
      <div
        style={{ width: 'min(90vw, 1200px)', background: '#000', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          controls
          autoPlay
          style={{ width: '100%', borderRadius: '12px' }}
          src={media.streamUrl}
        >
          {media.subtitles?.map((track) => (
            <track key={track.url} src={track.url} label={track.label || track.lang} kind="subtitles" srcLang={track.lang} />
          ))}
        </video>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            cursor: 'pointer'
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
