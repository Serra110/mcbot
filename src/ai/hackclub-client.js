const { OpenRouter } = require('@openrouter/sdk');
const config = require('../../config/config');
const logger = require('../utils/logger');



let client = null;

function getClient() {
  if (!client) {
    client = new OpenRouter({
      apiKey: config.ai.hackclub.apiKey || 'not-required',
      serverURL: config.ai.hackclub.serverUrl,
    });
  }
  return client;
}



async function chatRaw(messages, { jsonMode = false, temperature = 0.4, maxTokens = 800 } = {}) {
  const c = getClient();

  const chatRequest = {
    model: config.ai.hackclub.model,
    messages,
    temperature,
    maxTokens,
    stream: false,
  };

  if (jsonMode) {
    chatRequest.responseFormat = { type: 'json_object' };
  }

  try {
    return await c.chat.send({ chatRequest });
  } catch (err) {
    
    
    if (jsonMode) {
      logger.warn('[hackclub] pedido com responseFormat falhou, a tentar sem json mode:', err.message);
      const { responseFormat, ...rest } = chatRequest;
      return await c.chat.send({ chatRequest: rest });
    }
    throw err;
  }
}



async function chat(messages, opts = {}) {
  const response = await chatRaw(messages, opts);
  const text = response?.choices?.[0]?.message?.content ?? '';
  logger.debug('[hackclub] resposta:', String(text).slice(0, 200));
  return text;
}

module.exports = { chat, chatRaw };

