import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../design-system/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles onClick', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies primary variant class by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText('Primary');
    expect(btn.className).toContain('bg-primary-600');
  });

  it('applies secondary variant class', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByText('Secondary');
    expect(btn.className).toContain('bg-secondary-600');
  });

  it('supports disabled state and prevents click', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const btn = screen.getByText('Disabled');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner when isLoading', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading...').closest('button')).toBeDisabled();
  });
});
