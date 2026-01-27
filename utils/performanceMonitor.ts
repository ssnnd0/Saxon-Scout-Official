class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private metrics: Map<string, number[]> = new Map();

  /**
   * Start measuring time for a metric
   */
  startMeasure(label: string) {
    this.marks.set(label, performance.now());
  }

  /**
   * End measuring and store the duration
   */
  endMeasure(label: string): number | null {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`No start mark for ${label}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    // Store the metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    return duration;
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(label: string): number | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    const result: Record<string, { count: number; average: number; min: number; max: number }> = {};

    this.metrics.forEach((values, label) => {
      if (values.length > 0) {
        result[label] = {
          count: values.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    return result;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.marks.clear();
    this.metrics.clear();
  }

  /**
   * Print metrics to console
   */
  printMetrics() {
    const metrics = this.getMetrics();
    console.table(metrics);
  }

  /**
   * Check if memory is available and log
   */
  logMemoryUsage() {
    const perfMemory = (performance as any).memory;
    if (perfMemory) {
      console.log('Memory Usage:', {
        usedJSHeapSize: `${Math.round(perfMemory.usedJSHeapSize / 1048576)} MB`,
        totalJSHeapSize: `${Math.round(perfMemory.totalJSHeapSize / 1048576)} MB`,
        jsHeapSizeLimit: `${Math.round(perfMemory.jsHeapSizeLimit / 1048576)} MB`
      });
    }
  }

  /**
   * Get core web vitals
   */
  getCoreWebVitals() {
    return {
      navigationTiming: performance.getEntriesByType('navigation')[0],
      paintEntries: performance.getEntriesByType('paint'),
      resourceEntries: performance.getEntriesByType('resource')
    };
  }
}

export const perfMonitor = new PerformanceMonitor();
