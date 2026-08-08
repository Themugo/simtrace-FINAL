import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../design-system/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="my-custom-class">Styled</Card>);
    const card = screen.getByText('Styled');
    expect(card.className).toContain('my-custom-class');
  });

  it('renders with default variant', () => {
    render(<Card>Default</Card>);
    const card = screen.getByText('Default');
    expect(card.className).toContain('border-neutral-200');
  });

  it('renders with elevated variant', () => {
    render(<Card variant="elevated">Elevated</Card>);
    const card = screen.getByText('Elevated');
    expect(card.className).toContain('shadow-lg');
  });
});
