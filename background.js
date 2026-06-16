// On extension installation or reload, automatically inject content scripts into all existing tabs
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }, (tabs) => {
    for (const tab of tabs) {
      // Skip chrome://, chrome-extension://, or about: pages
      if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://") || tab.url.startsWith("about:") || tab.url.startsWith("view-source:")) {
        continue;
      }
      
      // Inject CSS
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["content.css"]
      }).catch(err => console.log("Failed to inject CSS on tab " + tab.id, err));

      // Inject JS
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      }).catch(err => console.log("Failed to inject JS on tab " + tab.id, err));
    }
  });
});
