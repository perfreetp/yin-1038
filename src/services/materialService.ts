import { db } from '../db';
import type {
  Material,
  Supplier,
  Note,
  Alternative,
  FilterOptions,
  MaterialWithDetails,
} from '../types';
import { generateId } from '../utils/file';
import { isOverdue } from '../utils/date';

export const materialService = {
  async getAll(filter?: FilterOptions): Promise<Material[]> {
    let query = db.materials.toCollection();

    if (filter) {
      if (filter.materialType) {
        query = query.filter((m) => m.materialType === filter.materialType);
      }
      if (filter.supplierId) {
        query = query.filter((m) => m.supplierId === filter.supplierId);
      }
      if (filter.status) {
        query = query.filter((m) => m.status === filter.status);
      }
      if (filter.cabinetLocation) {
        query = query.filter((m) =>
          m.cabinetLocation.includes(filter.cabinetLocation!),
        );
      }
    }

    let materials = await query.toArray();

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      materials = materials.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.brand.toLowerCase().includes(searchLower) ||
          m.specification.toLowerCase().includes(searchLower) ||
          m.color.toLowerCase().includes(searchLower),
      );
    }

    return materials.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  async getById(id: string): Promise<Material | undefined> {
    return db.materials.get(id);
  },

  async getWithDetails(id: string): Promise<MaterialWithDetails | null> {
    const material = await db.materials.get(id);
    if (!material) return null;

    const supplier = await db.suppliers.get(material.supplierId);

    const alternativesRelations = await db.alternatives
      .where('materialId')
      .equals(id)
      .toArray();
    const alternativeIds = alternativesRelations.map((a) => a.alternativeMaterialId);
    const alternatives = await db.materials
      .toCollection()
      .filter((m) => alternativeIds.includes(m.id))
      .toArray();

    const notes = await db.notes
      .where('materialId')
      .equals(id)
      .reverse()
      .sortBy('createdAt');

    const borrowRecords = await db.borrowRecords
      .where('materialId')
      .equals(id)
      .reverse()
      .sortBy('borrowDate');

    const projectMaterials = await db.projectMaterials
      .where('materialId')
      .equals(id)
      .toArray();
    const projectIds = projectMaterials.map((pm) => pm.projectId);
    const projects = await db.projects
      .toCollection()
      .filter((p) => projectIds.includes(p.id))
      .toArray();

    return {
      ...material,
      supplier,
      alternatives,
      notes,
      borrowRecords,
      projects,
    };
  },

  async create(data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> {
    const now = new Date();
    const material: Material = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.materials.add(material);
    return material;
  },

  async update(id: string, data: Partial<Material>): Promise<Material | null> {
    const material = await db.materials.get(id);
    if (!material) return null;

    const updated: Material = {
      ...material,
      ...data,
      updatedAt: new Date(),
    };
    await db.materials.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.materials, db.notes, db.alternatives, db.projectMaterials], async () => {
      await db.materials.delete(id);
      await db.notes.where('materialId').equals(id).delete();
      await db.alternatives.where('materialId').equals(id).delete();
      await db.alternatives.where('alternativeMaterialId').equals(id).delete();
      await db.projectMaterials.where('materialId').equals(id).delete();
    });
  },

  async getAllSuppliers(): Promise<Supplier[]> {
    return db.suppliers.toArray();
  },

  async getSupplierById(id: string): Promise<Supplier | undefined> {
    return db.suppliers.get(id);
  },

  async createSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier> {
    const supplier: Supplier = {
      ...data,
      id: generateId(),
    };
    await db.suppliers.add(supplier);
    return supplier;
  },

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier | null> {
    const supplier = await db.suppliers.get(id);
    if (!supplier) return null;

    const updated: Supplier = { ...supplier, ...data };
    await db.suppliers.put(updated);
    return updated;
  },

  async addNote(materialId: string, content: string, author: string): Promise<Note> {
    const note: Note = {
      id: generateId(),
      materialId,
      content,
      author,
      createdAt: new Date(),
    };
    await db.notes.add(note);
    return note;
  },

  async addAlternative(
    materialId: string,
    alternativeMaterialId: string,
    relationType: 'replacement' | 'upgrade' | 'similar',
  ): Promise<Alternative> {
    const alternative: Alternative = {
      id: generateId(),
      materialId,
      alternativeMaterialId,
      relationType,
    };
    await db.alternatives.add(alternative);
    return alternative;
  },

  async removeAlternative(id: string): Promise<void> {
    await db.alternatives.delete(id);
  },

  getMaterialTypes(): string[] {
    return [
      '石材', '瓷砖', '木材', '金属', '玻璃', '涂料', '壁纸',
      '地板', '吊顶', '灯具', '五金', '洁具', '布艺', '其他',
    ];
  },

  getCabinetLocations(): string[] {
    return ['A-01', 'A-02', 'A-03', 'B-01', 'B-02', 'B-03', 'C-01', 'C-02', 'C-03'];
  },

  async checkAndUpdateOverdue(): Promise<void> {
    const borrowedRecords = await db.borrowRecords
      .where('status')
      .equals('borrowed')
      .toArray();

    for (const record of borrowedRecords) {
      if (isOverdue(record.expectedReturnDate)) {
        await db.borrowRecords.update(record.id, { status: 'overdue' });
      }
    }
  },
};
