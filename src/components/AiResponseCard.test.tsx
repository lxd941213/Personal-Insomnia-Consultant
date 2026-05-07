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
});