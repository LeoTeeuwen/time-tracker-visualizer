// To track user tabs can I just take the URL and then take the first thing after https: and then grab that as the title of the tab for general consistency within sub routes??

// Do i want to be compiling total time or do i want to be compiling like exactly when tabs are switched
// As in, "you spent X hours on reddit" or "You switched from reddit to youtube on these timestamps in this hour"
// Both?

// importScripts('./config.js');
import { createClient } from '@supabase/supabase-js';
import './config.js';

const supabase = createClient('https://dhyrzbqugxgtjaurnczc.supabase.co', env.DB_PUBLISHABLE_KEY);

const PUSH_TO_DATABASE = false;

let currentTab = {
    device: null,
    event_time: null,
    application_name: null,
    state: null,
    app_type: null,
}

async function pushToDatabase() {
    supabase.from('time_events').insert(currentTab).select().then((data, error) => {
        console.log("data: ", data);
        console.log("error: ", error);
    })
}


async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

// Is called on the tab being opened, closed, and focused. Maybe use this to only send reports of new tabs and then assume the tab is focused as it calls when a tab is made or focused? (and deal with closing internally ofc)
// Called when tab is opened (pending URL) and status is loading. When tab deleted (info is new tab), on tab switch (info is new tab)
chrome.tabs.onActivated.addListener(
    (activeInfo) => {
        getCurrentTab().then((info) => {
            // Only take inputs when the tab is not loading to not interfere with tab update pushing
            if (info.status !== "loading") {
                const urlObj = new URL(info.url);
                if (urlObj.hostname !== currentTab.application_name) {
                    console.log(`Current Tab is now ${urlObj.hostname}`);
                    currentTab = {
                        ...currentTab,
                        device: "chrome",
                        event_time: new Date(),
                        application_name: urlObj.hostname,
                        state: "active",
                        app_type: "chrome"
                    }
                    if (PUSH_TO_DATABASE) {
                        pushToDatabase().then(() => {
                            console.log("Pushed to database!");
                        })
                    }
                }
            }
        })
    }
)


// This seems less on demand then OnActivated
// chrome.tabs.onCreated.addListener((tab) => {
//     console.log(tab)
//     console.log(`AFocused tab is now ${tab}`);
// });

// chrome.tabs.onRemoved.addListener((tab, removeInfo) => {
//     console.log(`DFocused tab is now ${tab}`)
// })

// Use this listener to grab when the focused changes by cross referencing current tab IDs!
// Then use this to send a new update to the DB that then signals the prev website has been left
// Detects on tab open, and on tab entering another website
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the tab has finished loading and the URL has changed
    if (changeInfo.status === 'complete') {
        const urlObj = new URL(tab.url);
        // console.log(`${tabId} updated to ${urlObj.hostname}`)
        if (urlObj.hostname !== currentTab.application_name) {
            console.log(`Current Tab is now ${urlObj.hostname}`)
            currentTab = {
                ...currentTab,
                device: "chrome",
                event_time: new Date(),
                application_name: urlObj.hostname,
                state: "active",
                app_type: "chrome"
            }
            if (PUSH_TO_DATABASE) {
                pushToDatabase().then(() => {
                    console.log("Pushed to database!");
                })
            }
        }
    }
});

// Tracks when chrome is focused in general or not (seems useful for dual monitor maybe?)
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    // console.log("windowID: ", windowId);
    // if (PUSH_TO_DATABASE) {
    //     pushToDatabase().then(() => {
    //         console.log("All done!");
    //     })
    // }
    console.log("Focus Changed!");
});