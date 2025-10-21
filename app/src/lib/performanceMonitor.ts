/**
 * Performance Monitoring Utility
 * Tracks and reports application performance metrics
 */

// Performance metrics interface
interface PerformanceMetrics {
  navigationStart?: number;
  loadComplete?: number;
  firstContentfulPaint?: number;
  timeToInteractive?: number;
  apiCallTimes: Record<string, number[]>;
  componentRenderTimes: Record<string, number[]>;
  resourceLoadTimes: Record<string, number[]>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    apiCallTimes: {},
    componentRenderTimes: {},
    resourceLoadTimes: {}
  };
  
  private enabled: boolean = true;
  
  constructor() {
    // Initialize navigation timing
    if (window.performance && window.performance.timing) {
      this.metrics.navigationStart = window.performance.timing.navigationStart;
    }
    
    // Listen for first contentful paint
    this.observePaint();
    
    // Mark load complete when window loads
    window.addEventListener('load', () => {
      this.metrics.loadComplete = performance.now();
      this.logMetrics('Initial Load Complete');
    });
  }
  
  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Start timing an operation
   * @param category Category of operation (api, component, resource)
   * @param name Name of the operation
   * @returns Timing function to call when operation completes
   */
  startTiming(category: 'api' | 'component' | 'resource', name: string): () => void {
    if (!this.enabled) return () => {};
    
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      switch (category) {
        case 'api':
          if (!this.metrics.apiCallTimes[name]) {
            this.metrics.apiCallTimes[name] = [];
          }
          this.metrics.apiCallTimes[name].push(duration);
          break;
          
        case 'component':
          if (!this.metrics.componentRenderTimes[name]) {
            this.metrics.componentRenderTimes[name] = [];
          }
          this.metrics.componentRenderTimes[name].push(duration);
          break;
          
        case 'resource':
          if (!this.metrics.resourceLoadTimes[name]) {
            this.metrics.resourceLoadTimes[name] = [];
          }
          this.metrics.resourceLoadTimes[name].push(duration);
          break;
      }
      
      // Log if duration is excessive
      if (duration > 500) {
        console.warn(`Performance: ${category} "${name}" took ${duration.toFixed(2)}ms`);
      }
    };
  }
  
  /**
   * Observe paint timing events
   */
  private observePaint(): void {
    if (!this.enabled || !window.PerformanceObserver) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
          }
        }
      });
      
      observer.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.error('Performance observer not supported', e);
    }
  }
  
  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Log current performance metrics
   */
  logMetrics(label: string = 'Performance Metrics'): void {
    if (!this.enabled) return;
    
    console.group(label);
    
    // Log page load metrics
    if (this.metrics.navigationStart && this.metrics.loadComplete) {
      console.log(`Total Load Time: ${(this.metrics.loadComplete - this.metrics.navigationStart).toFixed(2)}ms`);
    }
    
    if (this.metrics.firstContentfulPaint) {
      console.log(`First Contentful Paint: ${this.metrics.firstContentfulPaint.toFixed(2)}ms`);
    }
    
    // Log API call metrics
    if (Object.keys(this.metrics.apiCallTimes).length > 0) {
      console.group('API Call Times (avg/last/count)');
      for (const [name, times] of Object.entries(this.metrics.apiCallTimes)) {
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        console.log(`${name}: ${avg.toFixed(2)}ms / ${times[times.length - 1]?.toFixed(2) || 0}ms / ${times.length} calls`);
      }
      console.groupEnd();
    }
    
    // Log component render metrics
    if (Object.keys(this.metrics.componentRenderTimes).length > 0) {
      console.group('Component Render Times (avg/last/count)');
      for (const [name, times] of Object.entries(this.metrics.componentRenderTimes)) {
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        console.log(`${name}: ${avg.toFixed(2)}ms / ${times[times.length - 1]?.toFixed(2) || 0}ms / ${times.length} renders`);
      }
      console.groupEnd();
    }
    
    console.groupEnd();
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = {
      navigationStart: this.metrics.navigationStart || Date.now(),
      apiCallTimes: {},
      componentRenderTimes: {},
      resourceLoadTimes: {}
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export singleton
export default performanceMonitor;