import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input, TextArea } from '../Input';
import { borrowService } from '../../services/borrowService';
import { useBorrowStore } from '../../store/useBorrowStore';
import { addDays, formatDateForInput } from '../../utils/date';
import type { Material } from '../../types';
import { CheckSquare, Square, Package } from 'lucide-react';

interface BulkBorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  onSuccess?: () => void;
  defaultPurpose?: string;
}

export function BulkBorrowModal({ isOpen, onClose, materials, onSuccess, defaultPurpose }: BulkBorrowModalProps) {
  const { addBorrowRecords } = useBorrowStore();
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const defaultDays = borrowService.getDefaultBorrowDays();
  const [formData, setFormData] = useState({
    borrower: '',
    purpose: '',
    borrowDate: formatDateForInput(new Date()),
    expectedReturnDate: formatDateForInput(addDays(new Date(), defaultDays)),
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(materials.map((m) => m.id));
      setFormData({
        borrower: '',
        purpose: defaultPurpose || '',
        borrowDate: formatDateForInput(new Date()),
        expectedReturnDate: formatDateForInput(addDays(new Date(), defaultDays)),
        notes: '',
      });
    }
  }, [isOpen, defaultDays, materials, defaultPurpose]);

  const allSelected = materials.length > 0 && selectedIds.length === materials.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(materials.map((m) => m.id));
    }
  };

  const toggleSelect = (materialId: string) => {
    setSelectedIds((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    setLoading(true);
    try {
      const records = await borrowService.bulkCreate(selectedIds, {
        borrower: formData.borrower,
        purpose: formData.purpose,
        borrowDate: new Date(formData.borrowDate),
        expectedReturnDate: new Date(formData.expectedReturnDate),
        notes: formData.notes,
      });
      addBorrowRecords(records);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create bulk borrow records:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="批量借出登记" size="xl">
      <div className="flex gap-6">
        <div className="w-1/2 border-r border-slate-700 pr-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">选择材料</h3>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {allSelected ? '取消全选' : '全选'}
            </button>
          </div>
          <div className="text-xs text-slate-500 mb-3">
            已选择 {selectedIds.length} / {materials.length} 项
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {materials.map((material) => {
              const isSelected = selectedIds.includes(material.id);
              return (
                <div
                  key={material.id}
                  onClick={() => toggleSelect(material.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-900/30 border border-blue-700/50'
                      : 'bg-slate-900/50 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                  )}
                  {material.images && material.images.length > 0 ? (
                    <img
                      src={material.images[0]}
                      alt={material.name}
                      className="w-10 h-10 rounded object-cover bg-slate-800 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {material.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {material.brand} · 柜位：{material.cabinetLocation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-1/2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="借用人"
              value={formData.borrower}
              onChange={(e) => setFormData({ ...formData, borrower: e.target.value })}
              placeholder="请输入借用人姓名"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="借出日期"
                type="date"
                value={formData.borrowDate}
                onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
                required
              />
              <Input
                label="预计归还日期"
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                required
              />
            </div>
            <Input
              label="借出用途"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="如：项目会议展示（可选）"
            />
            <TextArea
              label="备注"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="可选，记录借出时的状态或特殊说明"
              rows={3}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button type="button" variant="secondary" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" loading={loading} disabled={selectedIds.length === 0}>
                确认借出 ({selectedIds.length} 项)
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
