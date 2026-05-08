import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrendsPage } from './TrendsPage';

describe('TrendsPage', () => {
  it('renders empty state when no diary data exists', () => {
    render(<TrendsPage today="2026-05-08" />);
    expect(screen.getByText(/还没有足够的睡眠记录/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '去记录睡前状态' })).toBeInTheDocument();
  });
});