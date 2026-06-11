const { app, BrowserWindow } = require('electron')
const { Worker } = require('worker_threads');


const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow();
    
    // const smtcWorker = new Worker(path.join(__dirname, 'smtc-worker.js'));
    const smtcWorker = new Worker('./smtc-worker.js');
    smtcWorker.on('message', (data) => {
        let isSystemMediaPlaying = data.isMediaActive;
        let mediaAppSource = data.sourceApp || '';

        console.log("media playing: ", isSystemMediaPlaying);
        console.log("media playing2: ", mediaAppSource);
    }).catch((errorr) => {
        console.log(errorr)
    });

    myInterval = setInterval(() => {
        console.log('Do DB stuff!');
    }, 5000);
})

app.on('window-all-closed', () => {
    app.quit()
})