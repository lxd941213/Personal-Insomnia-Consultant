export const profileQuestions = [
  {
    key: 'ageRange',
    label: '年龄段',
    options: ['18岁以下', '18-24岁', '25-34岁', '35-44岁', '45-59岁', '60岁以上'],
  },
  {
    key: 'mainConcern',
    label: '主要睡眠问题',
    options: [
      '难以入睡',
      '早醒',
      '频繁醒来',
      '多梦',
      '白天嗜睡',
      '夜间习惯问题',
      '其他',
    ],
  },
  {
    key: 'concernDuration',
    label: '问题持续时间',
    options: ['不到1周', '1-4周', '1-3个月', '3个月以上'],
  },
  {
    key: 'stressLevel',
    label: '压力水平',
    options: ['较低', '中等', '较高', '很高'],
  },
] as const;
