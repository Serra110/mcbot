require('dotenv').config();

function toBool(v, fallback = false) {
  if (v === undefined) return fallback;
  return String(v).toLowerCase() === 'true';
}

function toNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const config = {
  minecraft: {
    host: process.env.MC_HOST || 'localhost',
    port: toNumber(process.env.MC_PORT, 25565),
    username: process.env.MC_USERNAME || 'AiBot',
    version: process.env.MC_VERSION || false,
    auth: process.env.MC_AUTH || 'offline',
  },

  ai: {
    
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
    },

   
    hackclub: {
      enabled: toBool(process.env.HACKCLUB_ENABLED, false),
      apiKey: process.env.HACKCLUB_API_KEY || '',
      serverUrl: process.env.HACKCLUB_SERVER_URL || 'https://ai.hackclub.com/proxy/v1',
      model: process.env.HACKCLUB_MODEL || 'qwen/qwen3-32b',
    },
  },

  budget: {
    monthlyEur: toNumber(process.env.MONTHLY_BUDGET_EUR, 3.0),
    estCostPer1kTokensEur: toNumber(process.env.EST_COST_PER_1K_TOKENS_EUR, 0.00015),
  
    usdToEurRate: toNumber(process.env.USD_TO_EUR_RATE, 0.93),
  },

  general: {
    logLevel: process.env.LOG_LEVEL || 'info',
    language: process.env.BOT_LANGUAGE || 'pt',
  },

  paths: {
    budgetFile: require('path').join(__dirname, '..', 'data', 'budget.json'),
    memoryFile: require('path').join(__dirname, '..', 'data', 'memory.json'),
  },
};

module.exports = config;
