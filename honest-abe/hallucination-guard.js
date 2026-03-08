/**
 * HONEST ABE — hallucination-guard.js
 *
 * Abe doesn't need to know if something is true
 * to know if he's hallucinating.
 * He just needs to recognize when his own reasoning
 * is internally inconsistent.
 *
 * This module wraps every provider response before it
 * ever reaches truth-model.js. If reasoning fails
 * self-interrogation — the request is killed.
 * Not degraded. Not guessed at. Killed.
 *
 * "I don't know" is an honest answer.
 * A hallucinated verdict on a false claim is not.
 *
 * FREE · FAIR · FIRM · FUN · TRUE · TRANSPARENT · ACCESSIBLE
 */

// ── THRESHOLDS ────────────────────────────────────────────────────────────

const GUARD_CONFIG = Object.freeze({
    // Max allowed spread between highest and lowest pillar scores
    // If Abe scores verifiable=0.9 and reproducible=0.1 — that's incoherent
    maxPillarSpread:         0.5,

    // If confidence is high but pillars are weak — overconfidence detected
    confidenceScoreMaxDelta: 0.35,

    // Minimum pillars that must agree directionally (all high or all low)
    minPillarAgreement:      3,

    // If summary sentiment contradicts verdict — drift detected
    summaryVerdictAlignment: true,

    // How many providers to try before giving up and returning INCONCLUSIVE
    maxProviderRetries:      3,
});

// ── INTERROGATION RESULTS ─────────────────────────────────────────────────

const RESULT = Object.freeze({
    PASS:        "PASS",
    KILL:        "KILL",
    INCONCLUSIVE: "INCONCLUSIVE"
});

// ── HALLUCINATION GUARD ───────────────────────────────────────────────────

class HallucinationGuard {

    constructor() {
        this._kills    = [];   // full log of every killed response
        this._passes   = 0;
        this._attempts = 0;
    }

    /**
     * Primary interface.
     * Pass in raw NLP result. Get back { status, result, reason } or kill signal.
     *
     * @param {object} nlpResult  — raw result from any adapter
     * @param {string} claim      — original claim (for logging)
     * @returns {{ status, result, reason, audit }}
     */
    interrogate(nlpResult, claim = "") {
        this._attempts++;
        const audit = [];

        // ── TEST 1: PILLAR SPREAD ─────────────────────────────────────────
        // Could Abe have reached this verdict with different pillar reasoning?
        // If pillars wildly disagree with each other — reasoning is incoherent.
        const pillarScores = [
            nlpResult.verifiable,
            nlpResult.reproducible,
            nlpResult.contextuallyHonest,
            nlpResult.falsifiable
        ].filter(s => typeof s === "number");

        if (pillarScores.length < 4) {
            return this._kill(claim, "Incomplete pillar scores — provider returned partial analysis.", audit);
        }

        const maxPillar  = Math.max(...pillarScores);
        const minPillar  = Math.min(...pillarScores);
        const spread     = +(maxPillar - minPillar).toFixed(2);

        audit.push(`Pillar spread: ${spread} (max allowed: ${GUARD_CONFIG.maxPillarSpread})`);

        if (spread > GUARD_CONFIG.maxPillarSpread) {
            return this._kill(
                claim,
                `Pillar spread too wide (${spread}). Scores: V=${nlpResult.verifiable} R=${nlpResult.reproducible} CH=${nlpResult.contextuallyHonest} F=${nlpResult.falsifiable}. Reasoning is incoherent.`,
                audit
            );
        }

        // ── TEST 2: CONFIDENCE vs PILLAR AVERAGE ──────────────────────────
        // If Abe is highly confident but pillars are weak — overconfidence.
        // Overconfidence is a hallucination vector.
        const pillarAvg    = +(pillarScores.reduce((a, b) => a + b, 0) / pillarScores.length).toFixed(2);
        const confidence   = typeof nlpResult.confidence === "number" ? nlpResult.confidence : 0.5;
        const confDelta    = +(confidence - pillarAvg).toFixed(2);

        audit.push(`Confidence: ${confidence}, Pillar avg: ${pillarAvg}, Delta: ${confDelta}`);

        if (confDelta > GUARD_CONFIG.confidenceScoreMaxDelta) {
            return this._kill(
                claim,
                `Overconfidence detected. Confidence (${confidence}) exceeds pillar average (${pillarAvg}) by ${confDelta}. Provider may be hallucinating certainty.`,
                audit
            );
        }

        // ── TEST 3: PILLAR DIRECTIONAL AGREEMENT ─────────────────────────
        // Do at least N pillars agree on direction (all above or below 0.5)?
        // Mixed signals without explanation = incoherent reasoning.
        const highPillars = pillarScores.filter(s => s >= 0.5).length;
        const lowPillars  = pillarScores.filter(s => s < 0.5).length;
        const agreement   = Math.max(highPillars, lowPillars);

        audit.push(`Pillar agreement: ${agreement}/4`);

        if (agreement < GUARD_CONFIG.minPillarAgreement) {
            return this._kill(
                claim,
                `Pillar directional disagreement. ${highPillars} pillars high, ${lowPillars} pillars low. No coherent direction.`,
                audit
            );
        }

        // ── TEST 4: SUMMARY / VERDICT ALIGNMENT ──────────────────────────
        // Does the plain summary contradict the pillar scores?
        // If pillars are weak but summary sounds confident — drift detected.
        if (GUARD_CONFIG.summaryVerdictAlignment && nlpResult.plainSummary) {
            const summary       = nlpResult.plainSummary.toLowerCase();
            const soundsTrue    = /\b(true|accurate|correct|confirmed|verified|supported)\b/.test(summary);
            const soundsFalse   = /\b(false|unsupported|misleading|inaccurate|unverified|contested)\b/.test(summary);
            const pillarsSayTrue  = pillarAvg >= 0.65;
            const pillarsSayFalse = pillarAvg < 0.4;

            const drifted = (soundsTrue && pillarsSayFalse) || (soundsFalse && pillarsSayTrue);
            audit.push(`Summary alignment: ${drifted ? "DRIFTED" : "OK"}`);

            if (drifted) {
                return this._kill(
                    claim,
                    `Summary drifted from pillar scores. Summary implies ${soundsTrue ? "true" : "false"} but pillars average ${pillarAvg}. Provider reasoning diverged.`,
                    audit
                );
            }
        }

        // ── TEST 5: FRAMING FLAG CONSISTENCY ─────────────────────────────
        // If framing flags were detected but contextuallyHonest score is high
        // — provider contradicted itself.
        const hasFramingFlags = Array.isArray(nlpResult.framingFlags) && nlpResult.framingFlags.length > 0;
        const contextScore    = nlpResult.contextuallyHonest;

        audit.push(`Framing flags: ${hasFramingFlags ? nlpResult.framingFlags.length : 0}, contextuallyHonest: ${contextScore}`);

        if (hasFramingFlags && contextScore > 0.75) {
            return this._kill(
                claim,
                `Self-contradiction: provider flagged framing issues (${nlpResult.framingFlags.join(", ")}) but scored contextuallyHonest=${contextScore}. Internally inconsistent.`,
                audit
            );
        }

        // ── ALL TESTS PASSED ──────────────────────────────────────────────
        audit.push("All self-interrogation tests passed.");
        this._passes++;

        return {
            status: RESULT.PASS,
            result: {
                ...nlpResult,
                pillarAverage:   pillarAvg,
                guardAudit:      audit,
                guardPassed:     true
            },
            reason: null,
            audit
        };
    }

    // ── KILL ──────────────────────────────────────────────────────────────
    // Hard stop. Log everything. Return nothing usable.
    // The caller must try the next provider or return INCONCLUSIVE.

    _kill(claim, reason, audit) {
        const entry = {
            id:        `kill_${Date.now()}`,
            claim:     claim.slice(0, 120),
            reason,
            audit,
            timestamp: new Date().toISOString()
        };
        this._kills.push(entry);
        console.warn(`[Honest Abe Guard] KILLED — ${reason}`);

        return {
            status: RESULT.KILL,
            result: null,
            reason,
            audit
        };
    }

    // ── INCONCLUSIVE ──────────────────────────────────────────────────────
    // All providers killed or failed. Return honest uncertainty.
    // Never return a guess. Never return false confidence.

    inconclusive(claim, killLog = []) {
        console.warn(`[Honest Abe Guard] INCONCLUSIVE — all providers failed self-interrogation for: "${claim.slice(0, 80)}"`);
        return {
            status:            RESULT.INCONCLUSIVE,
            verdict:           "INCONCLUSIVE — verify manually",
            plainSummary:      "Honest Abe could not reach a consistent analysis for this claim. This is not a verdict. Please verify with primary sources.",
            pillarAverage:     null,
            confidence:        0,
            humanReviewNeeded: true,
            guardAudit:        killLog,
            guardPassed:       false,
            provider:          "none"
        };
    }

    // ── AUDIT ─────────────────────────────────────────────────────────────

    audit() {
        return {
            attempts:    this._attempts,
            passes:      this._passes,
            kills:       this._kills.length,
            killRate:    this._attempts > 0
                            ? +((this._kills.length / this._attempts).toFixed(3))
                            : 0,
            killLog:     this._kills
        };
    }
}

// ── SINGLETON ─────────────────────────────────────────────────────────────
const guard = new HallucinationGuard();

if (typeof module !== "undefined") module.exports = { HallucinationGuard, guard, RESULT, GUARD_CONFIG };
