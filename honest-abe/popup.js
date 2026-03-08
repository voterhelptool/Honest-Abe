/**
 * HONEST ABE — popup.js
 * Wires the popup UI to the NLP + truth model stack.
 */

const $ = id => document.getElementById(id);

// ── PILLAR BAR COLORS ─────────────────────────────────────────────────────
function barColor(score) {
    if (score >= 0.65) return "#2e7d32";
    if (score >= 0.40) return "#f57f17";
    return "#c62828";
}

function pct(score) {
    return typeof score === "number" ? (score * 100).toFixed(0) + "%" : "—";
}

function verdictClass(verdict) {
    if (!verdict) return "unknown";
    const v = verdict.toUpperCase();
    if (v.includes("LIKELY TRUE"))         return "pass";
    if (v.includes("PARTIALLY"))           return "warn";
    if (v.includes("CONTESTED"))           return "warn";
    if (v.includes("UNSUPPORTED"))         return "fail";
    if (v.includes("BLOCKED"))             return "fail";
    if (v.includes("INCONCLUSIVE"))        return "unknown";
    return "unknown";
}

// ── RENDER RESULT ─────────────────────────────────────────────────────────
function renderResult(result) {
    $("loadingState").classList.remove("visible");
    $("results").style.display = "block";

    // Verdict box
    const cls = verdictClass(result.verdict);
    $("verdictBox").className  = `verdict-box ${cls}`;
    $("verdictLabel").textContent  = result.verdict || "INCONCLUSIVE";
    $("verdictSummary").textContent = result.summary || result.plainSummary || "";

    // Pillars
    const pillars = [
        { bar: "barV",  score: "scoreV",  val: result.pillars?.verifiable?.score          ?? result.verifiable },
        { bar: "barR",  score: "scoreR",  val: result.pillars?.reproducible?.score        ?? result.reproducible },
        { bar: "barCH", score: "scoreCH", val: result.pillars?.contextuallyHonest?.score  ?? result.contextuallyHonest },
        { bar: "barF",  score: "scoreF",  val: result.pillars?.falsifiable?.score         ?? result.falsifiable },
    ];

    pillars.forEach(({ bar, score, val }) => {
        const s = typeof val === "number" ? val : 0.5;
        $(bar).style.width      = (s * 100) + "%";
        $(bar).style.background = barColor(s);
        $(score).textContent    = pct(s);
    });

    // Framing flags
    const flags = result.pillars?.contextuallyHonest?.flags
               ?? result.framingFlags
               ?? [];
    $("flagsBox").innerHTML = flags.map(f =>
        `<div class="flag-item">${f}</div>`
    ).join("");

    // Incentive bias
    const bias = result.incentiveFlags?.join(" | ") || result.incentiveBias || null;
    if (bias) {
        $("biasBox").style.display = "block";
        $("biasBox").textContent   = "⚠ " + bias;
    } else {
        $("biasBox").style.display = "none";
    }

    // Provider
    setProvider(result.provider || "pattern", false);
}

// ── PROVIDER INDICATOR ────────────────────────────────────────────────────
function setProvider(name, loading = false) {
    $("providerDot").className = "provider-dot " + (loading ? "loading" : "active");
    $("providerLabel").textContent = loading ? `Asking ${name}…` : `via ${name}`;
}

// ── ANALYZE ───────────────────────────────────────────────────────────────
$("analyzeBtn").addEventListener("click", async () => {
    const claim = $("claimInput").value.trim();
    if (!claim) return;

    $("analyzeBtn").disabled = true;
    $("results").style.display = "none";
    $("loadingState").classList.add("visible");
    setProvider("providers", true);

    try {
        // Run through full stack: ethics → truth-model → hallucination-guard → nlp
        const nlpResult  = await nlp.analyze(claim);
        const fullResult = TruthModel.evaluate(claim, [], { nlp: nlpResult });
        renderResult(fullResult);
        agent.evaluate(claim); // log to ledger silently
    } catch (err) {
        $("loadingState").classList.remove("visible");
        $("results").style.display   = "block";
        $("verdictBox").className    = "verdict-box unknown";
        $("verdictLabel").textContent  = "INCONCLUSIVE";
        $("verdictSummary").textContent = "Analysis failed. Please verify with primary sources.";
        console.error("[Honest Abe]", err);
    } finally {
        $("analyzeBtn").disabled = false;
    }
});

// Allow Enter + Ctrl/Cmd to submit
$("claimInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        $("analyzeBtn").click();
    }
});

// ── SETTINGS ─────────────────────────────────────────────────────────────
$("settingsToggle").addEventListener("click", () => {
    $("settingsPanel").classList.toggle("open");
});

// Load saved keys
chrome.storage.local.get(["hf_token", "mistral_key"], (r) => {
    if (r.hf_token)    $("hfToken").value    = r.hf_token;
    if (r.mistral_key) $("mistralKey").value = r.mistral_key;
});

$("saveKeys").addEventListener("click", () => {
    chrome.storage.local.set({
        hf_token:    $("hfToken").value.trim(),
        mistral_key: $("mistralKey").value.trim()
    }, () => {
        $("saveKeys").textContent = "Saved ✓";
        setTimeout(() => { $("saveKeys").textContent = "Save"; }, 1500);
    });
});

// ── RECEIVE SELECTION FROM CONTENT SCRIPT ────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "ANALYZE_SELECTION" && msg.claim) {
        $("claimInput").value = msg.claim;
        $("analyzeBtn").click();
    }
});
