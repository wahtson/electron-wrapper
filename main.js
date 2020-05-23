const { app, BrowserWindow, Menu } = require('electron')

if (require('electron-squirrel-startup')) return app.quit()

const path = require('path')

Menu.setApplicationMenu(null)

let mainWindow
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 920,
        height: 640,
        icon: __dirname + '/assets/icon.ico',
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'ui/preload.js'),
        },
        show: false,
    })

    mainWindow.loadFile('ui/index.html')

    //mainWindow.openDevTools();

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()

        start()
        mainWindow.webContents.send('ready', { text: `Wahtson v${Bot.version}` })
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

const fs = require('mz/fs')
const toml = require('toml')

const Bot = require('wahtson')

const configUpgrader = require('wahtson-config-upgrader')

const configPath = path.join(process.env.appdata, 'wahtson-electron/Local Storage', 'config.json5')
const configBackupPath = path.join(
    process.env.appdata,
    'wahtson-electron/Local Storage',
    'config.toml',
)
const dbPath = path.join(process.env.appdata, 'wahtson-electron/Local Storage', 'database.sqlite')

const bot = new Bot({
    dbPath,
    promptInvite: true,
})

bot.on('log', ({ level, text }) => {
    mainWindow.webContents.send('log', { level, text })
})

bot.on('action', ({ index, numActions, action, skipped, source, event }) => {
    mainWindow.webContents.send('action', { index, numActions, action, skipped, source, event })
})

const start = () => {
    loadConfig(configPath, configBackupPath)
        .then(config => {
            bot.config.reset(config)
            return bot.start()
        })
        .then(() => {
            let configChangedLast = Date.now()
            let configBackupChangedLast = Date.now()
            fs.watch(configBackupPath, async () => {
                // Debounce; fs.watch likes to call this multiple times for a single change.
                if (Date.now() - configBackupChangedLast < 500) {
                    return
                }
                configBackupChangedLast = Date.now()

                //console.log(chalk.grey('Config file changed, reloading...'))
                mainWindow.webContents.send('log', {
                    level: -1,
                    text:
                        'The use of <span white>config.toml</span> is deprecated. Please use <span white>config.json5</span> instead',
                })

                await configUpgrader(configBackupPath, configPath)

                loadConfig(configPath, configBackupPath)
                    .then(config => {
                        bot.config.reset(config)
                    })
                    .catch(err => {
                        //console.error(chalk.red(err))
                        mainWindow.webContents.send('log', { level: 2, text: err })
                    })
            })
            fs.watch(configPath, () => {
                // Debounce; fs.watch likes to call this multiple times for a single change.
                if (Date.now() - configChangedLast < 500) {
                    return
                }
                configChangedLast = Date.now()

                //console.log(chalk.grey('Config file changed, reloading...'))
                mainWindow.webContents.send('log', {
                    level: -1,
                    text: 'Config file changed, reloading...',
                })
                loadConfig(configPath, configBackupPath)
                    .then(config => {
                        bot.config.reset(config)
                    })
                    .catch(err => {
                        //console.error(chalk.red(err))
                        mainWindow.webContents.send('log', { level: 2, text: err })
                    })
            })
        })
        .catch(err => {
            //console.error(chalk.red(err))
            mainWindow.webContents.send('log', { level: 2, text: err })
        })
}

const JSON5 = require('json5')
async function loadConfig(configPath, configBackupPath) {
    return new Promise(async (resolve, reject) => {
        let resolvedConfigPath = configPath
        if (!(await fs.exists(configPath))) {
            if (!(await fs.exists(configBackupPath))) {
                await configUpgrader(
                    path.join(__dirname, 'node_modules/wahtson/config-example.toml'),
                    configPath,
                )
            }
            await configUpgrader(configBackupPath, configPath)
        }

        const source = await fs.readFile(configPath, 'utf8')

        try {
            resolve(JSON5.parse(source))
        } catch (err) {
            reject()
            mainWindow.webContents.send('log', {
                level: 2,
                text: `Syntax error in config on line ${err.lineNumber} column ${err.columnNumber}`,
            })
        }
    })
}
