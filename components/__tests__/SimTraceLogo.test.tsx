import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SimTraceLogo from '../SimTraceLogo';

describe('SimTraceLogo', () => {
  it('renders SVG element', () => {
    const { container } = render(<SimTraceLogo />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders text by default', () => {
    render(<SimTraceLogo />);
    expect(screen.getByText('SIM')).toBeInTheDocument();
    expect(screen.getByText('TRACE')).toBeInTheDocument();
  });

  it('hides text when showText is false', () => {
    render(<SimTraceLogo showText={false} />);
    expect(screen.queryByText('SIM')).not.toBeInTheDocument();
  });

  it('applies custom size', () => {
    const { container } = render(<SimTraceLogo size={64} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('64');
  });
});
