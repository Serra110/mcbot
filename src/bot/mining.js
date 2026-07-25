const { goals } = require('mineflayer-pathfinder');
const logger = require('../utils/logger');


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
