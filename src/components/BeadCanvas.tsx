'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { BeadColor, BeadGrid, EditMode } from '@/types';
import { Pencil, Eraser, MousePointer, Pipette, PaintBucket, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const CELL = 14; // pixels per cell in canvas
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 5;

interface Props {
    grid: BeadGrid;
    boardSize: 29 | 58;
    selectedColor: BeadColor | null;
    onCellChange: (x: number, y: number, color: BeadColor | null) => void;
    onPickColor: (color: BeadColor) => void;
    highlightColorId: string | null;
    setHighlightColorId: (id: string | null) => void;
}

interface Tooltip { x: number; y: number; color: BeadColor; cx: number; cy: number }

export default function BeadCanvas({
    grid,
    boardSize,
    selectedColor,
    onCellChange,
    onPickColor,
    highlightColorId,
    setHighlightColorId,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<EditMode>('select');
    const [bgMode, setBgMode] = useState<'dark' | 'light' | 'board'>('dark');
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [tooltip, setTooltip] = useState<Tooltip | null>(null);
    const isPainting = useRef(false);
    const panStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const { cols, rows, cells } = grid;
        const w = cols * CELL;
        const h = rows * CELL;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(zoom, zoom);

        // Background
        if (bgMode === 'dark') {
            ctx.fillStyle = '#1e293b';
        } else if (bgMode === 'light') {
            ctx.fillStyle = '#f1f5f9';
        } else {
            ctx.fillStyle = '#064e3b'; // Board green
        }
        ctx.fillRect(0, 0, w, h);

        // Cells
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = cells[y][x];
                const px = x * CELL;
                const py = y * CELL;
                const isHighlighted = highlightColorId && cell?.id === highlightColorId;

                if (cell) {
                    ctx.fillStyle = cell.hex;
                    ctx.fillRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);

                    // Bead border for visibility
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                    if (bgMode === 'dark' && (cell.hex.toLowerCase() === '#ffffff' || cell.hex.toLowerCase() === '#fafafa')) {
                        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    }
                    ctx.lineWidth = 0.5 / zoom;
                    ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);

                    if (highlightColorId && !isHighlighted) {
                        ctx.fillStyle = 'rgba(0,0,0,0.55)';
                        ctx.fillRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
                    }

                    if (isHighlighted) {
                        ctx.strokeStyle = '#a78bfa';
                        ctx.lineWidth = 1.5 / zoom;
                        ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
                    }
                } else {
                    // Checkerboard for transparent
                    ctx.fillStyle = (x + y) % 2 === 0 ? '#374151' : '#2d3748';
                    ctx.fillRect(px, py, CELL, CELL);
                }
            }
        }

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5 / zoom;
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, h); ctx.stroke();
        }
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(w, y * CELL); ctx.stroke();
        }

        // Board separators
        ctx.strokeStyle = 'rgba(239,68,68,0.5)';
        ctx.lineWidth = 1.5 / zoom;
        for (let x = boardSize; x < cols; x += boardSize) {
            ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, h); ctx.stroke();
        }
        for (let y = boardSize; y < rows; y += boardSize) {
            ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(w, y * CELL); ctx.stroke();
        }

        ctx.restore();
    }, [grid, zoom, offset, highlightColorId, boardSize]);

    useEffect(() => { draw(); }, [draw]);

    const getCell = useCallback((e: React.MouseEvent | MouseEvent): [number, number] | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left - offset.x) / zoom;
        const my = (e.clientY - rect.top - offset.y) / zoom;
        const cx = Math.floor(mx / CELL);
        const cy = Math.floor(my / CELL);
        if (cx >= 0 && cx < grid.cols && cy >= 0 && cy < grid.rows) return [cx, cy];
        return null;
    }, [grid, zoom, offset]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const pos = getCell(e);
        if (pos) {
            const [cx, cy] = pos;
            const cell = grid.cells[cy][cx];
            if (cell) {
                setTooltip({ x: e.clientX, y: e.clientY, color: cell, cx, cy });
            } else {
                setTooltip(null);
            }

            if (isPainting.current) {
                if (mode === 'paint') onCellChange(cx, cy, selectedColor);
                if (mode === 'erase') onCellChange(cx, cy, null);
            }
        } else {
            setTooltip(null);
        }

        if (panStart.current && mode === 'select') {
            const dx = e.clientX - panStart.current.x;
            const dy = e.clientY - panStart.current.y;
            setOffset({ x: panStart.current.ox + dx, y: panStart.current.oy + dy });
        }
    }, [getCell, grid, mode, selectedColor, onCellChange]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && mode === 'select')) {
            panStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
            return;
        }
        const pos = getCell(e);
        if (!pos) return;
        const [cx, cy] = pos;
        if (mode === 'paint') { isPainting.current = true; onCellChange(cx, cy, selectedColor); }
        if (mode === 'erase') { isPainting.current = true; onCellChange(cx, cy, null); }
        if (mode === 'eyedropper') {
            const cell = grid.cells[cy][cx];
            if (cell) { onPickColor(cell); setMode('paint'); }
        }
        if (mode === 'fill') {
            fillFlood(cx, cy);
        }
    }, [getCell, mode, selectedColor, onCellChange, onPickColor, offset, grid]);

    const fillFlood = useCallback((startX: number, startY: number) => {
        const target = grid.cells[startY][startX];
        const targetId = target?.id ?? null;
        if (targetId === selectedColor?.id) return;

        const visited = new Set<string>();
        const queue: [number, number][] = [[startX, startY]];
        while (queue.length) {
            const [x, y] = queue.shift()!;
            const key = `${x},${y}`;
            if (visited.has(key)) continue;
            if (x < 0 || x >= grid.cols || y < 0 || y >= grid.rows) continue;
            const cur = grid.cells[y][x];
            if ((cur?.id ?? null) !== targetId) continue;
            visited.add(key);
            onCellChange(x, y, selectedColor);
            queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }, [grid, selectedColor, onCellChange]);

    const handleMouseUp = useCallback(() => {
        isPainting.current = false;
        panStart.current = null;
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)));
    }, []);

    const resetView = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };

    const tools = [
        { id: 'select', icon: MousePointer, label: '平移' },
        { id: 'paint', icon: Pencil, label: '画笔' },
        { id: 'erase', icon: Eraser, label: '橡皮' },
        { id: 'eyedropper', icon: Pipette, label: '取色' },
        { id: 'fill', icon: PaintBucket, label: '填充' },
    ] as const;

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0
        });
        handleMouseDown(mouseEvent as any);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            handleMouseMove(mouseEvent as any);
        }
    };

    const handleTouchEnd = () => {
        handleMouseUp();
    };

    return (
        <div className="flex flex-col h-full gap-2 sm:gap-3">
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-h-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800/80 rounded-xl p-0.5 sm:p-1 border border-white/10 flex-shrink-0">
                    {tools.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setMode(t.id)}
                            title={t.label}
                            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-200 ${mode === t.id ? 'bg-violet-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <t.icon size={12} className="sm:size-[13px]" />
                            <span className="hidden sm:inline">{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800/80 rounded-xl p-0.5 sm:p-1 border border-white/10 flex-shrink-0">
                    <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, z * 0.85))} className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <ZoomOut size={12} className="sm:size-[14px]" />
                    </button>
                    <span className="text-[10px] sm:text-xs text-slate-300 min-w-[2.2rem] sm:min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, z * 1.18))} className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                        <ZoomIn size={12} className="sm:size-[14px]" />
                    </button>
                </div>

                {/* BG Mode */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-800/80 rounded-xl p-0.5 sm:p-1 border border-white/10 flex-shrink-0">
                    {(['dark', 'light', 'board'] as const).map((b) => (
                        <button
                            key={b}
                            onClick={() => setBgMode(b)}
                            className={`px-1.5 sm:px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all ${bgMode === b ? 'bg-white/20 text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {b.toUpperCase().charAt(0)}
                        </button>
                    ))}
                </div>

                <button onClick={resetView} className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                    <RotateCcw size={12} className="sm:size-[14px]" />
                </button>

                {highlightColorId && (
                    <button
                        onClick={() => setHighlightColorId(null)}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-violet-500/20 border border-violet-500/40 text-violet-300 rounded-xl hover:bg-violet-500/30 transition-all"
                    >
                        取消
                    </button>
                )}
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 min-h-0 touch-none"
                style={{ cursor: mode === 'select' ? 'grab' : mode === 'paint' ? 'crosshair' : mode === 'erase' ? 'cell' : mode === 'eyedropper' ? 'copy' : 'crosshair' }}
            >
                <canvas
                    ref={canvasRef}
                    width={Math.max(600, grid.cols * CELL + 400)}
                    height={Math.max(400, grid.rows * CELL + 400)}
                    style={{ width: '100%', height: '100%' }}
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseLeave={() => { setTooltip(null); handleMouseUp(); }}
                    onWheel={handleWheel}
                />
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 pointer-events-none bg-slate-900/95 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-sm flex items-center gap-2"
                    style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
                >
                    <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ background: tooltip.color.hex }} />
                    <div>
                        <div className="text-white font-semibold">{tooltip.color.nameZh}</div>
                        <div className="text-[10px] text-slate-400">{tooltip.color.id}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
