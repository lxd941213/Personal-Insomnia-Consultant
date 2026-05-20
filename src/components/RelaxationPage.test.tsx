import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RelaxationPage } from './RelaxationPage';
import { clearAllLocalData, getRelaxationSessions } from '../storage/localStore';

describe('RelaxationPage', () => {
  beforeEach(() => {
    clearAllLocalData();
    vi.unstubAllGlobals();
  });

  it('starts and completes a relaxation session', async () => {
    vi.useFakeTimers();
    render(<RelaxationPage toolId="breathing-478" onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '开始' }));
    expect(screen.getByText('当前步骤：吸气 4 秒')).toBeInTheDocument();
    expect(screen.getByText('剩余 19 秒')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText('剩余 14 秒')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '暂停' }));
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText('剩余 14 秒')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '继续' }));
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.click(screen.getByRole('button', { name: '完成练习' }));

    expect(screen.getByText('本次练习已完成')).toBeInTheDocument();
    expect(getRelaxationSessions().at(-1)).toMatchObject({
      toolId: 'breathing-478',
      status: 'completed',
      durationSeconds: 7,
    });
    vi.useRealTimers();
  });

  it('shows sleep music recommendations and custom search links', () => {
    render(<RelaxationPage toolId="sound-meditation" onBack={vi.fn()} />);

    expect(screen.getByText('歌曲推荐')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /无人声轻钢琴/ })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('无人声轻钢琴 助眠 30分钟')),
    );

    fireEvent.change(screen.getByLabelText('检索助眠音乐'), {
      target: { value: '森林雨声' },
    });

    expect(screen.getByRole('link', { name: '搜索“森林雨声”' })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('森林雨声 助眠 音频')),
    );
  });

  it('adds uploaded local audio files for playback', () => {
    const createObjectURL = vi.fn(() => 'blob:local-audio');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });

    render(<RelaxationPage toolId="sound-meditation" onBack={vi.fn()} />);

    const file = new File(['audio'], 'my sleep song.mp3', { type: 'audio/mpeg' });
    fireEvent.change(screen.getByLabelText('上传音频文件'), {
      target: { files: [file] },
    });

    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByText('我的音频')).toBeInTheDocument();
    expect(screen.getByText('my sleep song.mp3')).toBeInTheDocument();
    expect(screen.getByLabelText('播放 my sleep song.mp3')).toHaveAttribute('src', 'blob:local-audio');
  });
});
