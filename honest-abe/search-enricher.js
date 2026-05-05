/**
 * HONEST ABE — search-enricher.js
 *
 * Fetches current web context before every LLM call.
 * Injects results as a CURRENT WEB CONTEXT block into the prompt.
 * Minimum 3 searches per claim. Up to 5.
 * Cycles through DuckDuckGo → Wikipedia → Brave when sources are exhausted or fail.
 *
 * FREE · NO API KEY REQUIRED FOR DDG OR WIKIPEDIA
 * BRAVE: Free tier, 2000/month. Key stored in window._ABE_BRAVE_KEY if available.
 *
 * SECURITY: All injected content is escaped before insertion into prompt strings.
 * Never injected into innerHTML — prompt strings only.
 */

// ── SEARCH CONFIG ─────────────────────────────────────────────────────────

const SEARCH_CONFIG = Object.freeze({
    minSearches:   3,
    maxSearches:   5,
    timeoutMs:     5000,
    maxSnippetLen: 400,   // chars per result snippet
    maxResultsPerQuery: 3,
});

// ── SAFE ESCAPE ───────────────────────────────────────────────────────────
// Sanitize all external content before injecting into prompts.

function escapeForPrompt(str) {
    if (typeof str !== "string") return "";
    return str
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$/g, "\\$")
        .slice(0, SEARCH_CONFIG.maxSnippetLen);
}

// ── QUERY BUILDER ─────────────────────────────────────────────────────────
// Generates 3-5 distinct searches from a single claim.
// Covers: the direct claim, named entities, verification angle, source check.

function buildSearchQueries(claim, claimType, dna) {
    const queries = [];
    const entities = (dna?.entities || []).slice(0, 3);
    const keywords = (dna?.keywords || []).slice(0, 5);
    const c = claim.trim();

    // Query 1 — Direct claim (always)
    const directQuery = c.length > 120 ? c.slice(0, 120) : c;
    queries.push({ q: directQuery, angle: "direct claim" });

    // Query 2 — Fact check angle (always)
    const fcTarget = entities.length > 0
        ? `${entities.slice(0, 2).join(" ")} fact check`
        : `${keywords.slice(0, 3).join(" ")} fact check`;
    queries.push({ q: fcTarget, angle: "fact check" });

    // Query 3 — Entity + context (always — minimum guaranteed)
    if (entities.length > 0) {
        queries.push({ q: `${entities[0]} ${claimType} primary source`, angle: "primary source" });
    } else {
        queries.push({ q: `${keywords.slice(0, 4).join(" ")} evidence`, angle: "evidence search" });
    }

    // Query 4 — Topic-specific source (if we have enough info)
    const topicQuery = _topicQuery(claim, claimType, keywords, entities);
    if (topicQuery && queries.length < SEARCH_CONFIG.maxSearches) {
        queries.push({ q: topicQuery, angle: "topic source" });
    }

    // Query 5 — Second entity or counter-angle (if available)
    if (entities.length >= 2 && queries.length < SEARCH_CONFIG.maxSearches) {
        queries.push({ q: `${entities[1]} ${keywords.slice(0, 2).join(" ")}`, angle: "secondary entity" });
    } else if (keywords.length > 3 && queries.length < SEARCH_CONFIG.maxSearches) {
        queries.push({ q: `${keywords.slice(0, 4).join(" ")} 2024 OR 2025 OR 2026`, angle: "recent" });
    }

    // Deduplicate and return up to maxSearches
    const seen = new Set();
    return queries.filter(({ q }) => {
        const norm = q.toLowerCase().replace(/\s+/g, " ").trim();
        if (seen.has(norm)) return false;
        seen.add(norm);
        return true;
    }).slice(0, SEARCH_CONFIG.maxSearches);
}

function _topicQuery(claim, claimType, keywords, entities) {
    const kw = keywords.join(" ").toLowerCase();
    const e0 = entities[0] || keywords[0] || "";

    if (/vaccine|covid|virus|disease|health|medical/.test(kw))
        return `${e0} site:cdc.gov OR site:nih.gov OR site:pubmed.ncbi.nlm.nih.gov`;
    if (/election|vote|ballot|candidate|congress|senate/.test(kw))
        return `${e0} site:congress.gov OR site:ballotpedia.org OR site:fec.gov`;
    if (/economy|inflation|jobs|unemployment|gdp|wage/.test(kw))
        return `${e0} site:bls.gov OR site:fred.stlouisfed.org`;
    if (/climate|environment|carbon|emission/.test(kw))
        return `${e0} climate data site:nasa.gov OR site:noaa.gov`;
    if (/war|military|troops|nato/.test(kw))
        return `${e0} site:reuters.com OR site:apnews.com`;
    if (/immigration|border|migrant|ice|deportation/.test(kw))
        return `${e0} immigration site:apnews.com OR site:dhs.gov`;
    if (/law|court|ruling|constitution|rights|crime/.test(kw))
        return `${e0} site:supremecourt.gov OR site:congress.gov`;
    if (/donor|campaign|finance|pac/.test(kw))
        return `${e0} site:fec.gov OR site:opensecrets.org`;
    if (e0)
        return `${e0} site:reuters.com OR site:apnews.com OR site:bbc.com`;
    return null;
}

// ── SEARCH PROVIDERS ──────────────────────────────────────────────────────

// Provider 1: DuckDuckGo Instant Answer API
// No key, no signup. Returns abstract, related topics.
async function searchDDG(query) {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const r = await fetchWithTimeout(url, SEARCH_CONFIG.timeoutMs);
    const d = await r.json();

    const snippets = [];

    if (d.AbstractText) {
        snippets.push({
            title:   escapeForPrompt(d.AbstractSource || "DuckDuckGo"),
            snippet: escapeForPrompt(d.AbstractText),
            url:     d.AbstractURL || ""
        });
    }

    (d.RelatedTopics || []).slice(0, SEARCH_CONFIG.maxResultsPerQuery - snippets.length).forEach(t => {
        if (t.Text && t.FirstURL) {
            snippets.push({
                title:   escapeForPrompt(t.Text.split(" - ")[0] || "Related"),
                snippet: escapeForPrompt(t.Text),
                url:     t.FirstURL
            });
        }
    });

    return snippets;
}

// Provider 2: Wikipedia Search API
// Completely free, no key, returns extracts.
async function searchWikipedia(query) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*&srlimit=3`;
    const r = await fetchWithTimeout(url, SEARCH_CONFIG.timeoutMs);
    const d = await r.json();

    return (d?.query?.search || []).slice(0, SEARCH_CONFIG.maxResultsPerQuery).map(s => ({
        title:   escapeForPrompt(s.title),
        snippet: escapeForPrompt(s.snippet.replace(/<[^>]+>/g, "")),
        url:     `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, "_"))}`
    }));
}

// Provider 3: Brave Search API
// Free tier: 2000 queries/month. Key optional — stored in window._ABE_BRAVE_KEY.
// Without a key this silently skips.
async function searchBrave(query) {
    const key = (typeof window !== "undefined" && window._ABE_BRAVE_KEY) || null;
    if (!key) return [];

    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3&search_lang=en`;
    const r = await fetchWithTimeout(url, SEARCH_CONFIG.timeoutMs, {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": key
    });
    const d = await r.json();

    return (d?.web?.results || []).slice(0, SEARCH_CONFIG.maxResultsPerQuery).map(s => ({
        title:   escapeForPrompt(s.title),
        snippet: escapeForPrompt(s.description || s.extra_snippets?.[0] || ""),
        url:     s.url || ""
    }));
}

// ── FETCH HELPER ──────────────────────────────────────────────────────────

function fetchWithTimeout(url, ms, headers = {}) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal, headers })
        .finally(() => clearTimeout(id));
}

// ── PROVIDER CYCLE ────────────────────────────────────────────────────────
// Cycles DDG → Wikipedia → Brave per query.
// If one fails, next provider tries the same query.

const _PROVIDERS = [
    { name: "DuckDuckGo",  fn: searchDDG },
    { name: "Wikipedia",   fn: searchWikipedia },
    { name: "Brave",       fn: searchBrave },
];

// Track per-session usage to cycle providers
const _providerUsage = { DuckDuckGo: 0, Wikipedia: 0, Brave: 0 };

async function runQuery(query, preferredProviderIndex = 0) {
    // Try each provider starting from preferred, wrapping around
    for (let i = 0; i < _PROVIDERS.length; i++) {
        const idx = (preferredProviderIndex + i) % _PROVIDERS.length;
        const provider = _PROVIDERS[idx];
        try {
            const results = await provider.fn(query);
            if (results && results.length > 0) {
                _providerUsage[provider.name]++;
                return { provider: provider.name, results };
            }
        } catch (e) {
            console.warn(`[Search Enricher] ${provider.name} failed for "${query.slice(0,40)}": ${e.message}`);
        }
    }
    return { provider: "none", results: [] };
}

// ── MAIN ENRICHER ─────────────────────────────────────────────────────────

async function enrichWithSearch(claim, claimType, dna) {
    const queries = buildSearchQueries(claim, claimType, dna);

    console.log(`[Search Enricher] Running ${queries.length} searches for: "${claim.slice(0, 60)}"`);

    // Run all queries in parallel, cycling providers to spread load
    const searchPromises = queries.map((q, i) => runQuery(q.q, i % _PROVIDERS.length));
    const allResults = await Promise.allSettled(searchPromises);

    // Collect successful results
    const enriched = [];
    allResults.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.results.length > 0) {
            enriched.push({
                angle:    queries[i].angle,
                query:    queries[i].q,
                provider: r.value.provider,
                results:  r.value.results
            });
        }
    });

    const successCount = enriched.length;
    console.log(`[Search Enricher] ${successCount}/${queries.length} searches returned results`);

    return buildContextBlock(enriched, successCount);
}

// ── CONTEXT BLOCK BUILDER ─────────────────────────────────────────────────
// Formats search results into a structured block for prompt injection.

function buildContextBlock(enriched, successCount) {
    if (enriched.length === 0) {
        return {
            block: "",
            summary: "No web search results available. Analysis based on training data only.",
            successCount: 0
        };
    }

    const lines = [
        "CURRENT WEB CONTEXT (fetched live — treat as primary evidence):",
        `Retrieved ${successCount} search result set(s) from: ${[...new Set(enriched.map(e => e.provider))].join(", ")}.`,
        "Use this information to ground your analysis in current facts. If search results contradict your training data, defer to the search results.",
        ""
    ];

    enriched.forEach((group, gi) => {
        lines.push(`[Search ${gi + 1}: ${group.angle} — via ${group.provider}]`);
        lines.push(`Query: "${group.query}"`);
        group.results.forEach((res, ri) => {
            lines.push(`  Result ${ri + 1}: ${res.title}`);
            if (res.snippet) lines.push(`  "${res.snippet}"`);
            if (res.url) lines.push(`  Source: ${res.url}`);
        });
        lines.push("");
    });

    lines.push("END OF WEB CONTEXT — Begin analysis using the above as primary evidence.");

    return {
        block: lines.join("\n"),
        summary: `Web search: ${successCount} queries completed via ${[...new Set(enriched.map(e => e.provider))].join(", ")}.`,
        successCount
    };
}

// ── PROVIDER STATUS ───────────────────────────────────────────────────────

function searchEnricherStatus() {
    return {
        providers: _PROVIDERS.map(p => p.name),
        usage: { ..._providerUsage },
        braveKeyPresent: !!(typeof window !== "undefined" && window._ABE_BRAVE_KEY),
        config: SEARCH_CONFIG
    };
}

// ── EXPORTS ───────────────────────────────────────────────────────────────

if (typeof window !== "undefined") {
    window.SearchEnricher = { enrichWithSearch, buildSearchQueries, searchEnricherStatus };
}
if (typeof module !== "undefined") {
    module.exports = { enrichWithSearch, buildSearchQueries, searchEnricherStatus };
}
