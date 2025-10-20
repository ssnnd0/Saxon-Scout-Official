// Global type declarations for Saxon Scout
// Extends the Window interface with custom properties

declare global {
  interface Window {
    __saxon_app_ready?: boolean;
    __saxon_app_error?: any;
    deferredPrompt?: any;
  }
}

export {};
