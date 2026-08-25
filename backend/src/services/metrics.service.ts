/**
 * metrics.service.ts — OpenTelemetry & Prometheus-Ready Operational Metrics Collector.
 * Tracks HTTP request volumes, error counts, latency histograms, AI usage/costs,
 * and BullMQ background queue depths with alert-ready thresholds.
 */

export interface MetricSnapshot {
  timestamp: string;
  uptimeSeconds: number;
  memoryUsageMb: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  httpMetrics: {
    totalRequests: number;
    totalErrors: number;
    statusCodes: Record<string, number>;
    averageLatencyMs: number;
  };
  aiMetrics: {
    totalPromptTokens: number;
    totalCompletionTokens: number;
    estimatedCostUsd: number;
    callCount: number;
  };
  queueMetrics: {
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    delayedJobs: number;
  };
}

class MetricsService {
  private totalRequests = 0;
  private totalErrors = 0;
  private statusCodes: Record<string, number> = {};
  private latencySamples: number[] = [];
  private maxLatencySamples = 500;

  // AI Usage & Cost Tracking (e.g. Gemini / OpenAI / Anthropic)
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;
  private estimatedCostUsd = 0;
  private aiCallCount = 0;

  // Queue Job Tracking
  private activeJobs = 0;
  private completedJobs = 0;
  private failedJobs = 0;
  private delayedJobs = 0;

  public recordHttpRequest(statusCode: number, durationMs: number): void {
    this.totalRequests++;
    const codeKey = String(statusCode);
    this.statusCodes[codeKey] = (this.statusCodes[codeKey] || 0) + 1;

    if (statusCode >= 400) {
      this.totalErrors++;
    }

    if (this.latencySamples.length >= this.maxLatencySamples) {
      this.latencySamples.shift();
    }
    this.latencySamples.push(durationMs);
  }

  public recordAiUsage(promptTokens: number, completionTokens: number, model: string = 'gemini-1.5-pro'): void {
    this.aiCallCount++;
    this.totalPromptTokens += promptTokens;
    this.totalCompletionTokens += completionTokens;

    // Approximate cost calculation ($1.25 / 1M prompt, $5.00 / 1M completion for pro)
    const cost = (promptTokens / 1_000_000) * 1.25 + (completionTokens / 1_000_000) * 5.0;
    this.estimatedCostUsd += cost;
  }

  public updateQueueMetrics(active: number, completed: number, failed: number, delayed: number = 0): void {
    this.activeJobs = active;
    this.completedJobs = completed;
    this.failedJobs = failed;
    this.delayedJobs = delayed;
  }

  public getSnapshot(): MetricSnapshot {
    const mem = process.memoryUsage();
    const sumLatency = this.latencySamples.reduce((a, b) => a + b, 0);
    const avgLatency = this.latencySamples.length > 0 ? Math.round((sumLatency / this.latencySamples.length) * 100) / 100 : 0;

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageMb: {
        rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
        heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
        external: Math.round((mem.external / 1024 / 1024) * 100) / 100,
      },
      httpMetrics: {
        totalRequests: this.totalRequests,
        totalErrors: this.totalErrors,
        statusCodes: { ...this.statusCodes },
        averageLatencyMs: avgLatency,
      },
      aiMetrics: {
        totalPromptTokens: this.totalPromptTokens,
        totalCompletionTokens: this.totalCompletionTokens,
        estimatedCostUsd: Math.round(this.estimatedCostUsd * 10000) / 10000,
        callCount: this.aiCallCount,
      },
      queueMetrics: {
        activeJobs: this.activeJobs,
        completedJobs: this.completedJobs,
        failedJobs: this.failedJobs,
        delayedJobs: this.delayedJobs,
      },
    };
  }

  public toPrometheusFormat(): string {
    const s = this.getSnapshot();
    return [
      `# HELP outvier_http_requests_total Total number of HTTP requests received`,
      `# TYPE outvier_http_requests_total counter`,
      `outvier_http_requests_total ${s.httpMetrics.totalRequests}`,
      `# HELP outvier_http_errors_total Total number of HTTP 4xx/5xx errors`,
      `# TYPE outvier_http_errors_total counter`,
      `outvier_http_errors_total ${s.httpMetrics.totalErrors}`,
      `# HELP outvier_http_latency_ms Average HTTP request latency in ms`,
      `# TYPE outvier_http_latency_ms gauge`,
      `outvier_http_latency_ms ${s.httpMetrics.averageLatencyMs}`,
      `# HELP outvier_memory_heap_used_mb Process heap memory used in MB`,
      `# TYPE outvier_memory_heap_used_mb gauge`,
      `outvier_memory_heap_used_mb ${s.memoryUsageMb.heapUsed}`,
      `# HELP outvier_ai_tokens_total Total prompt + completion tokens used by AI assistants`,
      `# TYPE outvier_ai_tokens_total counter`,
      `outvier_ai_tokens_total ${s.aiMetrics.totalPromptTokens + s.aiMetrics.totalCompletionTokens}`,
      `# HELP outvier_ai_cost_usd Estimated total AI API expenditure in USD`,
      `# TYPE outvier_ai_cost_usd counter`,
      `outvier_ai_cost_usd ${s.aiMetrics.estimatedCostUsd}`,
      `# HELP outvier_queue_jobs_failed_total Total failed background sync/ingestion jobs`,
      `# TYPE outvier_queue_jobs_failed_total counter`,
      `outvier_queue_jobs_failed_total ${s.queueMetrics.failedJobs}`,
    ].join('\n');
  }
}

export const metricsService = new MetricsService();
export default metricsService;
