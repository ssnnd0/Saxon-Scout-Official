// Toast notification system for Saxon Scout
// Provides user feedback for actions like saving, errors, etc.

interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

interface Toast {
  id: string;
  message: string;
  type: ToastOptions['type'];
  duration: number;
  timestamp: number;
}

class ToastManager {
  private toasts: Toast[] = [];
  private container: HTMLElement | null = null;
  private listeners: ((toasts: Toast[]) => void)[] = [];

  constructor() {
    this.createContainer();
  }

  private createContainer() {
    if (typeof document === 'undefined') return;
    
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  private createToastElement(toast: Toast): HTMLElement {
    const element = document.createElement('div');
    element.id = toast.id;
    element.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      margin-bottom: 10px;
      padding: 12px 16px;
      min-width: 300px;
      max-width: 400px;
      pointer-events: auto;
      transform: translateX(100%);
      transition: all 0.3s ease;
      border-left: 4px solid ${this.getTypeColor(toast.type)};
    `;

    const icon = this.getTypeIcon(toast.type);
    element.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <i class="fa ${icon}" style="color: ${this.getTypeColor(toast.type)}; font-size: 16px;"></i>
        <span style="flex: 1; font-size: 14px; color: #333;">${toast.message}</span>
        <button onclick="toastManager.remove('${toast.id}')" style="
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        " onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='none'">
          <i class="fa fa-times"></i>
        </button>
      </div>
    `;

    // Animate in
    setTimeout(() => {
      element.style.transform = 'translateX(0)';
    }, 10);

    return element;
  }

  private getTypeColor(type: ToastOptions['type']): string {
    switch (type) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#6c757d';
    }
  }

  private getTypeIcon(type: ToastOptions['type']): string {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-bell';
    }
  }

  show(message: string, options: ToastOptions = {}): string {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type: options.type || 'info',
      duration: options.duration || 5000,
      timestamp: Date.now()
    };

    this.toasts.push(toast);
    this.notifyListeners();

    if (this.container) {
      const element = this.createToastElement(toast);
      this.container.appendChild(element);

      // Auto remove
      if (toast.duration > 0) {
        setTimeout(() => {
          this.remove(toast.id);
        }, toast.duration);
      }
    }

    return toast.id;
  }

  remove(id: string) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index === -1) return;

    this.toasts.splice(index, 1);
    this.notifyListeners();

    const element = document.getElementById(id);
    if (element) {
      element.style.transform = 'translateX(100%)';
      element.style.opacity = '0';
      setTimeout(() => {
        element.remove();
      }, 300);
    }
  }

  clear() {
    this.toasts.forEach(toast => {
      const element = document.getElementById(toast.id);
      if (element) {
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        setTimeout(() => {
          element.remove();
        }, 300);
      }
    });
    this.toasts = [];
    this.notifyListeners();
  }

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Convenience methods
  success(message: string, duration?: number) {
    return this.show(message, { type: 'success', duration });
  }

  error(message: string, duration?: number) {
    return this.show(message, { type: 'error', duration: duration || 8000 });
  }

  warning(message: string, duration?: number) {
    return this.show(message, { type: 'warning', duration });
  }

  info(message: string, duration?: number) {
    return this.show(message, { type: 'info', duration });
  }
}

// Create global instance
const toastManager = new ToastManager();

// Make it available globally for inline event handlers
if (typeof window !== 'undefined') {
  (window as any).toastManager = toastManager;
}

export const toast = {
  show: (message: string, options?: ToastOptions) => toastManager.show(message, options),
  success: (message: string, duration?: number) => toastManager.success(message, duration),
  error: (message: string, duration?: number) => toastManager.error(message, duration),
  warning: (message: string, duration?: number) => toastManager.warning(message, duration),
  info: (message: string, duration?: number) => toastManager.info(message, duration),
  remove: (id: string) => toastManager.remove(id),
  clear: () => toastManager.clear(),
  subscribe: (listener: (toasts: Toast[]) => void) => toastManager.subscribe(listener)
};