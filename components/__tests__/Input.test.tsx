import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../design-system/Input';

describe('Input', () => {
  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    render(<Input />);
    expect(screen.queryByRole('textbox')).toBeInTheDocument();
  });

  it('handles onChange', () => {
    const handleChange = vi.fn();
    render(<Input label="Name" onChange={handleChange} />);
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('shows error state and message', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    const input = screen.getByLabelText('Email');
    expect(input.className).toContain('border-error-500');
  });

  it('shows helper text when no error', () => {
    render(<Input label="Email" helperText="Enter your email" />);
    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('does not show helper text when error is present', () => {
    render(<Input label="Email" error="Required" helperText="Enter your email" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.queryByText('Enter your email')).not.toBeInTheDocument();
  });
});
