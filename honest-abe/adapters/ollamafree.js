/**
 * ADAPTER: OllamaFreeAPI
 * Zero config. No account. No key.
 * Public Ollama gateway — load balanced globally.
 */
const OllamaFreeAdapter = {
    name: "ollamafree",
    async available() { return true; },
    async query(prompt) {
        const models = ["llama3", "mistral", "deepseek-r1:1.5b", "phi3"];
        for (const model of models) {
            try {
                const res = await fetch("https://ollama.mlvoca.com/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model, prompt, stream: false })
                });
                if (!res.ok) continue;
                const data = await res.json();
                if (data?.response) return data.response;
            } catch { continue; }
        }
        throw new Error("OllamaFree: all models failed");
    }
};
if (typeof module !== "undefined") module.exports = OllamaFreeAdapter;
else window._HonestAbeAdapter_OllamaFree = OllamaFreeAdapter;
