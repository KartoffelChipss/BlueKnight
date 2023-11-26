const { app, BrowserWindow, Tray, Notification, dialog, shell, nativeImage, Menu, screen, nativeTheme } = require('electron')
const path = require('path')
const fetch = require('cross-fetch');
const { ipcMain } = require('electron/main');
const Store = require('electron-store');
const fs = require("fs");
const version = require("./package.json").version;
const os = require("os");
const RPC = require("discord-rpc");

const { Client } = require('minecraft-launcher-core');
const launcher = new Client();
const { Auth } = require("msmc");
const authManager = new Auth("select_account");
const { vanilla, fabric, forge, liner } = require('tomate-loaders');

const store = new Store();

store.openInEditor();

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
                    hideDiscordRPC: store.get("hideDiscordRPC"),
                });
                top.mainWindow.webContents.send("sendProfiles", {
                    profiles: store.get("profiles"),
                    selectedProfile: store.get("selectedProfile"),
                });
            })
        });

        ipcMain.handle('launchMC', (event, arg) => {
            const selectedProfile = store.get("selectedProfile");
            launchMinecraft(selectedProfile.name ?? "profile1", selectedProfile.loader ?? "fabric", selectedProfile.version ?? "1.20.2");
        })

        ipcMain.handle('createProfile', async (event, data) => {
            if (!data.name || !data.loader || !data.version) return;

            let profilePath = `${app.getPath("appData") ?? "."}${path.sep}.blueknight${path.sep}${data.name}`;
            if (!fs.existsSync(profilePath)) {
                fs.mkdirSync(profilePath);
            }

            let prevProfiles = store.get("profiles");
            prevProfiles.push({
                name: data.name,
                loader: data.loader,
                version: data.version,
            });
            store.set("profiles", prevProfiles);

            top.mainWindow.webContents.send("sendProfiles", {
                profiles: store.get("profiles"),
                selectedProfile: store.get("selectedProfile"),
            });
        });

        ipcMain.handle('selectProfile', (event, data) => {
            if (!data.name || !data.loader || !data.version) return;

            store.set("selectedProfile", {
                name: data.name,
                loader: data.loader,
                version: data.version,
            });

            top.mainWindow.webContents.send("sendProfiles", {
                profiles: store.get("profiles"),
                selectedProfile: store.get("selectedProfile"),
            });

            console.log(`[PROFILES] Switched to ${data.name}`);
        });

        ipcMain.handle('openProfileFolder', (event, profileName) => {
            console.log("[PROFILES] Opened folder '" + `${app.getPath("appData") ?? "."}${path.sep}.blueknight${path.sep}${profileName}` + "'");
            shell.openPath(`${app.getPath("appData") ?? "."}${path.sep}.blueknight${path.sep}${profileName}`);
        })

        if (!store.get("profiles") || store.get("profiles").length <= 0) {
            store.set("profiles", [{
                name: "Fabric 1.20.2",
                loader: "fabric",
                version: "1.20.2",
            }]);
            store.set("selectedProfile", {
                name: "Fabric 1.20.2",
                loader: "fabric",
                version: "1.20.2",
            });
        }

        initTray();

        initDiscordRPC();

        top.mainWindow = new BrowserWindow({
            title: "BlueKnight Launcher",
            width: 1200,
            height: 800,
            minWidth: 750,
            minHeight: 500,
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

let launchMinecraft = async (profileName, loader, version) => {
    if (!token) return;

    let rootPath = `${app.getPath("appData") ?? "."}${path.sep}.blueknight${path.sep}${profileName}`;

    console.log(rootPath)

    let launchConfig;
    if (loader === "fabric") {
        console.log("[LAUNCHER] Started Fabric")
        launchConfig = await fabric.getMCLCLaunchConfig({
            gameVersion: version,
            rootPath,
        });
    } else if (loader === "forge") {
        console.log("[LAUNCHER] Started Forge")
        launchConfig = await forge.getMCLCLaunchConfig({
            gameVersion: version,
            rootPath,
        });
    } else {
        console.log("[LAUNCHER] Started Vanilla")
        launchConfig = await vanilla.getMCLCLaunchConfig({
            gameVersion: version,
            rootPath,
        });
    }

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
                shell.openExternal("https://strassburger.org/discord");
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

function initDiscordRPC() {
    let client = new RPC.Client({ transport: "ipc" });

    let loginSuccess = true;

    try {
        client.login({ clientId: "1178319000212611123" }).then(() => {
            console.log("[DiscordRCP] Login successfull!");
            console.log("[DiscordRCP] Projecting to: " + client.user.username);
        })
    } catch (err) {
        loginSuccess = false;
        console.log(err);
    }

    client.on("ready", () => {
        setInterval(() => {
            if (!loginSuccess || store.get("hideDiscordRPC") || !top.mainWindow.isVisible()) return;
            console.log("[DiscordRCP] Updated DiscordRCP");

            let selectedProfile = store.get("selectedProfile");

            client.setActivity({
                state: selectedProfile.name,
                details: `${selectedProfile.loader} ${selectedProfile.version}`,
                largeImageKey: "logo"
            })
        }, 20 * 1000)
    });
}