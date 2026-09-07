const { goals } = require('mineflayer-pathfinder');
const logger = require('../utils/logger');

function pickBestToolForBlock(bot, blockName) {
  const lowered = String(blockName || '').toLowerCase();
  const isWood = /log|wood|planks|leaves|sapling|stripped_.*log/.test(lowered);
  const isDirt = /dirt|grass|sand|gravel|clay/.test(lowered);
  const isStone = /stone|cobblestone|andesite|granite|diorite|sandstone|basalt|ore|deepslate|brick|terracotta|quartz/.test(lowered);

  const candidates = isWood
    ? ['diamond_axe', 'iron_axe', 'stone_axe', 'wooden_axe']
    : isDirt
      ? ['diamond_shovel', 'iron_shovel', 'stone_shovel', 'wooden_shovel']
      : isStone
        ? ['diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe']
        : ['diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe'];

  const tool = bot.inventory.items().find((slot) => candidates.includes(slot.name));
  return tool || null;
}

async function mineBlock(bot, blockName, amount = 1) {
  let mined = 0;

  const mcData = require('minecraft-data')(bot.version);
  const blockInfo = mcData.blocksByName[blockName];
  if (!blockInfo) {
    bot.chat(`I don't know a block called "${blockName}".`);
    return;
  }

  bot.chat(`Looking for ${amount}x ${blockName}...`);

  for (let i = 0; i < amount; i++) {
    const block = bot.findBlock({
      matching: blockInfo.id,
      maxDistance: 64,
    });

    if (!block) {
      bot.chat(`No more ${blockName} nearby (mined ${mined}/${amount}).`);
      break;
    }

    try {
      const preferredTool = pickBestToolForBlock(bot, blockName);
      if (preferredTool) {
        await bot.equip(preferredTool, 'hand');
      }

      const goal = new goals.GoalGetToBlock(block.position.x, block.position.y, block.position.z);
      await bot.pathfinder.goto(goal);
      await bot.dig(block);
      mined++;
      logger.debug(`[mining] mined ${mined}/${amount} ${blockName}`);
    } catch (err) {
      logger.warn('[mining] error mining block:', err.message);
      break;
    }
  }

  bot.chat(`Done: mined ${mined}x ${blockName}.`);
}

module.exports = { mineBlock };
