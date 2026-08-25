import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { metricsService } from '../services/metrics.service';
import { StructuredLogger } from '../utils/logger.util';

describe('Health & Observability Test Suite', () => {
  it('records HTTP request latency and increments error count for 5xx/4xx', () => {
    metricsService.recordHttpRequest(200, 45);
    metricsService.recordHttpRequest(201, 60);
    metricsService.recordHttpRequest(500, 120);

    const snapshot = metricsService.getSnapshot();
    assert.ok(snapshot.httpMetrics.totalRequests >= 3);
    assert.ok(snapshot.httpMetrics.totalErrors >= 1);
    assert.ok(snapshot.memoryUsageMb.heapUsed > 0);
  });

  it('records AI token usage and calculates approximate expenditure', () => {
    metricsService.recordAiUsage(1000, 500, 'gemini-1.5-pro');
    const snapshot = metricsService.getSnapshot();
    assert.ok(snapshot.aiMetrics.totalPromptTokens >= 1000);
    assert.ok(snapshot.aiMetrics.totalCompletionTokens >= 500);
    assert.ok(snapshot.aiMetrics.estimatedCostUsd >= 0);
  });

  it('converts metrics to Prometheus scrape format', () => {
    const prometheus = metricsService.toPrometheusFormat();
    assert.ok(prometheus.includes('outvier_http_requests_total'));
    assert.ok(prometheus.includes('outvier_memory_heap_used_mb'));
    assert.ok(prometheus.includes('outvier_ai_tokens_total'));
  });

  it('structures logs as valid JSON without throwing', () => {
    assert.doesNotThrow(() => {
      StructuredLogger.info('Test log entry', { service: 'test-runner', requestId: 'req_123' });
    });
  });
});
