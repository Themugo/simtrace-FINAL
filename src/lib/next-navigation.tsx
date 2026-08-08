import { useState, useEffect } from 'react';

export function useRouter() {
  return {
    push(url: string) {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new Event('popstate'));
    },
    replace(url: string) {
      window.history.replaceState({}, '', url);
      window.dispatchEvent(new Event('popstate'));
    },
    back() {
      window.history.back();
    },
    forward() {
      window.history.forward();
    },
    refresh() {
      window.dispatchEvent(new Event('popstate'));
    }
  };
}

export function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return pathname;
}

export function useSearchParams() {
  const [params, setParams] = useState(() => new URLSearchParams(window.location.search));
  useEffect(() => {
    const onPop = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return params;
}

export function useParams() {
  // Parsed by App router state if needed or window pathname
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  // Default common parameter: id
  const id = pathParts.length >= 2 ? pathParts[pathParts.length - 1] : '';
  return { id };
}
