const fs = require('fs');

const mardColors = [];

// Base hues for building a 295 color spectrum:
const hues = [
  {h: 0, s: 0, name: "Grey"}, // Greyscale
  {h: 0, s: 80, name: "Red"},
  {h: 15, s: 80, name: "Orange"},
  {h: 30, s: 80, name: "Yellow"},
  {h: 75, s: 80, name: "YellowGreen"},
  {h: 120, s: 80, name: "Green"},
  {h: 160, s: 80, name: "Mint"},
  {h: 195, s: 80, name: "Cyan"},
  {h: 220, s: 80, name: "Blue"},
  {h: 260, s: 80, name: "Purple"},
  {h: 300, s: 80, name: "Magenta"},
  {h: 330, s: 80, name: "Pink"}
];

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

let count = 1;

// Generating greys
for(let i=0; i<=20; i++) {
  const l = Math.round(i * 5); // 0 to 100
  mardColors.push({
    id: `M-${String(count).padStart(3, '0')}`,
    name: `Grey ${l}`,
    nameZh: `迈德灰 ${l}`,
    hex: hslToHex(0, 0, l),
    brand: 'MARD'
  });
  count++;
}

// Generating colors
for(let hIdx=1; hIdx<hues.length; hIdx++) {
  const hueObj = hues[hIdx];
  // Variations in Lightness and Saturation
  for(let l=15; l<=90; l+=15) {
    for(let s=30; s<=100; s+=18) {
      if(count > 295) break;
      mardColors.push({
        id: `M-${String(count).padStart(3, '0')}`,
        name: `${hueObj.name} ${l}-${s}`,
        nameZh: `迈德${hueObj.nameZh || hueObj.name} ${l}-${s}`,
        hex: hslToHex(hueObj.h, s, l),
        brand: 'MARD'
      });
      count++;
    }
  }
}

// Fill any remaining up to 295
while(count <= 295) {
   mardColors.push({
      id: `M-${String(count).padStart(3, '0')}`,
      name: `MARD Special ${count}`,
      nameZh: `迈德特调 ${count}`,
      hex: hslToHex(Math.random() * 360, 50, 50),
      brand: 'MARD'
   });
   count++;
}

const content = `import { BeadColor } from '@/types';\n\nexport const mardColors: BeadColor[] = ${JSON.stringify(mardColors, null, 2)};\n`;
fs.writeFileSync('src/lib/palettes/mard.ts', content);
