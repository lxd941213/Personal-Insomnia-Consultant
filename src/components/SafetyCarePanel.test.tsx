import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildSafetyDisplayCopy, triageSafety } from '../domain/safety';
import { SafetyCarePanel } from './SafetyCarePanel';

describe('SafetyCarePanel', () => {
  it('renders urgent care-first guidance', () => {
    const triage = triageSafety({ message: '我想轻生' });
    render(<SafetyCarePanel level={triage.level} copy={buildSafetyDisplayCopy(triage)} />);

    expect(screen.getByRole('region', { name: '安全优先提示' })).toBeInTheDocument();
    expect(screen.getByText('请立即优先处理安全风险')).toBeInTheDocument();
    expect(screen.getByText('联系当地急救')).toBeInTheDocument();
    expect(screen.queryByText('988')).not.toBeInTheDocument();
  });

  it('renders needs-care guidance', () => {
    const triage = triageSafety({ message: '我睡觉总是憋醒，打鼾很严重' });
    render(<SafetyCarePanel level={triage.level} copy={buildSafetyDisplayCopy(triage)} />);

    expect(screen.getByText('建议专业评估后再执行普通助眠任务')).toBeInTheDocument();
    expect(screen.getByText('整理睡眠记录')).toBeInTheDocument();
  });
});