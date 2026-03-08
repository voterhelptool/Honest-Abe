/**
 * HONEST ABE — background.js
 * Service worker. Routes messages between popup, content script, and core.
 */

// ── CONTEXT MENU ──────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id:       "honest-abe-analyze",
        title:    "Analyze with Honest Abe",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "honest-abe-analyze" && info.selectionText) {
        chrome.tabs.sendMessage(tab.id, {
            type:  "ANALYZE_SELECTION",
            claim: info.selectionText.trim()
        });
    }
});

// ── MESSAGE ROUTING ───────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_STATUS") {
        sendResponse({ status: "active", version: "1.0.0" });
    }
    return true;
});
