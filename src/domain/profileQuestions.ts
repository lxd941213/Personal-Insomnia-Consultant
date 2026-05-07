export const profileQuestions = [
  {
    key: 'ageRange',
    label: 'Your age range',
    options: ['Under 18', '18-24', '25-34', '35-44', '45-59', '60+'],
  },
  {
    key: 'mainConcern',
    label: 'Main sleep concern',
    options: [
      'Hard to fall asleep',
      'Waking too early',
      'Waking often',
      'Vivid dreams',
      'Daytime sleepiness',
      'Late-night habit',
      'Other',
    ],
  },
  {
    key: 'concernDuration',
    label: 'How long has this been happening?',
    options: ['Less than 1 week', '1-4 weeks', '1-3 months', 'More than 3 months'],
  },
  {
    key: 'stressLevel',
    label: 'Current stress level',
    options: ['Low', 'Medium', 'High', 'Very high'],
  },
] as const;
