import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { BlockType } from './blocks';
import {
  CHUNK_SIZE,
  WORLD_HEIGHT,
  type WorldSnapshot,
  type WorldType,
} from './worldGen';

export interface WorldArchiveFurnace {
  ironOre: number;
  coal: number;
  ironIngots: number;
}

export interface WorldArchiveGameState {
  mode: 'CREATIVE' | 'SURVIVAL';
  health: number;
  hunger: number;
  hotbar: number[];
  selectedSlot: number;
  counts: Record<number, number>;
  position: { x: number; y: number; z: number };
  viewDistance: number;
  fogEnabled: boolean;
  worldBorderEnabled: boolean;
  chests: [string, number[]][];
  furnaces: [string, WorldArchiveFurnace][];
}

export interface WorldArchive {
  snapshot: WorldSnapshot;
  game: WorldArchiveGameState;
}

interface WorldArchiveManifest {
  version: 1;
  worldType: WorldType;
  seed: number;
  chunks: { key: string; renderMinY: number }[];
  game: WorldArchiveGameState;
}

const CHUNK_BYTES = CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE;
const MAX_ARCHIVE_BYTES = 128 * 1024 * 1024;
const MAX_CHUNKS = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateGameState(value: unknown): value is WorldArchiveGameState {
  if (!isRecord(value)) return false;
  const position = value.position;
  if (!isRecord(position) || !['x', 'y', 'z'].every(axis => isFiniteNumber(position[axis]))) return false;
  if (value.mode !== 'CREATIVE' && value.mode !== 'SURVIVAL') return false;
  if (!isFiniteNumber(value.health) || !isFiniteNumber(value.hunger)) return false;
  if (!Array.isArray(value.hotbar) || value.hotbar.length !== 9 ||
      !value.hotbar.every(item => Number.isInteger(item) && item >= 0 && item <= BlockType.DIAMOND_SWORD)) return false;
  if (typeof value.selectedSlot !== 'number' || !Number.isInteger(value.selectedSlot) ||
      value.selectedSlot < 0 || value.selectedSlot > 8) return false;
  if (!isRecord(value.counts) || !Object.values(value.counts).every(item =>
    Number.isInteger(item) && (item as number) >= 0 && (item as number) <= 1_000_000
  )) return false;
  if (typeof value.viewDistance !== 'number' || !Number.isInteger(value.viewDistance) ||
      value.viewDistance < 5 || value.viewDistance > 32) return false;
  if (typeof value.fogEnabled !== 'boolean' || typeof value.worldBorderEnabled !== 'boolean') return false;
  if (!Array.isArray(value.chests) || value.chests.length > MAX_CHUNKS ||
      !value.chests.every(entry => Array.isArray(entry) && typeof entry[0] === 'string' &&
        Array.isArray(entry[1]) && entry[1].length === 27 &&
        entry[1].every(item => Number.isInteger(item) && item >= 0 && item <= BlockType.DIAMOND_SWORD))) return false;
  if (!Array.isArray(value.furnaces) || value.furnaces.length > MAX_CHUNKS ||
      !value.furnaces.every(entry => Array.isArray(entry) && typeof entry[0] === 'string' &&
        isRecord(entry[1]) &&
        ['ironOre', 'coal', 'ironIngots'].every(key =>
          Number.isInteger(entry[1][key]) && (entry[1][key] as number) >= 0 && (entry[1][key] as number) <= 1_000_000
        ))) return false;
  return true;
}

export function createWorldArchive(snapshot: WorldSnapshot, game: WorldArchiveGameState): Uint8Array {
  if (snapshot.chunks.length > MAX_CHUNKS) {
    throw new Error('Diese Welt enthält zu viele geladene Chunks für eine Weltdatei.');
  }
  const files: Record<string, Uint8Array> = {};
  const chunkMeta = snapshot.chunks.map(({ key, renderMinY, data }) => {
    if (data.byteLength !== CHUNK_BYTES) {
      throw new Error(`Chunk ${key} has an invalid size.`);
    }
    files[`chunks/${key}.bin`] = data;
    return { key, renderMinY };
  });
  const manifest: WorldArchiveManifest = {
    version: 1,
    worldType: snapshot.worldType,
    seed: snapshot.seed,
    chunks: chunkMeta,
    game,
  };
  files['world.json'] = strToU8(JSON.stringify(manifest));
  const archive = zipSync(files, { level: 1 });
  if (archive.byteLength > MAX_ARCHIVE_BYTES) {
    throw new Error('Die Weltdatei wäre größer als 128 MB.');
  }
  return archive;
}

export function readWorldArchive(bytes: Uint8Array): WorldArchive {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_ARCHIVE_BYTES) {
    throw new Error('Die Weltdatei ist leer oder größer als 128 MB.');
  }
  const files = unzipSync(bytes);
  const manifestFile = files['world.json'];
  if (!manifestFile) throw new Error('In der Datei fehlt world.json.');

  const parsed: unknown = JSON.parse(strFromU8(manifestFile));
  if (!isRecord(parsed) || parsed.version !== 1 ||
      (parsed.worldType !== 'normal' && parsed.worldType !== 'superflat') ||
      !Number.isInteger(parsed.seed) || !Array.isArray(parsed.chunks) ||
      parsed.chunks.length > MAX_CHUNKS || !validateGameState(parsed.game)) {
    throw new Error('Die Weltdatei hat ein ungültiges oder nicht unterstütztes Format.');
  }

  const chunks = parsed.chunks.map((rawChunk, index) => {
    if (!isRecord(rawChunk) || typeof rawChunk.key !== 'string' ||
        !Number.isInteger(rawChunk.renderMinY) || !rawChunk.key.match(/^-?\d+,-?\d+$/)) {
      throw new Error(`Chunk ${index} enthält ungültige Metadaten.`);
    }
    const data = files[`chunks/${rawChunk.key}.bin`];
    if (!data || data.byteLength !== CHUNK_BYTES) {
      throw new Error(`Chunk ${rawChunk.key} fehlt oder ist beschädigt.`);
    }
    return {
      key: rawChunk.key,
      data,
      renderMinY: rawChunk.renderMinY as number,
    };
  });

  return {
    snapshot: {
      worldType: parsed.worldType,
      seed: parsed.seed as number,
      chunks,
    },
    game: parsed.game,
  };
}
