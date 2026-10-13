import { buildChunkGeometryData } from './chunkMeshing';
import type { ChunkBuildResponse, ChunkBuildTask } from './chunkWorkerProtocol';
import { worldManager } from './worldGen';

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<ChunkBuildTask>) => void) | null;
  postMessage: (message: ChunkBuildResponse, transfer?: Transferable[]) => void;
};

workerScope.onmessage = event => {
  const task = event.data;
  try {
    const knownKeys = new Set(task.chunks.map(chunk => chunk.key));
    worldManager.restore({
      worldType: task.worldType,
      seed: task.seed,
      chunks: task.chunks,
    });
    const data = worldManager.getOrGenerateChunk(task.cx, task.cz);
    const geometry = buildChunkGeometryData(task.cx, task.cz, data, task.renderMinY);
    const generatedChunks = worldManager.snapshot().chunks.filter(chunk => !knownKeys.has(chunk.key));
    const transfer: Transferable[] = [];

    for (const chunk of generatedChunks) transfer.push(chunk.data.buffer);
    for (const part of [geometry.opaque, geometry.transparent]) {
      if (!part) continue;
      transfer.push(
        part.positions.buffer,
        part.normals.buffer,
        part.colors.buffer,
        part.uvs.buffer,
        part.indices.buffer,
      );
    }

    workerScope.postMessage({
      jobId: task.jobId,
      key: task.key,
      revision: task.revision,
      geometry,
      generatedChunks,
    }, transfer);
  } catch (error) {
    workerScope.postMessage({
      jobId: task.jobId,
      key: task.key,
      revision: task.revision,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
