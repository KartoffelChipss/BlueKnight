const { app, BrowserWindow, Tray, Notification, dialog, nativeImage, Menu, shell, screen, nativeTheme } = require('electron')
const path = require('path')
const fetch = require('cross-fetch');
const { ipcMain } = require('electron/main');
const Store = require('electron-store');
const fs = require("fs");
const version = require("./package.json").version;
const os = require("os");

const { Client } = require('minecraft-launcher-core');
const launcher = new Client();
const { Auth } = require("msmc");
const authManager = new Auth("select_account");
const { vanilla, fabric, liner } = require('tomate-loaders');

const store = new Store();

let top = {};
let token;

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
            app.setAppUserModelId("BlueKnight Launcher");
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

        ipcMain.handle("setMaxMem", (event, value) => {
            store.set("maxMemMB", value);
        });

        ipcMain.handle("setSetting", (event, arg) => {
            if (arg.setting === undefined || arg.value === undefined) return;
            store.set(arg.setting, arg.value);
        });

        ipcMain.handle("initLogin", async (event, args) => {
            const xboxManager = await authManager.launch("electron", {
                title: "Microsoft Authentication",
                icon: __dirname + '/public/img/logo.ico',
                backgroundColor: "#1A1B1E",
            });
            token = await xboxManager.getMinecraft();
            let savabletoken = xboxManager.save();
            store.set("token", savabletoken);
            console.log(`Logged in as ${token.profile.name}`);

            top.mainWindow.loadFile("public/main.html").then(() => {
                top.mainWindow.send("sendProfile", token.profile);
                top.mainWindow.webContents.send("sendVersion", version);
                top.mainWindow.webContents.send("sendMaxmemory", os.totalmem());
                top.mainWindow.webContents.send("sendSettings", {
                    maxMemMB: store.get("maxMemMB") || Math.floor((os.totalmem() / 1000000) / 2),
                    minimizeOnStart: store.get("minimizeOnStart"),
                    showDiscordRP: store.get("showDiscordRP"),
                });
            })
        });

        ipcMain.handle('launchMC', (event, arg) => {
            launchMinecraft("profile4");
        })

        initTray();

        const screenHeight = screen.getPrimaryDisplay().workAreaSize.height;
        const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;

        let windowWidth = screenWidth * .6;
        let windowHeight = screenHeight * .75;

        top.mainWindow = new BrowserWindow({
            title: "BlueKnight Launcher",
            width: 1200,
            height: 800,
            minWidth: 400,
            minHeight: 300,
            center: true,
            frame: false,
            show: false,
            backgroundColor: "#1A1B1E",
            resizable: true,
            autoHideMenuBar: false,
            icon: __dirname + '/public/img/logo.ico',
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
            }
        });

        top.mainWindow.loadFile("public/login.html").then(() => {
            top.mainWindow.webContents.send("sendVersion", version);
        })

        top.mainWindow.show();
    });
}

let launchMinecraft = async (profileName) => {
    if (!token) return;

    let rootPath = `${app.getPath("appData") ?? "."}${path.sep}.blueknight${path.sep}${profileName}`;

    console.log(rootPath)

    const launchConfig = await fabric.getMCLCLaunchConfig({
        gameVersion: '1.20.2',
        rootPath,
    });

    let opts = {
        ...launchConfig,
        authorization: token.mclc(),
        memory: {
            max: (store.get("maxMemMB") || "6000") + "M",
            min: "2G"
        }
    }

    launcher.launch(opts);
};

launcher.on('debug', (e) => console.log(e));
launcher.on('data', liner(line => {
    if (line.match(/\[Render thread\/INFO\]: Setting user:/g)) {
        top.mainWindow.webContents.send("sendMCstarted");
        if (store.get("minimizeOnStart")) top.mainWindow.hide();
    }
    console.log(line);
}));

launcher.on("progress", (e) => {
    console.log(e)
    top.mainWindow.webContents.send("sendDownloadProgress", e);
});

launcher.on('close', (e) => {
    console.log("Launcher closed!");
    top.mainWindow.show();
})

function initTray() {
    let iconColor = "black";
    if (nativeTheme.shouldUseDarkColors) {
        iconColor = "white";
    }

    top.tray = null;

    let preferredIconType = "ico";

    if (process.platform === 'darwin' || process.platform === "linux") {
        preferredIconType = "png";
    }

    top.tray = new Tray(path.join(__dirname + `/public/img/logo.${preferredIconType}`));

    let menu = [
        {
            label: "Hilfe",
            icon: nativeImage.createFromPath(__dirname + `/public/img/icons/${iconColor}/help.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                shell.openExternal("//strassburger.org/discord");
            }
        },
        {
            type: "separator"
        },
        {
            label: "Startseite",
            icon: nativeImage.createFromPath(__dirname + `/public/img/icons/${iconColor}/home.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                top.mainWindow.show();
                top.mainWindow.webContents.send("openSection", "main");
            },
        },
        {
            label: "Einstellungen",
            icon: nativeImage.createFromPath(__dirname + `/public/img/icons/${iconColor}/settings.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                top.mainWindow.show();
                top.mainWindow.webContents.send("openSection", "settings");
            }
        },
        {
            type: "separator"
        },
        {
            label: "Beenden",
            icon: nativeImage.createFromPath(__dirname + `/public/img/icons/${iconColor}/off.${preferredIconType}`).resize({ width: 16 }),
            role: "quit"
        },
    ]

    const builtmenu = Menu.buildFromTemplate(menu);
    top.tray.setContextMenu(builtmenu);

    top.tray.setToolTip("Instantradio");

    // !!! UNCOMMENT FOR PRODUCTION !!! //

    //Menu.setApplicationMenu(builtmenu);

    // !!! UNCOMMENT FOR PRODUCTION !!! //
    
    // YOU FUCKING PRICK WHY DO YOU ALWAYS FORGET TO UNCOMMENT THIS SHIT!

    top.tray.on('click', function (e) {
        if (top.mainWindow.isVisible()) {
            top.mainWindow.hide();
        } else {
            top.mainWindow.show();
        }
    });
}