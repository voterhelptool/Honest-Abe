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
            if (signedIn) return true;
            // Not signed in — trigger sign-in popup and WAIT for it
            await puter.auth.signIn();
            // Verify it actually worked
            return !!(await puter.auth.isSignedIn());
        } catch(e) {
            // User closed popup or auth failed — fall through to next provider
            return false;
        }
    },

    async query(prompt) {
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
