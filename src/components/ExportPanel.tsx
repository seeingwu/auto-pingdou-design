'use client';

import { BeadGrid } from '@/types';
import { exportPNG, exportCSV, exportPDF, getShoppingList } from '@/lib/exporter';
import { Download, FileImage, FileText, FileSpreadsheet, Tag } from 'lucide-react';
import { useState } from 'react';

interface Props {
    grid: BeadGrid;
}

export default function ExportPanel({ grid }: Props) {
    const [showNumbers, setShowNumbers] = useState(false);
    const [exporting, setExporting] = useState(false);
    const shopping = getShoppingList(grid);
    const total = shopping.reduce((s, i) => s + i.count, 0);

    const handleExport = async (fn: () => Promise<void>) => {
        setExporting(true);
        try {
            await fn();
        } catch (e) {
            console.error(e);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                <Download size={14} className="text-violet-400" />导出
            </label>

            {/* Stats summary */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between"><span>网格尺寸</span><span className="font-bold">{grid.cols} × {grid.rows}</span></div>
                <div className="flex justify-between"><span>颜色种数</span><span className="font-bold">{shopping.length} 色</span></div>
                <div className="flex justify-between"><span>总颗数</span><span className="font-bold">{total.toLocaleString()} 颗</span></div>
            </div>

            {/* PNG options */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Tag size={12} />显示色号标注
                    </div>
                    <button
                        onClick={() => setShowNumbers(!showNumbers)}
                        className={`relative w-9 h-5 rounded-full transition-all ${showNumbers ? 'bg-violet-500' : 'bg-slate-700'}`}
                    >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${showNumbers ? 'left-4' : 'left-0.5'}`} />
                    </button>
                </div>
                <button
                    disabled={exporting}
                    onClick={() => handleExport(() => exportPNG(grid, showNumbers))}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50"
                >
                    <FileImage size={15} />导出 PNG 高清图
                </button>
            </div>

            {/* Other exports */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    disabled={exporting}
                    onClick={() => handleExport(() => exportCSV(shopping))}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                    <FileSpreadsheet size={14} />CSV 采购表
                </button>
                <button
                    disabled={exporting}
                    onClick={() => handleExport(() => exportPDF(grid))}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-medium transition-all duration-200 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                >
                    <FileText size={14} />PDF 报告
                </button>
            </div>
            {exporting && <p className="text-[10px] text-center text-violet-400 animate-pulse">正在生成文件并准备分享...</p>}
        </div>
    );
}
