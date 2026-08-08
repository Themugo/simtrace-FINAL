'use client';

import { useState, InputHTMLAttributes } from 'react';

/** A password <input> with a show/hide toggle. Renders a real <input> so it
 * picks up the site's global `input { ... }` styling automatically -- the
 * toggle button is just absolutely positioned over it. */
export default function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input {...props} type={show ? 'text' : 'password'} style={{ ...(props.style || {}), paddingRight: '2.75rem' }} />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
        style={{
          position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)',
          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.05rem',
        }}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
