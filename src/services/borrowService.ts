import { db } from '../db';
import type { BorrowRecord, BorrowRecordWithMaterial, BorrowTimelineEvent, BorrowActionType } from '../types';
import { generateId } from '../utils/file';
import { isOverdue, addDays } from '../utils/date';

const addTimelineEvent = async (
  materialId: string,
  actionType: BorrowActionType,
  actor: string,
  borrowRecordId: string,
  details?: BorrowTimelineEvent['details'],
): Promise<void> => {
  const event: BorrowTimelineEvent = {
    id: generateId(),
    materialId,
    actionType,
    actor,
    timestamp: new Date(),
    borrowRecordId,
    details,
  };
  await db.borrowTimelineEvents.add(event);
};

export const borrowService = {
  async getAll(status?: 'borrowed' | 'returned' | 'overdue' | 'reserved'): Promise<BorrowRecord[]> {
    let query = db.borrowRecords.toCollection();
    if (status) {
      query = query.filter((r) => r.status === status);
    }
    return query.reverse().sortBy('borrowDate');
  },

  async getAllWithMaterial(status?: 'borrowed' | 'returned' | 'overdue' | 'reserved'): Promise<BorrowRecordWithMaterial[]> {
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

  async getReservations(): Promise<BorrowRecordWithMaterial[]> {
    return this.getAllWithMaterial('reserved');
  },

  async getById(id: string): Promise<BorrowRecord | undefined> {
    return db.borrowRecords.get(id);
  },

  async getActiveBorrowByMaterial(materialId: string): Promise<BorrowRecord | null> {
    const records = await db.borrowRecords
      .where('materialId')
      .equals(materialId)
      .filter((r) => r.status === 'borrowed' || r.status === 'overdue' || r.status === 'reserved')
      .reverse()
      .sortBy('borrowDate');

    return records.length > 0 ? records[0] : null;
  },

  async create(data: Omit<BorrowRecord, 'id' | 'status'>): Promise<BorrowRecord> {
    const status = isOverdue(data.expectedReturnDate) ? 'overdue' : 'borrowed';
    const record: BorrowRecord = {
      ...data,
      id: generateId(),
      status,
    };
    await db.borrowRecords.add(record);

    await addTimelineEvent(record.materialId, 'borrow', record.borrower, record.id, {
      toStatus: status,
      borrowDate: record.borrowDate,
      expectedReturnDate: record.expectedReturnDate,
      purpose: record.purpose,
      notes: record.notes,
    });

    return record;
  },

  async reserve(data: Omit<BorrowRecord, 'id' | 'status'> & { reservationExpiryDate: Date }): Promise<BorrowRecord> {
    const record: BorrowRecord = {
      ...data,
      id: generateId(),
      status: 'reserved',
    };
    await db.borrowRecords.add(record);

    await addTimelineEvent(record.materialId, 'reserve', record.borrower, record.id, {
      toStatus: 'reserved',
      borrowDate: record.borrowDate,
      expectedReturnDate: record.expectedReturnDate,
      purpose: record.purpose,
      notes: record.notes,
    });

    return record;
  },

  async confirmBorrow(reservationId: string): Promise<BorrowRecord | null> {
    const record = await db.borrowRecords.get(reservationId);
    if (!record || record.status !== 'reserved') return null;

    const now = new Date();
    const status = isOverdue(record.expectedReturnDate) ? 'overdue' : 'borrowed';

    const updated: BorrowRecord = {
      ...record,
      status,
      borrowDate: now,
      originalReservationId: reservationId,
      reservationExpiryDate: undefined,
    };

    await db.borrowRecords.put(updated);

    await addTimelineEvent(record.materialId, 'borrow', record.borrower, record.id, {
      fromStatus: 'reserved',
      toStatus: status,
      borrowDate: now,
      expectedReturnDate: record.expectedReturnDate,
      purpose: record.purpose,
    });

    return updated;
  },

  async cancelReservation(reservationId: string): Promise<BorrowRecord | null> {
    const record = await db.borrowRecords.get(reservationId);
    if (!record || record.status !== 'reserved') return null;

    await addTimelineEvent(record.materialId, 'cancel_reserve', record.borrower, record.id, {
      fromStatus: 'reserved',
    });

    await db.borrowRecords.delete(reservationId);
    return record;
  },

  async bulkCreate(
    materialIds: string[],
    data: Omit<BorrowRecord, 'id' | 'status' | 'materialId'>,
  ): Promise<BorrowRecord[]> {
    const status = isOverdue(data.expectedReturnDate) ? 'overdue' : 'borrowed';
    const records: BorrowRecord[] = materialIds.map((materialId) => ({
      ...data,
      materialId,
      id: generateId(),
      status,
    }));

    await db.transaction('rw', [db.borrowRecords, db.borrowTimelineEvents], async () => {
      for (const record of records) {
        await db.borrowRecords.add(record);
        await addTimelineEvent(record.materialId, 'borrow', record.borrower, record.id, {
          toStatus: status,
          borrowDate: record.borrowDate,
          expectedReturnDate: record.expectedReturnDate,
          purpose: record.purpose,
          notes: record.notes,
        });
      }
    });

    return records;
  },

  async returnRecord(id: string, notes?: string): Promise<BorrowRecord | null> {
    const record = await db.borrowRecords.get(id);
    if (!record) return null;

    const actualReturnDate = new Date();
    const updated: BorrowRecord = {
      ...record,
      status: 'returned',
      actualReturnDate,
      notes: notes || record.notes,
    };
    await db.borrowRecords.put(updated);

    await addTimelineEvent(record.materialId, 'return', record.borrower, record.id, {
      fromStatus: record.status,
      toStatus: 'returned',
      actualReturnDate,
      notes: notes || record.notes,
    });

    return updated;
  },

  async update(id: string, data: Partial<BorrowRecord>): Promise<BorrowRecord | null> {
    const record = await db.borrowRecords.get(id);
    if (!record) return null;

    let status = record.status;
    if (data.expectedReturnDate && status !== 'returned' && status !== 'reserved') {
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

    await addTimelineEvent(record.materialId, 'extend', record.borrower, record.id, {
      fromStatus: record.status,
      toStatus: status,
      expectedReturnDate: newExpectedDate,
    });

    return updated;
  },

  async getTimeline(materialId: string): Promise<BorrowTimelineEvent[]> {
    return db.borrowTimelineEvents
      .where('materialId')
      .equals(materialId)
      .reverse()
      .sortBy('timestamp');
  },

  async getAllTimelineEvents(): Promise<BorrowTimelineEvent[]> {
    return db.borrowTimelineEvents
      .toCollection()
      .reverse()
      .sortBy('timestamp');
  },

  async checkAndUpdateOverdue(): Promise<void> {
    const now = new Date();

    const borrowedRecords = await db.borrowRecords
      .where('status')
      .equals('borrowed')
      .toArray();

    for (const record of borrowedRecords) {
      if (isOverdue(record.expectedReturnDate)) {
        await db.borrowRecords.update(record.id, { status: 'overdue' });
      }
    }

    const reservedRecords = await db.borrowRecords
      .where('status')
      .equals('reserved')
      .toArray();

    for (const record of reservedRecords) {
      if (record.reservationExpiryDate && record.reservationExpiryDate < now) {
        await this.cancelReservation(record.id);
      }
    }
  },

  getDefaultBorrowDays(): number {
    return 7;
  },
};
