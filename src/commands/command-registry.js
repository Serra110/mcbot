const movement = require('../bot/movement');
const mining = require('../bot/mining');
const crafting = require('../bot/crafting');
const combat = require('../bot/combat');
const blueprints = require('../bot/blueprints');
const schematics = require('../bot/schematic-manager');
const buildSession = require('../bot/build-session');
const planner = require('../ai/planner');
const logger = require('../utils/logger');
const { resolveBlockName, resolveItemName } = require('../utils/minecraft-name');
const { Vec3 } = require('vec3');

function findInventoryItem(bot, itemName) {
  const normalized = resolveItemName(itemName) || resolveBlockName(itemName) || itemName;
  return bot.inventory.items().find((slot) => {
    const name = slot && slot.name ? slot.name : '';
    return name === normalized || name.endsWith(normalized) || normalized.endsWith(name);
  });
}

function getStackByName(bot, itemName) {
  const normalized = resolveItemName(itemName) || resolveBlockName(itemName) || itemName;
  return bot.inventory.items().find((slot) => {
    const name = slot && slot.name ? slot.name : '';
    return name === normalized || name.endsWith(normalized) || normalized.endsWith(name);
  }) || null;
}

function getBestToolNameForTask(task, blockName = '') {
  const lowered = String(blockName || '').toLowerCase();
  if (task === 'attack') {
    return ['diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword'];
  }

  const isWood = /log|wood|planks|leaves|sapling|stripped_.*log/.test(lowered);
  const isStone = /stone|cobblestone|andesite|granite|diorite|sandstone|basalt|marble|ore|deepslate|brick|terracotta|quartz/.test(lowered);
  const isDirt = /dirt|grass|sand|gravel|clay/.test(lowered);

  if (isWood) return ['diamond_axe', 'iron_axe', 'stone_axe', 'wooden_axe'];
  if (isDirt) return ['diamond_shovel', 'iron_shovel', 'stone_shovel', 'wooden_shovel'];
  if (isStone) return ['diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe'];
  return ['diamond_pickaxe', 'iron_pickaxe', 'stone_pickaxe', 'wooden_pickaxe'];
}

async function ensureBestTool(bot, task, blockName = '') {
  const toolNames = getBestToolNameForTask(task, blockName);
  const preferredTool = bot.inventory.items().find((slot) => toolNames.includes(slot.name));
  if (!preferredTool) return null;
  await bot.equip(preferredTool, 'hand');
  return preferredTool;
}

let currentStatus = 'Idle, waiting for commands.';

function getStatus() {
  return currentStatus;
}

function setStatus(text) {
  currentStatus = text;
}

function isCreative(bot) {
  return bot.game?.gameMode === 'creative';
}

function countHeldMaterial(bot, material) {
  const name = String(material).toLowerCase().replace(/^minecraft:/, '');
  let count = 0;
  for (const slot of bot.inventory.items()) {
    if (slot && slot.name && slot.name.toLowerCase().replace(/^minecraft:/, '') === name) {
      count += slot.count;
    }
  }
  return count;
}

function materialsDiff(bot, materialsNeeded) {
  const missing = {};
  let haveAll = true;
  for (const [mat, need] of Object.entries(materialsNeeded)) {
    const have = countHeldMaterial(bot, mat);
    if (have < need) {
      missing[mat] = need - have;
      haveAll = false;
    }
  }
  return { missing, haveAll };
}

function formatMaterials(materials) {
  return Object.entries(materials)
    .map(([m, c]) => `${c}x ${m}`)
    .join(', ');
}

// Start building a structure. In creative the bot self-provides materials and
// builds immediately. In survival it remembers the structure and asks the
// player for the required materials, building only after they say "continue".
async function beginBuild(bot, structure, name, source) {
  const materials = blueprints.computeBlockMaterials(structure);

  if (isCreative(bot)) {
    const ok = await blueprints.buildBlocks(bot, structure, { name });
    if (!ok) {
      buildSession.setPending({ name, structure, source, materials });
      bot.chat(`Couldn't start ${name} (block placement failed). Say "continue" to retry.`);
    }
    return;
  }

  buildSession.setPending({ name, structure, source, materials });
  setStatus(`Waiting for materials to build ${name}.`);
  const { missing } = materialsDiff(bot, materials);
  if (Object.keys(missing).length === 0) {
    bot.chat(`I already have all the materials to build ${name}. Say "continue" and I'll start.`);
    return;
  }
  bot.chat(
    `To build ${name} I need: ${Object.entries(materials).map(([m, c]) => `${c}x ${m}`).join(', ')}. ` +
      `Missing right now: ${formatMaterials(missing)}. Give them to me, then say "continue".`
  );
}

// Report what's still missing for a held build. Returns true if there was a
// pending build, false otherwise.
async function reportBuildProgress(bot) {
  const pending = buildSession.getPending();
  if (!pending) return false;

  const { missing } = materialsDiff(bot, pending.materials);
  if (Object.keys(missing).length > 0) {
    bot.chat(
      `Still missing: ${formatMaterials(missing)} (of ${pending.name}). Give me those, then say "continue".`
    );
    return true;
  }
  bot.chat(`I now have all the materials for ${pending.name}. Say "continue" and I'll build it.`);
  return true;
}

// Build a held structure. Only proceeds if the player says "continue" AND all
// materials are present. Returns true if a pending build was handled.
async function resumeBuild(bot) {
  const pending = buildSession.getPending();
  if (!pending) return false;

  // In creative the bot self-provides blocks, so a material check is pointless
  // (retries of a failed creative build must not be blocked by "missing" items).
  if (!isCreative(bot)) {
    const { missing } = materialsDiff(bot, pending.materials);
    if (Object.keys(missing).length > 0) {
      bot.chat(
        `Still missing: ${formatMaterials(missing)} (of ${pending.name}). Give me those, then say "continue".`
      );
      return true;
    }
  }

  buildSession.clearPending();
  bot.chat(`Got everything! Building ${pending.name} (${pending.source})...`);
  await blueprints.buildBlocks(bot, pending.structure, { name: pending.name });
  setStatus('Idle, waiting for commands.');
  return true;
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

    case 'mine': {
      const blockName = resolveBlockName(command.block) || command.block;
      setStatus(`Mining ${blockName} (${command.amount || 1}x).`);
      await ensureBestTool(bot, 'mine', blockName);
      await mining.mineBlock(bot, blockName, command.amount || 1);
      setStatus('Idle, waiting for commands.');
      break;
    }

    case 'craft': {
      const itemName = resolveItemName(command.item) || command.item;
      setStatus(`Crafting ${itemName} (${command.amount || 1}x).`);
      await crafting.craftItem(bot, itemName, command.amount || 1);
      setStatus('Idle, waiting for commands.');
      break;
    }

    case 'attack': {
      const target = command.target || command.player || '';
      if (!target) {
        const nearest = Object.values(bot.players)
          .filter((p) => p.username !== bot.username && p.entity)
          .sort((a, b) => bot.entity.position.distanceTo(a.entity.position) - bot.entity.position.distanceTo(b.entity.position))[0];
        if (!nearest) {
          bot.chat("I can't find anyone to attack.");
          break;
        }
        combat.attackPlayer(bot, nearest.username, {});
        setStatus(`Attacking ${nearest.username}.`);
        break;
      }
      setStatus(`Attacking ${target}.`);
      movement.stop(bot);
      combat.attackPlayer(bot, target, {});
      break;
    }

    case 'give': {
      const itemName = resolveItemName(command.item) || resolveBlockName(command.item) || command.item;
      const stack = getStackByName(bot, itemName);
      const safeItem = stack ? stack.name : (itemName || 'stone');

      if (!stack) {
        bot.chat(`I don't have ${safeItem} in my inventory.`);
        break;
      }

      try {
        const requestedAmount = command.amount === 'all' ? stack.count : Math.max(1, Number(command.amount) || 1);
        const tossAmount = Math.min(requestedAmount, stack.count);
        const itemId = stack.type ?? bot.registry?.itemsByName?.[safeItem]?.id ?? null;

        if (itemId == null) {
          bot.chat(`I can't give you ${safeItem} because it is not a valid item.`);
          break;
        }

        bot.toss(itemId, stack.metadata ?? 0, tossAmount, (err) => {
          if (err) {
            logger.warn('[give] failed to toss item:', err.message);
            bot.chat(`I couldn't give you ${safeItem}.`);
          } else {
            bot.chat(`Here you go, ${tossAmount} ${safeItem}.`);
          }
        });
      } catch (err) {
        logger.warn('[give] error while giving item:', err.message);
        bot.chat(`I couldn't give you ${safeItem}.`);
      }
      break;
    }

    case 'place': {
      const blockName = resolveBlockName(command.block) || command.block;
      const mcData = require('minecraft-data')(bot.version);
      const targetBlock = bot.findBlock({
        matching: mcData.blocksByName[blockName]?.id,
        maxDistance: 6,
      });

      if (!targetBlock) {
        bot.chat(`I need a nearby ${blockName} block to place on.`);
        break;
      }

      const inventoryItem = bot.inventory.items().find((item) => item.name === blockName);
      if (!inventoryItem) {
        bot.chat(`I don't have ${blockName} in my inventory to place.`);
        break;
      }

      try {
        await bot.equip(inventoryItem, 'hand');
        await bot.placeBlock(targetBlock, new Vec3(0, 1, 0));
        bot.chat(`Placed ${blockName}.`);
      } catch (err) {
        logger.warn('[place] failed to place block:', err.message);
        bot.chat(`I couldn't place ${blockName}.`);
      }
      break;
    }

    case 'build': {
      setStatus(`Planning: ${command.description}`);
      const safeDescription = String(command.description || '').toLowerCase();

      logger.info(`[build] handling: "${safeDescription}" (pending session: ${buildSession.hasPending()})`);

      // Try a local .schem file, or have the LLM generate the structure.
      logger.info('[build] getting schematic (local file or LLM)...');
      // Build a small, safe context. nearbyBlocks is optional and must never
      // block the critical path (bot.findBlocks can stall on big loaded areas).
      let nearbyBlocks = [];
      try {
        if (bot.findBlocks) {
          nearbyBlocks = bot.findBlocks({ matching: (block) => block && block.type !== 0, maxDistance: 6, count: 12 }) || [];
        }
      } catch (err) {
        logger.warn('[build] findBlocks failed, continuing without nearby context:', err.message);
      }
      const schem = await Promise.race([
        schematics.getSchematic(bot, safeDescription, {
          inventory: bot.inventory.items().map((slot) => ({ name: slot.name, count: slot.count })),
          nearbyBlocks,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('schematic generation timed out (30s)')), 30000)
        ),
      ]);
      logger.info('[build] schematic result:', schem ? `found "${schem.name}" (${schem.blocks.length} blocks, ${schem.source})` : 'none');
      if (schem) {
        setStatus(`Preparing ${schem.name} (${schem.source}).`);
        movement.stop(bot);
        try {
          await beginBuild(bot, schem.blocks, schem.name, schem.source);
          logger.info('[build] done.');
        } catch (err) {
          logger.error('[build] schematic build failed:', err);
          bot.chat(`Build failed: ${err.message || 'unknown error'}`);
        }
        break;
      }

      // Fallback to a fixed blueprint when no schematic/LLM structure was produced.
      const blueprint = blueprints.findBlueprint(safeDescription);
      if (blueprint) {
        setStatus(`Preparing ${blueprint.name}.`);
        movement.stop(bot);
        const blueprintBlocks = blueprint.cells.map((c) => ({
          x: c.x,
          y: c.y,
          z: c.z,
          block: blueprint.material(c.type, c.y),
        }));
        try {
          await beginBuild(bot, blueprintBlocks, blueprint.name, 'blueprint');
        } catch (err) {
          logger.error('[build] blueprint failed:', err);
          bot.chat(`Build failed: ${err.message || 'unknown error'}`);
        }
        break;
      }

      let steps = await planner.makePlan(command.description, {
        position: bot.entity?.position,
        inventory: bot.inventory.items().map((slot) => ({ name: slot.name, count: slot.count })),
        nearbyBlocks: bot.findBlocks ? (bot.findBlocks({
          matching: (block) => block && block.type !== 0,
          maxDistance: 8,
          count: 24,
        }) || []) : [],
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

module.exports = { execute, getStatus, setStatus, resumeBuild, reportBuildProgress };
