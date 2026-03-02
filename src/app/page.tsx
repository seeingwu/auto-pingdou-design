'use client';

import { useState, useCallback, useRef } from 'react';
import { BeadColor, BeadGrid, GenerateConfig } from '@/types';
import { getPalette } from '@/lib/palettes';
import { imageToBeadGrid } from '@/lib/imageProcessor';
import { decrementUse, getRemainingUses } from '@/lib/drm';
import ImageUploader from '@/components/ImageUploader';
import ConfigPanel from '@/components/ConfigPanel';
import BeadCanvas from '@/components/BeadCanvas';
import ShoppingList from '@/components/ShoppingList';
import ExportPanel from '@/components/ExportPanel';
import BoardSplitGuide from '@/components/BoardSplitGuide';
import ColorPicker from '@/components/ColorPicker';
import { Beaker, Layers, PanelLeftClose, PanelLeftOpen, Undo2, Redo2 } from 'lucide-react';

const DEFAULT_CONFIG: GenerateConfig = {
  palette: 'MARD',
  cols: 48,
  rows: 48,
  maxColors: 24,
  dithering: true,
  boardSize: 29,
  removeBackground: false,
  edgeEnhance: false,
};

const MAX_HISTORY = 30;

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [config, setConfig] = useState<GenerateConfig>(DEFAULT_CONFIG);
  const [grid, setGrid] = useState<BeadGrid | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedColor, setSelectedColor] = useState<BeadColor | null>(null);
  const [highlightColorId, setHighlightColorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shopping' | 'export' | 'board' | 'colors'>('shopping');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [history, setHistory] = useState<(BeadColor | null)[][][]>([]);
  const [future, setFuture] = useState<(BeadColor | null)[][][]>([]);

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setGrid(null);
    setHistory([]);
    setFuture([]);
  }, []);

  const handleClearImage = useCallback(() => {
    setImageFile(null);
    setPreview(null);
    setGrid(null);
    setHistory([]);
    setFuture([]);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!imageFile) return;

    if (!decrementUse()) {
      alert("🔒 PRO版离线试用次数 (1000次) 已用完！\n\n请联系作者获取无限制版本。");
      return;
    }

    setGenerating(true);
    try {
      const palette = getPalette(config.palette);
      const result = await imageToBeadGrid(imageFile, {
        cols: config.cols,
        rows: config.rows,
        palette,
        maxColors: config.maxColors,
        dithering: config.dithering,
        removeBackground: config.removeBackground,
        edgeEnhance: config.edgeEnhance,
      });
      setGrid(result);
      setHistory([]);
      setFuture([]);
      setActiveTab('shopping');
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }, [imageFile, config]);

  const pushHistory = useCallback((cells: (BeadColor | null)[][]) => {
    setHistory((h) => [...h.slice(-MAX_HISTORY + 1), cells]);
    setFuture([]);
  }, []);

  const handleCellChange = useCallback((x: number, y: number, color: BeadColor | null) => {
    setGrid((prev) => {
      if (!prev) return prev;
      pushHistory(prev.cells.map((r) => [...r]));
      const newCells = prev.cells.map((row, ry) =>
        ry === y ? row.map((cell, rx) => (rx === x ? color : cell)) : row
      );
      return { ...prev, cells: newCells };
    });
  }, [pushHistory]);

  const handleUndo = useCallback(() => {
    if (!history.length || !grid) return;
    const prev = history[history.length - 1];
    setFuture((f) => [grid.cells.map((r) => [...r]), ...f]);
    setHistory((h) => h.slice(0, -1));
    setGrid((g) => g ? { ...g, cells: prev } : g);
  }, [history, grid]);

  const handleRedo = useCallback(() => {
    if (!future.length || !grid) return;
    const next = future[0];
    setHistory((h) => [...h, grid.cells.map((r) => [...r])]);
    setFuture((f) => f.slice(1));
    setGrid((g) => g ? { ...g, cells: next } : g);
  }, [future, grid]);

  const handlePickColor = useCallback((color: BeadColor) => {
    setSelectedColor(color);
  }, []);

  const handleToggleHighlight = useCallback((id: string) => {
    setHighlightColorId((cur) => (cur === id ? null : id));
  }, []);

  const tabs = [
    { id: 'shopping', label: '采购清单' },
    { id: 'export', label: '导出' },
    { id: 'board', label: '分板' },
    { id: 'colors', label: '选色' },
  ] as const;

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Beaker size={16} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
              拼豆设计图生成器 <span className="px-1.5 py-0.5 rounded bg-violet-500 text-[10px] shadow">PRO</span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">
              剩余可用次数: <span className="font-bold text-violet-400">{getRemainingUses()}</span> / 1000
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {grid && (
            <>
              <button
                onClick={handleUndo}
                disabled={!history.length}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Undo2 size={13} />撤销
              </button>
              <button
                onClick={handleRedo}
                disabled={!future.length}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Redo2 size={13} />重做
              </button>
            </>
          )}
          <div className="w-px h-5 bg-white/10" />
          <button
            onClick={() => setLeftPanelOpen((o) => !o)}
            className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all"
          >
            {leftPanelOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel: Config */}
        <aside className={`flex-shrink-0 border-r border-white/10 bg-slate-900/60 backdrop-blur-sm overflow-y-auto transition-all duration-300 ${leftPanelOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
          <div className="p-4 space-y-5 min-w-[288px]">
            <ImageUploader
              onImageSelect={handleImageSelect}
              preview={preview}
              onClear={handleClearImage}
            />
            <div className="w-full h-px bg-white/5" />
            <ConfigPanel
              config={config}
              onChange={setConfig}
              onGenerate={handleGenerate}
              generating={generating}
              hasImage={!!imageFile}
            />
          </div>
        </aside>

        {/* Center: Canvas */}
        <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
          {grid ? (
            <div className="flex-1 p-3 flex flex-col min-h-0">
              <BeadCanvas
                grid={grid}
                boardSize={config.boardSize}
                selectedColor={selectedColor}
                onCellChange={handleCellChange}
                onPickColor={handlePickColor}
                highlightColorId={highlightColorId}
                setHighlightColorId={setHighlightColorId}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-sm mx-auto px-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
                  <Layers size={36} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">开始创作拼豆方案</h2>
                  <p className="text-slate-500 text-sm">
                    在左侧上传图片，配置网格大小和色卡品牌，点击「生成」即可看到拼豆方案
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">🎨 多品牌色卡</div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">✏️ 可交互编辑</div>
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5">📦 导出打印</div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right panel: Info */}
        {grid && (
          <aside className="flex-shrink-0 w-72 xl:w-80 border-l border-white/10 bg-slate-900/60 backdrop-blur-sm flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-slate-900/40 flex-shrink-0">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-all duration-200 border-b-2 ${activeTab === t.id
                    ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                    : 'border-transparent text-slate-500 hover:text-slate-400'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden p-4">
              {activeTab === 'shopping' && (
                <ShoppingList
                  grid={grid}
                  selectedColorId={selectedColor?.id ?? null}
                  onSelectColor={(c) => { setSelectedColor(c); setActiveTab('colors'); }}
                  highlightColorId={highlightColorId}
                  onToggleHighlight={handleToggleHighlight}
                />
              )}
              {activeTab === 'export' && <ExportPanel grid={grid} />}
              {activeTab === 'board' && <BoardSplitGuide grid={grid} boardSize={config.boardSize} />}
              {activeTab === 'colors' && (
                <ColorPicker
                  palette={config.palette}
                  selectedColor={selectedColor}
                  onSelect={setSelectedColor}
                  onClose={() => setActiveTab('shopping')}
                />
              )}
            </div>

            {/* Selected color indicator */}
            {selectedColor && (
              <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 border-t border-white/10 bg-slate-900/80">
                <div className="w-6 h-6 rounded-lg border border-white/20 shadow-md" style={{ background: selectedColor.hex }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{selectedColor.nameZh}</div>
                  <div className="text-xs text-slate-500">{selectedColor.id}</div>
                </div>
                <button onClick={() => setSelectedColor(null)} className="text-xs text-slate-500 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-all">清除</button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
