import { BlockType } from './blocks';

export type BP = [number, number, number, BlockType]; // dx, dy, dz, type

function box(x0:number,y0:number,z0:number,x1:number,y1:number,z1:number,t:BlockType,hollow=false):BP[]{
  const r:BP[]=[];
  for(let x=x0;x<=x1;x++) for(let y=y0;y<=y1;y++) for(let z=z0;z<=z1;z++){
    if(!hollow||x===x0||x===x1||y===y0||y===y1||z===z0||z===z1) r.push([x,y,z,t]);
  }
  return r;
}
function layer(y:number,x0:number,z0:number,x1:number,z1:number,t:BlockType):BP[]{
  const r:BP[]=[];
  for(let x=x0;x<=x1;x++) for(let z=z0;z<=z1;z++) r.push([x,y,z,t]);
  return r;
}
function col(x:number,y0:number,y1:number,z:number,t:BlockType):BP[]{
  return Array.from({length:y1-y0+1},(_,i)=>[x,y0+i,z,t] as BP);
}
function wall(y0:number,y1:number,x0:number,z0:number,x1:number,z1:number,t:BlockType):BP[]{
  const r:BP[]=[];
  for(let y=y0;y<=y1;y++){
    for(let x=x0;x<=x1;x++){ r.push([x,y,z0,t]); r.push([x,y,z1,t]); }
    for(let z=z0+1;z<z1;z++){ r.push([x0,y,z,t]); r.push([x1,y,z,t]); }
  }
  return r;
}

// 1. Oak Village House (8x5x7)
export function oakHouse(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[...layer(0,0,0,7,6,BlockType.PLANKS),...wall(1,3,0,0,7,6,BlockType.OAK_LOG),...layer(4,0,0,7,6,BlockType.SPRUCE_PLANKS)];
  // door opening
  p.push([3,1,0,BlockType.AIR],[3,2,0,BlockType.AIR],[4,1,0,BlockType.AIR],[4,2,0,BlockType.AIR]);
  // windows
  p.push([1,2,0,BlockType.GLASS],[6,2,0,BlockType.GLASS],[1,2,6,BlockType.GLASS],[6,2,6,BlockType.GLASS]);
  // roof
  p.push(...layer(5,1,1,6,5,BlockType.DARK_OAK_PLANKS),...layer(6,2,2,5,4,BlockType.DARK_OAK_PLANKS));
  // interior
  p.push([1,1,3,BlockType.CRAFTING_TABLE],[5,1,4,BlockType.CHEST],[6,1,1,BlockType.FURNACE]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 2. Stone Tower (5x12x5)
export function stoneTower(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  for(let y=0;y<12;y++){
    const t=y<4?BlockType.COBBLESTONE:y<8?BlockType.STONE_BRICKS:BlockType.CRACKED_STONE_BRICKS;
    [...wall(y,y,0,0,4,4,t)].forEach(b=>p.push(b));
  }
  p.push(...layer(12,0,0,4,4,BlockType.COBBLE_WALL));
  p.push([2,1,0,BlockType.AIR],[2,2,0,BlockType.AIR]); // door
  p.push([0,5,2,BlockType.GLASS],[4,5,2,BlockType.GLASS],[2,5,0,BlockType.GLASS],[2,5,4,BlockType.GLASS]);
  p.push([2,4,2,BlockType.CHEST],[1,8,2,BlockType.LANTERN]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 3. Desert Pyramid (9x6x9)
export function desertPyramid(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  const sizes=[[0,0,8,8],[1,1,1,7,7],[2,2,2,6,6],[3,3,3,5,5],[4,4,4,4,4]];
  const types=[BlockType.SANDSTONE,BlockType.SANDSTONE,BlockType.SANDSTONE_SMOOTH,BlockType.SANDSTONE_CHISELED,BlockType.SANDSTONE_CHISELED];
  sizes.forEach(([y,x0,z0,x1,z1],i)=>{ p.push(...layer(y,x0,z0,x1,z1,types[i])); });
  // chamber
  p.push(...box(3,0,3,5,2,5,BlockType.SANDSTONE,true));
  p.push([4,0,4,BlockType.CHEST],[4,1,4,BlockType.TNT]);
  p.push([4,0,3,BlockType.AIR],[4,1,3,BlockType.AIR]); // entrance
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 4. Desert Well
export function desertWell(bx:number,by:number,bz:number):BP[]{
  return [
    ...[0,1,2].map(y=>([0,y,1,BlockType.SANDSTONE] as BP)),
    ...[0,1,2].map(y=>([2,y,1,BlockType.SANDSTONE] as BP)),
    ...[0,1,2].map(y=>([1,y,0,BlockType.SANDSTONE] as BP)),
    ...[0,1,2].map(y=>([1,y,2,BlockType.SANDSTONE] as BP)),
    [0,3,0,BlockType.SANDSTONE_SMOOTH],[1,3,0,BlockType.SANDSTONE_SMOOTH],[2,3,0,BlockType.SANDSTONE_SMOOTH],
    [0,3,1,BlockType.SANDSTONE_SMOOTH],[2,3,1,BlockType.SANDSTONE_SMOOTH],
    [0,3,2,BlockType.SANDSTONE_SMOOTH],[1,3,2,BlockType.SANDSTONE_SMOOTH],[2,3,2,BlockType.SANDSTONE_SMOOTH],
    [1,2,1,BlockType.WATER],
  ].map(([dx,dy,dz,t])=>[bx+dx as number,by+dy as number,bz+dz as number,t as BlockType]);
}

// 5. Underground Dungeon (7x4x7)
export function dungeon(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...box(0,0,0,6,3,6,BlockType.COBBLESTONE,true));
  // floor + ceiling
  layer(0,0,0,6,6,BlockType.COBBLESTONE).forEach(b=>p.push(b));
  layer(3,0,0,6,6,BlockType.COBBLESTONE).forEach(b=>p.push(b));
  // clear interior
  for(let x=1;x<=5;x++) for(let y=1;y<=2;y++) for(let z=1;z<=5;z++) p.push([x,y,z,BlockType.AIR]);
  p.push([3,1,3,BlockType.CHEST],[1,1,1,BlockType.LANTERN],[5,1,5,BlockType.LANTERN]);
  // entrance shaft
  for(let y=4;y<=8;y++) p.push([3,y,3,BlockType.AIR]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 6. Taiga Cabin (6x4x8)
export function taigaCabin(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...layer(0,0,0,5,7,BlockType.SPRUCE_PLANKS));
  p.push(...wall(1,3,0,0,5,7,BlockType.SPRUCE_LOG));
  p.push([2,1,0,BlockType.AIR],[2,2,0,BlockType.AIR]); // door
  p.push([1,2,0,BlockType.GLASS],[3,2,0,BlockType.GLASS]);
  // sloped roof using snow
  for(let i=0;i<=2;i++) p.push(...layer(4+i,i,i,5-i,7-i,BlockType.SNOW_BLOCK));
  p.push([1,1,4,BlockType.FURNACE],[4,1,5,BlockType.CHEST],[2,1,6,BlockType.CRAFTING_TABLE]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 7. Jungle Temple (6x7x6)
export function jungleTemple(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...layer(0,0,0,5,5,BlockType.JUNGLE_PLANKS));
  p.push(...wall(1,6,0,0,5,5,BlockType.JUNGLE_LOG));
  for(let i=0;i<=2;i++) p.push(...layer(7-i,i,i,5-i,5-i,BlockType.JUNGLE_LEAF));
  p.push([2,1,0,BlockType.AIR],[2,2,0,BlockType.AIR],[3,1,0,BlockType.AIR],[3,2,0,BlockType.AIR]);
  p.push([2,3,2,BlockType.CRAFTING_TABLE],[3,3,3,BlockType.CHEST],[2,4,2,BlockType.LANTERN]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 8. Swamp Hut (6x5x5, on stilts)
export function swampHut(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  // stilts
  [[0,0],[5,0],[0,4],[5,4]].forEach(([x,z])=>{ for(let y=-2;y<=0;y++) p.push([x,y,z,BlockType.DARK_OAK_LOG]); });
  p.push(...layer(0,0,0,5,4,BlockType.DARK_OAK_PLANKS));
  p.push(...wall(1,3,0,0,5,4,BlockType.DARK_OAK_LOG));
  p.push([2,1,0,BlockType.AIR],[2,2,0,BlockType.AIR]);
  p.push(...layer(4,1,1,4,3,BlockType.DARK_OAK_PLANKS));
  p.push([4,1,1,BlockType.CHEST],[1,1,2,BlockType.FURNACE],[2,1,3,BlockType.CRAFTING_TABLE]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 9. Village Well (3x4x3)
export function villageWell(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...wall(0,2,0,0,2,2,BlockType.COBBLESTONE));
  p.push([0,3,0,BlockType.OAK_FENCE_BLOCK],[2,3,0,BlockType.OAK_FENCE_BLOCK],[0,3,2,BlockType.OAK_FENCE_BLOCK],[2,3,2,BlockType.OAK_FENCE_BLOCK]);
  p.push([0,4,0,BlockType.OAK_LOG],[2,4,0,BlockType.OAK_LOG],[0,4,2,BlockType.OAK_LOG],[2,4,2,BlockType.OAK_LOG]);
  p.push([0,5,0,BlockType.PLANKS],[1,5,0,BlockType.PLANKS],[2,5,0,BlockType.PLANKS]);
  p.push([0,5,2,BlockType.PLANKS],[1,5,2,BlockType.PLANKS],[2,5,2,BlockType.PLANKS]);
  p.push([1,1,1,BlockType.WATER]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 10. Stone Circle (ritual stones)
export function stoneCircle(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  const pts=[[5,0],[9,2],[10,7],[6,11],[1,9],[0,4]];
  pts.forEach(([x,z])=>{ p.push([x,0,z,BlockType.STONE_BRICKS],[x,1,z,BlockType.STONE_BRICKS],[x,2,z,BlockType.STONE_BRICKS]); });
  p.push([5,0,5,BlockType.GLOWSTONE],[5,1,5,BlockType.GLOWSTONE]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 11. Ruined Tower
export function ruinedTower(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  for(let y=0;y<7;y++){
    [[0,0],[0,4],[4,0],[4,4]].forEach(([x,z])=>p.push([x,y,z,BlockType.COBBLESTONE]));
    if(y<4){ [[1,0],[2,0],[3,0],[0,1],[0,2],[0,3],[4,1],[4,2],[4,3],[1,4],[2,4],[3,4]].forEach(([x,z])=>p.push([x,y,z,BlockType.CRACKED_STONE_BRICKS])); }
  }
  p.push([2,1,0,BlockType.AIR],[2,2,0,BlockType.AIR]);
  p.push([2,3,2,BlockType.CHEST]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 12. Igloo (5x4x5 snow dome)
export function igloo(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  // Snow dome
  layer(0,0,0,4,4,BlockType.SNOW_BLOCK).forEach(b=>p.push(b));
  layer(1,0,0,4,4,BlockType.SNOW_BLOCK).forEach(b=>p.push(b));
  layer(2,1,1,3,3,BlockType.SNOW_BLOCK).forEach(b=>p.push(b));
  layer(3,2,2,2,2,BlockType.SNOW_BLOCK).forEach(b=>p.push(b));
  // hollow interior
  for(let y=1;y<=2;y++) for(let x=1;x<=3;x++) for(let z=1;z<=3;z++) p.push([x,y,z,BlockType.AIR]);
  p.push([2,1,0,BlockType.AIR],[2,2,0,BlockType.AIR]); // entrance
  p.push([2,1,2,BlockType.CHEST],[3,1,3,BlockType.FURNACE],[1,1,1,BlockType.LANTERN]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 13. Blackstone Fortress Fragment (10x8x10)
export function blackstonefort(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...layer(0,0,0,9,9,BlockType.BLACKSTONE));
  p.push(...wall(1,7,0,0,9,9,BlockType.BLACKSTONE));
  for(let y=1;y<8;y+=3){ [[3,0],[6,0],[0,3],[9,3],[0,6],[9,6],[3,9],[6,9]].forEach(([x,z])=>p.push([x,y,z,BlockType.NETHER_BRICKS])); }
  p.push([4,1,0,BlockType.AIR],[5,1,0,BlockType.AIR],[4,2,0,BlockType.AIR],[5,2,0,BlockType.AIR]);
  p.push([4,4,4,BlockType.CHEST],[5,4,5,BlockType.RESPAWN_ANCHOR]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 14. Abandoned Mine Entrance (6x3x4)
export function mineEntrance(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...layer(0,0,0,5,3,BlockType.COBBLESTONE));
  p.push(...wall(1,2,0,0,5,3,BlockType.OAK_LOG));
  p.push([2,1,0,BlockType.AIR],[3,1,0,BlockType.AIR],[2,2,0,BlockType.AIR],[3,2,0,BlockType.AIR]);
  // shaft going down
  for(let y=-1;y>=-8;y--) p.push([2,y,1,BlockType.AIR],[3,y,1,BlockType.AIR]);
  p.push([2,-3,1,BlockType.OAK_LOG],[3,-3,1,BlockType.OAK_LOG]); // support beam
  p.push([2,-7,1,BlockType.CHEST],[3,-7,2,BlockType.LANTERN]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 15. Mesa Ruin (terracotta pillars)
export function mesaRuin(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  [[0,0],[6,0],[0,6],[6,6],[3,3]].forEach(([x,z])=>{
    const h=4+Math.floor(Math.abs(Math.sin(x*7+z*13))*4);
    for(let y=0;y<=h;y++) p.push([x,y,z,BlockType.ORANGE_TERRACOTTA]);
    p.push([x,h+1,z,BlockType.RED_TERRACOTTA]);
  });
  p.push(...layer(0,1,1,5,5,BlockType.RED_SAND));
  p.push([3,1,3,BlockType.CHEST]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 16. End Portal Fragment
export function endPortalFragment(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  [[1,0],[2,0],[3,0],[4,1],[4,2],[4,3],[1,4],[2,4],[3,4],[0,1],[0,2],[0,3]].forEach(([x,z])=>p.push([x,0,z,BlockType.END_STONE_BRICKS]));
  [[1,1],[2,1],[3,1],[1,2],[2,2],[3,2],[1,3],[2,3],[3,3]].forEach(([x,z])=>p.push([x,0,z,BlockType.OBSIDIAN]));
  [[1,0],[2,0],[3,0],[4,1],[4,2],[4,3],[1,4],[2,4],[3,4],[0,1],[0,2],[0,3]].forEach(([x,z])=>p.push([x,1,z,BlockType.END_STONE_BRICKS]));
  p.push([2,2,2,BlockType.CRYING_OBSIDIAN]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 17. Mushroom Hollow
export function mushroomHollow(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  // Giant mushroom cap
  for(let x=0;x<=6;x++) for(let z=0;z<=6;z++){
    const d=Math.sqrt((x-3)**2+(z-3)**2);
    if(d<=3) p.push([x,5,z,BlockType.RED_MUSHROOM_BLOCK]);
  }
  // Stem
  for(let y=0;y<=4;y++) p.push([3,y,3,BlockType.MUSHROOM_STEM]);
  // Interior light
  p.push([3,4,3,BlockType.SHROOMLIGHT]);
  // Platform around base
  p.push(...layer(0,1,1,5,5,BlockType.MOSS_BLOCK));
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 18. Graveyard (5 graves)
export function graveyard(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  [0,2,4,6,8].forEach(x=>{
    p.push([x,0,0,BlockType.COBBLESTONE],[x,1,0,BlockType.COBBLESTONE],[x,2,0,BlockType.COBBLE_WALL]);
    p.push([x,0,2,BlockType.STONE],[x,0,4,BlockType.STONE]);
  });
  p.push(...layer(0,0,0,9,4,BlockType.GRASS));
  // A lantern
  p.push([4,1,0,BlockType.LANTERN]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 19. Underwater Ruin (6x4x6)
export function underwaterRuin(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...layer(0,0,0,5,5,BlockType.PRISMARINE));
  p.push(...wall(1,3,0,0,5,5,BlockType.DARK_PRISMARINE));
  p.push([2,1,0,BlockType.AIR],[3,1,0,BlockType.AIR],[2,2,0,BlockType.AIR]);
  [[0,5],[5,0],[5,5],[0,0]].forEach(([x,z])=>p.push([x,4,z,BlockType.PRISMARINE_BRICKS]));
  p.push([2,1,2,BlockType.SEA_LANTERN],[3,1,3,BlockType.CHEST]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 20. Monolith (single giant standing stone)
export function monolith(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  for(let y=0;y<10;y++){
    if(y<8){ p.push([0,y,0,BlockType.STONE_BRICKS],[1,y,0,BlockType.STONE_BRICKS],[0,y,1,BlockType.STONE_BRICKS],[1,y,1,BlockType.STONE_BRICKS]); }
    else { p.push([0,y,0,BlockType.STONE_BRICKS],[1,y,0,BlockType.CRACKED_STONE_BRICKS],[0,y,1,BlockType.CHISELED_STONE_BRICKS],[1,y,1,BlockType.STONE_BRICKS]); }
  }
  p.push([-1,0,-1,BlockType.MOSSY_COBBLESTONE],[2,0,-1,BlockType.MOSSY_COBBLESTONE],[-1,0,2,BlockType.MOSSY_COBBLESTONE],[2,0,2,BlockType.MOSSY_COBBLESTONE]);
  p.push([0,10,0,BlockType.AMETHYST_CLUSTER],[1,10,1,BlockType.AMETHYST_CLUSTER]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 21. Nether Shrine
export function netherShrine(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...layer(0,0,0,4,4,BlockType.NETHER_BRICKS));
  [[0,0],[4,0],[0,4],[4,4]].forEach(([x,z])=>{ for(let y=0;y<=4;y++) p.push([x,y,z,BlockType.BLACKSTONE]); });
  p.push([2,1,2,BlockType.NETHERRACK],[2,2,2,BlockType.SOUL_FIRE]);
  [[0,2],[4,2],[2,0],[2,4]].forEach(([x,z])=>p.push([x,1,z,BlockType.NETHER_BRICK_FENCE],[x,2,z,BlockType.GLOWSTONE]));
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 22. Beacon Shrine
export function beaconShrine(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...layer(0,0,0,4,4,BlockType.IRON_BLOCK));
  p.push(...layer(1,1,1,3,3,BlockType.GOLD_BLOCK));
  p.push([2,2,2,BlockType.DIAMOND_BLOCK],[2,3,2,BlockType.BEACON]);
  [[0,0],[4,0],[0,4],[4,4]].forEach(([x,z])=>p.push([x,1,z,BlockType.OBSIDIAN],[x,2,z,BlockType.OBSIDIAN],[x,3,z,BlockType.CRYING_OBSIDIAN]));
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 23. Ancient Library
export function ancientLibrary(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...layer(0,0,0,7,5,BlockType.PLANKS));
  p.push(...wall(1,4,0,0,7,5,BlockType.OAK_LOG));
  p.push(...layer(5,0,0,7,5,BlockType.DARK_OAK_PLANKS));
  // Bookshelves
  for(let z=0;z<=5;z+=5) for(let x=0;x<=7;x++) for(let y=1;y<=3;y++) if(x>0&&x<7) p.push([x,y,z,BlockType.BOOKSHELF]);
  p.push([3,1,0,BlockType.AIR],[4,1,0,BlockType.AIR],[3,2,0,BlockType.AIR],[4,2,0,BlockType.AIR]);
  p.push([3,2,2,BlockType.ENCHANTING_TABLE],[5,1,2,BlockType.CHEST],[1,1,3,BlockType.LANTERN],[6,1,3,BlockType.LANTERN]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 24. Ocean Monument Fragment
export function oceanMonument(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  p.push(...layer(0,0,0,7,7,BlockType.PRISMARINE));
  p.push(...wall(1,5,0,0,7,7,BlockType.PRISMARINE_BRICKS));
  p.push(...layer(2,2,2,5,5,BlockType.DARK_PRISMARINE));
  for(let y=1;y<=5;y+=2){ [[0,0],[7,0],[0,7],[7,7]].forEach(([x,z])=>p.push([x,y,z,BlockType.SEA_LANTERN])); }
  p.push([3,1,0,BlockType.AIR],[4,1,0,BlockType.AIR],[3,2,0,BlockType.AIR],[4,2,0,BlockType.AIR]);
  p.push([3,3,3,BlockType.CHEST],[4,3,4,BlockType.SEA_LANTERN]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

// 25. Outpost Watchtower (4x14x4)
export function outpostTower(bx:number,by:number,bz:number):BP[]{
  const p:BP[]=[];
  for(let y=0;y<14;y++){
    const t=y%4===0?BlockType.DARK_OAK_LOG:BlockType.OAK_LOG;
    p.push([0,y,0,t],[3,y,0,t],[0,y,3,t],[3,y,3,t]);
    if(y>2&&y%3===0){ for(let x=0;x<=3;x++) for(let z=0;z<=3;z++) if(x===0||x===3||z===0||z===3) p.push([x,y,z,BlockType.PLANKS]); }
  }
  p.push(...layer(14,0,0,3,3,BlockType.DARK_OAK_PLANKS));
  p.push([1,1,0,BlockType.AIR],[2,1,0,BlockType.AIR],[1,2,0,BlockType.AIR]);
  p.push([1,7,1,BlockType.CHEST],[2,13,2,BlockType.LANTERN]);
  return p.map(([dx,dy,dz,t])=>[bx+dx,by+dy,bz+dz,t]);
}

export type StructureKey =
  'OAK_HOUSE'|'STONE_TOWER'|'DESERT_PYRAMID'|'DESERT_WELL'|'DUNGEON'|
  'TAIGA_CABIN'|'JUNGLE_TEMPLE'|'SWAMP_HUT'|'VILLAGE_WELL'|'STONE_CIRCLE'|
  'RUINED_TOWER'|'IGLOO'|'BLACKSTONE_FORT'|'MINE_ENTRANCE'|'MESA_RUIN'|
  'END_PORTAL_FRAG'|'MUSHROOM_HOLLOW'|'GRAVEYARD'|'UNDERWATER_RUIN'|'MONOLITH'|
  'NETHER_SHRINE'|'BEACON_SHRINE'|'ANCIENT_LIBRARY'|'OCEAN_MONUMENT'|'OUTPOST_TOWER';

export const STRUCTURE_GENERATORS: Record<StructureKey,(bx:number,by:number,bz:number)=>BP[]> = {
  OAK_HOUSE: oakHouse, STONE_TOWER: stoneTower, DESERT_PYRAMID: desertPyramid,
  DESERT_WELL: desertWell, DUNGEON: dungeon, TAIGA_CABIN: taigaCabin,
  JUNGLE_TEMPLE: jungleTemple, SWAMP_HUT: swampHut, VILLAGE_WELL: villageWell,
  STONE_CIRCLE: stoneCircle, RUINED_TOWER: ruinedTower, IGLOO: igloo,
  BLACKSTONE_FORT: blackstonefort, MINE_ENTRANCE: mineEntrance, MESA_RUIN: mesaRuin,
  END_PORTAL_FRAG: endPortalFragment, MUSHROOM_HOLLOW: mushroomHollow, GRAVEYARD: graveyard,
  UNDERWATER_RUIN: underwaterRuin, MONOLITH: monolith, NETHER_SHRINE: netherShrine,
  BEACON_SHRINE: beaconShrine, ANCIENT_LIBRARY: ancientLibrary,
  OCEAN_MONUMENT: oceanMonument, OUTPOST_TOWER: outpostTower,
};
