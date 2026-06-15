import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input, TextArea, Select } from '../Input';
import { projectService } from '../../services/projectService';
import { useProjectStore } from '../../store/useProjectStore';
import { formatDateForInput } from '../../utils/date';
import type { Project, ProjectStage, ProjectStatus } from '../../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSuccess?: () => void;
}

export function ProjectModal({ isOpen, onClose, project, onSuccess }: ProjectModalProps) {
  const { addProject, updateProject } = useProjectStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stage: 'concept' as ProjectStage,
    manager: '',
    startDate: formatDateForInput(new Date()),
    description: '',
    status: 'active' as ProjectStatus,
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        stage: project.stage,
        manager: project.manager,
        startDate: formatDateForInput(project.startDate),
        description: project.description,
        status: project.status,
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        stage: 'concept',
        manager: '',
        startDate: formatDateForInput(new Date()),
        description: '',
        status: 'active',
      });
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (project) {
        const updated = await projectService.update(project.id, {
          ...formData,
          startDate: new Date(formData.startDate),
        });
        if (updated) updateProject(updated);
      } else {
        const created = await projectService.create({
          ...formData,
          startDate: new Date(formData.startDate),
        });
        addProject(created);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project ? '编辑项目' : '新增项目'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="项目名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入项目名称"
            required
          />
          <Input
            label="项目负责人"
            value={formData.manager}
            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
            placeholder="请输入负责人姓名"
            required
          />
          <Select
            label="项目阶段"
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value as ProjectStage })}
            options={[
              { value: 'concept', label: '概念阶段' },
              { value: 'scheme', label: '方案阶段' },
              { value: 'design', label: '设计阶段' },
              { value: 'construction', label: '施工阶段' },
              { value: 'completed', label: '已完成' },
            ]}
          />
          <Select
            label="项目状态"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
            options={[
              { value: 'active', label: '进行中' },
              { value: 'on_hold', label: '已暂停' },
              { value: 'completed', label: '已完成' },
            ]}
          />
          <Input
            label="开始日期"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>
        <TextArea
          label="项目描述"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="简要描述项目背景和需求"
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" loading={loading}>
            {project ? '保存修改' : '创建项目'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
