const { createBot } = require('./bot/connection');
const { tryFastPath } = require('./commands/command-parser');
const commandRegistry = require('./commands/command-registry');
const nlu = require('./ai/nlu');
const memory = require('./ai/memory');
const combat = require('./bot/combat');
const budget = require('./ai/budget-tracker');
const logger = require('./utils/logger');

let bot;
try {
  bot = createBot();
} catch (err) {
  logger.error('Failed to start bot:', err.message || err);
  logger.error('Check that the Minecraft server is running and MC_HOST/MC_PORT are correct.');
  process.exit(1);
}

bot.once('spawn', () => {
  combat.enableAutoDefense(bot);

  const status = budget.getStatus();
  logger.info(
    `Paid API budget: ${status.spentEur}€ / ${status.limitEur}€ spent this month (${status.percentUsed}%)`
  );
});

bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  if (message.trim() === '!budget') {
    const s = budget.getStatus();
    bot.chat(`Budget: ${s.spentEur}€/${s.limitEur}€ (${s.percentUsed}%) spent in ${s.month}.`);
    return;
  }

  if (message.trim() === '!remember') {
    const facts = memory.recallAllAsText(username);
    bot.chat(facts ? `What I know about you:\n${facts}` : "I don't know anything about you yet.");
    return;
  }

  try {
    let command = tryFastPath(message);

    if (!command) {
      command = await nlu.parseIntent(message, username);
    }

    logger.info(`[chat] ${username}: "${message}" -> command:`, command);
    await commandRegistry.execute(bot, command, { username });
  } catch (err) {
    logger.error('Error processing chat message:', err);
    bot.chat('Something went wrong processing that, sorry.');
  }
});

process.on('SIGINT', () => {
  logger.info('Shutting down bot...');
  bot.quit();
  process.exit(0);
});
