import { db } from '../db';
import type { StatisticsData, MaterialStatus } from '../types';
import { materialStatusLabels } from '../utils/format';

export const analyticsService = {
  async getStatistics(): Promise<StatisticsData> {
    const [materials, borrowRecords, projects, projectMaterials, suppliers] =
      await Promise.all([
        db.materials.toArray(),
        db.borrowRecords.toArray(),
        db.projects.toArray(),
        db.projectMaterials.toArray(),
        db.suppliers.toArray(),
      ]);

    const materialTypeMap = new Map<string, number>();
    materials.forEach((m) => {
      const count = materialTypeMap.get(m.materialType) || 0;
      materialTypeMap.set(m.materialType, count + 1);
    });

    const materialTypeStats = Array.from(materialTypeMap.entries()).map(
      ([name, count]) => ({ name, count }),
    );

    const statusMap = new Map<MaterialStatus, number>();
    materials.forEach((m) => {
      const count = statusMap.get(m.status) || 0;
      statusMap.set(m.status, count + 1);
    });

    const statusStats = Array.from(statusMap.entries()).map(
      ([status, count]) => ({
        name: materialStatusLabels[status],
        count,
      }),
    );

    const projectMaterialCount = new Map<string, number>();
    projectMaterials.forEach((pm) => {
      const count = projectMaterialCount.get(pm.projectId) || 0;
      projectMaterialCount.set(pm.projectId, count + 1);
    });

    const projectStats = projects
      .map((p) => ({
        name: p.name,
        count: projectMaterialCount.get(p.id) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const supplierStats = suppliers.map((s) => {
      const supplierMaterials = materials.filter((m) => m.supplierId === s.id);
      const avgPrice =
        supplierMaterials.length > 0
          ? supplierMaterials.reduce((sum, m) => sum + (m.priceMin + m.priceMax) / 2, 0) /
            supplierMaterials.length
          : 0;
      return {
        name: s.name,
        count: supplierMaterials.length,
        avgPrice: Math.round(avgPrice * 100) / 100,
      };
    });

    const totalBorrowed = borrowRecords.filter((r) => r.status === 'borrowed').length;
    const totalOverdue = borrowRecords.filter((r) => r.status === 'overdue').length;

    return {
      totalMaterials: materials.length,
      totalBorrowed,
      totalOverdue,
      totalProjects: projects.length,
      materialTypeStats,
      statusStats,
      projectStats,
      supplierStats,
    };
  },

  async getMaterialUsageFrequency(): Promise<{ name: string; count: number }[]> {
    const [materials, projectMaterials] = await Promise.all([
      db.materials.toArray(),
      db.projectMaterials.where('selectionStatus').equals('selected').toArray(),
    ]);

    const usageMap = new Map<string, number>();
    projectMaterials.forEach((pm) => {
      const count = usageMap.get(pm.materialId) || 0;
      usageMap.set(pm.materialId, count + 1);
    });

    return materials
      .map((m) => ({
        name: m.name,
        count: usageMap.get(m.id) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  },

  async getBorrowFrequency(): Promise<{ name: string; count: number }[]> {
    const [materials, borrowRecords] = await Promise.all([
      db.materials.toArray(),
      db.borrowRecords.toArray(),
    ]);

    const borrowMap = new Map<string, number>();
    borrowRecords.forEach((br) => {
      const count = borrowMap.get(br.materialId) || 0;
      borrowMap.set(br.materialId, count + 1);
    });

    return materials
      .map((m) => ({
        name: m.name,
        count: borrowMap.get(m.id) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  },

  async getMonthlyBorrowTrend(): Promise<{ month: string; count: number }[]> {
    const borrowRecords = await db.borrowRecords.toArray();
    const monthMap = new Map<string, number>();

    borrowRecords.forEach((br) => {
      const date = new Date(br.borrowDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const count = monthMap.get(month) || 0;
      monthMap.set(month, count + 1);
    });

    return Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  },
};
