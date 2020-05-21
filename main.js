// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')

Menu.setApplicationMenu(null)

let mainWindow
function createWindow () {
    mainWindow = new BrowserWindow({
        width: 920,
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

        start()
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
const fs = require('fs')
const p = require('util').promisify
const toml = require('toml')

const Bot = require('wahtson')


const configPath = path.join(__dirname,"config.toml")
const dbPath = path.join(__dirname,"database.sqlite")

const bot = new Bot({
    dbPath,
    promptInvite: true,
})

bot.on('log', ({ level, text }) => {
    mainWindow.webContents.send("log", { level, text })
})

bot.on('action', ({ index, numActions, action, skipped, source, event }) => {
    mainWindow.webContents.send("action", { index, numActions, action, skipped, source, event })
})

const start = () => {
    mainWindow.webContents.send("ready", { text: `Wahtson v${Bot.version}` })

    loadConfig(configPath)
        .then(config => {
            bot.config.reset(config)
            return bot.start()
        })
        .then(() => {
            let configChangedLast = Date.now()
            fs.watch(configPath, () => {
                // Debounce; fs.watch likes to call this multiple times for a single change.
                if (Date.now() - configChangedLast < 500) {
                    return
                }
                configChangedLast = Date.now()

                console.log(chalk.grey('Config file changed, reloading...'))
                loadConfig(configPath)
                    .then(config => {
                        bot.config.reset(config)
                    })
                    .catch(err => {
                        console.error(chalk.red(err))
                    })
            })
        })
        .catch(err => {
            console.error(chalk.red(err))
            process.exit(1)
        })
}

async function loadConfig(configPath) {
    const source = await p(fs.readFile)(configPath, 'utf8')

    try {
        return toml.parse(source)
    } catch (err) {
        throw `Syntax error in config on line ${err.line} column ${err.column}`
    }
}