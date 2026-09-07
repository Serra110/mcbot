const config = require('../../config/config');
const ollama = require('./ollama-client');
const paid = require('./paid-api-client');
const logger = require('../utils/logger');


async function askFree(messages, opts = {}) {
  try {
    return await ollama.chat(messages, opts);
  } catch (err) {
    logger.error(
      '[llm-router] Ollama failed. Check that Ollama is running (ollama serve) and the model is pulled (ollama pull ' +
        config.ai.ollama.model +
        '):',
      err.message
    );
    throw err;
  }
}

async function ask(messages, { tier = 'simple', ...opts } = {}) {
  if (tier === 'complex' && config.ai.hackclub.enabled) {
    // Prefer Hack Club AI for complex work; fall back to Ollama (free).
    try {
      return await paid.chat(messages, opts);
    } catch (err) {
      if (err.message === 'BUDGET_EXHAUSTED') {
        logger.warn('[llm-router] budget exhausted -> using Ollama (free) instead of Hack Club AI.');
      } else {
        logger.warn('[llm-router] Hack Club AI failed, using Ollama (free):', err.message);
      }
      return askFree(messages, opts);
    }
  }

  // Simple tier: local Ollama first (free). If it's unavailable, and the
  // paid API is enabled, fall back to it so simple chats never silently stall.
  try {
    return await askFree(messages, opts);
  } catch (err) {
    if (config.ai.hackclub.enabled) {
      logger.warn('[llm-router] Ollama unavailable, using Hack Club AI as fallback:', err.message);
      return paid.chat(messages, opts);
    }
    throw err;
  }
}

module.exports = { ask };
