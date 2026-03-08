/**
 * HONEST ABE — content.js
 * Runs on every page. Listens for selections and analyze requests.
 * Shows inline truth indicators without interrupting the user.
 */

// ── INJECT STYLES ─────────────────────────────────────────────────────────
const style = document.createElement("style");
style.textContent = `
  .honest-abe-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: 'Georgia', serif;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 3px;
    cursor: pointer;
    vertical-align: middle;
    margin-left: 6px;
    letter-spacing: 0.03em;
    border: 1px solid transparent;
    transition: opacity 0.2s;
    z-index: 99999;
    position: relative;
  }
  .honest-abe-badge:hover { opacity: 0.85; }
  .honest-abe-badge.pass  { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }
  .honest-abe-badge.warn  { background: #fff8e1; color: #f57f17; border-color: #ffe082; }
  .honest-abe-badge.fail  { background: #fce4ec; color: #c62828; border-color: #ef9a9a; }
  .honest-abe-badge.unknown { background: #f5f5f5; color: #616161; border-color: #e0e0e0; }

  .honest-abe-tooltip {
    position: fixed;
    z-index: 99999;
    max-width: 320px;
    background: #1a1a2e;
    color: #e8e8f0;
    font-family: 'Georgia', serif;
    font-size: 12px;
    line-height: 1.6;
    padding: 14px 16px;
    border-radius: 6px;
    border: 1px solid #3a3a5c;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .honest-abe-tooltip.visible { opacity: 1; }
  .honest-abe-tooltip .abe-verdict {
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 8px;
    border-bottom: 1px solid #3a3a5c;
    padding-bottom: 6px;
  }
  .honest-abe-tooltip .abe-provider {
    font-size: 10px;
    opacity: 0.5;
    margin-top: 8px;
  }
  .honest-abe-tooltip .abe-pillars {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    margin-top: 8px;
    font-size: 10px;
  }
  .honest-abe-tooltip .abe-pillar {
    display: flex;
    justify-content: space-between;
    opacity: 0.8;
  }
`;
document.head.appendChild(style);

// ── TOOLTIP ───────────────────────────────────────────────────────────────
const tooltip = document.createElement("div");
tooltip.className = "honest-abe-tooltip";
document.body.appendChild(tooltip);

function showTooltip(result, x, y) {
    const score = result.pillarAverage ?? 0;
    tooltip.innerHTML = `
        <div class="abe-verdict">${result.verdict || "INCONCLUSIVE"}</div>
        <div>${result.plainSummary || ""}</div>
        <div class="abe-pillars">
            <div class="abe-pillar"><span>Verifiable</span><span>${fmt(result.verifiable)}</span></div>
            <div class="abe-pillar"><span>Reproducible</span><span>${fmt(result.reproducible)}</span></div>
            <div class="abe-pillar"><span>Framing</span><span>${fmt(result.contextuallyHonest)}</span></div>
            <div class="abe-pillar"><span>Falsifiable</span><span>${fmt(result.falsifiable)}</span></div>
        </div>
        ${result.incentiveBias ? `<div style="margin-top:8px;color:#ffb74d;font-size:10px;">⚠ ${result.incentiveBias}</div>` : ""}
        <div class="abe-provider">via ${result.provider || "pattern"}</div>
    `;
    tooltip.style.left = `${Math.min(x, window.innerWidth - 340)}px`;
    tooltip.style.top  = `${Math.min(y + 12, window.innerHeight - 200)}px`;
    tooltip.classList.add("visible");
}

function hideTooltip() {
    tooltip.classList.remove("visible");
}

function fmt(val) {
    if (typeof val !== "number") return "—";
    return (val * 100).toFixed(0) + "%";
}

// ── BADGE ─────────────────────────────────────────────────────────────────
function createBadge(result) {
    const score  = result.pillarAverage ?? null;
    const badge  = document.createElement("span");
    badge.className = "honest-abe-badge " + scoreClass(score);
    badge.textContent = score !== null
        ? `Abe ${(score * 100).toFixed(0)}%`
        : "Abe ?";

    badge.addEventListener("mouseenter", (e) => showTooltip(result, e.clientX, e.clientY));
    badge.addEventListener("mouseleave", hideTooltip);
    return badge;
}

function scoreClass(score) {
    if (score === null) return "unknown";
    if (score >= 0.65)  return "pass";
    if (score >= 0.40)  return "warn";
    return "fail";
}

// ── ANALYZE SELECTION ─────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "ANALYZE_SELECTION" && msg.claim) {
        analyzeAndBadge(msg.claim);
    }
});

async function analyzeAndBadge(claim) {
    // Show loading badge at selection
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range    = sel.getRangeAt(0);
    const loading  = document.createElement("span");
    loading.className = "honest-abe-badge unknown";
    loading.textContent = "Abe …";
    range.collapse(false);
    range.insertNode(loading);

    // Send to popup/background for analysis
    chrome.runtime.sendMessage({
        type:  "RUN_ANALYSIS",
        claim
    }, (result) => {
        if (!result) {
            loading.textContent = "Abe ?";
            return;
        }
        const badge = createBadge(result);
        loading.replaceWith(badge);
    });
}
