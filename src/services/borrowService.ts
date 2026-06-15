import { db } from '../db';
import type { BorrowRecord, BorrowRecordWithMaterial } from '../types';
import { generateId } from '../utils/file';
import { isOverdue, addDays } from '../utils/date';

export const borrowService = {
  async getAll(status?: 'borrowed' | 'returned' | 'overdue'): Promise<BorrowRecord[]> {
    let query = db.borrowRecords.toCollection();
    if (status) {
      query = query.filter((r) => r.status === status);
    }
    return query.reverse().sortBy('borrowDate');
  },

  async getAllWithMaterial(status?: 'borrowed' | 'returned' | 'overdue'): Promise<BorrowRecordWithMaterial[]> {
    const records = await this.getAll(status);
    const materialIds = [...new Set(records.map((r) => r.materialId))];
    const materials = await db.materials
      .toCollection()
      .filter((m) => materialIds.includes(m.id))
      .toArray();
    const materialMap = new Map(materials.map((m) => [m.id, m]));

    return records.map((r) => ({
      ...r,
      material: materialMap.get(r.materialId)!,
    }));
  },

  async getById(id: string): Promise<BorrowRecord | undefined> {
    return db.borrowRecords.get(id);
  },

  async create(data: Omit<BorrowRecord, 'id' | 'status'>): Promise<BorrowRecord> {
    const status = isOverdue(data.expectedReturnDate) ? 'overdue' : 'borrowed';
    const record: BorrowRecord = {
      ...data,
      id: generateId(),
      status,
    };
    await db.borrowRecords.add(record);
    return record;
  },

  async returnRecord(id: string, notes?: string): Promise<BorrowRecord | null> {
    const record = await db.borrowRecords.get(id);
    if (!record) return null;

    const updated: BorrowRecord = {
      ...record,
      status: 'returned',
      actualReturnDate: new Date(),
      notes: notes || record.notes,
    };
    await db.borrowRecords.put(updated);
    return updated;
  },

  async update(id: string, data: Partial<BorrowRecord>): Promise<BorrowRecord | null> {
    const record = await db.borrowRecords.get(id);
    if (!record) return null;

    let status = record.status;
    if (data.expectedReturnDate && status !== 'returned') {
      status = isOverdue(data.expectedReturnDate) ? 'overdue' : 'borrowed';
    }

    const updated: BorrowRecord = {
      ...record,
      ...data,
      status,
    };
    await db.borrowRecords.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.borrowRecords.delete(id);
  },

  async getOverdue(): Promise<BorrowRecordWithMaterial[]> {
    return this.getAllWithMaterial('overdue');
  },

  async getBorrowedByMaterial(materialId: string): Promise<BorrowRecord[]> {
    return db.borrowRecords
      .where('materialId')
      .equals(materialId)
      .reverse()
      .sortBy('borrowDate');
  },

  async extendBorrow(id: string, days: number): Promise<BorrowRecord | null> {
    const record = await db.borrowRecords.get(id);
    if (!record) return null;

    const newExpectedDate = addDays(record.expectedReturnDate, days);
    const status = isOverdue(newExpectedDate) ? 'overdue' : 'borrowed';

    const updated: BorrowRecord = {
      ...record,
      expectedReturnDate: newExpectedDate,
      status,
    };
    await db.borrowRecords.put(updated);
    return updated;
  },

  getDefaultBorrowDays(): number {
    return 7;
  },
};
