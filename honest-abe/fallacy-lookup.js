/**
 * HONEST ABE — fallacy-lookup.js
 *
 * Normalized lookup table: every realistic variant the AI might return
 * maps to a canonical key that matches Fallacies_[key].jpg exactly.
 *
 * Design principles:
 *  - normalize() strips all spaces, underscores, hyphens, punctuation, lowercases
 *  - ALIAS_MAP covers every plausible model output variant
 *  - CARD_META provides human-readable display name + short description per card
 *  - lookup(raw) returns { key, meta } or null — never throws
 *  - No card shown = silent null, never an error or broken image
 */

// ── CANONICAL KEYS (must match Fallacies_[key].jpg exactly) ──────────────
const CANONICAL_KEYS = [
    "adhominem",
    "ambiguity",
    "anecdotal",
    "appealtoauthority",
    "appealtoemotion",
    "appealtonature",
    "bandwagon",
    "beggingthequestion",
    "blackorwhite",
    "burdenofproof",
    "compositiondivision",
    "falsecause",
    "genetic",
    "loadedquestion",
    "middleground",
    "notruescotsman",
    "personalincredulity",
    "slipperyslope",
    "specialpleading",
    "strawman",
    "thefallacyfallacy",
    "thegamblersfallacy",   // note: filename is thegambersfallacy (typo in original)
    "thetexassharpshooter",
    "tuquoque",
];

// ── FILE KEY OVERRIDES (where filename differs from canonical) ────────────
// e.g. filename is "thegambersfallacy" but we canonicalize as "thegamblersfallacy"
const FILE_KEY_MAP = {
    "thegamblersfallacy": "thegambersfallacy",  // correct the typo in the filename
};

function getFileKey(canonicalKey) {
    return FILE_KEY_MAP[canonicalKey] || canonicalKey;
}

// ── NORMALIZER ────────────────────────────────────────────────────────────
// Strips spaces, underscores, hyphens, apostrophes, punctuation, lowercases
// "Ad Hominem" → "adhominem"
// "straw_man"  → "strawman"
// "The Gambler's Fallacy" → "thegamblersfallacy"
function normalize(str) {
    if (!str || typeof str !== "string") return "";
    return str
        .toLowerCase()
        .replace(/[''\u2018\u2019]/g, "")   // apostrophes
        .replace(/[^a-z0-9]/g, "");         // everything else non-alphanumeric
}

// ── ALIAS MAP ─────────────────────────────────────────────────────────────
// key: normalize(alias), value: canonical key
// Covers: formal names, common shorthand, model hallucination variants,
//         philosophical Latin terms, textbook names, colloquial names
const ALIAS_MAP = {

    // ── AD HOMINEM ──
    "adhominem":                    "adhominem",
    "adhominem":                    "adhominem",
    "attackingtheperson":           "adhominem",
    "personalattack":               "adhominem",
    "personalattacks":              "adhominem",
    "attackingthespeaker":          "adhominem",
    "characterattack":              "adhominem",
    "poisoningthewell":             "adhominem",   // close enough variant
    "guiltybyassociation":          "adhominem",

    // ── AMBIGUITY ──
    "ambiguity":                    "ambiguity",
    "fallaciousambiguity":          "ambiguity",
    "ambiguous":                    "ambiguity",
    "equivocation":                 "ambiguity",
    "equivocationfallacy":          "ambiguity",
    "doublemeaning":                "ambiguity",
    "semanticambiguity":            "ambiguity",
    "vagueness":                    "ambiguity",

    // ── ANECDOTAL ──
    "anecdotal":                    "anecdotal",
    "anecdotalevidence":            "anecdotal",
    "anecdote":                     "anecdotal",
    "anecdotes":                    "anecdotal",
    "isolatedexample":              "anecdotal",
    "personalexperience":           "anecdotal",
    "singleexample":                "anecdotal",
    "toosmallasample":              "anecdotal",
    "hastyinduction":               "anecdotal",

    // ── APPEAL TO AUTHORITY ──
    "appealtoauthority":            "appealtoauthority",
    "argumentfromauthority":        "appealtoauthority",
    "ipseditit":                    "appealtoauthority",
    "argumentumadverecundiam":      "appealtoauthority",
    "falseauthority":               "appealtoauthority",
    "misuseofauthority":            "appealtoauthority",
    "expertfallacy":                "appealtoauthority",
    "appealtoexpert":               "appealtoauthority",
    "argumentfromexpert":           "appealtoauthority",

    // ── APPEAL TO EMOTION ──
    "appealtoemotion":              "appealtoemotion",
    "emotionalappeal":              "appealtoemotion",
    "manipulatingemotions":         "appealtoemotion",
    "argumentumadpassiones":        "appealtoemotion",
    "fearmongering":                "appealtoemotion",
    "fearappeal":                   "appealtoemotion",
    "outragefarming":               "appealtoemotion",
    "emotionalmanipulation":        "appealtoemotion",
    "apealtoemotion":               "appealtoemotion",  // common misspelling

    // ── APPEAL TO NATURE ──
    "appealtonature":               "appealtonature",
    "naturalistic":                 "appealtonature",
    "naturalisticfallacy":          "appealtonature",
    "naturalisbetter":              "appealtonature",
    "appealtothenatural":           "appealtonature",
    "isoughttransition":            "appealtonature",
    "isoughtgap":                   "appealtonature",

    // ── BANDWAGON ──
    "bandwagon":                    "bandwagon",
    "bandwagonfallacy":             "bandwagon",
    "appealtothe majority":         "bandwagon",
    "appealtothe majority":         "bandwagon",
    "argumentumadpopulum":          "bandwagon",
    "appealtopopularity":           "bandwagon",
    "appealtothe crowd":            "bandwagon",
    "appealtocommonpractice":       "bandwagon",
    "popularopinion":               "bandwagon",
    "everyonedoesit":               "bandwagon",
    "majorityappeal":               "bandwagon",

    // ── BEGGING THE QUESTION ──
    "beggingthequestion":           "beggingthequestion",
    "circulatreasoning":            "beggingthequestion",
    "circularreasoning":            "beggingthequestion",
    "circularargument":             "beggingthequestion",
    "petitioprincipii":             "beggingthequestion",
    "viciouscircle":                "beggingthequestion",
    "circularlogic":                "beggingthequestion",
    "assumingtheconclusion":        "beggingthequestion",
    "questionbegging":              "beggingthequestion",

    // ── BLACK OR WHITE ──
    "blackorwhite":                 "blackorwhite",
    "blackandwhite":                "blackorwhite",
    "falsedichotomy":               "blackorwhite",
    "falsedilemma":                 "blackorwhite",
    "eitheror":                     "blackorwhite",
    "bifurcation":                  "blackorwhite",
    "allornothingthinking":         "blackorwhite",
    "falsebinary":                  "blackorwhite",
    "artificialdichotomy":          "blackorwhite",
    "excludedmiddle":               "blackorwhite",
    "falseblackandwhite":           "blackorwhite",
    "eitheror":                     "blackorwhite",
    "eitherorfallacy":              "blackorwhite",

    // ── BURDEN OF PROOF ──
    "burdenofproof":                "burdenofproof",
    "shiftingtheburden":            "burdenofproof",
    "burdenofprooffallacy":         "burdenofproof",
    "onerusprobandi":               "burdenofproof",
    "proveyouwrong":                "burdenofproof",
    "proveapositive":               "burdenofproof",
    "argumentumadignoriam":         "burdenofproof",
    "appealtoignorance":            "burdenofproof",
    "burdenshift":                  "burdenofproof",

    // ── COMPOSITION / DIVISION ──
    "compositiondivision":          "compositiondivision",
    "composition":                  "compositiondivision",
    "division":                     "compositiondivision",
    "fallacyofcomposition":         "compositiondivision",
    "fallacyofdivision":            "compositiondivision",
    "parttowhole":                  "compositiondivision",
    "wholetoprt":                   "compositiondivision",
    "wholetopart":                  "compositiondivision",
    "collectivefallacy":            "compositiondivision",

    // ── FALSE CAUSE ──
    "falsecause":                   "falsecause",
    "falsecausation":               "falsecause",
    "correlationisnotcausation":    "falsecause",
    "correlationcausation":         "falsecause",
    "posthocergopropterhoc":        "falsecause",
    "posthoc":                      "falsecause",
    "cumhocergopropterhoc":         "falsecause",
    "spuriouscorrelation":          "falsecause",
    "confusecorrelationwithcausation": "falsecause",
    "wrongcause":                   "falsecause",

    // ── GENETIC ──
    "genetic":                      "genetic",
    "geneticfallacy":               "genetic",
    "originoftheidea":              "genetic",
    "dismissingthesource":          "genetic",
    "sourceattack":                 "genetic",
    "whereditcomesfrom":            "genetic",
    "originbaseddismissal":         "genetic",

    // ── LOADED QUESTION ──
    "loadedquestion":               "loadedquestion",
    "complexquestion":              "loadedquestion",
    "trickyquestion":               "loadedquestion",
    "loadedquestionfallacy":        "loadedquestion",
    "questionbeggingepithet":       "loadedquestion",
    "pluriuminterrogationum":       "loadedquestion",
    "hiddenassumption":             "loadedquestion",
    "presupposition":               "loadedquestion",

    // ── MIDDLE GROUND ──
    "middleground":                 "middleground",
    "argumenttomodeation":          "middleground",
    "argumenttomoderation":         "middleground",
    "falsecompromise":              "middleground",
    "splitting thedifference":      "middleground",
    "splittingthedifference":       "middleground",
    "grayfallacy":                  "middleground",
    "falsemiddle":                  "middleground",
    "bothsidesism":                 "middleground",
    "argumentumadtemperantiam":     "middleground",

    // ── NO TRUE SCOTSMAN ──
    "notruescotsman":               "notruescotsman",
    "notruescotsmanfallacy":        "notruescotsman",
    "adhocrescue":                  "notruescotsman",
    "movingthetarget":              "notruescotsman",
    "redefiningthegroup":           "notruescotsman",
    "purityfallacy":                "notruescotsman",
    "scotsmanfallacy":              "notruescotsman",

    // ── PERSONAL INCREDULITY ──
    "personalincredulity":          "personalincredulity",
    "incredulity":                  "personalincredulity",
    "argumentfromignorance":        "personalincredulity",
    "icantbelieveit":               "personalincredulity",
    "dontunderstandit":             "personalincredulity",
    "toocomplicatedtobetrue":       "personalincredulity",
    "cannotunderstandtherefore":    "personalincredulity",

    // ── SLIPPERY SLOPE ──
    "slipperyslope":                "slipperyslope",
    "slipperyslopefallacy":         "slipperyslope",
    "camelsnose":                   "slipperyslope",
    "thinendofthewedge":            "slipperyslope",
    "dominoeffect":                 "slipperyslope",
    "chainreaction":                "slipperyslope",
    "inevitableconsequence":        "slipperyslope",
    "thendofthewedge":              "slipperyslope",

    // ── SPECIAL PLEADING ──
    "specialpleading":              "specialpleading",
    "movingthetargetspecial":       "specialpleading",
    "exceptionforme":               "specialpleading",
    "rulesfortheenot forme":        "specialpleading",
    "rulesforthenot":               "specialpleading",
    "doublestandard":               "specialpleading",
    "exceptionalism":               "specialpleading",
    "adhocexception":               "specialpleading",

    // ── STRAW MAN ──
    "strawman":                     "strawman",
    "strawmanfallacy":              "strawman",
    "strawmanargument":             "strawman",
    "distortingtheargument":        "strawman",
    "misrepresenting":              "strawman",
    "misrepresentingtheposition":   "strawman",
    "knockdownargument":            "strawman",
    "strawmanning":                 "strawman",

    // ── THE FALLACY FALLACY ──
    "thefallacyfallacy":            "thefallacyfallacy",
    "fallacyfallacy":               "thefallacyfallacy",
    "argumentumadlogicam":          "thefallacyfallacy",
    "badargumentthereforefalse":    "thefallacyfallacy",
    "fallacyofthefallacy":          "thefallacyfallacy",
    "invalidargumentthereforefalse":"thefallacyfallacy",

    // ── THE GAMBLER'S FALLACY ──
    "thegamblersfallacy":           "thegamblersfallacy",
    "gamblersfallacy":              "thegamblersfallacy",
    "thegambersfallacy":            "thegamblersfallacy",
    "gambersfallacy":               "thegamblersfallacy",
    "montecarolofallacy":           "thegamblersfallacy",
    "montecarlofalacy":             "thegamblersfallacy",
    "montecarlofallacy":            "thegamblersfallacy",
    "hothandfallacy":               "thegamblersfallacy",
    "lawofaveragesfallacy":         "thegamblersfallacy",
    "dueforit":                     "thegamblersfallacy",

    // ── TEXAS SHARPSHOOTER ──
    "thetexassharpshooter":         "thetexassharpshooter",
    "texassharpshooter":            "thetexassharpshooter",
    "texassharpshoooterfallacy":    "thetexassharpshooter",
    "texassharpshooterfallacy":     "thetexassharpshooter",
    "cherrypicking":                "thetexassharpshooter",
    "cherrypick":                   "thetexassharpshooter",
    "cherrypickedevidence":         "thetexassharpshooter",
    "datamining":                   "thetexassharpshooter",
    "clusterfallacy":               "thetexassharpshooter",
    "retrofitting":                 "thetexassharpshooter",

    // ── TU QUOQUE ──
    "tuquoque":                     "tuquoque",
    "tuquoquefallacy":              "tuquoque",
    "youtoofallacy":                "tuquoque",
    "youtoo":                       "tuquoque",
    "appealthehypocrisy":           "tuquoque",
    "appealto hypocrisy":           "tuquoque",
    "whataboutism":                 "tuquoque",
    "whatabout":                    "tuquoque",
    "twowrongs":                    "tuquoque",
    "twowrongsmakearight":          "tuquoque",
    "deflection":                   "tuquoque",
};

// ── CARD METADATA ─────────────────────────────────────────────────────────
// Display name + one-line inoculation description shown to user
const CARD_META = {
    adhominem: {
        name: "Ad Hominem",
        desc: "Attacking the person making the argument instead of the argument itself."
    },
    ambiguity: {
        name: "Ambiguity",
        desc: "Using a word or phrase with multiple meanings to mislead or confuse."
    },
    anecdotal: {
        name: "Anecdotal",
        desc: "Using a personal story or single example instead of solid evidence."
    },
    appealtoauthority: {
        name: "Appeal to Authority",
        desc: "Claiming something is true because an authority figure says so, without other evidence."
    },
    appealtoemotion: {
        name: "Appeal to Emotion",
        desc: "Manipulating emotions instead of using evidence and reasoned argument."
    },
    appealtonature: {
        name: "Appeal to Nature",
        desc: "Claiming something is good or right because it's 'natural'."
    },
    bandwagon: {
        name: "Bandwagon",
        desc: "Appealing to popularity — something is true or right because many people believe it."
    },
    beggingthequestion: {
        name: "Begging the Question",
        desc: "The conclusion is assumed within the premise — circular reasoning."
    },
    blackorwhite: {
        name: "Black or White",
        desc: "Presenting only two options when more exist — a false dilemma."
    },
    burdenofproof: {
        name: "Burden of Proof",
        desc: "Claiming something is true until proven false, shifting the burden unfairly."
    },
    compositiondivision: {
        name: "Composition / Division",
        desc: "Assuming what's true of the parts is true of the whole, or vice versa."
    },
    falsecause: {
        name: "False Cause",
        desc: "Assuming correlation means causation — confusing association with cause."
    },
    genetic: {
        name: "Genetic Fallacy",
        desc: "Dismissing an argument based on its source or origin, not its content."
    },
    loadedquestion: {
        name: "Loaded Question",
        desc: "Asking a question that contains a hidden, unproven assumption."
    },
    middleground: {
        name: "Middle Ground",
        desc: "Assuming the compromise between two positions must be correct."
    },
    notruescotsman: {
        name: "No True Scotsman",
        desc: "Moving the goalposts to exclude counterexamples from a general claim."
    },
    personalincredulity: {
        name: "Personal Incredulity",
        desc: "Claiming something is false because you personally find it hard to believe."
    },
    slipperyslope: {
        name: "Slippery Slope",
        desc: "Claiming one event will lead to extreme consequences without evidence."
    },
    specialpleading: {
        name: "Special Pleading",
        desc: "Applying a double standard — demanding exceptions to rules that apply to others."
    },
    strawman: {
        name: "Straw Man",
        desc: "Misrepresenting someone's argument to make it easier to attack."
    },
    thefallacyfallacy: {
        name: "The Fallacy Fallacy",
        desc: "Assuming a conclusion is false just because the argument for it is flawed."
    },
    thegamblersfallacy: {
        name: "The Gambler's Fallacy",
        desc: "Believing past random events affect future probabilities."
    },
    thetexassharpshooter: {
        name: "Texas Sharpshooter",
        desc: "Cherry-picking data to fit a pattern, ignoring data that doesn't."
    },
    tuquoque: {
        name: "Tu Quoque",
        desc: "Deflecting criticism by pointing to someone else's behavior — whataboutism."
    },
};

// ── CORE LOOKUP FUNCTION ──────────────────────────────────────────────────
/**
 * lookup(rawString) → { canonicalKey, fileKey, meta, imageFilename } | null
 *
 * Never throws. Returns null if no match found.
 * Handles: wrong case, spaces, underscores, hyphens, punctuation,
 *          Latin names, colloquial names, model hallucination variants.
 */
function lookupFallacy(raw) {
    if (!raw || typeof raw !== "string") return null;
    const normalized = normalize(raw);
    if (!normalized) return null;

    const canonicalKey = ALIAS_MAP[normalized] || null;
    if (!canonicalKey) return null;

    const fileKey = getFileKey(canonicalKey);
    const meta = CARD_META[canonicalKey] || null;

    return {
        canonicalKey,
        fileKey,
        meta,
        imageFilename: `Fallacies_${fileKey}.jpg`,
    };
}

/**
 * lookupMany(rawArray) → array of unique, valid lookup results
 * Deduplicates by canonicalKey. Silently drops nulls.
 * Hard cap at MAX_FALLACIES to prevent UI clutter.
 */
const MAX_FALLACIES = 2;

function lookupFallacies(rawArray) {
    if (!Array.isArray(rawArray)) return [];
    const seen = new Set();
    const results = [];
    for (const raw of rawArray) {
        const result = lookupFallacy(raw);
        if (!result) continue;
        if (seen.has(result.canonicalKey)) continue;
        seen.add(result.canonicalKey);
        results.push(result);
        if (results.length >= MAX_FALLACIES) break;
    }
    return results;
}

// ── VERDICT GATE ──────────────────────────────────────────────────────────
// Only show fallacy cards for these verdicts — not for TRUE claims
const SHOW_CARDS_FOR = new Set([
    "MISLEADING",
    "MOSTLY FALSE",
    "FALSE",
    "FACTUALLY TRUE / MORALLY DISPUTED",
]);

function shouldShowFallacyCards(verdict) {
    return SHOW_CARDS_FOR.has((verdict || "").toUpperCase());
}

// ── PROMPT ENUM (inject into Abe's existing JSON schema) ─────────────────
// Paste this into nlp.js buildPrompt() JSON schema section
const PROMPT_FALLACY_ENUM = CANONICAL_KEYS.join('", "');
const PROMPT_INJECTION = `
  "fallacies": ["max 2 items from this exact list — no other values: "${PROMPT_FALLACY_ENUM}"],
`;

// ── EXPORTS ───────────────────────────────────────────────────────────────
if (typeof module !== "undefined") {
    module.exports = {
        lookupFallacy,
        lookupFallacies,
        shouldShowFallacyCards,
        normalize,
        CARD_META,
        CANONICAL_KEYS,
        PROMPT_INJECTION,
        MAX_FALLACIES,
    };
}
