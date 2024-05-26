const { BrowserWindow } = require("electron");
const Logger = require("electron-log");
const path = require("path");

class AboutWindowManager {

    show() {
        Logger.info("[About] Showing about window!");
        this.window = this.createAboutWindow();
        this.window.loadFile("src/public/about.html");
        this.window.show();
    }

    /**
     * Create the about window
     * @returns {BrowserWindow} - The about window
     */
    createAboutWindow() {
        return new BrowserWindow({
            title: "BlueKnight Launcher",
            minWidth: 750,
            minHeight: 500,
            center: true,
            frame: true,
            show: false,
            backgroundColor: "#1A1B1E",
            resizable: true,
            autoHideMenuBar: false,
            icon: path.resolve(process.platform === "win32" ? path.join(__dirname, "..", "/public/img/logo.ico") : path.join(__dirname, "..", "/public/img/logo256x256.png")),
            webPreferences: {
                preload: path.resolve(path.join(__dirname, "..", "/preload.js")),
                nodeIntegration: false,
                contextIsolation: true,
            },
        });
    }
}

module.exports = AboutWindowManager;