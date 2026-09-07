const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeMinecraftName, resolveBlockName, resolveItemName } = require('../src/utils/minecraft-name');

test('normalizeMinecraftName converts human names to Minecraft IDs', () => {
  assert.equal(normalizeMinecraftName('oak log'), 'oak_log');
  assert.equal(normalizeMinecraftName('Oak Log'), 'oak_log');
  assert.equal(normalizeMinecraftName('minecraft:stone'), 'stone');
  assert.equal(normalizeMinecraftName('oak_planks'), 'oak_planks');
});

test('resolveBlockName and resolveItemName handle aliases and spaces', () => {
  assert.equal(resolveBlockName('stone'), 'stone');
  assert.equal(resolveBlockName('oak log'), 'oak_log');
  assert.equal(resolveItemName('oak planks'), 'oak_planks');
  assert.equal(resolveItemName('minecraft:iron_ingot'), 'iron_ingot');
});
 