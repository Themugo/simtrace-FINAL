import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Nav from '../Nav';

const mockPush = vi.fn();
const mockPathname = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockLogout = vi.fn();

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({
    user: null,
    logout: mockLogout,
    loading: false,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockPathname.mockReturnValue('/');
  globalThis.fetch = vi.fn().mockResolvedValue({ json: () => ({ count: 0 }) });
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  const storage: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, val: string) => { storage[key] = val }),
    removeItem: vi.fn((key: string) => { delete storage[key] }),
    clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]) }),
    length: 0,
    key: vi.fn(),
  };
});

describe('Nav', () => {
  it('renders logo and brand name', () => {
    render(<Nav />);
    expect(screen.getByText('SIM')).toBeInTheDocument();
    expect(screen.getByText('TRACE')).toBeInTheDocument();
  });

  it('shows login and register links when no user', () => {
    render(<Nav />);
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('shows nav links for public routes', () => {
    render(<Nav />);
    expect(screen.getByText('IMEI Check')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  it('applies active style to current path', () => {
    mockPathname.mockReturnValue('/pricing');
    render(<Nav />);
    const pricingLinks = screen.getAllByText('Pricing');
    const desktopLink = pricingLinks[0].closest('a')!;
    expect(desktopLink.style.color).toBe('var(--sky)');
  });
});
