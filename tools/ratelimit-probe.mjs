// language: JS, file: tools/ratelimit-probe.mjs, runtime: node >=18 (global fetch)
//
// Rate-limit probe for a NestJS + @nestjs/throttler service.
// Drives concurrent HTTP against one endpoint and classifies every response,
// then verifies the window actually recovers.
//
// *the throttler guard runs BEFORE the JWT guard in app.module.ts order only by
//  accident of registration order; guards execute in provider order, so a public
//  route still burns throttle budget. This probe proves which one happens.*

const TARGET = process.argv[2] ?? 'http://localhost:3000/api/v1/health';
const BURST = Number(process.argv[3] ?? 60);
const CONCURRENCY = Number(process.argv[4] ?? 10);

const RATE_HEADERS = ['retry-after', 'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'];

async function probe(label, count, concurrency) {
  const started = process.hrtime.bigint();
  const results = [];
  let cursor = 0;

  async function worker() {
    for (;;) {
      const index = cursor++;
      if (index >= count) return;
      const t0 = process.hrtime.bigint();
      try {
        const res = await fetch(TARGET, { headers: { accept: 'application/json' } });
        const body = await res.text();
        results.push({
          index,
          status: res.status,
          ms: Number(process.hrtime.bigint() - t0) / 1e6,
          headers: Object.fromEntries(RATE_HEADERS.filter((h) => res.headers.has(h)).map((h) => [h, res.headers.get(h)])),
          body: body.slice(0, 200),
        });
      } catch (err) {
        results.push({ index, status: 0, ms: Number(process.hrtime.bigint() - t0) / 1e6, headers: {}, body: String(err) });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, count) }, worker));
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  return { label, elapsedMs, results };
}

function summarize({ label, elapsedMs, results }) {
  const byStatus = new Map();
  for (const r of results) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);

  const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
  const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))]?.toFixed(1) ?? 'n/a';

  const firstThrottleIndex = results.filter((r) => r.status === 429).map((r) => r.index).sort((a, b) => a - b)[0];
  const rateHeaders = results.find((r) => Object.keys(r.headers).length > 0)?.headers ?? {};

  console.log(`\n=== ${label} ===`);
  console.log(`requests   ${results.length}  concurrency-limited  elapsed ${elapsedMs.toFixed(1)}ms  rps ${(results.length / (elapsedMs / 1000)).toFixed(1)}`);
  console.log(`statuses   ${[...byStatus].sort((a, b) => a - b).map(([s, n]) => `${s}x${n}`).join('  ')}`);
  console.log(`latency    p50 ${pct(0.5)}ms  p95 ${pct(0.95)}ms  max ${latencies.at(-1)?.toFixed(1)}ms`);
  if (Object.keys(rateHeaders).length) console.log(`headers    ${JSON.stringify(rateHeaders)}`);
  if (firstThrottleIndex !== undefined) console.log(`first 429 at request #${firstThrottleIndex + 1}`);
  const sample429 = results.find((r) => r.status === 429);
  if (sample429) console.log(`429 body   ${sample429.body}`);
  return { results, firstThrottleIndex };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const baseline = summarize(await probe('baseline (cold window)', 1, 1));
const burst = summarize(await probe(`burst (${BURST} req, conc ${CONCURRENCY})`, BURST, CONCURRENCY));
const allowed = burst.results.filter((r) => r.status !== 429).length;

console.log(`\n>>> allowed ${allowed} / ${BURST} before throttling`);

console.log('\nwaiting 65s for the 60s ttl window to drain...');
await sleep(65_000);
const after = summarize(await probe('after window reset', 3, 1));

const recovered = after.results.every((r) => r.status === 200);
console.log(`\nVERDICT  limit-honoured=${allowed < BURST}  allowed=${allowed}  recovered-after-ttl=${recovered}`);
console.log(baseline.results[0].status === 200 ? 'baseline 200 OK' : `baseline was ${baseline.results[0].status}`);
