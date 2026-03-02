import { BeadColor } from '@/types';

// k-d tree node for fast nearest-neighbor color search
interface KDNode {
    color: BeadColor;
    lab: [number, number, number];
    left: KDNode | null;
    right: KDNode | null;
    axis: number;
}

function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
    let wr = r / 255.0;
    let wg = g / 255.0;
    let wb = b / 255.0;

    wr = wr > 0.04045 ? Math.pow((wr + 0.055) / 1.055, 2.4) : wr / 12.92;
    wg = wg > 0.04045 ? Math.pow((wg + 0.055) / 1.055, 2.4) : wg / 12.92;
    wb = wb > 0.04045 ? Math.pow((wb + 0.055) / 1.055, 2.4) : wb / 12.92;

    wr *= 100;
    wg *= 100;
    wb *= 100;

    const x = (wr * 0.4124564 + wg * 0.3575761 + wb * 0.1804375) / 95.047;
    const y = (wr * 0.2126729 + wg * 0.7151522 + wb * 0.0721750) / 100.000;
    const z = (wr * 0.0193339 + wg * 0.1191920 + wb * 0.9503041) / 108.883;

    const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
    const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
    const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

    const l = (116 * fy) - 16;
    const a = 500 * (fx - fy);
    const labB = 200 * (fy - fz);

    return [l, a, labB];
}

function hexToLab(hex: string): [number, number, number] {
    const rgb = hexToRgb(hex);
    return rgbToLab(rgb[0], rgb[1], rgb[2]);
}

function buildKDTree(colors: BeadColor[], depth = 0): KDNode | null {
    if (colors.length === 0) return null;
    const axis = depth % 3;
    
    // Compute LAB for all and inject into a wrapper
    const wrapped = colors.map(c => ({
        color: c,
        lab: hexToLab(c.hex)
    }));

    wrapped.sort((a, b) => a.lab[axis] - b.lab[axis]);

    const mid = Math.floor(wrapped.length / 2);
    return {
        color: wrapped[mid].color,
        lab: wrapped[mid].lab,
        left: buildKDTree(wrapped.slice(0, mid).map(w => w.color), depth + 1),
        right: buildKDTree(wrapped.slice(mid + 1).map(w => w.color), depth + 1),
        axis,
    };
}

function colorDistSq(a: [number, number, number], b: [number, number, number]): number {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    return dr * dr + dg * dg + db * db;
}

function searchKDTree(
    node: KDNode | null,
    target: [number, number, number],
    best: { color: BeadColor; dist: number }
): void {
    if (!node) return;
    const d = colorDistSq(node.lab, target);
    if (d < best.dist) {
        best.dist = d;
        best.color = node.color;
    }
    const diff = target[node.axis] - node.lab[node.axis];
    const first = diff < 0 ? node.left : node.right;
    const second = diff < 0 ? node.right : node.left;
    searchKDTree(first, target, best);
    if (diff * diff < best.dist) {
        searchKDTree(second, target, best);
    }
}

export class ColorQuantizer {
    private tree: KDNode | null = null;
    private palette: BeadColor[] = [];

    constructor(palette: BeadColor[]) {
        this.palette = palette;
        this.tree = buildKDTree(palette);
    }

    findNearest(hex: string): BeadColor {
        const lab = hexToLab(hex);
        const best = { color: this.palette[0], dist: Infinity };
        searchKDTree(this.tree, lab, best);
        return best.color;
    }

    findNearestRgb(r: number, g: number, b: number): BeadColor {
        const lab = rgbToLab(r, g, b);
        const best = { color: this.palette[0], dist: Infinity };
        searchKDTree(this.tree, lab, best);
        return best.color;
    }
}

// Limit palette to at most maxColors by merging similar ones
export function limitColors(
    cells: (BeadColor | null)[][],
    allColors: BeadColor[],
    maxColors: number,
    quantizer: ColorQuantizer
): (BeadColor | null)[][] {
    // Count frequencies
    const freq = new Map<string, { color: BeadColor; count: number }>();
    for (const row of cells) {
        for (const cell of row) {
            if (!cell) continue;
            const existing = freq.get(cell.id);
            if (existing) existing.count++;
            else freq.set(cell.id, { color: cell, count: 1 });
        }
    }

    if (freq.size <= maxColors) return cells;

    // Sort by frequency desc, keep top maxColors
    const sorted = [...freq.values()].sort((a, b) => b.count - a.count);
    const keepIds = new Set(sorted.slice(0, maxColors).map((x) => x.color.id));

    // Build a reduced quantizer using only the kept colors
    const kept = allColors.filter((c) => keepIds.has(c.id));
    const reducer = new ColorQuantizer(kept);

    return cells.map((row) =>
        row.map((cell) => {
            if (!cell) return null;
            if (keepIds.has(cell.id)) return cell;
            return reducer.findNearest(cell.hex);
        })
    );
}
