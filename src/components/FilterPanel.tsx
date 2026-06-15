import { X, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import type { MaterialStatus } from '../types';
import { materialStatusLabels } from '../utils/format';

interface FilterPanelProps {
  materialType: string;
  onMaterialTypeChange: (value: string) => void;
  projectId: string;
  onProjectIdChange: (value: string) => void;
  projects: { id: string; name: string }[];
  status: MaterialStatus | '';
  onStatusChange: (value: MaterialStatus | '') => void;
  supplierId: string;
  onSupplierIdChange: (value: string) => void;
  cabinetLocation: string;
  onCabinetLocationChange: (value: string) => void;
  materialTypes: string[];
  suppliers: { id: string; name: string }[];
  cabinetLocations: string[];
  onReset: () => void;
  className?: string;
}

export function FilterPanel({
  materialType,
  onMaterialTypeChange,
  projectId,
  onProjectIdChange,
  projects,
  status,
  onStatusChange,
  supplierId,
  onSupplierIdChange,
  cabinetLocation,
  onCabinetLocationChange,
  materialTypes,
  suppliers,
  cabinetLocations,
  onReset,
  className,
}: FilterPanelProps) {
  const hasFilters = materialType || projectId || status || supplierId || cabinetLocation;

  return (
    <div className={cn('bg-slate-800/50 rounded-lg p-4 border border-slate-700', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">筛选条件</span>
        </div>
        {hasFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-3 h-3" />
            重置
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">材质类型</label>
          <select
            value={materialType}
            onChange={(e) => onMaterialTypeChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">全部</option>
            {materialTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">项目方案</label>
          <select
            value={projectId}
            onChange={(e) => onProjectIdChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">全部</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">材料状态</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as MaterialStatus | '')}
            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">全部</option>
            {Object.entries(materialStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">供应商</label>
          <select
            value={supplierId}
            onChange={(e) => onSupplierIdChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">全部</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">存放柜位</label>
          <select
            value={cabinetLocation}
            onChange={(e) => onCabinetLocationChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">全部</option>
            {cabinetLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
