const { Vec3 } = require('vec3');
const logger = require('../utils/logger');

const BLUEPRINTS = {
  house: {
    name: 'cosy wooden house',
    size: { w: 7, h: 5, d: 7 },
    material: (cell, y) => {
      if (cell === 'roof') return 'oak_planks';
      if (cell === 'wall') return 'oak_planks';
      if (cell === 'floor') return 'oak_planks';
      return 'oak_planks';
    },
    cells: buildHouseCells(),
  },

  tower: {
    name: 'watchtower',
    size: { w: 5, h: 8, d: 5 },
    material: (cell, y) => (cell === 'roof' ? 'oak_planks' : 'cobblestone'),
    cells: buildTowerCells(),
  },

  bridge: {
    name: 'simple bridge',
    size: { w: 5, h: 2, d: 9 },
    material: () => 'oak_planks',
    cells: buildBridgeCells(),
  },

  wall: {
    name: 'stone wall',
    size: { w: 1, h: 3, d: 9 },
    material: () => 'cobblestone',
    cells: buildWallCells(),
  },

  fountain: {
    name: 'small fountain',
    size: { w: 5, h: 3, d: 5 },
    material: (cell) => {
      if (cell === 'water') return 'water';
      return 'stone';
    },
    cells: buildFountainCells(),
  },
};

function buildHouseCells() {
  // 7 wide (x -3..3), 5 tall (y 0..4), 7 deep (z -3..3)
  const cells = [];
  for (let y = 0; y < 5; y++) {
    for (let x = -3; x <= 3; x++) {
      for (let z = -3; z <= 3; z++) {
        const isEdge = Math.abs(x) === 3 || Math.abs(z) === 3;
        if (y === 0 && isEdge) {
          cells.push({ x, y, z, type: 'floor' });
        }
        if (y >= 1 && y <= 3 && isEdge) {
          // door on front face (z = 3), 2 blocks wide at center
          const isDoor = z === 3 && (x === 0 || x === 1) && y <= 2;
          const isWindow = z === -3 && (x === -1 || x === 0 || x === 1);
          if (!isDoor && !isWindow) {
            cells.push({ x, y, z, type: 'wall' });
          }
        }
        if (y === 4 && (Math.abs(x) <= 2 && Math.abs(z) <= 2)) {
          cells.push({ x, y, z, type: 'roof' });
        }
      }
    }
  }
  return cells;
}

function buildTowerCells() {
  const cells = [];
  for (let y = 0; y < 8; y++) {
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        const isEdge = Math.abs(x) === 2 || Math.abs(z) === 2;
        if (y === 0 && isEdge) cells.push({ x, y, z, type: 'floor' });
        if (y >= 1 && y <= 6 && isEdge) cells.push({ x, y, z, type: 'wall' });
        if (y === 7 && (Math.abs(x) <= 1 && Math.abs(z) <= 1)) cells.push({ x, y, z, type: 'roof' });
      }
    }
  }
  return cells;
}

function buildBridgeCells() {
  const cells = [];
  for (let y = 0; y < 2; y++) {
    for (let x = -2; x <= 2; x++) {
      for (let z = 0; z <= 8; z++) {
        cells.push({ x, y, z, type: y === 0 ? 'floor' : (y === 1 && Math.abs(x) === 2 ? 'wall' : 'floor') });
      }
    }
  }
  return cells;
}

function buildWallCells() {
  const cells = [];
  for (let y = 0; y < 3; y++) {
    for (let z = 0; z < 9; z++) {
      cells.push({ x: 0, y, z, type: 'wall' });
    }
  }
  return cells;
}

function buildFountainCells() {
  const cells = [];
  for (let y = 0; y < 3; y++) {
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        const ring = Math.max(Math.abs(x), Math.abs(z)) === 2;
        const center = x === 0 && z === 0;
        if (y === 0 && ring) cells.push({ x, y, z, type: 'floor' });
        if (y === 1 && ring) cells.push({ x, y, z, type: 'wall' });
        if (y === 2 && center) cells.push({ x, y, z, type: 'water' });
      }
    }
  }
  return cells;
}

function findBlueprint(keyword) {
  const k = String(keyword || '').toLowerCase();
  if (/casa|house|base|home/.test(k)) return BLUEPRINTS.house;
  if (/torre|tower|watchtower/.test(k)) return BLUEPRINTS.tower;
  if (/ponte|bridge/.test(k)) return BLUEPRINTS.bridge;
  if (/parede|wall|muro/.test(k)) return BLUEPRINTS.wall;
  if (/fonte|fountain|fontan/.test(k)) return BLUEPRINTS.fountain;
  return null;
}

async function buildBlueprint(bot, blueprint, meta = {}) {
  const blocks = blueprint.cells.map((cell) => ({
    x: cell.x,
    y: cell.y,
    z: cell.z,
    block: blueprint.material(cell.type, cell.y),
  }));
  return buildBlocks(bot, blocks, { name: blueprint.name, meta });
}

// Build a generic list of blocks: [{ x, y, z, block }] relative to the bot,
// y=0 is the first block above the ground. Shared by blueprints, local
// schematics and LLM-generated schematics.
async function buildBlocks(bot, blocks, { name = 'structure', meta = {} } = {}) {
  const { goals } = require('mineflayer-pathfinder');
  const anchorX = Math.round(bot.entity.position.x);
  const anchorZ = Math.round(bot.entity.position.z);

  const groundY = findGroundY(bot, anchorX, anchorZ);
  const baseY = groundY + 1;

  bot.chat(`Starting ${name} (ground at y=${groundY}, baseY=${baseY})...`);
  logger.info(`[blueprint] anchor=(${anchorX},?,${anchorZ}) groundY=${groundY} baseY=${baseY}`);
  const diag = bot.blockAt(new Vec3(anchorX, baseY, anchorZ));
  logger.info('[blueprint] block at (anchorX, baseY, anchorZ):', diag ? { type: diag.type, name: diag.name } : null);
  const diagSupport = bot.blockAt(new Vec3(anchorX, groundY, anchorZ));
  logger.info('[blueprint] support at (anchorX, groundY, anchorZ):', diagSupport ? { type: diagSupport.type, name: diagSupport.name } : null);

  const normalized = [...blocks]
    .map((b) => ({ ...b, block: String(b.block || 'stone').replace(/^minecraft:/, '') }));
  const minX = Math.min(...normalized.map((b) => b.x));
  const maxX = Math.max(...normalized.map((b) => b.x));
  const minZ = Math.min(...normalized.map((b) => b.z));
  const maxZ = Math.max(...normalized.map((b) => b.z));
  const midX = (minX + maxX) / 2;
  const midZ = (minZ + maxZ) / 2;

  // Build order is resolved layer-by-layer as a dependency order: a cell can
  // be placed only when its support is already in place, where support = the
  // block below (y=0 sits on the ground) OR an already-placed lateral
  // neighbour. This makes roofs, overhangs/eaves and the lintel above the door
  // all placeable (every cell snaps to a placed neighbour, no matter how the
  // footprint looks — doorstep, step, etc.).
  const sorted = [];
  {
    const placed = new Set();
    const byPos = new Map();
    for (const b of normalized) byPos.set(`${b.x},${b.y},${b.z}`, b);
    const ys = [...new Set(normalized.map((b) => b.y))].sort((a, b) => a - b);
    for (const y of ys) {
      let pend = normalized.filter((b) => b.y === y);
      while (pend.length > 0) {
        let progressed = false;
        const still = [];
        for (const b of pend) {
          const key = `${b.x},${b.y},${b.z}`;
          const belowAvail = b.y === 0 || placed.has(`${b.x},${b.y - 1},${b.z}`);
          const lateral = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) =>
            placed.has(`${b.x + dx},${b.y},${b.z + dz}`)
          );
          if (belowAvail || lateral) {
            sorted.push(b);
            placed.add(key);
            progressed = true;
          } else {
            still.push(b);
          }
        }
        if (!progressed) {
          // Orphan cells (floating debris) can't ever get support here; append
          // them so the build still logs skips instead of silently dropping.
          sorted.push(...still);
          for (const b of still) placed.add(`${b.x},${b.y},${b.z}`);
          break;
        }
        pend = still;
      }
    }
  }

  // In creative, clear the inventory first so the hotbar has no leftover/other
  // items (which can cause placeBlock to place something unexpected).
  if (bot.game?.gameMode === 'creative' && bot.creative?.clearInventory) {
    try {
      await bot.creative.clearInventory();
    } catch (err) {
      logger.warn('[blueprint] clearInventory failed:', err.message);
    }
  }

  let placed = 0;
  const skipReasons = { water: 0, noMaterial: 0, noSupport: 0, occupied: 0, error: 0 };
  const materialsNeeded = computeBlockMaterials(blocks);

  // Ensure and cache stacks for each material needed. Each material gets its
  // own hotbar slot (36..44): if two materials shared a slot, setInventorySlot
  // would overwrite the first and every placeBlock would then place the last
  // material written (e.g. a whole house built from glass).
  const stackCache = {};
  let nextSlot = 36;
  for (const material of Object.keys(materialsNeeded)) {
    if (material === 'water' || material === 'air') continue;
    const optional = /door|bed|chest|furnace|crafting_table|bookshelf/.test(material);
    const stack = await ensureBuildMaterial(bot, material, Math.max(64, materialsNeeded[material]), nextSlot);
    if (!stack) {
      if (optional) {
        skipReasons.noMaterial++;
        continue;
      }
      bot.chat(`I need ${materialsNeeded[material]}x ${material} to build this.`);
      return false;
    }
    stackCache[material] = stack;
    logger.debug(`[blueprint] ${material} -> hotbar slot ${stack.slot}`);
    nextSlot++;
    if (nextSlot > 44) nextSlot = 36;
  }

const creative = bot.game?.gameMode === 'creative';
  const bounds = { x0: minX, x1: maxX, z0: minZ, z1: maxZ };

  // Stand just outside the build footprint (front face), on the ground, so the
  // bot is never inside the structure or stuck in a corner while building.
  if (!creative && bot.pathfinder?.goto) {
    await bot.pathfinder.goto(new goals.GoalNear(anchorX + Math.round((minX + maxX) / 2), baseY, anchorZ + maxZ + 2, 2)).catch(() => {});
  }

  // Distance from the bot's eyes to a point — the real measure for whether
  // placeBlock will actually land (server rejections silently time out at 5s).
  const eyesTo = (p) => bot.entity.position.offset(0, 1.62, 0).distanceTo(p);

  // Temporary scaffold state: pillars the bot climbs to reach tall cells are
  // tracked here and dug away ("removeScaffolds") once the build finishes.
  const ctx = { scaffolds: [], tempStack: null };

  for (const b of sorted) {
    const material = b.block;
    const worldPos = new Vec3(anchorX + b.x, baseY + b.y, anchorZ + b.z);
    const fromCenter = Math.sqrt((b.x - midX) ** 2 + (b.z - midZ) ** 2);

    if (material === 'water' || material === 'air') {
      skipReasons.water++;
      continue;
    }

    const stack = stackCache[material];
    if (!stack) {
      skipReasons.noMaterial++;
      continue;
    }

    const current = bot.blockAt(worldPos);
    if (current && current.type !== 0) {
      skipReasons.occupied++;
      continue;
    }

    // Pick a reference block to snap to: the block below, else a lateral
    // neighbour (this lets roof overhangs/eaves sit "floating" onto an
    // already-built inner roof block).
    const ref = pickReference(bot, worldPos);
    if (!ref) {
      skipReasons.noSupport++;
      continue;
    }

    // The bot must physically be CLOSE to the block it clicks: clicking a
    // block from across the structure gets silently rejected (5s timeout).
    // Get close FIRST, standing just outside the nearest wall in survival. If
    // even that isn't close enough (upper roof), climb a temporary scaffold
    // pillar beside the wall, then walk onto the built structure and finish
    // from up there. Give up silently if unreachable (no timeouts).
    if (!creative && eyesTo(ref.block.position) > 4.5) {
      await approach(bot, { x: b.x, z: b.z }, baseY, bounds, anchorX, anchorZ);
      if (eyesTo(ref.block.position) > 4.5) {
        await raiseOnScaffold(bot, { x: b.x, z: b.z }, ref, baseY, bounds, anchorX, anchorZ, stackCache, ctx);
        if (eyesTo(ref.block.position) > 4.5) {
          await standNearBuilt(bot, ref);
          if (eyesTo(ref.block.position) > 4.5) {
            skipReasons.noSupport++;
            continue;
          }
        }
      }
    }

    let ok = false;
    try {
      await equipBuildMaterial(bot, stack);
      logger.debug(`[blueprint] placing ${material} at ${worldPos.toString()}; held: ${bot.heldItem ? bot.heldItem.name : 'none'}`);
      await bot.placeBlock(ref.block, ref.vector);
      placed++;
      ok = true;
      logger.debug(`[blueprint] placed ${material} ok (${placed}/${sorted.length}, dist=${fromCenter.toFixed(1)})`);
    } catch (err) {
      // Drifted out of reach mid-begin (pathfinder interrupt, wedge, spawn
      // knockback...): edge closer to the reference and retry ONCE.
      if (bot.pathfinder?.goto && eyesTo(ref.block.position) > 4.5) {
await approach(bot, { x: b.x, z: b.z }, baseY, bounds, anchorX, anchorZ);
      }
      if (creative || (bot.pathfinder?.goto && eyesTo(ref.block.position) <= 4.5)) {
        try {
          const ref2 = pickReference(bot, worldPos);
          if (ref2) {
            await bot.placeBlock(ref2.block, ref2.vector);
            placed++;
            ok = true;
          }
        } catch (err2) {
          logger.warn(`[blueprint] retry failed at ${worldPos.toString()}: ${err2.message}`);
        }
      }
      if (!ok) {
        logger.warn(`[blueprint] place failed at ${worldPos.toString()}:`, err.message);
        skipReasons.error++;
      }
    }
  }

  // Tear down every scaffold pillar (top -> bottom) so the structure is left
  // clean. Best effort: columns the bot can't reach only log a warning.
  await removeScaffolds(bot, ctx);

  const totalSkip = Object.values(skipReasons).reduce((a, b) => a + b, 0);
  bot.chat(
    `Built a ${name}: placed ${placed} blocks` +
      (totalSkip === 0 ? '.' : ` (skipped ${totalSkip}: ${JSON.stringify(skipReasons)}).`)
  );
  return placed > 0;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Raise the bot on a temporary scaffold beside the wall so it can click cells
// above eye reach (upper roof rings). Uses a 2-column zigzag because survival
// can't stack a 1-wide pillar (the next block would land in the bot's own
// cell): each new block is placed on the column the bot is NOT standing on,
// then the bot steps onto it. Reuses a full non-glass block already in the
// hotbar so stackCache stays valid; all placed blocks are recorded in
// ctx.scaffolds and dug by removeScaffolds after the build.
async function raiseOnScaffold(bot, local, ref, baseY, bounds, anchorX, anchorZ, stackCache, ctx) {
  if (!bot.pathfinder?.goto) return false;
  if (!ctx.tempStack) ctx.tempStack = borrowTempStack(stackCache);
  if (!ctx.tempStack) return false;

  const stand = outsideStand(local, bounds);
  // Two columns, both pushed OUTWARD from the footprint (never inside the
  // build), so they can't collide with the walls.
  const ax = anchorX + (stand.x <= bounds.x0 ? stand.x - 1 : stand.x + 1);
  const az = anchorZ + (stand.z <= bounds.z0 ? stand.z - 1 : stand.z + 1);
  const bx = ax + 1;
  const bz = az;
  const groundY = findGroundY(bot, ax, az);
  if (!Number.isInteger(groundY)) return false;

  let need = Math.ceil(ref.block.position.y - baseY - 3.4);
  need = Math.max(2, Math.min(need, 9));

  const clickTop = async (x, y, z) => {
    const refBlock = bot.blockAt(new Vec3(x, y, z));
    if (!refBlock || refBlock.type === 0) return false;
    await equipBuildMaterial(bot, ctx.tempStack);
    await bot.placeBlock(refBlock, new Vec3(0, 1, 0));
    ctx.scaffolds.push({ x, y: y + 1, z });
    logger.debug(`[blueprint] scaffold ${x},${y + 1},${z}`);
    return true;
  };

  // Base platform: one block in each column, on the ground.
  if (!(await clickTop(ax, groundY, az))) return false;
  if (!(await clickTop(bx, groundY, bz))) return false;
  try {
    await bot.pathfinder.goto(new goals.GoalNear(ax, groundY + 2, az, 0.6)).catch(() => {});
  } catch {}

  // Zigzag the two columns up: every level goes on the column the bot is not
  // standing on, then the bot steps onto it (each "other" block already has a
  // below-support in the same column).
  let curA, curB;
  let other = { x: bx, z: bz, name: 'B' };
  let place = { x: ax, z: az, name: 'A' };
  let guard = 0;
  const maxLevel = groundY + need;
  for (let level = groundY + 2; level <= maxLevel; level++) {
    if (++guard > 24) return false;
    if (!(await clickTop(other.x, level - 1, other.z))) return false;
    try {
      await bot.pathfinder.goto(new goals.GoalNear(other.x, level + 1, other.z, 0.6)).catch(() => {});
    } catch {}
    const t = other;
    other = place;
    place = t;
  }
  return true;
}

// Reuse a full, non-exotic block already in the hotbar as scaffold material.
function borrowTempStack(stackCache) {
  const keys = Object.keys(stackCache);
  if (!keys.length) return null;
  for (const k of keys) {
    if (!/glass|door|bed|chest|furnace|crafting|torch|slab|stairs|pane/.test(k)) return stackCache[k];
  }
  return stackCache[keys[0]];
}

// Walk onto the built structure itself and stand next to the target cell (e.g.
// the roof-top platform beside the peak cap), so the last tall blocks are
// placed with a sub-block reach instead of from the ground.
async function standNearBuilt(bot, ref) {
  if (!bot.pathfinder?.goto) return;
  const { x, y, z } = ref.block.position;
  const cands = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    cands.push([x + dx, y, z + dz]);
    cands.push([x + dx, y - 1, z + dz]);
  }
  for (const [cx, cy, cz] of cands) {
    const bl = bot.blockAt(new Vec3(cx, cy, cz));
    if (bl && bl.type !== 0) {
      try {
        await bot.pathfinder.goto(new goals.GoalNear(cx, cy + 1, cz, 0.9)).catch(() => {});
        return;
      } catch {}
    }
  }
}

// Dig every scaffold block back down to the ground (top -> bottom); the bot
// falls one block per dig on the column it stands on. Unreachable columns are
// reported so they can be tidied manually.
async function removeScaffolds(bot, ctx) {
  const byY = [...ctx.scaffolds].sort((a, b) => b.y - a.y);
  for (const p of byY) {
    try {
      const block = bot.blockAt(new Vec3(p.x, p.y, p.z));
      if (block && block.type !== 0) {
        await bot.dig(block);
        await sleep(90);
      }
    } catch (err) {
      logger.warn(`[blueprint] scaffold cleanup @ ${p.x},${p.y},${p.z}: ${err.message}`);
    }
  }
}

// Count how many of each block a structure uses. Keys are normalized
// (lowercase, without the "minecraft:" prefix); "air"/"water" are excluded.
function computeBlockMaterials(blocks) {
  const counts = {};
  for (const b of blocks || []) {
    const name = String(b.block || 'stone').toLowerCase().replace(/^minecraft:/, '');
    if (name === 'air' || name === 'water') continue;
    counts[name] = (counts[name] || 0) + 1;
  }
  return counts;
}

function findGroundY(bot, x, z) {
  const topY = Math.ceil(bot.entity.position.y) + 2;
  for (let y = topY; y >= -64; y--) {
    const block = bot.blockAt(new Vec3(x, y, z));
    if (block && block.type !== 0) {
      return y;
    }
  }
  return Math.floor(bot.entity.position.y);
}

// Walk close to a build position (survival reach). The bot always stands
// OUTSIDE the walls: nearest side of the floor rect, so it never ends up
// inside the structure or on a wall (which made blocks appear "where the bot
// is"). Works in LOCAL cell coordinates, then converts to world with the
// anchor so the stand point is always just outside the right wall (mixing
// world refs with local bounds made the bot bolt to a far-off cell).
async function approach(bot, local, baseY, bounds, anchorX, anchorZ) {
  if (!bot.pathfinder) return;
  const { goals } = require('mineflayer-pathfinder');
  const stand = outsideStand(local, bounds);
  const target = new Vec3(anchorX + stand.x, baseY, anchorZ + stand.z);
  try {
    // Radius 1: stop right next to the wall, not 2+ blocks away.
    await bot.pathfinder.goto(new goals.GoalNear(target.x, target.y, target.z, 1));
  } catch (err) {
    logger.debug('[blueprint] approach failed:', err.message);
  }
}

// Clamp/resolve a standing point just outside the structure (2 blocks away
// from the nearest wall) so placed blocks are within reach horizontally.
function outsideStand(pos, floorRect) {
  let x = pos.x;
  let z = pos.z;
  if (floorRect) {
    x = Math.max(floorRect.x0, Math.min(floorRect.x1, x));
    z = Math.max(floorRect.z0, Math.min(floorRect.z1, z));
    const left = x - floorRect.x0;
    const right = floorRect.x1 - x;
    const top = z - floorRect.z0;
    const bottom = floorRect.z1 - z;
    const minSide = Math.min(left, right, top, bottom);
    if (minSide === left) x = floorRect.x0 - 2;
    else if (minSide === right) x = floorRect.x1 + 2;
    else if (minSide === top) z = floorRect.z0 - 2;
    else z = floorRect.z1 + 2;
  }
  return { x, z };
}

// Choose a solid block to snap the new block to. Priority: the block below,
// then lateral neighbours on the same level (so floating roof overhangs/eaves
// can attach to an already-built inner roof block). Partial blocks (doors,
// etc.) are never used as a below-support: servers reject attaching blocks to
// a door's face and it made nothing stay on top of the entrance.
function pickReference(bot, worldPos) {
  const PARTIAL = /door|torch|rail|sign|button|lever|pressure_plate|short_grass|flower|carpet|sapling|slab|stairs|fence|wall|trapdoor|plate/;
  const offsets = [
    { o: new Vec3(0, -1, 0), v: new Vec3(0, 1, 0) },
    { o: new Vec3(1, 0, 0), v: new Vec3(-1, 0, 0) },
    { o: new Vec3(-1, 0, 0), v: new Vec3(1, 0, 0) },
    { o: new Vec3(0, 0, 1), v: new Vec3(0, 0, -1) },
    { o: new Vec3(0, 0, -1), v: new Vec3(0, 0, 1) },
  ];
  for (const { o, v } of offsets) {
    const block = bot.blockAt(worldPos.plus(o));
    if (!block || block.type === 0) continue;
    const name = block.name || '';
    // Below support must be a full block (no doors, no slabs, ...).
    // `boundingBox === undefined` (some data/mocks) is treated as full.
    if (o.y === -1 && (PARTIAL.test(name) || (block.boundingBox !== undefined && block.boundingBox !== 'block'))) continue;
    return { block, vector: v };
  }
  return null;
}

async function equipBuildMaterial(bot, stack) {
  await bot.equip(stack, 'hand');
}

async function ensureBuildMaterial(bot, material, count, slot) {
  const existing = findStack(bot, material);
  if (existing) return existing;

  if (bot.game?.gameMode !== 'creative' || !bot.creative?.setInventorySlot) {
    return null;
  }

  const mcData = require('minecraft-data')(bot.version);
  const itemInfo = mcData.itemsByName[material];
  if (!itemInfo) return null;

  const Item = require('prismarine-item')(bot.registry);
  // Creative counts are capped at the vanilla 64 max stack size. A larger
  // stack makes the server reject/clamp the set_creative_slot packet, so the
  // ack (updateSlot) never arrives and mineflayer times out after 5s.
  const qty = Math.min(64, Math.max(1, count));

  // Try the preferred slot first, then the rest of the hotbar. A slot whose
  // ack timed out once stays "in progress" in mineflayer and would reject any
  // further write, so we fall back to the next slot instead of giving up.
  const preferred = slot == null ? 36 : slot;
  const hotbar = [];
  for (let s = 36; s <= 44; s++) if (s !== preferred) hotbar.push(s);

  for (const s of [preferred, ...hotbar]) {
    const item = new Item(itemInfo.id, qty, 0);
    try {
      // Wait for the server to ack/apply the creative slot so the local
      // inventory state matches what the server actually holds in the hotbar.
      await bot.creative.setInventorySlot(s, item);
      bot.inventory.slots[s] = item;
      item.slot = s;
      return item;
    } catch (err) {
      logger.warn(`[blueprint] creative slot ${s} failed for ${material}: ${err.message}; trying next...`);
    }
  }

  logger.warn(`[blueprint] could not set any creative slot for ${material}.`);
  return null;
}

function findStack(bot, material) {
  const name = String(material).toLowerCase().replace(/^minecraft:/, '');
  return bot.inventory.items().find((slot) => {
    const n = slot && slot.name ? slot.name.toLowerCase().replace(/^minecraft:/, '') : '';
    return n === name;
  }) || null;
}

module.exports = { BLUEPRINTS, findBlueprint, buildBlueprint, buildBlocks, computeBlockMaterials };
