const fs = require('fs');
const path = require('path');
const config = require('../../config/config');
const logger = require('../utils/logger');
const { generateSchematic } = require('../ai/schematic-generator');

function schematicsDir() {
  return path.resolve(config.building.schematicsDir);
}

function findSchematicFile(keyword) {
  const dir = schematicsDir();
  if (!fs.existsSync(dir)) return null;
  const k = String(keyword || '').toLowerCase();
  const files = fs.readdirSync(dir).filter((f) => /\.schem(atic)?$/i.test(f));
  if (files.length === 0) return null;

  // 1) exact name match on the file stem
  const exact = files.find((f) => path.basename(f).replace(/\.schem(atic)?$/i, '').toLowerCase() === k);
  if (exact) return path.join(dir, exact);

  // 2) substring match
  const sub = files.find((f) => path.basename(f).toLowerCase().includes(k));
  if (sub) return path.join(dir, sub);

  // 3) keyword matches blueprint-like words -> first file as default
  if (/casa|house|torre|tower|ponte|bridge|fonte|fountain|casa|base|build/i.test(k)) {
    return path.join(dir, files[0]);
  }
  return null;
}

// Read a .schem file and return relative blocks: [{ x, y, z, block }] with
// y=0 as the first non-empty layer above the schematic's own bottom.
async function loadSchematic(filePath, bot) {
  const buffer = fs.readFileSync(filePath);
  const { Schematic } = require('prismarine-schematic');
  const schem = await Schematic.read(buffer, bot.version || null);
  const version = schem.version || bot.version;

  const blocks = [];
  const minY = { value: Infinity };
  await schem.forEach(async (block, pos) => {
    const stateId = schem.getBlockStateId(pos);
    if (!stateId) return;
    const name = (block.name || '').toLowerCase();
    if (!name || name === 'air') return;
    if (pos.y < minY.value) minY.value = pos.y;
    blocks.push({ x: pos.x, y: pos.y, z: pos.z, block: name });
  });

  if (blocks.length === 0) {
    logger.warn('[schematic] file has no non-air blocks:', filePath);
    return null;
  }

  // Normalise so that the lowest non-empty layer becomes y=0.
  const groundOffset = minY.value === Infinity ? 0 : -minY.value;
  return blocks.map((b) => ({ ...b, y: b.y + groundOffset }));
}

async function getSchematic(bot, keyword, context = {}) {
  // 1) local blueprint always wins (hand-written, reliable)
  // (handled by the caller via blueprints.findBlueprint)

  // 2) try a local .schem file
  const file = findSchematicFile(keyword);
  if (file) {
    try {
      const blocks = await loadSchematic(file, bot);
      if (blocks) {
        logger.info(`[schematic] loaded local schematic ${file} (${blocks.length} blocks)`);
        return { name: path.basename(file).replace(/\.schem(atic)?$/i, ''), blocks, source: 'local' };
      }
    } catch (err) {
      logger.warn(`[schematic] failed to load ${file}:`, err.message);
    }
  }

  // 3) generate with the LLM (stronger model via Hack Club AI)
  if (config.building.schematicEnabled) {
    const generated = await generateSchematic(keyword, context);
    if (generated) {
      return { ...generated, source: 'llm' };
    }
  }

  return null;
}

module.exports = { getSchematic, findSchematicFile, loadSchematic };
