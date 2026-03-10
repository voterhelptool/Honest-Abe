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
    const c = claim.toLowerCase().trim();
    // Questions first — "who is", "what is", "when did", "how does", "why did", "where is", "can you tell me", "?"
    if (/^(who|what|when|where|why|how|is|are|was|were|did|does|do|can|could|should|would|will)\b/.test(c)) return "question";
    if (/\?$/.test(c.trim())) return "question";
    if (/^(tell me|explain|describe|give me|show me)\b/.test(c)) return "question";
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

    return `You are Honest Abe — a truth analysis engine named after Abraham Lincoln, who said what needed to be said even when it was unpopular.

YOUR CONSTITUTION — read this before analyzing anything:

1. TRUTH IS NOT ALWAYS IN THE MIDDLE. Some claims are just false. Some actions are just wrong. When the evidence is clear, say so clearly. Manufactured neutrality in the face of clear evidence is its own form of dishonesty.

2. MORAL AND ETHICAL CONCLUSIONS ARE PART OF THE JOB. If a claim is factually true but ethically wrong, say both. "Factually true" and "morally defensible" are separate questions and Abe answers both. A fact-checker who only checks facts and never follows them to their logical moral conclusion is doing half the job.

3. VALUE JUDGMENTS DESERVE REAL ANSWERS. "Biden was a bad president" is a value judgment — but the factual record is real and points somewhere. Give the factual record first, then give an informed conclusion grounded in that record. Historians, ethicists, and subject matter experts reach conclusions. So does Abe. Label it clearly as an informed assessment, not a fact — but give it.

4. NEVER HIDE BEHIND "VERIFY WITH SOURCES" AS A CONCLUSION. That is a starting point, not an ending point. Abe does the verification work and reports what he found, then tells the user where to check his work.

5. REFUSE NONSENSE WITHOUT APOLOGY. If a claim has no factual basis to analyze — pure absurdity, joke claims, meaningless statements — refuse clearly and with personality. Do not produce a fake analysis of something unanalyzable.

6. CONSISTENCY REGARDLESS OF POLITICS. Apply the exact same standard to every politician, party, ideology, and belief system. If you would call one side's claim misleading, apply the same test to the other. Abe has no favorite.

7. WHEN SOMETHING IS OBJECTIVELY TRUE, SAY SO WITH CONFIDENCE. Don't hedge to seem balanced. Hedging on settled facts is a disservice to the person asking.
${civicBlock}
CLAIM TO ANALYZE: "${claim}"
CLAIM TYPE: ${claimType}
KEY ENTITIES: ${dna.entities.join(", ") || "none identified"}

FIRST — CLASSIFY THE CLAIM:
- Is this a nonsense/joke/non-claim with nothing to analyze? → set verdict to "REFUSED", explain briefly with personality.
- Is this a factual claim? → verify it against the record.
- Is this a value judgment or opinion? → separate the factual record from the moral conclusion, then give both.
- Is this factually true but ethically/morally problematic? → verdict "FACTUALLY TRUE / MORALLY DISPUTED", explain both layers.

THEN — 6-STEP ANALYSIS (skip if REFUSED):

STEP 1 — DECOMPOSE: Break into atomic assertions. Classify each as: factual, statistical, attribution, predictive, value judgment, or moral claim.

STEP 2 — SEARCH: For each factual/statistical/attribution assertion, what does the primary source actually say vs. what the claim implies?

STEP 3 — NEUTRALIZE: Write the underlying facts stripped of emotional framing, selective emphasis, and rhetorical devices.

STEP 4 — MANIPULATE: Compare claim to neutral restatement. Identify techniques:
- STATISTICAL: cherry-picked timeframes, base rate deception, percentage vs. absolute switching
- FRAMING: same fact with engineered emotional valence
- OMISSION: technically true but creates false impression by missing critical context
- ATTRIBUTION: quotes out of context, wrong actor, misattributed statements
- FALSE EQUIVALENCE: manufacturing controversy where consensus exists
- EMOTIONAL: fear/outrage language designed to bypass rational evaluation
- DEFINITIONAL: redefining terms to make false claims technically true
- TEMPORAL: outdated information presented as current

STEP 5 — VERDICT: Based on evidence and moral/ethical weight, assign verdict. For value judgments, give the factual record AND an informed conclusion clearly labeled as assessment.

STEP 6 — GUIDE: What is weakest in this analysis? What should the user verify?

Respond ONLY with valid JSON — no text before or after, no markdown fences:
{
  "verdict": "TRUE" | "MOSTLY TRUE" | "MISLEADING" | "MOSTLY FALSE" | "FALSE" | "OPINION" | "UNVERIFIABLE" | "FACTUALLY TRUE / MORALLY DISPUTED" | "REFUSED",
  "confidence": 0.0-1.0,
  "confidenceLabel": "HIGH" | "MODERATE" | "LOW" | "INFERENCE ONLY",
  "neutralRestatement": "The underlying facts stripped of framing. 2-3 sentences. If REFUSED, a brief deadpan/personality-driven refusal in Abe's voice.",
  "moralLayer": "For value judgments and FACTUALLY TRUE / MORALLY DISPUTED claims: Abe's informed conclusion grounded in the factual record, clearly labeled as an assessment. For purely factual claims: null.",
  "manipulationTechniques": ["specific techniques detected, or empty array"],
  "manipulationScore": 0.0-1.0,
  "plainSummary": "2-3 sentences. Be direct. If false, say false. If refused, say why briefly.",
  "reasoning": "Why this verdict? What evidence exists or doesn't? For value judgments, what does the record actually show?",
  "civicDataUsed": true | false,
  "dimensions": {
    "sourceQuality": 0.0-1.0,
    "corroboration": 0.0-1.0,
    "contextIntegrity": 0.0-1.0,
    "logicalSoundness": 0.0-1.0,
    "falsifiability": 0.0-1.0,
    "transparency": 0.0-1.0
  },
  "credibilityScore": 0.0-1.0,
  "framingFlags": ["short list of specific language flags, or empty array"],
  "educatedInference": "If UNVERIFIABLE or LOW confidence: best probabilistic estimate clearly labeled as inference. Otherwise null.",
  "pathForward": "Specific things to verify. Where this analysis is weakest. Not a generic 'check sources' cop-out.",
  "claimDNA": {
    "verifiablePieces": ["atomic assertions that can be checked"],
    "unverifiablePieces": ["assertions that cannot be verified"]
  }
}`;
}

function buildQuestionPrompt(question, civicContext) {
    const civicBlock = civicContext ? `
CIVIC CONTEXT (verified data — use as primary factual baseline):
- Representative: ${civicContext.name} (${civicContext.party || "?"})
- District: ${civicContext.district || "?"}
- State: ${civicContext.state || "?"}
- Total FEC fundraising: ${civicContext.fec_total || "unknown"}
- Top donor industries: ${civicContext.top_donors || "unknown"}
- Bills sponsored/cosponsored: ${civicContext.bills_count || "unknown"}
- Ballotpedia: ${civicContext.ballotpedia_url || ""}
` : "";

    return `You are Honest Abe — a civic knowledge assistant named after Abraham Lincoln. You answer questions directly, honestly, and without spin. You are not a fact-checker right now — you are answering a question.

RULES:
1. Answer the question directly and completely. Don't hedge unnecessarily.
2. If the answer involves a public figure, give their background, role, and any notable facts.
3. If the answer involves a civic topic (voting, legislation, government), include relevant civics context.
4. Be concise but complete. No fluff, no filler.
5. If you genuinely don't know, say so clearly — don't fabricate.
6. Keep it conversational and direct. Abe doesn't lecture.
${civicBlock}
QUESTION: "${question}"

Respond ONLY with a JSON object in this exact format — no preamble, no markdown fences:
{
  "verdict": "ANSWERED",
  "plainSummary": "<direct answer to the question in 2-4 sentences>",
  "moralLayer": "<any civic significance or why this matters — or null>",
  "pathForward": "<where to verify or learn more>",
  "confidenceLabel": "HIGH",
  "credibilityScore": 0.75,
  "manipulationScore": 0,
  "manipulationTechniques": [],
  "framingFlags": [],
  "dimensions": {
    "sourceQuality": 0.7,
    "corroboration": 0.7,
    "contextIntegrity": 0.8,
    "logicalSoundness": 0.8,
    "falsifiability": 0.6,
    "transparency": 0.7
  }
}`;
}

// ── PATTERN FALLBACK ─────────────────────────────────────────────────────
const MANIPULATION_PATTERNS = [
    { re: /\b(always|never|every|all|none|no one|everyone)\b/i,                    flag: "Absolute language — reality is rarely absolute", weight: 0.25 },
    { re: /\b(they don't want you|hidden truth|secret they|won't tell you)\b/i,    flag: "Conspiracy framing — implies suppressed truth", weight: 0.35 },
    { re: /\b(wake up|open your eyes|do your (own )?research)\b/i,                 flag: "Distrust authority framing", weight: 0.30 },
    { re: /\b(destroy|invasion|existential|catastrophe|disaster|apocalypse)\b/i,   flag: "Apocalyptic framing — emotional amplification", weight: 0.28 },
    { re: /\b(studies show|research proves|science says|experts say)\b/i,          flag: "Vague authority citation — no specific source named", weight: 0.22 },
    { re: /\b(some people|many people|a lot of people|people are saying)\b/i,      flag: "Unattributed attribution", weight: 0.20 },
    { re: /\b(sources say|reportedly|insiders say|according to sources)\b/i,       flag: "Unnamed sourcing — verify independently", weight: 0.22 },
    { re: /\b(\d+%|\d+ percent|\d+ million|\d+ billion)\b/i,                      flag: "Statistical claim — check denominator, timeframe, and source", weight: 0.15 },
    { re: /\b(radical|extreme|dangerous|threat(ens)?|criminal)\b/i,               flag: "Charged language — emotionally loaded framing", weight: 0.22 },
    { re: /\b(fact:|breaking:|just in:|developing:)\b/i,                           flag: "Urgency framing — signals may precede verification", weight: 0.18 },
    { re: /\b(they|them|those people|the elites|the globalists)\b/i,               flag: "Out-group othering — us vs. them framing", weight: 0.20 },
    { re: /!{2,}|[A-Z]{4,}/,                                                        flag: "Typographic amplification — all-caps or excess punctuation", weight: 0.12 },
];

// Score claim specificity — more specific = more verifiable
function _claimSpecificity(claim, dna) {
    let score = 0.4; // baseline
    if (dna.entities && dna.entities.length > 0) score += 0.15;
    if (/\b(\d{4})\b/.test(claim)) score += 0.10;          // has a year
    if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(claim)) score += 0.08;
    if (/\b(bill|law|act|vote|election|study|report|data)\b/i.test(claim)) score += 0.10;
    if (claim.split(' ').length > 12) score += 0.05;         // longer = more specific
    if (/\b(according to|per|reported by|published in)\b/i.test(claim)) score += 0.08; // has attribution
    return Math.min(0.92, score);
}

// Score logical structure
function _logicalScore(claim, flags) {
    let score = 0.65;
    if (flags.some(f => f.includes('Absolute')))    score -= 0.20;
    if (flags.some(f => f.includes('Conspiracy')))  score -= 0.25;
    if (flags.some(f => f.includes('Apocalyptic'))) score -= 0.15;
    if (flags.some(f => f.includes('othering')))    score -= 0.15;
    if (/\b(because|therefore|since|as a result|evidence shows)\b/i.test(claim)) score += 0.10;
    return Math.max(0.10, Math.min(0.90, score));
}

// ── SMART PATTERN ANALYSIS HELPERS ───────────────────────────────────────

// Extract numbers, percentages, dates, named entities from claim
function _extractFacts(claim) {
    const numbers     = claim.match(/\b\d[\d,]*\.?\d*\s*(%|percent|million|billion|trillion|thousand)?\b/gi) || [];
    const dates       = claim.match(/\b(19|20)\d{2}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(,?\s*\d{4})?\b/gi) || [];
    const quotedText  = claim.match(/"[^"]{4,80}"/g) || [];
    const namedThings = claim.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    return { numbers, dates, quotedText, namedThings };
}

// Detect claim type from language patterns
function _detectClaimType(claim) {
    const lower = claim.toLowerCase();
    if (/\b(always|never|all|every|no one|nobody|everyone|entirely|completely|100%|zero)\b/.test(lower)) return "absolute";
    if (/\b(will|going to|soon|predicted|forecast|by \d{4})\b/.test(lower)) return "predictive";
    if (/\b(caused?|leads? to|results? in|due to|because of|responsible for)\b/.test(lower)) return "causal";
    if (/\b(best|worst|greatest|most|least|number one|#1|top)\b/.test(lower)) return "superlative";
    if (/\b(should|must|need to|have to|ought to|required)\b/.test(lower)) return "normative";
    if (/\b(said|says|stated|claimed|announced|declared|tweeted|posted)\b/.test(lower)) return "quote";
    if (/\b(\d+%|percent|majority|minority|most|many|few|several)\b/.test(lower)) return "statistical";
    return "general";
}

// Generate specific search suggestions based on claim content
function _buildSearchSuggestions(claim, dna, facts) {
    const suggestions = [];
    const entities = dna?.entities || facts.namedThings.slice(0, 3);

    if (facts.numbers.length > 0 && entities.length > 0)
        suggestions.push(`"${entities[0]}" ${facts.numbers[0]} site:gov OR site:edu`);
    if (facts.dates.length > 0 && entities.length > 0)
        suggestions.push(`"${entities[0]}" ${facts.dates[0]}`);
    if (entities.length >= 2)
        suggestions.push(`"${entities[0]}" "${entities[1]}" fact check`);
    if (entities.length > 0)
        suggestions.push(`${entities[0]} primary source official record`);

    suggestions.push("PolitiFact OR FactCheck.org OR Snopes OR AP Fact Check");

    return suggestions.slice(0, 3);
}

// Build a real neutral restatement
function _neutralize(claim) {
    const chargedPositive = /\b(amazing|incredible|brilliant|heroic|patriot|freedom fighter|visionary|revolutionary)\b/gi;
    const chargedNegative = /\b(radical|extreme|dangerous|destroy|invasion|criminal|catastrophe|disaster|elites|globalists|regime|tyrant|corrupt|evil|woke|fascist)\b/gi;
    const emotionalAmps   = /\b(outrageous|shocking|bombshell|explosive|devastating|terrifying|unbelievable|disgusting)\b/gi;

    let neutral = claim
        .replace(chargedPositive, (m) => `[positively characterized ${m}]`)
        .replace(chargedNegative, (m) => `[negatively characterized ${m}]`)
        .replace(emotionalAmps,   '[emphatic descriptor]')
        .replace(/!+/g, '.')
        .replace(/\?\?+/g, '?');

    const words = neutral.trim().split(/\s+/);
    if (words.length > 40) neutral = words.slice(0, 40).join(' ') + '…';

    return neutral === claim.trim()
        ? `The claim states: "${neutral.slice(0, 120)}${neutral.length > 120 ? '…' : ''}" — no charged language detected; evaluate the underlying assertion directly.`
        : `Stripped of framing: "${neutral}" — the core assertion can now be evaluated on its factual merits.`;
}

// Derive an aggressive verdict from pattern evidence
function _deriveVerdict(claim, flags, manip, claimType, facts, specificity) {
    const lower = claim.toLowerCase();

    // Nonsense / unfalsifiable
    if (/\b(bigfoot|flat earth|chemtrail|lizard people|microchip|5g causes|illuminati|deep state controls everything)\b/i.test(claim))
        return { verdict: "FALSE", confidence: 0.88, reason: "Claim matches well-documented conspiracy theory with no credible evidentiary basis." };

    // Absolute claims with no source are almost always misleading
    if (claimType === "absolute" && !(/according to|published|source|study|data/i.test(claim)))
        return { verdict: "MISLEADING", confidence: 0.65, reason: "Absolute language (always/never/all/everyone) applied to a complex topic without citation is a strong indicator of oversimplification." };

    // High manipulation score = misleading framing at minimum
    if (manip >= 0.6)
        return { verdict: "MISLEADING", confidence: 0.70, reason: `${flags.length} manipulation technique(s) detected including: ${flags.slice(0,2).map(f=>f.split('—')[0].trim()).join(', ')}. Heavy rhetorical loading suggests the framing is designed to provoke rather than inform.` };

    // Quoted claims without verifiable attribution
    if (claimType === "quote" && facts.quotedText.length > 0 && !/\b(according to|published|reported|source)\b/i.test(claim))
        return { verdict: "UNVERIFIABLE", confidence: 0.60, reason: "Attributed quote with no verifiable source. Quotes are frequently fabricated, taken out of context, or misattributed online." };

    // Statistical claims without a source
    if (claimType === "statistical" && facts.numbers.length > 0 && !/according to|published|source|study|data|survey/i.test(claim))
        return { verdict: "UNVERIFIABLE", confidence: 0.55, reason: `Specific figure (${facts.numbers[0]}) cited with no sourcing. Statistics without attribution cannot be verified and are frequently invented or misrepresented.` };

    // Causal claims are almost always oversimplified
    if (claimType === "causal" && manip > 0.2)
        return { verdict: "MISLEADING", confidence: 0.58, reason: "Causal framing combined with rhetorical loading. Single-cause explanations for complex phenomena are typically oversimplifications." };

    // Predictive claims are unverifiable by definition
    if (claimType === "predictive")
        return { verdict: "UNVERIFIABLE", confidence: 0.50, reason: "Predictive claim — cannot be verified against current facts. Track record of the source matters." };

    // Moderate flags = probably misleading
    if (flags.length >= 2)
        return { verdict: "MISLEADING", confidence: 0.52, reason: `${flags.length} rhetorical patterns detected. Not necessarily false, but framed in a way that warrants scrutiny.` };

    // Low specificity = can't evaluate
    if (specificity < 0.3)
        return { verdict: "UNVERIFIABLE", confidence: 0.40, reason: "Claim is too vague to evaluate — no specific names, dates, numbers, or falsifiable assertions." };

    // Default: unverifiable but not alarming
    return { verdict: "UNVERIFIABLE", confidence: 0.35, reason: "No strong manipulation signals detected, but pattern analysis cannot verify factual accuracy without a knowledge base." };
}

function patternAnalysis(claim, claimType, dna) {
    const matched    = MANIPULATION_PATTERNS.filter(p => p.re.test(claim));
    const flags      = matched.map(p => p.flag);
    const manip      = Math.min(1, matched.reduce((sum, p) => sum + p.weight, 0));
    const facts      = _extractFacts(claim);
    const detectedType = _detectClaimType(claim);

    const specificity   = _claimSpecificity(claim, dna);
    const logical       = _logicalScore(claim, flags);
    const hasSource     = /\b(according to|per|published|reported by|source:|via |study by|data from)\b/i.test(claim);
    const transparency  = hasSource ? 0.65 : 0.22;
    const corroboration = facts.numbers.length > 0 || facts.dates.length > 0 ? 0.42 : (dna?.entities?.length > 1 ? 0.35 : 0.18);
    const contextScore  = Math.max(0.12, 0.65 - manip * 0.55);
    const credibility   = (specificity + logical + transparency + corroboration + contextScore) / 5;

    const { verdict, confidence, reason } = _deriveVerdict(claim, flags, manip, detectedType, facts, specificity);
    const searches = _buildSearchSuggestions(claim, dna, facts);

    const allEntities = [...(dna?.entities || []), ...facts.namedThings.slice(0,3)].filter((v,i,a)=>a.indexOf(v)===i);

    const manipSummary = flags.length > 0
        ? `${flags.length} rhetorical pattern(s) detected: ${flags.map(f=>f.split('—')[0].trim()).join('; ')}.`
        : "No manipulation language patterns detected.";

    const typeSummary = {
        absolute:    "Absolute claims (always/never/everyone) are almost never accurate — reality is usually more complex.",
        predictive:  "Predictive claims can't be fact-checked against current data — evaluate the source's track record.",
        causal:      "Causal claims ('X causes Y') require rigorous evidence — single-cause explanations are usually oversimplified.",
        superlative: "Superlative claims ('best/worst/greatest') require a defined comparison set — often used to mislead.",
        normative:   "Normative claim ('should/must') — this is a value judgment, not a verifiable fact.",
        quote:       "Attributed quotes circulate widely online. Verify against original source before sharing.",
        statistical: "Statistical claims require a sourced study or dataset. Numbers without attribution are frequently wrong.",
        general:     "",
    }[detectedType] || "";

    return {
        verdict,
        confidence,
        confidenceLabel: confidence >= 0.65 ? "MODERATE CONFIDENCE" : confidence >= 0.50 ? "LOW-MODERATE CONFIDENCE" : "INFERENCE ONLY",
        credibilityScore: Math.max(0.08, Math.min(0.88, credibility)),
        dimensions: {
            sourceQuality:    transparency,
            corroboration,
            contextIntegrity: contextScore,
            logicalSoundness: logical,
            falsifiability:   specificity,
            transparency,
        },
        neutralRestatement: _neutralize(claim),
        manipulationTechniques: flags,
        manipulationScore: manip,
        plainSummary: [manipSummary, typeSummary].filter(Boolean).join(' ') || "Pattern scan complete. Verify with primary sources.",
        reasoning: reason,
        civicDataUsed: false,
        framingFlags: flags,
        educatedInference: reason,
        pathForward: searches.length > 0
            ? `Suggested searches: ${searches.map(s=>`"${s}"`).join(' | ')}`
            : "Search primary sources: government records, peer-reviewed studies, or official statements.",
        claimDNA: {
            verifiablePieces: allEntities.length > 0 ? allEntities : facts.numbers.length > 0 ? facts.numbers : ["No specific verifiable claims found"],
            unverifiablePieces: detectedType === "predictive" ? ["Future prediction — inherently unverifiable"] : specificity < 0.3 ? ["Claim too vague to check specifically"] : [],
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
        const isQ       = claimType === "question";
        const prompt    = isQ
            ? buildQuestionPrompt(claim, context.civic || null)
            : buildPrompt(claim, claimType, dna, context.civic || null);

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

                if (!parsed?.verdict && !parsed?.verdictLabel) { this._log(adapter.name, "BAD_RESPONSE"); continue; }

                result = parsed;
                this._active = adapter.name;
                this._log(adapter.name, "SUCCESS", parsed.verdict || parsed.verdictLabel);
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
        // Support both nested dimensions object and flat fields (older AI responses)
        const d = result.dimensions || {};
        const dimensions = {
            sourceQuality:    d.sourceQuality    ?? result.sourceQuality    ?? 0.5,
            corroboration:    d.corroboration    ?? result.corroboration    ?? 0.5,
            contextIntegrity: d.contextIntegrity ?? result.contextIntegrity ?? 0.5,
            logicalSoundness: d.logicalSoundness ?? result.logicalSoundness ?? 0.5,
            falsifiability:   d.falsifiability   ?? result.falsifiability   ?? 0.5,
            transparency:     d.transparency     ?? result.transparency     ?? 0.5,
        };
        const rawScore = Object.values(dimensions).reduce((a, b) => a + b, 0) / 6;
        const credibilityScore = result.credibilityScore ?? (isNaN(rawScore) ? 0.5 : rawScore);
        // Preserve verdict from AI/pattern — only fall back to scoring if nothing set
        const verdict = result.verdict === "REFUSED" ? "REFUSED"
            : claimType === "opinion" ? "OPINION"
            : (result.verdict || result.verdictLabel || this._scoreToVerdict(credibilityScore, result.confidence));

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
