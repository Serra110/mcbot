const router = require('./llm-router');
const { extractJson } = require('./json-extract');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are the task planner of a Minecraft bot.
You receive a description of what the player wants (e.g. "build a small house")
and you must return a list of simple steps, each being a command already supported by the bot.

Supported commands per step:
- {"action":"mine","block":"<english_block_name>","amount":<num>}
- {"action":"craft","item":"<english_item_name>","amount":<num>}
- {"action":"goto","x":<num>,"y":<num>,"z":<num>}
- {"action":"place","block":"<english_block_name>","x":<num>,"y":<num>,"z":<num>}

Reply ONLY with JSON in the format: {"steps": [ {...}, {...} ]}
Keep the plan short (max 8 steps) and realistic for vanilla Minecraft.`;

async function makePlan(description, context = {}) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Request: "${description}"\nCurrent bot context: ${JSON.stringify(context)}`,
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
