// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')

Menu.setApplicationMenu(null)

let mainWindow
function createWindow () {
    mainWindow = new BrowserWindow({
        width: 840,
        height: 640,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'ui/preload.js')
        },
        show: false
    })

    mainWindow.loadFile('ui/index.html')

    //mainWindow.openDevTools();

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()

        bot.start()
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

const chalk = require('chalk')
const open = require('open')
const { Wahtson } = require('wahtson')
let bot = new Wahtson({
    configPath: path.join(__dirname,"config.toml"),
    dbPath: path.join(__dirname,"database.sqlite")
})

process.title = `WAHtson ${bot.version}`


let logLevel = 0
const eventLevels = { DEBUG: 0, INFO: 1, ACTION: 2, STATUS: 3, WARN: 4, ERROR: 5, FATAL: 6 }

bot.on('ready', async event => {
    mainWindow.webContents.send("version", bot.version);

    logLevel = await event.get('log_level')
    const logTypes = Object.keys(eventLevels).filter(l => eventLevels[l] >= logLevel)

    mainWindow.webContents.send("event", { type: "INFO", text: `Logging level ${logLevel}: <span grey>${logTypes.join(', ')}</span>`})
})

let prevEvent = {}
bot.on('event', event => {
    if (eventLevels[event.type] < logLevel) return

    if (JSON.stringify(event) == JSON.stringify(prevEvent)) return
    prevEvent = event
    setTimeout(() => {
        if (JSON.stringify(event) != JSON.stringify(prevEvent)) return
        prevEvent = {}
    }, 100)

    mainWindow.webContents.send("event", event)

    if (event.type == 'ERROR') {
        //process.stdout.write(chalk.red(event.text) + ' ')

        if (event.precaution == 'COPY_EXAMPLE_CONFIG') {
        }
        if (event.precaution == 'OPEN_CONFIG') {
            open(bot.botOptions.configPath, { app: 'notepad', wait: true })
        }
    }
})