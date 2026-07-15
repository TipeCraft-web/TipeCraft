export type MobType = 'zombie' | 'skeleton' | 'spider' | 'creeper' | 'slime';

export interface MobState {
  id: number;
  type: MobType;
  pos: [number, number, number];
  vel: [number, number, number];
  yaw: number;
  health: number;
  maxHealth: number;
  state: 'idle' | 'patrol' | 'aggro' | 'attack' | 'dead';
  deathTimer: number;
  hitFlash: number;
  attackCooldown: number;
  patrolTimer: number;
  patrolDir: [number, number];
}

export interface MobSpec {
  h: number;   // height
  hw: number;  // half-width
  speed: number;
  aggroRange: number;
  attackRange: number;
  attackDamage: number;
  color: number;    // hex
  headColor: number;
  maxHealth: number;
}

export const MOB_SPECS: Record<MobType, MobSpec> = {
  zombie:   { h:1.9, hw:0.4, speed:0.03, aggroRange:16, attackRange:1.2, attackDamage:3, color:0x3a7a3a, headColor:0x4a9a4a, maxHealth:20 },
  skeleton: { h:1.9, hw:0.35, speed:0.04, aggroRange:20, attackRange:15, attackDamage:2, color:0xc8c8c8, headColor:0xdddddd, maxHealth:20 },
  spider:   { h:0.8, hw:0.7,  speed:0.07, aggroRange:14, attackRange:1.0, attackDamage:2, color:0x222222, headColor:0x882222, maxHealth:16 },
  creeper:  { h:1.7, hw:0.4,  speed:0.025,aggroRange:16, attackRange:2.0, attackDamage:10,color:0x44aa44, headColor:0x44aa44, maxHealth:20 },
  slime:    { h:1.0, hw:0.5,  speed:0.02, aggroRange:10, attackRange:1.2, attackDamage:2, color:0x60c840, headColor:0x60c840, maxHealth:8  },
};

const mobs: MobState[] = [];
let nextId = 0;

export function getMobs(): MobState[] { return mobs; }

export function spawnMob(type: MobType, x: number, y: number, z: number): void {
  const spec = MOB_SPECS[type];
  mobs.push({
    id: nextId++, type, pos:[x,y,z], vel:[0,0,0], yaw:Math.random()*Math.PI*2,
    health:spec.maxHealth, maxHealth:spec.maxHealth,
    state:'idle', deathTimer:0, hitFlash:0, attackCooldown:0,
    patrolTimer:0, patrolDir:[0,0],
  });
}

export function damageMob(id: number, amount: number): void {
  const mob = mobs.find(m => m.id === id);
  if (!mob || mob.state === 'dead') return;
  mob.health -= amount;
  mob.hitFlash = 0.25;
  if (mob.health <= 0) { mob.state = 'dead'; mob.deathTimer = 1.2; mob.health = 0; }
  else if (mob.state === 'idle' || mob.state === 'patrol') mob.state = 'aggro';
}

export function cleanDeadMobs(): void {
  for (let i = mobs.length - 1; i >= 0; i--) {
    if (mobs[i].state === 'dead' && mobs[i].deathTimer <= 0) mobs.splice(i, 1);
  }
}

export function raycastMobs(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  maxDist: number
): { id: number; dist: number } | null {
  let best: { id: number; dist: number } | null = null;
  for (const mob of mobs) {
    if (mob.state === 'dead') continue;
    const spec = MOB_SPECS[mob.type];
    const [mx,my,mz] = mob.pos;
    const dist = rayAABB(ox,oy,oz,dx,dy,dz, mx-spec.hw,my,mz-spec.hw, mx+spec.hw,my+spec.h,mz+spec.hw);
    if (dist !== null && dist <= maxDist && (!best || dist < best.dist)) best = { id: mob.id, dist };
  }
  return best;
}

function rayAABB(ox:number,oy:number,oz:number,dx:number,dy:number,dz:number,minX:number,minY:number,minZ:number,maxX:number,maxY:number,maxZ:number): number|null {
  let tmin=0, tmax=Infinity;
  const oArr=[ox,oy,oz], dArr=[dx,dy,dz], minArr=[minX,minY,minZ], maxArr=[maxX,maxY,maxZ];
  for(let i=0;i<3;i++){
    if(Math.abs(dArr[i])<1e-8){ if(oArr[i]<minArr[i]||oArr[i]>maxArr[i]) return null; }
    else {
      const t1=(minArr[i]-oArr[i])/dArr[i], t2=(maxArr[i]-oArr[i])/dArr[i];
      tmin=Math.max(tmin,Math.min(t1,t2)); tmax=Math.min(tmax,Math.max(t1,t2));
      if(tmin>tmax) return null;
    }
  }
  return tmin>=0?tmin:null;
}
