import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input, TextArea, Select } from '../Input';
import { borrowService } from '../../services/borrowService';
import { useBorrowStore } from '../../store/useBorrowStore';
import { addDays, formatDateForInput } from '../../utils/date';
import { formatDate } from '../../utils/format';
import type { Material, BorrowRecord } from '../../types';
import { Package, AlertTriangle, X, CalendarClock, CheckCircle } from 'lucide-react';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  materials?: Material[];
  onSuccess?: () => void;
  defaultPurpose?: string;
  defaultBorrower?: string;
  mode?: 'borrow' | 'reserve';
  onChangeMode?: (mode: 'borrow' | 'reserve') => void;
}

export function BorrowModal({ isOpen, onClose, material, materials = [], onSuccess, defaultPurpose, defaultBorrower, mode = 'borrow', onChangeMode }: BorrowModalProps) {
  const { addBorrowRecord } = useBorrowStore();
  const [loading, setLoading] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [activeBorrow, setActiveBorrow] = useState<BorrowRecord | null>(null);
  const [showWarning, setShowWarning] = useState(true);
  const [localMode, setLocalMode] = useState<'borrow' | 'reserve'>(mode);
  const defaultDays = borrowService.getDefaultBorrowDays();
  const [formData, setFormData] = useState({
    borrower: '',
    purpose: '',
    borrowDate: formatDateForInput(new Date()),
    expectedReturnDate: formatDateForInput(addDays(new Date(), defaultDays)),
    reservationExpiryDate: formatDateForInput(addDays(new Date(), 3)),
    notes: '',
  });

  useEffect(() => {
    setLocalMode(mode);
  }, [mode]);

  useEffect(() => {
    if (isOpen) {
      setSelectedMaterialId(material?.id || '');
      setShowWarning(true);
      setFormData({
        borrower: defaultBorrower || '',
        purpose: defaultPurpose || '',
        borrowDate: formatDateForInput(new Date()),
        expectedReturnDate: formatDateForInput(addDays(new Date(), defaultDays)),
        reservationExpiryDate: formatDateForInput(addDays(new Date(), 3)),
        notes: '',
      });
    }
  }, [isOpen, defaultDays, material, defaultPurpose, defaultBorrower]);

  useEffect(() => {
    const checkActiveBorrow = async () => {
      const selectedId = material?.id || selectedMaterialId;
      if (selectedId) {
        const active = await borrowService.getActiveBorrowByMaterial(selectedId);
        setActiveBorrow(active);
      } else {
        setActiveBorrow(null);
      }
    };
    checkActiveBorrow();
  }, [material, selectedMaterialId, isOpen]);

  const getSelectedMaterial = (): Material | null => {
    if (material) return material;
    return materials.find((m) => m.id === selectedMaterialId) || null;
  };

  const selectedMaterial = getSelectedMaterial();

  const handleModeChange = (newMode: 'borrow' | 'reserve') => {
    setLocalMode(newMode);
    onChangeMode?.(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    if (activeBorrow && showWarning) {
      const statusText = activeBorrow.status === 'reserved' ? '已预约' : '已借出';
      const confirmed = window.confirm(
        `⚠️ 该材料${statusText}！\n当前${statusText === '已借出' ? '借给' : '预约给'}：${activeBorrow.borrower}\n${statusText === '已借出' ? '预计归还' : '预约有效期至'}：${formatDate(activeBorrow.status === 'reserved' && activeBorrow.reservationExpiryDate ? activeBorrow.reservationExpiryDate : activeBorrow.expectedReturnDate)}\n\n确定要强制${localMode === 'borrow' ? '借出' : '预约'}吗？`
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      if (localMode === 'borrow') {
        const record = await borrowService.create({
          materialId: selectedMaterial.id,
          borrower: formData.borrower,
          purpose: formData.purpose,
          borrowDate: new Date(formData.borrowDate),
          expectedReturnDate: new Date(formData.expectedReturnDate),
          notes: formData.notes,
        });
        addBorrowRecord(record);
      } else {
        const record = await borrowService.reserve({
          materialId: selectedMaterial.id,
          borrower: formData.borrower,
          purpose: formData.purpose,
          borrowDate: new Date(formData.borrowDate),
          expectedReturnDate: new Date(formData.expectedReturnDate),
          reservationExpiryDate: new Date(formData.reservationExpiryDate),
          notes: formData.notes,
        });
        addBorrowRecord(record);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create borrow record:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWarningText = () => {
    if (!activeBorrow) return null;
    const isReserved = activeBorrow.status === 'reserved';
    return {
      title: isReserved ? '⚠️ 该材料已预约' : '⚠️ 该材料已借出',
      borrower: activeBorrow.borrower,
      date: isReserved && activeBorrow.reservationExpiryDate
        ? `预约有效期至：${formatDate(activeBorrow.reservationExpiryDate)}`
        : `预计归还：${formatDate(activeBorrow.expectedReturnDate)}`,
    };
  };

  const warning = getWarningText();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={localMode === 'borrow' ? '登记借出' : '登记预约'} size="lg">
      <div className="flex border-b border-slate-700 mb-4">
        <button
          onClick={() => handleModeChange('borrow')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            localMode === 'borrow'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-1" />
          借出
        </button>
        <button
          onClick={() => handleModeChange('reserve')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            localMode === 'reserve'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <CalendarClock className="w-4 h-4 inline mr-1" />
          预约
        </button>
      </div>

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

      {warning && showWarning && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium text-sm">{warning.title}</p>
              <p className="text-red-300/80 text-xs mt-1">
                当前借给：{warning.borrower}
              </p>
              <p className="text-red-300/80 text-xs mt-0.5">
                {warning.date}
              </p>
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="text-red-400/60 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
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
                {localMode === 'borrow' ? '借出材料' : '预约材料'}：<span className="font-medium text-slate-100">{selectedMaterial.name}</span>
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
            label={localMode === 'borrow' ? '借出日期' : '预约日期'}
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
          {localMode === 'reserve' && (
            <Input
              label="预约到期日期"
              type="date"
              value={formData.reservationExpiryDate}
              onChange={(e) => setFormData({ ...formData, reservationExpiryDate: e.target.value })}
              required
            />
          )}
          <Input
            label={localMode === 'borrow' ? '借出用途' : '预约用途'}
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
          <Button type="submit" loading={loading} variant={localMode === 'reserve' ? 'secondary' : 'primary'}>
            {localMode === 'borrow' ? '确认借出' : '确认预约'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
