const logger = require('../utils/logger');


async function craftItem(bot, itemName, amount = 1) {
  const mcData = require('minecraft-data')(bot.version);
  const itemInfo = mcData.itemsByName[itemName];

  if (!itemInfo) {
    bot.chat(`Nao conheco um item chamado "${itemName}".`);
    return;
  }

  
  const craftingTableBlock = bot.findBlock({
    matching: mcData.blocksByName.crafting_table?.id,
    maxDistance: 32,
  });

  const recipes = bot.recipesFor(itemInfo.id, null, 1, craftingTableBlock);

  if (!recipes || recipes.length === 0) {
    bot.chat(`Nao tenho os materiais/mesa de trabalho necessarios para fazer ${itemName}.`);
    return;
  }

  try {
    if (craftingTableBlock) {
      const { goals } = require('mineflayer-pathfinder');
      await bot.pathfinder.goto(
        new goals.GoalNear(craftingTableBlock.position.x, craftingTableBlock.position.y, craftingTableBlock.position.z, 2)
      );
    }
    await bot.craft(recipes[0], amount, craftingTableBlock || null);
    bot.chat(`Fabriquei ${amount}x ${itemName}.`);
  } catch (err) {
    logger.warn('[crafting] erro ao fabricar:', err.message);
    bot.chat(`Nao consegui fabricar ${itemName}: ${err.message}`);
  }
}

module.exports = { craftItem };
