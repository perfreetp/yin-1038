import { db } from '../db';
import type { Project, ProjectMaterial, ProjectWithMaterials, SelectionStatus } from '../types';
import { generateId } from '../utils/file';
import { exportToCSV } from '../utils/file';
import { formatDate, formatPrice, materialStatusLabels } from '../utils/format';

export const projectService = {
  async getAll(status?: 'active' | 'completed' | 'on_hold'): Promise<Project[]> {
    let query = db.projects.toCollection();
    if (status) {
      query = query.filter((p) => p.status === status);
    }
    return query.reverse().sortBy('startDate');
  },

  async getById(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  },

  async getWithMaterials(id: string): Promise<ProjectWithMaterials | null> {
    const project = await db.projects.get(id);
    if (!project) return null;

    const projectMaterials = await db.projectMaterials
      .where('projectId')
      .equals(id)
      .toArray();

    const materialIds = projectMaterials.map((pm) => pm.materialId);
    const materials = await db.materials
      .toCollection()
      .filter((m) => materialIds.includes(m.id))
      .toArray();
    const materialMap = new Map(materials.map((m) => [m.id, m]));

    return {
      ...project,
      materials: projectMaterials.map((pm) => ({
        id: pm.id,
        material: materialMap.get(pm.materialId)!,
        selectionStatus: pm.selectionStatus,
        version: pm.version,
      })),
    };
  },

  async create(data: Omit<Project, 'id'>): Promise<Project> {
    const project: Project = {
      ...data,
      id: generateId(),
    };
    await db.projects.add(project);
    return project;
  },

  async update(id: string, data: Partial<Project>): Promise<Project | null> {
    const project = await db.projects.get(id);
    if (!project) return null;

    const updated: Project = { ...project, ...data };
    await db.projects.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.projects, db.projectMaterials], async () => {
      await db.projects.delete(id);
      await db.projectMaterials.where('projectId').equals(id).delete();
    });
  },

  async addMaterial(
    projectId: string,
    materialId: string,
    selectionStatus: SelectionStatus = 'alternative',
    version: string = 'v1.0',
  ): Promise<ProjectMaterial> {
    const existing = await db.projectMaterials
      .where('[projectId+materialId]')
      .equals([projectId, materialId])
      .first();

    if (existing) {
      const updated: ProjectMaterial = {
        ...existing,
        selectionStatus,
        version,
      };
      await db.projectMaterials.put(updated);
      return updated;
    }

    const pm: ProjectMaterial = {
      id: generateId(),
      projectId,
      materialId,
      selectionStatus,
      version,
      createdAt: new Date(),
    };
    await db.projectMaterials.add(pm);
    return pm;
  },

  async updateMaterialSelection(
    id: string,
    selectionStatus: SelectionStatus,
  ): Promise<ProjectMaterial | null> {
    const pm = await db.projectMaterials.get(id);
    if (!pm) return null;

    const updated: ProjectMaterial = {
      ...pm,
      selectionStatus,
    };
    await db.projectMaterials.put(updated);
    return updated;
  },

  async removeMaterial(id: string): Promise<void> {
    await db.projectMaterials.delete(id);
  },

  async getMaterialIdsByProject(projectId: string): Promise<string[]> {
    const pms = await db.projectMaterials
      .where('projectId')
      .equals(projectId)
      .toArray();
    return pms.map((pm) => pm.materialId);
  },

  async getProjectsByMaterial(materialId: string): Promise<Project[]> {
    const pms = await db.projectMaterials
      .where('materialId')
      .equals(materialId)
      .toArray();
    const projectIds = pms.map((pm) => pm.projectId);
    return db.projects
      .toCollection()
      .filter((p) => projectIds.includes(p.id))
      .toArray();
  },

  async exportMaterialList(projectId: string): Promise<void> {
    const projectWithMaterials = await this.getWithMaterials(projectId);
    if (!projectWithMaterials) return;

    const exportData = projectWithMaterials.materials.map(({ material, selectionStatus, version }) => ({
      材料名称: material.name,
      品牌: material.brand,
      规格: material.specification,
      颜色: material.color,
      材质: material.materialType,
      价格区间: formatPrice(material.priceMin, material.priceMax),
      最小起订量: material.minOrderQuantity,
      存放柜位: material.cabinetLocation,
      库存数量: material.stockQuantity,
      材料状态: materialStatusLabels[material.status],
      选用状态: selectionStatus,
      版本: version,
    }));

    exportToCSV(exportData, `${projectWithMaterials.name}-材料清单-${formatDate(new Date())}`);
  },
};
