const config = require('../../config/config');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LEVELS[config.general.logLevel] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString().slice(11, 19);
}

function log(level, ...args) {
  if (LEVELS[level] < currentLevel) return;
  const prefix = {
    debug: '\x1b[90m[DEBUG]\x1b[0m',
    info: '\x1b[36m[INFO]\x1b[0m',
    warn: '\x1b[33m[WARN]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m',
  }[level];
  console.log(`${timestamp()} ${prefix}`, ...args);
}

module.exports = {
  debug: (...a) => log('debug', ...a),
  info: (...a) => log('info', ...a),
  warn: (...a) => log('warn', ...a),
  error: (...a) => log('error', ...a),
};
