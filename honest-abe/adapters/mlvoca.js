/**
 * ADAPTER: mlvoca.com
 * No API key. No account. Ollama-compatible endpoint.
 * Runs TinyLlama and DeepSeek R1 1.5b.
 * https://mlvoca.github.io/free-llm-api/
 */

const MlvocaAdapter = {
    name: "mlvoca",
    _endpoint: "https://mlvoca.com/api/generate",

    async available() {
        try {
            const res = await fetch(this._endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: "tinyllama", prompt: "ping", stream: false }),
                signal: AbortSignal.timeout(4000)
            });
            return res.ok;
        } catch { return false; }
    },

    async query(prompt) {
        const res = await fetch(this._endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "deepseek-r1:1.5b",
                prompt,
                stream: false
            })
        });
        const data = await res.json();
        return data.response || "";
    }
};

if (typeof module !== "undefined") module.exports = MlvocaAdapter;
else window._HonestAbeAdapter_Mlvoca = MlvocaAdapter;
