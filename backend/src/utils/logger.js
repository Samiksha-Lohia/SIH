/**
 * Minimal structured logger. Avoids a heavy dependency while giving
 * timestamped, level-tagged output that plays well with log aggregators.
 */
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = process.env.LOG_LEVEL || 'info';

function log(level, msg, meta) {
  if (levels[level] > (levels[currentLevel] ?? 2)) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ? { meta } : {}),
  };
  const line = `[${entry.ts}] ${level.toUpperCase()}: ${msg}`;
  if (level === 'error') console.error(line, meta ?? '');
  else if (level === 'warn') console.warn(line, meta ?? '');
  else console.log(line, meta ?? '');
}

export const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

export default logger;
