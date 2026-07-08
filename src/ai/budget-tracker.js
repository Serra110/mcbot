const fs = require('fs');
const path = require('path');
const config = require('../../config/config');
const logger = require('../utils/logger');



function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadState() {
  try {
    const raw = fs.readFileSync(config.paths.budgetFile, 'utf8');
    const state = JSON.parse(raw);
    if (state.month !== currentMonthKey()) {
      
      return { month: currentMonthKey(), spentEur: 0, callCount: 0 };
    }
    return state;
  } catch (err) {
    return { month: currentMonthKey(), spentEur: 0, callCount: 0 };
  }
}

function saveState(state) {
  const dir = path.dirname(config.paths.budgetFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(config.paths.budgetFile, JSON.stringify(state, null, 2));
}

let state = loadState();

function getStatus() {
  state = loadState(); 
  const remaining = Math.max(0, config.budget.monthlyEur - state.spentEur);
  return {
    month: state.month,
    spentEur: Number(state.spentEur.toFixed(4)),
    limitEur: config.budget.monthlyEur,
    remainingEur: Number(remaining.toFixed(4)),
    callCount: state.callCount,
    percentUsed: Math.min(100, Math.round((state.spentEur / config.budget.monthlyEur) * 100)),
  };
}


function canSpend(estimatedMaxTokens = 1500) {
  const status = getStatus();
  const estCost = (estimatedMaxTokens / 1000) * config.budget.estCostPer1kTokensEur;
  return status.remainingEur >= estCost;
}


function recordSpend(totalTokens) {
  state = loadState();
  const cost = (totalTokens / 1000) * config.budget.estCostPer1kTokensEur;
  state.spentEur += cost;
  state.callCount += 1;
  saveState(state);
  logger.info(
    `[budget] +${cost.toFixed(5)}€ (tokens: ${totalTokens}) | total mes: ${state.spentEur.toFixed(4)}€ / ${config.budget.monthlyEur}€`
  );
  return getStatus();
}


function recordActualCostUsd(costUsd) {
  state = loadState();
  const costEur = costUsd * config.budget.usdToEurRate;
  state.spentEur += costEur;
  state.callCount += 1;
  saveState(state);
  logger.info(
    `[budget] +${costEur.toFixed(5)}€ (custo real: $${costUsd.toFixed(5)}) | total mes: ${state.spentEur.toFixed(4)}€ / ${config.budget.monthlyEur}€`
  );
  return getStatus();
}

module.exports = { getStatus, canSpend, recordSpend, recordActualCostUsd };
