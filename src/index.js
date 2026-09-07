const { createBot } = require('./bot/connection');
const { tryFastPath } = require('./commands/command-parser');
const commandRegistry = require('./commands/command-registry');
const nlu = require('./ai/nlu');
const memory = require('./ai/memory');
const combat = require('./bot/combat');
const budget = require('./ai/budget-tracker');
const buildSession = require('./bot/build-session');
const logger = require('./utils/logger');

let bot;
try {
  bot = createBot();
} catch (err) {
  logger.error('Failed to start bot:', err.message || err);
  logger.error('Check that the Minecraft server is running and the env file is correct');
  process.exit(1);
}

bot.once('spawn', () => {
  combat.enableAutoDefense(bot);

  const status = budget.getStatus();
  logger.info(
    `Paid API budget: ${status.spentEur}€ / ${status.limitEur}€ spent this month (${status.percentUsed}%)`
  );
  const config = require('../config/config');
  logger.info(
    `[build] LLM schematics: ${config.building.schematicEnabled ? 'ENABLED' : 'disabled'}` +
      ` | model: ${config.building.schematicModel}` +
      ` | hackclub: ${config.ai.hackclub.enabled ? 'on' : 'off'}`
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
    bot.chat(facts ? `What I know about you:\n${facts}` : "I dont know anything about you yet.");
    return;
  }   
  
  // If a build is awaiting materials, react to the player's message.
  if (buildSession.hasPending()) {
    logger.info(`[chat] pending build session active; message "${message}" handled as session input.`);
    const t = message.trim().toLowerCase();
    if (/^(cancel|cancelar|para\b|stop|abort)/.test(t)) {
      buildSession.clearPending();
      bot.chat('Cancelled the pending build.');
      return;
    }
    if (/^(continue|go|build|comeca|constroi|construir|construi|sim|yes|ok|vai)/.test(t)) {
      await commandRegistry.resumeBuild(bot);
      return;
    }
    await commandRegistry.reportBuildProgress(bot);
    return;
  }

  try {
    let command = tryFastPath(message);

    if (!command) {
      command = await nlu.parseIntent(message, username, bot);
    }
 
    logger.info(`[chat] ${username}: "${message}" -> command:`, command);
    await commandRegistry.execute(bot, command, { username });
  } catch (err) {
    logger.error('Error processing chat message:', err);
    bot.chat('Something went wrong processing that, mb.');
  }
});

process.on('SIGINT', () => {
  logger.info('Shutting down bot...');
  bot.quit();
  process.exit(0);
});
