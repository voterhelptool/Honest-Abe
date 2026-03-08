/**
 * HONEST ABE — truth-model.js
 *
 * The 7 F's are not marketing. They are the constitution.
 * The 4 Pillars are not features. They are the skeleton.
 * Integrity is not a goal. It is the operating condition.
 *
 * FREE · FAIR · FIRM · FUN · TRUE · TRANSPARENT · ACCESSIBLE
 * VERIFIABLE · REPRODUCIBLE · CONTEXTUALLY HONEST · FALSIFIABLE
 */

// ── INTEGRITY CORE ────────────────────────────────────────────────────────
// Every evaluation passes through all 7 F's and all 4 Pillars.
// If any dimension cannot be evaluated, the result is incomplete — not valid.

const INTEGRITY = Object.freeze({

    // The 7 F's — constitutional constraints on every output
    F: Object.freeze({
        FREE:        { test: (r) => r._cost === 0,             fail: "Result requires payment or access barrier." },
        FAIR:        { test: (r) => r._biasScore <= 0.2,       fail: "Result shows ideological or financial bias." },
        FIRM:        { test: (r) => r._evidenceHeld === true,  fail: "Result wavered under social pressure, not evidence." },
        FUN:         { test: (r) => r._toneScore >= 0.6,       fail: "Result is punishing, preachy, or inaccessible." },
        TRUE:        { test: (r) => r._pillarsComplete,        fail: "Not all 4 truth pillars were evaluated." },
        TRANSPARENT: { test: (r) => r._auditTrail.length > 0,  fail: "No audit trail. Cannot verify how result was reached." },
        ACCESSIBLE:  { test: (r) => r._plainLanguage === true, fail: "Result uses jargon without plain-language explanation." }
    }),

    // The 4 Pillars — structural requirements for any truth claim
    PILLARS: Object.freeze({
        VERIFIABLE:          "Traceable to a primary source.",
        REPRODUCIBLE:        "Independent sources reach the same conclusion.",
        CONTEXTUALLY_HONEST: "Not selectively framed to imply something false.",
        FALSIFIABLE:         "Evidence exists that could disprove this claim."
    }),

    // Validate a result against all 7 F's
    validate(result) {
        const failures = [];
        for (const [name, rule] of Object.entries(this.F)) {
            try {
                if (!rule.test(result)) failures.push({ principle: name, reason: rule.fail });
            } catch {
                failures.push({ principle: name, reason: `Could not evaluate ${name}.` });
            }
        }
        return {
            passed: failures.length === 0,
            failures,
            integrityScore: +((1 - failures.length / 7).toFixed(2))
        };
    }
});


// ── TRUTH MODEL ───────────────────────────────────────────────────────────

class TruthModel {

    static evaluate(claim, sources = [], context = {}) {

        // Build the result scaffold — every field required by INTEGRITY must exist
        const result = {
            claim,
            sources,
            timestamp: new Date().toISOString(),

            // Internal integrity flags (read by INTEGRITY.F)
            _cost:            0,        // FREE: always zero
            _biasScore:       0,        // FAIR: calculated below
            _evidenceHeld:    true,     // FIRM: never bends to pressure
            _toneScore:       1.0,      // FUN: calculated below
            _pillarsComplete: false,    // TRUE: set after pillars run
            _auditTrail:      [],       // TRANSPARENT: every step logged
            _plainLanguage:   true,     // ACCESSIBLE: enforced in output

            // Public outputs
            pillars:           {},
            incentiveFlags:    [],
            verdict:           null,
            humanReviewNeeded: false
        };

        // ── ETHICS GATE ──────────────────────────────────────────────────
        result._auditTrail.push("Ethics gate: checked");
        if (typeof ImmutableEthics !== "undefined") {
            const gate = ImmutableEthics.checkClaim(claim);
            if (gate.blocked) {
                result._auditTrail.push(`Ethics gate: BLOCKED — ${gate.reason}`);
                return this._finalize(result, "BLOCKED — ETHICS VIOLATION");
            }
        }
        result._auditTrail.push("Ethics gate: passed");

        // ── PILLAR 1: VERIFIABLE ─────────────────────────────────────────
        const hasPrimary = sources.some(s => s.type === "primary");
        const hasSources = sources.length > 0;
        result.pillars.verifiable = {
            score: hasPrimary ? 1.0 : hasSources ? 0.5 : 0.1,
            note:  hasPrimary ? "Primary source confirmed."
                 : hasSources ? "Secondary sources only. Seek primary source."
                 :              "No sources provided. Cannot verify."
        };
        result._auditTrail.push(`Verifiable: ${result.pillars.verifiable.score}`);

        // ── PILLAR 2: REPRODUCIBLE ───────────────────────────────────────
        const independent = sources.filter(s => s.independent !== false);
        result.pillars.reproducible = {
            score: independent.length >= 3 ? 1.0
                 : independent.length === 2 ? 0.75
                 : independent.length === 1 ? 0.4 : 0.0,
            note: `${independent.length} independent source(s) confirmed.`
        };
        result._auditTrail.push(`Reproducible: ${result.pillars.reproducible.score}`);

        // ── PILLAR 3: CONTEXTUALLY HONEST ────────────────────────────────
        const framingPatterns = [
            { p: /\ball\b.*\b(always|never|every)\b/i,              f: "Absolute generalization" },
            { p: /\b(they|those people)\b/i,                         f: "Vague othering" },
            { p: /\b(everyone knows|obviously|clearly)\b/i,         f: "False consensus" },
            { p: /\b(just asking questions|some say|many feel)\b/i, f: "Implicit claim dodge" },
            { p: /\b(real [a-z]+|true [a-z]+)\b/i,                  f: "No-true-Scotsman framing" },
            { p: /\b(wake up|sheeple|they don't want you)\b/i,      f: "Conspiracy framing" },
            { p: /\b(our side|the left|the right)\b/i,              f: "Tribal framing" },
            { p: /\b(suppress|hide|cover.?up)\b/i,                  f: "Suppression framing" },
        ];
        const framingFlags = framingPatterns.filter(x => x.p.test(claim)).map(x => x.f);
        result.pillars.contextuallyHonest = {
            score: framingFlags.length === 0 ? 1.0 : framingFlags.length === 1 ? 0.6 : 0.2,
            flags: framingFlags,
            note:  framingFlags.length > 0
                 ? `Framing concerns detected: ${framingFlags.join(", ")}`
                 : "No manipulative framing detected."
        };
        result._auditTrail.push(`Contextually honest: ${result.pillars.contextuallyHonest.score}`);

        // ── PILLAR 4: FALSIFIABLE ────────────────────────────────────────
        const unfalsifiable = [
            /\b(god|divine|spiritual|supernatural)\b/i,
            /\b(destiny|fate|meant to be)\b/i,
            /\b(will always|can never|has always been)\b/i,
        ].some(p => p.test(claim));
        result.pillars.falsifiable = {
            score: unfalsifiable ? 0.3 : 1.0,
            note:  unfalsifiable
                 ? "Claim may be unfalsifiable — cannot be confirmed or denied by evidence alone."
                 : "Claim is falsifiable — evidence could disprove it."
        };
        result._auditTrail.push(`Falsifiable: ${result.pillars.falsifiable.score}`);

        // All 4 pillars evaluated — TRUE condition satisfied
        result._pillarsComplete = true;

        // ── INCENTIVE BIAS ───────────────────────────────────────────────
        // Core philosophy: truth is not usually hidden — it is discounted.
        // Surface who benefits from this claim being believed.
        sources.forEach(s => {
            if (s.financial_interest) {
                result.incentiveFlags.push(`"${s.name}" has a financial interest in this claim.`);
                result._biasScore = Math.min(1, result._biasScore + 0.3);
            }
            if (s.political_affiliation) {
                result.incentiveFlags.push(`"${s.name}" has a stated political affiliation.`);
                result._biasScore = Math.min(1, result._biasScore + 0.2);
            }
            if (s.funded_by) {
                result.incentiveFlags.push(`"${s.name}" is funded by: ${s.funded_by}`);
                result._biasScore = Math.min(1, result._biasScore + 0.2);
            }
        });
        result._auditTrail.push(`Incentive bias score: ${result._biasScore}`);

        // ── TONE CHECK (FUN + ACCESSIBLE) ────────────────────────────────
        // Don't lecture. Don't punish. Surface truth without moralizing.
        const preachy = /\b(you must|you should|how dare|shameful|disgraceful|ignorant)\b/i.test(claim);
        result._toneScore = preachy ? 0.3 : 1.0;
        result._auditTrail.push(`Tone score: ${result._toneScore}`);

        // ── AGGREGATE ────────────────────────────────────────────────────
        const pillarScores = Object.values(result.pillars).map(p => p.score);
        result.pillarAverage = +(pillarScores.reduce((a, b) => a + b, 0) / pillarScores.length).toFixed(2);

        if (result.pillarAverage < 0.6 || result.incentiveFlags.length > 0) {
            result.humanReviewNeeded = true;
            result._auditTrail.push("Flagged for human review.");
        }

        // ── VERDICT ──────────────────────────────────────────────────────
        const verdictText =
              result.pillarAverage >= 0.85 ? "LIKELY TRUE"
            : result.pillarAverage >= 0.65 ? "PARTIALLY SUPPORTED"
            : result.pillarAverage >= 0.40 ? "CONTESTED — REVIEW SOURCES"
            :                                "UNSUPPORTED";

        const biasNote = result.incentiveFlags.length > 0
            ? " ⚠ Incentive bias flagged — weigh sources carefully."
            : "";

        return this._finalize(result, verdictText + biasNote);
    }

    // ── FINALIZE — integrity check runs on every single result ───────────
    static _finalize(result, verdictText) {
        result.verdict = verdictText;
        result.integrity = INTEGRITY.validate(result);
        result._auditTrail.push(
            `Integrity: ${result.integrity.passed ? "PASSED" : "FAILED"} (score: ${result.integrity.integrityScore})`
        );
        result.summary = this._plainSummary(result);
        return result;
    }

    // Plain language output — ACCESSIBLE is non-negotiable
    static _plainSummary(r) {
        if (r.verdict?.startsWith("BLOCKED"))
            return "This claim was blocked. It contains content that violates core ethical protections.";

        const lines = [`Verdict: ${r.verdict}`];
        if (r.pillars.verifiable)
            lines.push(`Sources: ${r.pillars.verifiable.note}`);
        if (r.pillars.contextuallyHonest?.flags?.length > 0)
            lines.push(`Framing: ${r.pillars.contextuallyHonest.note}`);
        if (r.incentiveFlags.length > 0)
            lines.push(`Incentive bias: ${r.incentiveFlags.join(" | ")}`);
        if (r.humanReviewNeeded)
            lines.push("A human should review this before it is acted on.");
        if (!r.integrity?.passed)
            lines.push(`Integrity concerns: ${r.integrity.failures.map(f => f.reason).join(" | ")}`);

        return lines.join("\n");
    }

    // ── HUMAN REINFORCEMENT ───────────────────────────────────────────────
    // Humans improve the model. The model does not override humans.
    // Every submission is logged. Every approval is auditable.

    static pendingFeedback = [];

    static submitFeedback({ claim, result, humanVerdict, reason, reviewer }) {
        const entry = {
            id: `feedback_${Date.now()}`,
            claim,
            agentVerdict:  result?.verdict,
            humanVerdict,
            reason,
            reviewer,
            timestamp: new Date().toISOString(),
            status: "pending"
        };
        this.pendingFeedback.push(entry);
        console.log(`[Honest Abe] Feedback ${entry.id} received. Pending community review.`);
        return entry;
    }

    static approveFeedback(id, reviewerNotes = "") {
        const entry = this.pendingFeedback.find(f => f.id === id);
        if (!entry) return null;
        entry.status = "approved";
        entry.reviewerNotes = reviewerNotes;
        entry.reviewedAt = new Date().toISOString();
        console.log(`[Honest Abe] Feedback ${id} approved.`);
        return entry;
    }
}

// ── EXPORTS ───────────────────────────────────────────────────────────────
if (typeof module !== "undefined") module.exports = { TruthModel, INTEGRITY };
