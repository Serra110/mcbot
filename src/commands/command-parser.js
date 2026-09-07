const { resolveBlockName } = require('../utils/minecraft-name');
const { WOOD_TYPES } = require('../utils/minecraft-blocks');

function humanizeBuildDescription(raw) {
  const text = normalize(raw || '').trim();
  if (/\bhouse\b|\bcasa\b|\bbase\b/.test(text)) return 'house';
  if (/\btower\b|\btorre\b|\bwall\b|\bparede\b/.test(text)) return 'tower';
  return text || 'house';
}

const MINE_ALIASES = {
  madeira: 'oak_log', tronco: 'oak_log', log: 'oak_log', wood: 'oak_log',
  pedra: 'stone', cobblestone: 'cobblestone', paralelepipedo: 'cobblestone', stone: 'stone',
  'minerio de ferro': 'iron_ore', ferro: 'iron_ore', 'iron ore': 'iron_ore', iron: 'iron_ore',
  'minerio de carvao': 'coal_ore', carvao: 'coal_ore', 'coal ore': 'coal_ore', coal: 'coal_ore',
  ouro: 'gold_ore', gold: 'gold_ore',
  diamante: 'diamond_ore', diamond: 'diamond_ore',
  areia: 'sand', sand: 'sand',
  terra: 'dirt', dirt: 'dirt',
};

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tryFastPath(rawText) {
  const text = normalize(rawText.trim());

  if (/^(para|stop|para tudo|cancela|halt|cancel)$/.test(text)) {
    return { action: 'stop' };
  }

  if (/^(status|como estas|o que estas a fazer|how are you|what are you doing)$/.test(text)) {
    return { action: 'status' };
  }

  const giveAllMatch = text.match(/^(?:dá|da|give me|gives? me|give)\s+(?:all|every|everything|todos?|tudo)\s+(?:the\s+)?(.+?)\s+(?:you have|que tens|que tem|que você tem)$/i);
  if (giveAllMatch) {
    const itemText = (giveAllMatch[1] || '').trim();
    const item = resolveBlockName(itemText) || MINE_ALIASES[itemText] || (WOOD_TYPES.includes(itemText) ? itemText : itemText);
    if (item) {
      return { action: 'give', item, amount: 'all' };
    }
  }

  const giveMatch = text.match(/^(?:dá|da|give me|gives? me|give)\s+((?:\d+\s+)?)(.+)$/i);
  if (giveMatch) {
    const amountText = (giveMatch[1] || '').trim();
    const itemText = (giveMatch[2] || '').trim();
    const amount = amountText ? parseInt(amountText, 10) || 1 : 1;
    const cleanedItem = itemText.replace(/^(all the|all|every|todo[s]? )/i, '').trim();
    const item = resolveBlockName(cleanedItem) || MINE_ALIASES[cleanedItem] || (WOOD_TYPES.includes(cleanedItem) ? cleanedItem : cleanedItem);
    if (item && item !== 'all_the_stone_you_have') {
      return { action: 'give', item, amount };
    }
  }

  const buildMatch = text.match(/^(?:build|construir|construi|craft)\s+(.+)$/i);
  if (buildMatch) {
    return { action: 'build', description: humanizeBuildDescription(buildMatch[1]) };
  }

  const followMatch = text.match(/^segue[- ]?me$|^segue (.+)$|^vem (aqui|comigo)$|^follow (.+)$|^follow me$|^come (here|with me)$/);
  if (followMatch) {
    return { action: 'follow', target: followMatch[1] || '' };
  }

  const attackMatch = text.match(/^(?:mata|kill|ataca|attack|atacar)\s+(.+)$/);
  if (attackMatch) {
    return { action: 'attack', target: attackMatch[1].trim() };
  }

  const mineMatch = text.match(/^(minera(r)?|mine)\s+(.+)$/);
  if (mineMatch) {
    const rest = mineMatch[3];
    const amountMatch = rest.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[1], 10) : 1;
    const nameOnly = rest.replace(/\d+/g, '').trim();
    const blockId = resolveBlockName(nameOnly) || MINE_ALIASES[nameOnly] || MINE_ALIASES[normalize(nameOnly)] || null;
    if (blockId) {
      return { action: 'mine', block: blockId, amount };
    }
    return null;
  }

  return null;
}

module.exports = { tryFastPath };
