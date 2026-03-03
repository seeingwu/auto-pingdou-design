import { BeadColor, BeadGrid } from '@/types';
import { ColorQuantizer, limitColors } from './colorQuantizer';

export interface ProcessOptions {
    cols: number;
    rows: number;
    palette: BeadColor[];
    maxColors: number;
    dithering: boolean;
    removeBackground?: boolean;
    edgeEnhance?: boolean;
}

export async function imageToBeadGrid(
    imageFile: File,
    options: ProcessOptions
): Promise<BeadGrid> {
    const { cols, rows, palette, maxColors, dithering, removeBackground, edgeEnhance } = options;

    const img = await loadImage(imageFile);
    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d')!;

    // Draw image scaled to target grid size
    ctx.drawImage(img, 0, 0, cols, rows);
    const imageData = ctx.getImageData(0, 0, cols, rows);
    const data = imageData.data;

    if (edgeEnhance) {
        applySharpenBase(imageData, cols, rows, 1.2); // Increased strength
    }

    if (removeBackground) {
        applyMagicWandBgRemoval(imageData, cols, rows);
    }

    const quantizer = new ColorQuantizer(palette);

    // Initialize error buffer for Floyd-Steinberg dithering
    const errR = new Float32Array(cols * rows);
    const errG = new Float32Array(cols * rows);
    const errB = new Float32Array(cols * rows);

    let cells: (BeadColor | null)[][] = [];

    for (let y = 0; y < rows; y++) {
        const row: (BeadColor | null)[] = [];
        for (let x = 0; x < cols; x++) {
            const idx = (y * cols + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a < 128) { // More strict alpha threshold
                row.push(null);
                continue;
            }

            let pr = r, pg = g, pb = b;
            if (dithering) {
                const ei = y * cols + x;
                pr = Math.min(255, Math.max(0, r + errR[ei]));
                pg = Math.min(255, Math.max(0, g + errG[ei]));
                pb = Math.min(255, Math.max(0, b + errB[ei]));
            }

            const nearest = quantizer.findNearestRgb(pr, pg, pb);

            if (dithering) {
                const nr = parseInt(nearest.hex.slice(1, 3), 16);
                const ng = parseInt(nearest.hex.slice(3, 5), 16);
                const nb = parseInt(nearest.hex.slice(5, 7), 16);
                const qeR = pr - nr;
                const qeG = pg - ng;
                const qeB = pb - nb;

                // Adjust dithering strength based on grid size
                // Smaller grids get less dithering to avoid "salt & pepper" noise
                const ditherStrength = Math.min(1.0, Math.max(0.4, (cols * rows) / (60 * 60)));

                const spread = (xi: number, yi: number, factor: number) => {
                    if (xi >= 0 && xi < cols && yi >= 0 && yi < rows) {
                        const i = yi * cols + xi;
                        errR[i] += qeR * factor * ditherStrength;
                        errG[i] += qeG * factor * ditherStrength;
                        errB[i] += qeB * factor * ditherStrength;
                    }
                };
                spread(x + 1, y, 7 / 16);
                spread(x - 1, y + 1, 3 / 16);
                spread(x, y + 1, 5 / 16);
                spread(x + 1, y + 1, 1 / 16);
            }

            row.push(nearest);
        }
        cells.push(row);
    }

    // NEW: Apply Morphological Despeckle Filter
    // This removes isolated pixels ("salt and pepper" noise)
    cells = applyDespeckle(cells, cols, rows);

    // Optional: limit distinct colors
    if (maxColors > 0 && maxColors < palette.length) {
        const limited = limitColors(cells, palette, maxColors, quantizer);
        return { cols, rows, cells: limited };
    }

    return { cols, rows, cells };
}

/**
 * Removes isolated 1x1 pixels by replacing them with the dominant color of their neighbors.
 * This simulates the "ironing" process where small details merge.
 */
function applyDespeckle(cells: (BeadColor | null)[][], cols: number, rows: number): (BeadColor | null)[][] {
    const newCells = cells.map(row => [...row]);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const current = cells[y][x];
            if (!current) continue;

            const neighbors: Map<string, { color: BeadColor, count: number }> = new Map();
            let differentNeighbors = 0;
            let totalNeighbors = 0;

            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                        totalNeighbors++;
                        const nab = cells[ny][nx];
                        if (nab) {
                            if (nab.id !== current.id) {
                                differentNeighbors++;
                                const entry = neighbors.get(nab.id) || { color: nab, count: 0 };
                                entry.count++;
                                neighbors.set(nab.id, entry);
                            }
                        } else {
                            differentNeighbors++;
                        }
                    }
                }
            }

            // If an island (all neighbors are different or null)
            if (differentNeighbors === totalNeighbors && neighbors.size > 0) {
                // Pick the most common neighbor color
                const sorted = Array.from(neighbors.values()).sort((a, b) => b.count - a.count);
                newCells[y][x] = sorted[0].color;
            }
        }
    }
    return newCells;
}

export async function imageFromUrl(url: string, options: ProcessOptions): Promise<BeadGrid> {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], 'image.png', { type: blob.type });
    return imageToBeadGrid(file, options);
}

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = reject;
        img.src = url;
    });
}

function applySharpenBase(imageData: ImageData, w: number, h: number, strength: number = 1.0) {
    const kernel = [
        0, -1 * strength, 0,
        -1 * strength, 1 + 4 * strength, -1 * strength,
        0, -1 * strength, 0
    ];
    const side = Math.round(Math.sqrt(kernel.length));
    const halfSide = Math.floor(side / 2);
    const src = new Uint8ClampedArray(imageData.data);
    const dst = imageData.data;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const dstOff = (y * w + x) * 4;
            let r = 0, g = 0, b = 0;
            for (let cy = 0; cy < side; cy++) {
                for (let cx = 0; cx < side; cx++) {
                    const scy = y + cy - halfSide;
                    const scx = x + cx - halfSide;
                    if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
                        const srcOff = (scy * w + scx) * 4;
                        const wt = kernel[cy * side + cx];
                        r += src[srcOff] * wt;
                        g += src[srcOff + 1] * wt;
                        b += src[srcOff + 2] * wt;
                    }
                }
            }
            dst[dstOff] = Math.min(255, Math.max(0, r));
            dst[dstOff + 1] = Math.min(255, Math.max(0, g));
            dst[dstOff + 2] = Math.min(255, Math.max(0, b));
            // Keep original alpha
        }
    }
}

function applyMagicWandBgRemoval(imageData: ImageData, w: number, h: number) {
    const data = imageData.data;
    const visited = new Uint8Array(w * h);
    const stack: [number, number][] = [];

    // Background color typically from corners
    const getCornerColors = () => [
        { r: data[0], g: data[1], b: data[2], a: data[3] },
        { r: data[(w - 1) * 4], g: data[(w - 1) * 4 + 1], b: data[(w - 1) * 4 + 2], a: data[(w - 1) * 4 + 3] },
        { r: data[(h - 1) * w * 4], g: data[(h - 1) * w * 4 + 1], b: data[(h - 1) * w * 4 + 2], a: data[(h - 1) * w * 4 + 3] },
        { r: data[((h - 1) * w + w - 1) * 4], g: data[((h - 1) * w + w - 1) * 4 + 1], b: data[((h - 1) * w + w - 1) * 4 + 2], a: data[((h - 1) * w + w - 1) * 4 + 3] },
    ];

    const targetColors = getCornerColors().filter(c => c.a > 200);
    if (!targetColors.length) return; // All transparent already

    // We assume the top-left color is the background color if solid
    const targetBg = targetColors[0];
    const tolerance = 40;

    const colorMatch = (r: number, g: number, b: number) => {
        return Math.abs(r - targetBg.r) < tolerance &&
            Math.abs(g - targetBg.g) < tolerance &&
            Math.abs(b - targetBg.b) < tolerance;
    };

    const pushIfMatch = (x: number, y: number) => {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const i = y * w + x;
        if (visited[i]) return;
        visited[i] = 1;

        const idx = i * 4;
        if (data[idx + 3] < 10) return; // Already transparent

        if (colorMatch(data[idx], data[idx + 1], data[idx + 2])) {
            data[idx + 3] = 0; // Make transparent
            stack.push([x, y]);
        }
    };

    // Seed corners
    pushIfMatch(0, 0);
    pushIfMatch(w - 1, 0);
    pushIfMatch(0, h - 1);
    pushIfMatch(w - 1, h - 1);

    while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        pushIfMatch(x - 1, y);
        pushIfMatch(x + 1, y);
        pushIfMatch(x, y - 1);
        pushIfMatch(x, y + 1);
    }
}
