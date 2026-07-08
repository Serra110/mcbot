const logger = require('../utils/logger');

const HOSTILE_MOBS = new Set([
  'zombie', 'skeleton', 'creeper', 'spider', 'cave_spider', 'enderman',
  'witch', 'zombie_villager', 'drowned', 'husk', 'stray', 'phantom', 'pillager',
]);

let combatEnabled = true;
let watchInterval = null;

function findNearestHostile(bot, maxDistance = 10) {
  const entities = Object.values(bot.entities).filter((e) => {
    const name = (e.name || e.mobType || '').toLowerCase();
    return HOSTILE_MOBS.has(name) && bot.entity.position.distanceTo(e.position) <= maxDistance;
  });
  if (entities.length === 0) return null;
  entities.sort((a, b) => bot.entity.position.distanceTo(a.position) - bot.entity.position.distanceTo(b.position));
  return entities[0];
}


function enableAutoDefense(bot) {
  if (watchInterval) return;
  watchInterval = setInterval(() => {
    if (!combatEnabled) return;
    const hostile = findNearestHostile(bot);
    if (!hostile) return;

    const health = bot.health ?? 20;
    if (health <= 6) {
      fleeFrom(bot, hostile);
    } else {
      attackEntity(bot, hostile);
    }
  }, 1000);
  logger.info('[combat] auto-defesa ativada.');
}

function disableAutoDefense() {
  if (watchInterval) {
    clearInterval(watchInterval);
    watchInterval = null;
  }
}

function attackEntity(bot, entity) {
  try {
    bot.attack(entity);
  } catch (err) {
    logger.debug('[combat] falha ao atacar:', err.message);
  }
}

function fleeFrom(bot, entity) {
  const dx = bot.entity.position.x - entity.position.x;
  const dz = bot.entity.position.z - entity.position.z;
  const angle = Math.atan2(dz, dx);
  bot.look(angle, 0, true);
  bot.setControlState('forward', true);
  setTimeout(() => bot.setControlState('forward', false), 1500);
}

module.exports = { enableAutoDefense, disableAutoDefense, findNearestHostile };
