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
    logger.info(`Bot "${config.minecraft.username}" joined server ${config.minecraft.host}:${config.minecraft.port}`);
    bot.chat('Bot online! Write something here');
  });

  bot.on('kicked', (reason) => logger.error('Bot kicked from server:', reason));
  bot.on('error', (err) => {
    if (err && err.code === 'ECONNREFUSED') {
      logger.error(
        'Connection error: could not connect to Minecraft server. Check that the server is running at',
        config.minecraft.host + ':' + config.minecraft.port
      );
    } else {
      logger.error('Connection error:', err.message || err);
    }
  });
  bot.on('end', () => logger.warn('Connection to server ended.'));

  return bot;
}

module.exports = { createBot };
