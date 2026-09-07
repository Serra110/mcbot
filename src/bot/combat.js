const logger = require('../utils/logger');
const { goals } = require('mineflayer-pathfinder');

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
  logger.info('[combat] auto-defense enabled.');
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
    logger.debug('[combat] failed to attack:', err.message);
  }
}

function findPlayerEntity(bot, playerName) {
  if (!playerName) return null;
  const name = String(playerName).toLowerCase();
  const entry = bot.players[name] || Object.values(bot.players).find((p) => p.username && String(p.username).toLowerCase() === name);
  return entry && entry.entity ? entry.entity : null;
}

function equipBestSword(bot) {
  const swords = ['diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword'];
  const sword = bot.inventory.items().find((slot) => swords.includes(slot.name));
  if (sword) {
    try {
      bot.equip(sword, 'hand');
    } catch {}
  }
}

function attackPlayer(bot, playerName, { durationMs = 20000 } = {}) {
  const entity = findPlayerEntity(bot, playerName);
  if (!entity) {
    bot.chat(`I can't find a player named "${playerName}".`);
    return { ok: false, reason: 'not_found' };
  }

  equipBestSword(bot);
  logger.info(`[combat] attacking player ${playerName}`);
  bot.chat(`Attacking ${playerName}!`);

  const endAt = Date.now() + durationMs;
  const interval = setInterval(() => {
    const target = findPlayerEntity(bot, playerName);
    if (!target) {
      bot.chat(`${playerName} is gone, stopping.`);
      clearInterval(interval);
      return;
    }

    if (Date.now() >= endAt) {
      bot.chat(`Stopped attacking ${playerName} (time limit).`);
      clearInterval(interval);
      return;
    }

    const dist = bot.entity.position.distanceTo(target.position);
    if (dist < 4) {
      equipBestSword(bot);
      attackEntity(bot, target);
    } else {
      try {
        bot.pathfinder.setGoal(new goals.GoalFollow(target, 2), true);
      } catch (e) {
        logger.debug('[combat] pathfinding follow failed:', e.message);
      }
    }
  }, 400);

  return { ok: true, stop: () => clearInterval(interval) };
}



function fleeFrom(bot, entity) {
  const dx = bot.entity.position.x - entity.position.x;
  const dz = bot.entity.position.z - entity.position.z;
  const angle = Math.atan2(dz, dx);
  bot.look(angle, 0, true);
  bot.setControlState('forward', true);
  setTimeout(() => bot.setControlState('forward', false), 1500);
}

module.exports = { enableAutoDefense, disableAutoDefense, findNearestHostile, attackPlayer };
