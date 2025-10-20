// PWA Service Worker Registration
// This file should be imported in main.tsx

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers not supported in this browser');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    console.log('Service Worker registered successfully:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is ready, notify user
          console.log('New version of Saxon Scout is available');
          showUpdateNotification();
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}

function showUpdateNotification() {
  // Show a notification to the user that an update is available
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Saxon Scout Update', {
      body: 'A new version is available. Refresh to update.',
      icon: '/app/assets/Logo+611.png',
      badge: '/app/assets/Logo+611.png'
    });
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Check if app is installable (PWA criteria)
export function isPWAInstallable(): boolean {
  return (
    'serviceWorker' in navigator &&
    'caches' in window &&
    'indexedDB' in window &&
    'showDirectoryPicker' in window
  );
}

// Request the app to be installed
export async function installApp() {
  // This will be triggered by the deferredPrompt from beforeinstallprompt event
  const event = (window as any).deferredPrompt;
  if (!event) {
    console.log('App installation not available');
    return;
  }

  event.prompt();
  const { outcome } = await event.userChoice;
  console.log(`User response to the install prompt: ${outcome}`);

  (window as any).deferredPrompt = null;
}

// Listen for beforeinstallprompt and defer it
export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    (window as any).deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    (window as any).deferredPrompt = null;
    hideInstallButton();
  });
}

function showInstallButton() {
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.style.display = 'block';
}

function hideInstallButton() {
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.style.display = 'none';
}
