const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeStructure, validateStructure, repairStructure, analyzeStructure, roofKindFor } = require('../src/ai/schematic-generator');

// Builds a 5x5x5 sealed wooden house (no door, like gpt-5.4-mini produces).
function sealedHouse() {
  const blocks = [];
  for (let y = 0; y <= 5; y++) {
    for (let x = 0; x <= 4; x++) {
      for (let z = 0; z <= 4; z++) {
        if (y === 0 || y === 5) blocks.push({ x, y, z, block: 'oak_planks' });
        else if (x === 0 || x === 4 || z === 0 || z === 4) blocks.push({ x, y, z, block: 'oak_planks' });
      }
    }
  }
  return blocks;
}

test('sealed cube house is rejected (no door)', () => {
  const blocks = normalizeStructure(sealedHouse());
  assert.equal(validateStructure(blocks, 'small_wooden_house'), false);
});

test('repairStructure carves a door so the house passes validation', () => {
  const blocks = normalizeStructure(sealedHouse());
  const repaired = repairStructure(blocks, 'small_wooden_house');
  assert.ok(repaired, 'repair should succeed');
  const a = analyzeStructure(repaired);
  assert.equal(a.hasDoor, true, 'repaired house must have a door gap');
  assert.equal(validateStructure(repaired, 'small_wooden_house'), true);
});

test('repairStructure caps glass blocks to 2', () => {
  const blocks = [];
  for (let i = 0; i < 10; i++) blocks.push({ x: i % 3, y: 0, z: Math.floor(i / 3), block: 'glass' });
  const repaired = repairStructure(normalizeStructure(blocks), 'glass_wall');
  const glass = (repaired || []).filter((b) => /glass/.test(b.block)).length;
  assert.ok(glass <= 2, `expected <=2 glass, got ${glass}`);
});

// 5x5 floor + 3-tall wall ring, no roof, no door.
function rooflessHouse() {
  const blocks = [];
  for (let y = 0; y <= 3; y++) {
    for (let x = 0; x <= 4; x++) {
      for (let z = 0; z <= 4; z++) {
        if (y === 0) blocks.push({ x, y, z, block: 'oak_planks' });
        else if (x === 0 || x === 4 || z === 0 || z === 4) blocks.push({ x, y, z, block: 'oak_planks' });
      }
    }
  }
  return blocks;
}

test('repairStructure fills floor holes, adds a pyramid roof and furniture', () => {
  const bs = normalizeStructure(rooflessHouse());
  // bore a hole in the floor and pre-cut a door gap
  const holed = bs.filter((b) => !(b.x === 2 && b.y === 0 && b.z === 2));
  const gapped = holed.filter((b) => !(b.x === 2 && b.z === 4 && (b.y === 1 || b.y === 2)));
  const repaired = repairStructure(gapped, 'small_wooden_house');
  assert.ok(repaired, 'repair should succeed');

  const floor = repaired.filter((b) => b.y === 0);
  assert.ok(floor.length >= 25, `floor must be refilled (got ${floor.length})`);
  // every footprint cell of the floor must exist (no holes)
  for (let x = 0; x <= 4; x++) {
    for (let z = 0; z <= 4; z++) {
      assert.ok(repaired.some((b) => b.x === x && b.y === 0 && b.z === z), `floor hole at (${x},0,${z})`);
    }
  }
  // pyramid roof with overhang eave
  const cap = repaired.find((b) => b.x === 2 && b.z === 2 && b.y >= 5);
  assert.ok(cap, 'pyramid roof tip must exist');
  assert.ok(repaired.some((b) => b.z === -1 && b.y === 4), 'roof must overhang (eave) past the walls');
  // mirrored glass windows flanking the door
  assert.ok(repaired.some((b) => b.x === 1 && b.y === 2 && b.z === 4 && b.block === 'glass'), 'left window');
  assert.ok(repaired.some((b) => b.x === 3 && b.y === 2 && b.z === 4 && b.block === 'glass'), 'right window');
  // furniture inside
  assert.ok(repaired.some((b) => b.block === 'crafting_table'), 'crafting_table furniture');
  assert.ok(repaired.some((b) => b.block === 'furnace'), 'furnace furniture');
  assert.ok(repaired.some((b) => b.block === 'bookshelf') || repaired.some((b) => b.block === 'chest'), 'storage furniture');
  // doorstep in front of the door
  assert.ok(repaired.some((b) => b.y === 0 && b.z >= 5 && b.block === 'cobblestone'), 'front step');
  assert.equal(validateStructure(repaired, 'small_wooden_house'), true);
  assert.equal(analyzeStructure(repaired).hasDoor, true);
});

test('repairStructure varies the design by name (roof style), always with door + bed', () => {
  const names = ['modern villa', 'stone barn', 'a small wooden cabin', 'red brick cottage', 'tiny fishing hut', 'a cozy shack'];
  const roofs = names.map((n) => roofKindFor(n));
  assert.ok(new Set(roofs).size >= 2, `expected roof variance, got ${[...new Set(roofs)]}`);

  const houses = names.map((n) => repairStructure(normalizeStructure(rooflessHouse()), n));
  for (let i = 0; i < names.length; i++) {
    assert.ok(houses[i], `${names[i]} repair should succeed`);
    assert.equal(validateStructure(houses[i], names[i]), true, `${names[i]} should validate`);
    assert.ok(houses[i].some((b) => b.block === 'red_bed'), `${names[i]} must have a bed`);
    assert.ok(houses[i].some((b) => b.block === 'oak_door'), `${names[i]} must have a door`);
  }
});

test('every rebuilt house variant is placeable (support chain, no floating)', () => {
  for (const n of ['modern villa', 'stone barn', 'tiny fishing hut']) {
    const repaired = repairStructure(normalizeStructure(rooflessHouse()), n);
    assert.ok(repaired, `${n}: repair succeeds`);
    const placed = new Set();
    let pend = [...repaired];
    let progressed = true;
    while (pend.length && progressed) {
      progressed = false;
      const still = [];
      for (const b of pend) {
        const key = `${b.x},${b.y},${b.z}`;
        const belowAvail = b.y === 0 || placed.has(`${b.x},${b.y - 1},${b.z}`);
        const lateral = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) =>
          placed.has(`${b.x + dx},${b.y},${b.z + dz}`)
        );
        if (belowAvail || lateral) {
          placed.add(key);
          progressed = true;
        } else {
          still.push(b);
        }
      }
      if (!progressed) {
        assert.deepEqual(still, [], `${n}: unreachable blocks ${still.map((s) => `${s.x},${s.y},${s.z}`)}`);
      }
      pend = still;
    }
    assert.equal(placed.size, repaired.length, `${n}: all ${repaired.length} blocks placeable`);
  }
});