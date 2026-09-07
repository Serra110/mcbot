const router = require('./llm-router');
const { extractJson } = require('./json-extract');
const logger = require('../utils/logger');
const { resolveBlockName, resolveItemName } = require('../utils/minecraft-name');

const SYSTEM_PROMPT = `You are the brain of a Minecraft bot. Your only job is to convert
what a player writes in chat into a structured JSON action.

Possible actions (use exactly these names):
- "follow"   {action:"follow", target:"<player_name_or_empty>"}
- "attack"   {action:"attack", target:"<player_name_to_attack>"}  (kill a specific player)
- "goto"     {action:"goto", x:<num>, y:<num>, z:<num>}
- "mine"     {action:"mine", block:"<minecraft_block_name_in_english>", amount:<num>}
- "craft"    {action:"craft", item:"<minecraft_item_name_in_english>", amount:<num>}
- "give"     {action:"give", item:"<minecraft_item_name_in_english>", amount:<num>}
- "place"    {action:"place", block:"<minecraft_block_name_in_english>"}
- "stop"     {action:"stop"}
- "status"   {action:"status"}
- "build"    {action:"build", description:"<short_description_of_what_to_build>"}
- "chat"     {action:"chat", reply:"<short_friendly_reply_in_english>"}
- "unknown"  {action:"unknown"}

Rules:
- Reply ONLY with a valid JSON object, nothing else.
- Block/item names must be the internal Minecraft names in English (e.g. "oak_log", "cobblestone", "iron_ore").
- If the request is just conversation/a question with no in-game action intent, use "chat".
- If you don't understand the intent, use "unknown".
- "amount" defaults to 1 if not specified.`;


async function parseIntent(playerMessage, playerName, bot = null) {
  const botContext = bot
    ? {
        position: bot.entity?.position ? { x: bot.entity.position.x, y: bot.entity.position.y, z: bot.entity.position.z } : null,
        inventory: bot.inventory?.items?.().map((slot) => ({ name: slot.name, count: slot.count })) || [],
        nearbyBlocks: bot.findBlocks ? bot.findBlocks({ matching: (block) => block && block.type !== 0, maxDistance: 8, count: 24 }) || [] : [],
      }
    : {};

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Player "${playerName}" said: "${playerMessage}"\nBot context: ${JSON.stringify(botContext, null, 2)}`,
    },
  ];

  try {
    const raw = await router.ask(messages, { tier: 'simple', jsonMode: true, temperature: 0.2 });
    const parsed = extractJson(raw);
    if (!parsed || typeof parsed.action !== 'string') {
      throw new Error('Returned JSON does not have the expected format (missing "action").');
    }

    if (parsed.action === 'mine' && typeof parsed.block === 'string') {
      parsed.block = resolveBlockName(parsed.block) || parsed.block;
    }

    if (parsed.action === 'craft' && typeof parsed.item === 'string') {
      parsed.item = resolveItemName(parsed.item) || parsed.item;
    }

    logger.debug('[nlu] intent:', parsed);
    return parsed;
  } catch (err) {
    logger.warn('[nlu] failed to interpret message, falling back to "unknown":', err.message);
    return { action: 'unknown' };
  }
}

module.exports = { parseIntent };
