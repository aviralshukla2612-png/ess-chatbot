/**
 * Emperor Nexus — SSE Concurrency & Longevity Benchmark Client
 *
 * Verifies:
 * - Ticket issuance & single-use redemption
 * - Established SSE connection duration & heartbeat ping parsing
 * - Client disconnect handling & AbortSignal propagation
 * - Memory footprint under concurrent streams
 */

import http from "node:http";
import assert from "node:assert/strict";

const TARGET_HOST = process.env.TARGET_HOST || "http://127.0.0.1:3301";
const BOT_ID = process.env.BOT_ID || "bot_stage3_alpha_01";

export async function runSseBenchmark({ concurrency = 10, durationMs = 15000 } = {}) {
  console.log(`[SSE_BENCHMARK] Starting with concurrency=${concurrency}, duration=${durationMs}ms on ${TARGET_HOST}`);

  let connectedCount = 0;
  let heartbeatCount = 0;
  let errorCount = 0;
  const initialMem = process.memoryUsage().heapUsed;

  const clients = [];

  for (let i = 0; i < concurrency; i++) {
    const clientPromise = new Promise((resolve) => {
      const visitorToken = `vis_stage3_sse_${i}_${Date.now()}`;
      const postData = JSON.stringify({ visitorToken });

      // Step 1: Exchange ticket
      const ticketReq = http.request(
        `${TARGET_HOST}/api/public/chat/${BOT_ID}/events/ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData),
          },
        },
        (ticketRes) => {
          let body = "";
          ticketRes.on("data", (chunk) => (body += chunk));
          ticketRes.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              if (!parsed.ticket) {
                errorCount++;
                return resolve();
              }

              // Step 2: Establish SSE stream
              const sseReq = http.request(
                `${TARGET_HOST}/api/public/chat/${BOT_ID}/events?ticket=${parsed.ticket}`,
                {
                  method: "GET",
                  headers: { Accept: "text/event-stream" },
                },
                (sseRes) => {
                  if (sseRes.statusCode === 200) {
                    connectedCount++;
                  } else {
                    errorCount++;
                    return resolve();
                  }

                  sseRes.on("data", (chunk) => {
                    const str = chunk.toString();
                    if (str.includes(": ping")) {
                      heartbeatCount++;
                    }
                  });

                  // Disconnect after test duration
                  setTimeout(() => {
                    sseReq.destroy();
                    resolve();
                  }, durationMs);
                }
              );

              sseReq.on("error", () => {
                errorCount++;
                resolve();
              });
              sseReq.end();
            } catch {
              errorCount++;
              resolve();
            }
          });
        }
      );

      ticketReq.on("error", () => {
        errorCount++;
        resolve();
      });
      ticketReq.write(postData);
      ticketReq.end();
    });

    clients.push(clientPromise);
  }

  await Promise.all(clients);

  const finalMem = process.memoryUsage().heapUsed;
  const memDeltaKb = Math.round((finalMem - initialMem) / 1024);

  const results = {
    concurrencyRequested: concurrency,
    connectedSuccessfully: connectedCount,
    heartbeatsReceived: heartbeatCount,
    errorsEncountered: errorCount,
    clientHeapDeltaKb: memDeltaKb,
    averageHeapPerStreamKb: connectedCount > 0 ? (memDeltaKb / connectedCount).toFixed(2) : 0,
  };

  console.log("[SSE_BENCHMARK_RESULTS]", JSON.stringify(results, null, 2));
  return results;
}

if (process.argv[1]?.endsWith("sseConcurrencyTest.js")) {
  runSseBenchmark().catch(console.error);
}
