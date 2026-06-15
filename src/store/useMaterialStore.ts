import { create } from 'zustand';
import type { Material, Supplier, Note, Alternative, FilterOptions } from '../types';

interface MaterialState {
  materials: Material[];
  suppliers: Supplier[];
  currentMaterial: Material | null;
  filterOptions: FilterOptions;
  loading: boolean;
  setMaterials: (materials: Material[]) => void;
  setSuppliers: (suppliers: Supplier[]) => void;
  setCurrentMaterial: (material: Material | null) => void;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  setLoading: (loading: boolean) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (material: Material) => void;
  deleteMaterial: (id: string) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplier: Supplier) => void;
}

export const useMaterialStore = create<MaterialState>((set) => ({
  materials: [],
  suppliers: [],
  currentMaterial: null,
  filterOptions: {},
  loading: false,
  setMaterials: (materials) => set({ materials }),
  setSuppliers: (suppliers) => set({ suppliers }),
  setCurrentMaterial: (material) => set({ currentMaterial: material }),
  setFilterOptions: (options) =>
    set((state) => ({
      filterOptions: { ...state.filterOptions, ...options },
    })),
  setLoading: (loading) => set({ loading }),
  addMaterial: (material) =>
    set((state) => ({ materials: [...state.materials, material] })),
  updateMaterial: (material) =>
    set((state) => ({
      materials: state.materials.map((m) => (m.id === material.id ? material : m)),
    })),
  deleteMaterial: (id) =>
    set((state) => ({
      materials: state.materials.filter((m) => m.id !== id),
    })),
  addSupplier: (supplier) =>
    set((state) => ({ suppliers: [...state.suppliers, supplier] })),
  updateSupplier: (supplier) =>
    set((state) => ({
      suppliers: state.suppliers.map((s) => (s.id === supplier.id ? supplier : s)),
    })),
}));
