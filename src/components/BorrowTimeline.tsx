import { useState, useEffect } from 'react';
import { Clock, User, Calendar, FileText, CalendarClock, CheckCircle2, XCircle, RotateCcw, CalendarX } from 'lucide-react';
import { borrowService } from '../services/borrowService';
import type { BorrowTimelineEvent, BorrowActionType } from '../types';
import {
  formatDateTime,
  formatDate,
  borrowActionTypeLabels,
  borrowActionTypeColors,
} from '../utils/format';

interface BorrowTimelineProps {
  materialId: string;
}

const actionIcons: Record<BorrowActionType, React.ReactNode> = {
  reserve: <CalendarClock className="w-4 h-4" />,
  borrow: <Calendar className="w-4 h-4" />,
  extend: <RotateCcw className="w-4 h-4" />,
  return: <CheckCircle2 className="w-4 h-4" />,
  cancel_reserve: <XCircle className="w-4 h-4" />,
};

export function BorrowTimeline({ materialId }: BorrowTimelineProps) {
  const [events, setEvents] = useState<BorrowTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [materialId]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const data = await borrowService.getTimeline(materialId);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Clock className="w-12 h-12 text-slate-700 mb-3" />
        <p className="text-slate-400">暂无借用记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative pl-10">
            <div
              className={`absolute left-0 w-9 h-9 rounded-full flex items-center justify-center border-2 border-slate-800 ${borrowActionTypeColors[event.actionType]}`}
            >
              {actionIcons[event.actionType]}
            </div>
            <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${borrowActionTypeColors[event.actionType]}`}>
                    {borrowActionTypeLabels[event.actionType]}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <User className="w-3 h-3" />
                    {event.actor}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(event.timestamp)}
                </span>
              </div>
              {event.details && (
                <div className="space-y-1.5 text-sm">
                  {event.details.borrowDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-400">借出日期：</span>
                      <span className="text-slate-300">{formatDate(event.details.borrowDate)}</span>
                    </div>
                  )}
                  {event.details.expectedReturnDate && (
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-400">预计归还：</span>
                      <span className="text-slate-300">{formatDate(event.details.expectedReturnDate)}</span>
                    </div>
                  )}
                  {event.details.actualReturnDate && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-slate-400">实际归还：</span>
                      <span className="text-emerald-400">{formatDate(event.details.actualReturnDate)}</span>
                    </div>
                  )}
                  {event.details.purpose && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                      <span className="text-slate-400">用途：</span>
                      <span className="text-slate-300">{event.details.purpose}</span>
                    </div>
                  )}
                  {event.details.notes && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-500 mt-0.5" />
                      <span className="text-slate-400">备注：</span>
                      <span className="text-slate-300">{event.details.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
