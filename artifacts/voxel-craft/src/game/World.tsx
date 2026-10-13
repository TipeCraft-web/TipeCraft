import { useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  worldManager,
  getChunkKey,
} from './worldGen';
import { getAtlas } from './textures';
import { buildChunkGeometryData, type ChunkGeometryData } from './chunkMeshing';
import type { ChunkBuildResponse, ChunkBuildTask } from './chunkWorkerProtocol';

const MAX_SYNC_CHUNKS_PER_FRAME = 1;

export interface BreakingState {
  active: boolean;
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  progress: number;
}

const CRACK_PATHS: { stage: number; points: [number, number][] }[] = [
  { stage: 0, points: [[0.50, 0.98], [0.48, 0.78], [0.56, 0.63], [0.50, 0.48], [0.58, 0.31], [0.54, 0.08]] },
  { stage: 1, points: [[0.50, 0.48], [0.36, 0.42], [0.24, 0.47], [0.09, 0.42]] },
  { stage: 2, points: [[0.56, 0.63], [0.68, 0.56], [0.76, 0.44], [0.94, 0.39]] },
  { stage: 3, points: [[0.48, 0.78], [0.35, 0.68], [0.22, 0.70], [0.08, 0.62]] },
  { stage: 4, points: [[0.50, 0.48], [0.61, 0.38], [0.67, 0.23], [0.82, 0.13]] },
  { stage: 5, points: [[0.36, 0.42], [0.31, 0.28], [0.19, 0.20], [0.10, 0.08]] },
  { stage: 6, points: [[0.68, 0.56], [0.79, 0.67], [0.91, 0.72], [0.98, 0.88]] },
  { stage: 7, points: [[0.35, 0.68], [0.45, 0.84], [0.42, 0.96]] },
  { stage: 8, points: [[0.61, 0.38], [0.52, 0.28], [0.42, 0.25], [0.30, 0.10]] },
  { stage: 9, points: [[0.24, 0.47], [0.31, 0.56], [0.43, 0.58], [0.54, 0.50]] },
];

function createCrackTexture(stage: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(12, 12, 12, 0.95)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  for (const path of CRACK_PATHS) {
    if (path.stage > stage) continue;
    ctx.beginPath();
    path.points.forEach(([x, y], index) => {
      if (index === 0) ctx.moveTo(x * 64, y * 64);
      else ctx.lineTo(x * 64, y * 64);
    });
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

interface ChunkEntry { opaque: THREE.Mesh | null; transparent: THREE.Mesh | null }

interface ActiveChunkJob {
  jobId: number;
  key: string;
  cx: number;
  cz: number;
  revision: number;
}

interface ChunkWorkerSlot {
  worker: Worker;
  busy: boolean;
  failed: boolean;
  job: ActiveChunkJob | null;
}

interface CompletedChunkJob {
  job: ActiveChunkJob;
  response: Extract<ChunkBuildResponse, { geometry: ChunkGeometryData }>;
}

function createGeometry(buffers: ChunkGeometryData['opaque']): THREE.BufferGeometry | null {
  if (!buffers) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(buffers.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(buffers.normals, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(buffers.colors, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(buffers.uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(buffers.indices, 1));
  return geometry;
}

function removeChunkMeshes(
  group: THREE.Group | null,
  chunkMap: Map<string, ChunkEntry>,
  key: string,
): void {
  const entry = chunkMap.get(key);
  if (!entry) return;
  if (entry.opaque) {
    group?.remove(entry.opaque);
    entry.opaque.geometry.dispose();
  }
  if (entry.transparent) {
    group?.remove(entry.transparent);
    entry.transparent.geometry.dispose();
  }
  chunkMap.delete(key);
}

function addChunkMeshes(
  group: THREE.Group | null,
  chunkMap: Map<string, ChunkEntry>,
  cx: number,
  cz: number,
  data: ChunkGeometryData,
  opaqueMaterial: THREE.MeshLambertMaterial,
  transparentMaterial: THREE.MeshLambertMaterial,
): boolean {
  if (!group) return false;
  const entry: ChunkEntry = { opaque: null, transparent: null };
  const opaque = createGeometry(data.opaque);
  if (opaque) {
    const mesh = new THREE.Mesh(opaque, opaqueMaterial);
    mesh.receiveShadow = true;
    group.add(mesh);
    entry.opaque = mesh;
  }
  const transparent = createGeometry(data.transparent);
  if (transparent) {
    const mesh = new THREE.Mesh(transparent, transparentMaterial);
    group.add(mesh);
    entry.transparent = mesh;
  }
  chunkMap.set(getChunkKey(cx, cz), entry);
  return true;
}

interface WorldProps {
  playerChunkRef: React.MutableRefObject<{ x: number; z: number }>;
  viewDistance: number;
  breakingRef: React.MutableRefObject<BreakingState>;
  worldRevision: number;
  isWorldLoading: boolean;
  onWorldLoadProgress: (loadedChunks: number, totalChunks: number) => void;
  onWorldReady: () => void;
}

export default function World({
  playerChunkRef,
  viewDistance,
  breakingRef,
  worldRevision,
  isWorldLoading,
  onWorldLoadProgress,
  onWorldReady,
}: WorldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const chunkMap = useRef<Map<string, ChunkEntry>>(new Map());
  const lastLoadProgressRef = useRef(-1);
  const readyWorldRevisionRef = useRef(-1);
  const chunkLoadOrder = useMemo(() => {
    const offsets: { x: number; z: number }[] = [];
    for (let x = -viewDistance; x <= viewDistance; x++) {
      for (let z = -viewDistance; z <= viewDistance; z++) offsets.push({ x, z });
    }
    return offsets.sort((a, b) =>
      a.x * a.x + a.z * a.z - b.x * b.x - b.z * b.z || a.x - b.x || a.z - b.z
    );
  }, [viewDistance]);
  const crackMeshRef = useRef<THREE.Mesh>(null);
  const crackMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const crackTextures = useMemo(
    () => Array.from({ length: 10 }, (_, stage) => createCrackTexture(stage)),
    [],
  );
  const crackGeometry = useMemo(() => new THREE.PlaneGeometry(1.002, 1.002), []);
  const crackNormal = useMemo(() => new THREE.Vector3(), []);
  const crackPosition = useMemo(() => new THREE.Vector3(), []);
  const crackQuaternion = useMemo(() => new THREE.Quaternion(), []);

  const atlas = getAtlas();

  const opaqueMat = useRef(new THREE.MeshLambertMaterial({
    vertexColors: true,
    map: atlas,
  }));
  const transparentMat = useRef(new THREE.MeshLambertMaterial({
    vertexColors: true,
    map: atlas,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  }));

  const workerSlotsRef = useRef<ChunkWorkerSlot[]>([]);
  const workerSetupCompleteRef = useRef(false);
  const pendingJobsRef = useRef<Map<string, number>>(new Map());
  const completedJobsRef = useRef<CompletedChunkJob[]>([]);
  const dirtyQueueRef = useRef(new Set<string>());
  const nextJobIdRef = useRef(0);
  const currentRevisionRef = useRef(worldRevision);
  const currentViewDistanceRef = useRef(viewDistance);
  currentRevisionRef.current = worldRevision;
  currentViewDistanceRef.current = viewDistance;

  const buildChunkLocally = (job: ActiveChunkJob) => {
    if (job.revision !== currentRevisionRef.current || !groupRef.current) return;
    const data = worldManager.getOrGenerateChunk(job.cx, job.cz);
    const geometry = buildChunkGeometryData(
      job.cx,
      job.cz,
      data,
      worldManager.getChunkRenderMinY(job.cx, job.cz),
    );
    worldManager.dirtyChunks.delete(job.key);
    dirtyQueueRef.current.delete(job.key);
    removeChunkMeshes(groupRef.current, chunkMap.current, job.key);
    addChunkMeshes(
      groupRef.current,
      chunkMap.current,
      job.cx,
      job.cz,
      geometry,
      opaqueMat.current,
      transparentMat.current,
    );
  };

  useLayoutEffect(() => {
    for (const key of Array.from(chunkMap.current.keys())) {
      removeChunkMeshes(groupRef.current, chunkMap.current, key);
    }
    pendingJobsRef.current.clear();
    completedJobsRef.current.length = 0;
    dirtyQueueRef.current.clear();
    lastLoadProgressRef.current = -1;
    readyWorldRevisionRef.current = -1;
  }, [worldRevision]);

  useEffect(() => {
    workerSetupCompleteRef.current = false;
    const slots: ChunkWorkerSlot[] = [];
    if (typeof Worker !== 'undefined') {
      const hardwareThreads = typeof navigator === 'undefined' ? 2 : navigator.hardwareConcurrency || 2;
      const workerCount = Math.max(1, Math.min(3, hardwareThreads - 1));

      for (let index = 0; index < workerCount; index++) {
        try {
          const worker = new Worker(new URL('./chunkWorker.ts', import.meta.url), { type: 'module' });
          const slot: ChunkWorkerSlot = { worker, busy: false, failed: false, job: null };
          slots.push(slot);

          worker.onmessage = (event: MessageEvent<ChunkBuildResponse>) => {
            const job = slot.job;
            slot.busy = false;
            slot.job = null;
            if (!job) return;
            if (pendingJobsRef.current.get(job.key) !== job.jobId) return;

            const response = event.data;
            if (response.jobId !== job.jobId || response.key !== job.key) return;
            if ('error' in response) {
              pendingJobsRef.current.delete(job.key);
              console.error(`Chunk worker failed for ${job.key}: ${response.error}`);
              buildChunkLocally(job);
              return;
            }
            if (response.revision !== currentRevisionRef.current) {
              pendingJobsRef.current.delete(job.key);
              return;
            }
            completedJobsRef.current.push({ job, response });
          };

          worker.onerror = event => {
            event.preventDefault();
            console.error('Chunk worker crashed; falling back to main-thread generation.', event.message);
            slot.failed = true;
            slot.worker.terminate();
            const job = slot.job;
            slot.busy = false;
            slot.job = null;
            if (job && pendingJobsRef.current.get(job.key) === job.jobId) {
              pendingJobsRef.current.delete(job.key);
              buildChunkLocally(job);
            }
          };
        } catch (error) {
          console.error('Unable to start a chunk worker; using main-thread generation.', error);
        }
      }
    }

    workerSlotsRef.current = slots;
    workerSetupCompleteRef.current = true;
    return () => {
      for (const slot of slots) slot.worker.terminate();
      if (workerSlotsRef.current === slots) workerSlotsRef.current = [];
      workerSetupCompleteRef.current = false;
    };
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const { x: pcx, z: pcz } = playerChunkRef.current;
    const breaking = breakingRef.current;
    const crackMesh = crackMeshRef.current;
    const crackMaterial = crackMaterialRef.current;

    if (crackMesh && crackMaterial) {
      if (!breaking.active) {
        crackMesh.visible = false;
      } else {
        crackNormal.set(breaking.nx, breaking.ny, breaking.nz);
        crackPosition.set(breaking.x + 0.5, breaking.y + 0.5, breaking.z + 0.5)
          .addScaledVector(crackNormal, 0.507);
        crackMesh.position.copy(crackPosition);
        crackQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), crackNormal);
        crackMesh.quaternion.copy(crackQuaternion);
        crackMesh.visible = true;

        const stage = Math.min(9, Math.floor(breaking.progress * 10));
        if (crackMaterial.map !== crackTextures[stage]) {
          crackMaterial.map = crackTextures[stage];
          crackMaterial.needsUpdate = true;
        }
      }
    }

    for (const key of worldManager.dirtyChunks) dirtyQueueRef.current.add(key);
    worldManager.dirtyChunks.clear();

    const completed = completedJobsRef.current.shift();
    if (completed) {
      const { job, response } = completed;
      if (pendingJobsRef.current.get(job.key) === job.jobId) {
        pendingJobsRef.current.delete(job.key);
        const stillInRange = Math.abs(job.cx - pcx) <= viewDistance + 1
          && Math.abs(job.cz - pcz) <= viewDistance + 1;
        if (job.revision === worldRevision && response.revision === worldRevision && stillInRange) {
          if (dirtyQueueRef.current.has(job.key) || worldManager.dirtyChunks.has(job.key)) {
            dirtyQueueRef.current.add(job.key);
          } else {
            worldManager.installGeneratedChunks(response.generatedChunks);
            removeChunkMeshes(groupRef.current, chunkMap.current, job.key);
            addChunkMeshes(
              groupRef.current,
              chunkMap.current,
              job.cx,
              job.cz,
              response.geometry,
              opaqueMat.current,
              transparentMat.current,
            );
          }
        }
      }
    }

    for (const key of Array.from(chunkMap.current.keys())) {
      const [cxStr, czStr] = key.split(',');
      const cx = Number(cxStr), cz = Number(czStr);
      if (Math.abs(cx - pcx) > viewDistance + 1 || Math.abs(cz - pcz) > viewDistance + 1) {
        removeChunkMeshes(groupRef.current, chunkMap.current, key);
      }
    }

    const nextJobKey = (): string | null => {
      for (const key of dirtyQueueRef.current) {
        if (pendingJobsRef.current.has(key)) continue;
        const [cxStr, czStr] = key.split(',');
        const cx = Number(cxStr), cz = Number(czStr);
        if (Math.abs(cx - pcx) > viewDistance + 1 || Math.abs(cz - pcz) > viewDistance + 1) {
          dirtyQueueRef.current.delete(key);
          continue;
        }
        return key;
      }
      for (const offset of chunkLoadOrder) {
        const key = getChunkKey(pcx + offset.x, pcz + offset.z);
        if (!chunkMap.current.has(key) && !pendingJobsRef.current.has(key)) return key;
      }
      return null;
    };

    const dispatchJob = (slot: ChunkWorkerSlot, key: string) => {
      const [cxStr, czStr] = key.split(',');
      const cx = Number(cxStr), cz = Number(czStr);
      const job: ActiveChunkJob = {
        jobId: ++nextJobIdRef.current,
        key,
        cx,
        cz,
        revision: worldRevision,
      };
      const chunks = worldManager.snapshotChunkNeighborhood(cx, cz);
      const task: ChunkBuildTask = {
        ...job,
        worldType: worldManager.worldType,
        seed: worldManager.getWorldSeed(),
        renderMinY: worldManager.getChunkRenderMinY(cx, cz),
        chunks,
      };
      slot.busy = true;
      slot.job = job;
      pendingJobsRef.current.set(key, job.jobId);
      dirtyQueueRef.current.delete(key);

      try {
        slot.worker.postMessage(task, chunks.map(chunk => chunk.data.buffer as ArrayBuffer));
      } catch (error) {
        slot.busy = false;
        slot.job = null;
        pendingJobsRef.current.delete(key);
        console.error('Unable to send chunk data to a worker; using main-thread generation.', error);
        buildChunkLocally(job);
      }
    };

    if (workerSetupCompleteRef.current) {
      const availableWorkers = workerSlotsRef.current.filter(slot => !slot.failed);
      if (availableWorkers.length > 0) {
        const maxOutstandingJobs = availableWorkers.length + 1;
        for (const slot of availableWorkers) {
          if (pendingJobsRef.current.size >= maxOutstandingJobs) break;
          if (slot.busy) continue;
          const key = nextJobKey();
          if (!key) break;
          dispatchJob(slot, key);
        }
      } else {
        for (let built = 0; built < MAX_SYNC_CHUNKS_PER_FRAME; built++) {
          const key = nextJobKey();
          if (!key) break;
          const [cxStr, czStr] = key.split(',');
          const job: ActiveChunkJob = {
            jobId: ++nextJobIdRef.current,
            key,
            cx: Number(cxStr),
            cz: Number(czStr),
            revision: worldRevision,
          };
          dirtyQueueRef.current.delete(key);
          buildChunkLocally(job);
        }
      }
    }

    if (isWorldLoading) {
      const totalChunks = (viewDistance * 2 + 1) ** 2;
      let loadedChunks = 0;
      for (let dx = -viewDistance; dx <= viewDistance; dx++) {
        for (let dz = -viewDistance; dz <= viewDistance; dz++) {
          if (chunkMap.current.has(getChunkKey(pcx + dx, pcz + dz))) loadedChunks++;
        }
      }

      const progress = Math.floor((loadedChunks / totalChunks) * 100);
      if (progress !== lastLoadProgressRef.current) {
        lastLoadProgressRef.current = progress;
        onWorldLoadProgress(loadedChunks, totalChunks);
      }

      if (loadedChunks === totalChunks && readyWorldRevisionRef.current !== worldRevision) {
        readyWorldRevisionRef.current = worldRevision;
        onWorldReady();
      }
    }
  });

  useEffect(() => {
    return () => {
      opaqueMat.current.dispose();
      transparentMat.current.dispose();
      crackGeometry.dispose();
      crackMaterialRef.current?.dispose();
      crackTextures.forEach(texture => texture.dispose());
    };
  }, [crackGeometry, crackTextures]);

  return (
    <>
      <group ref={groupRef} />
      <mesh
        ref={crackMeshRef}
        visible={false}
        renderOrder={1000}
        geometry={crackGeometry}
      >
        <meshBasicMaterial
          ref={crackMaterialRef}
          transparent
          depthTest={false}
          depthWrite={false}
          side={THREE.DoubleSide}
          opacity={0.95}
        />
      </mesh>
    </>
  );
}
