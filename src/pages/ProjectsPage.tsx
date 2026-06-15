import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';
import { ProjectModal, ProjectMaterialModal } from '../components/Modals';
import { projectService } from '../services/projectService';
import { useProjectStore, useMaterialStore } from '../store';
import type { Project, Material } from '../types';
import { formatDate } from '../utils/format';
import { Search, FolderKanban, Plus, FileText, Download, Trash2 } from 'lucide-react';

type TabType = 'active' | 'on_hold' | 'completed';

export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, setProjects } = useProjectStore();
  const { materials, setMaterials } = useMaterialStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const tabs = [
    { id: 'active' as const, label: '进行中', count: projects.filter((p) => p.status === 'active').length },
    { id: 'on_hold' as const, label: '已暂停', count: projects.filter((p) => p.status === 'on_hold').length },
    { id: 'completed' as const, label: '已完成', count: projects.filter((p) => p.status === 'completed').length },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, materialsData] = await Promise.all([
        projectService.getAll(activeTab),
        import('../services/materialService').then((m) => m.materialService.getAll()),
      ]);
      setProjects(projectsData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setProjectModalOpen(true);
  };

  const handleAddMaterial = () => {
    setSelectedMaterial(null);
    setMaterialModalOpen(true);
  };

  const handleExportList = async (project: Project) => {
    if (confirm(`确认导出 "${project.name}" 的材料清单？`)) {
      try {
        await projectService.exportMaterialList(project.id);
      } catch (error) {
        console.error('Failed to export:', error);
      }
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (confirm(`确认删除项目 "${project.name}"？此操作不可恢复。`)) {
      try {
        await projectService.delete(project.id);
        await loadData();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.manager.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  });

  return (
    <Layout
      sidebarCurrentPath="/projects"
      onSidebarNavigate={navigate}
      headerTitle="项目关联"
      onAddProject={() => {
        setSelectedProject(null);
        setProjectModalOpen(true);
      }}
      addButtonLabel="新增项目"
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
              placeholder="搜索项目名称、负责人、描述..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-500">加载中...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 mb-1">暂无项目</p>
              <p className="text-slate-600 text-sm">点击右上角"新增项目"开始创建</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-sm text-slate-500">负责人: {project.manager}</p>
                      </div>
                    </div>
                    <StatusBadge status={project.status} type="project" />
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span>阶段: {project.stage}</span>
                    <span>开始: {formatDate(project.startDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="flex-1" onClick={() => navigate(`/projects/${project.id}`)}>
                      <FileText className="w-4 h-4 mr-1" />
                      查看详情
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleExportList(project)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
                      编辑
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(project)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        onSuccess={loadData}
      />

      <ProjectMaterialModal
        isOpen={materialModalOpen}
        onClose={() => {
          setMaterialModalOpen(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
        materials={materials}
        projects={projects}
        onSuccess={loadData}
      />
    </Layout>
  );
}
