/**
 * 로깅 유틸리티
 * 추후 Winston 등의 로깅 라이브러리로 교체 가능
 */

const currentLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

const levelRank = { error: 0, warn: 1, info: 2, debug: 3 };

const allow = (lvl) => levelRank[lvl] <= levelRank[currentLevel];

const logger = {
  error: (msg, err) => {
    if (allow('error')) console.error(`[ERROR] ${msg}`, err || '');
  },
  warn: (msg) => {
    if (allow('warn')) console.warn(`[WARN] ${msg}`);
  },
  info: (msg) => {
    if (allow('info')) console.log(`[INFO] ${msg}`);
  },
  debug: (msg, data) => {
    if (allow('debug')) console.debug(`[DEBUG] ${msg}`, data || '');
  }
};

module.exports = logger; 