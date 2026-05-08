import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders entry page with start button', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: '几分钟内获得个性化睡眠指导' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建睡眠档案' })).toBeInTheDocument();
  });

  it('navigates to profile wizard when start button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '创建睡眠档案' }));

    expect(screen.getByRole('heading', { name: '建立您的睡眠档案' })).toBeInTheDocument();
  });

  it('shows dashboard after completing profile', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '创建睡眠档案' }));
    await user.selectOptions(screen.getByLabelText('年龄段'), '25-34岁');
    await user.type(screen.getByLabelText('通常就寝时间'), '23:00');
    await user.type(screen.getByLabelText('通常起床时间'), '07:00');
    await user.selectOptions(screen.getByLabelText('问题持续时间'), '1-3个月');
    await user.selectOptions(screen.getByLabelText('压力水平'), '中等');
    await user.type(screen.getByLabelText('白天影响'), '疲劳');
    await user.click(screen.getByRole('button', { name: '开始咨询' }));

    expect(screen.getByRole('heading', { name: '睡眠健康助手' })).toBeInTheDocument();
  });
});
