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

function makeBlockTexture(id, key) {
  const size = 16;
  const pixels = new Uint8Array(size * size * 4);
  const color = blockColors.get(key) ?? 0x888888;
  const base = shade(color, 1);
  const dark = shade(color, 0.72);
  const light = shade(color, 1.22);
  const lower = key.toLowerCase();
  const stone = /(stone|andesite|diorite|granite|deepslate|tuff|calcite|basalt|blackstone|obsidian|bedrock|cobble|brick|raw_stone)/.test(lower);
  const wood = /(wood|log|plank|stem|bamboo|fence|bookshelf|bookcase)/.test(lower);
  const ore = /(ore|debris|amethyst|cluster)/.test(lower);
  const leaves = /(leaf|leaves|moss|grass|mycelium|podzol|nylium|wart|mushroom)/.test(lower);
  const glass = lower.includes('glass');

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edge = x === 0 || y === 0 || x === 15 || y === 15;
      let pixel = base;
      let alpha = 255;

      if (key === 'WATER') {
        pixel = y % 5 === 1 ? shade(color, 1.16) : y % 5 === 2 ? shade(color, 0.94) : shade(color, 1.04);
        if ((x + y * 3) % 11 === 0) pixel = shade(color, 1.2);
        alpha = 220;
      } else if (glass) {
        pixel = (x === y || x + y === 15) ? light : shade(color, 0.92);
        alpha = 150;
      } else if (key === 'GRASS' || key === 'ROOTED_GRASS') {
        pixel = y > 11 ? shade(0x8b6914, 0.92) : (x + y * 7) % 13 === 0 ? light : base;
      } else if (key === 'TNT') {
        pixel = y < 3 || y > 12 ? light : ((x + y) % 5 === 0 ? dark : base);
      } else if (key === 'LAVA' || key === 'MAGMA' || key === 'SOUL_FIRE') {
        pixel = (x + y * 2) % 7 === 0 ? light : (x + y) % 4 === 0 ? dark : base;
      } else if (wood) {
        pixel = x % 5 === 0 ? dark : x % 5 === 1 ? light : base;
        if (lower.includes('plank') && y % 5 === 0) pixel = dark;
      } else if (ore) {
        pixel = (x * 7 + y * 11 + id) % 17 < 3 ? light : base;
        if ((x + y + id) % 19 === 0) pixel = dark;
      } else if (stone) {
        const n = (hash(id * 4099 + x * 31 + y * 97) - 0.5) * 0.18;
        pixel = shade(color, 1 + n);
        if ((x * 3 + y * 5 + id) % 29 === 0) pixel = light;
      } else if (leaves) {
        pixel = (x * 5 + y * 3 + id) % 9 === 0 ? light : (x + y) % 11 === 0 ? dark : base;
      } else {
        pixel = (x + y + id) % 17 === 0 ? light : (x * 2 + y + id) % 23 === 0 ? dark : base;
      }

      setPixel(pixels, size, x, y, edge ? dark : pixel, alpha);
    }
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
  const [main, secondary, detail] = palettes[kind] ?? palettes.slime;
  const c = value => shade(value, 1);
  drawRect(pixels, size, 6, 6, 52, 52, c(main), 255);
  drawRect(pixels, size, 10, 10, 44, 44, c(secondary), 255);
  for (let y = 12; y < 52; y += 5) {
    for (let x = 12; x < 52; x += 5) {
      if ((x * 13 + y * 7 + kind.length) % 11 < 3) drawRect(pixels, size, x, y, 3, 3, c(main), 255);
    }
  }
  drawRect(pixels, size, 18, 18, 8, 8, c(detail), 255);
  drawRect(pixels, size, 38, 18, 8, 8, c(detail), 255);
  drawRect(pixels, size, 24, 38, 16, 7, c(detail), 255);
  return pixels;
}

for (const [id, key] of [...blockTypes.entries()].filter(([value]) => value > 0 && value < 256)) {
  const name = `${String(id).padStart(3, '0')}-${key.toLowerCase()}.png`;
  fs.writeFileSync(path.join(blockDir, name), encodePng(16, 16, makeBlockTexture(id, key)));
}

for (const kind of ['zombie', 'skeleton', 'creeper', 'spider', 'slime', 'cow', 'pig', 'sheep']) {
  fs.writeFileSync(path.join(mobDir, `${kind}.png`), encodePng(64, 64, mobTexture(kind)));
}

console.log(`Generated ${blockTypes.size - 1} block textures and 8 mob textures.`);