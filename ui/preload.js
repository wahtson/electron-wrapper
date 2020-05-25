const loadDate = Date.now()

const { ipcRenderer } = require('electron')

document.addEventListener('DOMContentLoaded', () => {
    let terminal = document.querySelector('#terminal')
    const addToTerminal = data => {
        const isScrolling = window.innerHeight + window.scrollY >= document.body.offsetHeight

        terminal.innerHTML += data

        if (isScrolling) scrollToBottom()
        else document.querySelector('#scrollToBottom').removeAttribute('hidden')
    }
    const addToTerminalActionChain = data => {
        let time = Date.now()

        console.log(data)

        let html = `${data.index != 0 ? '<span white> | </span>' : ''}<span ${
            data.skipped ? 'grey' : 'magenta'
        } onclick="toggleActionDetails(this)" source="${data.source}" stamp="${time}">${
            data.index + 1
        }. ${data.action.type}</span>`

        terminal.querySelector(
            `pre[messageid="${data.source}"][length="${data.index}"][event="${data.event}"]`,
        ).innerHTML += html
        terminal
            .querySelector(
                `pre[messageid="${data.source}"][length="${data.index}"][event="${data.event}"]`,
            )
            .setAttribute('length', data.index + 1)

        let detailsHtml = `<pre class="actionDetails" hidden="true" indent2 source="${
            data.source
        }" stamp="${time}">Event: ${data.event}<br>${JSON.stringify(data.action, null, 2)}</pre>`

        terminal.querySelector(
            `div[messageid="${data.source}"][length="${data.index}"][event="${data.event}"]`,
        ).innerHTML += detailsHtml
        terminal
            .querySelector(
                `div[messageid="${data.source}"][length="${data.index}"][event="${data.event}"]`,
            )
            .setAttribute('length', data.index + 1)

        const isScrolling = window.innerHeight + window.scrollY >= document.body.offsetHeight
        if (isScrolling) scrollToBottom()
        else document.querySelector('#scrollToBottom').removeAttribute('hidden')
    }

    ipcRenderer.on('ready', function (event, data) {
        addToTerminal(`<pre big>${data.text}</pre>`)
        addToTerminal(`<pre grey>Loaded in ${(Date.now() - loadDate) / 1000}s</pre>`)
        document.title = data.text
    })

    ipcRenderer.on('log', function (event, data) {
        if (data.level == '-1') addToTerminal(`<pre grey>${data.text}</pre>`)

        if (data.level == '0') addToTerminal(`<pre cyan>${data.text}</pre>`)

        if (data.level == '1') addToTerminal(`<pre yellow>${data.text}</pre>`)

        if (data.level == '2') addToTerminal(`<pre red>${data.text}</pre>`)
    })

    ipcRenderer.on('action', function (event, data) {
        if (data.index == 0)
            addToTerminal(
                `<pre messageid="${data.source}" event="${data.event}" length="0"></pre><div messageid="${data.source}" event="${data.event}" length="0"></div>`,
            )

        addToTerminalActionChain(data)
    })

    const scrollToBottom = () => {
        window.scrollTo(0, terminal.scrollHeight)
        document.querySelector('#scrollToBottom').setAttribute('hidden', 'true')
    }

    window.toggleActionDetails = elem => {
        let details =
            elem.parentElement.nextElementSibling.children[Number(elem.getAttribute('index'))]

        let isExpanded = elem.getAttribute('expanded')

        document.querySelectorAll('pre.actionDetails').forEach(pre => {
            pre.setAttribute('hidden', 'true')
        })
        document.querySelectorAll('*[expanded]').forEach(action => {
            action.removeAttribute('expanded')
        })

        if (!isExpanded) {
            elem.setAttribute('expanded', 'true')
            details.removeAttribute('hidden')
        }
    }

    var showdown = require('showdown'),
        converter = new showdown.Converter()

    ipcRenderer.on('update', function (event, data) {
        document.querySelector('#updateModal > h1').innerText = 'Wahtson Electron v' + data.name
        document.querySelector('#updateModal > div').innerHTML = converter.makeHtml(data.notes)

        document.querySelector('#updateButton').removeAttribute('hidden')
    })

    window.updateModal = () => {
        document.querySelector('#updateModal').removeAttribute('hidden')
    }
    window.quitAndInstall = () => {
        ipcRenderer.send('quitAndInstallRequest')
    }
})
