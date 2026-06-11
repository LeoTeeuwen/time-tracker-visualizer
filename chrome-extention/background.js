// To track user tabs can I just take the URL and then take the first thing after https: and then grab that as the title of the tab for general consistency within sub routes??

// Do i want to be compiling total time or do i want to be compiling like exactly when tabs are switched
// As in, "you spent X hours on reddit" or "You switched from reddit to youtube on these timestamps in this hour"
// Both?

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

// Is called on the tab being opened, closed, and focused. Maybe use this to only send reports of new tabs and then assume the tab is focused as it calls when a tab is made or focused? (and deal with closing internally ofc)
chrome.tabs.onActivated.addListener(
    (activeInfo) => {
        // console.log(activeInfo)
        getCurrentTab().then((info) => {
            console.log(info)
        })
        console.log("Tab Activated!")
    }
)

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the tab has finished loading and the URL has changed
    if (changeInfo.status === 'complete') {
        // console.log("Tab navigated and updated!")
        // console.log("tab ID: ", tabId)
        // console.log("changeInfo: ", changeInfo)
        // console.log("tab: ", tab)

        
        // const urlObj = new URL(tab.url);
        // console.log(urlObj.hostname)
    }
});

// Tracks when chrome is focused in general or not (seems useful for dual monitor maybe?)
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    // console.log("windowID: ", windowId);
});