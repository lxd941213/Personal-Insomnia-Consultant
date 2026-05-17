import { useEffect } from 'react';

interface ResetConfirmDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetConfirmDrawer({ isOpen, onClose, onConfirm }: ResetConfirmDrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const clearedItems = [
    '睡眠档案',
    '评估记录',
    '聊天记录',
    '睡眠日记',
    '放松记录',
    '提醒设置',
    '改善计划',
  ];

  return (
    <div className="reset-drawer-overlay" onClick={onClose}>
      <div className="reset-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="reset-drawer-icon">⚠️</div>
        <h2 className="reset-drawer-title">确定要重置档案吗？</h2>
        <p className="reset-drawer-desc">重置后以下数据将被永久清除</p>
        <ul className="reset-drawer-list">
          {clearedItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <p className="reset-drawer-hint">
          重置完成后将返回初始页面，您可以重新创建档案
        </p>
        <div className="reset-drawer-actions">
          <button
            className="reset-drawer-confirm"
            onClick={onConfirm}
            type="button"
          >
            确认重置
          </button>
          <button
            className="reset-drawer-cancel"
            onClick={onClose}
            type="button"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
