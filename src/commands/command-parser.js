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

  const followMatch = text.match(/^segue[- ]?me$|^segue (.+)$|^vem (aqui|comigo)$|^follow (.+)$|^follow me$|^come (here|with me)$/);
  if (followMatch) {
    return { action: 'follow', target: followMatch[1] || '' };
  }

  const mineMatch = text.match(/^(minera(r)?|mine)\s+(.+)$/);
  if (mineMatch) {
    const rest = mineMatch[3];
    const amountMatch = rest.match(/(\d+)/);
    const amount = amountMatch ? parseInt(amountMatch[1], 10) : 1;
    const nameOnly = rest.replace(/\d+/g, '').trim();
    const blockId = MINE_ALIASES[nameOnly] || null;
    if (blockId) {
      return { action: 'mine', block: blockId, amount };
    }
    return null;
  }

  return null;
}

module.exports = { tryFastPath };
