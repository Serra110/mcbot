const router = require('./llm-router');
const { extractJson } = require('./json-extract');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `You are the brain of a Minecraft bot. Your only job is to convert
what a player writes in chat into a structured JSON action.

Possible actions (use exactly these names):
- "follow"   {action:"follow", target:"<player_name_or_empty>"}
- "goto"     {action:"goto", x:<num>, y:<num>, z:<num>}
- "mine"     {action:"mine", block:"<minecraft_block_name_in_english>", amount:<num>}
- "craft"    {action:"craft", item:"<minecraft_item_name_in_english>", amount:<num>}
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


async function parseIntent(playerMessage, playerName) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Player "${playerName}" said: "${playerMessage}"` },
  ];

  try {
    const raw = await router.ask(messages, { tier: 'simple', jsonMode: true, temperature: 0.2 });
    const parsed = extractJson(raw);
    if (!parsed || typeof parsed.action !== 'string') {
      throw new Error('Returned JSON does not have the expected format (missing "action").');
    }
    logger.debug('[nlu] intent:', parsed);
    return parsed;
  } catch (err) {
    logger.warn('[nlu] failed to interpret message, falling back to "unknown":', err.message);
    return { action: 'unknown' };
  }
}

module.exports = { parseIntent };
