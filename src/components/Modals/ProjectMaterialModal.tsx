import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Select } from '../Input';
import { projectService } from '../../services/projectService';
import { useProjectStore, useMaterialStore } from '../../store';
import type { Material, SelectionStatus, Project } from '../../types';
import { Package } from 'lucide-react';

interface ProjectMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  materials?: Material[];
  projects?: Project[];
  projectId?: string;
  onSuccess?: () => void;
}

export function ProjectMaterialModal({
  isOpen,
  onClose,
  material,
  materials: materialsProp,
  projects: projectsProp,
  projectId,
  onSuccess,
}: ProjectMaterialModalProps) {
  const { projects: storeProjects } = useProjectStore();
  const { materials: storeMaterials } = useMaterialStore();
  
  const projects = projectsProp || storeProjects;
  const materials = materialsProp || storeMaterials;
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [selectionStatus, setSelectionStatus] = useState<SelectionStatus>('alternative');
  const [version, setVersion] = useState('v1.0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (projectId) {
        setSelectedProjectId(projectId);
        setSelectedMaterialId('');
      } else if (projects.length > 0) {
        setSelectedProjectId(projects[0].id);
      }
      if (material) {
        setSelectedMaterialId(material.id);
      } else {
        setSelectedMaterialId('');
      }
      setSelectionStatus('alternative');
      setVersion('v1.0');
    }
  }, [isOpen, projects, material, projectId]);

  const getSelectedMaterial = (): Material | null => {
    if (material) return material;
    return materials.find((m) => m.id === selectedMaterialId) || null;
  };

  const getSelectedProject = (): Project | null => {
    if (projectId) {
      return projects.find((p) => p.id === projectId) || null;
    }
    return projects.find((p) => p.id === selectedProjectId) || null;
  };

  const selectedMaterial = getSelectedMaterial();
  const selectedProject = getSelectedProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial || !selectedProjectId) return;

    setLoading(true);
    try {
      await projectService.addMaterial(selectedProjectId, selectedMaterial.id, selectionStatus, version);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to associate material:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="关联到项目" size="md">
      {!projectId && projects.length > 0 && (
        <Select
          label="选择项目"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
        />
      )}

      {projectId && selectedProject && (
        <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
          <p className="text-sm text-slate-300">
            目标项目：<span className="font-medium text-slate-100">{selectedProject.name}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            负责人：{selectedProject.manager}
          </p>
        </div>
      )}

      {!material && materials.length > 0 && (
        <Select
          label="选择材料"
          value={selectedMaterialId}
          onChange={(e) => setSelectedMaterialId(e.target.value)}
        >
          <option value="">请选择要关联的材料</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} - {m.brand} ({m.cabinetLocation})
            </option>
          ))}
        </Select>
      )}

      {selectedMaterial && (
        <div className="mb-4 p-3 bg-slate-900 rounded border border-slate-700">
          <div className="flex items-center gap-3">
            {selectedMaterial.images && selectedMaterial.images.length > 0 ? (
              <img
                src={selectedMaterial.images[0]}
                alt={selectedMaterial.name}
                className="w-12 h-12 rounded-lg object-cover bg-slate-800"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                <Package className="w-6 h-6 text-slate-600" />
              </div>
            )}
            <div>
              <p className="text-sm text-slate-300">
                关联材料：<span className="font-medium text-slate-100">{selectedMaterial.name}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {selectedMaterial.brand} · {selectedMaterial.specification}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="选用状态"
            value={selectionStatus}
            onChange={(e) => setSelectionStatus(e.target.value as SelectionStatus)}
            options={[
              { value: 'alternative', label: '备选' },
              { value: 'selected', label: '已选定' },
              { value: 'proposed', label: '待确认' },
              { value: 'rejected', label: '已排除' },
            ]}
          />
          <Select
            label="方案版本"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            options={['v0.5', 'v1.0', 'v1.1', 'v1.2', 'v2.0'].map((v) => ({ value: v, label: v }))}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" loading={loading}>
            确认关联
          </Button>
        </div>
      </form>
    </Modal>
  );
}
