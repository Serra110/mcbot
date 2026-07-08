const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const config = require('../../config/config');
const logger = require('../utils/logger');

function createBot() {
  const bot = mineflayer.createBot({
    host: config.minecraft.host,
    port: config.minecraft.port,
    username: config.minecraft.username,
    version: config.minecraft.version,
    auth: config.minecraft.auth,
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    const movements = new Movements(bot);
    bot.pathfinder.setMovements(movements);
    logger.info(`Bot "${config.minecraft.username}" entrou no servidor ${config.minecraft.host}:${config.minecraft.port}`);
    bot.chat('Bot online! Write something here');
  });

  bot.on('kicked', (reason) => logger.error('Bot expulso do servidor:', reason));
  bot.on('error', (err) => {
    if (err && err.code === 'ECONNREFUSED') {
      logger.error(
        'Erro de conexao: nao foi possivel ligar ao servidor Minecraft. Verifica se o servidor esta a correr em',
        config.minecraft.host + ':' + config.minecraft.port
      );
    } else {
      logger.error('Erro de conexao:', err.message || err);
    }
  });
  bot.on('end', () => logger.warn('Conexao com o servidor terminada.'));

  return bot;
}

module.exports = { createBot };
