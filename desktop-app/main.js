const { app, BrowserWindow } = require('electron')
const { Worker } = require('worker_threads');
const { activeWindowSync } = require('get-windows');


const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.loadFile('index.html')
}

let currentMediaSources = []; // Store multiple playing applications simultaneously
let systemMediaPlaying = false;

app.whenReady().then(() => {
    createWindow();
    
    const smtcWorker = new Worker('./smtc-worker.js');
    
    smtcWorker.on('message', (data) => {
        systemMediaPlaying = data.isMediaActive;
        currentMediaSources = data.activeSources || [];
    });
    
    myInterval = setInterval(() => {
        console.log('Do DB stuff!');
        const runningMediaString = currentMediaSources
            .map(item => `${item.sourceApp} ("${item.title}" by ${item.artist})`)
            .join(' AND ');
        console.log(runningMediaString);
        console.log(activeWindowSync());

    }, 5000);
})

app.on('window-all-closed', () => {
    app.quit()
})