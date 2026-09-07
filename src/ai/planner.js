const router = require('./llm-router');
const { extractJson } = require('./json-extract');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are the task planner of a Minecraft bot.
You receive a description of what the player wants and a small snapshot of the world.
Your job is to return a list of simple steps that the bot can execute in vanilla Minecraft.

Important rules:
- Use the actual names in English, exactly like MC item/block names such as oak_log, stone, dirt, sand, oak_planks, crafting_table, iron_ore.
- Prefer using the inventory and nearby blocks that are already available. Do not invent impossible steps.
- If the player asks for a house, make a tiny simple structure; do not plan huge builds.
- Prefer short realistic plans, max 8 steps.
- Reply ONLY with JSON in the format: {"steps": [ {...}, {...} ]}

Supported commands per step:
- {"action":"mine","block":"<english_block_name>","amount":<num>}
- {"action":"craft","item":"<english_item_name>","amount":<num>}
- {"action":"goto","x":<num>,"y":<num>,"z":<num>}
- {"action":"give","item":"<english_item_name>","amount":<num>}
- {"action":"chat","reply":"<short_message>"}

Example: {"steps":[{"action":"mine","block":"oak_log","amount":8},{"action":"craft","item":"oak_planks","amount":8},{"action":"goto","x":1,"y":64,"z":1}]}`;

async function makePlan(description, context = {}) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Request: "${description}"\nCurrent bot context: ${JSON.stringify({
        ...context,
        inventory: context.inventory || [],
        nearbyBlocks: context.nearbyBlocks || [],
        knownItems: ['oak_log', 'oak_planks', 'stone', 'dirt', 'sand', 'coal_ore', 'iron_ore', 'crafting_table'],
      }, null, 2)}`,
    },
  ];

  try {
    const raw = await router.ask(messages, {
      tier: 'complex',
      jsonMode: true,
      temperature: 0.5,
      maxTokens: 700,
    });
    const parsed = extractJson(raw);
    return Array.isArray(parsed.steps) ? parsed.steps : [];
  } catch (err) {
    logger.warn('[planner] failed to generate plan:', err.message);
    return [];
  }
}

module.exports = { makePlan };
