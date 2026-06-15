import type {
  MaterialStatus,
  BorrowStatus,
  ProjectStage,
  SelectionStatus,
  RelationType,
  ProjectStatus,
  BorrowActionType,
} from '../types';

export const formatPrice = (min: number, max: number): string => {
  if (min === max) return `¥${min.toFixed(2)}`;
  return `¥${min.toFixed(2)} - ¥${max.toFixed(2)}`;
};

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDaysRemaining = (expectedReturn: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expected = new Date(expectedReturn);
  expected.setHours(0, 0, 0, 0);
  const diff = expected.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getDaysOverdue = (expectedReturn: Date): number => {
  const days = getDaysRemaining(expectedReturn);
  return days < 0 ? Math.abs(days) : 0;
};

export const materialStatusLabels: Record<MaterialStatus, string> = {
  normal: '正常',
  discontinued: '已停产',
  need_restock: '待补样',
  not_recommended: '暂不推荐',
};

export const borrowStatusLabels: Record<BorrowStatus, string> = {
  reserved: '已预约',
  borrowed: '借出中',
  returned: '已归还',
  overdue: '已逾期',
};

export const projectStageLabels: Record<ProjectStage, string> = {
  concept: '概念阶段',
  scheme: '方案阶段',
  design: '设计阶段',
  construction: '施工阶段',
  completed: '已完成',
};

export const selectionStatusLabels: Record<SelectionStatus, string> = {
  alternative: '备选',
  selected: '已选定',
  proposed: '待确认',
  rejected: '已排除',
};

export const relationTypeLabels: Record<RelationType, string> = {
  replacement: '替代款',
  upgrade: '升级款',
  similar: '类似款',
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  active: '进行中',
  completed: '已完成',
  on_hold: '已暂停',
};

export const materialStatusColors: Record<MaterialStatus, string> = {
  normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  discontinued: 'bg-rose-100 text-rose-700 border-rose-200',
  need_restock: 'bg-amber-100 text-amber-700 border-amber-200',
  not_recommended: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const borrowStatusColors: Record<BorrowStatus, string> = {
  reserved: 'bg-purple-100 text-purple-700 border-purple-200',
  borrowed: 'bg-blue-100 text-blue-700 border-blue-200',
  returned: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  overdue: 'bg-orange-100 text-orange-700 border-orange-200',
};

export const borrowActionTypeLabels: Record<BorrowActionType, string> = {
  reserve: '预约',
  borrow: '借出',
  extend: '续借',
  return: '归还',
  cancel_reserve: '取消预约',
};

export const borrowActionTypeColors: Record<BorrowActionType, string> = {
  reserve: 'text-purple-400 bg-purple-500/10',
  borrow: 'text-blue-400 bg-blue-500/10',
  extend: 'text-cyan-400 bg-cyan-500/10',
  return: 'text-emerald-400 bg-emerald-500/10',
  cancel_reserve: 'text-slate-400 bg-slate-500/10',
};

export const selectionStatusColors: Record<SelectionStatus, string> = {
  alternative: 'bg-slate-100 text-slate-700 border-slate-200',
  selected: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  proposed: 'bg-amber-100 text-amber-700 border-amber-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const projectStatusColors: Record<ProjectStatus, string> = {
  active: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  on_hold: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const projectStageColors: Record<ProjectStage, string> = {
  concept: 'bg-purple-100 text-purple-700 border-purple-200',
  scheme: 'bg-blue-100 text-blue-700 border-blue-200',
  design: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  construction: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};
