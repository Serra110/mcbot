const { goals } = require('mineflayer-pathfinder');
const logger = require('../utils/logger');

let followInterval = null;

function stopFollowing(bot) {
  if (followInterval) {
    clearInterval(followInterval);
    followInterval = null;
  }
  bot.pathfinder.setGoal(null);
}

function followPlayer(bot, playerName) {
  stopFollowing(bot);

  const target = playerName ? bot.players[playerName]?.entity : findNearestPlayerEntity(bot);
  if (!target) {
    bot.chat(`Nao vejo o/a ${playerName || 'jogador'} perto de mim.`);
    return;
  }

  const goFollow = () => {
    const entity = playerName ? bot.players[playerName]?.entity : target;
    if (!entity) return;
    bot.pathfinder.setGoal(new goals.GoalFollow(entity, 2), true);
  };

  goFollow();
  followInterval = setInterval(goFollow, 1500);
  bot.chat(`A seguir ${playerName || 'jogador mais proximo'}!`);
}

function findNearestPlayerEntity(bot) {
  const entities = Object.values(bot.entities).filter(
    (e) => e.type === 'player' && e.username !== bot.username
  );
  if (entities.length === 0) return null;
  entities.sort((a, b) => bot.entity.position.distanceTo(a.position) - bot.entity.position.distanceTo(b.position));
  return entities[0];
}

async function goTo(bot, x, y, z) {
  stopFollowing(bot);
  bot.chat(`A ir para (${x}, ${y}, ${z})...`);
  const goal = new goals.GoalBlock(x, y, z);
  try {
    await bot.pathfinder.goto(goal);
    bot.chat('Cheguei!');
  } catch (err) {
    logger.warn('[movement] falha ao chegar ao destino:', err.message);
    bot.chat('Nao consegui chegar la, o caminho deve estar bloqueado.');
  }
}

function stop(bot) {
  stopFollowing(bot);
  bot.clearControlStates();
  bot.chat('Parei.');
}

module.exports = { followPlayer, goTo, stop, stopFollowing, findNearestPlayerEntity };
