/**
 * IndexedDB wrapper for large-scale data storage
 * Automatically falls back to localStorage for small data
 */

import { analytics } from '../services/analyticsService';

const DB_NAME = 'SaxonScout';
const DB_VERSION = 1;
const STORE_NAME = 'matches';

class LocalDatabase {
  private db: IDBDatabase | null = null;
  private isSupported: boolean = !!window.indexedDB;

  constructor() {
    if (this.isSupported) {
      this.init();
    }
  }

  private async init() {
    try {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          analytics.info('db', 'IndexedDB initialized');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            analytics.info('db', 'Object store created');
          }
        };
      });
    } catch (error) {
      analytics.warn('db', 'Failed to initialize IndexedDB', { error: String(error) });
      this.isSupported = false;
    }
  }

  async save(key: string, data: any): Promise<void> {
    if (!this.isSupported || !this.db) {
      // Fallback to localStorage
      localStorage.setItem(key, JSON.stringify(data));
      return;
    }

    try {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id: key, data, timestamp: Date.now() });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          analytics.debug('db', `Saved to IndexedDB: ${key}`);
          resolve();
        };
      });
    } catch (error) {
      analytics.warn('db', 'Failed to save to IndexedDB, using localStorage', { error: String(error) });
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  async load(key: string): Promise<any> {
    if (!this.isSupported || !this.db) {
      // Fallback to localStorage
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }

    try {
      return new Promise<any>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            analytics.debug('db', `Loaded from IndexedDB: ${key}`);
            resolve(result.data);
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      analytics.warn('db', 'Failed to load from IndexedDB, trying localStorage', { error: String(error) });
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isSupported || !this.db) {
      localStorage.removeItem(key);
      return;
    }

    try {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          analytics.debug('db', `Deleted from IndexedDB: ${key}`);
          resolve();
        };
      });
    } catch (error) {
      analytics.warn('db', 'Failed to delete from IndexedDB', { error: String(error) });
      localStorage.removeItem(key);
    }
  }

  async clear(): Promise<void> {
    if (!this.isSupported || !this.db) {
      localStorage.clear();
      return;
    }

    try {
      return new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          analytics.info('db', 'IndexedDB cleared');
          resolve();
        };
      });
    } catch (error) {
      analytics.warn('db', 'Failed to clear IndexedDB', { error: String(error) });
      localStorage.clear();
    }
  }

  async getSize(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      } catch (error) {
        analytics.warn('db', 'Failed to get storage estimate', { error: String(error) });
      }
    }

    return { usage: 0, quota: 0 };
  }

  isIndexedDBSupported(): boolean {
    return this.isSupported;
  }

  async getAllKeys(): Promise<string[]> {
    if (!this.isSupported || !this.db) {
      return Object.keys(localStorage);
    }

    try {
      return new Promise<string[]>((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          resolve((request.result as string[]) || []);
        };
      });
    } catch (error) {
      return Object.keys(localStorage);
    }
  }
}

export const localDB = new LocalDatabase();
