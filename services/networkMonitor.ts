import { analytics } from '../services/analyticsService';

interface NetworkStatus {
  online: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink: number | undefined;
  rtt: number | undefined;
  saveData: boolean;
}

class NetworkMonitor {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = this.getStatus();

  constructor() {
    this.init();
  }

  private init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleStatusChange());
    window.addEventListener('offline', () => this.handleStatusChange());

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', () => this.handleStatusChange());
    }
  }

  private getStatus(): NetworkStatus {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      online: navigator.onLine,
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData || false
    };
  }

  private handleStatusChange() {
    const newStatus = this.getStatus();
    const statusChanged = newStatus.online !== this.currentStatus.online;

    this.currentStatus = newStatus;
    this.notifyListeners();

    if (statusChanged) {
      if (newStatus.online) {
        analytics.info('network', 'Network connection restored');
      } else {
        analytics.warn('network', 'Network connection lost');
      }
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        analytics.error('network', 'Error in network listener', { error: String(error) });
      }
    });
  }

  // Public API
  getNetworkStatus(): NetworkStatus {
    return this.currentStatus;
  }

  isOnline(): boolean {
    return this.currentStatus.online;
  }

  isSlowConnection(): boolean {
    const { effectiveType, saveData } = this.currentStatus;
    return saveData || effectiveType === '2g' || effectiveType === 'slow-2g';
  }

  isFastConnection(): boolean {
    const { effectiveType } = this.currentStatus;
    return effectiveType === '4g';
  }

  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  getConnectionInfo(): string {
    const status = this.currentStatus;
    if (!status.online) return 'Offline';
    if (status.effectiveType === 'unknown') return 'Connected';
    return `${status.effectiveType.toUpperCase()} (${status.rtt}ms)`;
  }
}

export const networkMonitor = new NetworkMonitor();
