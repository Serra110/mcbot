const router = require('./llm-router');
const { extractJson } = require('./json-extract');
const config = require('../../config/config');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are a master vanilla-Minecraft builder. A player asks for a structure and a bot will place every block. You reply with ONLY valid JSON: a flat list of {"x","y","z","block"} where y=0 is floor level (the ground is below, never y<0), walls are 1 block thick, interiors are hollow.

KNOW YOUR GAME (real Minecraft):
- oak_log is a log pillar, oak_planks a flat wood surface, cobblestone/stone_bricks are stone, glass is a window and only ever 2 blocks max per build.
- Real Minecraft houses are modest: ODD footprints, log corner posts, plank walls, a pyramid or gabled roof, a centered door, 1-2 small mirrored windows. Build like a village, not abstract art.
- Never build solid cubes, never cap a box with a flat roof, never use glass as construction, never scatter single blocks.

TYPE RECIPES - follow these exact shapes, adapting only the MATERIALS (and footprint size) to the request:

HOUSE / cottage / shed / villa / shop (default 5 wide x 5 deep; keep it ODD and 5-7 blocks):
- The builder bot auto-adds the roof, mirrored windows, doorstep and interior furniture. You only need to provide the FLOOR and the WALLS:
- y=0 floor: main material filling x,z in an odd rectangle; oak_log (or a contrasting trim) at the 4 corners.
- y=1..3: perimeter walls only, interior EMPTY, main wall material (corners oak_log).
- Front face (pick one face): leave a 1x2 DOOR gap at the centre (y=1 and y=2 empty on one column).
- No more than 2 glass. Keep it simple: floor + walls + door gap is enough, ~90-130 blocks total.

TOWER / keep / watchtower (5x5):
- y=0 floor cobblestone 5x5; walls y=1..5 perimeter only (16 each) cobblestone; corner posts may be oak_log or stone_bricks.
- DOOR front face z=2: (0,1,2) and (0,2,2) EMPTY.
- Arrow slits: 1 glass at y=3 on two opposite faces (max 2 glass total).
- Top y=6: perimeter ring only (crenellation), center hollow. (~140)

BRIDGE (5 wide x 9 long): y=0 floor oak_planks 5x9 resting on the ground; y=1 rails only on the left/right edges x=+-2, z=0..9. (~95)

WELL / FOUNTAIN (5x5): y=0 stone ring (walls on the 4 edges, hollow center); y=1 stone ring; y=2 water ONLY at (0,2,0) for a well, else keep the ring. Max 1 water block.

STATUE / monument: chunky, ~20-40 blocks, starts at y=0 on the ground: base few blocks wide, then shoulders row 3 wide, 1-block head, legs as 2 columns. No floating parts.

GENERAL:
- Keep the recipe shape/geometry; only materials and footprint size may change to match the request (a stone house -> cobblestone/stone_bricks walls; a spruce build -> spruce_planks walls + oak_log corners...).
- AESTHETICS & PRACTICALITY: mirror the two windows around the door, use contrasting corner posts (e.g. oak_log against planks / stone_bricks against cobblestone), give the roof an overhanging eave, add a doorstep, and furnish the interior. Vary materials instead of one flat color. Hollow interiors with the door and windows are what make it a build, not a cube.
- Every block must touch the ground directly, below, or through a vertical chain. No floating blocks, no air entries, no y<0. One connected structure only.

Return exactly this JSON (no extra text):
{
  "name": "<short_snake_case_name>",
  "blocks": [
    {"x":0,"y":0,"z":0,"block":"oak_planks"},
    ...
  ]
}`;

const MAX_BLOCKS = 400;

const NEIGHBORS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

function normalizeStructure(blocks) {
  const seen = new Set();
  const uniq = [];
  for (const b of blocks) {
    const key = `${b.x},${b.y},${b.z}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push({ ...b, block: String(b.block).toLowerCase().replace(/^minecraft:/, '') });
  }
  const minY = Math.min(...uniq.map((b) => b.y));
  return uniq.map((b) => ({ ...b, y: b.y - minY }));
}

function analyzeStructure(blocks) {
  const set = new Set(blocks.map((b) => `${b.x},${b.y},${b.z}`));
  const n = blocks.length;

  const counts = {};
  for (const b of blocks) counts[b.block] = (counts[b.block] || 0) + 1;
  const glass = Object.entries(counts)
    .filter(([name]) => /glass/.test(name))
    .reduce((s, [, c]) => s + c, 0);

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const b of blocks) {
    minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x);
    minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y);
    minZ = Math.min(minZ, b.z); maxZ = Math.max(maxZ, b.z);
  }

  // Connected components (6-adjacency).
  const seen = new Set();
  const components = [];
  for (const b of blocks) {
    const start = `${b.x},${b.y},${b.z}`;
    if (seen.has(start)) continue;
    let size = 0;
    const queue = [b];
    seen.add(start);
    while (queue.length) {
      const cur = queue.pop();
      size++;
      for (const [dx, dy, dz] of NEIGHBORS) {
        const nk = `${cur.x + dx},${cur.y + dy},${cur.z + dz}`;
        if (set.has(nk) && !seen.has(nk)) {
          seen.add(nk);
          queue.push({ x: cur.x + dx, y: cur.y + dy, z: cur.z + dz });
        }
      }
    }
    components.push(size);
  }
  components.sort((a, b) => b - a);
  const biggest = components[0] || 0;

  // Floating blocks: any block not reachable (6-adjacency) from a y=0 block.
  const reach = new Set(blocks.filter((b) => b.y === 0).map((b) => `${b.x},${b.y},${b.z}`));
  const stack = [...reach];
  while (stack.length) {
    const key = stack.pop();
    const [x, y, z] = key.split(',').map(Number);
    for (const [dx, dy, dz] of NEIGHBORS) {
      const nk = `${x + dx},${y + dy},${z + dz}`;
      if (set.has(nk) && !reach.has(nk)) {
        reach.add(nk);
        stack.push(nk);
      }
    }
  }
  const floating = n - reach.size;

  // Door: an outer-perimeter column counts as a door when BOTH y=1 and y=2
  // are empty (a 2-tall opening = door height), or when y=1 holds an actual
  // door block (bottom half; Paper/MC spawns the top half automatically).
  const cell = {};
  for (const b of blocks) cell[`${b.x},${b.y},${b.z}`] = b.block;
  const isDoorBlock = (x, z) => /door/.test(cell[`${x},1,${z}`] || '');
  const isGap = (x, z) => !cell[`${x},1,${z}`] && !cell[`${x},2,${z}`];
  let hasDoor = false;
  for (let x = minX; x <= maxX && !hasDoor; x++) {
    hasDoor = isDoorBlock(x, minZ) || isGap(x, minZ) || isDoorBlock(x, maxZ) || isGap(x, maxZ);
  }
  for (let z = minZ; z <= maxZ && !hasDoor; z++) {
    hasDoor = isDoorBlock(minX, z) || isGap(minX, z) || isDoorBlock(maxX, z) || isGap(maxX, z);
  }

  return { counts, glass, n, minX, maxX, minY, maxY, minZ, maxZ, biggest, floating, hasDoor };
}

function isBuildingLike(name) {
  return /house|home|cottage|cabin|hut|base|shed|shack|villa|shop|tavern|tower|keep|castle|church|barn|stable|station|windmill|ossuary/.test(
    String(name).toLowerCase()
  );
}

function validateStructure(blocks, name = '') {
  if (!Array.isArray(blocks) || blocks.length === 0) return false;
  const a = analyzeStructure(blocks);

  if (a.n < 4 || a.n > MAX_BLOCKS) return false;
  if (a.glass / a.n > 0.4) return false;
  if (a.maxX - a.minX > 16 || a.maxZ - a.minZ > 16 || a.maxY - a.minY > 12) return false;
  if (a.n > 6 && a.floating / a.n > 0.2) return false;
  if (a.n > 10 && a.biggest / a.n < 0.8) return false;
  if (a.n > 12 && a.maxY >= 3 && isBuildingLike(name) && !a.hasDoor) return false;

  return true;
}

function buildSet(blocks) {
  const set = new Set();
  for (const b of blocks) set.add(`${b.x},${b.y},${b.z}`);
  return set;
}

function materialCounts(blocks) {
  const counts = {};
  for (const b of blocks) counts[b.block] = (counts[b.block] || 0) + 1;
  return counts;
}

function dominantMaterial(blocks) {
  const counts = materialCounts(blocks);
  return (
    Object.keys(counts)
      .filter((k) => k !== 'air' && k !== 'water' && !/glass/.test(k))
      .sort((a, b) => counts[b] - counts[a])[0] || 'stone'
  );
}

function computeBounds(blocks) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const b of blocks) {
    minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x);
    minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y);
    minZ = Math.min(minZ, b.z); maxZ = Math.max(maxZ, b.z);
  }
  return { minX, maxX, minY, maxY, minZ, maxZ };
}

// True if the outer perimeter has a column where y1 and y2 are both empty
// (a 2-tall opening = a real door). The ground row y=0 may be a solid slab.
function hasDoorGap(blocks, set) {
  const { minX, maxX, minZ, maxZ } = computeBounds(blocks);
  for (let x = minX; x <= maxX; x++) {
    if ((!set.has(`${x},1,${minZ}`) && !set.has(`${x},2,${minZ}`)) ||
        (!set.has(`${x},1,${maxZ}`) && !set.has(`${x},2,${maxZ}`))) return true;
  }
  for (let z = minZ; z <= maxZ; z++) {
    if ((!set.has(`${minX},1,${z}`) && !set.has(`${minX},2,${z}`)) ||
        (!set.has(`${maxX},1,${z}`) && !set.has(`${maxX},2,${z}`))) return true;
  }
  return false;
}

// Carve a 1x2 door opening in the front face (z = maxZ), next to floor blocks.
function carveDoor(blocks, set) {
  const { minX, maxX, maxZ } = computeBounds(blocks);
  const candidates = [];
  for (let x = minX; x <= maxX; x++) {
    const hasFloor = set.has(`${x},0,${maxZ}`);
    const hasWall = set.has(`${x},1,${maxZ}`) || set.has(`${x},2,${maxZ}`);
    if (hasFloor && hasWall) candidates.push(x);
  }
  const doorX = candidates.length
    ? candidates[Math.floor(candidates.length / 2)]
    : Math.floor((minX + maxX) / 2);
  return blocks.filter((b) => !(b.x === doorX && b.z === maxZ && (b.y === 1 || b.y === 2)));
}

// Add a pyramid roof above the current top layer, with a 1-block overhang
// (eaves stick out past the walls all around, like a real cottage).
function addPyramidRoof(blocks, main) {
  const { minX, maxX, minZ, maxZ, maxY } = computeBounds(blocks);
  const out = blocks.map((b) => ({ ...b }));
  const set = buildSet(out);
  let y = maxY + 1;
  for (let inset = 0; ; inset++) {
    const fromX = minX - 1 + inset;
    const toX = maxX + 1 - inset;
    const fromZ = minZ - 1 + inset;
    const toZ = maxZ + 1 - inset;
    if (fromX > toX || fromZ > toZ) break;
    for (let x = fromX; x <= toX; x++) {
      for (let z = fromZ; z <= toZ; z++) {
        const key = `${x},${y},${z}`;
        if (!set.has(key)) {
          out.push({ x, y, z, block: main });
          set.add(key);
        }
      }
    }
    y++;
  }
  return out;
}

// Gable roof: ridge along the X axis, solid triangular cross-section, 1-block
// eave overhang on both sloped sides only. Looks like a classic two-slope roof.
function addGableRoof(blocks, main, fx0, fx1, fz0, fz1) {
  const out = blocks.map((b) => ({ ...b }));
  const depth = fz1 - fz0 + 1;
  const steps = Math.max(2, Math.ceil((depth + 2) / 2));
  for (let i = 0; i < steps; i++) {
    const y = 4 + i;
    const zLo = fz0 - 1 + i;
    const zHi = fz1 + 1 - i;
    for (let x = fx0; x <= fx1; x++) {
      for (let z = zLo; z <= zHi; z++) {
        out.push({ x, y, z, block: main });
      }
    }
  }
  return out;
}

// Flat roof: a single slab with a 1-block overhang all around (modern look).
function addFlatRoof(blocks, main, fx0, fx1, fz0, fz1) {
  const out = blocks.map((b) => ({ ...b }));
  for (let x = fx0 - 1; x <= fx1 + 1; x++) {
    for (let z = fz0 - 1; z <= fz1 + 1; z++) {
      out.push({ x, y: 4, z, block: main });
    }
  }
  return out;
}

// Deterministic per-name seed so the SAME description always builds the same
// variant (retries are consistent) while different descriptions vary.
function nameSeed(name) {
  let h = 0;
  for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h >>> 0;
}

function roofKindFor(name) {
  return ['pyramid', 'gable', 'flat'][nameSeed(name) % 3];
}

// Remove blocks not connected (by a support chain) to the ground row y=0.
function pruneFloating(blocks) {
  for (let pass = 0; pass < 8; pass++) {
    const set = buildSet(blocks);
    const reach = new Set(blocks.filter((b) => b.y === 0).map((b) => `${b.x},${b.y},${b.z}`));
    const stack = [...reach];
    while (stack.length) {
      const key = stack.pop();
      const [x, y, z] = key.split(',').map(Number);
      for (const [dx, dy, dz] of NEIGHBORS) {
        const nk = `${x + dx},${y + dy},${z + dz}`;
        if (set.has(nk) && !reach.has(nk)) {
          reach.add(nk);
          stack.push(nk);
        }
      }
    }
    const kept = blocks.filter((b) => reach.has(`${b.x},${b.y},${b.z}`));
    if (kept.length === blocks.length) break;
    blocks = kept;
  }
  return blocks;
}

function isHouseLike(name) {
  return /house|home|cottage|cabin|hut|shed|shack|villa|shop|tavern|barn|stable|church/.test(
    String(name).toLowerCase()
  );
}

// Rebuild a canonical cottage from the model's floor footprint + materials:
// solid floor with log corners, plank walls, centred door + mirrored glass
// windows, pyramid roof with overhanging eave, cobblestone doorstep and
// interior furniture. Deterministic, so every house looks like a real build.
function rebuildHouse(blocks, name) {
  const floor = blocks.filter((b) => b.y === 0);
  if (!floor.length) return blocks;
  let fx0 = Infinity, fx1 = -Infinity, fz0 = Infinity, fz1 = -Infinity;
  for (const b of floor) {
    fx0 = Math.min(fx0, b.x);
    fx1 = Math.max(fx1, b.x);
    fz0 = Math.min(fz0, b.z);
    fz1 = Math.max(fz1, b.z);
  }
  const w = fx1 - fx0 + 1;
  const d = fz1 - fz0 + 1;
  if (w < 3 || d < 3 || w > 9 || d > 9 || w * d > 49) return blocks;

  const main = dominantMaterial(blocks);
  const corner = /planks|log/.test(main) ? 'oak_log' : main;
  const H = 3;
  const doorX = Math.round((fx0 + fx1) / 2);
  const out = [];

  // Name-seeded variant so rooms differ between descriptions but stay
  // reproducible for the same one: roof style, mirrored interior, chimney.
  const seed = nameSeed(name);
  const roofKind = roofKindFor(name);
  const mirror = Boolean((seed >> 3) & 1);
  const chimney = roofKind === 'pyramid' && Boolean((seed >> 5) & 1);

  // Solid floor (log corners).
  for (let x = fx0; x <= fx1; x++) {
    for (let z = fz0; z <= fz1; z++) {
      const isCorner = (x === fx0 || x === fx1) && (z === fz0 || z === fz1);
      out.push({ x, y: 0, z, block: isCorner ? corner : main });
    }
  }

  // Walls with a centred door and mirrored windows on the front face (z=fz1).
  for (let y = 1; y <= H; y++) {
    for (let x = fx0; x <= fx1; x++) {
      for (let z = fz0; z <= fz1; z++) {
        if (x > fx0 && x < fx1 && z > fz0 && z < fz1) continue;
        if (z === fz1 && x === doorX && y <= 2) continue;
        if (z !== fz0 && z !== fz1 && x !== fx0 && x !== fx1) continue;
        const isCorner = (x === fx0 || x === fx1) && (z === fz0 || z === fz1);
        let block = isCorner ? corner : main;
        if (z === fz1 && (x === doorX - 1 || x === doorX + 1) && y === 2 && !isCorner) {
          block = 'glass';
        }
        out.push({ x, y, z, block });
      }
    }
  }

  // Roof over the footprint: pyramid (with 1-block eave) / gable / flat slab.
  let rebuilt;
  if (roofKind === 'gable') rebuilt = addGableRoof(out, main, fx0, fx1, fz0, fz1);
  else if (roofKind === 'flat') rebuilt = addFlatRoof(out, main, fx0, fx1, fz0, fz1);
  else rebuilt = addPyramidRoof(out, main);

  // Chimney: a cobblestone column rising through the roof at the far back
  // corner (visible poke-through, always connected to the wall below).
  if (chimney) {
    const cx = (doorX - fx0) >= (fx1 - doorX) ? fx0 : fx1;
    const cz = fz0;
    const chimTop = Math.max(...rebuilt.map((b) => b.y)) + 1;
    rebuilt = rebuilt.filter((b) => !(b.x === cx && b.z === cz && b.y >= 4));
    for (let y = 4; y <= chimTop; y++) {
      rebuilt.push({ x: cx, y, z: cz, block: 'cobblestone' });
    }
  }

  // Real door block (bottom half) in the carved entrance, so visitors can open
  // a door instead of walking through a hole. Placed after walls/roof.
  rebuilt.push({ x: doorX, y: 1, z: fz1, block: 'oak_door' });

  // Cobblestone doorstep in front of the door.
  for (let dz = 1; dz <= 2; dz++) {
    rebuilt.push({ x: doorX, y: 0, z: fz1 + dz, block: 'cobblestone' });
  }

  // Interior furniture: a deliberate little room, never blocking the door —
  // bed against the back wall (2-wide), chest in the back corner, furnace and
  // crafting table in the front corners, bookshelf along the back if it fits.
  const ifx0 = fx0 + 1;
  const ifx1 = fx1 - 1;
  const ifz0 = fz0 + 1;
  const ifz1 = fz1 - 1;
  const used = new Set();
  const addFurniture = (x, z, block) => {
    if (mirror) x = ifx0 + ifx1 - x; // flip the whole room left-right
    if (x < ifx0 || x > ifx1 || z < ifz0 || z > ifz1) return false;
    const key = `${x},${z}`;
    if (used.has(key)) return false;
    used.add(key);
    rebuilt.push({ x, y: 1, z, block });
    return true;
  };

  // Bed: a 2-wide block along the back wall (or vertical in a narrow room),
  // centered-ish on the back middle.
  const back = ifz0;
  const front = ifz1;
  const bedX = Math.max(ifx0, Math.round((ifx0 + ifx1) / 2) - 1);
  if (ifx1 - ifx0 >= 2) {
    addFurniture(bedX, back, 'red_bed');
    addFurniture(bedX + 1, back, 'red_bed');
  } else if (ifx1 === ifx0) {
    addFurniture(ifx0, back, 'red_bed');
    addFurniture(ifx0, Math.min(back + 1, front), 'red_bed');
  } else {
    addFurniture(bedX, back, 'red_bed');
  }
  // Chest in the back corner opposite the bed's start.
  addFurniture(ifx1, back, 'chest');
  // Furnace and crafting table in the front corners (furthest from the door).
  addFurniture(ifx0, front, 'furnace');
  addFurniture(ifx1, front, 'crafting_table');
  // Bookshelf on the back wall if the room is wide enough.
  if (ifx1 - ifx0 >= 4) {
    addFurniture(Math.round((ifx0 + ifx1) / 2), back, 'bookshelf');
  }

  return rebuilt;
}

// Deterministic finish pass, run on EVERY generated structure:
//  - cap glass blocks to 2
//  - guarantee a solid floor (no holes at y=0) for buildings
//  - houses: rebuild a canonical cottage (door, windows, roof, step, furniture)
//  - other buildings: keep the model's shape, just ensure a door
//  - drop floating blocks
// Returns finalized blocks that pass validateStructure, or null if hopeless.
function repairStructure(blocks, name) {
  if (!Array.isArray(blocks) || blocks.length < 4) return null;
  const originalValid = validateStructure(blocks, name);

  let bs = blocks.map((b) => ({ ...b }));
  const glassIdx = bs.map((b, i) => i).filter((i) => /glass/.test(bs[i].block));
  if (glassIdx.length > 2) {
    const main = dominantMaterial(bs);
    for (const i of glassIdx.slice(2)) bs[i] = { ...bs[i], block: main };
  }

  const building = isBuildingLike(name);
  const house = isHouseLike(name);

  if (building) {
    const main = dominantMaterial(bs);
    const set = buildSet(bs);
    const { minX, maxX, minZ, maxZ } = computeBounds(bs);

    // Solid floor: fill any missing y=0 cell so there are no floor holes.
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        const key = `${x},0,${z}`;
        if (!set.has(key)) {
          bs.push({ x, y: 0, z, block: main });
          set.add(key);
        }
      }
    }

    if (house) {
      // Deterministic canonical cottage (floor, door, windows, roof, step, furniture).
      bs = rebuildHouse(bs, name);
    } else if (!hasDoorGap(bs, set)) {
      // Non-house buildings (towers, etc): keep the model shape, add a door.
      bs = carveDoor(bs, set);
    }
  }

  bs = pruneFloating(bs);

  if (validateStructure(bs, name)) {
    logger.info(`[schematic] finalized structure: ${bs.length} blocks (${glassIdx.length} glass capped, door+floor ensured)`);
    return bs;
  }
  if (originalValid) {
    logger.info(`[schematic] kept original structure (${blocks.length} blocks); enrichments skipped`);
    return blocks;
  }
  return null;
}

async function generateSchematic(description, context = {}) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Build request: "${description}"
Available info: ${JSON.stringify({
        inventory: (context.inventory || []).slice(0, 10),
        nearbyBlocks: (context.nearbyBlocks || []).length,
      }, null, 2)}`,
    },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await router.ask(messages, {
        tier: 'complex',
        jsonMode: true,
        temperature: 0.3,
        maxTokens: 4000,
        model: config.building.schematicModel,
      });
      const parsed = extractJson(raw);

      if (!parsed || !Array.isArray(parsed.blocks)) {
        throw new Error('Schematic generator did not return a valid blocks array.');
      }

      const rawBlocks = parsed.blocks.filter(
        (b) =>
          b &&
          Number.isInteger(b.x) &&
          Number.isInteger(b.y) &&
          Number.isInteger(b.z) &&
          typeof b.block === 'string' &&
          b.block.toLowerCase() !== 'air'
      );

      if (rawBlocks.length === 0) {
        throw new Error('Schematic generator returned an empty structure.');
      }

      const blocks = normalizeStructure(rawBlocks).slice(0, config.building.maxBlocks || MAX_BLOCKS);
      const name = parsed.name || 'structure';

      const final = repairStructure(blocks, name);
      if (final) {
        return { name, blocks: final };
      }
      logger.warn('[schematic] generated structure could not be finalized, retrying...');
    } catch (err) {
      logger.warn('[schematic] failed to generate:', err.message);
      return null;
    }
  }

  logger.warn('[schematic] gave up after 2 attempts (structure kept failing validation).');
  return null;
}

module.exports = { generateSchematic, validateStructure, normalizeStructure, analyzeStructure, repairStructure, roofKindFor, nameSeed };