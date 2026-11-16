import { APP_ORIGIN, libraryUrl } from "./shared.js";

// First install only: an update should not open a tab nobody asked for.
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") void chrome.tabs.create({ url: `${APP_ORIGIN}/extension/welcome` });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId }).then(() => {
    return chrome.action.setBadgeText({ text: "" });
  }).catch((error) => {
    console.error("Keep & Cook could not open the recipe panel", error);
    void chrome.action.setBadgeText({ text: "!" });
    void chrome.action.setTitle({ title: "Could not open recipe panel. Reload the extension and try again." });
  });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(console.error);

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== "save-recipe" || sender.id !== chrome.runtime.id) return;
  try {
    const url = libraryUrl(message.recipe);
    chrome.tabs.create({ url }).then(() => respond({ ok: true })).catch(() => respond({ error: "Could not open Keep & Cook. Try again." }));
  } catch (error) { respond({ error: error.message }); }
  return true;
});
