import { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { Input, TextArea, Select } from '../Input';
import { materialService } from '../../services/materialService';
import { useMaterialStore } from '../../store/useMaterialStore';
import { handleFileUpload } from '../../utils/file';
import type { Material, MaterialStatus } from '../../types';
import { Upload, X, Image } from 'lucide-react';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material?: Material | null;
  onSuccess?: () => void;
}

export function MaterialModal({ isOpen, onClose, material, onSuccess }: MaterialModalProps) {
  const { addMaterial, updateMaterial, suppliers } = useMaterialStore();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    specification: '',
    color: '',
    materialType: '石材',
    cabinetLocation: 'A-01',
    stockQuantity: 1,
    status: 'normal' as MaterialStatus,
    priceMin: 0,
    priceMax: 0,
    minOrderQuantity: 1,
    supplierId: '',
  });

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        brand: material.brand,
        specification: material.specification,
        color: material.color,
        materialType: material.materialType,
        cabinetLocation: material.cabinetLocation,
        stockQuantity: material.stockQuantity,
        status: material.status,
        priceMin: material.priceMin,
        priceMax: material.priceMax,
        minOrderQuantity: material.minOrderQuantity,
        supplierId: material.supplierId,
      });
      setImages(material.images);
    } else {
      resetForm();
    }
  }, [material, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      specification: '',
      color: '',
      materialType: '石材',
      cabinetLocation: 'A-01',
      stockQuantity: 1,
      status: 'normal',
      priceMin: 0,
      priceMax: 0,
      minOrderQuantity: 1,
      supplierId: suppliers.length > 0 ? suppliers[0].id : '',
    });
    setImages([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = await handleFileUpload(e.target.files);
    setImages([...images, ...uploaded]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (material) {
        const updated = await materialService.update(material.id, {
          ...formData,
          images,
        });
        if (updated) updateMaterial(updated);
      } else {
        const created = await materialService.create({
          ...formData,
          images,
        });
        addMaterial(created);
      }
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save material:', error);
    } finally {
      setLoading(false);
    }
  };

  const materialTypes = materialService.getMaterialTypes();
  const cabinetLocations = materialService.getCabinetLocations();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={material ? '编辑材料' : '新增材料'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">实拍图</label>
          <div className="flex flex-wrap gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded overflow-hidden border border-slate-700">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-slate-500 mb-1" />
              <span className="text-xs text-slate-500">上传</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="材料名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入材料名称"
            required
          />
          <Input
            label="品牌"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="请输入品牌"
            required
          />
          <Input
            label="规格"
            value={formData.specification}
            onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
            placeholder="如：800x800x20mm"
            required
          />
          <Input
            label="颜色"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="请输入颜色"
            required
          />
          <Select
            label="材质类型"
            value={formData.materialType}
            onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
            options={materialTypes.map((t) => ({ value: t, label: t }))}
          />
          <Select
            label="存放柜位"
            value={formData.cabinetLocation}
            onChange={(e) => setFormData({ ...formData, cabinetLocation: e.target.value })}
            options={cabinetLocations.map((l) => ({ value: l, label: l }))}
          />
          <Select
            label="材料状态"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as MaterialStatus })}
            options={[
              { value: 'normal', label: '正常' },
              { value: 'need_restock', label: '待补样' },
              { value: 'discontinued', label: '已停产' },
              { value: 'not_recommended', label: '暂不推荐' },
            ]}
          />
          <Select
            label="供应商"
            value={formData.supplierId}
            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
          />
          <Input
            label="库存数量"
            type="number"
            min={0}
            value={formData.stockQuantity}
            onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
          />
          <Input
            label="最小起订量"
            type="number"
            min={1}
            value={formData.minOrderQuantity}
            onChange={(e) => setFormData({ ...formData, minOrderQuantity: Number(e.target.value) })}
          />
          <Input
            label="单价下限 (元)"
            type="number"
            min={0}
            step={0.01}
            value={formData.priceMin}
            onChange={(e) => setFormData({ ...formData, priceMin: Number(e.target.value) })}
          />
          <Input
            label="单价上限 (元)"
            type="number"
            min={0}
            step={0.01}
            value={formData.priceMax}
            onChange={(e) => setFormData({ ...formData, priceMax: Number(e.target.value) })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" loading={loading}>
            {material ? '保存修改' : '添加材料'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
