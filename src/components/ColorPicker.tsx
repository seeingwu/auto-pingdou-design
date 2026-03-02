'use client';

import { BeadColor, PaletteName } from '@/types';
import { getPalette } from '@/lib/palettes';
import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
    palette: PaletteName;
    selectedColor: BeadColor | null;
    onSelect: (color: BeadColor) => void;
    onClose: () => void;
}

export default function ColorPicker({ palette, selectedColor, onSelect, onClose }: Props) {
    const [query, setQuery] = useState('');
    const colors = getPalette(palette);
    const filtered = colors.filter(
        (c) =>
            c.nameZh?.includes(query) ||
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.id.toLowerCase().includes(query.toLowerCase()) ||
            c.hex.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-300">选择颜色</div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                    <X size={14} />
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder="搜索颜色..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
            </div>

            {/* Selected */}
            {selectedColor && (
                <div className="flex items-center gap-3 mb-3 p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/30">
                    <div className="w-8 h-8 rounded-lg shadow-md border border-white/20" style={{ background: selectedColor.hex }} />
                    <div>
                        <div className="text-sm font-bold text-white">{selectedColor.nameZh}</div>
                        <div className="text-xs text-violet-300">{selectedColor.id} · {selectedColor.hex}</div>
                    </div>
                </div>
            )}

            {/* Color grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-6 gap-1.5 pr-1">
                    {filtered.map((color) => (
                        <button
                            key={color.id}
                            title={`${color.nameZh} (${color.id})`}
                            onClick={() => onSelect(color)}
                            className={`aspect-square rounded-lg border-2 transition-all duration-150 hover:scale-110 hover:shadow-md ${selectedColor?.id === color.id
                                ? 'border-white scale-110 shadow-lg'
                                : 'border-transparent hover:border-white/50'
                                }`}
                            style={{ background: color.hex }}
                        />
                    ))}
                </div>
                {filtered.length === 0 && (
                    <div className="text-center text-slate-500 text-sm py-8">暂无匹配颜色</div>
                )}
            </div>

            <div className="mt-2 text-center text-xs text-slate-600">{filtered.length} / {colors.length} 色</div>
        </div>
    );
}
