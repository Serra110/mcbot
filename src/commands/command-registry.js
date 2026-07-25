const movement = require('../bot/movement');
const mining = require('../bot/mining');
const crafting = require('../bot/crafting');
const planner = require('../ai/planner');
const logger = require('../utils/logger');

let currentStatus = 'Idle, waiting for commands.';

function getStatus() {
  return currentStatus;
}

function setStatus(text) {
  currentStatus = text;
}


async function execute(bot, command, meta = {}) {
  switch (command.action) {
    case 'stop':
      setStatus('Stopped.');
      movement.stop(bot);
      break;

    case 'status':
      bot.chat(`Status: ${currentStatus}`);
      break;

    case 'follow':
      setStatus(`Following ${command.target || 'nearest player'}.`);
      movement.followPlayer(bot, command.target);
      break;

    case 'goto':
      setStatus(`Going to (${command.x}, ${command.y}, ${command.z}).`);
      await movement.goTo(bot, command.x, command.y, command.z);
      setStatus('Idle, waiting for commands.');
      break;

    case 'mine':
      setStatus(`Mining ${command.block} (${command.amount}x).`);
      await mining.mineBlock(bot, command.block, command.amount || 1);
      setStatus('Idle, waiting for commands.');
      break;

    case 'craft':
      setStatus(`Crafting ${command.item} (${command.amount}x).`);
      await crafting.craftItem(bot, command.item, command.amount || 1);
      setStatus('Idle, waiting for commands.');
      break;

    case 'build': {
      setStatus(`Planning: ${command.description}`);
      bot.chat(`Thinking of a plan for: "${command.description}"...`);
      const steps = await planner.makePlan(command.description, {
        position: bot.entity?.position,
      });
      if (steps.length === 0) {
        bot.chat("Couldn't generate a plan for that, try describing it more simply.");
        setStatus('Idle, waiting for commands.');
        return;
      }
      bot.chat(`Plan with ${steps.length} steps. Executing...`);
      for (const step of steps) {
        logger.info('[plan] executing step:', step);
        await execute(bot, step, meta);
      }
      bot.chat('Plan completed!');
      setStatus('Idle, waiting for commands.');
      break;
    }

    case 'chat':
      bot.chat(command.reply || '...');
      break;

    case 'unknown':
    default:
      bot.chat('I didn\'t quite understand. Try something like "follow me" or "mine stone".');
      break;
  }
}

module.exports = { execute, getStatus, setStatus };
