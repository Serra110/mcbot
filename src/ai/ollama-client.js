const config = require('../../config/config');
const logger = require('../utils/logger');


async function chat(messages, { jsonMode = false, temperature = 0.4 } = {}) {
  const url = `${config.ai.ollama.baseUrl}/api/chat`;

  const body = {
    model: config.ai.ollama.model,
    messages,
    stream: false,
    options: { temperature },
  };
  if (jsonMode) {
    body.format = 'json';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Ollama error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data.message?.content ?? '';
  logger.debug('[ollama] resposta:', text.slice(0, 200));
  return text;
}

module.exports = { chat };
