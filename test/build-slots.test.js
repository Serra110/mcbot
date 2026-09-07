const test = require('node:test');
const assert = require('node:assert/strict');
const { Vec3 } = require('vec3');
const { buildBlocks } = require('../src/bot/blueprints');

function makeBot(version = '1.21.1') {
  const bot = {
    version,
    registry: require('minecraft-data')(version),
    entity: { position: new Vec3(10, 64, 10) },
    game: { gameMode: 'creative' },
    chat: () => {},
    pathfinder: null,
    quickBarSlot: 0,
    inventory: {
      slots: [],
      items: () => [],
    },
    creative: {
      setInventorySlot: async (slot, item) => {
        bot._setSlotCalls.push([slot, item ? item.name : null]);
        bot._fakeSlots[slot] = item;
      },
      clearInventory: async () => {
        bot._fakeSlots = {};
      },
    },
    _setSlotCalls: [],
    _fakeSlots: [],
    placed: [],
  };

  Object.defineProperty(bot, 'heldItem', {
    get: function () {
      return bot.inventory.slots[36 + bot.quickBarSlot];
    },
  });

  bot.setQuickBarSlot = (slot) => {
    bot.quickBarSlot = slot;
  };

  // Mirror mineflayer simple_inventory.equip behaviour for hotbar items:
  // it selects the hotbar slot the item lives in.
  bot.equip = async (item, dest) => {
    const sourceSlot = item.slot;
    const destSlot = 36 + bot.quickBarSlot;
    if (sourceSlot === destSlot) return;
    if (sourceSlot >= 36 && sourceSlot < 45) {
      bot.setQuickBarSlot(sourceSlot - 36);
      return;
    }
    throw new Error('item not in hotbar');
  };

  // Flat world: ground everywhere at y=63, air above.
  bot.blockAt = (vec) => {
    if (vec.y === 63) return { position: vec, type: 1, name: 'grass_block' };
    return { position: vec, type: 0, name: 'air' };
  };

  bot.placeBlock = async () => {
    bot.placed.push(bot.heldItem ? bot.heldItem.name : null);
  };

  return bot;
}

test('buildBlocks assigns each material its own hotbar slot and places the right block', async () => {
  const bot = makeBot();
  const blocks = [
    { x: 0, y: 0, z: 0, block: 'oak_planks' },
    { x: 1, y: 0, z: 0, block: 'glass' },
    { x: 2, y: 0, z: 0, block: 'oak_planks' },
    { x: 3, y: 0, z: 0, block: 'stone' },
    { x: 4, y: 0, z: 0, block: 'glass' },
    { x: 5, y: 0, z: 0, block: 'oak_planks' },
  ];

  const result = await buildBlocks(bot, blocks, { name: 'test house' });

  assert.equal(result, true);
  // One set_creative_slot per distinct material, each in a different slot.
  const setCalls = bot._setSlotCalls.filter(([slot]) => slot >= 36 && slot <= 44);
  assert.equal(setCalls.length, 3, '3 materials => 3 creative-slot writes');
  const slots = new Set(setCalls.map(([slot]) => slot));
  assert.equal(slots.size, 3, 'each material uses a distinct hotbar slot');
  const names = setCalls.map(([, name]) => name).sort();
  assert.deepEqual(names, ['glass', 'oak_planks', 'stone']);

  // Everything placed must carry the item the structure asked for: no glass
  // sneaking into oak_planks placements. Order is bottom-up, each cell as soon
  // as it has support (ground/lateral), so a flat ground row stays in input order.
  const expected = ['oak_planks', 'glass', 'oak_planks', 'stone', 'glass', 'oak_planks'];
  assert.deepEqual(bot.placed, expected);
});

test('buildBlocks places 100% glass structure when only glass is needed', async () => {
  const bot = makeBot();
  const blocks = Array.from({ length: 5 }, (_, i) => ({ x: i, y: 0, z: 0, block: 'glass' }));
  const result = await buildBlocks(bot, blocks, { name: 'glass test' });
  assert.equal(result, true);
  assert.deepEqual(bot.placed, ['glass', 'glass', 'glass', 'glass', 'glass']);
});