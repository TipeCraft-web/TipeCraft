import type { ChunkGeometryData } from './chunkMeshing';
import type { WorldChunkSnapshot, WorldType } from './worldGen';

export interface ChunkBuildTask {
  jobId: number;
  key: string;
  cx: number;
  cz: number;
  revision: number;
  worldType: WorldType;
  seed: number;
  renderMinY: number;
  chunks: WorldChunkSnapshot[];
}

export type ChunkBuildResponse =
  | {
      jobId: number;
      key: string;
      revision: number;
      geometry: ChunkGeometryData;
      generatedChunks: WorldChunkSnapshot[];
    }
  | {
      jobId: number;
      key: string;
      revision: number;
      error: string;
    };
