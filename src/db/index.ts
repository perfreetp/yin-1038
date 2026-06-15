import Dexie, { Table } from 'dexie';
import type {
  Material,
  Supplier,
  BorrowRecord,
  Project,
  ProjectMaterial,
  Note,
  Alternative,
} from '../types';

export class MaterialDatabase extends Dexie {
  materials!: Table<Material>;
  suppliers!: Table<Supplier>;
  borrowRecords!: Table<BorrowRecord>;
  projects!: Table<Project>;
  projectMaterials!: Table<ProjectMaterial>;
  notes!: Table<Note>;
  alternatives!: Table<Alternative>;

  constructor() {
    super('MaterialDB');

    this.version(1).stores({
      materials: 'id, name, brand, materialType, status, supplierId, cabinetLocation',
      suppliers: 'id, name',
      borrowRecords: 'id, materialId, borrower, status, borrowDate, expectedReturnDate',
      projects: 'id, name, status, manager',
      projectMaterials: 'id, projectId, materialId, selectionStatus',
      notes: 'id, materialId, createdAt',
      alternatives: 'id, materialId, alternativeMaterialId',
    });
  }
}

export const db = new MaterialDatabase();
