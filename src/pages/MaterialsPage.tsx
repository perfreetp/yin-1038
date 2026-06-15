import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SearchBar } from '../components/SearchBar';
import { FilterPanel } from '../components/FilterPanel';
import { MaterialCard } from '../components/MaterialCard';
import { MaterialModal, BorrowModal, ProjectMaterialModal } from '../components/Modals';
import { materialService } from '../services/materialService';
import { useMaterialStore, useBorrowStore, useProjectStore } from '../store';
import type { Material, MaterialStatus, BorrowRecord } from '../types';
import { Package, Search } from 'lucide-react';

export function MaterialsPage() {
  const navigate = useNavigate();
  const { materials, setMaterials, suppliers, setSuppliers, filterOptions, setFilterOptions } = useMaterialStore();
  const { borrowRecords, setBorrowRecords } = useBorrowStore();
  const { projects, setProjects } = useProjectStore();
  const [loading, setLoading] = useState(true);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterOptions, searchQuery, materials.length]);

  const loadData = async () => {
    setLoading(true);
    try {
      await materialService.checkAndUpdateOverdue();
      const [materialsData, suppliersData, projectsData, borrowRecords] = await Promise.all([
        materialService.getAll(),
        materialService.getAllSuppliers(),
        import('../services/projectService').then(m => m.projectService.getAll()),
        import('../services/borrowService').then(m => m.borrowService.getAll()),
      ]);
      setMaterials(materialsData);
      setSuppliers(suppliersData);
      setProjects(projectsData);
      setBorrowRecords(borrowRecords);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    const filter = {
      ...filterOptions,
      search: searchQuery || undefined,
    };
    const filtered = await materialService.getAll(filter);
    setMaterials(filtered);
  };

  const handleBorrowClick = (material: Material) => {
    setSelectedMaterial(material);
    setBorrowModalOpen(true);
  };

  const handleProjectClick = (material: Material) => {
    setSelectedMaterial(material);
    setProjectModalOpen(true);
  };

  const handleResetFilters = () => {
    setFilterOptions({
      materialType: '',
      projectId: '',
      status: '',
      supplierId: '',
      cabinetLocation: '',
      borrowStatus: '',
    });
    setSearchQuery('');
  };

  const currentBorrowMap = useMemo(() => {
    const map = new Map<string, BorrowRecord>();
    const activeRecords = borrowRecords.filter(
      (r) => r.status === 'borrowed' || r.status === 'overdue',
    );
    for (const record of activeRecords) {
      const existing = map.get(record.materialId);
      if (!existing || record.borrowDate > existing.borrowDate) {
        map.set(record.materialId, record);
      }
    }
    return map;
  }, [borrowRecords]);

  const materialTypes = materialService.getMaterialTypes();
  const cabinetLocations = materialService.getCabinetLocations();
  const filteredMaterials = materials;

  return (
    <Layout
      sidebarCurrentPath="/materials"
      onSidebarNavigate={navigate}
      headerTitle="材料总览"
      onAddMaterial={() => setMaterialModalOpen(true)}
      addButtonLabel="新增材料"
    >
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索材料名称、品牌、规格、颜色..."
            className="flex-1"
          />
        </div>

        <FilterPanel
          materialType={filterOptions.materialType || ''}
          onMaterialTypeChange={(v) => setFilterOptions({ materialType: v })}
          projectId={filterOptions.projectId || ''}
          onProjectIdChange={(v) => setFilterOptions({ projectId: v })}
          projects={projects}
          status={(filterOptions.status as MaterialStatus) || ''}
          onStatusChange={(v) => setFilterOptions({ status: v })}
          supplierId={filterOptions.supplierId || ''}
          onSupplierIdChange={(v) => setFilterOptions({ supplierId: v })}
          cabinetLocation={filterOptions.cabinetLocation || ''}
          onCabinetLocationChange={(v) => setFilterOptions({ cabinetLocation: v })}
          borrowStatus={(filterOptions.borrowStatus as 'borrowed' | 'overdue' | 'available' | '') || ''}
          onBorrowStatusChange={(v) => setFilterOptions({ borrowStatus: v })}
          materialTypes={materialTypes}
          suppliers={suppliers}
          cabinetLocations={cabinetLocations}
          onReset={handleResetFilters}
        />

        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>共 {filteredMaterials.length} 个材料样本</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-500">加载中...</p>
            </div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 mb-1">未找到匹配的材料</p>
              <p className="text-slate-600 text-sm">尝试调整筛选条件或添加新材料</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                currentBorrow={currentBorrowMap.get(material.id)}
                onBorrow={handleBorrowClick}
                onProject={handleProjectClick}
              />
            ))}
          </div>
        )}
      </div>

      <MaterialModal
        isOpen={materialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
        onSuccess={loadData}
      />

      <BorrowModal
        isOpen={borrowModalOpen}
        onClose={() => {
          setBorrowModalOpen(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
        materials={materials}
        onSuccess={loadData}
      />

      <ProjectMaterialModal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
        onSuccess={loadData}
      />
    </Layout>
  );
}
