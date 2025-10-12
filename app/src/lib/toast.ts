export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

let toastContainer: HTMLElement | null = null;

function getToastContainer(): HTMLElement {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function createToastElement(toast: Toast): HTMLElement {
  const toastEl = document.createElement('div');
  toastEl.id = `toast-${toast.id}`;
  toastEl.className = `toast-item toast-${toast.type}`;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  toastEl.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    animation: slideIn 0.3s ease-out;
    border-left: 4px solid ${colors[toast.type]};
  `;

  toastEl.innerHTML = `
    <i class="fa ${icons[toast.type]}" style="color: ${colors[toast.type]}; font-size: 1.25rem;"></i>
    <span style="flex: 1; color: #374151; font-weight: 500;">${toast.message}</span>
    <button class="toast-close" style="background: none; border: none; color: #9ca3af; cursor: pointer; padding: 4px; font-size: 1.25rem;">
      <i class="fa fa-times"></i>
    </button>
  `;

  const closeBtn = toastEl.querySelector('.toast-close');
  closeBtn?.addEventListener('click', () => removeToast(toast.id));

  return toastEl;
}

function removeToast(id: string) {
  const toastEl = document.getElementById(`toast-${id}`);
  if (toastEl) {
    toastEl.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      toastEl.remove();
      if (toastContainer && toastContainer.children.length === 0) {
        toastContainer.remove();
        toastContainer = null;
      }
    }, 300);
  }
}

export function showToast(type: ToastType, message: string, duration: number = 4000): string {
  const id = `${Date.now()}-${Math.random()}`;
  const toast: Toast = { id, type, message, duration };

  const container = getToastContainer();
  const toastEl = createToastElement(toast);
  container.appendChild(toastEl);

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }

  return id;
}

export const toast = {
  success: (message: string, duration?: number) => showToast('success', message, duration),
  error: (message: string, duration?: number) => showToast('error', message, duration),
  warning: (message: string, duration?: number) => showToast('warning', message, duration),
  info: (message: string, duration?: number) => showToast('info', message, duration)
};

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  .toast-close:hover {
    color: #374151 !important;
  }

  @media (max-width: 576px) {
    #toast-container {
      right: 10px;
      left: 10px;
      max-width: none;
    }

    .toast-item {
      min-width: 0 !important;
    }
  }
`;
document.head.appendChild(style);
