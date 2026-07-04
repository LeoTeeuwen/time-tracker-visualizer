require('dotenv').config();
const ElectronShutdownHandler = require('@paymoapp/electron-shutdown-handler').default;
const { app, BrowserWindow, powerMonitor, ipcMain } = require('electron')
const { Worker } = require('worker_threads');
const { activeWindowSync } = require('get-windows');
const { createClient } = require('@supabase/supabase-js');
const os = require('os');
const path = require('node:path');
const fs = require('fs');
const supabase = createClient('https://dhyrzbqugxgtjaurnczc.supabase.co', process.env.DB_PUBLISHABLE_KEY)
const { PUSH_TO_DATABASE } = require('./Constants.ts')

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
    
    let end = new Date(localDate);
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

function random_rgba() {
    var o = Math.round, r = Math.random, s = 255;
    return 'rgba(' + o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s) + ',' + r().toFixed(1) + ')';
}

// TODO Make all sections repush at 12am!!!
const grabAllFromDatabase = async () => {
    const { data, error } = await supabase.from('time_events').select("*").lt('event_time', dayObject.endUTCTimeDateString).gt('event_time', dayObject.startUTCTimeDateString).order('event_time', {ascending: true});

    let cleanedOutput = ""

    
    const labels = []
    const piechartData = []
    const backgroundColor= []
    const orderedData = [{device: "new_day", event_time: dayObject.startUTCTimeDateString, application_name: "new_day", state: "new_day", app_type: "new_day"}, ...data, {device: "end_day", event_time: dayObject.endUTCTimeDateString, application_name: "end_day", state: "end_day", app_type: "end_day"}]

    const millisecondsInDay = 86399000;

    for (let i in orderedData) {
        if (i == orderedData.length-1) {
            continue;
        }
        
        const entry = orderedData[i]
        const nextEntry = orderedData[parseInt(i)+1]

        console.log(entry)
        console.log(nextEntry)

        let localDateTime = new Date(entry.event_time).toLocaleString();        

        const timePercentage = (new Date(nextEntry.event_time).getTime() - new Date(entry.event_time).getTime())/millisecondsInDay

        labels.push(`Opened ${entry.application_name}`);
        piechartData.push(timePercentage);
        backgroundColor.push(random_rgba());


        // console.log(entry);
        // if (entry.state == "active") {
        // cleanedOutput = cleanedOutput + `Opened ${entry.application_name} on device ${entry.device}, on datetime ${localDateTime} \n`;
        // } 
        // else if (entry.state == "idle") {
        //   cleanedOutput = cleanedOutput + `Went idle on ${entry.application_name} on device ${entry.device}, on datetime ${localDateTime} \n`;
        // } 
        // else if (entry.state == "shutting_down") {
        // cleanedOutput = cleanedOutput + `Closed ${entry.application_name} on device ${entry.device}, on datetime ${localDateTime} \n`;
        // } 
    }

    console.log("Labels: ", labels)
    console.log("Data ", piechartData)
    console.log("Background Colors ", backgroundColor)

    return { labels, piechartData, backgroundColor };
}

const pushToDatabase = async () => {
    if (currentApplication.device === null) {
        console.log("Wait for it to register an app!");
        return;
    }
    await supabase.from('time_events').insert(currentApplication);
    // supabase.from('time_events').insert(currentApplication).select().then((data, error) => {
    //     console.log("data: ", data);
    //     console.log("error: ", error);
    // })
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
    dayObject.startUTCTimeDate.setHours((dayObject.startUTCTimeDate.getHours() - 24));
    dayObject.startUTCTimeDateString = dayObject.startUTCTimeDate.toUTCString()
    dayObject.endUTCTimeDate.setHours((dayObject.endUTCTimeDate.getHours() - 24));
    dayObject.endUTCTimeDateString = dayObject.endUTCTimeDate.toUTCString()
    dayObject.currentDate = dayObject.startUTCTimeDate.toLocaleDateString();
})

const forwardOneDay = (() => {
    dayObject.startUTCTimeDate.setHours((dayObject.startUTCTimeDate.getHours() + 24));
    dayObject.startUTCTimeDateString = dayObject.startUTCTimeDate.toUTCString()
    dayObject.endUTCTimeDate.setHours((dayObject.endUTCTimeDate.getHours() + 24));
    dayObject.endUTCTimeDateString = dayObject.endUTCTimeDate.toUTCString()
    dayObject.currentDate = dayObject.startUTCTimeDate.toLocaleDateString();
})

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 900,
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

    win.on('close', (event) => {
        // Prevent the window from closing natively
        event.preventDefault(); 
        
        // Minimize the window to the taskbar instead
        win.minimize(); 
    });

	ElectronShutdownHandler.setWindowHandle(win.getNativeWindowHandle());
    ElectronShutdownHandler.blockShutdown('Please wait for some data to be saved');
    ElectronShutdownHandler.on('shutdown', async () => {
		console.log('Shutting down!');
        currentApplication.state = "shutting_down";
        await pushToDatabase();
		ElectronShutdownHandler.releaseShutdown();
		app.quit();
	});

    smtcWorker.on('message', (data) => {
        systemMediaPlaying = data.isMediaActive;
        currentMediaSources = data.activeSources || [];
    });
        
    let closing = false

    let isShuttingDown = false;
    let isAsyncTaskDone = false;

    // Linux, Mac OS, Windows avoids this because it sucks
    powerMonitor.on('shutdown', async (event) => {
        event.preventDefault();        

        currentApplication.state = "shutting_down";

        await pushToDatabase();

        app.quit()
    });

    myInterval = setInterval(() => {
        const runningMediaString = currentMediaSources
            .map(item => `${item.sourceApp} ("${item.title}" by ${item.artist})`)
            .join(' AND ');
        console.log(runningMediaString);

        for (let media of currentMediaSources) {
            console.log(media)
        }

        console.log("Active window sync: ", activeWindowSync());
        // Argument is number of seconds before considered idle
        console.log(powerMonitor.getSystemIdleTime());
        const state = powerMonitor.getSystemIdleState(5);
        console.log('Current System State - ', state);

        if (activeWindowSync().owner.name !== currentApplication.application_name) {
            currentApplication = {
                device: computerName,
                event_time: new Date(),
                application_name: activeWindowSync().owner.name,
                state: state,
                app_type: "application"
            }
            // TODO push in 10 second intervals with an array?
            if (PUSH_TO_DATABASE) {
                console.log("Pushing to DB!");
                pushToDatabase();
            }
        }
    }, 5000);
})

app.on('window-all-closed', () => {
    app.quit()
})