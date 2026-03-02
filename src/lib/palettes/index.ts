import { BeadColor, PaletteName } from '@/types';
import { perlerPalette } from './perler';
import { hamaPalette } from './hama';
import { artkalPalette } from './artkal';
import { mardColors } from './mard';

// Deduplicate by hexcode when combining palettes
function mergePalettes(...palettes: BeadColor[][]): BeadColor[] {
    const seen = new Set<string>();
    const result: BeadColor[] = [];
    for (const palette of palettes) {
        for (const color of palette) {
            if (!seen.has(color.hex.toLowerCase())) {
                seen.add(color.hex.toLowerCase());
                result.push(color);
            }
        }
    }
    return result;
}

const combinedPalette = mergePalettes(perlerPalette, hamaPalette, artkalPalette, mardColors);

export const palettes: Record<string, BeadColor[]> = {
    Perler: perlerPalette,
    Hama: hamaPalette,
    Artkal: artkalPalette,
    MARD: mardColors,
    Combined: combinedPalette,
};

export function getPalette(name: PaletteName): BeadColor[] {
    return palettes[name];
}

export { perlerPalette, hamaPalette, artkalPalette, mardColors, combinedPalette };
