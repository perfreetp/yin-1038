import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input, TextArea, Select } from '../Input';
import { borrowService } from '../../services/borrowService';
import { useBorrowStore } from '../../store/useBorrowStore';
import { addDays, formatDateForInput } from '../../utils/date';
import type { Material } from '../../types';
import { Package } from 'lucide-react';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  materials?: Material[];
  onSuccess?: () => void;
  defaultPurpose?: string;
  defaultBorrower?: string;
}

export function BorrowModal({ isOpen, onClose, material, materials = [], onSuccess, defaultPurpose, defaultBorrower }: BorrowModalProps) {
  const { addBorrowRecord } = useBorrowStore();
  const [loading, setLoading] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
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
      setSelectedMaterialId(material?.id || '');
      setFormData({
        borrower: defaultBorrower || '',
        purpose: defaultPurpose || '',
        borrowDate: formatDateForInput(new Date()),
        expectedReturnDate: formatDateForInput(addDays(new Date(), defaultDays)),
        notes: '',
      });
    }
  }, [isOpen, defaultDays, material, defaultPurpose, defaultBorrower]);

  const getSelectedMaterial = (): Material | null => {
    if (material) return material;
    return materials.find((m) => m.id === selectedMaterialId) || null;
  };

  const selectedMaterial = getSelectedMaterial();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    setLoading(true);
    try {
      const record = await borrowService.create({
        materialId: selectedMaterial.id,
        borrower: formData.borrower,
        purpose: formData.purpose,
        borrowDate: new Date(formData.borrowDate),
        expectedReturnDate: new Date(formData.expectedReturnDate),
        notes: formData.notes,
      });
      addBorrowRecord(record);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create borrow record:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="登记借出" size="lg">
      {!material && materials.length > 0 && (
        <div className="mb-4">
          <Select
            label="选择材料"
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            required
          >
            <option value="">请选择要借出的材料</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} - {m.brand} ({m.cabinetLocation})
              </option>
            ))}
          </Select>
        </div>
      )}

      {selectedMaterial && (
        <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
          <div className="flex items-center gap-3">
            {selectedMaterial.images && selectedMaterial.images.length > 0 ? (
              <img
                src={selectedMaterial.images[0]}
                alt={selectedMaterial.name}
                className="w-12 h-12 rounded-lg object-cover bg-slate-800"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-600" />
              </div>
            )}
            <div>
              <p className="text-sm text-slate-300">
                借出材料：<span className="font-medium text-slate-100">{selectedMaterial.name}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedMaterial.brand} · {selectedMaterial.specification} · 柜位：{selectedMaterial.cabinetLocation}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="借用人"
            value={formData.borrower}
            onChange={(e) => setFormData({ ...formData, borrower: e.target.value })}
            placeholder="请输入借用人姓名"
            required
          />
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
          <Input
            label="借出用途"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="如：项目会议展示（可选）"
          />
        </div>
        <TextArea
          label="备注"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="可选，记录借出时的状态或特殊说明"
          rows={2}
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" loading={loading}>
            确认借出
          </Button>
        </div>
      </form>
    </Modal>
  );
}
