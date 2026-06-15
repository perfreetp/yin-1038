import Dexie, { Table } from 'dexie';
import type {
  Material,
  Supplier,
  BorrowRecord,
  Project,
  ProjectMaterial,
  Note,
  Alternative,
  BorrowTimelineEvent,
} from '../types';

export class MaterialDatabase extends Dexie {
  materials!: Table<Material>;
  suppliers!: Table<Supplier>;
  borrowRecords!: Table<BorrowRecord>;
  projects!: Table<Project>;
  projectMaterials!: Table<ProjectMaterial>;
  notes!: Table<Note>;
  alternatives!: Table<Alternative>;
  borrowTimelineEvents!: Table<BorrowTimelineEvent>;

  constructor() {
    super('MaterialDB');

    this.version(2).stores({
      materials: 'id, name, brand, materialType, status, supplierId, cabinetLocation',
      suppliers: 'id, name',
      borrowRecords: 'id, materialId, borrower, status, borrowDate, expectedReturnDate, reservationExpiryDate',
      projects: 'id, name, status, manager',
      projectMaterials: 'id, projectId, materialId, selectionStatus, [projectId+materialId]',
      notes: 'id, materialId, createdAt',
      alternatives: 'id, materialId, alternativeMaterialId',
      borrowTimelineEvents: 'id, materialId, borrowRecordId, timestamp',
    });
  }
}

export const db = new MaterialDatabase();
