const { app, BrowserWindow, powerMonitor, ipcMain } = require('electron')
const { Worker } = require('worker_threads');
const { activeWindowSync } = require('get-windows');
const { createClient } = require('@supabase/supabase-js');
const path = require('node:path');

const supabase = createClient('https://dhyrzbqugxgtjaurnczc.supabase.co', 'sb_publishable_xRczi_x4v7SX5TcczodaIw_Y-LL1XNQ')


const pushToDatabase = () => {
    console.log("Ran!")
    supabase.from('time_events').select().then((data, error) => {
        console.log("data: ", data);
    })
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
}

let currentMediaSources = []; // Store multiple playing applications simultaneously
let systemMediaPlaying = false;

app.whenReady().then(() => {
    ipcMain.on('push-to-db-button', (_) => pushToDatabase())
    createWindow();
    
    const smtcWorker = new Worker('./smtc-worker.js');
    
    smtcWorker.on('message', (data) => {
        systemMediaPlaying = data.isMediaActive;
        currentMediaSources = data.activeSources || [];
    });
    
    myInterval = setInterval(() => {
        const runningMediaString = currentMediaSources
            .map(item => `${item.sourceApp} ("${item.title}" by ${item.artist})`)
            .join(' AND ');
        console.log(runningMediaString);
        console.log(activeWindowSync());
    }, 5000);
    
    idleInterval = setInterval(() => {
        // Argument is number of seconds before considered idle
        console.log(powerMonitor.getSystemIdleTime());
        const state = powerMonitor.getSystemIdleState(5);
        console.log('Current System State - ', state);
    }, 1000);

})

app.on('window-all-closed', () => {
    app.quit()
})