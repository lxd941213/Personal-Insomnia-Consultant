import { useEffect } from 'react';

export type MainTab = 'today' | 'diary' | 'trends' | 'plans' | 'my';

const tabs: Array<{ value: MainTab; label: string; icon: string }> = [
  { value: 'today', label: '首页', icon: 'home' },
  { value: 'diary', label: '日记', icon: 'book-open' },
  { value: 'trends', label: '趋势', icon: 'trending-up' },
  { value: 'plans', label: '方案', icon: 'moon' },
  { value: 'my', label: '我的', icon: 'user' },
];

export function BottomTabs({
  active,
  onChange,
}: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).lucide) {
      (window as any).lucide.createIcons();
    }
  }, [active]);

  return (
    <nav className="bottom-tabs" aria-label="主导航">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={active === tab.value ? 'bottom-tab active' : 'bottom-tab'}
          onClick={() => onChange(tab.value)}
          aria-current={active === tab.value ? 'page' : undefined}
        >
          <span className="tab-icon" aria-hidden="true">
            <i data-lucide={tab.icon} style={{ width: '20px', height: '20px' }}></i>
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
