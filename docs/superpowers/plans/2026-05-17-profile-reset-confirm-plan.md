# Profile Reset Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bottom-sheet confirmation drawer before profile reset, listing what data will be cleared and requiring explicit user confirmation.

**Architecture:** New `ResetConfirmDrawer` component rendered at App level, controlled by `resetDrawerOpen` state. Components trigger drawer open via callback instead of directly calling reset. On confirm, the drawer calls `resetProfile()`.

**Tech Stack:** React functional components, CSS animations, existing `resetProfile()` in App.tsx.

---

## File Structure

- **Create:** `src/components/ResetConfirmDrawer.tsx` — bottom-sheet drawer with confirmation content
- **Modify:** `src/App.tsx:20-44` — add `resetDrawerOpen` state, render drawer, change prop names
- **Modify:** `src/components/DashboardPage.tsx:40` — `onReset` → `onOpenResetDrawer`
- **Modify:** `src/components/ChatPage.tsx:168-183` — `reset` callback → `onOpenResetDrawer` prop
- **Modify:** `src/components/MyPage.tsx:78-80` — `onReset` → `onOpenResetDrawer`
- **Modify:** `src/styles.css` — add `.reset-drawer-*` overlay and drawer styles

---

## Task 1: Create ResetConfirmDrawer component

**Files:**
- Create: `src/components/ResetConfirmDrawer.tsx`

```tsx
import { useEffect, type ReactNode } from 'react';

interface ResetConfirmDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const clearedDataItems = [
  '睡眠档案',
  '评估记录',
  '聊天记录',
  '睡眠日记',
  '放松记录',
  '提醒设置',
  '改善计划',
];

export function ResetConfirmDrawer({ isOpen, onClose, onConfirm }: ResetConfirmDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="reset-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="重置档案确认">
      <div className="reset-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="reset-drawer-icon">⚠️</div>
        <h2 className="reset-drawer-title">确定要重置档案吗？</h2>
        <p className="reset-drawer-desc">重置后以下数据将被永久清除</p>
        <ul className="reset-drawer-list">
          {clearedDataItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="reset-drawer-hint">重置完成后将返回初始页面，您可以重新创建档案</p>
        <div className="reset-drawer-actions">
          <button type="button" className="reset-drawer-confirm" onClick={onConfirm}>
            确认重置
          </button>
          <button type="button" className="reset-drawer-cancel" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 2: Add drawer state and render drawer in App.tsx

**Files:**
- Modify: `src/App.tsx:20-44` — add state; lines 109 and 156 change props; add drawer render

- [ ] **Step 1: Read current App.tsx lines 20-50 to see exact lines**

```typescript
// Add resetDrawerOpen state after selectedRelaxationTool state (around line 28):
const [resetDrawerOpen, setResetDrawerOpen] = useState(false);
```

- [ ] **Step 2: Add openResetDrawer callback after resetProfile function (around line 45):**

```typescript
function openResetDrawer() {
  setResetDrawerOpen(true);
}
```

- [ ] **Step 3: Pass openResetDrawer instead of resetProfile in ChatPage props (line 109):**

Change `onReset={resetProfile}` → `onOpenResetDrawer={openResetDrawer}`

- [ ] **Step 4: Pass openResetDrawer instead of resetProfile in MyPage props (line 156):**

Change `onReset={resetProfile}` → `onOpenResetDrawer={openResetDrawer}`

- [ ] **Step 5: Add ResetConfirmDrawer render inside App return, before bottom-tabs (around line 165):**

```tsx
<ResetConfirmDrawer
  isOpen={resetDrawerOpen}
  onClose={() => setResetDrawerOpen(false)}
  onConfirm={() => {
    setResetDrawerOpen(false);
    resetProfile();
  }}
/>
<BottomTabs active={activeTab} onChange={setActiveTab} />
```

- [ ] **Step 6: Import ResetConfirmDrawer at top**

```typescript
import { ResetConfirmDrawer } from './components/ResetConfirmDrawer';
```

---

## Task 3: Update DashboardPage to use onOpenResetDrawer prop

**Files:**
- Modify: `src/components/DashboardPage.tsx:20,40`

- [ ] **Step 1: Change interface prop name (line 20):**

```typescript
onOpenResetDrawer: () => void;
```

- [ ] **Step 2: Update destructuring (line 29):**

```typescript
onOpenResetDrawer,
```

- [ ] **Step 3: Change button onClick (line 40):**

```typescript
<button type="button" className="reset-btn" onClick={onOpenResetDrawer}>
  重置档案
</button>
```

- [ ] **Step 4: Update prop passed from TodayPage**

TodayPage renders DashboardPage. Need to check TodayPage → DashboardPage prop flow.

---

## Task 4: Update ChatPage to use onOpenResetDrawer prop

**Files:**
- Modify: `src/components/ChatPage.tsx:17,183`

- [ ] **Step 1: Change interface (line 17):**

```typescript
onOpenResetDrawer: () => void;
```

- [ ] **Step 2: Update destructuring (line 24):**

```typescript
onOpenResetDrawer,
```

- [ ] **Step 3: Remove reset callback (lines 168-171) — delete the useCallback**

- [ ] **Step 4: Change button onClick (line 183):**

```typescript
<button type="button" className="reset-btn" onClick={onOpenResetDrawer}>重置档案</button>
```

---

## Task 5: Update MyPage to use onOpenResetDrawer prop

**Files:**
- Modify: `src/components/MyPage.tsx:6,78-80`

- [ ] **Step 1: Change interface prop name (line 6):**

```typescript
onOpenResetDrawer: () => void;
```

- [ ] **Step 2: Change button (lines 78-80):**

```typescript
<button type="button" onClick={onOpenResetDrawer}>
  重置档案
</button>
```

---

## Task 6: Add ResetConfirmDrawer CSS styles

**Files:**
- Modify: `src/styles.css` — add at end

```css
/* ─── Reset Confirm Drawer ─── */

.reset-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(7, 8, 16, 0.72);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.2s ease-out both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.reset-drawer {
  width: 100%;
  max-width: 640px;
  background: var(--night-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  border: 1px solid rgba(168, 180, 214, 0.10);
  border-bottom: none;
  padding: 28px 24px calc(24px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: slideUp 0.3s var(--ease-out) both;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.4);
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.reset-drawer-icon {
  font-size: 32px;
  text-align: center;
  line-height: 1;
}

.reset-drawer-title {
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--mist);
  text-align: center;
}

.reset-drawer-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
}

.reset-drawer-list {
  margin: 0;
  padding: 0 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  list-style: none;
}

.reset-drawer-list li {
  font-size: 14px;
  color: var(--text-primary);
  position: relative;
  padding-left: 16px;
}

.reset-drawer-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.65em;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--moonbeam-dim);
}

.reset-drawer-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.6;
  padding: 10px 16px;
  background: rgba(168, 180, 214, 0.04);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(168, 180, 214, 0.06);
}

.reset-drawer-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.reset-drawer-confirm {
  width: 100%;
  padding: 14px 24px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #b84a3c 0%, #a03a2c 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.22s var(--ease-out);
}

.reset-drawer-confirm:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
  box-shadow: 0 8px 24px rgba(180, 80, 60, 0.28);
}

.reset-drawer-confirm:active {
  transform: translateY(0) scale(0.98);
}

.reset-drawer-cancel {
  width: 100%;
  padding: 14px 24px;
  border-radius: 999px;
  border: 1px solid rgba(168, 180, 214, 0.15);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s var(--ease-out);
}

.reset-drawer-cancel:hover {
  border-color: rgba(168, 180, 214, 0.22);
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
}

.reset-drawer-cancel:active {
  transform: scale(0.98);
}
```

---

## Task 7: Update TodayPage prop chain for DashboardPage

**Files:**
- Modify: `src/components/TodayPage.tsx` — change `onReset` prop name to `onOpenResetDrawer`

- [ ] **Step 1: Check how TodayPage passes onReset to DashboardPage**

---

## Verification Steps

After all changes:
1. Run `npm test` — all tests pass
2. Click "重置档案" in Dashboard → bottom drawer appears
3. Click "取消" or overlay → drawer closes, no reset
4. Click "确认重置" → drawer closes, profile resets, EntryPage shown
5. Same flow verified in ChatPage and MyPage