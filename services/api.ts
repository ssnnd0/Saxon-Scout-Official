import { MatchData } from '../types';
import { getSettings } from './storageService';

const DEFAULT_TIMEOUT = 5000;

class ApiService {
  private getBaseUrl() {
    const { syncServerUrl } = getSettings();
    // Fallback or assume relative path if hosted together
    return syncServerUrl ? syncServerUrl.replace(/\/$/, '') : '/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async getAllMatches(): Promise<MatchData[]> {
    const { eventCode } = getSettings();
    // Query param to filter by event if supported by backend
    return this.request<MatchData[]>(`/matches?event=${eventCode}`);
  }

  async saveMatch(match: MatchData): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/matches', {
      method: 'POST',
      body: JSON.stringify(match),
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = new ApiService();
