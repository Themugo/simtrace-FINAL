import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Frontend Configuration Tests', () => {
  describe('Package Dependencies', () => {
    it('should have required dependencies', () => {
      const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
      expect(pkg.dependencies).toHaveProperty('react');
      expect(pkg.dependencies).toHaveProperty('react-dom');
    });

    it('should have testing dependencies', () => {
      const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
      expect(pkg.devDependencies).toHaveProperty('vitest');
    });
  });

  describe('Vite Configuration', () => {
    it('should have a vite.config.ts file', () => {
      expect(() => readFileSync(resolve(__dirname, '../vite.config.ts'), 'utf-8')).not.toThrow();
    });
  });
});
