interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
}

class AnalyticsService {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private debugMode = false;
  private readonly LOGS_KEY = 'saxon_analytics_logs';

  constructor() {
    this.debugMode = localStorage.getItem('SAXON_DEBUG') === 'true';
    this.loadLogs();
  }

  private loadLogs() {
    const stored = localStorage.getItem(this.LOGS_KEY);
    if (stored) {
      try {
        this.logs = JSON.parse(stored);
      } catch (e) {
        this.logs = [];
      }
    }
  }

  private saveLogs() {
    localStorage.setItem(this.LOGS_KEY, JSON.stringify(this.logs.slice(-this.maxLogs)));
  }

  private log(level: LogEntry['level'], category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);
    this.saveLogs();

    if (this.debugMode) {
      console.log(`[${category}]`, message, data || '');
    }
  }

  // Public methods
  info(category: string, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data);
    console.warn(`[${category}] ${message}`, data);
  }

  error(category: string, message: string, data?: any) {
    this.log('error', category, message, data);
    console.error(`[${category}] ${message}`, data);
  }

  debug(category: string, message: string, data?: any) {
    if (this.debugMode) {
      this.log('debug', category, message, data);
    }
  }

  // Performance tracking
  time(label: string) {
    const start = performance.now();
    return () => {
      const end = performance.now();
      this.debug('perf', `${label}`, { duration: `${(end - start).toFixed(2)}ms` });
    };
  }

  // Analytics events
  trackEvent(name: string, data?: any) {
    this.info('analytics', `Event: ${name}`, data);
  }

  trackPageView(pageName: string) {
    this.info('analytics', `Page view: ${pageName}`);
  }

  trackError(error: Error, context?: string) {
    this.error('analytics', `Error: ${error.message}`, {
      context,
      stack: error.stack
    });
  }

  // Debug mode control
  enableDebug() {
    this.debugMode = true;
    localStorage.setItem('SAXON_DEBUG', 'true');
    console.log('🐛 Debug mode enabled');
  }

  disableDebug() {
    this.debugMode = false;
    localStorage.removeItem('SAXON_DEBUG');
    console.log('🐛 Debug mode disabled');
  }

  toggleDebug() {
    this.debugMode ? this.disableDebug() : this.enableDebug();
  }

  // Logs management
  getLogs(filter?: { level?: string; category?: string; limit?: number }) {
    let filtered = [...this.logs];

    if (filter?.level) {
      filtered = filtered.filter(l => l.level === filter.level);
    }

    if (filter?.category) {
      filtered = filtered.filter(l => l.category === filter.category);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem(this.LOGS_KEY);
    console.log('🗑️  Logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  downloadLogs() {
    const data = this.exportLogs();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', `saxon-logs-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  // Stats
  getStats() {
    return {
      totalLogs: this.logs.length,
      errors: this.logs.filter(l => l.level === 'error').length,
      warnings: this.logs.filter(l => l.level === 'warn').length,
      debugMode: this.debugMode,
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp
    };
  }
}

export const analytics = new AnalyticsService();
