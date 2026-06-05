"use client";
import dynamic from 'next/dynamic';

// Lazy load the entire LiveMap component
const LiveMap = dynamic(() => import('./LiveMap'), {
  loading: () => <div style={{ height: 480, borderRadius: 12, border: '1px solid #1e2d45', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading map...</div>,
  ssr: false
});

export default LiveMap;
