import { Eye, ArrowRightLeft, FolderKanban, User, CalendarClock, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Material, BorrowRecord } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatPrice, formatDate } from '../utils/format';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/useUIStore';

interface MaterialCardProps {
  material: Material;
  className?: string;
  currentBorrow?: BorrowRecord | null;
  onBorrow?: (material: Material) => void;
  onProject?: (material: Material) => void;
}

export function MaterialCard({ material, className, currentBorrow, onBorrow, onProject }: MaterialCardProps) {
  const navigate = useNavigate();
  const { openModal } = useUIStore();

  const handleViewDetail = () => {
    navigate(`/materials/${material.id}`);
  };

  const isOverdue = currentBorrow?.status === 'overdue';
  const isBorrowed = currentBorrow?.status === 'borrowed' || isOverdue;

  const borderClass = isOverdue
    ? 'border-red-500/60 hover:border-red-500 hover:shadow-red-500/10'
    : isBorrowed
    ? 'border-blue-500/60 hover:border-blue-500 hover:shadow-blue-500/10'
    : 'border-slate-700 hover:border-blue-500/50 hover:shadow-blue-500/10';

  return (
    <div
      className={cn(
        'bg-slate-800 rounded-lg border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer',
        borderClass,
        className,
      )}
      onClick={handleViewDetail}
    >
      {currentBorrow && (
        <div
          className={cn(
            'px-3 py-1.5 flex items-center justify-between text-xs border-b',
            isOverdue
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-blue-500/10 border-blue-500/30',
          )}
        >
          <div className="flex items-center gap-1.5">
            {isOverdue ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <CalendarClock className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className={isOverdue ? 'text-red-400 font-medium' : 'text-blue-400 font-medium'}>
              {isOverdue ? '已逾期' : '借出中'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {currentBorrow.borrower}
            </span>
            <span className="flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              {formatDate(currentBorrow.expectedReturnDate)}
            </span>
          </div>
        </div>
      )}
      <div className="flex">
        <div className="w-28 h-28 flex-shrink-0 bg-slate-900">
          {material.images.length > 0 ? (
            <img
              src={material.images[0]}
              alt={material.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <FolderKanban className="w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-semibold text-slate-100 truncate">{material.name}</h3>
            <StatusBadge type="material" status={material.status} />
          </div>
          <p className="text-xs text-slate-400 mb-1">
            {material.brand} · {material.specification}
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
              {material.color}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">
              {material.materialType}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 text-xs bg-blue-900/50 text-blue-300 rounded font-mono">
              {material.cabinetLocation}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-400">
              {formatPrice(material.priceMin, material.priceMax)}
            </span>
            <span className="text-xs text-slate-500">库存: {material.stockQuantity}</span>
          </div>
        </div>
      </div>
      <div className="flex border-t border-slate-700" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetail();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-colors border-r border-slate-700"
        >
          <Eye className="w-3.5 h-3.5" />
          详情
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBorrow?.(material);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 transition-colors border-r border-slate-700"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          借出
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onProject?.(material);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 transition-colors"
        >
          <FolderKanban className="w-3.5 h-3.5" />
          关联
        </button>
      </div>
    </div>
  );
}
