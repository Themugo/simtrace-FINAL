'use client';
import { useEffect, useState, CSSProperties, ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface AdBannerProps {
  placement?: string;
  style?: CSSProperties;
}

export default function AdBanner({ placement = 'dashboard_banner', style: extraStyle = {} }: AdBannerProps) {
  const { user } = useAuth();
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    api.get(`/api/ads/serve?placement=${placement}`)
      .then(data => { if (data.ad) setAd(data.ad); })
      .catch(() => {});
  }, [placement]);

  if (!ad) return null;

  function handleClick() {
    api.post(`/api/ads/${ad._id}/click`, {}).catch(() => {});
    window.open(ad.ctaUrl, '_blank', 'noopener');
  }

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid #1e3a5f',
      borderRadius: 10,
      padding: '0.85rem 1.1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      ...extraStyle,
    }}>
      {ad.imageUrl && (
        <img src={ad.imageUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 2, letterSpacing: '0.06em' }}>SPONSORED</div>
        <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.title}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as CSSProperties}>{ad.body}</div>
      </div>
      <button onClick={handleClick} style={{ background: 'var(--surface)', color: 'var(--sky)', border: '1px solid #2563eb', borderRadius: 8, padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {ad.ctaText || 'Learn More'}
      </button>
    </div>
  );
}
