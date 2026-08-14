import { useState, useMemo } from 'react';
import { BlockType, BLOCK_NAMES, BLOCK_COLORS } from './blocks';
import { blockTextureUrl } from './textures';

interface Recipe {
  id: string;
  name: string;
  ingredients: { type: BlockType; count: number }[];
  result: { type: BlockType; count: number };
  category: 'building' | 'tools' | 'food' | 'misc';
}

const RECIPES: Recipe[] = [
  // Basic crafting
  { id:'planks',  name:'Oak Planks (4)',    category:'building', ingredients:[{type:BlockType.WOOD,count:1}],      result:{type:BlockType.PLANKS,count:4} },
  { id:'bplanks', name:'Birch Planks (4)',  category:'building', ingredients:[{type:BlockType.BIRCH_LOG,count:1}], result:{type:BlockType.BIRCH_PLANKS,count:4} },
  { id:'splanks', name:'Spruce Planks (4)', category:'building', ingredients:[{type:BlockType.SPRUCE_LOG,count:1}],result:{type:BlockType.SPRUCE_PLANKS,count:4} },
  { id:'ct',      name:'Crafting Table',    category:'tools',    ingredients:[{type:BlockType.PLANKS,count:4}],    result:{type:BlockType.CRAFTING_TABLE,count:1} },
  { id:'furnace', name:'Furnace',           category:'tools',    ingredients:[{type:BlockType.COBBLESTONE,count:8}],result:{type:BlockType.FURNACE,count:1} },
  { id:'chest',   name:'Chest',             category:'tools',    ingredients:[{type:BlockType.PLANKS,count:8}],    result:{type:BlockType.CHEST,count:1} },
  { id:'glass',   name:'Glass (4)',         category:'building', ingredients:[{type:BlockType.SAND,count:4}],      result:{type:BlockType.GLASS,count:4} },
  { id:'cobwall', name:'Cobble Wall (6)',   category:'building', ingredients:[{type:BlockType.COBBLESTONE,count:6}],result:{type:BlockType.COBBLE_WALL,count:6} },
  { id:'stonebr', name:'Stone Bricks (4)', category:'building', ingredients:[{type:BlockType.STONE,count:4}],     result:{type:BlockType.STONE_BRICKS,count:4} },
  { id:'sandst',  name:'Sandstone (4)',     category:'building', ingredients:[{type:BlockType.SAND,count:4}],      result:{type:BlockType.SANDSTONE,count:4} },
  { id:'tnt',     name:'TNT',              category:'misc',     ingredients:[{type:BlockType.SAND,count:5},{type:BlockType.COAL_ORE,count:4}], result:{type:BlockType.TNT,count:1} },
  { id:'ironblk', name:'Iron Block',       category:'building', ingredients:[{type:BlockType.IRON_ORE,count:9}],  result:{type:BlockType.IRON_BLOCK,count:1} },
  { id:'goldblk', name:'Gold Block',       category:'building', ingredients:[{type:BlockType.GOLD_ORE,count:9}],  result:{type:BlockType.GOLD_BLOCK,count:1} },
  { id:'diamblk', name:'Diamond Block',    category:'building', ingredients:[{type:BlockType.DIAMOND_ORE,count:9}],result:{type:BlockType.DIAMOND_BLOCK,count:1} },
  { id:'emerblk', name:'Emerald Block',    category:'building', ingredients:[{type:BlockType.EMERALD_ORE,count:9}],result:{type:BlockType.EMERALD_BLOCK,count:1} },
  { id:'coalblk', name:'Coal Block',       category:'building', ingredients:[{type:BlockType.COAL_ORE,count:9}],  result:{type:BlockType.COAL_BLOCK,count:1} },
  { id:'lapblk',  name:'Lapis Block',      category:'building', ingredients:[{type:BlockType.LAPIS_ORE,count:9}], result:{type:BlockType.LAPIS_BLOCK,count:1} },
  { id:'obsid',   name:'Obsidian (4)',      category:'building', ingredients:[{type:BlockType.WATER,count:2},{type:BlockType.LAVA,count:2}], result:{type:BlockType.OBSIDIAN,count:4} },
  { id:'booksh',  name:'Bookshelf',        category:'misc',     ingredients:[{type:BlockType.PLANKS,count:6},{type:BlockType.COAL_ORE,count:3}], result:{type:BlockType.BOOKSHELF,count:1} },
  { id:'pumpkin', name:'Jack o Lantern',   category:'misc',     ingredients:[{type:BlockType.PUMPKIN,count:1},{type:BlockType.COAL_ORE,count:1}], result:{type:BlockType.JACK_O_LANTERN,count:1} },
  { id:'bricks',  name:'Bricks (4)',       category:'building', ingredients:[{type:BlockType.CLAY,count:4}],      result:{type:BlockType.BRICKS,count:4} },
  { id:'snowblk', name:'Snow Block',       category:'building', ingredients:[{type:BlockType.ICE,count:4}],       result:{type:BlockType.SNOW_BLOCK,count:4} },
  { id:'packed',  name:'Packed Ice (4)',   category:'building', ingredients:[{type:BlockType.ICE,count:9}],       result:{type:BlockType.PACKED_ICE,count:1} },
  { id:'terrac',  name:'Terracotta (4)',   category:'building', ingredients:[{type:BlockType.CLAY,count:4},{type:BlockType.SAND,count:1}], result:{type:BlockType.TERRACOTTA,count:4} },
  { id:'wconcr',  name:'White Concrete',  category:'building', ingredients:[{type:BlockType.GRAVEL,count:4},{type:BlockType.SAND,count:4}], result:{type:BlockType.WHITE_CONCRETE,count:4} },
  { id:'rconcr',  name:'Red Concrete',    category:'building', ingredients:[{type:BlockType.GRAVEL,count:4},{type:BlockType.RED_SAND,count:4}], result:{type:BlockType.RED_CONCRETE,count:4} },
  { id:'wglass',  name:'White Glass (4)', category:'building', ingredients:[{type:BlockType.GLASS,count:4},{type:BlockType.SNOW_BLOCK,count:1}], result:{type:BlockType.WHITE_GLASS,count:4} },
  { id:'rglass',  name:'Red Glass (4)',   category:'building', ingredients:[{type:BlockType.GLASS,count:4},{type:BlockType.RED_CONCRETE,count:1}], result:{type:BlockType.RED_GLASS,count:4} },
  { id:'bglass',  name:'Blue Glass (4)',  category:'building', ingredients:[{type:BlockType.GLASS,count:4},{type:BlockType.LAPIS_ORE,count:1}], result:{type:BlockType.BLUE_GLASS,count:4} },
  { id:'gglass',  name:'Green Glass (4)', category:'building', ingredients:[{type:BlockType.GLASS,count:4},{type:BlockType.EMERALD_ORE,count:1}], result:{type:BlockType.GREEN_GLASS,count:4} },
  { id:'wwooll',  name:'White Wool (4)',  category:'building', ingredients:[{type:BlockType.GRAVEL,count:4}],     result:{type:BlockType.WHITE_WOOL,count:4} },
  { id:'rwooll',  name:'Red Wool (4)',    category:'building', ingredients:[{type:BlockType.WHITE_WOOL,count:4},{type:BlockType.REDSTONE_ORE,count:1}], result:{type:BlockType.RED_WOOL,count:4} },
  { id:'enchant', name:'Enchanting Table',category:'tools',   ingredients:[{type:BlockType.OBSIDIAN,count:4},{type:BlockType.DIAMOND_BLOCK,count:2}], result:{type:BlockType.ENCHANTING_TABLE,count:1} },
  { id:'beacon',  name:'Beacon',         category:'tools',    ingredients:[{type:BlockType.GLASS,count:5},{type:BlockType.NETHERITE_BLOCK,count:1},{type:BlockType.DIAMOND_BLOCK,count:3}], result:{type:BlockType.BEACON,count:1} },
  { id:'slimeb',  name:'Slime Block (4)', category:'misc',    ingredients:[{type:BlockType.GRAVEL,count:4},{type:BlockType.WATER,count:4}],result:{type:BlockType.SLIME_BLOCK,count:4} },
  { id:'lantern', name:'Lantern',        category:'misc',     ingredients:[{type:BlockType.COAL_ORE,count:1},{type:BlockType.IRON_ORE,count:1}], result:{type:BlockType.LANTERN,count:2} },
  { id:'prismar', name:'Prismarine (4)', category:'building', ingredients:[{type:BlockType.GRAVEL,count:4},{type:BlockType.WATER,count:4}],result:{type:BlockType.PRISMARINE,count:4} },
  { id:'purpur',  name:'Purpur Block (4)',category:'building', ingredients:[{type:BlockType.AMETHYST_BLOCK,count:4}], result:{type:BlockType.PURPUR_BLOCK,count:4} },
];

function colorStr(t: BlockType): string {
  const c = BLOCK_COLORS[t];
  if (!c) return '#888';
  return `rgb(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)})`;
}

interface Props {
  counts: Record<number, number>;
  onCraft: (result: BlockType, count: number, consume: { type: BlockType; count: number }[]) => void;
  onClose: () => void;
}

type Category = 'all' | 'building' | 'tools' | 'food' | 'misc';

export default function Crafting({ counts, onCraft, onClose }: Props) {
  const [category, setCategory] = useState<Category>('all');
  const [crafted,  setCrafted]  = useState<string | null>(null);

  const inventory = useMemo(() => counts, [counts]);

  const canCraft = (r: Recipe) =>
    r.ingredients.every(ing => (inventory[ing.type] || 0) >= ing.count);

  const filtered = RECIPES.filter(r => category === 'all' || r.category === category);
  const available = filtered.filter(r => canCraft(r));
  const unavailable = filtered.filter(r => !canCraft(r));
  const sorted = [...available, ...unavailable];

  function doCraft(r: Recipe) {
    if (!canCraft(r)) return;
    onCraft(r.result.type, r.result.count, r.ingredients);
    setCrafted(r.id);
    setTimeout(() => setCrafted(null), 800);
  }

  const cats: Category[] = ['all','building','tools','misc'];

  return (
    <div data-no-look="1" style={{
      position:'fixed', inset:0, zIndex:50,
      background:'rgba(0,0,0,0.78)',
      display:'flex', alignItems:'center', justifyContent:'center',
      touchAction:'none',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        style={{
          background:'#1a1a2e', border:'2px solid #5cb85c',
          borderRadius:12, padding:20, width:420, maxWidth:'96vw', maxHeight:'88vh',
          overflow:'hidden', display:'flex', flexDirection:'column', gap:12,
          color:'#fff', fontFamily:'"Courier New",monospace',
          touchAction:'manipulation',
        }}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:20, fontWeight:700, color:'#5cb85c', letterSpacing:2 }}>⚒ CRAFTING</div>
          <div
            data-touch-btn="1"
            onTouchStart={e => { e.stopPropagation(); e.preventDefault(); onClose(); }}
            onClick={onClose}
            style={{ cursor:'pointer', fontSize:20, color:'#aaa', padding:'4px 8px' }}
          >✕</div>
        </div>

        {/* Category tabs */}
        <div style={{ display:'flex', gap:6 }}>
          {cats.map(c => (
            <div
              key={c}
              data-touch-btn="1"
              onTouchStart={e => { e.stopPropagation(); e.preventDefault(); setCategory(c); }}
              onClick={() => setCategory(c)}
              style={{
                padding:'6px 10px', borderRadius:6, fontSize:11, cursor:'pointer',
                background: category === c ? '#5cb85c' : '#333',
                color: category === c ? '#000' : '#ccc',
                fontWeight:700, textTransform:'uppercase',
              }}
            >
              {c}
            </div>
          ))}
        </div>

        {/* Inventory summary */}
        <div style={{ fontSize:10, color:'#888', borderBottom:'1px solid #333', paddingBottom:6 }}>
          Inventory: {Object.entries(inventory).map(([k, v]) => `${BLOCK_NAMES[+k]??'?'} ×${v}`).join(', ') || 'empty'}
        </div>

        {/* Recipe list */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
          {sorted.map(r => {
            const can = canCraft(r);
            const justCrafted = crafted === r.id;
            return (
              <div
                key={r.id}
                data-touch-btn="1"
                onTouchStart={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); doCraft(r); }}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 10px', borderRadius:8,
                  background: justCrafted ? '#1e5e1e' : can ? '#1a2e1a' : '#1a1a2a',
                  border: `1px solid ${justCrafted ? '#5cb85c' : can ? '#3d6b3d' : '#333'}`,
                  cursor: can ? 'pointer' : 'default',
                  opacity: can ? 1 : 0.55,
                  transition:'all 0.15s',
                }}
              >
                {/* Result swatch */}
                <div style={{
                  width:28, height:28, borderRadius:4, flexShrink:0,
                  background:colorStr(r.result.type),
                   backgroundImage:`url(${blockTextureUrl(r.result.type)})`,
                   backgroundSize:'cover',
                   imageRendering:'pixelated',
                  border:'1px solid rgba(255,255,255,0.2)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, color:'rgba(255,255,255,0.7)',
                }}>
                  {r.result.count > 1 ? r.result.count : ''}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color: can ? '#c8f0c8' : '#888' }}>{r.name}</div>
                  <div style={{ fontSize:10, color:'#666', marginTop:1 }}>
                    {r.ingredients.map(ing =>
                      `${BLOCK_NAMES[ing.type] ?? '?'} ×${ing.count}`
                    ).join(' + ')}
                  </div>
                </div>
                {can && (
                  <div style={{
                    fontSize:11, padding:'5px 10px', borderRadius:4,
                    background: justCrafted ? '#5cb85c' : '#3d6b3d',
                    color:'#fff', fontWeight:700,
                  }}>
                    {justCrafted ? '✓' : 'CRAFT'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
