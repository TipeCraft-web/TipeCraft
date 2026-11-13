import { BlockType } from './blocks';

type SoundProfile = {
  filter: BiquadFilterType;
  frequency: number;
  volume: number;
  duration: number;
  tone?: number;
};

const WOOD_BLOCKS = new Set<BlockType>([
  BlockType.WOOD, BlockType.OAK_LOG, BlockType.BIRCH_LOG, BlockType.SPRUCE_LOG,
  BlockType.DARK_OAK_LOG, BlockType.JUNGLE_LOG, BlockType.ACACIA_LOG,
  BlockType.STRIPPED_OAK_LOG, BlockType.BAMBOO_BLOCK, BlockType.WARPED_STEM,
  BlockType.CRIMSON_STEM, BlockType.PLANKS, BlockType.BIRCH_PLANKS,
  BlockType.SPRUCE_PLANKS, BlockType.DARK_OAK_PLANKS, BlockType.JUNGLE_PLANKS,
  BlockType.ACACIA_PLANKS, BlockType.BAMBOO_PLANKS, BlockType.WARPED_PLANKS,
  BlockType.CRIMSON_PLANKS, BlockType.CRAFTING_TABLE, BlockType.CHEST,
]);

const SOFT_BLOCKS = new Set<BlockType>([
  BlockType.GRASS, BlockType.DIRT, BlockType.SAND, BlockType.GRAVEL,
  BlockType.COARSE_DIRT, BlockType.ROOTED_DIRT, BlockType.MUD,
  BlockType.PODZOL, BlockType.MYCELIUM, BlockType.SOUL_SOIL,
  BlockType.CLAY, BlockType.SNOW_BLOCK,
]);

const GLASS_BLOCKS = new Set<BlockType>([
  BlockType.GLASS, BlockType.WHITE_GLASS, BlockType.RED_GLASS,
  BlockType.ORANGE_GLASS, BlockType.YELLOW_GLASS, BlockType.GREEN_GLASS,
  BlockType.BLUE_GLASS, BlockType.PURPLE_GLASS, BlockType.BLACK_GLASS,
  BlockType.ICE, BlockType.PACKED_ICE, BlockType.BLUE_ICE,
]);

const LEAF_BLOCKS = new Set<BlockType>([
  BlockType.LEAF, BlockType.BIRCH_LEAF, BlockType.SPRUCE_LEAF,
  BlockType.DARK_OAK_LEAF, BlockType.JUNGLE_LEAF, BlockType.ACACIA_LEAF,
  BlockType.AZALEA_LEAF,
]);

const WOOL_BLOCKS = new Set<BlockType>([
  BlockType.WHITE_WOOL, BlockType.ORANGE_WOOL, BlockType.YELLOW_WOOL,
  BlockType.GREEN_WOOL, BlockType.RED_WOOL, BlockType.BLACK_WOOL,
  BlockType.BLUE_WOOL, BlockType.PURPLE_WOOL, BlockType.CYAN_WOOL,
  BlockType.PINK_WOOL,
]);

const METAL_BLOCKS = new Set<BlockType>([
  BlockType.IRON_ORE, BlockType.GOLD_ORE, BlockType.COPPER_ORE,
  BlockType.IRON_BLOCK, BlockType.GOLD_BLOCK, BlockType.COPPER_BLOCK,
  BlockType.ANVIL, BlockType.IRON_BARS, BlockType.RAW_IRON_BLOCK,
  BlockType.RAW_GOLD_BLOCK, BlockType.RAW_COPPER_BLOCK, BlockType.NETHERITE_BLOCK,
]);

let audioContext: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const browserWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextConstructor = window.AudioContext ?? browserWindow.webkitAudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

function getNoiseBuffer(context: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(context.sampleRate * 0.18);
  noiseBuffer = context.createBuffer(1, length, context.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) {
    const fade = 1 - i / samples.length;
    samples[i] = (Math.random() * 2 - 1) * fade * fade;
  }
  return noiseBuffer;
}

function soundProfile(block: BlockType): SoundProfile {
  const id = Number(block);
  const profile: SoundProfile = {
    filter: 'bandpass',
    frequency: 430,
    volume: 0.2,
    duration: 0.15,
    tone: 145,
  };

  if (WOOD_BLOCKS.has(block)) {
    Object.assign(profile, { filter: 'lowpass', frequency: 270, volume: 0.24, duration: 0.16, tone: 95 });
  } else if (SOFT_BLOCKS.has(block)) {
    Object.assign(profile, { filter: 'lowpass', frequency: 560, volume: 0.16, duration: 0.13, tone: undefined });
  } else if (GLASS_BLOCKS.has(block)) {
    Object.assign(profile, { filter: 'highpass', frequency: 1_450, volume: 0.13, duration: 0.1, tone: 560 });
  } else if (METAL_BLOCKS.has(block)) {
    Object.assign(profile, { filter: 'bandpass', frequency: 930, volume: 0.2, duration: 0.14, tone: 275 });
  } else if (LEAF_BLOCKS.has(block)) {
    Object.assign(profile, { filter: 'highpass', frequency: 1_000, volume: 0.11, duration: 0.12, tone: undefined });
  } else if (WOOL_BLOCKS.has(block)) {
    Object.assign(profile, { filter: 'lowpass', frequency: 720, volume: 0.13, duration: 0.12, tone: undefined });
  }

  // Give every block type a stable, distinct pitch and decay while retaining
  // the recognizable material character of its sound.
  profile.frequency += id * 5.7;
  profile.duration += (id % 11) * 0.004;
  if (profile.tone !== undefined) profile.tone += id * 3.1;
  return profile;
}

export function primeBlockAudio(): void {
  const context = getAudioContext();
  if (context?.state === 'suspended') void context.resume().catch(() => {});
}

export function playBlockBreakSound(block: BlockType): void {
  const context = getAudioContext();
  if (!context) return;

  const play = () => {
    const profile = soundProfile(block);
    const now = context.currentTime;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = getNoiseBuffer(context);
    filter.type = profile.filter;
    filter.frequency.setValueAtTime(profile.frequency, now);
    filter.Q.setValueAtTime(profile.filter === 'bandpass' ? 0.65 : 0.5, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(profile.volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + profile.duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start(now);
    source.stop(now + profile.duration);

    if (profile.tone) {
      const oscillator = context.createOscillator();
      const toneGain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(profile.tone, now);
      oscillator.frequency.exponentialRampToValueAtTime(profile.tone * 0.55, now + profile.duration);
      toneGain.gain.setValueAtTime(profile.volume * 0.28, now);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + profile.duration);
      oscillator.connect(toneGain);
      toneGain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + profile.duration);
    }
  };

  if (context.state === 'suspended') {
    void context.resume().then(play).catch(() => {});
  } else {
    play();
  }
}

export function playMenuClickSound(): void {
  const context = getAudioContext();
  if (!context) return;

  const play = () => {
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(760, now);
    oscillator.frequency.exponentialRampToValueAtTime(480, now + 0.045);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1_600, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.06);
  };

  if (context.state === 'suspended') {
    void context.resume().then(play).catch(() => {});
  } else {
    play();
  }
}
