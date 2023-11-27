const {
    contextBridge,
    ipcRenderer
} = require("electron");

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }
  
    for (const type of ['chrome', 'node', 'electron']) {
      replaceText(`${type}-version`, process.versions[type])
    }
})

contextBridge.exposeInMainWorld(
    "api", {
        invoke: (channel, data) => {
            let validChannels = ["minimize", "togglemaxwindow", "closeWindow", "launchMC", "initLogin", "setMaxMem", "setSetting", "createProfile", "selectProfile", "openProfileFolder", "openRootFolder"];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, data);
            }
        }
    }
);

contextBridge.exposeInMainWorld(
    'bridge', {
        // From main to render
        sendVersion: (message) => {
            ipcRenderer.on('sendVersion', message);
        },
        sendProfile: (message) => {
            ipcRenderer.on("sendProfile", message);
        },
        sendDownloadProgress: (message) => {
            ipcRenderer.on("sendDownloadProgress", message);
        },
        sendMCstarted: (message) => {
            ipcRenderer.on("sendMCstarted", message);
        },
        sendMaxmemory: (message) => {
            ipcRenderer.on("sendMaxmemory", message);
        },
        sendSettings: (message) => {
            ipcRenderer.on("sendSettings", message);
        },
        openSection: (message) => {
            ipcRenderer.on("openSection", message);
        },
        sendProfiles: (message) => {
            ipcRenderer.on("sendProfiles", message);
        },
    }
);