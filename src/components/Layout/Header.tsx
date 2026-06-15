import { Plus, Database, RefreshCw } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useBorrowStore } from '../../store/useBorrowStore';
import { borrowService } from '../../services/borrowService';
import { materialService } from '../../services/materialService';
import { useEffect, useState } from 'react';

interface HeaderProps {
  title: string;
  onAddMaterial?: () => void;
  onAddProject?: () => void;
  addButtonLabel?: string;
}

export function Header({ title, onAddMaterial, onAddProject, addButtonLabel = '新增材料' }: HeaderProps) {
  const { openModal } = useUIStore();
  const { setBorrowRecords } = useBorrowStore();
  const [overdueCount, setOverdueCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadOverdueCount();
  }, []);

  const loadOverdueCount = async () => {
    const overdue = await borrowService.getOverdue();
    setOverdueCount(overdue.length);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await materialService.checkAndUpdateOverdue();
    const records = await borrowService.getAll();
    setBorrowRecords(records);
    await loadOverdueCount();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-100">{title}</h1>
        {overdueCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
            {overdueCount} 个逾期
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
        {onAddMaterial && (
          <button
            onClick={onAddMaterial}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            {addButtonLabel}
          </button>
        )}
        {onAddProject && (
          <button
            onClick={onAddProject}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增项目
          </button>
        )}
      </div>
    </header>
  );
}
