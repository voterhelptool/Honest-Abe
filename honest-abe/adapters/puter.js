/**
 * ADAPTER: Puter.js
 * No API key. No account. 500+ models. One script tag.
 * https://puter.com
 */

const PuterAdapter = {
    name: "Puter.js",

    async available() {
        return typeof puter !== "undefined" && typeof puter.ai?.chat === "function";
    },

    async query(prompt) {
        const response = await puter.ai.chat(prompt, {
            model: "claude-sonnet-4-5",  // strong reasoning, falls back inside Puter if unavailable
        });
        return typeof response === "string" ? response : response?.message?.content?.[0]?.text || JSON.stringify(response);
    }
};

if (typeof module !== "undefined") module.exports = PuterAdapter;
else window._HonestAbeAdapter_Puter = PuterAdapter;
