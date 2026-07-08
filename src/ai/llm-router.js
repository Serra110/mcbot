const config = require('../../config/config');
const ollama = require('./ollama-client');
const paid = require('./paid-api-client');
const logger = require('../utils/logger');


async function askFree(messages, opts = {}) {
  try {
    return await ollama.chat(messages, opts);
  } catch (err) {
    logger.error(
      '[llm-router] Ollama falhou. Confirma que o Ollama esta a correr (ollama serve) e que o modelo foi puxado (ollama pull ' +
        config.ai.ollama.model +
        '):',
      err.message
    );
    throw err;
  }
}

async function ask(messages, { tier = 'simple', ...opts } = {}) {
  if (tier === 'complex' && config.ai.hackclub.enabled) {
    try {
      return await paid.chat(messages, opts);
    } catch (err) {
      if (err.message === 'ORCAMENTO_ESGOTADO') {
        logger.warn('[llm-router] orcamento esgotado -> a usar Ollama (gratuito) em vez da Hack Club AI.');
      } else {
        logger.warn('[llm-router] Hack Club AI falhou, a usar Ollama (gratuito):', err.message);
      }
      return askFree(messages, opts);
    }
  }
  return askFree(messages, opts);
}

module.exports = { ask };
