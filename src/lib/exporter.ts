import { BeadColor, BeadGrid, ShoppingItem } from '@/types';
import jsPDF from 'jspdf';

const CELL_PX = 20; // pixels per cell in exported PNG

export function getShoppingList(grid: BeadGrid): ShoppingItem[] {
    const freq = new Map<string, { color: BeadColor; count: number }>();
    for (const row of grid.cells) {
        for (const cell of row) {
            if (!cell) continue;
            const existing = freq.get(cell.id);
            if (existing) existing.count++;
            else freq.set(cell.id, { color: cell, count: 1 });
        }
    }
    return [...freq.values()]
        .map((x) => ({ color: x.color, count: x.count }))
        .sort((a, b) => b.count - a.count);
}

export function exportPNG(grid: BeadGrid, showNumbers: boolean): void {
    const { cols, rows, cells } = grid;
    const canvas = document.createElement('canvas');
    canvas.width = cols * CELL_PX + 1;
    canvas.height = rows * CELL_PX + 1;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = cells[y][x];
            const px = x * CELL_PX;
            const py = y * CELL_PX;

            if (cell) {
                ctx.fillStyle = cell.hex;
                ctx.fillRect(px + 1, py + 1, CELL_PX - 1, CELL_PX - 1);
                if (showNumbers && CELL_PX >= 16) {
                    ctx.fillStyle = getContrastColor(cell.hex);
                    ctx.font = `${Math.floor(CELL_PX * 0.38)}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const label = cell.id.split('-')[1] || cell.id.slice(0, 4);
                    ctx.fillText(label, px + CELL_PX / 2, py + CELL_PX / 2);
                }
            } else {
                // transparent cell
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(px + 1, py + 1, CELL_PX - 1, CELL_PX - 1);
            }

            // Grid lines
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.strokeRect(px + 0.5, py + 0.5, CELL_PX, CELL_PX);

            // Board separators (29x29 grid marks)
            if (x % 29 === 0 || y % 29 === 0) {
                ctx.strokeStyle = 'rgba(255,0,0,0.4)';
                ctx.lineWidth = 1.5;
                if (x % 29 === 0 && x > 0) {
                    ctx.beginPath();
                    ctx.moveTo(px + 0.5, py);
                    ctx.lineTo(px + 0.5, py + CELL_PX);
                    ctx.stroke();
                }
                if (y % 29 === 0 && y > 0) {
                    ctx.beginPath();
                    ctx.moveTo(px, py + 0.5);
                    ctx.lineTo(px + CELL_PX, py + 0.5);
                    ctx.stroke();
                }
                ctx.lineWidth = 1;
            }
        }
    }

    const link = document.createElement('a');
    link.download = 'pingdou-pattern.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

export function exportCSV(items: ShoppingItem[]): void {
    const rows = [
        ['色号', '颜色名称', '中文名', '品牌', '颗数', '参考包数(约500颗/包)'],
        ...items.map((i) => {
            const c = i.color;
            const count = i.count;
            const vals: string[] = [
                c.id,
                c.nameZh || c.name,
                c.hex,
                count.toString(),
                Math.ceil(count / 500).toString() + '包',
            ];
            return vals;
        }),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.download = 'pingdou-shopping.csv';
    link.href = URL.createObjectURL(blob);
    link.click();
}

export function exportPDF(grid: BeadGrid): void {
    const shopping = getShoppingList(grid);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Title
    pdf.setFontSize(16);
    pdf.text('拼豆方案 - 采购清单', 14, 18);
    pdf.setFontSize(10);
    pdf.text(`尺寸：${grid.cols} × ${grid.rows} 格 | 共 ${shopping.length} 种颜色`, 14, 26);

    // Shopping table
    pdf.setFontSize(9);
    const headers = ['色号', '颜色(中文)', '颜色(英文)', '品牌', '颗数', '参考包数'];
    const colWidths = [25, 30, 35, 20, 20, 25];
    let x = 14, y = 35;
    headers.forEach((h, i) => {
        pdf.text(h, x, y);
        x += colWidths[i];
    });
    y += 5;
    pdf.line(14, y - 1, 280, y - 1);

    shopping.forEach((item) => {
        if (y > 190) {
            pdf.addPage();
            y = 20;
        }
        x = 14;
        const vals = [
            item.color.id,
            item.color.nameZh || '',
            item.color.name,
            item.color.brand,
            item.count.toString(),
            Math.ceil(item.count / 500).toString() + ' 包',
        ];
        vals.forEach((v, i) => {
            pdf.text(v.slice(0, 16), x, y);
            x += colWidths[i];
        });
        y += 6;
    });

    pdf.save('pingdou-shopping.pdf');
}

function getContrastColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 140 ? '#000000' : '#FFFFFF';
}
