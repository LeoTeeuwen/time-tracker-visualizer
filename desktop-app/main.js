const { app, BrowserWindow } = require('electron')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600
    })

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    myInterval = setInterval(() => {
        console.log('Do DB stuff!');
    }, 5000);
})

app.on('window-all-closed', () => {
    app.quit()
})