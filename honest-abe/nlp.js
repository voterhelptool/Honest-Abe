/**
 * HONEST ABE — nlp.js
 *
 * Truth is not always in the middle. Some things are just wrong.
 * This engine is not afraid to say so.
 *
 * Pipeline:
 *   1. TRIAGE    — what kind of claim is this?
 *   2. CLAIM DNA — break it into checkable pieces
 *   3. EVIDENCE  — language flags, patterns, red flags
 *   4. VERDICT   — TRUE / MOSTLY TRUE / MISLEADING / MOSTLY FALSE / FALSE / OPINION / UNVERIFIABLE
 *   5. SOURCES   — 3 dynamic sources by claim type, labeled by political lean
 *
 * Never returns empty. Always gives context.
 * LOW CONFIDENCE is honest. Silence is not.
 */

// ── PROVIDER REGISTRY ─────────────────────────────────────────────────────
function getProviders() {
    return [
        window._HonestAbeAdapter_Puter,        // Free Claude — no key needed, just slow
        window._HonestAbeAdapter_OpenRouter,   // Free models — needs account
        window._HonestAbeAdapter_Pattern,      // Bedrock — always works
    ].filter(Boolean);
}

// ── CLAIM TYPES ───────────────────────────────────────────────────────────
const CLAIM_TYPES = {
    FACTUAL: "factual", STATISTICAL: "statistical", HISTORICAL: "historical",
    OPINION: "opinion", EMOTIONAL: "emotional",     SCIENTIFIC: "scientific",
    LEGAL:   "legal",   ECONOMIC:   "economic",
};

// ── SOURCE LIBRARY ────────────────────────────────────────────────────────
const SOURCES = {
    factcheck:  { name: "FactCheck.org",           url: "https://www.factcheck.org",             lean: "Center" },
    politifact: { name: "PolitiFact",              url: "https://www.politifact.com",            lean: "Center-Left" },
    snopes:     { name: "Snopes",                  url: "https://www.snopes.com",                lean: "Center-Left" },
    dispatch:   { name: "The Dispatch",            url: "https://thedispatch.com/fact-check",    lean: "Center-Right" },
    leadstories:{ name: "Lead Stories",            url: "https://leadstories.com",               lean: "Center" },
    ap:         { name: "Associated Press",         url: "https://apnews.com",                    lean: "Center" },
    reuters:    { name: "Reuters",                  url: "https://www.reuters.com",               lean: "Center" },
    npr:        { name: "NPR",                      url: "https://www.npr.org",                   lean: "Center-Left" },
    bbc:        { name: "BBC News",                 url: "https://www.bbc.com/news",              lean: "Center" },
    wsj:        { name: "Wall Street Journal",      url: "https://www.wsj.com",                   lean: "Center-Right" },
    examiner:   { name: "Washington Examiner",      url: "https://www.washingtonexaminer.com",    lean: "Right" },
    hill:       { name: "The Hill",                 url: "https://thehill.com",                   lean: "Center" },
    guardian:   { name: "The Guardian",             url: "https://www.theguardian.com",           lean: "Left" },
    cdc:        { name: "CDC",                      url: "https://www.cdc.gov",                   lean: "Government" },
    nih:        { name: "NIH",                      url: "https://www.nih.gov",                   lean: "Government" },
    bls:        { name: "Bureau of Labor Stats",    url: "https://www.bls.gov",                   lean: "Government" },
    census:     { name: "U.S. Census Bureau",       url: "https://www.census.gov",                lean: "Government" },
    fred:       { name: "FRED Economic Data",       url: "https://fred.stlouisfed.org",           lean: "Government" },
    pubmed:     { name: "PubMed",                   url: "https://pubmed.ncbi.nlm.nih.gov",       lean: "Scientific" },
    ourworld:   { name: "Our World in Data",        url: "https://ourworldindata.org",            lean: "Center" },
    archives:   { name: "National Archives",        url: "https://www.archives.gov",              lean: "Government" },
    britannica: { name: "Encyclopaedia Britannica", url: "https://www.britannica.com",            lean: "Center" },
    historian:  { name: "History.com",              url: "https://www.history.com",               lean: "Center" },
    scotus:     { name: "Supreme Court",            url: "https://www.supremecourt.gov",          lean: "Government" },
    congress:   { name: "Congress.gov",             url: "https://www.congress.gov",              lean: "Government" },
    ballotpedia:{ name: "Ballotpedia",              url: "https://ballotpedia.org",               lean: "Center" },
    allsides:   { name: "AllSides",                 url: "https://www.allsides.com",              lean: "Center" },
    mbfc:       { name: "Media Bias/Fact Check",    url: "https://mediabiasfactcheck.com",        lean: "Center" },
    nasa:       { name: "NASA",                     url: "https://www.nasa.gov",                  lean: "Government" },
};

function getSourcesForClaim(claimType, keywords = []) {
    const kw = keywords.join(" ").toLowerCase();

    if (/vaccine|covid|virus|disease|health|medical/.test(kw))     return [SOURCES.cdc,        SOURCES.nih,        SOURCES.pubmed];
    if (/election|vote|ballot|candidate|congress|senate/.test(kw)) return [SOURCES.ballotpedia, SOURCES.factcheck,  SOURCES.ap];
    if (/economy|inflation|jobs|unemployment|gdp|wage/.test(kw))   return [SOURCES.fred,        SOURCES.bls,        SOURCES.reuters];
    if (/climate|environment|carbon|emission/.test(kw))            return [SOURCES.pubmed,      SOURCES.ourworld,   SOURCES.ap];
    if (/crime|police|fbi|arrest|murder/.test(kw))                 return [SOURCES.ap,          SOURCES.factcheck,  SOURCES.bbc];
    if (/immigration|border|migrant|deportation/.test(kw))         return [SOURCES.ap,          SOURCES.factcheck,  SOURCES.examiner];
    if (/war|military|troops|weapon|nato/.test(kw))                return [SOURCES.reuters,     SOURCES.bbc,        SOURCES.hill];
    if (/space|orbit|planet|mars|moon|nasa|satellite/.test(kw))   return [SOURCES.nasa,        SOURCES.ap,         SOURCES.reuters];

    const sets = {
        [CLAIM_TYPES.FACTUAL]:     [SOURCES.ap,         SOURCES.factcheck,  SOURCES.dispatch],
        [CLAIM_TYPES.STATISTICAL]: [SOURCES.ourworld,   SOURCES.bls,        SOURCES.reuters],
        [CLAIM_TYPES.HISTORICAL]:  [SOURCES.britannica, SOURCES.archives,   SOURCES.historian],
        [CLAIM_TYPES.OPINION]:     [SOURCES.allsides,   SOURCES.mbfc,       SOURCES.factcheck],
        [CLAIM_TYPES.EMOTIONAL]:   [SOURCES.factcheck,  SOURCES.snopes,     SOURCES.leadstories],
        [CLAIM_TYPES.SCIENTIFIC]:  [SOURCES.pubmed,     SOURCES.nih,        SOURCES.ourworld],
        [CLAIM_TYPES.LEGAL]:       [SOURCES.congress,   SOURCES.scotus,     SOURCES.ballotpedia],
        [CLAIM_TYPES.ECONOMIC]:    [SOURCES.fred,       SOURCES.bls,        SOURCES.wsj],
    };
    return sets[claimType] || [SOURCES.ap, SOURCES.factcheck, SOURCES.reuters];
}

// ── TRIAGE ────────────────────────────────────────────────────────────────
function triageClaim(claim) {
    const c = claim.toLowerCase();
    if (/\b(\d+%|\d+ percent|statistics show|data shows|studies show|research shows|according to)\b/.test(c)) return CLAIM_TYPES.STATISTICAL;
    if (/\b(in \d{4}|during the|history of|historically|century|decade|era|president .* said)\b/.test(c))      return CLAIM_TYPES.HISTORICAL;
    if (/\b(i think|i believe|in my opinion|we should|should be|it's wrong|it's right|must|ought)\b/.test(c))  return CLAIM_TYPES.OPINION;
    if (/\b(law|illegal|legal|court|ruling|constitution|rights|ban|crime|arrested)\b/.test(c))                 return CLAIM_TYPES.LEGAL;
    if (/\b(economy|gdp|inflation|unemployment|market|stock|wage|tax|debt|deficit)\b/.test(c))                 return CLAIM_TYPES.ECONOMIC;
    if (/\b(vaccine|study|science|research|doctor|cancer|drug|treatment|proven|disproven)\b/.test(c))          return CLAIM_TYPES.SCIENTIFIC;
    if (/\b(outrage|shocking|disgusting|unbelievable|wake up|hidden|secret|destroy|they don't want)\b/.test(c)) return CLAIM_TYPES.EMOTIONAL;
    return CLAIM_TYPES.FACTUAL;
}

// ── CLAIM DNA ─────────────────────────────────────────────────────────────
function extractDNA(claim) {
    const words = claim.split(/\s+/);
    return {
        keywords: words.filter(w => w.length > 4).map(w => w.toLowerCase().replace(/[^a-z]/g, "")),
        entities: words.filter(w => /^[A-Z][a-z]+/.test(w) || /^\d+/.test(w)),
        checkable: words.length >= 4 && !/^(some|many|people|they|everyone)\b/i.test(claim),
    };
}

// ── PROMPT ────────────────────────────────────────────────────────────────
function buildPrompt(claim, claimType, dna) {
    return `You are Honest Abe, a truth analysis engine. Truth is not always in the middle — some claims are just false. Say so when they are.

CLAIM: "${claim}"
CLAIM TYPE: ${claimType}
KEY ENTITIES: ${dna.entities.join(", ") || "none identified"}

Respond ONLY with valid JSON — no text before or after:
{
  "verdictLabel": "TRUE" | "MOSTLY TRUE" | "MISLEADING" | "MOSTLY FALSE" | "FALSE" | "OPINION" | "UNVERIFIABLE",
  "verifiable": 0.0-1.0,
  "reproducible": 0.0-1.0,
  "contextuallyHonest": 0.0-1.0,
  "falsifiable": 0.0-1.0,
  "confidence": 0.0-1.0,
  "confidenceLabel": "HIGH" | "MODERATE" | "LOW" | "INFERENCE ONLY",
  "plainSummary": "2-3 sentences plain English. Be direct. If it's false, say it's false.",
  "reasoning": "Specific explanation of WHY this verdict. What evidence exists or doesn't?",
  "educatedInference": "If verdict is UNVERIFIABLE or confidence is LOW/INFERENCE ONLY: your best probabilistic estimate clearly labeled as inference. Otherwise null.",
  "framingFlags": ["any manipulation techniques or misleading framing detected"],
  "frameAnalysis": {
    "problemDefined": "What problem is this claim defining or constructing? null if none.",
    "blameAssigned": "Who or what is being blamed? null if none.",
    "moralJudgment": "Is a moral verdict presented as fact? null if none.",
    "remedyImplied": "Is a remedy presented as the only option? null if none."
  },
  "prebunkLesson": {
    "technique": "Name of manipulation technique or null.",
    "category": "Emotional | Social Proof | Attribution | Unfalsifiable | Framing | Authority. null if none.",
    "explanation": "One sentence: how this technique bypasses critical thinking.",
    "watchFor": "One sentence: what to look for next time.",
    "askYourself": "One specific question the reader should ask."
  },
  "incentiveBias": "Who benefits if believed? null if none.",
  "gapReason": "PRIMARY_SOURCE_MISSING | TOO_VAGUE | TIME_SENSITIVE | OPINION_AS_FACT | UNFALSIFIABLE_BY_DESIGN | CONTESTED_EVIDENCE | null",
  "pathForward": "Specific actionable step — name a source, database, or record type.",
  "claimDNA": {
    "verifiablePieces": ["parts that CAN be fact-checked"],
    "unverifiablePieces": ["parts that CANNOT be verified"]
  }
}

Rules:
- verdictLabel MUST be one of the exact strings above.
- If a claim is clearly false (e.g. no teapot orbits Mars), say FALSE with HIGH confidence.
- plainSummary must be plain English for a general audience.
- reasoning must be specific, not boilerplate.
- Never refuse to give a verdict. If uncertain, use UNVERIFIABLE with an educatedInference.`;
}

// ── PATTERN FALLBACK ──────────────────────────────────────────────────────
function patternAnalysis(claim, claimType, dna) {
    const c = claim.toLowerCase();
    const flags = [];
    let verifiable = 0.5, reproducible = 0.5, contextuallyHonest = 0.8, falsifiable = 0.7;

    const patterns = [
        { p: /\b(all|always|never|every|none)\b/i,                    f: "Absolute generalization — real issues are rarely absolute" },
        { p: /\b(they|those people|the left|the right|elites)\b/i,    f: "Vague othering — who specifically?" },
        { p: /\b(everyone knows|obviously|clearly|just|simply)\b/i,   f: "False consensus — not everyone agrees" },
        { p: /\b(some say|many feel|people are saying)\b/i,           f: "Claim dodge — attribution without evidence" },
        { p: /\b(wake up|sheeple|they don't want you to know)\b/i,    f: "Conspiracy framing" },
        { p: /\b(fake news|mainstream media|lamestream)\b/i,          f: "Media delegitimization" },
        { p: /\b(deep state|globalist|elite agenda|cabal)\b/i,        f: "Conspiracy framing" },
        { p: /\b(suppress|hide|cover.?up|censored)\b/i,               f: "Suppression framing" },
        { p: /\b(do your own research|dyor)\b/i,                      f: "Anti-expert framing" },
        { p: /\b(destroy|invasion|war on|radical|threat)\b/i,         f: "Inflammatory language" },
        { p: /\b(100%|proven fact|undeniable|irrefutable)\b/i,        f: "Overcertainty" },
    ];

    patterns.forEach(({ p, f }) => { if (p.test(c)) flags.push(f); });

    if (flags.length >= 3) { contextuallyHonest = 0.2; reproducible = 0.3; verifiable = 0.3; }
    else if (flags.length >= 1) { contextuallyHonest = 0.5; }

    if (/\b(god|divine|spiritual|destiny|fate|supernatural)\b/i.test(c)) falsifiable = 0.1;

    let incentiveBias = null;
    if (/\b(buy|purchase|sale|sponsored|advertisement|our product)\b/i.test(c)) {
        incentiveBias = "Commercial language — source may have financial interest";
        verifiable = Math.min(verifiable, 0.3);
    }

    if (claimType === CLAIM_TYPES.STATISTICAL && !/\b(according to|source:|cdc|fbi|census|study)\b/i.test(c)) {
        flags.push("Statistical claim with no cited source");
        verifiable = Math.min(verifiable, 0.35);
    }

    const verdict = claimType === CLAIM_TYPES.OPINION ? "OPINION"
        : flags.length >= 3 ? "MISLEADING"
        : "LOW CONFIDENCE";

    const summary = [
        flags.length > 0 ? `This claim contains ${flags.length} warning sign${flags.length > 1 ? "s" : ""}: ${flags.slice(0,2).join("; ")}.` : "",
        claimType === CLAIM_TYPES.OPINION ? "This appears to be an opinion, not a factual claim." : "",
        claimType === CLAIM_TYPES.STATISTICAL ? "Statistical claims require a cited source." : "",
        "AI analysis was unavailable. Use the sources below to verify."
    ].filter(Boolean).join(" ");

    return {
        verdictLabel: verdict,
        verifiable, reproducible, contextuallyHonest, falsifiable,
        confidence: flags.length > 0 ? 0.55 : 0.35,
        confidenceLabel: flags.length >= 3 ? "LOW" : flags.length >= 1 ? "LOW" : "INFERENCE ONLY",
        plainSummary: summary,
        reasoning: flags.length > 0 ? `Pattern analysis detected: ${flags.join("; ")}.` : "No manipulation patterns detected. AI unavailable for deeper analysis.",
        educatedInference: `Based on language patterns: ${flags.length} warning sign(s) detected. Verify carefully before accepting or sharing.`,
        framingFlags: flags,
        frameAnalysis: null,
        prebunkLesson: null,
        incentiveBias,
        gapReason: !dna.checkable ? "TOO_VAGUE" : claimType === CLAIM_TYPES.OPINION ? "OPINION_AS_FACT" : null,
        pathForward: "Start with the sources listed below. Look for a primary source — an official record, government data, or peer-reviewed study.",
        claimDNA: {
            verifiablePieces: dna.entities.length > 0 ? dna.entities : ["No specific verifiable entities found"],
            unverifiablePieces: dna.checkable ? [] : ["Claim is too vague to fact-check specifically"]
        },
        provider: "pattern", method: "pattern"
    };
}

// ── NLP ENGINE ────────────────────────────────────────────────────────────
class NLPEngine {
    constructor() {
        this._cache  = new Map();
        this._audit  = [];          // ← fixed: was _log, collided with method name
        this._active = null;
    }

    async analyze(claim, context = {}) {
        const key = claim.trim().toLowerCase();
        if (this._cache.has(key)) return this._cache.get(key);

        const claimType = triageClaim(claim);
        const dna       = extractDNA(claim);
        const prompt    = buildPrompt(claim, claimType, dna);

        this._log("triage", "CLASSIFIED", claimType);

        let result = null;

        for (const adapter of getProviders()) {
            if (adapter.name === "pattern") break;
            try {
                const avail = await this._timeout(Promise.resolve(adapter.available()), 2000);
                if (!avail) { this._log(adapter.name, "UNAVAILABLE"); continue; }

                this._log(adapter.name, "ATTEMPTING", claim.slice(0, 60));
                const raw    = await this._timeout(adapter.query(prompt), adapter.name === "Puter.js" ? 30000 : 14000);
                const parsed = this._parse(raw, adapter.name);

                if (!parsed?.verdictLabel) { this._log(adapter.name, "BAD_RESPONSE"); continue; }

                result = parsed;
                this._active = adapter.name;
                this._log(adapter.name, "SUCCESS", parsed.verdictLabel);
                break;
            } catch (e) {
                this._log(adapter?.name || "?", "FAILED", e?.message);
            }
        }

        if (!result) {
            this._log("pattern", "FALLBACK");
            result = patternAnalysis(claim, claimType, dna);
        }

        const sources   = getSourcesForClaim(claimType, dna.keywords);
        const pillarAvg = (result.verifiable + result.reproducible + result.contextuallyHonest + result.falsifiable) / 4;
        const verdict   = claimType === CLAIM_TYPES.OPINION ? "OPINION" : (result.verdictLabel || this._scoreToVerdict(pillarAvg, result.confidence));

        const final = {
            ...result, verdict, claimType, sources, pillarAverage: pillarAvg,
            pillars: {
                verifiable:         result.verifiable,
                reproducible:       result.reproducible,
                contextuallyHonest: result.contextuallyHonest,
                falsifiable:        result.falsifiable,
            }
        };

        this._cache.set(key, final);
        return final;
    }

    _scoreToVerdict(avg, confidence) {
        if (avg >= 0.82) return "TRUE";
        if (avg >= 0.65) return "MOSTLY TRUE";
        if (avg >= 0.50) return "MISLEADING";
        if (avg >= 0.35) return "MOSTLY FALSE";
        if (avg >= 0.20) return "FALSE";
        return confidence < 0.4 ? "LOW CONFIDENCE" : "MISLEADING";
    }

    _parse(raw, provider) {
        try {
            let clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/```json|```/g, "").trim();
            const match = clean.match(/\{[\s\S]*\}/);
            if (match) clean = match[0];
            const p = JSON.parse(clean);
            return {
                verdictLabel:       p.verdictLabel || null,
                verifiable:         this._clamp(p.verifiable),
                reproducible:       this._clamp(p.reproducible),
                contextuallyHonest: this._clamp(p.contextuallyHonest),
                falsifiable:        this._clamp(p.falsifiable),
                confidence:         this._clamp(p.confidence),
                confidenceLabel:    p.confidenceLabel || null,
                plainSummary:       p.plainSummary || "",
                reasoning:          p.reasoning    || "",
                educatedInference:  p.educatedInference || null,
                framingFlags:       Array.isArray(p.framingFlags) ? p.framingFlags : [],
                frameAnalysis:      p.frameAnalysis || null,
                prebunkLesson:      p.prebunkLesson?.technique ? p.prebunkLesson : null,
                incentiveBias:      p.incentiveBias || null,
                gapReason:          p.gapReason || null,
                pathForward:        p.pathForward || null,
                claimDNA:           p.claimDNA || { verifiablePieces: [], unverifiablePieces: [] },
                provider, method: "llm"
            };
        } catch { return null; }
    }

    _clamp(v) { const n = parseFloat(v); return isNaN(n) ? 0.5 : Math.min(1, Math.max(0, n)); }

    _timeout(p, ms) {
        return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);
    }

    _log(provider, status, detail) {
        this._audit.push({ provider, status, detail, ts: Date.now() });  // ← fixed
        console.log(`[Honest Abe] ${provider} → ${status}`, detail ?? "");
    }

    audit() { return { log: this._audit, activeProvider: this._active, cacheSize: this._cache.size }; }
}

const nlp = new NLPEngine();
if (typeof module !== "undefined") module.exports = { NLPEngine, nlp };
