export type MaterialStatus = 'normal' | 'discontinued' | 'need_restock' | 'not_recommended';
export type BorrowStatus = 'borrowed' | 'returned' | 'overdue';
export type ProjectStage = 'concept' | 'scheme' | 'design' | 'construction' | 'completed';
export type SelectionStatus = 'alternative' | 'selected' | 'proposed' | 'rejected';
export type RelationType = 'replacement' | 'upgrade' | 'similar';
export type ProjectStatus = 'active' | 'completed' | 'on_hold';

export interface Material {
  id: string;
  name: string;
  brand: string;
  specification: string;
  color: string;
  materialType: string;
  images: string[];
  cabinetLocation: string;
  stockQuantity: number;
  status: MaterialStatus;
  priceMin: number;
  priceMax: number;
  minOrderQuantity: number;
  supplierId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface BorrowRecord {
  id: string;
  materialId: string;
  borrower: string;
  borrowDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  purpose: string;
  status: BorrowStatus;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  stage: ProjectStage;
  manager: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  status: ProjectStatus;
}

export interface ProjectMaterial {
  id: string;
  projectId: string;
  materialId: string;
  selectionStatus: SelectionStatus;
  version: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  materialId: string;
  content: string;
  author: string;
  createdAt: Date;
}

export interface Alternative {
  id: string;
  materialId: string;
  alternativeMaterialId: string;
  relationType: RelationType;
}

export interface MaterialWithDetails extends Material {
  supplier?: Supplier;
  alternatives?: Material[];
  notes?: Note[];
  borrowRecords?: BorrowRecord[];
  projects?: Project[];
}

export interface ProjectWithMaterials extends Project {
  materials: {
    id: string;
    material: Material;
    selectionStatus: SelectionStatus;
    version: string;
  }[];
}

export interface BorrowRecordWithMaterial extends BorrowRecord {
  material: Material;
}

export interface FilterOptions {
  search?: string;
  materialType?: string;
  projectId?: string;
  supplierId?: string;
  status?: MaterialStatus | '';
  cabinetLocation?: string;
  borrowStatus?: 'borrowed' | 'overdue' | 'available' | '';
}

export interface StatisticsData {
  totalMaterials: number;
  totalBorrowed: number;
  totalOverdue: number;
  totalProjects: number;
  materialTypeStats: { name: string; count: number }[];
  statusStats: { name: string; count: number }[];
  projectStats: { name: string; count: number }[];
  supplierStats: { name: string; count: number; avgPrice: number }[];
}
