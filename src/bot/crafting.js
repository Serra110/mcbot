const logger = require('../utils/logger');


async function craftItem(bot, itemName, amount = 1) {
  const mcData = require('minecraft-data')(bot.version);
  const itemInfo = mcData.itemsByName[itemName];

  if (!itemInfo) {
    bot.chat(`I don't know an item called "${itemName}".`);
    return;
  }

  
  const craftingTableBlock = bot.findBlock({
    matching: mcData.blocksByName.crafting_table?.id,
    maxDistance: 32,
  });

  const recipes = bot.recipesFor(itemInfo.id, null, 1, craftingTableBlock);

  if (!recipes || recipes.length === 0) {
    bot.chat(`I don't have the materials/crafting table needed to make ${itemName}.`);
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
    bot.chat(`Crafted ${amount}x ${itemName}.`);
  } catch (err) {
    logger.warn('[crafting] error crafting:', err.message);
    bot.chat(`Failed to craft ${itemName}: ${err.message}`);
  }
}

module.exports = { craftItem };
