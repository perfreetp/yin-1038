import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { analyticsService } from '../services/analyticsService';
import type { StatisticsData } from '../types';
import { formatPrice } from '../utils/format';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  Package,
  ClipboardList,
  AlertTriangle,
  FolderKanban,
  RefreshCw,
  TrendingUp,
  Building2,
} from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [usageData, setUsageData] = useState<{ name: string; count: number }[]>([]);
  const [borrowData, setBorrowData] = useState<{ name: string; count: number }[]>([]);
  const [trendData, setTrendData] = useState<{ month: string; count: number }[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, usage, borrow, trend] = await Promise.all([
        analyticsService.getStatistics(),
        analyticsService.getMaterialUsageFrequency(),
        analyticsService.getBorrowFrequency(),
        analyticsService.getMonthlyBorrowTrend(),
      ]);
      setStatistics(stats);
      setUsageData(usage);
      setBorrowData(borrow);
      setTrendData(trend);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <Layout
        sidebarCurrentPath="/analytics"
        onSidebarNavigate={navigate}
        headerTitle="统计分析"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-500">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      sidebarCurrentPath="/analytics"
      onSidebarNavigate={navigate}
      headerTitle="统计分析"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新数据
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">材料总数</p>
                <p className="text-3xl font-bold text-white mt-1">{statistics?.totalMaterials || 0}</p>
                <p className="text-blue-400/70 text-xs mt-1">个样本</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-sm font-medium">借出中</p>
                <p className="text-3xl font-bold text-white mt-1">{statistics?.totalBorrowed || 0}</p>
                <p className="text-amber-400/70 text-xs mt-1">个样本</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-medium">已逾期</p>
                <p className="text-3xl font-bold text-white mt-1">{statistics?.totalOverdue || 0}</p>
                <p className="text-red-400/70 text-xs mt-1">个样本</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-sm font-medium">项目总数</p>
                <p className="text-3xl font-bold text-white mt-1">{statistics?.totalProjects || 0}</p>
                <p className="text-emerald-400/70 text-xs mt-1">个项目</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              材质类型分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics?.materialTypeStats || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(statistics?.materialTypeStats || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              材料状态分布
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics?.statusStats || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(statistics?.statusStats || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            材料选用频次排名 (TOP 15)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748B" />
                <YAxis dataKey="name" type="category" width={150} stroke="#64748B" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-400" />
            借用频次排名 (TOP 15)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={borrowData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748B" />
                <YAxis dataKey="name" type="category" width={150} stroke="#64748B" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            月度借用趋势 (近12个月)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="借用次数"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-cyan-400" />
              项目材料数量排行 (TOP 10)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics?.projectStats || []} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#64748B" />
                  <YAxis dataKey="name" type="category" width={150} stroke="#64748B" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Bar dataKey="count" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-400" />
              供应商材料分布
            </h3>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">供应商</th>
                    <th className="text-center px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">材料数</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">平均单价</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(statistics?.supplierStats || []).map((supplier, index) => (
                    <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-3 py-3 text-slate-300 text-sm">{supplier.name}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-medium">
                          {supplier.count}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-400 font-mono text-sm">
                        {formatPrice(supplier.avgPrice, supplier.avgPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
