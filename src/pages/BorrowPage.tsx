import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { BorrowModal, BulkBorrowModal, ReturnModal } from '../components/Modals';
import { BorrowListExport } from '../components/BorrowListExport';
import { borrowService } from '../services/borrowService';
import { materialService } from '../services/materialService';
import { useBorrowStore, useMaterialStore } from '../store';
import type { BorrowRecordWithMaterial, Material } from '../types';
import { formatDate } from '../utils/format';
import { getDaysRemaining, getDaysOverdue } from '../utils/format';
import { ClipboardList, ArrowRightLeft, Package, Search, CheckSquare, Square, Download, CalendarClock, XCircle, CheckCircle, Plus } from 'lucide-react';

type TabType = 'borrowed' | 'returned' | 'overdue' | 'reserved';

export function BorrowPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { borrowRecords, setBorrowRecords } = useBorrowStore();
  const { materials, setMaterials } = useMaterialStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('borrowed');
  const [searchQuery, setSearchQuery] = useState('');
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [borrowModalMode, setBorrowModalMode] = useState<'borrow' | 'reserve'>('borrow');
  const [bulkBorrowModalOpen, setBulkBorrowModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecordWithMaterial | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const tabs = [
    { id: 'borrowed' as const, label: '借用中', count: borrowRecords.filter((r) => r.status === 'borrowed').length },
    { id: 'reserved' as const, label: '已预约', count: borrowRecords.filter((r) => r.status === 'reserved').length },
    { id: 'overdue' as const, label: '已逾期', count: borrowRecords.filter((r) => r.status === 'overdue').length },
    { id: 'returned' as const, label: '已归还', count: borrowRecords.filter((r) => r.status === 'returned').length },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    const state = location.state as { materialId?: string } | null;
    if (state?.materialId) {
      materialService.getById(state.materialId).then((m) => {
        if (m) {
          setSelectedMaterial(m);
          setBorrowModalMode('borrow');
          setBorrowModalOpen(true);
          navigate(location.pathname, { replace: true, state: {} });
        }
      });
    }
  }, [location.state]);

  const loadData = async () => {
    setLoading(true);
    try {
      let records: BorrowRecordWithMaterial[];
      if (activeTab === 'reserved') {
        records = await borrowService.getReservations();
      } else {
        records = await borrowService.getAllWithMaterial(activeTab);
      }
      const materialsData = await import('../services/materialService').then((m) => m.materialService.getAll());
      setBorrowRecords(records);
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

  const handleNewBorrow = () => {
    setSelectedMaterial(null);
    setBorrowModalMode('borrow');
    setBorrowModalOpen(true);
  };

  const handleNewReservation = () => {
    setSelectedMaterial(null);
    setBorrowModalMode('reserve');
    setBorrowModalOpen(true);
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

  const filteredRecords = borrowRecords.filter((record) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const materialName = 'material' in record ? record.material.name : '';
    const materialBrand = 'material' in record ? record.material.brand : '';
    return (
      materialName.toLowerCase().includes(query) ||
      materialBrand.toLowerCase().includes(query) ||
      record.borrower.toLowerCase().includes(query) ||
      record.purpose?.toLowerCase().includes(query)
    );
  }) as BorrowRecordWithMaterial[];

  useEffect(() => {
    setSelectedIds(filteredRecords.map((r) => r.id));
  }, [filteredRecords]);

  const allSelected = filteredRecords.length > 0 && selectedIds.length === filteredRecords.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < filteredRecords.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  };

  const selectedRecords = filteredRecords.filter((r) => selectedIds.includes(r.id));

  return (
    <Layout
      sidebarCurrentPath="/borrow"
      onSidebarNavigate={navigate}
      headerTitle="借出登记"
    >
      <div className="space-y-4">
        <div className="flex border-b border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-800">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索材料名称、品牌、借用人、用途..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => setExportModalOpen(true)}
              >
                <Download className="w-4 h-4 mr-1" />
                导出选中 ({selectedIds.length})
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setBulkBorrowModalOpen(true)}
            >
              <CheckSquare className="w-4 h-4 mr-1" />
              批量借出
            </Button>
            <Button
              variant="secondary"
              onClick={handleNewReservation}
            >
              <CalendarClock className="w-4 h-4 mr-1" />
              预约借出
            </Button>
            <Button
              variant="primary"
              onClick={handleNewBorrow}
            >
              <Plus className="w-4 h-4 mr-1" />
              新增借出
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-500">加载中...</p>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 mb-1">暂无{activeTab === 'reserved' ? '预约' : '借出'}记录</p>
              <p className="text-slate-600 text-sm">点击右上角按钮开始登记</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="w-12 px-4 py-3">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                      >
                        {allSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : someSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-400 opacity-60" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">材料信息</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">借用人</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">日期</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{activeTab === 'reserved' ? '预约有效期' : '预计归还'}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">用途</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRecords.map((record) => {
                    const isSelected = selectedIds.includes(record.id);
                    return (
                      <tr key={record.id} className={`hover:bg-slate-800/30 transition-colors ${isSelected ? 'bg-blue-900/10' : ''}`}>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => toggleSelect(record.id)}
                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        </td>
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
                          {activeTab === 'reserved' && record.reservationExpiryDate ? (
                            <>
                              <span className="text-slate-400">有效期至: {formatDate(record.reservationExpiryDate)}</span>
                              <div className="text-xs text-purple-400 mt-0.5">
                                <CalendarClock className="w-3 h-3 inline mr-1" />
                                剩余 {getDaysRemaining(record.reservationExpiryDate)} 天
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-slate-400">{formatDate(record.expectedReturnDate)}</span>
                              {record.status === 'borrowed' && (
                                <div className="text-xs text-amber-400 mt-0.5">
                                  剩余 {getDaysRemaining(record.expectedReturnDate)} 天
                                </div>
                              )}
                              {record.status === 'overdue' && (
                                <div className="text-xs text-red-400 mt-0.5">
                                  逾期 {getDaysOverdue(record.expectedReturnDate)} 天
                                </div>
                              )}
                              {record.status === 'returned' && record.actualReturnDate && (
                                <div className="text-xs text-emerald-400 mt-0.5">
                                  实际归还: {formatDate(record.actualReturnDate)}
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
                        <span className="text-slate-400 text-sm">{record.purpose || '-'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {record.status === 'reserved' ? (
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
                          ) : record.status !== 'returned' ? (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleExtendClick(record)}
                              >
                                续借7天
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleReturnClick(record)}
                              >
                                <ArrowRightLeft className="w-4 h-4 mr-1" />
                                归还
                              </Button>
                            </>
                          ) : null}
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

      <BorrowModal
        isOpen={borrowModalOpen}
        onClose={() => {
          setBorrowModalOpen(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
        materials={materials}
        onSuccess={loadData}
        mode={borrowModalMode}
        onChangeMode={setBorrowModalMode}
      />

      <BulkBorrowModal
        isOpen={bulkBorrowModalOpen}
        onClose={() => setBulkBorrowModalOpen(false)}
        materials={materials}
        onSuccess={loadData}
      />

      <ReturnModal
        isOpen={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
        onSuccess={loadData}
      />

      <BorrowListExport
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        records={selectedRecords}
      />
    </Layout>
  );
}
