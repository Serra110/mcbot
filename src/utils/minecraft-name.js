const ALIAS_MAP = {
  stone: 'stone',
  cobblestone: 'cobblestone',
  dirt: 'dirt',
  grass_block: 'grass_block',
  grass: 'grass_block',
  sand: 'sand',
  gravel: 'gravel',
  oak_log: 'oak_log',
  log: 'oak_log',
  wood: 'oak_log',
  oak_wood: 'oak_wood',
  oak_planks: 'oak_planks',
  planks: 'oak_planks',
  plank: 'oak_planks',
  crafting_table: 'crafting_table',
  furnace: 'furnace',
  chest: 'chest',
  iron_ore: 'iron_ore',
  coal_ore: 'coal_ore',
  gold_ore: 'gold_ore',
  diamond_ore: 'diamond_ore',
  emerald_ore: 'emerald_ore',
  redstone_ore: 'redstone_ore',
  iron_ingot: 'iron_ingot',
  gold_ingot: 'gold_ingot',
  diamond: 'diamond',
  emerald: 'emerald',
  redstone: 'redstone',
  torch: 'torch',
  ladder: 'ladder',
  glass: 'glass',
  obsidian: 'obsidian',
  water: 'water',
  lava: 'lava',
  tnt: 'tnt',
  leaves: 'oak_leaves',
  oak_leaves: 'oak_leaves',
  spruce_log: 'spruce_log',
  birch_log: 'birch_log',
  jungle_log: 'jungle_log',
  acacia_log: 'acacia_log',
  dark_oak_log: 'dark_oak_log',
  birch_planks: 'birch_planks',
  spruce_planks: 'spruce_planks',
  jungle_planks: 'jungle_planks',
  acacia_planks: 'acacia_planks',
  dark_oak_planks: 'dark_oak_planks',
  pickaxe: 'stone_pickaxe',
  sword: 'stone_sword',
  axe: 'stone_axe',
  shovel: 'stone_shovel',
  iron_pickaxe: 'iron_pickaxe',
  iron_sword: 'iron_sword',
  iron_axe: 'iron_axe',
  diamond_pickaxe: 'diamond_pickaxe',
  diamond_sword: 'diamond_sword',
  diamond_axe: 'diamond_axe',
  oak: 'oak_log',
  birch: 'birch_log',
  spruce: 'spruce_log',
  jungle: 'jungle_log',
  acacia: 'acacia_log',
  dark_oak: 'dark_oak_log',
  all_the_stone_you_have: 'stone',
};

function normalizeMinecraftName(value) {
  if (value === null || value === undefined) return '';

  const cleaned = String(value)
    .trim()
    .toLowerCase()
    .replace(/^minecraft:/i, '')
    .replace(/[\s\-]+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return cleaned;
}

function resolveBlockName(value) {
  const normalized = normalizeMinecraftName(value);
  if (!normalized) return '';

  const exact = ALIAS_MAP[normalized] || normalized;
  if (exact === normalized && normalized.includes('minecraft_')) {
    return normalized.replace(/^minecraft_/, '');
  }

  return exact;
}

function resolveItemName(value) {
  const normalized = normalizeMinecraftName(value);
  if (!normalized) return '';

  const exact = ALIAS_MAP[normalized] || normalized;
  if (exact === normalized && normalized.includes('minecraft_')) {
    return normalized.replace(/^minecraft_/, '');
  }

  return exact;
}

module.exports = {
  normalizeMinecraftName,
  resolveBlockName,
  resolveItemName,
};
