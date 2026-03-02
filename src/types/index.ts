export interface BeadColor {
    id: string;
    name: string;
    nameZh?: string;
    hex: string;
    brand: 'Perler' | 'Hama' | 'Artkal' | 'MARD' | 'Custom';
}

export interface BeadGrid {
    cols: number;
    rows: number;
    cells: (BeadColor | null)[][];
}

export type PaletteName = 'Perler' | 'Hama' | 'Artkal' | 'MARD' | 'Combined';

export interface GenerateConfig {
    palette: PaletteName;
    cols: number;
    rows: number;
    maxColors: number;
    dithering: boolean;
    boardSize: 29 | 58;
    removeBackground: boolean;
    edgeEnhance: boolean;
}

export interface HistoryEntry {
    cells: (BeadColor | null)[][];
}

export type EditMode = 'select' | 'paint' | 'erase' | 'eyedropper' | 'fill';

export interface ShoppingItem {
    color: BeadColor;
    count: number;
}
