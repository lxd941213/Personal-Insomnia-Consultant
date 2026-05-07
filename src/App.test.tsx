import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the sleep wellness app shell', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Sleep Wellness H5 MVP' }),
    ).toBeInTheDocument();
  });
});
