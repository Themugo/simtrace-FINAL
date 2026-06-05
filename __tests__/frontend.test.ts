import { describe, it, expect } from '@jest/globals';

describe('Frontend Configuration Tests', () => {
  describe('Environment Variables', () => {
    it('should have API URL defined', () => {
      expect(process.env.NEXT_PUBLIC_API_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_API_URL).toMatch(/^https?:\/\//);
    });

    it('should have Socket URL defined', () => {
      expect(process.env.NEXT_PUBLIC_SOCKET_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SOCKET_URL).toMatch(/^https?:\/\//);
    });

    it('should have Sentry DSN defined in production', () => {
      if (process.env.NODE_ENV === 'production') {
        expect(process.env.NEXT_PUBLIC_SENTRY_DSN).toBeDefined();
        expect(process.env.NEXT_PUBLIC_SENTRY_DSN).toMatch(/^https?:\/\//);
      }
    });
  });

  describe('Package Dependencies', () => {
    it('should have required dependencies', () => {
      const pkg = require('../package.json');
      expect(pkg.dependencies).toHaveProperty('next');
      expect(pkg.dependencies).toHaveProperty('react');
      expect(pkg.dependencies).toHaveProperty('react-dom');
      expect(pkg.dependencies).toHaveProperty('@sentry/nextjs');
    });

    it('should have testing dependencies', () => {
      const pkg = require('../package.json');
      expect(pkg.devDependencies).toHaveProperty('@testing-library/react');
      expect(pkg.devDependencies).toHaveProperty('@testing-library/jest-dom');
      expect(pkg.devDependencies).toHaveProperty('vitest');
    });
  });

  describe('Next.js Configuration', () => {
    it('should have valid Next.js config', () => {
      const nextConfig = require('../next.config.js');
      expect(nextConfig).toBeDefined();
      expect(nextConfig.transpilePackages).toContain('leaflet');
      expect(nextConfig.transpilePackages).toContain('react-leaflet');
    });
  });

  describe('Vercel Configuration', () => {
    it('should have valid Vercel config', () => {
      const vercelConfig = require('../vercel.json');
      expect(vercelConfig).toBeDefined();
      expect(vercelConfig.framework).toBe('nextjs');
      expect(vercelConfig.env).toHaveProperty('NEXT_PUBLIC_API_URL');
      expect(vercelConfig.env).toHaveProperty('NEXT_PUBLIC_SOCKET_URL');
    });
  });
});
