const config = require('../../config/config');
const logger = require('../utils/logger');
const budget = require('./budget-tracker');
const hackclub = require('./hackclub-client');


async function chat(messages, { temperature = 0.5, maxTokens = 800, jsonMode = false } = {}) {
  if (!config.ai.hackclub.enabled) {
    throw new Error('Hack Club AI is disabled (HACKCLUB_ENABLED=false in .env). Use the free AI (Ollama).');
  }
  if (!config.ai.hackclub.apiKey) {
    throw new Error('HACKCLUB_API_KEY not configured in .env');
  }

  
  if (!budget.canSpend(maxTokens * 2)) {
    const status = budget.getStatus();
    logger.warn(
      `[budget] Monthly limit reached (${status.spentEur}€/${status.limitEur}€). Refusing Hack Club AI call.`
    );
    throw new Error('BUDGET_EXHAUSTED');
  }

  const response = await hackclub.chatRaw(messages, { temperature, maxTokens, jsonMode });
  const text = response?.choices?.[0]?.message?.content ?? '';
  const usage = response?.usage;

  if (usage?.cost != null) {
    budget.recordActualCostUsd(usage.cost);
  } else {
    budget.recordSpend(usage?.totalTokens ?? maxTokens);
  }

  logger.info('[hackclub-paid] call completed, tokens:', usage?.totalTokens ?? '??');
  return text;
}

module.exports = { chat };
