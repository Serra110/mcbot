const config = require('../../config/config');
const logger = require('../utils/logger');
const budget = require('./budget-tracker');
const hackclub = require('./hackclub-client');


async function chat(messages, { temperature = 0.5, maxTokens = 800, jsonMode = false } = {}) {
  if (!config.ai.hackclub.enabled) {
    throw new Error('Hack Club AI desativada (HACKCLUB_ENABLED=false no .env). Usa a IA gratuita (Ollama).');
  }
  if (!config.ai.hackclub.apiKey) {
    throw new Error('HACKCLUB_API_KEY nao configurada no .env');
  }

  
  if (!budget.canSpend(maxTokens * 2)) {
    const status = budget.getStatus();
    logger.warn(
      `[budget] Limite mensal atingido (${status.spentEur}€/${status.limitEur}€). A recusar chamada a Hack Club AI.`
    );
    throw new Error('ORCAMENTO_ESGOTADO');
  }

  const response = await hackclub.chatRaw(messages, { temperature, maxTokens, jsonMode });
  const text = response?.choices?.[0]?.message?.content ?? '';
  const usage = response?.usage;

  if (usage?.cost != null) {
    budget.recordActualCostUsd(usage.cost);
  } else {
    budget.recordSpend(usage?.totalTokens ?? maxTokens);
  }

  logger.info('[hackclub-paid] chamada concluida, tokens:', usage?.totalTokens ?? '??');
  return text;
}

module.exports = { chat };
