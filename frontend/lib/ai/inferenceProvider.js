/**
 * Unified Inference Provider Abstraction (Local Ollama, Groq LPU, vLLM, and Mock)
 * Provides standardized request/response contracts, bounded concurrency,
 * cancellation, and circuit-breaking.
 */

class ConcurrencyLimiter {
  constructor(maxConcurrent = 15, maxQueue = 50) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueue = maxQueue;
    this.activeCount = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      return () => this.release();
    }
    if (this.queue.length >= this.maxQueue) {
      throw new Error("Provider overloaded: concurrency limit and queue capacity reached.");
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.activeCount++;
        resolve(() => this.release());
      });
    });
  }

  release() {
    this.activeCount--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    }
  }
}

const globalLimiter = new ConcurrencyLimiter(20, 60);

export class InferenceProvider {
  /**
   * Unified generation entrypoint
   */
  static async generate({
    provider = null, // "groq", "ollama", "vllm", "mock"
    model = null,
    messages = [],
    temperature = 0.3,
    maxTokens = 512,
    stopTokens = [],
    stream = false,
    onToken = null,
    timeoutMs = 45000,
  }) {
    const release = await globalLimiter.acquire();
    const startTime = Date.now();

    try {
      const defaultEnvProvider = (process.env.DEFAULT_AI_PROVIDER || "").toLowerCase();
      const { GroqKeyPoolManager } = await import("./groqKeyPool.js");
      const hasPoolKeys = GroqKeyPoolManager.hasAvailableKeys();
      const hasValidGroqKey = hasPoolKeys || Boolean(
        process.env.GROQ_API_KEY &&
        process.env.GROQ_API_KEY.trim().length > 10 &&
        !process.env.GROQ_API_KEY.includes("your_groq_api_key")
      );

      let selectedProvider = (provider || defaultEnvProvider || (hasValidGroqKey ? "groq" : "ollama")).toLowerCase();

      // If groq was requested but no valid key exists, fallback immediately to local Ollama
      if (selectedProvider === "groq" && !hasValidGroqKey) {
        console.warn("[INFERENCE] GROQ_API_KEY is missing or placeholder. Using local Ollama...");
        selectedProvider = "ollama";
      }

      switch (selectedProvider) {
        case "groq":
          try {
            return await InferenceProvider._callGroq({
              model: model || process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
              messages,
              temperature,
              maxTokens,
              stream,
              onToken,
              timeoutMs,
            });
          } catch (groqErr) {
            console.warn(`[INFERENCE_FALLBACK] Groq error (${groqErr.message}). Automatically falling back to local Ollama container...`);
            return await InferenceProvider._callOllama({
              model: process.env.CHAT_MODEL || "llama3.2:1b",
              endpoint: process.env.OLLAMA_URL || "http://127.0.0.1:11434",
              messages,
              temperature,
              maxTokens,
              stopTokens,
              stream,
              onToken,
              timeoutMs,
            });
          }

        case "vllm":
          return await InferenceProvider._callVllm({
            model: model || process.env.VLLM_MODEL || "meta-llama/Llama-3.2-3B-Instruct",
            endpoint: process.env.VLLM_URL || "http://127.0.0.1:8000/v1",
            messages,
            temperature,
            maxTokens,
            stream,
            onToken,
            timeoutMs,
          });

        case "mock":
          return await InferenceProvider._callMock({ messages, onToken, stream });

        case "ollama":
        default:
          return await InferenceProvider._callOllama({
            model: model || process.env.CHAT_MODEL || "llama3.2:1b",
            endpoint: process.env.OLLAMA_URL || "http://127.0.0.1:11434",
            messages,
            temperature,
            maxTokens,
            stopTokens,
            stream,
            onToken,
            timeoutMs,
          });
      }
    } finally {
      release();
      const elapsed = Date.now() - startTime;
      console.log(`[INFERENCE] Completed in ${elapsed}ms`);
    }
  }

  // --- Groq LPU Adapter with Multi-Key Pool Rotation & 429 Auto-Failover ---
  static async _callGroq({ model, messages, temperature, maxTokens, stream, onToken, timeoutMs }) {
    const { GroqKeyPoolManager } = await import("./groqKeyPool.js");
    
    // Attempt with up to 3 pool keys before bailing out
    const MAX_KEY_ATTEMPTS = 3;
    let attempts = 0;
    let lastError = null;

    while (attempts < MAX_KEY_ATTEMPTS) {
      attempts++;
      const keyObj = GroqKeyPoolManager.getNextKey();
      const apiKey = keyObj?.apiKey || process.env.GROQ_API_KEY;

      if (!apiKey) {
        throw new Error("GROQ_API_KEY or key pool is missing.");
      }

      const candidateModels = [
        model,
        process.env.GROQ_MODEL,
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
      ].filter(Boolean);

      const uniqueModels = [...new Set(candidateModels)];

      for (const targetModel of uniqueModels) {
        try {
          const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: targetModel,
              messages,
              temperature,
              max_tokens: maxTokens,
              stream: Boolean(stream && onToken),
            }),
            signal: AbortSignal.timeout(timeoutMs),
          });

          if (!res.ok) {
            const errBody = await res.text();
            
            // Check for Rate Limit (429) -> Auto-Failover to next key in pool
            if (res.status === 429 || errBody.includes("rate_limit_exceeded")) {
              console.warn(`[GROQ_RATE_LIMIT] Key '${keyObj?.label || "primary"}' received 429. Rotating key...`);
              if (keyObj?.id) {
                GroqKeyPoolManager.markRateLimited(keyObj.id, 60, "Rate limit reached (429)");
              }
              lastError = new Error(`Groq 429 Rate Limit: ${errBody}`);
              break; // break model loop to try next key in pool
            }

            if (res.status === 401 || res.status === 403) {
              if (keyObj?.id) {
                GroqKeyPoolManager.markError(keyObj.id, `Invalid key / Auth error (${res.status})`);
              }
              lastError = new Error(`Groq Auth error ${res.status}: ${errBody}`);
              break; // break to try next key
            }

            if (res.status === 404 || errBody.includes("model_not_found") || errBody.includes("does not exist")) {
              console.warn(`[GROQ] Model '${targetModel}' not available on this account, trying fallback model...`);
              lastError = new Error(`Groq API error ${res.status}: ${errBody}`);
              continue;
            }
            throw new Error(`Groq API error ${res.status}: ${errBody}`);
          }

          if (stream && onToken && res.body) {
            const content = await InferenceProvider._consumeOpenAiStream(res.body, onToken);
            // Calculate accurate conversational tokens (prompt overhead from messages + completion tokens)
            const promptEstTokens = Math.round(JSON.stringify(messages || []).length / 3.8);
            const completionEstTokens = Math.round((content || "").split(/\s+/).length * 1.35);
            const approxTokens = Math.max(450, promptEstTokens + completionEstTokens);
            GroqKeyPoolManager.recordSuccess(keyObj?.id || keyObj?.apiKey || "primary", approxTokens);
            return content;
          } else {
            const data = await res.json();
            const promptEstTokens = Math.round(JSON.stringify(messages || []).length / 3.8);
            const completionEstTokens = Math.round((data.choices?.[0]?.message?.content || "").split(/\s+/).length * 1.35);
            const totalTokens = data.usage?.total_tokens || Math.max(450, promptEstTokens + completionEstTokens);
            GroqKeyPoolManager.recordSuccess(keyObj?.id || keyObj?.apiKey || "primary", totalTokens);
            return data.choices?.[0]?.message?.content || "";
          }
        } catch (err) {
          lastError = err;
          if (err.message && (err.message.includes("model_not_found") || err.message.includes("does not exist"))) {
            continue;
          }
          if (err.message && (err.message.includes("429") || err.message.includes("Rate Limit"))) {
            break;
          }
          throw err;
        }
      }
    }

    throw lastError || new Error("All Groq key pool attempts exhausted.");
  }

  // --- vLLM Adapter (OpenAI-compatible) ---
  static async _callVllm({ model, endpoint, messages, temperature, maxTokens, stream, onToken, timeoutMs }) {
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: Boolean(stream && onToken),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) throw new Error(`vLLM error ${res.status}`);

    if (stream && onToken && res.body) {
      return await InferenceProvider._consumeOpenAiStream(res.body, onToken);
    } else {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    }
  }

  // --- Ollama Adapter ---
  static async _callOllama({ model, endpoint, messages, temperature, maxTokens, stopTokens, stream, onToken, timeoutMs }) {
    const stops = [
      "\nUser:", "User:", "\nHuman:", "\nAssistant:", "\nYou:", "<|eot_id|>",
      ...(Array.isArray(stopTokens) ? stopTokens : []),
    ];

    let targetModel = model;

    // Try primary model first, fallback to available tags if 404 or missing
    let res;
    try {
      res = await fetch(`${endpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: targetModel,
          keep_alive: "24h",
          messages,
          stream: Boolean(stream && onToken),
          options: {
            temperature,
            num_predict: maxTokens,
            num_ctx: 2048,
            stop: stops,
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      // If requested model (e.g. llama3.2:1b) was not found (HTTP 404), discover installed models
      if (!res.ok && res.status === 404) {
        try {
          const tagsRes = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
          if (tagsRes.ok) {
            const data = await tagsRes.json();
            const models = (data.models || []).map((m) => m.name);
            const chatCandidate = models.find((m) => !m.includes("embed")) || models[0];
            if (chatCandidate && chatCandidate !== targetModel) {
              console.log(`[OLLAMA_FALLBACK] Model '${targetModel}' not found. Automatically switching to installed model: '${chatCandidate}'`);
              targetModel = chatCandidate;
              res = await fetch(`${endpoint}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: targetModel,
                  keep_alive: "24h",
                  messages,
                  stream: Boolean(stream && onToken),
                  options: {
                    temperature,
                    num_predict: maxTokens,
                    num_ctx: 2048,
                    stop: stops,
                  },
                }),
                signal: AbortSignal.timeout(timeoutMs),
              });
            }
          }
        } catch (discoverErr) {}
      }
    } catch (netErr) {
      throw new Error(`Ollama connection error: ${netErr.message}`);
    }

    if (!res || !res.ok) throw new Error(`Ollama error HTTP ${res?.status || "Unknown"}`);

    if (stream && onToken && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            try {
              const json = JSON.parse(trimmed);
              const token = json.message?.content || "";
              if (token) {
                fullText += token;
                onToken(token);
              }
            } catch (e) {}
          }
        }
      }
      const approxTokens = Math.max(25, Math.round((fullText || "").split(/\s+/).length * 1.3) + 60);
      try {
        const { GroqKeyPoolManager } = await import("./groqKeyPool.js");
        GroqKeyPoolManager.recordSuccess("primary", approxTokens);
      } catch {}
      return fullText;
    } else {
      const data = await res.json();
      const content = data.message?.content || "";
      const approxTokens = Math.max(25, Math.round((content || "").split(/\s+/).length * 1.3) + 60);
      try {
        const { GroqKeyPoolManager } = await import("./groqKeyPool.js");
        GroqKeyPoolManager.recordSuccess("primary", approxTokens);
      } catch {}
      return content;
    }
  }

  // --- Mock Provider for Testing ---
  static async _callMock({ messages, onToken, stream }) {
    const query = messages[messages.length - 1]?.content || "Inquiry";
    const reply = `Mock response: Verified facts for query "${query.slice(0, 30)}". Emperor Smart Solutions was founded by Yash Sharma and Karan Makwana.`;
    if (stream && onToken) {
      for (const word of reply.split(" ")) {
        onToken(word + " ");
      }
    }
    return reply;
  }

  // Helper for consuming standard OpenAI SSE streams (Groq & vLLM)
  static async _consumeOpenAiStream(body, onToken) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ") && trimmed !== "data: [DONE]") {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content || "";
            if (delta) {
              fullText += delta;
              onToken(delta);
            }
          } catch (e) {}
        }
      }
    }
    return fullText;
  }
}
