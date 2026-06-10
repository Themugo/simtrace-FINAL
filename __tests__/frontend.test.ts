import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
      const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
      expect(pkg.dependencies).toHaveProperty('next');
      expect(pkg.dependencies).toHaveProperty('react');
      expect(pkg.dependencies).toHaveProperty('react-dom');
      expect(pkg.dependencies).toHaveProperty('@sentry/nextjs');
    });

    it('should have testing dependencies', () => {
      const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
      expect(pkg.devDependencies).toHaveProperty('@testing-library/react');
      expect(pkg.devDependencies).toHaveProperty('@testing-library/jest-dom');
      expect(pkg.devDependencies).toHaveProperty('vitest');
    });
  });

  describe('Next.js Configuration', () => {
    it('should have a next.config.ts file', () => {
      expect(() => readFileSync(resolve(__dirname, '../next.config.ts'), 'utf-8')).not.toThrow();
    });
  });

  describe('Vercel Configuration', () => {
    it('should have valid Vercel config', () => {
      const vercelConfig = JSON.parse(readFileSync(resolve(__dirname, '../vercel.json'), 'utf-8'));
      expect(vercelConfig).toBeDefined();
      expect(vercelConfig.framework).toBe('nextjs');
      expect(vercelConfig.env).toHaveProperty('NEXT_PUBLIC_API_URL');
      expect(vercelConfig.env).toHaveProperty('NEXT_PUBLIC_SOCKET_URL');
    });
  });
});
