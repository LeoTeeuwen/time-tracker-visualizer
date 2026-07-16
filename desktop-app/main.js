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
const grabAllFromDatabase = async (showDayEnds) => {
    const { data, error } = await supabase.from('time_events').select("*").lt('event_time', dayObject.endUTCTimeDateString).gt('event_time', dayObject.startUTCTimeDateString).order('event_time', {ascending: true});

    let cleanedOutput = "";
    
    const labels = [];
    const piechartData = [];
    const backgroundColor= [];
    let orderedData;

    const millisecondsInFrame = 86399000;
    
    orderedData = [{device: "new_day", event_time: dayObject.startUTCTimeDateString, application_name: "new_day", state: "new_day", app_type: "new_day"}, ...data, {device: "end_day", event_time: dayObject.endUTCTimeDateString, application_name: "end_day", state: "end_day", app_type: "end_day"}];

    if (!data?.length) {
        labels.push('No activity detected today!');
        piechartData.push(100);
        backgroundColor.push(random_rgba());
        
        orderedData = [];
    }

    for (let i in orderedData) {
        // Last one in the order
        if (i == orderedData.length-1) {
            continue;
        }
        
        const entry = orderedData[i];
        const nextEntry = orderedData[parseInt(i)+1];

        const localDateTime = new Date(entry.event_time).toLocaleString();    
        const currentEventObject= new Date(entry.event_time);
        const nextEventObject = new Date(nextEntry.event_time);

        const timePercentage = (nextEventObject.getTime() - currentEventObject.getTime())/millisecondsInFrame;

        if (entry.application_name === "new_day" || entry.application_name === "end_day" || entry.state === "shutting_down") {
            // TODO include idle from X time to X time?
            labels.push(`No Activity`);
            // console.log("Idle");
        } else {
            if (entry.state === "idle") {
                labels.push(`Idle on ${entry.application_name} from ${currentEventObject.toLocaleTimeString()} to ${nextEventObject.toLocaleTimeString()}`);
                // console.log(`Idle on ${entry.application_name} from ${currentEventObject.toLocaleTimeString()} to ${nextEventObject.toLocaleTimeString()}`);
            } else {
                labels.push(`Using ${entry.application_name} from ${currentEventObject.toLocaleTimeString()} to ${nextEventObject.toLocaleTimeString()}`);
                // console.log(`Using ${entry.application_name} from ${currentEventObject.toLocaleTimeString()} to ${nextEventObject.toLocaleTimeString()}`);
            }
        }
        piechartData.push(timePercentage);
        backgroundColor.push(random_rgba());
    }

    if (!showDayEnds) {
        if (labels[0] === "Idle") {
            labels.splice(0, 1);
            piechartData.splice(0, 1);
            backgroundColor.splice(0, 1);
        }
        if (labels[labels.length - 1] === "Idle") {
            labels.splice(labels.length - 1, 1);
            piechartData.splice(labels.length - 1, 1);
            backgroundColor.splice(labels.length - 1, 1); 
        }
    }

    // console.log(labels)

    return { labels, piechartData, backgroundColor };
}

const grabBarChartTimeBreakdown = async () => {
    const { data, error } = await supabase.from('time_events').select("*").lt('event_time', dayObject.endUTCTimeDateString).gt('event_time', dayObject.startUTCTimeDateString).order('event_time', {ascending: true});
    
    if (!data?.length) {
        return [{
            label: "No activity detected today!",
            data: [24],
            backgroundColor: random_rgba() 
        }]
    }

    const millisecondsInFrame = 86399000;
    
    orderedData = [{device: "new_day", event_time: dayObject.startUTCTimeDateString, application_name: "No Activity", state: "new_day", app_type: "new_day"}, ...data, {device: "end_day", event_time: dayObject.endUTCTimeDateString, application_name: "No Activity", state: "end_day", app_type: "end_day"}];

    const applicationTimeObject = {}

    for (let i in orderedData) {
        if (i == orderedData.length-1) {
            continue;
        }
        
        const entry = orderedData[i];
        const nextEntry = orderedData[parseInt(i)+1];

        const currentEventObject= new Date(entry.event_time);
        const nextEventObject = new Date(nextEntry.event_time);

        // const timePercentage = (nextEventObject.getTime() - currentEventObject.getTime())/millisecondsInFrame;
        const timePercentage = (nextEventObject.getTime() - currentEventObject.getTime());

        // applicationTimeObject[`${entry.application_name}`] += 
        if (Object.hasOwn(applicationTimeObject, entry.application_name)) {
            applicationTimeObject[`${entry.application_name}`] += timePercentage;
        } else {
            applicationTimeObject[`${entry.application_name}`] = timePercentage;
        }
        
    }

    // console.log("Application Object", applicationTimeObject)

    // Make the object fit into the format of the data for the Bar Chart
    const formattedData = []

    for (const [key, value] of Object.entries(applicationTimeObject)) {
        formattedData.push({
            label: key,
            data: [value/3600000], // 1000milsec/sec * 60sec/min * 60min/hr
            backgroundColor: random_rgba()
        });
    }

    // console.log(formattedData);
    
    return formattedData;
}

const pushToDatabase = async () => {
    if (currentApplication.device === null) {
        console.log("Wait for it to register an app!");
        return;
    }
    await supabase.from('time_events').insert(currentApplication);
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
    ipcMain.handle('grab-all-from-database', (_, showDayEnds) => grabAllFromDatabase(showDayEnds))
    ipcMain.handle('grab-current-date', (_) => grabCurrentDate())
    ipcMain.handle('grab-bar-chart-data', (_) => grabBarChartTimeBreakdown())
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

        if (activeWindowSync().owner && activeWindowSync().owner.name && activeWindowSync().owner.name !== currentApplication.application_name && activeWindowSync().owner.name !== "Google Chrome") {
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