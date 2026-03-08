/**
 * ADAPTER: Hugging Face Inference API
 * Free account required. No credit card.
 * https://huggingface.co/inference-api
 *
 * User sets their free HF token in extension settings.
 * Falls through to next adapter if token not set.
 */

const HuggingFaceAdapter = {
    name: "HuggingFace",
    _model: "mistralai/Mistral-7B-Instruct-v0.3",
    _endpoint: "https://api-inference.huggingface.co/models/",

    _getToken() {
        // Browser extension storage or env
        if (typeof chrome !== "undefined" && chrome.storage) {
            return new Promise(resolve =>
                chrome.storage.local.get("hf_token", r => resolve(r.hf_token || null))
            );
        }
        return Promise.resolve(
            (typeof process !== "undefined" && process.env?.HF_TOKEN) || null
        );
    },

    async available() {
        const token = await this._getToken();
        return !!token;
    },

    async query(prompt) {
        const token = await this._getToken();
        const res = await fetch(`${this._endpoint}${this._model}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { max_new_tokens: 512, return_full_text: false }
            })
        });
        const data = await res.json();
        return Array.isArray(data) ? data[0]?.generated_text || "" : data?.error || "";
    }
};

if (typeof module !== "undefined") module.exports = HuggingFaceAdapter;
else window._HonestAbeAdapter_HuggingFace = HuggingFaceAdapter;
