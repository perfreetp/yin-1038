import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Copy, Download, Printer, Check } from 'lucide-react';
import type { BorrowRecordWithMaterial } from '../types';
import { exportToCSV } from '../utils/file';
import { formatDate } from '../utils/format';

interface BorrowListExportProps {
  records: BorrowRecordWithMaterial[];
  title?: string;
  onClose: () => void;
  isOpen: boolean;
}

export function BorrowListExport({ records, title = '会议借样清单', onClose, isOpen }: BorrowListExportProps) {
  const [copied, setCopied] = useState(false);

  const tableData = records.map((record) => ({
    '材料名称': record.material.name,
    '品牌': record.material.brand,
    '柜位': record.material.cabinetLocation,
    '借用人': record.borrower,
    '借出日期': formatDate(record.borrowDate),
    '预计归还日期': formatDate(record.expectedReturnDate),
    '用途': record.purpose || '-',
  }));

  const generateTSV = (): string => {
    const headers = Object.keys(tableData[0]).join('\t');
    const rows = tableData.map((row) =>
      Object.values(row).map((value) => `"${value}"`).join('\t')
    );
    return [headers, ...rows].join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateTSV());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleExportCSV = () => {
    const filename = `借样清单_${new Date().toISOString().split('T')[0]}`;
    exportToCSV(tableData, filename);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; }
          h1 { font-size: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 12px; }
          th { background-color: #f5f5f5; font-weight: 600; }
          tr:nth-child(even) { background-color: #fafafa; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              <th>材料名称</th>
              <th>品牌</th>
              <th>柜位</th>
              <th>借用人</th>
              <th>借出日期</th>
              <th>预计归还日期</th>
              <th>用途</th>
            </tr>
          </thead>
          <tbody>
            ${tableData.map((row) => `
              <tr>
                <td>${row['材料名称']}</td>
                <td>${row['品牌']}</td>
                <td>${row['柜位']}</td>
                <td>${row['借用人']}</td>
                <td>${row['借出日期']}</td>
                <td>${row['预计归还日期']}</td>
                <td>${row['用途']}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          打印时间：${new Date().toLocaleString('zh-CN')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            共 {records.length} 条记录
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制到剪贴板
                </>
              )}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4" />
              导出CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              打印
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900">
                <th className="text-left px-4 py-3 font-medium text-slate-400 border-b border-slate-700">材料名称</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400 border-b border-slate-700">品牌</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400 border-b border-slate-700">柜位</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400 border-b border-slate-700">借用人</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400 border-b border-slate-700">借出日期</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400 border-b border-slate-700">预计归还</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400 border-b border-slate-700">用途</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-200">{record.material.name}</td>
                  <td className="px-4 py-3 text-slate-400">{record.material.brand}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-blue-400">{record.material.cabinetLocation}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{record.borrower}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(record.borrowDate)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(record.expectedReturnDate)}</td>
                  <td className="px-4 py-3 text-slate-400">{record.purpose || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-700">
          <Button onClick={onClose}>关闭</Button>
        </div>
      </div>
    </Modal>
  );
}
