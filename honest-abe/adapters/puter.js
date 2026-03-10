/**
 * ADAPTER: Puter.js
 * No API key. No account. 500+ models. One script tag.
 * https://puter.com
 */

const PuterAdapter = {
    name: "Puter.js",

    async available() {
        if (typeof puter === "undefined" || typeof puter.ai?.chat !== "function") return false;
        try {
            const signedIn = await puter.auth.isSignedIn();
            return !!signedIn;
        } catch(e) {
            return false;
        }
    },

    async query(prompt) {
        const signedIn = await puter.auth.isSignedIn();
        if (!signedIn) await puter.auth.signIn();
        const response = await puter.ai.chat(prompt, {
            model: "claude-sonnet-4-6",
        });
        if (typeof response === "string") return response;
        if (response?.message?.content?.[0]?.text) return response.message.content[0].text;
        if (Array.isArray(response?.message?.content)) return response.message.content.map(c => c.text || "").join("");
        return JSON.stringify(response);
    }
};

if (typeof module !== "undefined") module.exports = PuterAdapter;
else window._HonestAbeAdapter_Puter = PuterAdapter;
