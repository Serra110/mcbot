const logger = require('../utils/logger');

let pending = null;

function hasPending() {
  return !!pending;
}

function getPending() {
  return pending;
}

function setPending(meta) {
  pending = meta;
  logger.info('[build-session] pending structure saved:', meta.name);
}

function clearPending() {
  pending = null;
}

module.exports = { hasPending, getPending, setPending, clearPending };
