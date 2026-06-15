import { create } from 'zustand';
import type { BorrowRecord, BorrowRecordWithMaterial } from '../types';

interface BorrowState {
  borrowRecords: (BorrowRecord | BorrowRecordWithMaterial)[];
  loading: boolean;
  setBorrowRecords: (records: (BorrowRecord | BorrowRecordWithMaterial)[]) => void;
  setLoading: (loading: boolean) => void;
  addBorrowRecord: (record: BorrowRecord) => void;
  addBorrowRecords: (records: BorrowRecord[]) => void;
  updateBorrowRecord: (record: BorrowRecord) => void;
  deleteBorrowRecord: (id: string) => void;
}

export const useBorrowStore = create<BorrowState>((set) => ({
  borrowRecords: [],
  loading: false,
  setBorrowRecords: (borrowRecords) => set({ borrowRecords }),
  setLoading: (loading) => set({ loading }),
  addBorrowRecord: (record) =>
    set((state) => ({ borrowRecords: [...state.borrowRecords, record] })),
  addBorrowRecords: (records) =>
    set((state) => ({ borrowRecords: [...state.borrowRecords, ...records] })),
  updateBorrowRecord: (record) =>
    set((state) => ({
      borrowRecords: state.borrowRecords.map((r) =>
        r.id === record.id ? record : r,
      ),
    })),
  deleteBorrowRecord: (id) =>
    set((state) => ({
      borrowRecords: state.borrowRecords.filter((r) => r.id !== id),
    })),
}));
