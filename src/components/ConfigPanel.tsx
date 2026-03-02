'use client';

import { GenerateConfig, PaletteName } from '@/types';
import { palettes } from '@/lib/palettes';
import { Settings2, Grid3X3, Palette, Sliders, Layers } from 'lucide-react';

interface Props {
    config: GenerateConfig;
    onChange: (config: GenerateConfig) => void;
    onGenerate: () => void;
    generating: boolean;
    hasImage: boolean;
}

const PALETTE_OPTIONS: { value: PaletteName; label: string; desc: string }[] = [
    { value: 'MARD', label: 'MARD', desc: `约${palettes.MARD.length}色，国内常用` },
    { value: 'Perler', label: 'Perler', desc: `约${palettes.Perler.length}色，美国品牌` },
    { value: 'Hama', label: 'Hama', desc: `约${palettes.Hama.length}色，丹麦品牌` },
    { value: 'Artkal', label: 'Artkal', desc: `约${palettes.Artkal.length}色，适合迷你珠` },
    { value: 'Combined', label: '全色卡合并', desc: `约${palettes.Combined.length}色，多品牌` },
];

export default function ConfigPanel({ config, onChange, onGenerate, generating, hasImage }: Props) {
    const set = <K extends keyof GenerateConfig>(key: K, value: GenerateConfig[K]) =>
        onChange({ ...config, [key]: value });

    const realWidthCm = (config.cols * 0.5).toFixed(1);
    const realHeightCm = (config.rows * 0.5).toFixed(1);
    const boardsH = Math.ceil(config.cols / config.boardSize);
    const boardsV = Math.ceil(config.rows / config.boardSize);
    const totalBoards = boardsH * boardsV;

    return (
        <div className="space-y-6">
            {/* Palette */}
            <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    <Palette size={14} className="text-violet-400" />色卡品牌
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {PALETTE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => set('palette', opt.value)}
                            className={`p-3 rounded-xl text-left transition-all duration-200 border ${config.palette === opt.value
                                ? 'border-violet-500 bg-violet-500/20 text-white'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'
                                }`}
                        >
                            <div className="text-sm font-bold">{opt.label}</div>
                            <div className="text-xs opacity-60 mt-0.5">{opt.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid size */}
            <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    <Grid3X3 size={14} className="text-violet-400" />网格尺寸（格）
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-xs text-slate-500 mb-1 block">宽（列）</span>
                        <input
                            type="number"
                            min={10} max={200}
                            value={config.cols}
                            onChange={(e) => set('cols', Math.min(200, Math.max(10, +e.target.value)))}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 mb-1 block">高（行）</span>
                        <input
                            type="number"
                            min={10} max={200}
                            value={config.rows}
                            onChange={(e) => set('rows', Math.min(200, Math.max(10, +e.target.value)))}
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Quick presets */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {[[29, 29], [48, 48], [58, 58], [100, 100], [29, 58]].map(([c, r]) => (
                        <button
                            key={`${c}x${r}`}
                            onClick={() => onChange({ ...config, cols: c, rows: r })}
                            className="px-2 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-violet-400/50 transition-all"
                        >
                            {c}×{r}
                        </button>
                    ))}
                </div>

                {/* Physical size estimate */}
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    📏 成品约 <strong>{realWidthCm} × {realHeightCm} cm</strong>（5mm珠），需 <strong>{totalBoards}</strong> 块{config.boardSize}×{config.boardSize}钉板
                </div>
            </div>

            {/* Max colors */}
            <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    <Sliders size={14} className="text-violet-400" />最多颜色种数：<span className="text-violet-400 ml-1">{config.maxColors === 0 ? '不限' : config.maxColors}</span>
                </label>
                <input
                    type="range"
                    min={0} max={64} step={1}
                    value={config.maxColors}
                    onChange={(e) => set('maxColors', +e.target.value)}
                    className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>不限制</span><span>16色</span><span>32色</span><span>64色</span>
                </div>
            </div>

            {/* Board size */}
            <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    <Layers size={14} className="text-violet-400" />钉板规格
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {([29, 58] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => set('boardSize', s)}
                            className={`p-2.5 rounded-xl text-sm text-center border transition-all duration-200 ${config.boardSize === s ? 'border-violet-500 bg-violet-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'}`}
                        >
                            {s}×{s}格<br /><span className="text-xs opacity-60">{s === 29 ? '约14.5cm' : '约29cm'}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Algorithms */}
            <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                        <div className="text-sm font-medium text-slate-300">抖动算法 (Dithering)</div>
                        <div className="text-xs text-slate-500">改善大面积渐变效果</div>
                    </div>
                    <button
                        onClick={() => set('dithering', !config.dithering)}
                        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${config.dithering ? 'bg-violet-500' : 'bg-slate-700'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${config.dithering ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                        <div className="text-sm font-medium text-slate-300 flex items-center gap-1">智能抠图 <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 text-[10px] font-bold">PRO</span></div>
                        <div className="text-xs text-slate-500">自动去除纯色/白色背景</div>
                    </div>
                    <button
                        onClick={() => set('removeBackground', !config.removeBackground)}
                        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${config.removeBackground ? 'bg-violet-500' : 'bg-slate-700'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${config.removeBackground ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                        <div className="text-sm font-medium text-slate-300 flex items-center gap-1">边缘增强 <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 text-[10px] font-bold">PRO</span></div>
                        <div className="text-xs text-slate-500">清晰保留卡通轮廓线段</div>
                    </div>
                    <button
                        onClick={() => set('edgeEnhance', !config.edgeEnhance)}
                        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${config.edgeEnhance ? 'bg-violet-500' : 'bg-slate-700'}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${config.edgeEnhance ? 'left-6' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            {/* Generate button */}
            <button
                onClick={onGenerate}
                disabled={!hasImage || generating}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 ${hasImage && !generating
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.99]'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
            >
                {generating ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中...
                    </span>
                ) : (
                    '✨ 生成拼豆方案'
                )}
            </button>
        </div>
    );
}
