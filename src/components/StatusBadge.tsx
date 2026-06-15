import { cn } from '../lib/utils';
import type { MaterialStatus, BorrowStatus, SelectionStatus, ProjectStatus, ProjectStage } from '../types';
import {
  materialStatusLabels,
  materialStatusColors,
  borrowStatusLabels,
  borrowStatusColors,
  selectionStatusLabels,
  selectionStatusColors,
  projectStatusLabels,
  projectStatusColors,
  projectStageLabels,
  projectStageColors,
} from '../utils/format';

interface StatusBadgeProps {
  type: 'material' | 'borrow' | 'selection' | 'project' | 'stage';
  status: MaterialStatus | BorrowStatus | SelectionStatus | ProjectStatus | ProjectStage;
  className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  let label: string;
  let colorClass: string;

  switch (type) {
    case 'material':
      label = materialStatusLabels[status as MaterialStatus];
      colorClass = materialStatusColors[status as MaterialStatus];
      break;
    case 'borrow':
      label = borrowStatusLabels[status as BorrowStatus];
      colorClass = borrowStatusColors[status as BorrowStatus];
      break;
    case 'selection':
      label = selectionStatusLabels[status as SelectionStatus];
      colorClass = selectionStatusColors[status as SelectionStatus];
      break;
    case 'project':
      label = projectStatusLabels[status as ProjectStatus];
      colorClass = projectStatusColors[status as ProjectStatus];
      break;
    case 'stage':
      label = projectStageLabels[status as ProjectStage];
      colorClass = projectStageColors[status as ProjectStage];
      break;
    default:
      label = String(status);
      colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
        colorClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
