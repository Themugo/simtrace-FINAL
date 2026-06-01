import 'react';

// Allow CSS custom properties (e.g. style={{ '--accent': '#fff' }}) which the
// base csstype CSSProperties does not permit by default.
declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
