// truth-model.js — Honest Abe Core Truth Reasoning
// Philosophy: Truth isn't usually hidden. It's discounted.
// The real job is reducing the perceived cost of accepting it.
// Free. Fair. Firm. Fun. True. Transparent. Accessible.

class TruthModel {

    // ── CONSTITUTIONAL PRINCIPLES ──────────────────────────────────────────
    // These are first-class evaluation criteria, not documentation.
    static CONSTITUTION = {
        free:        "No cost, no gate, no owner. Truth belongs to everyone.",
        fair:        "No ideology, party, or interest gets preferential weighting.",
        firm:        "Evidence is held without wavering. No social pressure changes the score.",
        fun:         "Accessible and human. Not a lecture. Not a punishment.",
        true:        "Correspondence with verifiable, reproducible, falsifiable reality.",
        transparent: "Every score, source, and decision is fully auditable.",
        accessible:  "Plain language. Works for everyone, everywhere, on any device."
    };

    // ── TRUTH SCORING DIMENSIONS ──────────────────────────────────────────
    // A claim is evaluated across four dimensions.
    // Score: 0.0 (fails) → 1.0 (passes)

    static scoreClaim(claim, sources = []) {
        const results = {
            claim,
            dimensions: {},
            incentiveFlags: [],
            overallScore: null,
            verdict: null,
            humanReviewNeeded: false,
            transparent: true // always
        };

        results.dimensions.verifiable   = this._scoreVerifiability(claim, sources);
        results.dimensions.reproducible = this._scoreReproducibility(sources);
        results.dimensions.contextual   = this._scoreContextualHonesty(claim);
        results.dimensions.falsifiable  = this._scoreFalsifiability(claim);

        // Check for incentive distortion — who benefits if this is believed?
        results.incentiveFlags = this._detectIncentiveBias(claim, sources);

        // Aggregate
        const scores = Object.values(results.dimensions).map(d => d.score);
        results.overallScore = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);

        results.verdict = this._verdict(results.overallScore, results.incentiveFlags);

        // Flag for human review if contested or incentive-distorted
        if (results.overallScore < 0.6 || results.incentiveFlags.length > 0) {
            results.humanReviewNeeded = true;
        }

        return results;
    }

    // ── DIMENSION SCORERS ─────────────────────────────────────────────────

    static _scoreVerifiability(claim, sources) {
        // Can it be traced to a primary source?
        const hasSources = sources.length > 0;
        const hasPrimary = sources.some(s => s.type === "primary");
        const score = hasPrimary ? 1.0 : hasSources ? 0.5 : 0.1;
        return {
            score,
            note: hasPrimary
                ? "Traceable to primary source."
                : hasSources
                    ? "Secondary sources only. Primary source not confirmed."
                    : "No sources provided. Cannot verify."
        };
    }

    static _scoreReproducibility(sources) {
        // Do independent sources reach the same conclusion?
        const independent = sources.filter(s => s.independent !== false);
        const score = independent.length >= 3 ? 1.0
                    : independent.length === 2 ? 0.75
                    : independent.length === 1 ? 0.4
                    : 0.0;
        return {
            score,
            note: `${independent.length} independent source(s) found.`
        };
    }

    static _scoreContextualHonesty(claim) {
        // Is the claim selectively framed to imply something false?
        const manipulationPatterns = [
            { pattern: /\ball\b.*\b(always|never|every)\b/i,       flag: "Absolute generalization" },
            { pattern: /\b(they|those people)\b/i,                  flag: "Vague othering" },
            { pattern: /\b(everyone knows|obviously|clearly)\b/i,  flag: "False consensus appeal" },
            { pattern: /\b(just asking questions|some say)\b/i,     flag: "Implicit claim dodge" },
            { pattern: /\b(real [a-z]+|true [a-z]+)\b/i,           flag: "No-true-Scotsman framing" },
            { pattern: /\b(wake up|sheeple|they don't want you)\b/i, flag: "Conspiracy framing" },
        ];

        const flags = manipulationPatterns
            .filter(p => p.pattern.test(claim))
            .map(p => p.flag);

        const score = flags.length === 0 ? 1.0
                    : flags.length === 1 ? 0.6
                    : 0.2;

        return {
            score,
            flags,
            note: flags.length > 0
                ? `Framing concerns: ${flags.join(", ")}`
                : "No manipulative framing detected."
        };
    }

    static _scoreFalsifiability(claim) {
        // Is there any evidence that COULD disprove this claim?
        // Unfalsifiable claims are not lies, but they aren't truth either.
        const unfalsifiablePatterns = [
            /\b(god|divine|spiritual|supernatural)\b/i,
            /\b(feelings?|believes?|thinks?)\b/i,
            /\b(destiny|fate|meant to be)\b/i,
            /\b(always been|will always|can never)\b/i,
        ];

        const isUnfalsifiable = unfalsifiablePatterns.some(p => p.test(claim));
        return {
            score: isUnfalsifiable ? 0.3 : 1.0,
            note: isUnfalsifiable
                ? "Claim may be unfalsifiable. Cannot be confirmed or denied by evidence."
                : "Claim appears falsifiable — evidence could disprove it."
        };
    }

    // ── INCENTIVE BIAS DETECTION ─────────────────────────────────────────
    // Key insight: people discount truth because accepting it costs something.
    // Flag when a source or claim structure suggests motivated reasoning.

    static _detectIncentiveBias(claim, sources) {
        const flags = [];

        // Source-level: does the source financially benefit from belief?
        sources.forEach(s => {
            if (s.financial_interest) flags.push(`Source "${s.name}" has financial interest in this claim.`);
            if (s.political_affiliation) flags.push(`Source "${s.name}" has stated political affiliation.`);
            if (s.funded_by) flags.push(`Source "${s.name}" funded by: ${s.funded_by}`);
        });

        // Claim-level: language patterns that suggest motivated framing
        if (/\b(our side|the left|the right|they want to|they're trying to)\b/i.test(claim)) {
            flags.push("Tribal framing detected — claim may serve in-group identity over accuracy.");
        }
        if (/\b(suppress|hide|cover.?up|don't want you to know)\b/i.test(claim)) {
            flags.push("Suppression framing detected — often used to pre-discredit counter-evidence.");
        }

        return flags;
    }

    // ── VERDICT ───────────────────────────────────────────────────────────

    static _verdict(score, incentiveFlags) {
        const base = score >= 0.85 ? "LIKELY TRUE"
                   : score >= 0.65 ? "PARTIALLY SUPPORTED"
                   : score >= 0.40 ? "CONTESTED — REVIEW SOURCES"
                   : "UNSUPPORTED";

        const qualifier = incentiveFlags.length > 0
            ? ` ⚠ Incentive bias flagged — weigh sources carefully.`
            : "";

        return base + qualifier;
    }

    // ── HUMAN REINFORCEMENT ───────────────────────────────────────────────
    // Humans improve the model. The model doesn't override humans.

    static pendingFeedback = [];

    static submitFeedback({ claim, scoredResult, humanVerdict, reason, reviewer }) {
        const entry = {
            id: Date.now(),
            claim,
            agentVerdict: scoredResult.verdict,
            humanVerdict,
            reason,
            reviewer,
            timestamp: new Date().toISOString(),
            status: "pending_review"
        };
        this.pendingFeedback.push(entry);
        console.log(`[Honest Abe] Feedback received. ID: ${entry.id}. Status: pending community review.`);
        return entry;
    }

    static reviewFeedback(id, approved, reviewerNotes = "") {
        const entry = this.pendingFeedback.find(f => f.id === id);
        if (!entry) return null;
        entry.status = approved ? "approved" : "rejected";
        entry.reviewerNotes = reviewerNotes;
        entry.reviewedAt = new Date().toISOString();
        console.log(`[Honest Abe] Feedback ${id} ${entry.status}.`);
        return entry;
    }

    // ── INTEGRATION WITH ImmutableEthics ──────────────────────────────────
    // Run ethics check first, then truth scoring.

    static evaluate(claim, sources = []) {
        // Step 1: hard ethics gate (from ethics.js)
        if (typeof ImmutableEthics !== "undefined") {
            const ethicsResult = ImmutableEthics.checkClaim(claim);
            if (ethicsResult.blocked) {
                return {
                    blocked: true,
                    reason: ethicsResult.reason,
                    truthScore: null,
                    verdict: "BLOCKED — ETHICS VIOLATION"
                };
            }
        }

        // Step 2: truth model
        return this.scoreClaim(claim, sources);
    }
}

// ── EXPORTS ───────────────────────────────────────────────────────────────
if (typeof module !== "undefined") module.exports = { TruthModel };
