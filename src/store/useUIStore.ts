import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  currentView: string;
  modalOpen: boolean;
  modalType: string | null;
  modalData: unknown;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentView: 'materials',
  modalOpen: false,
  modalType: null,
  modalData: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCurrentView: (currentView) => set({ currentView }),
  openModal: (modalType, modalData = null) =>
    set({ modalOpen: true, modalType, modalData }),
  closeModal: () => set({ modalOpen: false, modalType: null, modalData: null }),
}));
