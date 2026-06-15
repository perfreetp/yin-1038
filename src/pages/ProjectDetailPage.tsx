import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { ProjectMaterialModal, BorrowModal } from '../components/Modals';
import { projectService } from '../services/projectService';
import { useProjectStore, useMaterialStore, useBorrowStore } from '../store';
import type { ProjectWithMaterials, SelectionStatus, Material } from '../types';
import { formatDate, formatPrice } from '../utils/format';
import { ArrowLeft, FolderKanban, Download, Plus, Trash2, Package, User, Calendar, FileText, ArrowRightLeft } from 'lucide-react';

const selectionStatusLabels: Record<SelectionStatus, string> = {
  selected: '已选定',
  alternative: '备选',
  proposed: '待确认',
  rejected: '已排除',
};

const selectionStatusColors: Record<SelectionStatus, string> = {
  selected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  alternative: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  proposed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  rejected: 'bg-slate-700/50 text-slate-400 border-slate-600',
};

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { setProjects } = useProjectStore();
  const { materials, setMaterials } = useMaterialStore();
  const { setBorrowRecords } = useBorrowStore();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectWithMaterials | null>(null);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projectData, materialsData, allProjects] = await Promise.all([
        projectService.getWithMaterials(id),
        import('../services/materialService').then((m) => m.materialService.getAll()),
        projectService.getAll(),
      ]);
      setProject(projectData);
      setMaterials(materialsData);
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (pmId: string, status: SelectionStatus) => {
    try {
      await projectService.updateMaterialSelection(pmId, status);
      await loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleRemoveMaterial = async (pmId: string, materialName: string) => {
    if (confirm(`确认从项目中移除 "${materialName}"？`)) {
      try {
        await projectService.removeMaterial(pmId);
        await loadData();
      } catch (error) {
        console.error('Failed to remove material:', error);
      }
    }
  };

  const handleExportList = async () => {
    if (!project) return;
    if (confirm(`确认导出 "${project.name}" 的材料清单？`)) {
      try {
        await projectService.exportMaterialList(project.id);
      } catch (error) {
        console.error('Failed to export:', error);
      }
    }
  };

  const handleAddMaterial = () => {
    setSelectedMaterial(null);
    setMaterialModalOpen(true);
  };

  const handleBorrowClick = (material: Material) => {
    setSelectedMaterial(material);
    setBorrowModalOpen(true);
  };

  if (loading) {
    return (
      <Layout
        sidebarCurrentPath="/projects"
        onSidebarNavigate={navigate}
        headerTitle="项目详情"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-500">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout
        sidebarCurrentPath="/projects"
        onSidebarNavigate={navigate}
        headerTitle="项目详情"
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 mb-1">项目不存在</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/projects')}>
              返回项目列表
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      sidebarCurrentPath="/projects"
      onSidebarNavigate={navigate}
      headerTitle={project.name}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回项目列表
          </Button>
        </div>

        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FolderKanban className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{project.name}</h1>
                <div className="flex items-center gap-3">
                  <StatusBadge status={project.status} type="project" />
                  <StatusBadge status={project.stage} type="stage" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleExportList}>
                <Download className="w-4 h-4 mr-1" />
                导出清单
              </Button>
              <Button variant="primary" onClick={handleAddMaterial}>
                <Plus className="w-4 h-4 mr-1" />
                添加材料
              </Button>
            </div>
          </div>

          {project.description && (
            <p className="text-slate-400 mb-4">{project.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">负责人:</span>
              <span className="text-slate-300">{project.manager}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">开始日期:</span>
              <span className="text-slate-300">{formatDate(project.startDate)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">关联材料:</span>
              <span className="text-slate-300">{project.materials.length} 个</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            关联材料 ({project.materials.length})
          </h2>

          {project.materials.length === 0 ? (
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 py-16 text-center">
              <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 mb-1">暂无关联材料</p>
              <p className="text-slate-600 text-sm mb-4">点击右上角"添加材料"开始关联</p>
              <Button variant="primary" size="sm" onClick={handleAddMaterial}>
                <Plus className="w-4 h-4 mr-1" />
                添加材料
              </Button>
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">材料信息</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">价格区间</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">柜位</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">版本</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">选用状态</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {project.materials.map((pm) => (
                        <tr key={pm.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {pm.material.images && pm.material.images.length > 0 ? (
                                <img
                                  src={pm.material.images[0]}
                                  alt={pm.material.name}
                                  className="w-12 h-12 rounded-lg object-cover bg-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => navigate(`/materials/${pm.material.id}`)}
                                />
                              ) : (
                                <div
                                  className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
                                  onClick={() => navigate(`/materials/${pm.material.id}`)}
                                >
                                  <Package className="w-6 h-6 text-slate-600" />
                                </div>
                              )}
                              <div>
                                <div
                                  className="font-medium text-slate-200 cursor-pointer hover:text-white transition-colors"
                                  onClick={() => navigate(`/materials/${pm.material.id}`)}
                                >
                                  {pm.material.name}
                                </div>
                                <div className="text-sm text-slate-500">{pm.material.brand} · {pm.material.specification}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-slate-400 font-mono text-sm">
                              {formatPrice(pm.material.priceMin, pm.material.priceMax)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-slate-400">{pm.material.cabinetLocation}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-slate-400 font-mono text-xs">{pm.version}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={pm.selectionStatus}
                                onChange={(e) => handleUpdateStatus(pm.id, e.target.value as SelectionStatus)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md border ${selectionStatusColors[pm.selectionStatus]} bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer`}
                              >
                                {Object.entries(selectionStatusLabels).map(([value, label]) => (
                                  <option key={value} value={value} className="bg-slate-900">
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/materials/${pm.material.id}`)}
                              >
                                查看
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleBorrowClick(pm.material)}
                              >
                                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMaterial(pm.id, pm.material.name)}
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
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
      </div>

      <ProjectMaterialModal
        isOpen={materialModalOpen}
        onClose={() => {
          setMaterialModalOpen(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
        materials={materials}
        projectId={project.id}
        onSuccess={loadData}
      />

      <BorrowModal
        isOpen={borrowModalOpen}
        onClose={() => {
          setBorrowModalOpen(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
        defaultPurpose={project?.name || ''}
        onSuccess={loadData}
      />
    </Layout>
  );
}
