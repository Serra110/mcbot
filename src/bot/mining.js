const { goals } = require('mineflayer-pathfinder');
const logger = require('../utils/logger');


async function mineBlock(bot, blockName, amount = 1) {
  let mined = 0;

  const mcData = require('minecraft-data')(bot.version);
  const blockInfo = mcData.blocksByName[blockName];
  if (!blockInfo) {
    bot.chat(`Nao conheco um bloco chamado "${blockName}".`);
    return;
  }

  bot.chat(`A procurar ${amount}x ${blockName}...`);

  for (let i = 0; i < amount; i++) {
    const block = bot.findBlock({
      matching: blockInfo.id,
      maxDistance: 64,
    });

    if (!block) {
      bot.chat(`Nao encontrei mais ${blockName} por perto (minerei ${mined}/${amount}).`);
      break;
    }

    try {
      const goal = new goals.GoalGetToBlock(block.position.x, block.position.y, block.position.z);
      await bot.pathfinder.goto(goal);
      await bot.dig(block);
      mined++;
      logger.debug(`[mining] minerado ${mined}/${amount} ${blockName}`);
    } catch (err) {
      logger.warn('[mining] erro ao minerar bloco:', err.message);
      break;
    }
  }

  bot.chat(`Terminei: minerei ${mined}x ${blockName}.`);
}

module.exports = { mineBlock };
