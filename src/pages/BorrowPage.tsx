import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { BorrowModal, ReturnModal } from '../components/Modals';
import { borrowService } from '../services/borrowService';
import { useBorrowStore, useMaterialStore } from '../store';
import type { BorrowRecordWithMaterial, Material } from '../types';
import { formatDate } from '../utils/format';
import { getDaysRemaining, getDaysOverdue } from '../utils/format';
import { ClipboardList, ArrowRightLeft, Package, Search } from 'lucide-react';

type TabType = 'borrowed' | 'returned' | 'overdue';

export function BorrowPage() {
  const navigate = useNavigate();
  const { borrowRecords, setBorrowRecords } = useBorrowStore();
  const { materials, setMaterials } = useMaterialStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('borrowed');
  const [searchQuery, setSearchQuery] = useState('');
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecordWithMaterial | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const tabs = [
    { id: 'borrowed' as const, label: '借用中', count: borrowRecords.filter((r) => r.status === 'borrowed').length },
    { id: 'overdue' as const, label: '已逾期', count: borrowRecords.filter((r) => r.status === 'overdue').length },
    { id: 'returned' as const, label: '已归还', count: borrowRecords.filter((r) => r.status === 'returned').length },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const records = await borrowService.getAllWithMaterial(activeTab);
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

  const filteredRecords = borrowRecords.filter((record) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.material.name.toLowerCase().includes(query) ||
      record.material.brand.toLowerCase().includes(query) ||
      record.borrower.toLowerCase().includes(query) ||
      record.purpose?.toLowerCase().includes(query)
    );
  }) as BorrowRecordWithMaterial[];

  return (
    <Layout
      sidebarCurrentPath="/borrow"
      onSidebarNavigate={navigate}
      headerTitle="借出登记"
      onAddMaterial={handleNewBorrow}
      addButtonLabel="新增借出"
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
              <p className="text-slate-400 mb-1">暂无借出记录</p>
              <p className="text-slate-600 text-sm">点击右上角"新增借出"开始登记</p>
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">借出日期</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">预计归还</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">用途</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
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
                          {record.status !== 'returned' && (
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
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
    </Layout>
  );
}
