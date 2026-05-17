import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ResetConfirmDrawer } from './ResetConfirmDrawer';

describe('ResetConfirmDrawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen=true', () => {
    render(<ResetConfirmDrawer {...defaultProps} />);
    expect(screen.getByText('确定要重置档案吗？')).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('does not render when isOpen=false', () => {
    const { container } = render(<ResetConfirmDrawer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ResetConfirmDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('确认重置'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ResetConfirmDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('取消'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    render(<ResetConfirmDrawer {...defaultProps} />);
    const overlay = document.querySelector('.reset-drawer-overlay');
    if (overlay) {
      fireEvent.click(overlay);
    }
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('displays all cleared data items', () => {
    render(<ResetConfirmDrawer {...defaultProps} />);
    expect(screen.getByText('睡眠档案')).toBeInTheDocument();
    expect(screen.getByText('评估记录')).toBeInTheDocument();
    expect(screen.getByText('聊天记录')).toBeInTheDocument();
    expect(screen.getByText('睡眠日记')).toBeInTheDocument();
    expect(screen.getByText('放松记录')).toBeInTheDocument();
    expect(screen.getByText('提醒设置')).toBeInTheDocument();
    expect(screen.getByText('改善计划')).toBeInTheDocument();
  });

  it('displays hint text', () => {
    render(<ResetConfirmDrawer {...defaultProps} />);
    expect(screen.getByText('重置完成后将返回初始页面，您可以重新创建档案')).toBeInTheDocument();
  });

  it('locks body scroll when open', () => {
    render(<ResetConfirmDrawer {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<ResetConfirmDrawer {...defaultProps} />);
    rerender(<ResetConfirmDrawer {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });
});