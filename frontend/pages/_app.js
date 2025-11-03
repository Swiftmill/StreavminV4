import { useEffect } from 'react';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__STREAVMIN_API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
    }
  }, []);
  return <Component {...pageProps} />;
}
