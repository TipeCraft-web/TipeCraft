import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve(import.meta.dirname, '..');
const blocksSource = fs.readFileSync(path.join(root, 'src/game/blocks.ts'), 'utf8');
const blockEnum = blocksSource.match(/export enum BlockType\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
const blockColors = new Map();
const blockTypes = new Map();

for (const match of blockEnum.matchAll(/\b([A-Z0-9_]+)\s*=\s*(\d+)/g)) {
  blockTypes.set(Number(match[2]), match[1]);
}
for (const match of blocksSource.matchAll(/\[BlockType\.([A-Z0-9_]+)\]\s*:\s*h\(0x([0-9a-f]+)\)/gi)) {
  blockColors.set(match[1], Number.parseInt(match[2], 16));
}

const blockDir = path.join(root, 'public/textures/blocks');
const mobDir = path.join(root, 'public/textures/mobs');
fs.mkdirSync(blockDir, { recursive: true });
fs.mkdirSync(mobDir, { recursive: true });
for (const file of fs.readdirSync(blockDir)) {
  if (file.endsWith('.png')) fs.unlinkSync(path.join(blockDir, file));
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function shade(color, amount) {
  return [
    clamp(((color >> 16) & 255) * amount),
    clamp(((color >> 8) & 255) * amount),
    clamp((color & 255) * amount),
  ];
}

function hash(seed) {
  let x = seed | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 0xffffffff;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const payload = Buffer.concat([typeBytes, data]);
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0);
  payload.copy(result, 4);
  result.writeUInt32BE(crc32(payload), data.length + 8);
  return result;
}

function encodePng(width, height, pixels) {
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    scanlines[rowStart] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset + y * width * 4, width * 4).copy(scanlines, rowStart + 1);
  }
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([header, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function setPixel(pixels, width, x, y, color, alpha = 255) {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const i = (y * width + x) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = alpha;
}

function drawRect(pixels, width, x, y, w, h, color, alpha = 255) {
  for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) setPixel(pixels, width, px, py, color, alpha);
}

function blend(a, b, amount) {
  return [
    clamp(a[0] + (b[0] - a[0]) * amount),
    clamp(a[1] + (b[1] - a[1]) * amount),
    clamp(a[2] + (b[2] - a[2]) * amount),
  ];
}

function warmMatteHex(color, amount = 0.12) {
  const softened = shade(color, 0.96);
  const warmed = blend(softened, [186, 158, 124], amount);
  return (warmed[0] << 16) | (warmed[1] << 8) | warmed[2];
}

function cell(pixels, size, x, y, color, width = 2, alpha = 255) {
  drawRect(pixels, size, x * width, y * width, width, width, color, alpha);
}

function paintGrid(pixels, size, id, baseColor, variant, painter) {
  const width = 2;
  const dark = shade(baseColor, variant === 0 ? 0.70 : 0.62);
  const midDark = shade(baseColor, variant === 0 ? 0.86 : 0.78);
  const base = shade(baseColor, variant === 0 ? 1.02 : variant === 2 ? 0.96 : 1);
  const light = shade(baseColor, variant === 0 ? 1.16 : 1.10);
  const highlight = shade(baseColor, variant === 0 ? 1.24 : 1.18);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const n = hash(id * 4099 + x * 131 + y * 977);
      const color = painter({ x, y, n, dark, midDark, base, light, highlight });
      cell(pixels, size, x, y, color, width);
    }
  }
  for (let i = 0; i < 4; i++) {
    const x = (i * 5 + id) % 8;
    const y = (i * 3 + id * 2) % 8;
    cell(pixels, size, x, y, midDark, width);
  }
}

function makeBlockTexture(id, key, variant) {
  const size = 16;
  const pixels = new Uint8Array(size * size * 4);
  const color = warmMatteHex(blockColors.get(key) ?? 0x888888);
  const lower = key.toLowerCase();
  const stone = /(stone|andesite|diorite|granite|deepslate|tuff|calcite|basalt|blackstone|obsidian|bedrock|cobble|brick|raw_stone)/.test(lower);
  const wood = /(wood|log|plank|stem|bamboo|fence|bookshelf|bookcase)/.test(lower);
  const ore = /(ore|debris|amethyst|cluster)/.test(lower);
  const leaves = /(leaf|leaves|moss|grass|mycelium|podzol|nylium|wart|mushroom)/.test(lower);
  const glass = lower.includes('glass');

  if (key === 'GRASS' || key === 'ROOTED_GRASS') {
    const dirt = 0x8f6544;
    const grass = 0x5f9849;
    const grassDark = 0x486d3c;
    const grassLight = 0x82ad61;
    if (variant === 0) {
      paintGrid(pixels, size, id, grass, variant, ({ n, dark, base, light, highlight }) =>
        n < 0.16 ? dark : n < 0.34 ? light : n < 0.40 ? highlight : base);
    } else if (variant === 1) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const n = hash(id * 101 + x * 17 + y * 43);
          const grassLine = y < 2 || (y === 2 && hash(id * 7 + x * 23) > 0.42);
          const pixel = grassLine
            ? n < 0.20 ? grassDark : n < 0.40 ? grassLight : grass
            : n < 0.18 ? shade(dirt, 0.65) : n < 0.37 ? shade(dirt, 1.18) : shade(dirt, 0.90);
          cell(pixels, size, x, y, pixel);
        }
      }
      for (let x = 0; x < 8; x++) {
        if (hash(id * 31 + x * 19) > 0.62) cell(pixels, size, x, 3, grassDark);
      }
    } else {
      paintGrid(pixels, size, id + 17, dirt, variant, ({ n, dark, base, light, highlight }) =>
        n < 0.16 ? dark : n < 0.32 ? light : n < 0.38 ? highlight : base);
    }
  } else if (key === 'WATER') {
    paintGrid(pixels, size, id, color, variant, ({ x, y, dark, base, light, highlight }) =>
      y % 3 === 0 ? light : (x + y) % 7 === 0 ? highlight : (x + y) % 5 === 0 ? dark : base);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      pixels[i + 3] = 220;
    }
  } else if (glass) {
    paintGrid(pixels, size, id, color, variant, ({ x, y, base, light, highlight }) =>
      x === y || x + y === 7 ? highlight : (x + y) % 5 === 0 ? light : base);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) pixels[(y * size + x) * 4 + 3] = 150;
  } else if (key === 'TNT') {
    paintGrid(pixels, size, id, color, variant, ({ y, dark, base, light, highlight }) =>
      y === 0 || y === 7 ? highlight : y === 1 || y === 6 ? light : y === 3 || y === 4 ? dark : base);
    drawRect(pixels, size, 0, 6, size, 2, shade(color, 0.38));
    drawRect(pixels, size, 4, 6, 8, 2, [240, 228, 180]);
  } else if (key === 'LAVA' || key === 'MAGMA' || key === 'SOUL_FIRE') {
    paintGrid(pixels, size, id, color, variant, ({ n, dark, base, light, highlight }) =>
      n < 0.13 ? highlight : n < 0.28 ? light : n < 0.44 ? dark : base);
  } else if (wood) {
    paintGrid(pixels, size, id, color, variant, ({ x, y, n, dark, base, light }) =>
      n < 0.16 ? dark : n < 0.32 ? light : (x + (lower.includes('plank') ? y : 0)) % 4 === 0 ? dark : base);
    if (lower.includes('plank')) {
      for (let y = 1; y < 8; y += 3) drawRect(pixels, size, 0, y * 2, size, 1, shade(color, 0.52));
    }
  } else if (ore) {
    const oreColor = shade(color, variant === 0 ? 1.45 : 1.30);
    paintGrid(pixels, size, id, blend(shade(color, 0.62), color, 0.45), variant, ({ n, dark, base, light }) =>
      n < 0.18 ? oreColor : n < 0.25 ? light : n < 0.38 ? dark : base);
  } else if (stone) {
    paintGrid(pixels, size, id, color, variant, ({ n, dark, midDark, base, light }) =>
      n < 0.12 ? dark : n < 0.24 ? midDark : n < 0.34 ? light : base);
  } else if (leaves) {
    paintGrid(pixels, size, id, color, variant, ({ n, dark, base, light, highlight }) =>
      n < 0.15 ? dark : n < 0.28 ? highlight : n < 0.42 ? light : base);
  } else {
    paintGrid(pixels, size, id, color, variant, ({ n, dark, base, light, highlight }) =>
      n < 0.14 ? dark : n < 0.28 ? light : n < 0.34 ? highlight : base);
  }

  return pixels;
}

function mobTexture(kind) {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  const palettes = {
    zombie: [0x4d8c3a, 0x2a4a6e, 0x3a6e2a],
    skeleton: [0xe8e0d0, 0xb8b0a0, 0x5a554f],
    creeper: [0x4a9a36, 0x2f6f2a, 0x1a1a1a],
    spider: [0x2a1a1a, 0x1a0a0a, 0xff2020],
    slime: [0x7aee7a, 0x4cbe4c, 0x1a2a1a],
    cow: [0x5c4033, 0xeee8d8, 0x241812],
    pig: [0xffb6c1, 0xf09090, 0x5a3038],
    sheep: [0xeeeeee, 0xaaaaaa, 0x343434],
  };
  let [main, secondary, detail] = palettes[kind] ?? palettes.slime;
  main = warmMatteHex(main, 0.08);
  secondary = warmMatteHex(secondary, 0.08);
  detail = warmMatteHex(detail, 0.06);
  const c = value => shade(value, 1);
  const dark = shade(main, 0.48);
  const mid = shade(main, 0.78);
  const light = shade(main, 1.25);
  const bright = shade(secondary, 1.15);
  drawRect(pixels, size, 4, 4, 56, 56, dark);
  drawRect(pixels, size, 8, 8, 48, 48, c(secondary));
  for (let y = 4; y < 60; y += 4) {
    for (let x = 4; x < 60; x += 4) {
      const n = hash(x * 97 + y * 193 + kind.length * 409);
      const patch = n < 0.16 ? dark : n < 0.31 ? light : n < 0.46 ? c(main) : n < 0.53 ? mid : c(secondary);
      drawRect(pixels, size, x, y, 4, 4, patch);
    }
  }
  // Keep the facial details as chunky 4×4 pixel-art clusters.
  drawRect(pixels, size, 16, 16, 12, 12, c(detail));
  drawRect(pixels, size, 36, 16, 12, 12, c(detail));
  drawRect(pixels, size, 24, 40, 16, 8, c(detail));
  drawRect(pixels, size, 20, 12, 8, 4, bright);
  drawRect(pixels, size, 40, 12, 8, 4, bright);
  for (let i = 0; i < 6; i++) {
    const x = 8 + ((i * 17 + kind.length * 3) % 12) * 4;
    const y = 8 + ((i * 11 + kind.length * 5) % 12) * 4;
    drawRect(pixels, size, x, y, 4, 4, i % 2 ? light : dark);
  }
  return pixels;
}

function pascalCase(key) {
  return key.toLowerCase().split('_').map(part => part[0].toUpperCase() + part.slice(1)).join('');
}

for (const [id, key] of [...blockTypes.entries()].filter(([value]) => value > 0 && value < 256)) {
  const prefix = pascalCase(key);
  for (const [variant, suffix] of [[0, 'Top'], [1, 'Side'], [2, 'Down']]) {
    fs.writeFileSync(path.join(blockDir, `${prefix}${suffix}.png`), encodePng(16, 16, makeBlockTexture(id, key, variant)));
  }
}

for (const kind of ['zombie', 'skeleton', 'creeper', 'spider', 'slime', 'cow', 'pig', 'sheep']) {
  fs.writeFileSync(path.join(mobDir, `${kind}.png`), encodePng(64, 64, mobTexture(kind)));
}

console.log(`Generated ${(blockTypes.size - 1) * 3} block textures (Top/Side/Down) and 8 mob textures.`);