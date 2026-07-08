const fs = require('fs');
const path = require('path');
const config = require('../../config/config');



function loadMemory() {
  try {
    const raw = fs.readFileSync(config.paths.memoryFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveMemory(mem) {
  const dir = path.dirname(config.paths.memoryFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(config.paths.memoryFile, JSON.stringify(mem, null, 2));
}

function remember(playerName, fact) {
  const mem = loadMemory();
  if (!mem[playerName]) mem[playerName] = [];
  mem[playerName].push({ fact, at: new Date().toISOString() });
  mem[playerName] = mem[playerName].slice(-50);
  saveMemory(mem);
}

function recall(playerName, keyword = '') {
  const mem = loadMemory();
  const facts = mem[playerName] || [];
  if (!keyword) return facts;
  return facts.filter((f) => f.fact.toLowerCase().includes(keyword.toLowerCase()));
}

function recallAllAsText(playerName) {
  const facts = recall(playerName);
  if (facts.length === 0) return '';
  return facts.map((f) => `- ${f.fact}`).join('\n');
}

module.exports = { remember, recall, recallAllAsText };
