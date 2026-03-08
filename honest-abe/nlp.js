/**
 * HONEST ABE — nlp.js
 *
 * The agent doesn't care who answers.
 * It cares that the answer meets the standard.
 *
 * Provider-agnostic NLP adapter layer.
 * Add new providers by dropping a file in /adapters.
 * Remove broken ones by commenting out one line.
 * The bedrock (pattern matching) never goes away.
 *
 * FREE · FAIR · FIRM · FUN · TRUE · TRANSPARENT · ACCESSIBLE
 */

// ── DEPENDENCIES ─────────────────────────────────────────────────────────
// In browser: load hallucination-guard.js before this file.
// In Node: const { guard, RESULT } = require('./hallucination-guard.js');

// ── PROVIDER REGISTRY ─────────────────────────────────────────────────────
// Priority order: fastest/freest first, local last as deepest fallback.
// Community can propose reordering via agent.js proposal system.
// Each provider must implement: { name, available(), query(prompt) }

const PROVIDERS = [
    () => import('./adapters/puter.js'),        // No key, no account, 500+ models
    () => import('./adapters/mlvoca.js'),        // No key, Ollama-compatible endpoint
    () => import('./adapters/huggingface.js'),   // Free account, open models
    () => import('./adapters/mistral.js'),       // Free tier, privacy-focused
    () => import('./adapters/webllm.js'),        // Fully local, WebGPU, no internet
    () => import('./adapters/pattern.js'),       // Bedrock — always works, no AI
];

// ── STANDARD INTERFACE ────────────────────────────────────────────────────
// Every adapter must implement this. Nothing else is required.
//
//   name        {string}  Human-readable provider name
//   available() {bool}    Can this provider be reached right now?
//   query(prompt) {string} Send prompt, get response text back
//
// That's it. The layer does the rest.

// ── NLP ENGINE ────────────────────────────────────────────────────────────

class NLPEngine {

    constructor() {
        this._cache     = new Map();   // avoid redundant calls
        this._log       = [];          // full audit trail (TRANSPARENT)
        this._active    = null;        // currently working provider
    }

    // Primary interface — call this from truth-model.js
    async analyze(claim, context = {}) {
        const cacheKey = claim.trim().toLowerCase();
        if (this._cache.has(cacheKey)) {
            this._record("cache", "HIT", cacheKey);
            return this._cache.get(cacheKey);
        }

        const prompt = this._buildPrompt(claim, context);

        for (const load of PROVIDERS) {
            let adapter;
            try {
                const mod = await load();
                adapter = mod.default || mod;

                if (!await adapter.available()) {
                    this._record(adapter.name, "UNAVAILABLE", null);
                    continue;
                }

                this._record(adapter.name, "ATTEMPTING", claim.slice(0, 80));
                const raw    = await this._withTimeout(adapter.query(prompt), 8000);
                const parsed = this._parse(raw, adapter.name);

                // ── HALLUCINATION GUARD ───────────────────────────────────
                // Every provider response must pass self-interrogation.
                // If reasoning is internally inconsistent — kill and try next.
                const guarded = guard.interrogate(parsed, claim);

                if (guarded.status === RESULT.KILL) {
                    this._record(adapter.name, "GUARD_KILLED", guarded.reason);
                    continue;  // try next provider
                }

                const result = guarded.result;
                this._record(adapter.name, "SUCCESS", result.pillarAverage);
                this._active = adapter.name;
                this._cache.set(cacheKey, result);
                return result;

            } catch (err) {
                this._record(adapter?.name || "unknown", "FAILED", err.message);
                continue;
            }
        }

        // All providers killed by hallucination guard or failed
        // Never return a guess. Return honest uncertainty.
        return guard.inconclusive(claim, guard.audit().killLog);
    }

    // ── PROMPT ────────────────────────────────────────────────────────────
    // Structured prompt that extracts the 4 pillars from any LLM.
    // Provider-agnostic — works with any model.

    _buildPrompt(claim, context = {}) {
        return `You are an impartial truth analysis engine. Evaluate the following claim strictly on evidence.

CLAIM: "${claim}"
${context.url ? `SOURCE URL: ${context.url}` : ""}
${context.surrounding ? `SURROUNDING TEXT: ${context.surrounding}` : ""}

Respond ONLY with a JSON object in this exact format:
{
  "verifiable": 0.0-1.0,
  "reproducible": 0.0-1.0,
  "contextuallyHonest": 0.0-1.0,
  "falsifiable": 0.0-1.0,
  "incentiveBias": "string or null",
  "framingFlags": ["array of strings"],
  "plainSummary": "1-2 sentence plain English summary",
  "confidence": 0.0-1.0
}

Rules:
- verifiable: can this be traced to a primary source?
- reproducible: would independent sources agree?
- contextuallyHonest: is it framed to mislead even if technically true?
- falsifiable: could evidence disprove this?
- incentiveBias: who benefits if this claim is believed? null if none detected.
- framingFlags: list any manipulation techniques detected
- plainSummary: explain in plain language a 12-year-old could understand
- confidence: how confident are you in this analysis?
Do not include any text outside the JSON object.`;
    }

    // ── PARSE ─────────────────────────────────────────────────────────────
    // Normalize whatever the provider returns into our standard shape.

    _parse(raw, providerName) {
        try {
            const clean = raw.replace(/```json|```/g, "").trim();
            const parsed = JSON.parse(clean);
            return {
                verifiable:        this._clamp(parsed.verifiable),
                reproducible:      this._clamp(parsed.reproducible),
                contextuallyHonest: this._clamp(parsed.contextuallyHonest),
                falsifiable:       this._clamp(parsed.falsifiable),
                incentiveBias:     parsed.incentiveBias || null,
                framingFlags:      Array.isArray(parsed.framingFlags) ? parsed.framingFlags : [],
                plainSummary:      parsed.plainSummary || "",
                confidence:        this._clamp(parsed.confidence),
                provider:          providerName,
                method:            "llm"
            };
        } catch {
            // Provider returned non-JSON — extract what we can
            return this._fallbackResult(raw, providerName);
        }
    }

    // ── HELPERS ───────────────────────────────────────────────────────────

    _clamp(val) {
        const n = parseFloat(val);
        return isNaN(n) ? 0.5 : Math.min(1, Math.max(0, n));
    }

    _withTimeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
            )
        ]);
    }

    _fallbackResult(claim, provider = "pattern") {
        return {
            verifiable:         0.5,
            reproducible:       0.5,
            contextuallyHonest: 0.5,
            falsifiable:        0.5,
            incentiveBias:      null,
            framingFlags:       [],
            plainSummary:       "Analysis unavailable. Manual review recommended.",
            confidence:         0.1,
            provider,
            method:             "fallback"
        };
    }

    _record(provider, status, detail) {
        this._log.push({
            provider,
            status,
            detail,
            timestamp: new Date().toISOString()
        });
    }

    // Full audit — TRANSPARENT is non-negotiable
    audit() {
        return {
            log:            this._log,
            activeProvider: this._active,
            cacheSize:      this._cache.size
        };
    }

    // Clear provider priority — community can reorder
    reorderProviders(newOrder) {
        // newOrder: array of provider names in desired priority
        // Implemented when adapter registry moves to config file
        console.log("[Honest Abe NLP] Provider reorder proposed:", newOrder);
        console.log("[Honest Abe NLP] Requires community approval via agent.js proposal system.");
    }
}

// Singleton — one engine, shared, auditable
const nlp = new NLPEngine();

if (typeof module !== "undefined") module.exports = { NLPEngine, nlp };
