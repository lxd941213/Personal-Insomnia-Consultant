import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AiResponseCard } from './AiResponseCard';

describe('AiResponseCard', () => {
  it('renders high-risk care notice prominently', () => {
    render(
      <AiResponseCard
        response={{
          riskLevel: 'high_risk',
          summary: 'This may need professional support.',
          possibleFactors: [],
          suggestions: [],
          nextQuestions: [],
          seekCareNotice: 'Please contact a licensed clinician.',
          disclaimer: 'This is for health management reference only and is not medical diagnosis.',
        }}
      />,
    );

    expect(screen.getByText('Please contact a licensed clinician.')).toBeVisible();
    expect(screen.getByText(/not medical diagnosis/i)).toBeVisible();
  });

  it('renders multiline summaries as separate visual lines', () => {
    render(
      <AiResponseCard
        response={{
          riskLevel: 'normal',
          summary: '先把今晚目标定为降低刺激。\n再用 30 分钟完成放松和环境整理。',
          possibleFactors: [],
          suggestions: [],
          nextQuestions: [],
          seekCareNotice: null,
          disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
        }}
      />,
    );

    expect(screen.getByText('先把今晚目标定为降低刺激。')).toBeVisible();
    expect(screen.getByText('再用 30 分钟完成放松和环境整理。')).toBeVisible();
  });

  it('renders structured suggestions as separate action rows', () => {
    render(
      <AiResponseCard
        response={{
          riskLevel: 'normal',
          summary: '今晚适合做一个简短睡前仪式。',
          possibleFactors: ['睡前手机刺激'],
          suggestions: [
            { title: 'T-30 分钟', detail: '调暗灯光，停止刷短视频。' },
            { title: 'T-10 分钟', detail: '做 4-7-8 呼吸或渐进放松。' },
          ],
          nextQuestions: ['你通常几点开始刷手机？'],
          seekCareNotice: null,
          disclaimer: '本内容仅提供健康管理参考，不作为医疗诊断。',
        }}
      />,
    );

    expect(screen.getByText('建议尝试')).toBeVisible();
    expect(screen.getByText('T-30 分钟')).toBeVisible();
    expect(screen.getByText('调暗灯光，停止刷短视频。')).toBeVisible();
    expect(screen.getByText('T-10 分钟')).toBeVisible();
  });
});
