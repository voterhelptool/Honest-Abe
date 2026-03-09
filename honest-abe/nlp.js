/**
 * HONEST ABE — nlp.js  v3.0
 *
 * "Truth is not always in the middle. Some things are just wrong.
 *  When the evidence is clear, say so clearly. Hedging in the face
 *  of clear evidence is itself a form of dishonesty."
 *
 * 6-Step Pipeline:
 *   1. DECOMPOSE   — break claim into atomic checkable assertions
 *   2. SEARCH      — find primary sources for each factual assertion
 *   3. NEUTRALIZE  — strip framing, restate evidence in flat language
 *   4. MANIPULATE  — compare original to neutral restatement; identify techniques
 *   5. VERDICT     — evidence-based conclusion with confidence and reasoning
 *   6. GUIDE       — what to check independently, where Abe is weakest
 *
 * Provider chain: Puter → Gemini → Groq → Pattern (offline fallback)
 */

// ── PROVIDER REGISTRY ─────────────────────────────────────────────────────
function getProviders() {
    return [
        window._HonestAbeAdapter_Puter,
        window._HonestAbeAdapter_Gemini,
        window._HonestAbeAdapter_Groq,
    ].filter(Boolean);
}

// ── SOURCE LIBRARY ────────────────────────────────────────────────────────
const SOURCES = {
    factcheck:   { name: "FactCheck.org",           url: "https://www.factcheck.org",            lean: "Center" },
    politifact:  { name: "PolitiFact",              url: "https://www.politifact.com",           lean: "Center-Left" },
    snopes:      { name: "Snopes",                  url: "https://www.snopes.com",               lean: "Center-Left" },
    dispatch:    { name: "The Dispatch",            url: "https://thedispatch.com/fact-check",   lean: "Center-Right" },
    leadstories: { name: "Lead Stories",            url: "https://leadstories.com",              lean: "Center" },
    ap:          { name: "Associated Press",         url: "https://apnews.com",                   lean: "Center" },
    reuters:     { name: "Reuters",                  url: "https://www.reuters.com",              lean: "Center" },
    npr:         { name: "NPR",                      url: "https://www.npr.org",                  lean: "Center-Left" },
    bbc:         { name: "BBC News",                 url: "https://www.bbc.com/news",             lean: "Center" },
    wsj:         { name: "Wall Street Journal",      url: "https://www.wsj.com",                  lean: "Center-Right" },
    examiner:    { name: "Washington Examiner",      url: "https://www.washingtonexaminer.com",   lean: "Right" },
    hill:        { name: "The Hill",                 url: "https://thehill.com",                  lean: "Center" },
    guardian:    { name: "The Guardian",             url: "https://www.theguardian.com",          lean: "Left" },
    cdc:         { name: "CDC",                      url: "https://www.cdc.gov",                  lean: "Government" },
    nih:         { name: "NIH",                      url: "https://www.nih.gov",                  lean: "Government" },
    bls:         { name: "Bureau of Labor Stats",    url: "https://www.bls.gov",                  lean: "Government" },
    census:      { name: "U.S. Census Bureau",       url: "https://www.census.gov",               lean: "Government" },
    fred:        { name: "FRED Economic Data",       url: "https://fred.stlouisfed.org",          lean: "Government" },
    pubmed:      { name: "PubMed",                   url: "https://pubmed.ncbi.nlm.nih.gov",      lean: "Scientific" },
    ourworld:    { name: "Our World in Data",        url: "https://ourworldindata.org",           lean: "Center" },
    archives:    { name: "National Archives",        url: "https://www.archives.gov",             lean: "Government" },
    britannica:  { name: "Encyclopaedia Britannica", url: "https://www.britannica.com",           lean: "Center" },
    historian:   { name: "History.com",              url: "https://www.history.com",              lean: "Center" },
    scotus:      { name: "Supreme Court",            url: "https://www.supremecourt.gov",         lean: "Government" },
    congress:    { name: "Congress.gov",             url: "https://www.congress.gov",             lean: "Government" },
    fec:         { name: "FEC.gov",                  url: "https://www.fec.gov",                  lean: "Government" },
    ballotpedia: { name: "Ballotpedia",              url: "https://ballotpedia.org",              lean: "Center" },
    allsides:    { name: "AllSides",                 url: "https://www.allsides.com",             lean: "Center" },
    mbfc:        { name: "Media Bias/Fact Check",    url: "https://mediabiasfactcheck.com",       lean: "Center" },
    nasa:        { name: "NASA",                     url: "https://www.nasa.gov",                 lean: "Government" },
    opensecrets: { name: "OpenSecrets",              url: "https://www.opensecrets.org",          lean: "Center" },
};

function getSourcesForClaim(claimType, keywords = []) {
    const kw = keywords.join(" ").toLowerCase();
    if (/vaccine|covid|virus|disease|health|medical/.test(kw))     return [SOURCES.cdc,        SOURCES.nih,         SOURCES.pubmed];
    if (/election|vote|ballot|candidate|congress|senate/.test(kw)) return [SOURCES.ballotpedia, SOURCES.factcheck,   SOURCES.ap];
    if (/economy|inflation|jobs|unemployment|gdp|wage/.test(kw))   return [SOURCES.fred,        SOURCES.bls,         SOURCES.reuters];
    if (/climate|environment|carbon|emission/.test(kw))            return [SOURCES.pubmed,      SOURCES.ourworld,    SOURCES.ap];
    if (/crime|police|fbi|arrest|murder/.test(kw))                 return [SOURCES.ap,          SOURCES.factcheck,   SOURCES.bbc];
    if (/immigration|border|migrant|deportation/.test(kw))         return [SOURCES.ap,          SOURCES.factcheck,   SOURCES.examiner];
    if (/war|military|troops|weapon|nato/.test(kw))                return [SOURCES.reuters,     SOURCES.bbc,         SOURCES.hill];
    if (/donor|campaign|finance|contribution|pac/.test(kw))        return [SOURCES.fec,         SOURCES.opensecrets, SOURCES.ballotpedia];
    if (/bill|legislation|vote|sponsor|amendment/.test(kw))        return [SOURCES.congress,    SOURCES.ballotpedia, SOURCES.ap];
    if (/space|orbit|planet|mars|moon|nasa|satellite/.test(kw))   return [SOURCES.nasa,        SOURCES.ap,          SOURCES.reuters];
    const sets = {
        factual:     [SOURCES.ap,         SOURCES.factcheck,   SOURCES.dispatch],
        statistical: [SOURCES.ourworld,   SOURCES.bls,         SOURCES.reuters],
        historical:  [SOURCES.britannica, SOURCES.archives,    SOURCES.historian],
        opinion:     [SOURCES.allsides,   SOURCES.mbfc,        SOURCES.factcheck],
        emotional:   [SOURCES.factcheck,  SOURCES.snopes,      SOURCES.leadstories],
        scientific:  [SOURCES.pubmed,     SOURCES.nih,         SOURCES.ourworld],
        legal:       [SOURCES.congress,   SOURCES.scotus,      SOURCES.ballotpedia],
        economic:    [SOURCES.fred,       SOURCES.bls,         SOURCES.wsj],
        civic:       [SOURCES.fec,        SOURCES.congress,    SOURCES.ballotpedia],
    };
    return sets[claimType] || [SOURCES.ap, SOURCES.factcheck, SOURCES.reuters];
}

// ── CLAIM TRIAGE ─────────────────────────────────────────────────────────
function triageClaim(claim) {
    const c = claim.toLowerCase();
    if (/\b(\d+%|\d+ percent|statistics|data shows|studies|research shows|according to)\b/.test(c)) return "statistical";
    if (/\b(in \d{4}|during the|historically|century|decade|era|president .* said)\b/.test(c))      return "historical";
    if (/\b(i think|i believe|in my opinion|we should|should be|it's wrong|must|ought)\b/.test(c))  return "opinion";
    if (/\b(law|illegal|legal|court|ruling|constitution|rights|ban|crime|arrested)\b/.test(c))      return "legal";
    if (/\b(economy|gdp|inflation|unemployment|market|stock|wage|tax|debt|deficit)\b/.test(c))      return "economic";
    if (/\b(vaccine|study|science|research|doctor|cancer|drug|treatment|proven)\b/.test(c))         return "scientific";
    if (/\b(vote|bill|sponsor|committee|donor|campaign|pac|legislature)\b/.test(c))                 return "civic";
    if (/\b(outrage|shocking|disgusting|unbelievable|wake up|hidden|secret|destroy)\b/.test(c))     return "emotional";
    return "factual";
}

function extractDNA(claim) {
    const words = claim.split(/\s+/);
    return {
        keywords: words.filter(w => w.length > 4).map(w => w.toLowerCase().replace(/[^a-z]/g, "")),
        entities: words.filter(w => /^[A-Z][a-z]+/.test(w) || /^\d+/.test(w)),
        checkable: words.length >= 4 && !/^(some|many|people|they|everyone)\b/i.test(claim),
    };
}

// ── PROMPT BUILDER ────────────────────────────────────────────────────────
function buildPrompt(claim, claimType, dna, civicContext) {
    const civicBlock = civicContext ? `
CIVIC CONTEXT (verified data from official sources — use as primary factual baseline):
- Representative: ${civicContext.name} (${civicContext.party || "?"})
- District: ${civicContext.district || "?"}
- State: ${civicContext.state || "?"}
- Total FEC fundraising: ${civicContext.fec_total || "unknown"}
- Top donor industries: ${civicContext.top_donors || "unknown"}
- Bills sponsored/cosponsored: ${civicContext.bills_count || "unknown"}
- Committees: ${civicContext.committees || "unknown"}
- Ballotpedia: ${civicContext.ballotpedia_url || ""}
` : "";

    return `You are Honest Abe, a truth analysis engine built for civic transparency.

CORE PRINCIPLE: Truth is not always in the middle. Some claims are just false. When evidence is clear, say so clearly. Hedging in the face of clear evidence is itself a form of dishonesty.
${civicBlock}
CLAIM TO ANALYZE: "${claim}"
CLAIM TYPE: ${claimType}
KEY ENTITIES: ${dna.entities.join(", ") || "none identified"}

Follow this 6-step analysis:

STEP 1 — DECOMPOSE: Break into atomic assertions. Classify each as: factual, statistical, attribution, predictive, or value judgment.

STEP 2 — SEARCH: For each factual/statistical/attribution assertion, identify what the primary source actually says vs. what the claim implies.

STEP 3 — NEUTRALIZE: Write a neutral restatement of the underlying facts, stripped of emotional framing, selective emphasis, and rhetorical devices.

STEP 4 — MANIPULATE: Compare the original claim to your neutral restatement. Identify specific techniques from this taxonomy:
- STATISTICAL: cherry-picked timeframes, base rate deception, percentage vs. absolute switching
- FRAMING: same fact with engineered emotional valence
- OMISSION: technically true but creates false impression by missing critical context
- ATTRIBUTION: quotes out of context, wrong actor, misattributed statements
- FALSE EQUIVALENCE: manufacturing controversy where consensus exists
- EMOTIONAL: fear/outrage language designed to bypass rational evaluation
- DEFINITIONAL: redefining terms to make false claims technically true
- TEMPORAL: outdated information presented as current

STEP 5 — VERDICT: Based on the gap between claim and evidence, assign verdict.

STEP 6 — GUIDE: What should the user verify? Where is this analysis weakest?

Respond ONLY with valid JSON — no text before or after, no markdown fences:
{
  "verdictLabel": "TRUE" | "MOSTLY TRUE" | "MISLEADING" | "MOSTLY FALSE" | "FALSE" | "OPINION" | "UNVERIFIABLE",
  "confidence": 0.0-1.0,
  "confidenceLabel": "HIGH" | "MODERATE" | "LOW" | "INFERENCE ONLY",
  "neutralRestatement": "The underlying facts stripped of framing. 2-3 sentences.",
  "manipulationTechniques": ["specific techniques from taxonomy"],
  "manipulationScore": 0.0-1.0,
  "plainSummary": "2-3 sentences. Be direct. If false, say so.",
  "reasoning": "Why this verdict? What evidence exists or doesn't?",
  "civicDataUsed": true | false,
  "sourceQuality": 0.0-1.0,
  "corroboration": 0.0-1.0,
  "contextIntegrity": 0.0-1.0,
  "logicalSoundness": 0.0-1.0,
  "falsifiability": 0.0-1.0,
  "transparency": 0.0-1.0,
  "framingFlags": ["short list of specific language flags"],
  "educatedInference": "If UNVERIFIABLE or LOW: best probabilistic estimate clearly labeled as inference. Otherwise null.",
  "pathForward": "What to verify independently. Where this analysis is weakest.",
  "claimDNA": {
    "verifiablePieces": ["atomic assertions that can be checked"],
    "unverifiablePieces": ["assertions that cannot be verified"]
  }
}`;
}

// ── PATTERN FALLBACK ─────────────────────────────────────────────────────
const MANIPULATION_PATTERNS = [
    { re: /\b(always|never|every|all|none|no one|everyone)\b/i,         flag: "Absolute language — reality is rarely absolute" },
    { re: /\b(they don't want you|hidden|secret|won't tell you)\b/i,    flag: "Conspiracy framing — implies suppressed truth" },
    { re: /\b(wake up|open your eyes|do your research)\b/i,             flag: "Distrust authority framing" },
    { re: /\b(destroy|invasion|crisis|catastrophe|disaster)\b/i,        flag: "Apocalyptic framing — emotional amplification" },
    { re: /\b(studies show|research proves|experts say)\b/i,            flag: "Vague authority citation — no specific source" },
    { re: /\b(some people|many people|a lot of people)\b/i,             flag: "Unattributed attribution" },
    { re: /\b(according to|sources say|reportedly)\b/i,                 flag: "Unnamed sourcing — verify independently" },
    { re: /\b(\d+%|\d+ percent)\b/i,                                    flag: "Statistical claim — check denominator and timeframe" },
];

function patternAnalysis(claim, claimType, dna) {
    const flags = MANIPULATION_PATTERNS.filter(p => p.re.test(claim)).map(p => p.flag);
    const manip = Math.min(1, flags.length * 0.18);
    return {
        verdictLabel: "UNVERIFIABLE",
        confidence: flags.length > 0 ? 0.55 : 0.35,
        confidenceLabel: "INFERENCE ONLY",
        neutralRestatement: "AI providers unavailable. Pattern analysis only — no factual baseline established.",
        manipulationTechniques: flags,
        manipulationScore: manip,
        plainSummary: flags.length > 0
            ? `Pattern analysis detected ${flags.length} warning sign(s). AI analysis unavailable for deeper verification.`
            : "No manipulation patterns detected in language. AI unavailable for factual verification.",
        reasoning: flags.length > 0
            ? `Language patterns suggest: ${flags.join("; ")}.`
            : "No strong manipulation language patterns found.",
        civicDataUsed: false,
        sourceQuality: 0.5, corroboration: 0.5, contextIntegrity: 0.5,
        logicalSoundness: 0.5, falsifiability: 0.5, transparency: 0.5,
        framingFlags: flags,
        educatedInference: `Pattern scan only: ${flags.length} warning sign(s). Verify carefully before sharing.`,
        pathForward: "Start with the sources listed below. Look for a primary source — an official record, government data, or peer-reviewed study.",
        claimDNA: {
            verifiablePieces: dna.entities.length > 0 ? dna.entities : ["No specific verifiable entities found"],
            unverifiablePieces: dna.checkable ? [] : ["Claim is too vague to fact-check specifically"],
        },
        provider: "pattern", method: "pattern",
    };
}

// ── NLP ENGINE ────────────────────────────────────────────────────────────
class NLPEngine {
    constructor() {
        this._cache  = new Map();
        this._audit  = [];
        this._active = null;
    }

    /**
     * @param {string} claim
     * @param {object} [context]
     * @param {object} [context.civic] — rep data injected from civic profile URL params
     */
    async analyze(claim, context = {}) {
        const key = claim.trim().toLowerCase() + "|" + (context.civic?.name || "") + "|" + (context.civic?.district || "") + "|" + (context.civic?.state || "");
        if (this._cache.has(key)) return this._cache.get(key);

        const claimType = triageClaim(claim);
        const dna       = extractDNA(claim);
        const prompt    = buildPrompt(claim, claimType, dna, context.civic || null);

        this._log("triage", "CLASSIFIED", claimType);
        if (context.civic) this._log("civic", "CONTEXT_LOADED", context.civic.name);

        let result = null;

        for (const adapter of getProviders()) {
            try {
                const avail = await this._timeout(Promise.resolve(adapter.available()), 2000);
                if (!avail) { this._log(adapter.name, "UNAVAILABLE"); continue; }

                this._log(adapter.name, "ATTEMPTING", claim.slice(0, 60));
                const timeout = adapter.name === "Puter.js" ? 30000 : 15000;
                const raw     = await this._timeout(adapter.query(prompt), timeout);
                const parsed  = this._parse(raw, adapter.name);

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

        const sources    = getSourcesForClaim(claimType, dna.keywords);
        const dimensions = {
            sourceQuality:    result.sourceQuality,
            corroboration:    result.corroboration,
            contextIntegrity: result.contextIntegrity,
            logicalSoundness: result.logicalSoundness,
            falsifiability:   result.falsifiability,
            transparency:     result.transparency,
        };
        const credibilityScore = Object.values(dimensions).reduce((a, b) => a + b, 0) / 6;
        const verdict = claimType === "opinion"
            ? "OPINION"
            : (result.verdictLabel || this._scoreToVerdict(credibilityScore, result.confidence));

        const final = {
            ...result,
            verdict,
            claimType,
            sources,
            credibilityScore,
            dimensions,
            civicContext: context.civic || null,
        };

        this._cache.set(key, final);
        return final;
    }

    _scoreToVerdict(score, confidence) {
        if (score >= 0.82) return "TRUE";
        if (score >= 0.65) return "MOSTLY TRUE";
        if (score >= 0.50) return "MISLEADING";
        if (score >= 0.35) return "MOSTLY FALSE";
        if (score >= 0.20) return "FALSE";
        return confidence < 0.4 ? "UNVERIFIABLE" : "MISLEADING";
    }

    _parse(raw, provider) {
        try {
            let clean = raw
                .replace(/<think>[\s\S]*?<\/think>/gi, "")
                .replace(/```json|```/g, "")
                .trim();
            const match = clean.match(/\{[\s\S]*\}/);
            if (match) clean = match[0];
            const p = JSON.parse(clean);
            return {
                verdictLabel:          p.verdictLabel || null,
                confidence:            this._clamp(p.confidence),
                confidenceLabel:       p.confidenceLabel || null,
                neutralRestatement:    p.neutralRestatement || "",
                manipulationTechniques:Array.isArray(p.manipulationTechniques) ? p.manipulationTechniques : [],
                manipulationScore:     this._clamp(p.manipulationScore),
                plainSummary:          p.plainSummary || "",
                reasoning:             p.reasoning || "",
                civicDataUsed:         !!p.civicDataUsed,
                sourceQuality:         this._clamp(p.sourceQuality),
                corroboration:         this._clamp(p.corroboration),
                contextIntegrity:      this._clamp(p.contextIntegrity),
                logicalSoundness:      this._clamp(p.logicalSoundness),
                falsifiability:        this._clamp(p.falsifiability),
                transparency:          this._clamp(p.transparency),
                framingFlags:          Array.isArray(p.framingFlags) ? p.framingFlags : [],
                educatedInference:     p.educatedInference || null,
                pathForward:           p.pathForward || null,
                claimDNA:              p.claimDNA || { verifiablePieces: [], unverifiablePieces: [] },
                provider, method: "llm",
            };
        } catch { return null; }
    }

    _clamp(v) { const n = parseFloat(v); return isNaN(n) ? 0.5 : Math.min(1, Math.max(0, n)); }

    _timeout(p, ms) {
        return Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);
    }

    _log(provider, status, detail) {
        this._audit.push({ provider, status, detail, ts: Date.now() });
        console.log(`[Honest Abe] ${provider} → ${status}`, detail ?? "");
    }

    audit() { return { log: this._audit, activeProvider: this._active, cacheSize: this._cache.size }; }
}

const nlp = new NLPEngine();
if (typeof module !== "undefined") module.exports = { NLPEngine, nlp };
