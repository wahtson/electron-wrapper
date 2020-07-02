const electron = require('electron')
const os = require('os')
const autoUpdater = electron.autoUpdater
const appVersion = require('../package.json').version

let updateFeed = ''
let initialized = false
const platform = `${os.platform()}_${os.arch()}`
const serverURL = 'https://wahtson-electron-update.now.sh'

if (os.platform() === 'darwin') {
  updateFeed = `${serverURL}/update/${platform}/${appVersion}`
} else if (os.platform() === 'win32') {
  updateFeed = `${serverURL}/update/win32/${appVersion}`
}

function init(mainWindow) {
  mainWindow.webContents.send('console', `App version: ${appVersion}`)
  mainWindow.webContents.send('message', { msg: `🖥 App version: ${appVersion}` })

  if (initialized || !updateFeed || process.env.NODE_ENV === 'development') { return }

  initialized = true

  autoUpdater.setFeedURL(updateFeed)

  autoUpdater.once('update-downloaded', (ev, err) => {
    mainWindow.webContents.send('update', { name: releaseName, notes: releaseNotes })
  })

  autoUpdater.checkForUpdates()

  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 60000)
}

module.exports = {
  init
}