import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { MaterialModal, BorrowModal } from '../components/Modals';
import { BorrowTimeline } from '../components/BorrowTimeline';
import { materialService } from '../services/materialService';
import { borrowService } from '../services/borrowService';
import type { MaterialWithDetails, Material, Note, Alternative, BorrowRecord } from '../types';
import {
  ArrowLeft,
  Edit,
  ArrowRightLeft,
  FolderKanban,
  Trash2,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  User,
  Clock,
  Calendar,
  Tag,
  Package,
} from 'lucide-react';
import {
  formatPrice,
  formatDate,
  formatDateTime,
  materialStatusLabels,
  borrowStatusLabels,
  borrowStatusColors,
  relationTypeLabels,
  getDaysRemaining,
} from '../utils/format';

export function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<MaterialWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'basic' | 'alternatives' | 'supplier' | 'notes' | 'timeline'>('basic');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [alternativeModalOpen, setAlternativeModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);

  useEffect(() => {
    if (id) loadMaterial();
  }, [id]);

  const loadMaterial = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await materialService.getWithDetails(id);
      setMaterial(data);
    } catch (error) {
      console.error('Failed to load material:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (content: string, author: string) => {
    if (!id) return;
    await materialService.addNote(id, content, author);
    await loadMaterial();
  };

  const handleAddAlternative = async (alternativeId: string, relationType: string) => {
    if (!id) return;
    await materialService.addAlternative(id, alternativeId, relationType as 'replacement' | 'upgrade' | 'similar');
    await loadMaterial();
  };

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这个材料样本吗？此操作不可恢复。')) return;
    try {
      await materialService.delete(id);
      navigate('/materials');
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  const handleBorrow = () => {
    if (!material) return;
    setBorrowModalOpen(true);
  };

  if (loading) {
    return (
      <Layout
        sidebarCurrentPath="/materials"
        onSidebarNavigate={navigate}
        headerTitle="材料详情"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!material) {
    return (
      <Layout
        sidebarCurrentPath="/materials"
        onSidebarNavigate={navigate}
        headerTitle="材料详情"
      >
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-slate-400 mb-4">材料不存在或已被删除</p>
          <Button onClick={() => navigate('/materials')}>返回列表</Button>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'basic', label: '基础信息' },
    { id: 'alternatives', label: `替代款 (${material.alternatives?.length || 0})` },
    { id: 'supplier', label: '供应商' },
    { id: 'notes', label: `备注 (${material.notes?.length || 0})` },
    { id: 'timeline', label: `借用记录 (${material.borrowRecords?.length || 0})` },
  ] as const;

  return (
    <Layout
      sidebarCurrentPath="/materials"
      onSidebarNavigate={navigate}
      headerTitle="样本详情"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/materials')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回材料列表
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditModalOpen(true)}>
              <Edit className="w-4 h-4" />
              编辑
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBorrow}>
              <ArrowRightLeft className="w-4 h-4" />
              借出
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              删除
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="aspect-square bg-slate-900 relative">
                {material.images.length > 0 ? (
                  <>
                    <img
                      src={material.images[currentImageIndex]}
                      alt={material.name}
                      className="w-full h-full object-contain"
                    />
                    {material.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImageIndex((i) => (i === 0 ? material.images.length - 1 : i - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentImageIndex((i) => (i === material.images.length - 1 ? 0 : i + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {material.images.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentImageIndex(i)}
                              className={`w-2 h-2 rounded-full transition-colors ${i === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <FolderKanban className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-100">{material.name}</h2>
                <StatusBadge type="material" status={material.status} />
              </div>
              <p className="text-sm text-slate-400 mb-4">{material.brand} · {material.specification}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-1 border-b border-slate-700">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Tag className="w-4 h-4" /> 价格区间
                  </span>
                  <span className="text-emerald-400 font-medium">{formatPrice(material.priceMin, material.priceMax)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-700">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> 最小起订量
                  </span>
                  <span className="text-slate-300">{material.minOrderQuantity} 件</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-700">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> 柜位
                  </span>
                  <span className="text-blue-400 font-mono">{material.cabinetLocation}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> 库存
                  </span>
                  <span className="text-slate-300">{material.stockQuantity} 件</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex border-b border-slate-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'basic' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">基本信息</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-slate-500">材料名称</span>
                          <p className="text-sm text-slate-200">{material.name}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">品牌</span>
                          <p className="text-sm text-slate-200">{material.brand}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">规格</span>
                          <p className="text-sm text-slate-200">{material.specification}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">颜色</span>
                          <p className="text-sm text-slate-200">{material.color}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">材质</span>
                          <p className="text-sm text-slate-200">{material.materialType}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">其他信息</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-slate-500">材料状态</span>
                          <p className="text-sm text-slate-200">{materialStatusLabels[material.status]}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">单价区间</span>
                          <p className="text-sm text-slate-200">{formatPrice(material.priceMin, material.priceMax)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">最小起订量</span>
                          <p className="text-sm text-slate-200">{material.minOrderQuantity} 件</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">创建时间</span>
                          <p className="text-sm text-slate-200">{formatDateTime(material.createdAt)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">更新时间</span>
                          <p className="text-sm text-slate-200">{formatDateTime(material.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'alternatives' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-medium text-slate-500 uppercase">替代材料</h4>
                      <Button size="sm" onClick={() => setAlternativeModalOpen(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        添加替代款
                      </Button>
                    </div>
                    {material.alternatives && material.alternatives.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {material.alternatives.map((alt) => (
                          <div
                            key={alt.id}
                            className="flex gap-3 p-3 bg-slate-900 rounded border border-slate-700 hover:border-blue-500/50 cursor-pointer transition-colors"
                            onClick={() => navigate(`/materials/${alt.id}`)}
                          >
                            <div className="w-16 h-16 rounded overflow-hidden bg-slate-800 flex-shrink-0">
                              {alt.images.length > 0 ? (
                                <img src={alt.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate">{alt.name}</p>
                              <p className="text-xs text-slate-500">{alt.brand}</p>
                              <p className="text-xs text-emerald-400 mt-1">{formatPrice(alt.priceMin, alt.priceMax)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-8">暂无替代款</p>
                    )}
                  </div>
                )}

                {activeTab === 'supplier' && material.supplier && (
                  <div className="max-w-md">
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-4">供应商信息</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{material.supplier.name}</p>
                          <p className="text-xs text-slate-500">{material.supplier.contactPerson}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <a href={`tel:${material.supplier.phone}`} className="text-sm text-blue-400 hover:underline">
                          {material.supplier.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <a href={`mailto:${material.supplier.email}`} className="text-sm text-blue-400 hover:underline">
                          {material.supplier.email}
                        </a>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                        <p className="text-sm text-slate-300">{material.supplier.address}</p>
                      </div>
                      {material.supplier.notes && (
                        <div className="p-3 bg-slate-900 rounded border border-slate-700">
                          <p className="text-xs text-slate-500 mb-1">备注</p>
                          <p className="text-sm text-slate-300">{material.supplier.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-medium text-slate-500 uppercase">沟通备注</h4>
                      <Button size="sm" onClick={() => setNoteModalOpen(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        添加备注
                      </Button>
                    </div>
                    {material.notes && material.notes.length > 0 ? (
                      <div className="space-y-3">
                        {material.notes.map((note) => (
                          <div key={note.id} className="p-4 bg-slate-900 rounded border border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-400">{note.author}</span>
                              <span className="text-xs text-slate-500">{formatDateTime(note.createdAt)}</span>
                            </div>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-8">暂无备注</p>
                    )}
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <BorrowTimeline materialId={material.id} />
                )}
              </div>
            </div>

            {material.borrowRecords && material.borrowRecords.length > 0 && (
              <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700">
                <div className="px-6 py-4 border-b border-slate-700">
                  <h4 className="text-sm font-medium text-slate-200">借用记录</h4>
                </div>
                <div className="divide-y divide-slate-700">
                  {material.borrowRecords.slice(0, 5).map((record) => {
                    const daysRemaining = getDaysRemaining(record.expectedReturnDate);
                    return (
                      <div key={record.id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-200">
                            {record.borrower} <span className="text-slate-500">· {record.purpose}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(record.borrowDate)} 借出
                            {record.actualReturnDate && ` · ${formatDate(record.actualReturnDate)} 归还`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {record.status !== 'returned' && (
                            <span className={`text-xs ${daysRemaining < 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                              {daysRemaining >= 0 ? `剩余 ${daysRemaining} 天` : `逾期 ${Math.abs(daysRemaining)} 天`}
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${borrowStatusColors[record.status]}`}>
                            {borrowStatusLabels[record.status]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {material.projects && material.projects.length > 0 && (
              <div className="mt-6 bg-slate-800 rounded-lg border border-slate-700">
                <div className="px-6 py-4 border-b border-slate-700">
                  <h4 className="text-sm font-medium text-slate-200">关联项目</h4>
                </div>
                <div className="divide-y divide-slate-700">
                  {material.projects.map((project) => (
                    <div
                      key={project.id}
                      className="px-6 py-3 flex items-center justify-between hover:bg-slate-700/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div>
                        <p className="text-sm text-slate-200">{project.name}</p>
                        <p className="text-xs text-slate-500">负责人：{project.manager}</p>
                      </div>
                      <StatusBadge type="project" status={project.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MaterialModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        material={material}
        onSuccess={loadMaterial}
      />

      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSubmit={handleAddNote}
      />

      <AlternativeModal
        isOpen={alternativeModalOpen}
        onClose={() => setAlternativeModalOpen(false)}
        currentMaterialId={id || ''}
        onSubmit={handleAddAlternative}
      />

      <BorrowModal
        isOpen={borrowModalOpen}
        onClose={() => setBorrowModalOpen(false)}
        material={material}
        onSuccess={() => {
          loadMaterial();
        }}
      />
    </Layout>
  );
}

function NoteModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string, author: string) => void;
}) {
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !author.trim()) return;
    onSubmit(content.trim(), author.trim());
    setContent('');
    setAuthor('');
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">添加备注</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">备注人</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="请输入姓名"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">备注内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-y"
              rows={4}
              placeholder="请输入备注内容..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AlternativeModal({ isOpen, onClose, currentMaterialId, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  currentMaterialId: string;
  onSubmit: (alternativeId: string, relationType: string) => void;
}) {
  const [alternativeId, setAlternativeId] = useState('');
  const [relationType, setRelationType] = useState('replacement');
  const [materials, setMaterials] = useState<Material[]>([]);

  useEffect(() => {
    if (isOpen) loadMaterials();
  }, [isOpen, currentMaterialId]);

  const loadMaterials = async () => {
    const all = await materialService.getAll();
    setMaterials(all.filter((m) => m.id !== currentMaterialId));
    if (all.length > 1 && !alternativeId) {
      setAlternativeId(all[0].id === currentMaterialId ? all[1].id : all[0].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alternativeId) return;
    onSubmit(alternativeId, relationType);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">添加替代款</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">选择替代材料</label>
            <select
              value={alternativeId}
              onChange={(e) => setAlternativeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              required
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">关联类型</label>
            <select
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="replacement">替代款</option>
              <option value="upgrade">升级款</option>
              <option value="similar">类似款</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
            <Button type="submit">添加</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
