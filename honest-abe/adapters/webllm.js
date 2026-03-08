/**
 * ADAPTER: WebLLM
 * Fully local. Runs in the browser via WebGPU.
 * No internet after first model download.
 * No account. No key. No data leaves the device. Ever.
 * https://webllm.mlc.ai
 *
 * Model downloads ~2GB on first use, cached forever after.
 * Falls through if WebGPU not supported on device.
 */

const WebLLMAdapter = {
    name: "WebLLM",
    _engine: null,
    _model: "Phi-3.5-mini-instruct-q4f16_1-MLC",  // small, fast, capable

    async available() {
        // Check WebGPU support
        if (!navigator?.gpu) return false;
        try {
            const adapter = await navigator.gpu.requestAdapter();
            return !!adapter;
        } catch { return false; }
    },

    async _init() {
        if (this._engine) return;
        // Dynamically import WebLLM — only loads if WebGPU available
        const { CreateMLCEngine } = await import(
            "https://esm.run/@mlc-ai/web-llm"
        );
        this._engine = await CreateMLCEngine(this._model, {
            initProgressCallback: (p) => {
                console.log(`[Honest Abe WebLLM] Loading model: ${Math.round(p.progress * 100)}%`);
            }
        });
    },

    async query(prompt) {
        await this._init();
        const reply = await this._engine.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            max_tokens: 512,
            temperature: 0.1  // low temp for factual analysis
        });
        return reply.choices[0]?.message?.content || "";
    }
};

if (typeof module !== "undefined") module.exports = WebLLMAdapter;
else window._HonestAbeAdapter_WebLLM = WebLLMAdapter;
