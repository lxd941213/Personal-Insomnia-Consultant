export type MainTab = 'today' | 'diary' | 'trends' | 'plans' | 'my';

const tabs: Array<{ value: MainTab; label: string }> = [
  { value: 'today', label: '今日' },
  { value: 'diary', label: '日记' },
  { value: 'trends', label: '趋势' },
  { value: 'plans', label: '方案' },
  { value: 'my', label: '我的' },
];

export function BottomTabs({
  active,
  onChange,
}: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}) {
  return (
    <nav className="bottom-tabs" aria-label="主导航">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={active === tab.value ? 'bottom-tab active' : 'bottom-tab'}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
