import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders entry page with start button', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Get personal sleep guidance in a few minutes.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create sleep profile' })).toBeInTheDocument();
  });

  it('navigates to profile wizard when start button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Create sleep profile' }));

    expect(screen.getByRole('heading', { name: 'Build your sleep profile' })).toBeInTheDocument();
  });

  it('shows chat view after completing profile', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Create sleep profile' }));
    await user.selectOptions(screen.getByLabelText('Age range'), '25-34');
    await user.type(screen.getByLabelText('Usual bedtime'), '23:00');
    await user.type(screen.getByLabelText('Usual wake time'), '07:00');
    await user.selectOptions(screen.getByLabelText('Concern duration'), '1-3 months');
    await user.selectOptions(screen.getByLabelText('Stress level'), 'Medium');
    await user.type(screen.getByLabelText('Daytime impact'), 'Tired');
    await user.click(screen.getByRole('button', { name: 'Start consultation' }));

    expect(screen.getByRole('heading', { name: 'Profile saved' })).toBeInTheDocument();
  });
});
