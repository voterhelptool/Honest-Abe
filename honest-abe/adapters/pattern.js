/**
 * ADAPTER: Pattern Matching
 *
 * The bedrock. Always last. Never removed.
 * No internet. No AI. No account. No key.
 * Works offline. Works on any device. Works forever.
 *
 * Stage 2 additions:
 * - Entman 4-element structural framing analysis
 * - Prebunking library (6 manipulation techniques)
 * - Confidence labels
 * - Gap reasons
 * - Path forward
 */

// ── PREBUNKING LIBRARY ────────────────────────────────────────────────────
// 6 core manipulation techniques. Teach the user to recognize them.
// Each entry: detection patterns, technique name, explanation, watchFor.

const PREBUNK_LIBRARY = [

    // ── CATEGORY: EMOTIONAL ───────────────────────────────────────────────

    {
        id: "emotional_manipulation",
        category: "Emotional",
        name: "Emotional Manipulation",
        patterns: [
            /\b(shocking|disgusting|horrifying|terrifying|unbelievable)\b/i,
            /\b(they want you scared|fear|panic|you should be angry|infuriating)\b/i,
            /!!+/,
        ],
        explanation: "Strong emotions — especially fear and outrage — short-circuit evaluation. By the time you feel the emotion, you've often already accepted the premise.",
        watchFor: "When content makes you feel strong emotion before presenting evidence, that's the technique working. Pause and ask: what's the actual claim, and what evidence supports it?",
        askYourself: "Is my emotional reaction proportional to the evidence shown, or am I reacting to the framing?",
        realWorldExample: "Headlines that use 'SHOCKING' or 'OUTRAGEOUS' before stating a fact — the emotion word does persuasion work the evidence can't."
    },
    {
        id: "appeal_to_fear",
        category: "Emotional",
        name: "Appeal to Fear",
        patterns: [
            /\b(if we don't act now|before it's too late|existential threat|end of|collapse of|destruction of)\b/i,
            /\b(your (family|children|community|country) (is|are|will be) (at risk|in danger|under attack|threatened))\b/i,
            /\b(they('re| are) coming for|they want to (destroy|replace|eliminate))\b/i,
        ],
        explanation: "Exaggerating threat level creates urgency that bypasses careful evaluation. When something feels like a crisis, people accept solutions they'd otherwise question.",
        watchFor: "Urgency language paired with vague threats. Ask: what specifically is the threat, what is the evidence, and who benefits from you feeling afraid?",
        askYourself: "Is the threat specific and evidenced, or is the danger vague and the urgency manufactured?",
        realWorldExample: "'They're coming for your guns / your children / your way of life' — specific enough to feel real, vague enough to be unfalsifiable."
    },

    // ── CATEGORY: SOCIAL PROOF ────────────────────────────────────────────

    {
        id: "false_consensus",
        category: "Social Proof",
        name: "False Consensus",
        patterns: [
            /\b(everyone knows|most people believe|nobody thinks|we all know|common sense says)\b/i,
            /\b(obviously|clearly|it goes without saying|any reasonable person)\b/i,
            /\b(the (silent majority|real Americans|ordinary people) (know|believe|think|feel))\b/i,
        ],
        explanation: "Claiming broad agreement that doesn't exist makes a minority position feel like the mainstream, discouraging independent evaluation.",
        watchFor: "When a claim assumes you already agree, or implies disagreement is unreasonable — that assumption is doing argumentative work.",
        askYourself: "Who specifically agrees? Is a source cited, or is 'everyone' doing the work of evidence?",
        realWorldExample: "'Everyone knows the media can't be trusted' — presents a contested opinion as settled fact to skip the burden of proof."
    },
    {
        id: "bandwagon",
        category: "Social Proof",
        name: "Bandwagon",
        patterns: [
            /\b(millions (of people |are )?(already|now)|everyone is (talking about|switching to|waking up to))\b/i,
            /\b(join the (movement|millions|majority)|don't be left behind|be on the right side)\b/i,
            /\b(the (tide|tide is turning|momentum)|more and more people)\b/i,
        ],
        explanation: "Popularity is used as a substitute for validity. Something being widely believed doesn't make it true — but it makes it feel safer to believe.",
        watchFor: "Claims about what 'millions' are doing or believing without a cited source. Trends can be manufactured.",
        askYourself: "Would this claim hold up if only a handful of people believed it? If not, popularity is doing the argumentative work.",
        realWorldExample: "'Millions are waking up to the truth about X' — asserts a movement without evidence of one."
    },

    // ── CATEGORY: ATTRIBUTION ─────────────────────────────────────────────

    {
        id: "scapegoating",
        category: "Attribution",
        name: "Scapegoating",
        patterns: [
            /\b(immigrants|foreigners|elites|globalists|the (left|right)|those people) (are|were|have been|caused|destroyed|ruined|responsible)\b/i,
            /\b(to blame|responsible for|caused by|because of).{0,30}(them|immigrants|elites|globalists|foreigners)\b/i,
            /\b(they are|they're) (destroying|ruining|attacking|invading|stealing|replacing)\b/i,
            /\b(these people|that group|those communities) (are|were|have)\b/i,
        ],
        explanation: "A group is assigned blame for a complex problem without a causal mechanism — redirecting anger at a target instead of examining root causes.",
        watchFor: "When a group is blamed, ask: what is the specific causal chain connecting this group to this outcome? Is that chain evidenced?",
        askYourself: "Is blame proportional to demonstrated evidence, or is a complex problem being reduced to a convenient target?",
        realWorldExample: "Attributing economic decline to a specific ethnic or political group without citing mechanism — the blame is the argument."
    },
    {
        id: "whataboutism",
        category: "Attribution",
        name: "Whataboutism",
        patterns: [
            /\b(but what about|what about when|you didn't care when|where was the outrage when)\b/i,
            /\b(both sides|the other side does it too|they do it too|your side)\b/i,
            /\b(hypocrite|hypocritical|double standard).{0,20}(you|your|they|their)\b/i,
        ],
        explanation: "Deflecting criticism by pointing to someone else's wrongdoing. Even if the deflection is valid, it doesn't address the original claim.",
        watchFor: "When a response to a specific accusation shifts to what someone else did — that's deflection, not defense.",
        askYourself: "Is the original claim being addressed, or is attention being redirected? Both things can be true simultaneously.",
        realWorldExample: "'You're criticizing X? What about when Y did the same thing?' — may be fair, but doesn't answer whether X happened."
    },

    // ── CATEGORY: UNFALSIFIABLE ───────────────────────────────────────────

    {
        id: "conspiracy_framing",
        category: "Unfalsifiable",
        name: "Conspiracy Framing",
        patterns: [
            /\b(deep state|elite agenda|they don't want you to know|what they're hiding|shadow government)\b/i,
            /\b(wake up|sheeple|do your own research|the truth they suppress)\b/i,
            /\b(cover.?up|censored|shadow.?banned|silenced)\b/i,
        ],
        explanation: "Framing a claim as suppressed truth makes it unfalsifiable — any lack of evidence becomes proof of cover-up, and the belief becomes self-sealing.",
        watchFor: "If the claim treats absence of evidence as evidence of conspiracy, no finding could disprove it. That's a structural flaw, not hidden wisdom.",
        askYourself: "What evidence would change my mind about this? If nothing could, the belief is unfalsifiable — not uniquely true.",
        realWorldExample: "'There's no coverage of this because the media is suppressing it' — the suppression becomes proof of the claim."
    },
    {
        id: "moving_goalposts",
        category: "Unfalsifiable",
        name: "Moving the Goalposts",
        patterns: [
            /\b(that doesn't count|that's not real evidence|but what about|yes but)\b/i,
            /\b(still not convinced|not enough proof|prove it without)\b/i,
            /\b(even if.*still|regardless of.*still believe)\b/i,
        ],
        explanation: "The standard of evidence required keeps changing after each counterpoint, making the belief permanently immune to correction.",
        watchFor: "If each new piece of evidence is dismissed and the bar keeps rising, the belief may be unfalsifiable by design — not by lack of evidence.",
        askYourself: "What would it actually take to change my mind? If the answer keeps changing, the belief may not be based on evidence.",
        realWorldExample: "'That study doesn't count because it was funded by X. Find one that wasn't.' Then: 'That one doesn't count either because...'"
    },

    // ── CATEGORY: FRAMING ─────────────────────────────────────────────────

    {
        id: "false_dichotomy",
        category: "Framing",
        name: "False Dichotomy",
        patterns: [
            /\b(either you|if you don't|only two choices|with us or against us)\b/i,
            /\b(the only (way|option|solution|answer|choice))\b/i,
            /\b(there is no alternative|no other option|must choose)\b/i,
        ],
        explanation: "Presenting only two options when more exist forces a choice within a rigged frame, excluding alternatives that might complicate the argument.",
        watchFor: "When told there are only two choices, the excluded middle is usually where the truth lives.",
        askYourself: "What options are being left out? Why are they not being presented?",
        realWorldExample: "'You're either with us or against us' — collapses a spectrum of positions into a binary that benefits the speaker."
    },
    {
        id: "loaded_language",
        category: "Framing",
        name: "Loaded Language",
        patterns: [
            /\b(regime|radical|extremist|woke|globalist|puppet|traitor|invasion|replacement)\b/i,
            /\b(so-called|self-proclaimed|alleged).{0,20}(leader|expert|scientist|journalist)\b/i,
            /\b(brainwashed|indoctrinated|sheep|cult|propaganda machine)\b/i,
        ],
        explanation: "Words with strong connotations substitute for argument. Calling something a 'regime' instead of a 'government' carries a verdict without stating one.",
        watchFor: "Identify the loaded word, then ask: what is the neutral version of this word? Does the argument hold up without the emotional charge?",
        askYourself: "If I replaced this word with a neutral equivalent, would the claim still seem as compelling?",
        realWorldExample: "Describing a political opponent as 'radical' or 'extreme' without defining what the standard is — the label does the work of evidence."
    },

    // ── CATEGORY: AUTHORITY ───────────────────────────────────────────────

    {
        id: "false_authority",
        category: "Authority",
        name: "False Authority",
        patterns: [
            /\b(experts (say|agree|confirm|warn)|scientists (say|warn|confirm))\b/i,
            /\b(studies (show|prove|confirm)|research (shows|proves|confirms))\b/i,
            /\b(doctors|scientists|researchers) (are (now |)saying|have (found|discovered|confirmed))\b/i,
        ],
        explanation: "Vague appeals to unnamed experts or studies create an impression of scientific backing without providing any. 'Experts say' with no citation is not evidence.",
        watchFor: "Ask: which experts? Which studies? What institution? When was it published? Can you find it?",
        askYourself: "Is the authority named and verifiable, or is 'experts' doing the work of a citation?",
        realWorldExample: "'Studies show this diet cures cancer' — no study named, no journal cited, no way to verify the claim."
    },
];

// ── ENTMAN FRAME ANALYSIS ─────────────────────────────────────────────────
// Four structural elements of framing (Entman, 1993).
// Detects manipulation through structure, not just word choice.

function analyzeFrame(claim) {
    const c = claim.toLowerCase();
    const frame = {
        problemDefined:  null,
        blameAssigned:   null,
        moralJudgment:   null,
        remedyImplied:   null,
    };

    // Problem definition — what issue is being constructed
    const problemPatterns = [
        /\b(the (real |true |actual |underlying )?(problem|issue|crisis|threat|danger) is)\b/i,
        /\b(what('s| is) (really|actually) happening)\b/i,
        /\b(the (root cause|real reason|truth about))\b/i,
    ];
    if (problemPatterns.some(p => p.test(c))) {
        frame.problemDefined = "Claim explicitly constructs a problem definition — check whether the framing excludes other valid interpretations of the issue.";
    }

    // Causal attribution — blame assigned, mechanism provided?
    const blamePatterns = [
        /\b(caused by|because of|due to|to blame|responsible for|fault of)\b/i,
        /\b(led to|resulting from|stems from|driven by)\b/i,
    ];
    const blameVague = /\b(them|they|those people|the (left|right|elites|media|government))\b/i;
    if (blamePatterns.some(p => p.test(c))) {
        frame.blameAssigned = blameVague.test(c)
            ? "Blame is assigned to a vague group without a specific causal mechanism. Who exactly, and how specifically?"
            : "Causal attribution present — verify that the mechanism connecting cause to effect is evidence-based.";
    }

    // Moral judgment embedded as fact
    const moralPatterns = [
        /\b(evil|corrupt|disgraceful|shameful|immoral|criminal|disgusting|despicable)\b/i,
        /\b(destroying|ruining|attacking|betraying|exploiting|stealing from|lying to)\b/i,
        /\b(heroes?|patriots?|traitors?|cowards?|monsters?)\b/i,
    ];
    if (moralPatterns.some(p => p.test(c))) {
        frame.moralJudgment = "Moral verdict is embedded in factual language. Identify which words carry the judgment and ask whether that judgment is supported by the evidence.";
    }

    // Implied remedy — only option presented
    const remedyPatterns = [
        /\b(the only (way|solution|option|answer|path))\b/i,
        /\b(we (must|have to|need to|should) (immediately|now|urgently))\b/i,
        /\b(there('s| is) no (other )?(choice|alternative|option))\b/i,
        /\b(before it('s| is) too late|now or never|last chance)\b/i,
    ];
    if (remedyPatterns.some(p => p.test(c))) {
        frame.remedyImplied = "A specific remedy is presented as the only option, closing off alternatives before they can be evaluated.";
    }

    // Return null if nothing found — no noise
    const hasFrame = Object.values(frame).some(v => v !== null);
    return hasFrame ? frame : null;
}

// ── PREBUNK MATCHER ───────────────────────────────────────────────────────

function detectPrebunk(claim) {
    for (const lesson of PREBUNK_LIBRARY) {
        if (lesson.patterns.some(p => p.test(claim))) {
            return {
                id:          lesson.id,
                category:    lesson.category,
                technique:   lesson.name,
                explanation: lesson.explanation,
                watchFor:    lesson.watchFor,
                askYourself: lesson.askYourself,
                realWorldExample: lesson.realWorldExample,
            };
        }
    }
    return null;
}

// ── GAP REASON ────────────────────────────────────────────────────────────

function detectGapReason(claim, claimType, falsifiable, dna) {
    if (!dna.checkable)                       return "TOO_VAGUE";
    if (falsifiable < 0.3)                    return "UNFALSIFIABLE_BY_DESIGN";
    if (claimType === "opinion")              return "OPINION_AS_FACT";
    if (/\b(will|going to|soon|future)\b/i.test(claim)) return "TIME_SENSITIVE";
    return null;
}

// ── MAIN ADAPTER ──────────────────────────────────────────────────────────

const PatternAdapter = {
    name: "pattern",

    async available() { return true; },

    async query(prompt) {
        const claimMatch = prompt.match(/CLAIM:\s*"([^"]+)"/);
        const claim = claimMatch ? claimMatch[1] : prompt;
        const claimTypeMatch = prompt.match(/CLAIM TYPE:\s*(\w+)/);
        const claimType = claimTypeMatch ? claimTypeMatch[1].toLowerCase() : "factual";

        let verifiable = 0.5, reproducible = 0.5, contextuallyHonest = 0.8, falsifiable = 0.7;
        const flags = [];
        let incentiveBias = null;

        // ── FRAMING FLAGS ─────────────────────────────────────────────────
        const framingPatterns = [
            { p: /\b(all|always|never|every|none)\b/i,                    f: "Absolute generalization — real issues are rarely absolute" },
            { p: /\b(they|those people|the left|the right|elites)\b/i,    f: "Vague othering — who specifically?" },
            { p: /\b(everyone knows|obviously|clearly|just|simply)\b/i,   f: "False consensus — not everyone agrees" },
            { p: /\b(some say|many feel|people are saying)\b/i,           f: "Claim dodge — attribution without evidence" },
            { p: /\b(wake up|sheeple|they don't want you to know)\b/i,    f: "Conspiracy framing" },
            { p: /\b(fake news|mainstream media|lamestream)\b/i,          f: "Media delegitimization" },
            { p: /\b(deep state|elite agenda|cabal)\b/i,        f: "Conspiracy framing" },
            { p: /\b(suppress|hide|cover.?up|censored)\b/i,               f: "Suppression framing" },
            { p: /\b(do your own research|dyor)\b/i,                      f: "Anti-expert framing" },
            { p: /\b(destroy|invasion|war on|radical|threat)\b/i,         f: "Inflammatory language" },
            { p: /\b(100%|proven fact|undeniable|irrefutable)\b/i,        f: "Overcertainty" },
        ];

        framingPatterns.forEach(({ p, f }) => { if (p.test(claim)) flags.push(f); });

        if (flags.length >= 3) { contextuallyHonest = 0.2; reproducible = 0.3; verifiable = 0.3; }
        else if (flags.length >= 1) { contextuallyHonest = 0.5; }

        // ── FALSIFIABILITY ────────────────────────────────────────────────
        if (/\b(god|divine|spiritual|destiny|fate|supernatural)\b/i.test(claim)) falsifiable = 0.1;

        // ── INCENTIVE BIAS ────────────────────────────────────────────────
        if (/\b(buy|purchase|sale|sponsored|advertisement|our product)\b/i.test(claim)) {
            incentiveBias = "Commercial language — source may have financial interest in this claim";
            verifiable = Math.min(verifiable, 0.3);
        }

        // ── STATISTICAL WITHOUT SOURCE ────────────────────────────────────
        if (claimType === "statistical" && !/\b(according to|source:|cdc|fbi|census|study)\b/i.test(claim)) {
            flags.push("Statistical claim with no cited source");
            verifiable = Math.min(verifiable, 0.35);
        }

        // ── STRUCTURAL FRAMING ANALYSIS ───────────────────────────────────
        const frameAnalysis = analyzeFrame(claim);

        // ── PREBUNK DETECTION ─────────────────────────────────────────────
        const prebunkLesson = detectPrebunk(claim);

        // ── CONFIDENCE + VERDICT ──────────────────────────────────────────
        const verdict = claimType === "opinion" ? "OPINION"
            : flags.length >= 3 ? "MISLEADING"
            : flags.length >= 1 ? "LOW CONFIDENCE"
            : "LOW CONFIDENCE";

        const confidenceLabel = flags.length >= 3 ? "LOW"
            : flags.length >= 1 ? "LOW"
            : "INFERENCE ONLY";

        // ── GAP REASON ────────────────────────────────────────────────────
        const dnaCheckable = claim.split(/\s+/).length >= 4;
        const gapReason = detectGapReason(claim, claimType, falsifiable, { checkable: dnaCheckable });

        // ── PLAIN SUMMARY ─────────────────────────────────────────────────
        const summaryParts = [];
        if (flags.length > 0) summaryParts.push(`Pattern analysis flagged ${flags.length} warning sign${flags.length > 1 ? "s" : ""}: ${flags.slice(0,2).join("; ")}.`);
        if (frameAnalysis)    summaryParts.push("Structural framing detected — see frame analysis below.");
        if (prebunkLesson)    summaryParts.push(`Manipulation technique identified: ${prebunkLesson.technique}.`);
        if (claimType === "opinion") summaryParts.push("This appears to be an opinion, not a factual claim.");
        summaryParts.push("AI analysis was unavailable. Use the sources below to verify.");

        // ── EDUCATED INFERENCE ────────────────────────────────────────────
        const educatedInference = (verdict === "LOW CONFIDENCE" || verdict === "UNVERIFIABLE")
            ? `Based on language patterns alone: ${flags.length > 0
                ? `this claim contains ${flags.length} warning sign(s) (${flags.slice(0,2).join(", ")}). These patterns are statistically associated with misleading content, but pattern matching alone cannot confirm or deny the underlying facts.`
                : "no obvious manipulation patterns were detected, but AI was unavailable for deeper analysis. Treat as unconfirmed until verified."}`
            : null;

        const result = {
            verdictLabel: verdict,
            verifiable, reproducible, contextuallyHonest, falsifiable,
            confidence: flags.length > 0 ? 0.45 : 0.3,
            confidenceLabel,
            plainSummary: summaryParts.join(" "),
            reasoning: flags.length > 0
                ? `Pattern analysis detected: ${flags.join("; ")}.`
                : "No obvious manipulation patterns detected. AI unavailable for deeper analysis.",
            educatedInference,
            framingFlags: flags,
            frameAnalysis,
            prebunkLesson,
            incentiveBias,
            gapReason,
            pathForward: "Look for a primary source — an official record, government database, or peer-reviewed study — that directly addresses the specific claim. Check the sources listed below as a starting point.",
            claimDNA: {
                verifiablePieces: [],
                unverifiablePieces: dnaCheckable ? [] : ["Claim is too vague to fact-check specifically"]
            }
        };

        return JSON.stringify(result);
    }
};

if (typeof module !== "undefined") module.exports = { PatternAdapter, PREBUNK_LIBRARY, analyzeFrame, detectPrebunk };
else window._HonestAbeAdapter_Pattern = PatternAdapter;
