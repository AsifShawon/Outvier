/**
 * search-dashboard.load.js — Baseline Performance & Load Testing Script.
 * Benchmarks the response latency and throughput of public discovery,
 * health liveness/readiness probes, and comparison endpoints.
 */

const http = require('http');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const ENDPOINTS = [
  '/health/live',
  '/health/ready',
  '/api/v1/programs?limit=12',
  '/api/v1/programs?search=computer&level=master',
  '/api/v1/universities?limit=12',
];

async function runBenchmark(endpoint, totalRequests = 50, concurrency = 5) {
  console.log(`\n▶ Benchmarking: ${endpoint} (${totalRequests} requests, concurrency ${concurrency})`);
  let completed = 0;
  let successful = 0;
  let failed = 0;
  const latencies = [];
  const startOverall = Date.now();

  function makeRequest() {
    return new Promise((resolve) => {
      const reqStart = Date.now();
      const url = `${BASE_URL}${endpoint}`;
      http.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const dur = Date.now() - reqStart;
          latencies.push(dur);
          if (res.statusCode >= 200 && res.statusCode < 400) {
            successful++;
          } else {
            failed++;
          }
          completed++;
          resolve();
        });
      }).on('error', () => {
        failed++;
        completed++;
        resolve();
      });
    });
  }

  // Run in concurrent batches
  const batches = Math.ceil(totalRequests / concurrency);
  for (let b = 0; b < batches; b++) {
    const batchPromises = [];
    for (let c = 0; c < concurrency && (b * concurrency + c) < totalRequests; c++) {
      batchPromises.push(makeRequest());
    }
    await Promise.all(batchPromises);
  }

  const durationSec = (Date.now() - startOverall) / 1000;
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = Math.round((completed / durationSec) * 10) / 10;

  console.log(`  ✓ Completed: ${completed} (Success: ${successful}, Failed: ${failed})`);
  console.log(`  ✓ Throughput: ${rps} req/sec`);
  console.log(`  ✓ Latencies: p50=${p50}ms, p95=${p95}ms, p99=${p99}ms`);
}

async function main() {
  console.log(`Starting Outvier API Load Benchmark on ${BASE_URL}...`);
  for (const ep of ENDPOINTS) {
    try {
      await runBenchmark(ep, 20, 4);
    } catch (err) {
      console.warn(`Could not run load test against ${ep}:`, err.message);
    }
  }
  console.log('\nLoad testing complete.');
}

if (require.main === module) {
  main();
}

module.exports = { runBenchmark };
