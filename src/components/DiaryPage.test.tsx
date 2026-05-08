import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DiaryPage } from './DiaryPage';

describe('DiaryPage', () => {
  it('saves bedtime and wake checkins for the same date', async () => {
    const user = userEvent.setup();
    render(<DiaryPage selectedDate="2026-05-08" />);
    await user.type(screen.getByLabelText('睡前情绪'), '紧张');
    await user.click(screen.getByRole('button', { name: '保存睡前记录' }));
    await user.type(screen.getByLabelText('入睡时间'), '23:40');
    await user.type(screen.getByLabelText('起床时间'), '07:10');
    await user.type(screen.getByLabelText('入睡耗时'), '35');
    await user.click(screen.getByRole('button', { name: '保存起床记录' }));
    expect(screen.getByText('已保存 2026-05-08 的睡眠日记')).toBeInTheDocument();
  });
});