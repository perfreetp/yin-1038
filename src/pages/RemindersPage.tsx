import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { ReturnModal } from '../components/Modals';
import { borrowService } from '../services/borrowService';
import { materialService } from '../services/materialService';
import { useBorrowStore, useMaterialStore } from '../store';
import type { BorrowRecordWithMaterial } from '../types';
import { formatDate } from '../utils/format';
import { getDaysRemaining, getDaysOverdue } from '../utils/format';
import { AlertTriangle, Bell, Package, Search, ArrowRightLeft, Clock, RefreshCw, CalendarClock, CheckCircle, XCircle } from 'lucide-react';

type TabType = 'overdue' | 'dueSoon' | 'reservationDue' | 'all';

export function RemindersPage() {
  const navigate = useNavigate();
  const { borrowRecords, setBorrowRecords } = useBorrowStore();
  const { setMaterials } = useMaterialStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overdue');
  const [searchQuery, setSearchQuery] = useState('');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecordWithMaterial | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      await materialService.checkAndUpdateOverdue();
      
      const [allRecords, materialsData] = await Promise.all([
        borrowService.getAllWithMaterial(),
        materialService.getAll(),
      ]);
      
      setBorrowRecords(allRecords);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnClick = (record: BorrowRecordWithMaterial) => {
    setSelectedRecord(record);
    setReturnModalOpen(true);
  };

  const handleExtendClick = async (record: BorrowRecordWithMaterial) => {
    if (confirm(`确认将 "${record.material.name}" 的借用期限延长7天？`)) {
      try {
        await borrowService.extendBorrow(record.id, 7);
        await loadData();
      } catch (error) {
        console.error('Failed to extend borrow:', error);
      }
    }
  };

  const handleConfirmBorrow = async (record: BorrowRecordWithMaterial) => {
    if (confirm(`确认将 "${record.material.name}" 的预约转为正式借出？`)) {
      try {
        await borrowService.confirmBorrow(record.id);
        await loadData();
      } catch (error) {
        console.error('Failed to confirm borrow:', error);
      }
    }
  };

  const handleCancelReservation = async (record: BorrowRecordWithMaterial) => {
    if (confirm(`确认取消 "${record.material.name}" 的预约？`)) {
      try {
        await borrowService.cancelReservation(record.id);
        await loadData();
      } catch (error) {
        console.error('Failed to cancel reservation:', error);
      }
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const activeRecords = borrowRecords as BorrowRecordWithMaterial[];
  
  const overdueRecords = activeRecords.filter((r) => r.status === 'overdue');
  const dueSoonRecords = activeRecords.filter((r) => {
    if (r.status !== 'borrowed') return false;
    const daysRemaining = getDaysRemaining(r.expectedReturnDate);
    return daysRemaining >= 0 && daysRemaining <= 3;
  });
  const reservationDueRecords = activeRecords.filter((r) => {
    if (r.status !== 'reserved' || !r.reservationExpiryDate) return false;
    const daysRemaining = getDaysRemaining(r.reservationExpiryDate);
    return daysRemaining >= 0 && daysRemaining <= 3;
  });

  const tabs = [
    { id: 'overdue' as const, label: '已逾期', count: overdueRecords.length, icon: AlertTriangle, color: 'text-red-400' },
    { id: 'dueSoon' as const, label: '即将到期', count: dueSoonRecords.length, icon: Clock, color: 'text-amber-400' },
    { id: 'reservationDue' as const, label: '预约到期', count: reservationDueRecords.length, icon: CalendarClock, color: 'text-purple-400' },
    { id: 'all' as const, label: '全部提醒', count: overdueRecords.length + dueSoonRecords.length + reservationDueRecords.length, icon: Bell, color: 'text-blue-400' },
  ];

  const getDisplayRecords = () => {
    switch (activeTab) {
      case 'overdue':
        return overdueRecords;
      case 'dueSoon':
        return dueSoonRecords;
      case 'reservationDue':
        return reservationDueRecords;
      case 'all':
        return [...overdueRecords, ...dueSoonRecords, ...reservationDueRecords];
      default:
        return [];
    }
  };

  const filteredRecords = getDisplayRecords().filter((record) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.material.name.toLowerCase().includes(query) ||
      record.material.brand.toLowerCase().includes(query) ||
      record.borrower.toLowerCase().includes(query)
    );
  });

  const totalOverdue = overdueRecords.length;
  const totalDueSoon = dueSoonRecords.length;
  const totalReservationDue = reservationDueRecords.length;

  return (
    <Layout
      sidebarCurrentPath="/reminders"
      onSidebarNavigate={navigate}
      headerTitle="到期提醒"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-medium">已逾期</p>
                <p className="text-3xl font-bold text-white mt-1">{totalOverdue}</p>
                <p className="text-red-400/70 text-xs mt-1">需要立即处理</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-sm font-medium">即将到期</p>
                <p className="text-3xl font-bold text-white mt-1">{totalDueSoon}</p>
                <p className="text-amber-400/70 text-xs mt-1">3天内需要归还</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">即将到期预约</p>
                <p className="text-3xl font-bold text-white mt-1">{totalReservationDue}</p>
                <p className="text-purple-400/70 text-xs mt-1">3天内到期的预约</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <CalendarClock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">待处理总数</p>
                <p className="text-3xl font-bold text-white mt-1">{totalOverdue + totalDueSoon + totalReservationDue}</p>
                <p className="text-blue-400/70 text-xs mt-1">需要关注的借用</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ''}`} />
                {tab.label}
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-800">{tab.count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索材料名称、品牌、借用人..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
          <Button variant="secondary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新状态
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-500">加载中...</p>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              {activeTab === 'overdue' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-medium mb-1">没有逾期记录</p>
                  <p className="text-slate-600 text-sm">所有借用都在有效期内</p>
                </>
              ) : activeTab === 'dueSoon' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-medium mb-1">没有即将到期的借用</p>
                  <p className="text-slate-600 text-sm">近期无需归还的样本</p>
                </>
              ) : activeTab === 'reservationDue' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <CalendarClock className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-medium mb-1">没有即将到期的预约</p>
                  <p className="text-slate-600 text-sm">近期无需处理的预约</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-medium mb-1">一切正常</p>
                  <p className="text-slate-600 text-sm">暂无需要处理的提醒</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">材料信息</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">借用人</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">日期</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">到期情况</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRecords.map((record) => {
                    const isOverdue = record.status === 'overdue';
                    const isReserved = record.status === 'reserved';
                    const bgColor = isOverdue ? 'bg-red-500/5' : isReserved ? 'bg-purple-500/5' : 'bg-amber-500/5';
                    return (
                      <tr key={record.id} className={`hover:bg-slate-800/30 transition-colors ${bgColor}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {record.material.images && record.material.images.length > 0 ? (
                              <img
                                src={record.material.images[0]}
                                alt={record.material.name}
                                className="w-12 h-12 rounded-lg object-cover bg-slate-800"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                                <Package className="w-6 h-6 text-slate-600" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-200">{record.material.name}</div>
                              <div className="text-sm text-slate-500">{record.material.brand} · {record.material.specification}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-slate-300">{record.borrower}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-slate-400">{formatDate(record.borrowDate)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            {isReserved && record.reservationExpiryDate ? (
                              <>
                                <span className="text-slate-400">预约有效期至: {formatDate(record.reservationExpiryDate)}</span>
                                <div className="text-xs text-purple-400 mt-0.5 font-medium">
                                  <CalendarClock className="w-3 h-3 inline mr-1" />
                                  剩余 {getDaysRemaining(record.reservationExpiryDate)} 天
                                </div>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-400">预计归还: {formatDate(record.expectedReturnDate)}</span>
                                {isOverdue ? (
                                  <div className="text-xs text-red-400 mt-0.5 font-medium">
                                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                                    已逾期 {getDaysOverdue(record.expectedReturnDate)} 天
                                  </div>
                                ) : (
                                  <div className="text-xs text-amber-400 mt-0.5 font-medium">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    剩余 {getDaysRemaining(record.expectedReturnDate)} 天
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={record.status} type="borrow" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {isReserved ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleConfirmBorrow(record)}
                                  className="bg-emerald-600 hover:bg-emerald-500"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  确认借出
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleCancelReservation(record)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  取消预约
                                </Button>
                              </>
                            ) : (
                              <>
                                {!isOverdue && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleExtendClick(record)}
                                  >
                                    续借7天
                                  </Button>
                                )}
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleReturnClick(record)}
                                >
                                  <ArrowRightLeft className="w-4 h-4 mr-1" />
                                  归还
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ReturnModal
        isOpen={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        onSuccess={loadData}
      />
    </Layout>
  );
}
