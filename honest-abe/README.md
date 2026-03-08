# Honest Abe

> *A truth agent for everyone.*

**Free. Fair. Firm. Fun. True. Transparent. Accessible.**

Honest Abe is a free, open source truth and ethics agent that runs in your browser — as an extension or a web app — with no account, no server, no cost, and no data leaving your device unless you choose.

It evaluates claims against four pillars of truth, detects manipulative framing, surfaces incentive bias, and flags its own uncertainty rather than guessing.

---

## Try It

**Web app (works in any browser including DuckDuckGo and mobile):**
→ [voterhelptool.github.io/Honest-Abe](https://voterhelptool.github.io/Honest-Abe)

**Browser extension (Chrome, Firefox, Safari):**
→ See [Installing the Extension](#installing-the-extension) below

---

## What It Does

Paste or select any claim — a headline, a social media post, a political statement, an advertisement — and Honest Abe evaluates it across four dimensions:

| Pillar | What it asks |
|---|---|
| **Verifiable** | Can this be traced to a primary source? |
| **Reproducible** | Do independent sources reach the same conclusion? |
| **Contextually Honest** | Is it framed to imply something false, even if technically true? |
| **Falsifiable** | Could evidence disprove this claim? |

It also detects:
- **Manipulative framing** — absolute generalizations, tribal language, conspiracy framing, suppression claims, false consensus
- **Incentive bias** — who benefits if this claim is believed?
- **Internal inconsistency** — if the reasoning contradicts itself, the result is killed before it reaches you

---

## What It Does Not Do

Honest Abe does not declare contested value judgments true or false.

Whether a policy is good. Whether a leader is moral. Whether a historical decision was just. These are not factual questions with falsifiable answers. Honest Abe surfaces the disagreement. It does not resolve it.

A truth agent that decides which values are correct stops being a truth agent.

---

## The 7 F's

These are not marketing. They are hard constraints baked into the code.

- **Free** — No cost, no gate, no owner. Truth belongs to everyone.
- **Fair** — No ideology, party, or interest gets preferential weighting.
- **Firm** — Evidence is held without wavering. Social pressure is not evidence.
- **Fun** — Accessible and human. Not a lecture. Not a punishment.
- **True** — Correspondence with verifiable, reproducible, falsifiable reality.
- **Transparent** — Every score, source, and decision is fully auditable.
- **Accessible** — Plain language. Works for everyone, everywhere, on any device.

---

## How It Works

### Provider-Agnostic NLP

Honest Abe doesn't depend on any single AI provider. It tries providers in order, and if any response fails internal consistency checks, it kills that result and tries the next.

| Provider | Requires | Notes |
|---|---|---|
| Puter.js | Nothing | No account, no key, 500+ models |
| mlvoca | Nothing | No key, Ollama-compatible endpoint |
| HuggingFace | Free account token | Optional, set in extension settings |
| Mistral | Free tier key | Optional, European, privacy-focused |
| WebLLM | WebGPU device | Fully local, no internet after first load |
| Pattern matching | Nothing | **Always works. Always last. Never removed.** |

The pattern matching adapter is the bedrock. It requires no internet, no AI, no account. It guarantees Honest Abe works on any device in any condition, regardless of what any provider decides.

### Hallucination Guard

Every provider response passes five self-interrogation tests before reaching you:

1. **Pillar spread** — scores can't wildly contradict each other
2. **Confidence delta** — can't be highly confident with weak pillar scores
3. **Directional agreement** — pillars must mostly point the same way
4. **Summary drift** — plain language must match the scores
5. **Framing contradiction** — can't flag manipulation but score context as clean

If any test fails — the result is killed. Not degraded. Not guessed at. Killed. The next provider is tried. If all providers fail, Abe returns `INCONCLUSIVE` and tells you to verify manually.

*"I don't know" is an honest answer. A hallucinated verdict on a false claim is not.*

### Human Reinforcement

Humans improve the model. The model never overrides humans.

- Flag bad outputs
- Vote on truth scores
- Submit new detection patterns
- Review and approve agent-proposed changes

Every proposed change requires community quorum to apply. One veto blocks everything. Every approval is logged and auditable forever.

---

## File Structure

```
honest-abe/
├── manifest.json           Chrome + Firefox extension (Manifest V3)
├── background.js           Service worker, context menu
├── content.js              Inline badges on any page
├── popup.html              Extension popup UI
├── popup.js                Extension popup logic
├── index.html              PWA — works in any browser
├── pwa-manifest.json       PWA installability
├── sw.js                   Offline service worker
├── ethics.js               Hard ethical gate (immutable)
├── truth-model.js          4 pillars + 7 F's as structural code
├── hallucination-guard.js  Self-interrogation loop
├── nlp.js                  Provider-agnostic adapter layer
├── agent.js                Agentic loop + human reinforcement
├── PHILOSOPHY.md           Why the code is the way it is
└── adapters/
    ├── puter.js             No key, 500+ models
    ├── mlvoca.js            No key, Ollama-compatible
    ├── huggingface.js       Free account
    ├── mistral.js           Free tier, European
    ├── webllm.js            Fully local, WebGPU
    └── pattern.js           Bedrock — always works
```

### Load Order

```
ethics.js
truth-model.js
hallucination-guard.js
nlp.js + adapters/
agent.js
```

---

## Installing the Extension

### Chrome / Brave / Edge
1. Download and unzip this repo
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `honest-abe` folder
5. Pin Honest Abe to your toolbar

### Firefox
1. Download and unzip this repo
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** → select `manifest.json`

### Safari (macOS / iOS)
1. Clone this repo
2. Run `xcrun safari-web-extension-converter honest-abe/`
3. Open the generated Xcode project and build to your device

### Firefox for Android
Same as Firefox desktop — extensions are supported.

---

## Adding a New Provider

Drop a file in `/adapters/` that implements three things:

```javascript
const MyAdapter = {
    name: "MyProvider",

    async available() {
        // return true if this provider can be reached right now
    },

    async query(prompt) {
        // send prompt, return response text
    }
};

if (typeof module !== "undefined") module.exports = MyAdapter;
else window._HonestAbeAdapter_My = MyAdapter;
```

Then add it to the `PROVIDERS` array in `nlp.js`. Submit a PR. The community reviews it before it ships.

---

## Contributing

Read `PHILOSOPHY.md` before opening a pull request.

Before writing any code, ask:
- Does this serve the 7 F's?
- Does it strengthen or weaken any of the 4 pillars?
- Does it make the system more or less auditable?
- Does it make it more or less accessible to the person with the least?

If the answer is unclear — open a discussion first.

### What we welcome
- New provider adapters
- Improved framing detection patterns
- Translations and accessibility improvements
- Test suites with known true/false/manipulative claims
- Documentation and plain language improvements

### What we don't accept
- Changes that introduce any cost to the end user
- Changes that route data to a server without explicit user consent
- Changes that reduce auditability
- Changes applied without community review

---

## Governance

See `GOVERNANCE.md` for the full decision-making process.

All proposed changes to core logic (`ethics.js`, `truth-model.js`, `hallucination-guard.js`) require:
- Community discussion
- Minimum 2 approvals
- Zero vetoes
- Full audit log entry

---

## Privacy

Honest Abe collects nothing.

- No user accounts
- No analytics
- No telemetry
- No data sent to any server unless you opt into a cloud provider in settings
- All analysis happens on your device by default

---

## License

MIT. Free forever. Fork it, build on it, improve it.

If you build something with it — tell us. We'd love to know.

---

## Why "Honest Abe"?

Because Abraham Lincoln's reputation for honesty was earned, not claimed. He said uncomfortable things when it would have been easier to stay quiet. He held positions under pressure when reversing them would have been more convenient.

That's the standard. Not perfect. Not infallible. Honest.

---

*Free. Fair. Firm. Fun. True. Transparent. Accessible.*
*Always verify with primary sources.*
