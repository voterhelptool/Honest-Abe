/**
 * ADAPTER: OpenRouter
 * Free tier — DeepSeek R1, Llama 3, Qwen, Gemma — no billing required
 * Free account at openrouter.ai
 */
const OpenRouterAdapter = {
    name: "openrouter",
    async available() { return true; },
    async query(prompt) {
        const models = [
            "deepseek/deepseek-r1:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "google/gemma-3-27b-it:free",
            "qwen/qwen3-235b-a22b:free",
        ];
        for (const model of models) {
            try {
                const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://voterhelptool.github.io/Honest-Abe/",
                        "X-Title": "Honest Abe Truth Agent",
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 700,
                        temperature: 0.1
                    })
                });
                if (!res.ok) continue;
                const data = await res.json();
                const text = data?.choices?.[0]?.message?.content;
                if (text) return text;
            } catch { continue; }
        }
        throw new Error("OpenRouter: all models failed");
    }
};
if (typeof module !== "undefined") module.exports = OpenRouterAdapter;
else window._HonestAbeAdapter_OpenRouter = OpenRouterAdapter;
