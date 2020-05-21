const { ipcRenderer } = require("electron")


let terminal = document.getElementById("terminal")
const addToTerminal = (data) => {
    const isScrolling = (window.innerHeight + window.scrollY) >= document.body.offsetHeight

    terminal.innerHTML += data;
    
    if(isScrolling) scrollToBottom();
    else document.getElementById("scrollToBottom").removeAttribute("hidden")
}

ipcRenderer.on("version", function(event, data) {
    document.title = `WAHtson ${data}`
    terminal.innerHTML += (`<p big>WAHtson ${data}</p>`)
})

ipcRenderer.on("event", function (event, data) {
    if(data.type == "DEBUG")
        addToTerminal(`<p grey>${data.text}</p>`)

    if(data.type == "INFO")
        addToTerminal(`<p cyan>${data.text}</p>`)
        
    if(data.type == "ACTION") {
        console.log(data.source);
        addToTerminal(`${data.index != 1 ? '<span white> | </span>' : ''}<span ${data.skipped ? 'grey' : 'magenta'} onclick="toggleActionDetails(this)">${data.index}. ${data.data.type}</span>`)
        addToTerminal(`<pre class="actionDetails" hidden="true" indent2>${JSON.stringify(data.data, null, 2)}</pre>`)
    }

    if(data.type == "STATUS") 
        addToTerminal(`<p green>${data.text}</p>`)   

    if(data.type == "WARN")
        addToTerminal(`<p yellow>${data.text}</p>`)
        
    if(data.type == "ERROR")
        addToTerminal(`<p red>${data.text}</p>`)
    
    if(data.type == "FATAL")
        addToTerminal(`<p red>${data.text}</p>`)
});

const scrollToBottom = () => {
    window.scrollTo(0,terminal.scrollHeight)
    document.getElementById("scrollToBottom").setAttribute("hidden", "true")
}


const toggleActionDetails = (elem) => {
    let isHidden = elem.nextElementSibling.getAttribute("hidden");

    document.querySelectorAll("pre.actionDetails").forEach(pre => {
        pre.setAttribute("hidden", "true")
    })
    document.querySelectorAll("*[expanded]").forEach(action => {
        action.removeAttribute("expanded")
    })

    if(isHidden) {
        elem.setAttribute("expanded", "true")
        elem.nextElementSibling.removeAttribute("hidden")
    }

}