const { app, BrowserWindow, Tray, Notification, dialog, nativeImage, Menu, shell, screen, nativeTheme } = require('electron')
const path = require('path')
const fetch = require('cross-fetch');
const { ipcMain } = require('electron/main');
const Store = require('electron-store');
const fs = require("fs");
const version = require("./package.json").version;

const { Client } = require('minecraft-launcher-core');
const launcher = new Client();
const { Auth } = require("msmc");
const { vanilla, fabric, liner } = require('tomate-loaders');

const store = new Store();

let top = {};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (top.mainWindow) {
            top.mainWindow.show();
            if (top.mainWindow.isMinimized()) top.mainWindow.restore();
            top.mainWindow.focus();
        }
    });

    app.whenReady().then(async () => {
        if (process.platform === 'win32') {
            app.setAppUserModelId("Kartoffel Launcher");
        }

        ipcMain.handle('minimize', (event, arg) => {
            top.mainWindow.isMinimized() ? top.mainWindow.restore() : top.mainWindow.minimize();
        });

        ipcMain.handle('togglemaxwindow', (event, arg) => {
            top.mainWindow.isMaximized() ? top.mainWindow.unmaximize() : top.mainWindow.maximize();
            store.set("lastMaximized", top.mainWindow.isMaximized());
        });

        ipcMain.handle('closeWindow', (event, arg) => {
            if (process.platform === 'darwin') return app.quit();

            app.quit();
        });

        ipcMain.handle('launchMC', (event, arg) => {
            launchMinecraft(token, "profile2");
        })

        const screenHeight = screen.getPrimaryDisplay().workAreaSize.height;
        const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;

        let windowWidth = screenWidth * .6;
        let windowHeight = screenHeight * .75;

        top.mainWindow = new BrowserWindow({
            title: "Kartoffel Launcher",
            width: windowWidth,
            height: windowHeight,
            minWidth: screenWidth * .35,
            minHeight: screenHeight * .35,
            center: true,
            frame: false,
            show: false,
            backgroundColor: "#1A1B1E",
            resizable: true,
            autoHideMenuBar: false,
            //icon: __dirname + '/public/img/logo.ico',
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
            }
        });

        top.mainWindow.loadFile("public/main.html").then(() => {
            top.mainWindow.webContents.send("sendVersion", version);
        })

        const authManager = new Auth("select_account");
        const xboxManager = await authManager.launch("electron");
        const token = await xboxManager.getMinecraft();
        console.log(`Logged in as ${token.profile.name}`);

        top.mainWindow.send("sendProfile", token.profile);

        top.mainWindow.show();
    });
}

let launchMinecraft = async (token, profileName) => {
    let rootPath = `${app.getPath("appData") ?? "."}${path.sep}.kartoffellauncher${path.sep}${profileName}`;

    console.log(rootPath)

    const launchConfig = await fabric.getMCLCLaunchConfig({
        gameVersion: '1.20.2',
        rootPath,
    });

    let opts = {
        ...launchConfig,
        authorization: token.mclc(),
        memory: {
            max: "6G",
            min: "4G"
        }
    }

    launcher.launch(opts);
};

launcher.on('debug', (e) => console.log(e));
launcher.on('data', liner(console.log));
launcher.on("progress", (e) => console.log(e));//{ type: 'assets', task: 3606, total: 3616 }
launcher.on('close', (e) => {
    console.log("Launcher closed!")
})