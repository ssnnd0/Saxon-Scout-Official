import { MatchData } from '../types';
import { mergeMatches, getMatches } from './storageService';
import { apiService } from './api';

class SyncService {
  public isConnected: boolean = false;
  private statusCallback: ((status: boolean) => void) | null = null;
  private matchListeners: Set<() => void> = new Set();
  private pollingInterval: number | null = null;
  private isSyncing: boolean = false;

  async init() {
    // Initial sync on load
    await this.sync();
    
    // Start polling for updates (every 30 seconds)
    this.startPolling();
  }

  private startPolling() {
    if (this.pollingInterval) return;
    
    // Poll every 30 seconds
    this.pollingInterval = window.setInterval(async () => {
      await this.sync();
    }, 30000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Pulls latest data from Server (Postgres) and merges into Local Storage
   */
  async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const remoteMatches = await apiService.getAllMatches();
      
      if (remoteMatches && Array.isArray(remoteMatches)) {
        mergeMatches(remoteMatches);
        this.notifyMatchListeners();
        this.updateStatus(true);
      }
    } catch (error) {
      console.warn('SyncService: Failed to fetch from server', error);
      this.updateStatus(false);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pushes a single match to the Server (Postgres)
   */
  async uploadMatch(match: MatchData) {
    try {
      await apiService.saveMatch(match);
      this.updateStatus(true);
      // Optional: Immediately sync back to ensure consistency if the server adds metadata
      // this.sync(); 
    } catch (error) {
      console.error('SyncService: Upload failed', error);
      this.updateStatus(false);
      // Data remains in localStorage via storageService, so no data loss.
      // Next sync/upload attempt will handle it.
    }
  }

  onStatusChange(cb: (status: boolean) => void) {
    this.statusCallback = cb;
    cb(this.isConnected);
  }

  onMatchesUpdated(cb: () => void) {
      this.matchListeners.add(cb);
      return () => {
          this.matchListeners.delete(cb);
      };
  }

  private updateStatus(status: boolean) {
    if (this.isConnected !== status) {
        this.isConnected = status;
        if (this.statusCallback) this.statusCallback(status);
    }
  }

  private notifyMatchListeners() {
      this.matchListeners.forEach(cb => cb());
  }

  // Legacy method signature compatibility
  uploadMatchDebounced(match: MatchData, delay: number = 1000) {
      // In HTTP context, simple debouncing on the UI side (App.tsx) is preferred 
      // to avoid too many POST requests. App.tsx already handles this.
      this.uploadMatch(match);
  }
}

export const syncService = new SyncService();