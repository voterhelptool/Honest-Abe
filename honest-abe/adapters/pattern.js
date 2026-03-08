/**
 * ADAPTER: Pattern Matching
 *
 * The bedrock. Always last. Never removed.
 * No internet. No AI. No account. No key.
 * Works offline. Works on any device. Works forever.
 *
 * This is the guarantee that Honest Abe always works
 * regardless of what any provider decides to do.
 */

const PatternAdapter = {
    name: "pattern",

    // Always available — unconditionally
    async available() { return true; },

    async query(prompt) {
        // Extract the claim from the structured prompt
        const claimMatch = prompt.match(/CLAIM:\s*"([^"]+)"/);
        const claim = claimMatch ? claimMatch[1] : prompt;

        const result = {
            verifiable:         0.5,
            reproducible:       0.5,
            contextuallyHonest: 1.0,
            falsifiable:        1.0,
            incentiveBias:      null,
            framingFlags:       [],
            plainSummary:       "",
            confidence:         0.4
        };

        // ── FRAMING DETECTION ─────────────────────────────────────────────
        const framingPatterns = [
            { p: /\ball\b.*\b(always|never|every)\b/i,               f: "Absolute generalization" },
            { p: /\b(they|those people)\b/i,                          f: "Vague othering" },
            { p: /\b(everyone knows|obviously|clearly)\b/i,          f: "False consensus" },
            { p: /\b(just asking questions|some say|many feel)\b/i,  f: "Implicit claim dodge" },
            { p: /\b(real [a-z]+|true [a-z]+)\b/i,                   f: "No-true-Scotsman framing" },
            { p: /\b(wake up|sheeple|they don't want you)\b/i,       f: "Conspiracy framing" },
            { p: /\b(our side|the left|the right)\b/i,               f: "Tribal framing" },
            { p: /\b(suppress|hide|cover.?up)\b/i,                   f: "Suppression framing" },
            { p: /\b(fake news|mainstream media)\b/i,                f: "Media delegitimization" },
            { p: /\b(deep state|globalist|elite agenda)\b/i,         f: "Conspiracy framing" },
            { p: /\b(do your own research|dyor)\b/i,                 f: "Anti-expert framing" },
            { p: /\b(they're hiding|what they don't tell)\b/i,       f: "Suppression framing" },
        ];

        result.framingFlags = framingPatterns
            .filter(x => x.p.test(claim))
            .map(x => x.f);

        if (result.framingFlags.length > 0) {
            result.contextuallyHonest = result.framingFlags.length === 1 ? 0.6 : 0.2;
        }

        // ── FALSIFIABILITY CHECK ──────────────────────────────────────────
        const unfalsifiable = [
            /\b(god|divine|spiritual|supernatural)\b/i,
            /\b(destiny|fate|meant to be)\b/i,
            /\b(will always|can never|has always been)\b/i,
        ].some(p => p.test(claim));
        if (unfalsifiable) result.falsifiable = 0.3;

        // ── INCENTIVE BIAS SIGNALS ────────────────────────────────────────
        const incentiveSignals = [
            /\b(buy now|limited time|act fast)\b/i,
            /\b(sponsored|paid|advertisement)\b/i,
            /\b(our product|our service|click here)\b/i,
        ];
        if (incentiveSignals.some(p => p.test(claim))) {
            result.incentiveBias = "Commercial language detected — source may have financial interest.";
            result.verifiable = Math.min(result.verifiable, 0.4);
        }

        // ── PLAIN SUMMARY ─────────────────────────────────────────────────
        const issues = [];
        if (result.framingFlags.length > 0)
            issues.push(`framing concerns (${result.framingFlags.join(", ")})`);
        if (result.falsifiable < 0.5)
            issues.push("may be unfalsifiable");
        if (result.incentiveBias)
            issues.push("possible commercial bias");

        result.plainSummary = issues.length > 0
            ? `Pattern analysis flagged: ${issues.join("; ")}. No AI was available — human review recommended.`
            : "No obvious manipulation patterns detected. No AI was available for deeper analysis — verify sources independently.";

        return JSON.stringify(result);
    }
};

if (typeof module !== "undefined") module.exports = PatternAdapter;
else window._HonestAbeAdapter_Pattern = PatternAdapter;
