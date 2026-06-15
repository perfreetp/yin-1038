import { db } from './index';
import type { Material, Supplier, Project, BorrowRecord, ProjectMaterial, Note, Alternative } from '../types';
import { addDays } from '../utils/date';

const supplierSeed: Omit<Supplier, 'id'>[] = [
  {
    name: '华润石材',
    contactPerson: '张经理',
    phone: '13800138001',
    email: 'zhang@huarun.com',
    address: '上海市浦东新区石材城A区12号',
    notes: '主要供应大理石、花岗岩',
  },
  {
    name: '诺贝尔瓷砖',
    contactPerson: '李总',
    phone: '13800138002',
    email: 'li@nobel.com',
    address: '杭州市余杭区陶瓷工业园',
    notes: '高端瓷砖品牌，品质稳定',
  },
  {
    name: '圣象地板',
    contactPerson: '王经理',
    phone: '13800138003',
    email: 'wang@powerdek.com',
    address: '北京市朝阳区建材路88号',
    notes: '实木地板、复合地板专家',
  },
  {
    name: '立邦涂料',
    contactPerson: '赵主管',
    phone: '13800138004',
    email: 'zhao@nippon.com',
    address: '广州市黄埔区化工园区',
    notes: '环保涂料，颜色丰富',
  },
  {
    name: '奥的斯电梯',
    contactPerson: '孙经理',
    phone: '13800138005',
    email: 'sun@otis.com',
    address: '天津市滨海新区工业区',
    notes: '电梯及金属配件供应商',
  },
];

const now = new Date();

const materialSeed: (Omit<Material, 'id' | 'createdAt' | 'updatedAt'> & { supplierIndex: number })[] = [
  {
    name: '意大利雅士白大理石',
    brand: '华润',
    specification: '800x800x20mm',
    color: '白色',
    materialType: '石材',
    images: [],
    cabinetLocation: 'A-01',
    stockQuantity: 5,
    status: 'normal',
    priceMin: 680,
    priceMax: 850,
    minOrderQuantity: 50,
    supplierId: '',
    supplierIndex: 0,
  },
  {
    name: '西班牙米黄大理石',
    brand: '华润',
    specification: '600x600x20mm',
    color: '米黄色',
    materialType: '石材',
    images: [],
    cabinetLocation: 'A-01',
    stockQuantity: 8,
    status: 'normal',
    priceMin: 450,
    priceMax: 580,
    minOrderQuantity: 30,
    supplierId: '',
    supplierIndex: 0,
  },
  {
    name: '中国黑花岗岩',
    brand: '华润',
    specification: '600x300x25mm',
    color: '黑色',
    materialType: '石材',
    images: [],
    cabinetLocation: 'A-02',
    stockQuantity: 12,
    status: 'normal',
    priceMin: 180,
    priceMax: 260,
    minOrderQuantity: 100,
    supplierId: '',
    supplierIndex: 0,
  },
  {
    name: '诺贝尔全抛釉瓷砖',
    brand: '诺贝尔',
    specification: '800x800mm',
    color: '浅灰色',
    materialType: '瓷砖',
    images: [],
    cabinetLocation: 'A-03',
    stockQuantity: 15,
    status: 'normal',
    priceMin: 220,
    priceMax: 320,
    minOrderQuantity: 80,
    supplierId: '',
    supplierIndex: 1,
  },
  {
    name: '诺贝尔木纹砖',
    brand: '诺贝尔',
    specification: '150x900mm',
    color: '胡桃木色',
    materialType: '瓷砖',
    images: [],
    cabinetLocation: 'A-03',
    stockQuantity: 20,
    status: 'need_restock',
    priceMin: 160,
    priceMax: 220,
    minOrderQuantity: 60,
    supplierId: '',
    supplierIndex: 1,
  },
  {
    name: '圣象三层实木地板',
    brand: '圣象',
    specification: '1210x165x15mm',
    color: '橡木本色',
    materialType: '地板',
    images: [],
    cabinetLocation: 'B-01',
    stockQuantity: 10,
    status: 'normal',
    priceMin: 380,
    priceMax: 520,
    minOrderQuantity: 40,
    supplierId: '',
       supplierIndex: 2,
  },
  {
    name: '圣象强化复合地板',
    brand: '圣象',
    specification: '1215x195x12mm',
    color: '枫木色',
    materialType: '地板',
    images: [],
    cabinetLocation: 'B-01',
    stockQuantity: 25,
    status: 'normal',
    priceMin: 120,
    priceMax: 180,
    minOrderQuantity: 100,
    supplierId: '',
    supplierIndex: 2,
  },
  {
    name: '立邦净味全效乳胶漆',
    brand: '立邦',
    specification: '5L/桶',
    color: '可调色',
    materialType: '涂料',
    images: [],
    cabinetLocation: 'B-02',
    stockQuantity: 30,
    status: 'normal',
    priceMin: 380,
    priceMax: 480,
    minOrderQuantity: 5,
    supplierId: '',
    supplierIndex: 3,
  },
  {
    name: '立邦艺术漆',
    brand: '立邦',
    specification: '25kg/桶',
    color: '定制',
    materialType: '涂料',
    images: [],
    cabinetLocation: 'B-02',
    stockQuantity: 6,
    status: 'discontinued',
    priceMin: 580,
    priceMax: 780,
    minOrderQuantity: 2,
    supplierId: '',
    supplierIndex: 3,
  },
  {
    name: '304不锈钢装饰板',
    brand: '奥的斯',
    specification: '1220x2440x1.2mm',
    color: '镜面',
    materialType: '金属',
    images: [],
    cabinetLocation: 'B-03',
    stockQuantity: 8,
    status: 'normal',
    priceMin: 320,
    priceMax: 450,
    minOrderQuantity: 10,
    supplierId: '',
    supplierIndex: 4,
  },
  {
    name: '黄铜装饰条',
    brand: '奥的斯',
    specification: '10x5mm',
    color: '拉丝金',
    materialType: '金属',
    images: [],
    cabinetLocation: 'B-03',
    stockQuantity: 50,
    status: 'normal',
    priceMin: 45,
    priceMax: 65,
    minOrderQuantity: 100,
    supplierId: '',
    supplierIndex: 4,
  },
  {
    name: '超白钢化玻璃',
    brand: '南玻',
    specification: '12mm厚',
    color: '超白',
    materialType: '玻璃',
    images: [],
    cabinetLocation: 'C-01',
    stockQuantity: 15,
    status: 'not_recommended',
    priceMin: 280,
    priceMax: 380,
    minOrderQuantity: 20,
    supplierId: '',
    supplierIndex: 4,
  },
  {
    name: '夹胶安全玻璃',
    brand: '南玻',
    specification: '6+0.76+6mm',
    color: '透明',
    materialType: '玻璃',
    images: [],
    cabinetLocation: 'C-01',
    stockQuantity: 10,
    status: 'normal',
    priceMin: 350,
    priceMax: 480,
    minOrderQuantity: 15,
    supplierId: '',
    supplierIndex: 4,
  },
];

const projectSeed: Omit<Project, 'id'>[] = [
  {
    name: '上海中心大厦二期',
    stage: 'construction',
    manager: '李明',
    startDate: new Date('2024-03-15'),
    description: '超高层商业综合体项目，总建筑面积30万平米',
    status: 'active',
  },
  {
    name: '杭州西溪湿地酒店',
    stage: 'design',
    manager: '王芳',
    startDate: new Date('2024-06-01'),
    description: '高端度假酒店，融入自然生态设计理念',
    status: 'active',
  },
  {
    name: '北京CBD总部办公楼',
    stage: 'scheme',
    manager: '张伟',
    startDate: new Date('2024-09-01'),
    description: '5A级智能办公楼，LEED金级认证目标',
    status: 'active',
  },
  {
    name: '深圳湾科技园区',
    stage: 'concept',
    manager: '陈静',
    startDate: new Date('2024-11-01'),
    description: '产业园区规划，包含办公、研发、配套商业',
    status: 'active',
  },
  {
    name: '成都太古里二期',
    stage: 'completed',
    manager: '刘洋',
    startDate: new Date('2023-01-10'),
    endDate: new Date('2024-05-20'),
    description: '开放式街区商业项目，已竣工交付',
    status: 'completed',
  },
];

const noteSeed: { materialIndex: number; content: string; author: string }[] = [
  {
    materialIndex: 0,
    content: '2024年10月项目会议确认，大堂地面主选材料，需确认供货周期',
    author: '李明',
  },
  {
    materialIndex: 0,
    content: '供应商反馈当前库存紧张，建议提前30天下单',
    author: '王芳',
  },
  {
    materialIndex: 3,
    content: '卫生间墙面备选，防滑性能测试已通过',
    author: '张伟',
  },
  {
    materialIndex: 5,
    content: '客房地面首选，脚感舒适度测试优秀',
    author: '陈静',
  },
];

export async function seedDatabase() {
  const existingMaterials = await db.materials.count();
  if (existingMaterials > 0) return;

  await db.transaction('rw', [
    db.suppliers,
    db.materials,
    db.projects,
    db.projectMaterials,
    db.borrowRecords,
    db.notes,
    db.alternatives,
  ], async () => {
    const supplierIds: string[] = [];
    for (const s of supplierSeed) {
      const id = await db.suppliers.add({
        ...s,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      });
      supplierIds.push(id as string);
    }

    const materialIds: string[] = [];
    for (const m of materialSeed) {
      const { supplierIndex, ...materialData } = m;
      const id = await db.materials.add({
        ...materialData,
        supplierId: supplierIds[supplierIndex],
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      });
      materialIds.push(id as string);
    }

    const projectIds: string[] = [];
    for (const p of projectSeed) {
      const id = await db.projects.add({
        ...p,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      });
      projectIds.push(id as string);
    }

    const projectMaterials: Omit<ProjectMaterial, 'id'>[] = [
      { projectId: projectIds[0], materialId: materialIds[0], selectionStatus: 'selected', version: 'v1.2', createdAt: now },
      { projectId: projectIds[0], materialId: materialIds[3], selectionStatus: 'alternative', version: 'v1.0', createdAt: now },
      { projectId: projectIds[0], materialId: materialIds[9], selectionStatus: 'proposed', version: 'v1.0', createdAt: now },
      { projectId: projectIds[1], materialId: materialIds[5], selectionStatus: 'selected', version: 'v1.1', createdAt: now },
      { projectId: projectIds[1], materialId: materialIds[7], selectionStatus: 'selected', version: 'v1.0', createdAt: now },
      { projectId: projectIds[1], materialId: materialIds[11], selectionStatus: 'alternative', version: 'v1.0', createdAt: now },
      { projectId: projectIds[2], materialId: materialIds[1], selectionStatus: 'alternative', version: 'v1.0', createdAt: now },
      { projectId: projectIds[2], materialId: materialIds[9], selectionStatus: 'selected', version: 'v1.0', createdAt: now },
      { projectId: projectIds[3], materialId: materialIds[2], selectionStatus: 'proposed', version: 'v0.5', createdAt: now },
    ];
    for (const pm of projectMaterials) {
      await db.projectMaterials.add({
        ...pm,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      });
    }

    const borrowRecords: Omit<BorrowRecord, 'id'>[] = [
      {
        materialId: materialIds[0],
        borrower: '李明',
        borrowDate: addDays(now, -10),
        expectedReturnDate: addDays(now, -3),
        purpose: '上海中心项目会议展示',
        status: 'overdue',
      },
      {
        materialId: materialIds[3],
        borrower: '王芳',
        borrowDate: addDays(now, -5),
        expectedReturnDate: addDays(now, 2),
        purpose: '西溪酒店方案讨论',
        status: 'borrowed',
      },
      {
        materialId: materialIds[5],
        borrower: '张伟',
        borrowDate: addDays(now, -8),
        expectedReturnDate: addDays(now, -1),
        purpose: '北京CBD项目评审',
        status: 'overdue',
      },
      {
        materialId: materialIds[7],
        borrower: '陈静',
        borrowDate: addDays(now, -3),
        expectedReturnDate: addDays(now, 4),
        purpose: '深圳湾项目初期方案',
        status: 'borrowed',
      },
      {
        materialId: materialIds[9],
        borrower: '刘洋',
        borrowDate: addDays(now, -15),
        expectedReturnDate: addDays(now, -8),
        actualReturnDate: addDays(now, -7),
        purpose: '成都太古里项目归档',
        status: 'returned',
        notes: '归还时样本完好',
      },
    ];
    for (const br of borrowRecords) {
      await db.borrowRecords.add({
        ...br,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      });
    }

    for (const n of noteSeed) {
      await db.notes.add({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        materialId: materialIds[n.materialIndex],
        content: n.content,
        author: n.author,
        createdAt: addDays(now, -Math.floor(Math.random() * 30)),
      });
    }

    const alternatives: Omit<Alternative, 'id'>[] = [
      { materialId: materialIds[0], alternativeMaterialId: materialIds[1], relationType: 'replacement' },
      { materialId: materialIds[5], alternativeMaterialId: materialIds[6], relationType: 'upgrade' },
      { materialId: materialIds[9], alternativeMaterialId: materialIds[10], relationType: 'similar' },
    ];
    for (const alt of alternatives) {
      await db.alternatives.add({
        ...alt,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      });
    }
  });

  console.log('Database seeded successfully');
}
