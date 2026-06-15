import { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { TextArea } from '../Input';
import { borrowService } from '../../services/borrowService';
import { useBorrowStore } from '../../store/useBorrowStore';
import type { BorrowRecordWithMaterial } from '../../types';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BorrowRecordWithMaterial | null;
  onSuccess?: () => void;
}

export function ReturnModal({ isOpen, onClose, record, onSuccess }: ReturnModalProps) {
  const { updateBorrowRecord } = useBorrowStore();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    setLoading(true);
    try {
      const updated = await borrowService.returnRecord(record.id, notes);
      if (updated) updateBorrowRecord(updated);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to return material:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="登记归还" size="md">
      <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
        <p className="text-sm text-slate-300">
          归还材料：<span className="font-medium text-slate-100">{record.material.name}</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          借用人：{record.borrower} · 借出日期：{new Date(record.borrowDate).toLocaleDateString('zh-CN')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextArea
          label="归还备注"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="可选，记录归还时的状态，如是否有损坏等"
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" loading={loading}>
            确认归还
          </Button>
        </div>
      </form>
    </Modal>
  );
}
