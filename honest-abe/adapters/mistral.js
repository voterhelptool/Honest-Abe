/**
 * ADAPTER: Mistral AI
 * Free tier. No credit card. 1B tokens/month.
 * European company — strong privacy posture.
 * https://mistral.ai
 *
 * User sets their free Mistral key in extension settings.
 * Falls through if not set.
 */

const MistralAdapter = {
    name: "Mistral",
    _endpoint: "https://api.mistral.ai/v1/chat/completions",

    _getKey() {
        if (typeof chrome !== "undefined" && chrome.storage) {
            return new Promise(resolve =>
                chrome.storage.local.get("mistral_key", r => resolve(r.mistral_key || null))
            );
        }
        return Promise.resolve(
            (typeof process !== "undefined" && process.env?.MISTRAL_KEY) || null
        );
    },

    async available() {
        const key = await this._getKey();
        return !!key;
    },

    async query(prompt) {
        const key = await this._getKey();
        const res = await fetch(this._endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "mistral-small-latest",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 512
            })
        });
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
    }
};

if (typeof module !== "undefined") module.exports = MistralAdapter;
else window._HonestAbeAdapter_Mistral = MistralAdapter;
