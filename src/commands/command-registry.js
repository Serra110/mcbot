const movement = require('../bot/movement');
const mining = require('../bot/mining');
const crafting = require('../bot/crafting');
const planner = require('../ai/planner');
const logger = require('../utils/logger');

let currentStatus = 'Parado, a espera de comandos.';

function getStatus() {
  return currentStatus;
}

function setStatus(text) {
  currentStatus = text;
}


async function execute(bot, command, meta = {}) {
  switch (command.action) {
    case 'stop':
      setStatus('Parado.');
      movement.stop(bot);
      break;

    case 'status':
      bot.chat(`Status: ${currentStatus}`);
      break;

    case 'follow':
      setStatus(`A seguir ${command.target || 'jogador mais proximo'}.`);
      movement.followPlayer(bot, command.target);
      break;

    case 'goto':
      setStatus(`A ir para (${command.x}, ${command.y}, ${command.z}).`);
      await movement.goTo(bot, command.x, command.y, command.z);
      setStatus('Parado, a espera de comandos.');
      break;

    case 'mine':
      setStatus(`A minerar ${command.block} (${command.amount}x).`);
      await mining.mineBlock(bot, command.block, command.amount || 1);
      setStatus('Parado, a espera de comandos.');
      break;

    case 'craft':
      setStatus(`A fabricar ${command.item} (${command.amount}x).`);
      await crafting.craftItem(bot, command.item, command.amount || 1);
      setStatus('Parado, a espera de comandos.');
      break;

    case 'build': {
      setStatus(`A planear: ${command.description}`);
      bot.chat(`A pensar num plano para: "${command.description}"...`);
      const steps = await planner.makePlan(command.description, {
        position: bot.entity?.position,
      });
      if (steps.length === 0) {
        bot.chat('Nao consegui gerar um plano para isso, tenta descrever de forma mais simples.');
        setStatus('Parado, a espera de comandos.');
        return;
      }
      bot.chat(`Plano com ${steps.length} passos. A executar...`);
      for (const step of steps) {
        logger.info('[plan] a executar passo:', step);
        await execute(bot, step, meta);
      }
      bot.chat('Plano concluido!');
      setStatus('Parado, a espera de comandos.');
      break;
    }

    case 'chat':
      bot.chat(command.reply || '...');
      break;

    case 'unknown':
    default:
      bot.chat('Nao percebi bem o que queres. Tenta algo tipo "segue-me" ou "minera pedra".');
      break;
  }
}

module.exports = { execute, getStatus, setStatus };
