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
            let validChannels = [
                "minimize",
                "togglemaxwindow",
                "closeWindow",
                "launchMC",
                "initLogin",
                "setMaxMem",
                "getTotalMem",
                "setSetting",
                "createProfile",
                "selectProfile",
                "openProfileFolder",
                "openRootFolder",
                "downloadMod",
                "downloadAddon",
                "searchMods",
                "openExternal",
                "installjava",
                "getLang",
                "updateAccounts",
                "addAccount",
                "removeAccount",
                "selectAccount",
                "getSelectedProfile",
                "getProfiles",
                "getProfileData",
                "getProfileAddons",
                "deleteProfileMod",
                "getVersion",
                "getModData",
                "getExtensiveModData",
                "deleteProfile",
            ];
            if (validChannels.includes(channel)) {
                return ipcRenderer.invoke(channel, data);
            }
        }
    }
);

contextBridge.exposeInMainWorld(
    'bridge', {
        sendProfile: (message) => {
            ipcRenderer.on("sendProfile", message);
        },
        updateAccounts: (message) => {
            ipcRenderer.on("updateAccounts", message);
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
        modDownloadResult: (message) => {
            ipcRenderer.on("modDownloadResult", message);
        },
        showWarnbox: (message) => {
            ipcRenderer.on("showWarnbox", message);
        },
        showJavaModal: (message) => {
            ipcRenderer.on("showJavaModal", message);
        },
        closeJavaModal: (message) => {
            ipcRenderer.on("closeJavaModal", message);
        },
        sendLang: (message) => {
            ipcRenderer.on("sendLang", message);
        }
    }
);