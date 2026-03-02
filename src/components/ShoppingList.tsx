'use client';

import { BeadColor, BeadGrid, ShoppingItem } from '@/types';
import { getShoppingList } from '@/lib/exporter';
import { ShoppingCart, Package, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Props {
    grid: BeadGrid;
    selectedColorId: string | null;
    onSelectColor: (color: BeadColor) => void;
    highlightColorId: string | null;
    onToggleHighlight: (id: string) => void;
}

export default function ShoppingList({ grid, selectedColorId, onSelectColor, highlightColorId, onToggleHighlight }: Props) {
    const [copied, setCopied] = useState(false);
    const items = getShoppingList(grid);
    const total = items.reduce((s, i) => s + i.count, 0);

    const copyText = () => {
        const text = items.map(i => `${i.color.id} ${i.color.nameZh}(${i.color.name}) × ${i.count}颗`).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-violet-400" />
                    <span className="text-sm font-semibold text-slate-300">采购清单</span>
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold">{items.length}色</span>
                </div>
                <button onClick={copyText} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs transition-all hover:border-white/20">
                    {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? '已复制' : '复制'}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xl font-bold text-white">{total.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">总颗数</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-xl font-bold text-emerald-400">{items.length}</div>
                    <div className="text-xs text-slate-500">颜色种数</div>
                </div>
            </div>

            {/* Color list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {items.map((item) => {
                    const isSelected = selectedColorId === item.color.id;
                    const isHighlighted = highlightColorId === item.color.id;
                    const bags = Math.ceil(item.count / 500);

                    return (
                        <div
                            key={item.color.id}
                            onClick={() => onSelectColor(item.color)}
                            onDoubleClick={() => onToggleHighlight(item.color.id)}
                            title="单击选色，双击高亮网格"
                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${isHighlighted
                                    ? 'border-violet-400/50 bg-violet-500/15'
                                    : isSelected
                                        ? 'border-indigo-400/50 bg-indigo-500/10'
                                        : 'border-transparent hover:border-white/10 hover:bg-white/5'
                                }`}
                        >
                            {/* Color swatch */}
                            <div
                                className="w-7 h-7 rounded-lg flex-shrink-0 border border-white/20 shadow-md"
                                style={{ background: item.color.hex }}
                            />

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-200 truncate">{item.color.nameZh}</div>
                                <div className="text-xs text-slate-500">{item.color.id}</div>
                            </div>

                            {/* Count */}
                            <div className="text-right flex-shrink-0">
                                <div className="text-sm font-bold text-white">{item.count}</div>
                                <div className="flex items-center gap-0.5 justify-end text-xs text-slate-500">
                                    <Package size={10} />
                                    <span>×{bags}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-2 p-2 rounded-xl bg-slate-800/50 border border-white/5 text-xs text-slate-500 text-center">
                单击选色 · 双击在画布高亮
            </div>
        </div>
    );
}
