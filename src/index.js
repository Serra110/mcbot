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
  logger.error('Falha ao iniciar o bot:', err.message || err);
  logger.error('Verifica se o servidor Minecraft esta a correr e se MC_HOST/MC_PORT estao corretos.');
  process.exit(1);
}

bot.once('spawn', () => {
  combat.enableAutoDefense(bot);

  const status = budget.getStatus();
  logger.info(
    `Orcamento API paga: ${status.spentEur}€ / ${status.limitEur}€ usados este mes (${status.percentUsed}%)`
  );
});

bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  if (message.trim() === '!orcamento') {
    const s = budget.getStatus();
    bot.chat(`Orcamento: ${s.spentEur}€/${s.limitEur}€ (${s.percentUsed}%) usados em ${s.month}.`);
    return;
  }

  if (message.trim() === '!lembra') {
    const facts = memory.recallAllAsText(username);
    bot.chat(facts ? `O que sei sobre ti:\n${facts}` : 'Ainda nao sei nada sobre ti.');
    return;
  }

  try {
    let command = tryFastPath(message);

    if (!command) {
      command = await nlu.parseIntent(message, username);
    }

    logger.info(`[chat] ${username}: "${message}" -> comando:`, command);
    await commandRegistry.execute(bot, command, { username });
  } catch (err) {
    logger.error('Erro ao processar mensagem de chat:', err);
    bot.chat('Ocorreu um erro ao processar isso, desculpa.');
  }
});

process.on('SIGINT', () => {
  logger.info('A encerrar o bot...');
  bot.quit();
  process.exit(0);
});
