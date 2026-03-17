# Honest Abe — Truth Checker

> *"Four score of lies won't add up to one truth. Let me help you sort them out."*

**[Try it → honest-abe.pages.dev](https://honest-abe.pages.dev)**

Paste any claim, headline, quote, or statement. Honest Abe tells you if it's **TRUE, FALSE, MISLEADING, SUBJECTIVE, OPINION**, or **UNVERIFIABLE** — with plain-English reasoning, manipulation detection, and civic action prompts.

Free. No account required. No tracking. No ads. Ever.

---

## What Abe Does

Abe runs every claim through a 6-step pipeline:

1. **Decompose** — breaks the claim into atomic, checkable assertions
2. **Search** — compares each assertion against the factual record
3. **Neutralize** — strips emotional framing, restates the underlying facts plainly
4. **Manipulate** — identifies rhetorical techniques used (cherry-picking, false equivalence, emotional loading, etc.)
5. **Verdict** — evidence-based conclusion with confidence level and reasoning
6. **Guide** — tells you where this analysis is weakest and what to verify yourself

Abe also detects logical fallacies, flags incentive bias, and — for civic claims — prompts you to take action with links to primary sources.

---

## Verdicts

| Verdict | Meaning |
|---|---|
| `TRUE` / `MOSTLY TRUE` | Supported by the factual record |
| `MISLEADING` | Technically accurate but framed to deceive |
| `MOSTLY FALSE` / `FALSE` | Contradicted by the factual record |
| `FACTUALLY TRUE / MORALLY DISPUTED` | The facts check out, but the ethics don't |
| `OPINION` | Value judgment — Abe gives the factual record, then an informed assessment |
| `SUBJECTIVE` | Personal preference or sensory claim — not analyzable as fact |
| `UNVERIFIABLE` | Insufficient evidence to reach a verdict |
| `REFUSED` | Not a claim — nonsense, joke, or meaningless statement |

---

## Abe's Constitution

Seven principles that govern every output:

- **FREE** — always zero cost, zero barriers
- **FAIR** — same standard applied to every politician, party, and ideology
- **FIRM** — never hedges under social pressure, only under evidence
- **FUN** — plain language, never preachy, never punishing
- **TRUE** — every claim evaluated against all four pillars
- **TRANSPARENT** — audit trail on every result
- **ACCESSIBLE** — no jargon without explanation

Four pillars every truth claim must satisfy:

- **Verifiable** — traceable to a primary source
- **Reproducible** — independent sources reach the same conclusion
- **Contextually Honest** — not selectively framed to imply something false
- **Falsifiable** — evidence exists that could disprove the claim

---

## How It Works

### AI Provider Chain
Abe uses a cascading provider chain:

```
Puter.js (Claude Sonnet) → Pattern Analysis (offline fallback)
```

**Puter.js** is a free AI platform — sign in once with a free account and Abe uses Claude Sonnet for full analysis. No API key required, no credit card, no cost to you.

**Pattern Analysis** runs entirely in your browser when Puter is unavailable. It detects manipulation language, framing patterns, and claim structure offline — no data ever leaves your device.

> ⚠️ Complex or political claims may take up to 60 seconds and use Puter AI credits from your free account.

### Privacy
- Honest Abe **never stores any data** — no claims, no results, no user information
- When using Puter, your claim is sent to Puter's AI infrastructure subject to [Puter's privacy policy](https://puter.com/privacy)
- Pattern analysis mode sends **nothing** — all processing happens locally in your browser

---

## Hosting

Honest Abe is hosted on **Cloudflare Pages** with full HTTP security headers via `_headers`:

- `Content-Security-Policy` — restricts script and connection sources
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` — enforces HTTPS
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` — disables camera, microphone, geolocation

---

## Security

- All AI/user content rendered via `textContent` — no `innerHTML` with dynamic data
- `?rep=` URL parameter whitelisted and length-capped before use
- Prompt injection patterns stripped before reaching the AI
- Puter session validated by AI ping, not just auth check — catches ghost/OAuth sessions

---

## File Structure

```
/
├── index.html                  # Main app (single file)
├── _headers                    # Cloudflare Pages HTTP security headers
├── honest-abe/
│   ├── nlp.js                  # 6-step analysis pipeline + provider chain
│   ├── truth-model.js          # Constitutional integrity framework
│   ├── ethics.js               # Ethics gate
│   ├── hallucination-guard.js  # Output validation
│   ├── fallacy-lookup.js       # Logical fallacy card renderer
│   ├── agent.js                # Orchestration layer
│   ├── adapters/
│   │   ├── puter.js            # Puter.js AI adapter (primary)
│   │   └── pattern.js          # Offline pattern fallback
│   ├── icons/                  # PWA icons
│   ├── pwa-manifest.json       # PWA manifest
│   └── sw.js                   # Service worker (offline support)
```

---

## Running Locally

No build step. No dependencies. Open `index.html` in a browser.

For Puter AI to work locally, serve over HTTPS or use a local dev server — Puter's auth popup requires a secure context.

---

## Contributing

This is an independent civic technology project. Anonymous authorship by design — no personal attribution anywhere in the codebase.

Issues and pull requests welcome at [github.com/voterhelptool/Honest-Abe](https://github.com/voterhelptool/Honest-Abe).

---

## License

See [LICENSE](LICENSE).

---

*Not affiliated with any election audit tool, political party, or commercial entity.*
