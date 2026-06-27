require('dotenv').config();
const { app, BrowserWindow, powerMonitor, ipcMain } = require('electron')
const { Worker } = require('worker_threads');
const { activeWindowSync } = require('get-windows');
const { createClient } = require('@supabase/supabase-js');
const os = require('os');
const path = require('node:path');


const supabase = createClient('https://dhyrzbqugxgtjaurnczc.supabase.co', process.env.DB_PUBLISHABLE_KEY)

const dayObject = {
    currentDate: null,
    startUTCTimeDateString: null,
    startUTCTimeDate: null,
    endUTCTimeDateString: null,
    endUTCTimeDate: null
}

let currentApplication = {
    device: null,
    event_time: null,
    application_name: null,
    state: null,
    app_type: null
}

const computerName = os.hostname()

const setDayObject = (() => {
    let localDate = new Date().toLocaleDateString();

    console.log(`${localDate}`)

    
    let start = new Date(localDate);
    start.setHours(0,0,0,0);
    
    var end = new Date(localDate);
    end.setHours(23,59,59,999);
    
    
    console.log( start.toUTCString() + ':' + end.toUTCString() );
    dayObject.currentDate = localDate;
    dayObject.startUTCTimeDate = start;
    dayObject.startUTCTimeDateString = start.toUTCString();
    dayObject.endUTCTimeDate = end;
    dayObject.endUTCTimeDateString = end.toUTCString();
    console.log("dayObject:", dayObject)
})

const grabCurrentDate = () => {
    return dayObject.currentDate;
}

const grabAllFromDatabase = async () => {
    let localDate = new Date().toLocaleDateString();

    console.log(`${localDate}`)

    
    let start = new Date(localDate);
    start.setHours(0,0,0,0);
    
    var end = new Date(localDate);
    end.setHours(23,59,59,999);

    console.log( start.toUTCString() + ':' + end.toUTCString() );

    
    return await supabase.from('time_events').select("*").lt('event_time', dayObject.endUTCTimeDateString).gt('event_time', dayObject.startUTCTimeDateString);
}

const pushToDatabase = () => {
    if (currentApplication.device === null) {
        console.log("Wait for it to register an app!");
        return;
    }
    supabase.from('time_events').insert(currentApplication).select().then((data, error) => {
        console.log("data: ", data);
        console.log("error: ", error);
    })
}

let devToolsOpen = true;
const devToolsSwitch = (win) => {
    if (devToolsOpen) {
        win.webContents.closeDevTools()
        devToolsOpen = false;
    } else {
        win.webContents.openDevTools()
        devToolsOpen = true;
    }
}

const backOneDay = (() => {
    console.log(dayObject)
    dayObject.startUTCTimeDate.setHours((dayObject.startUTCTimeDate.getHours() - 24));
    dayObject.startUTCTimeDateString = dayObject.startUTCTimeDate.toUTCString()
    dayObject.endUTCTimeDate.setHours((dayObject.endUTCTimeDate.getHours() - 24));
    dayObject.endUTCTimeDateString = dayObject.endUTCTimeDate.toUTCString()
    dayObject.currentDate = dayObject.startUTCTimeDate.toLocaleDateString();
    console.log(dayObject)
})

const forwardOneDay = (() => {
    console.log(dayObject)
    dayObject.startUTCTimeDate.setHours((dayObject.startUTCTimeDate.getHours() + 24));
    dayObject.startUTCTimeDateString = dayObject.startUTCTimeDate.toUTCString()
    dayObject.endUTCTimeDate.setHours((dayObject.endUTCTimeDate.getHours() + 24));
    dayObject.endUTCTimeDateString = dayObject.endUTCTimeDate.toUTCString()
    dayObject.currentDate = dayObject.startUTCTimeDate.toLocaleDateString();
    console.log(dayObject)
})

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
    win.webContents.openDevTools()
    return win;
}

let currentMediaSources = []; // Store multiple playing applications simultaneously
let systemMediaPlaying = false;

app.whenReady().then(() => {
    // TODO ensure the structure of the window being before  the creation of an IPC call is okay
    setDayObject();
    ipcMain.on('push-to-db-button', (_) => pushToDatabase())
    ipcMain.on('back-one-button', (_) => backOneDay())
    ipcMain.on('forward-one-button', (_) => forwardOneDay())
    ipcMain.handle('grab-all-from-database', (_) => grabAllFromDatabase())
    ipcMain.handle('grab-current-date', (_) => grabCurrentDate())
    win = createWindow();
    ipcMain.on('dev-tools-switch', (_) => devToolsSwitch(win))
    
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
        // Argument is number of seconds before considered idle
        console.log(powerMonitor.getSystemIdleTime());
        const state = powerMonitor.getSystemIdleState(5);
        console.log('Current System State - ', state);

        currentApplication = {
            device: computerName,
            event_time: new Date(),
            application_name: activeWindowSync().owner.name,
            state: state,
            app_type: "application"
        }
        console.log(currentApplication)
    }, 5000);
})

app.on('window-all-closed', () => {
    app.quit()
})