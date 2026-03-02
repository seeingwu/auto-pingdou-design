'use client';

import { BeadGrid } from '@/types';
import { Grid3X3 } from 'lucide-react';

interface Props {
    grid: BeadGrid;
    boardSize: 29 | 58;
}

export default function BoardSplitGuide({ grid, boardSize }: Props) {
    const boardsH = Math.ceil(grid.cols / boardSize);
    const boardsV = Math.ceil(grid.rows / boardSize);
    const total = boardsH * boardsV;

    if (total <= 1) {
        return (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 text-center">
                ✅ 图案可在单块 {boardSize}×{boardSize} 钉板上完成
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                <Grid3X3 size={14} className="text-orange-400" />分板指引
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-xs">{total} 块板</span>
            </label>
            <p className="text-xs text-slate-400">图案超出单板范围，需拼接 {boardsH}×{boardsV} = {total} 块钉板</p>

            {/* Board grid preview */}
            <div
                className="grid gap-1.5 w-full"
                style={{ gridTemplateColumns: `repeat(${boardsH}, 1fr)` }}
            >
                {Array.from({ length: boardsV }, (_, row) =>
                    Array.from({ length: boardsH }, (_, col) => {
                        const boardNum = row * boardsH + col + 1;
                        const xStart = col * boardSize + 1;
                        const yStart = row * boardSize + 1;
                        const xEnd = Math.min((col + 1) * boardSize, grid.cols);
                        const yEnd = Math.min((row + 1) * boardSize, grid.rows);

                        return (
                            <div
                                key={boardNum}
                                className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center"
                            >
                                <div className="text-orange-300 font-bold text-sm">#{boardNum}</div>
                                <div className="text-xs text-slate-500 mt-0.5 leading-tight">
                                    列 {xStart}-{xEnd}<br />行 {yStart}-{yEnd}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-400/20 text-xs text-orange-300">
                💡 红色分隔线标注了每块板的边界，从 #1（左上）按行次序拼装
            </div>
        </div>
    );
}
