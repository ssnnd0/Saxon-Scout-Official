export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  enabled: boolean;
  level: LogLevel;
}

const defaultOptions: LoggerOptions = {
  enabled: true,
  level: 'info',
};

function shouldLog(current: LogLevel, target: LogLevel) {
  const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return order.indexOf(target) >= order.indexOf(current);
}

export class Logger {
  private options: LoggerOptions;
  constructor(options?: Partial<LoggerOptions>) {
    this.options = { ...defaultOptions, ...(options || {}) };
  }
  setEnabled(enabled: boolean) { this.options.enabled = enabled; }
  setLevel(level: LogLevel) { this.options.level = level; }

  debug(...args: any[]) { if (this.options.enabled && shouldLog(this.options.level, 'debug')) console.debug('[DEBUG]', ...args); }
  info(...args: any[]) { if (this.options.enabled && shouldLog(this.options.level, 'info')) console.info('[INFO]', ...args); }
  warn(...args: any[]) { if (this.options.enabled && shouldLog(this.options.level, 'warn')) console.warn('[WARN]', ...args); }
  error(...args: any[]) { if (this.options.enabled && shouldLog(this.options.level, 'error')) console.error('[ERROR]', ...args); }
}

export const logger = new Logger({
  enabled: (typeof window !== 'undefined') ? (localStorage.getItem('saxon_logging') !== 'false') : true,
  level: (typeof window !== 'undefined') ? ((localStorage.getItem('saxon_log_level') as LogLevel) || 'info') : 'info',
});
