const { app, BrowserWindow, Tray, Notification, dialog, shell, nativeImage, Menu, screen, nativeTheme } = require('electron')
const path = require('path')
const fetch = require('cross-fetch');
const { ipcMain } = require('electron/main');
const Store = require('electron-store');
const fs = require("fs");
const version = require("./package.json").version;
const os = require("os");
const RPC = require("discord-rpc");
const { pipeline } = require('stream/promises');
const logger = require('electron-log');
const tar = require('tar');

const blueKnightRoot = path.join(`${app.getPath("appData") ?? "."}${path.sep}.blueknight`);
const profilespath = path.join(blueKnightRoot, `profiles`);

logger.transports.file.resolvePathFn = () => path.join(blueKnightRoot, 'logs.log');
logger.transports.file.level = "info";

const { Client } = require('minecraft-launcher-core');
const launcher = new Client();
const { Auth } = require("msmc");
const authManager = new Auth("select_account");
const { vanilla, fabric, forge, liner, quilt } = require('tomate-loaders');

const devMode = false;

let downlaodingJava = false;
let foundjava = false;

logger.info(" ");
logger.info("=== APP STARTED ===");
logger.info(" ");
if (devMode) {
    logger.info("[DEV] Started in DEVMODE");
    logger.info(" ");
}

const store = new Store();

// store.openInEditor();

let top = {};
let token;

const downloadFile = async (url, profile, filename) => {
    let profileModsPath = path.join(profilespath, profile, "mods");
    if (!fs.existsSync(profileModsPath)) fs.mkdirSync(profileModsPath);
    const destination = path.resolve(profileModsPath, filename);
    pipeline(
        (await fetch(url)).body,
        fs.createWriteStream(destination)
    );
}

async function downloadAndUnpackJava(targetDirectory) {
    const jdkUrl = 'https://download.oracle.com/java/17/archive/jdk-17.0.9_linux-x64_bin.tar.gz';

    if (!fs.existsSync(targetDirectory)) fs.mkdirSync(targetDirectory);
  
    try {
        const response = await fetch(jdkUrl);
        const buffer = await response.buffer();
  
        const filePath = path.join(app.getPath('userData'), 'jdk.tar.gz');
        fs.writeFileSync(filePath, buffer);
  
        // Unpack the downloaded tar.gz file
        await tar.x({
            file: filePath,
            C: targetDirectory,
        });
  
        logger.info('[JAVA] JDK downloaded and unpacked successfully.');
    } catch (error) {
        console.error('[JAVA] Error downloading and unpacking JDK:', error.message);
    }
}

async function downlaodJava() {
    logger.info("Download function initiated!");
    // logger.info("[JAVA] Downloading Java...")

    // downlaodingJava = true;
    // top.mainWindow.webContents.send("showWarnbox",  { boxid: "downloadingjava" });

    // await downloadAndUnpackJava(path.join(blueKnightRoot, "java"));
    // store.set("javaPath", path.join(blueKnightRoot, "java", "jdk-17.0.9", "bin", "java"));
    // refreshSettings();

    // top.mainWindow.webContents.send("showWarnbox",  { boxid: "downloadingjavasuc" });
    // downlaodingJava = false;

    // logger.info("[JAVA] Finished downloading Java!")
    return false;
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (top.mainWindow) {
            logger.info("[APP] Tried to start second instance.");
            top.mainWindow.show();
            if (top.mainWindow.isMinimized()) top.mainWindow.restore();
            top.mainWindow.focus();
        }
    });

    app.whenReady().then(async () => {
        logger.info("[APP] App ready!");

        if (process.platform === 'win32') {
            app.setAppUserModelId("BlueKnight Launcher");
        }

        const setJavaPath = store.get("javaPath");
        if (setJavaPath) {
            if (!fs.existsSync(setJavaPath)) {
                logger.info("[JAVA] Custom set path does not exist");
                foundjava = false;
                logger.info("[JAVA] Java not found. Opening modal after login.")
            } else {
                foundjava = true;
                logger.info("[JAVA] Using custom set java path: " + setJavaPath)
            }
        } else {
            require('find-java-home')(async (err, home) => {
                logger.info("[JAVA] Looking for installed java path...")
                if (err) return logger.error(err);

                if (!home) {
                    logger.info("[JAVA] Could not find java path")
                    foundjava = false;
                    logger.info("[JAVA] Java not found. Opening modal after login.")
                    return;
                }

                let javaPath;
                if (process.platform === "win32") javaPath = path.join(home, "bin", "javaw.exe");
                else javaPath = path.join(home, "bin", "java");

                if (!fs.existsSync(javaPath)) {
                    logger.info("[JAVA] Could not find java path")
                    foundjava = false;
                    logger.info("[JAVA] Java not found. Opening modal after login.")
                    return;
                }

                foundjava = true;
                logger.info("[JAVA] Found installed java!")
                store.set("javaPath", javaPath);
                logger.info("[JAVA] Java path: " + javaPath);
            });
        }

        logger.info("[APP] Java functions executed!");

        if (!fs.existsSync(blueKnightRoot)) fs.mkdirSync(blueKnightRoot);
        if (!fs.existsSync(profilespath)) fs.mkdirSync(profilespath);

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

        ipcMain.handle("openExternal", (event, args) => {
            if (args.url) {
                shell.openExternal(args.url);
                return;
            }
        });

        ipcMain.handle("setMaxMem", (event, value) => {
            store.set("maxMemMB", value);
        });

        ipcMain.handle("setSetting", (event, arg) => {
            if (arg.setting === undefined || arg.value === undefined) return;
            store.set(arg.setting, arg.value);
            logger.info(`[SETTINGS] Set setting "${arg.setting}" to "${arg.value}"`);
        });

        ipcMain.handle("initLogin", async (event, args) => {
            const lastPos = store.get('windowPosition');

            let loginWidth = 550;
            let loginHeight = 550;

            let loginX = lastPos ? (lastPos.x + ((lastPos.width / 2) - (loginWidth / 2))).toFixed(0) : undefined;
            let loginY = lastPos ? (lastPos.y + ((lastPos.height / 2) - (loginHeight / 2))).toFixed(0) : undefined;

            console.log("x: ", loginX);
            console.log("y: ", loginY)

            const xboxManager = await authManager.launch("electron", {
                title: "Microsoft Authentication",
                icon: __dirname + '/public/img/logo.ico',
                backgroundColor: "#1A1B1E",
                width: loginWidth,
                height: loginHeight,
                x: loginX,
                y: loginY,
            });

            console.log(xboxManager);
            token = await xboxManager.getMinecraft();
            let savabletoken = xboxManager.save();
            store.set("token", savabletoken);
            logger.info(`Logged in as ${token.profile.name}`);

            top.mainWindow.loadFile("public/main.html").then(() => {
                top.mainWindow.send("sendProfile", token.profile);
                top.mainWindow.webContents.send("sendVersion", version);
                top.mainWindow.webContents.send("sendMaxmemory", os.totalmem());
                refreshSettings();
                top.mainWindow.webContents.send("sendProfiles", {
                    profiles: store.get("profiles"),
                    selectedProfile: store.get("selectedProfile"),
                });

                if (!foundjava) {
                    top.mainWindow.webContents.send("showJavaModal", {});
                    logger.info("[JAVA] Sent JavaInstallModal!")
                }
            })
        });

        ipcMain.handle('launchMC', (event, arg) => {
            const selectedProfile = store.get("selectedProfile");
            launchMinecraft(selectedProfile.name ?? "profile1", selectedProfile.loader ?? "fabric", selectedProfile.version ?? "1.20.2");
        })

        ipcMain.handle('createProfile', async (event, data) => {
            if (!data.name || !data.loader || !data.version) return;

            let profilePath = path.join(profilespath, data.name);
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

            logger.info(`[PROFILES] Switched to ${data.name}`);
        });

        ipcMain.handle('openProfileFolder', (event, profileName) => {
            const myProfilePath = path.join(profilespath, profileName);
            if (!fs.existsSync(myProfilePath)) fs.mkdirSync(myProfilePath)
            shell.openPath(myProfilePath);
            logger.info("[PROFILES] Opened folder '" + myProfilePath + "'");
        });

        ipcMain.handle("openRootFolder", (event, data) => {
            logger.info("[PROFILES] Opened folder '" + blueKnightRoot + "'");
            shell.openPath(profilespath);
        });

        ipcMain.handle("downloadMod", (event, data) => {
            logger.info("[DOWNLOADS] Recieved Mod download request for " + data.filetoDownload.filename)
            downloadFile(data.filetoDownload.url, data.targetProfile, `${data.modid}_${data.filetoDownload.filename}`);
            logger.info("[DOWNLOADS] Finished downlaoding " + data.filetoDownload.filename);
            top.mainWindow.webContents.send("modDownloadResult", {
                result: "success",
            });

            // Delete old versions of installed mod
            const modsDirPath = path.join(profilespath, data.targetProfile, "mods")
            fs.readdirSync(path.resolve(modsDirPath)).forEach(file => {
                let nameSplit = file.split("_");
                if (!nameSplit || nameSplit[0].length !== 8) return;

                if (nameSplit[0] === data.modid && file !== data.filetoDownload.filename) {
                    fs.unlinkSync(path.resolve(modsDirPath, file));
                    logger.info("[DOWNLOADS] Removed old mod: " + data.targetProfile + "/" + file);
                }
            });
        });

        ipcMain.handle("installjava", (event, data) => {
            downlaodJava();
        });

        ipcMain.handle("getLang", (event, data) => {
            logger.info("[LANG] Requested lang refresh")
            let selectedLang = store.get("lang") ?? "en_US";

            if (selectedLang === "auto" && (app.getLocale() === "de" || app.getLocale() === "de_DE")) selectedLang = "de_DE";
            else if (selectedLang === "auto") selectedLang = "en_US";

            top.mainWindow.webContents.send("sendLang", {
                "selected": selectedLang,
                "en_US": require("./lang/en_US.json"),
                "de_DE": require("./lang/de_DE.json")
            });
        });

        logger.info("[STARTUP] Regitsered all ipc handler")

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

        let icon = process.platform === "win32" ? path.join(__dirname + '/public/img/logo.ico') : path.join(__dirname + '/public/img/logo256x256.png');

        const lastPos = store.get('windowPosition');

        top.mainWindow = new BrowserWindow({
            title: "BlueKnight Launcher",
            width: lastPos ? lastPos.width : 1200,
            height: lastPos ? lastPos.height : 800,
            minWidth: 750,
            minHeight: 500,
            x: lastPos ? lastPos.x : undefined,
            y: lastPos ? lastPos.y : undefined,
            center: true,
            frame: false,
            show: false,
            backgroundColor: "#1A1B1E",
            resizable: true,
            autoHideMenuBar: false,
            icon,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
            }
        });

        top.mainWindow.loadFile("public/login.html").then(() => {
            top.mainWindow.webContents.send("sendVersion", version);
            logger.info("[STARTUP] Loaded login file")
        })

        top.mainWindow.show();

        top.mainWindow.on('close', () => {
            const bounds = top.mainWindow.getBounds();
            store.set('windowPosition', bounds);
        });

        initDiscordRPC();
    });
}

function refreshSettings() {
    top.mainWindow.webContents.send("sendSettings", {
        maxMemMB: store.get("maxMemMB") || Math.floor((os.totalmem() / 1000000) / 2),
        minimizeOnStart: store.get("minimizeOnStart"),
        hideDiscordRPC: store.get("hideDiscordRPC"),
        javaPath: store.get("javaPath"),
    });
}

let launchMinecraft = async (profileName, loader, version) => {
    if (!token) return;

    if (downlaodingJava) {
        top.mainWindow.webContents.send("showWarnbox",  { boxid: "downloadingjava" });
        top.mainWindow.webContents.send("sendMCstarted");
        return;
    }

    let rootPath = path.join(profilespath, profileName);

    logger.info("Root Path: ")
    logger.info(rootPath)

    let launchConfig;
    if (loader === "fabric") {
        logger.info("[LAUNCHER] Getting Fabric config...")
        launchConfig = await fabric.getMCLCLaunchConfig({
            gameVersion: version,
            rootPath,
        });
        logger.info("[LAUNCHER] Finished getting Fabric config!")

    } else if (loader === "forge") {
        logger.info("[LAUNCHER] Starting Forge...")
        launchConfig = await forge.getMCLCLaunchConfig({
            gameVersion: version,
            rootPath,
        });
        logger.info("[LAUNCHER] Finished getting Forge config!")
    } else {
        logger.info("[LAUNCHER] Starting Vanilla...")
        launchConfig = await vanilla.getMCLCLaunchConfig({
            gameVersion: version,
            rootPath,
        });
        logger.info("[LAUNCHER] Finished getting Vanilla config!")
    }

    let opts = {
        ...launchConfig,
        authorization: token.mclc(),
        overrides: {
            detached: false,
        },
        memory: {
            max: (store.get("maxMemMB") || "6000") + "M",
            min: "2G"
        },
        javaPath: store.get("javaPath")
    }

    logger.info("[LAUNCHER] Using javapath: " + store.get("javaPath"))

    logger.info("[LAUNCHER] Launching game...")
    launcher.launch(opts);
    logger.info("[LAUNCHER] Launched game!")
};

if (devMode) launcher.on('debug', (e) => logger.info("[LAUNCHER-DEBUG] " + e));

launcher.on('data', liner(line => {
    if (line.match(/\[Render thread\/INFO\]: Setting user:/g) || line.match(/\[MCLC\]: Launching with arguments/)) {
        top.mainWindow.webContents.send("sendMCstarted");
        if (store.get("minimizeOnStart")) top.mainWindow.hide();
    }

    logger.info("[LAUNCHER-DATA] " + line);
}));

launcher.on("progress", (e) => {
    logger.info("[LAUNCHER-PROGRESS]:")
    logger.info(e)
    top.mainWindow.webContents.send("sendDownloadProgress", e);
});

launcher.on('close', (e) => {
    logger.info("[LAUNCHER] Launcher closed!");
    top.mainWindow.webContents.send("sendMCstarted");
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

    if (!devMode) Menu.setApplicationMenu(builtmenu);

    top.tray.on('click', function (e) {
        if (top.mainWindow.isVisible()) {
            top.mainWindow.hide();
        } else {
            top.mainWindow.show();
        }
    });

    logger.info("[STARTUP] Set up tray menu")
}

function initDiscordRPC() {
    let client = new RPC.Client({ transport: "ipc" });

    let loginSuccess = true;

    try {
        client.login({ clientId: "1178319000212611123" }).then(() => {
            logger.info("[DiscordRCP] Login successfull!");
            logger.info("[DiscordRCP] Projecting to: " + client.user.username);
        })
    } catch (err) {
        loginSuccess = false;
        logger.error(err);
    }

    client.on("ready", () => {
        setInterval(() => {
            if (!loginSuccess || store.get("hideDiscordRPC") || !top.mainWindow.isVisible()) return;
            logger.info("[DiscordRCP] Updated DiscordRCP");

            let selectedProfile = store.get("selectedProfile");

            client.setActivity({
                state: selectedProfile.name,
                details: `${selectedProfile.loader} ${selectedProfile.version}`,
                largeImageKey: "logo"
            })
        }, 20 * 1000)
    });
}