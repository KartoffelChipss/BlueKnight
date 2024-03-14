const { app, BrowserWindow, shell, nativeImage } = require("electron");
const path = require("path");
const fetch = require("cross-fetch");
const { ipcMain } = require("electron/main");
const Store = require("electron-store");
const fs = require("fs");
const os = require("os");
const logger = require("electron-log");
const trayManager = require("./functions/trayManager.js");
const discordRPCManager = require("./functions/discordRPCManager.js");
const { blueKnightRoot, profilespath, downloadFile, checkForJava } = require("./functions/util.js");

logger.transports.file.resolvePathFn = () => path.join(blueKnightRoot, "logs.log");
logger.transports.file.level = "info";

const { AccountManager } = require("./functions/AccountManager.js");
let accountManager = new AccountManager();

const MinecraftManager = require("./functions/MinecraftManager.js");
let minecraftManager = new MinecraftManager();

const devMode = process.env.NODE_ENV === 'development';

let foundjava = false;

let startTimestamp = new Date();

logger.info(" ");
logger.info("=== APP STARTED ===");
logger.info(" ");
if (devMode) {
    logger.info("[DEV] Started in DEVMODE");
    logger.info(" ");
}

const store = new Store();

if (devMode) store.openInEditor();

let top = {};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on("second-instance", (event, commandLine, workingDirectory) => {
        if (top.mainWindow) {
            logger.info("[APP] Tried to start second instance.");
            top.mainWindow.show();
            if (top.mainWindow.isMinimized()) top.mainWindow.restore();
            top.mainWindow.focus();
        }
    });

    app.whenReady().then(async () => {
        logger.info("[APP] App ready!");

        if (process.platform === "win32") {
            app.setAppUserModelId("BlueKnight Launcher");
        }

        if (process.platform === "darwin") {
            app.dock.setIcon(nativeImage.createFromPath(path.join(__dirname, "public/img/logo256x256.png")));
        }

        foundjava = checkForJava();

        if (!fs.existsSync(blueKnightRoot)) fs.mkdirSync(blueKnightRoot);
        if (!fs.existsSync(profilespath)) fs.mkdirSync(profilespath);

        ipcMain.handle("minimize", (event, arg) => {
            top.mainWindow.isMinimized() ? top.mainWindow.restore() : top.mainWindow.minimize();
        });

        ipcMain.handle("togglemaxwindow", (event, arg) => {
            top.mainWindow.isMaximized() ? top.mainWindow.unmaximize() : top.mainWindow.maximize();
            store.set("lastMaximized", top.mainWindow.isMaximized());
        });

        ipcMain.handle("closeWindow", (event, arg) => {
            if (process.platform === "darwin") return app.quit();

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
            await accountManager.init();
            proceedToMain();
        });

        ipcMain.handle("addAccount", async (event, args) => {
            if (accountManager.getAccounts().length >= 5) {
                top.mainWindow.webContents.send("showWarnbox", { boxid: "maxaccounts" });
                return;
            }
            console.log("[!!!] Can add new account")
            accountManager.loginWithNewAccount(top.mainWindow)
                .then((account) => {
                    // console.log("[!!!] Added new account")
                    top.mainWindow.webContents.send("updateAccounts", accountManager.getUpdateData());
                })
                .catch((e) => {
                    // console.log("[!!!] Error adding new account")
                    logger.error("[ACCOUNTS] Error adding new account!");
                    logger.error(e);
                    if (e.ts && e.ts === "error.auth.minecraft.profile") top.mainWindow.webContents.send("showWarnbox", { boxid: "nomcprofile" });
                });
        });

        ipcMain.handle("updateAccounts", (event, args) => {
            top.mainWindow.webContents.send("updateAccounts", accountManager.getUpdateData());
        });

        ipcMain.handle("removeAccount", async (event, accountID) => {
            await accountManager.removeAccount(accountID, top.mainWindow);
            top.mainWindow.webContents.send("updateAccounts", accountManager.getUpdateData());
        });

        ipcMain.handle("selectAccount", (event, accountID) => {
            accountManager.selectAccount(accountID, top.mainWindow);
            top.mainWindow.webContents.send("updateAccounts", accountManager.getUpdateData());
        });

        ipcMain.handle("launchMC", (event, arg) => {
            const selectedProfile = store.get("selectedProfile");
            minecraftManager.launch(selectedProfile.name ?? "profile1", selectedProfile.loader ?? "fabric", selectedProfile.version ?? "1.20.4", accountManager.getActiveAccount())
                .catch((err) => {
                    logger.error("[LAUNCHER] ", err);
                });
        });

        ipcMain.handle("getSelectedProfileMods", async (event, arg) => {
            const selectedProfile = store.get("selectedProfile");
            const profileModsPath = path.join(profilespath, selectedProfile.name, "mods");
            const mods = fs.readdirSync(path.resolve(profileModsPath));
            mods = mods.map(async (mod) => {
                if (arg.idonly) return mod.split("_")[0];

                const res = await fetch(`https://api.modrinth.com/api/v2/project/${mod.split("_")[0]}`);
                const data = await res.json();
                return {
                    id: mod.split("_")[0],
                    mod: data,
                };
            });

            top.mainWindow.webContents.send("sendSelectedProfileMods", mods);
        });

        ipcMain.handle("createProfile", async (event, data) => {
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

        ipcMain.handle("getProfiles", (event, data) => {
            top.mainWindow.webContents.send("sendProfiles", {
                profiles: store.get("profiles"),
                selectedProfile: store.get("selectedProfile"),
            });
        });

        ipcMain.handle("selectProfile", (event, data) => {
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

        ipcMain.handle("openProfileFolder", (event, profileName) => {
            const myProfilePath = path.join(profilespath, profileName);
            if (!fs.existsSync(myProfilePath)) fs.mkdirSync(myProfilePath);
            shell.openPath(myProfilePath);
            logger.info("[PROFILES] Opened folder '" + myProfilePath + "'");
        });

        ipcMain.handle("openRootFolder", (event, data) => {
            logger.info("[PROFILES] Opened folder '" + blueKnightRoot + "'");
            shell.openPath(profilespath);
        });

        ipcMain.handle("downloadMod", (event, data) => {
            logger.info("[DOWNLOADS] Recieved Mod download request for " + data.filetoDownload.filename);
            downloadFile(data.filetoDownload.url, data.targetProfile, `${data.modid}_${data.filetoDownload.filename}`);
            logger.info("[DOWNLOADS] Finished downlaoding " + data.filetoDownload.filename);
            top.mainWindow.webContents.send("modDownloadResult", {
                result: "success",
            });

            // Delete old versions of installed mod
            const modsDirPath = path.join(profilespath, data.targetProfile, "mods");
            fs.readdirSync(path.resolve(modsDirPath)).forEach((file) => {
                let nameSplit = file.split("_");
                if (!nameSplit || nameSplit[0].length !== 8) return;

                if (nameSplit[0] === data.modid && file !== data.filetoDownload.filename) {
                    fs.unlinkSync(path.resolve(modsDirPath, file));
                    logger.info("[DOWNLOADS] Removed old mod: " + data.targetProfile + "/" + file);
                }
            });
        });

        ipcMain.handle("getLang", (event, data) => {
            logger.info("[LANG] Requested lang refresh");
            let selectedLang = store.get("lang") ?? "en_US";

            if (selectedLang === "auto" && (app.getLocale() === "de" || app.getLocale() === "de_DE")) selectedLang = "de_DE";
            else if (selectedLang === "auto") selectedLang = "en_US";

            top.mainWindow.webContents.send("sendLang", {
                selected: selectedLang,
                en_US: require("./lang/en_US.json"),
                de_DE: require("./lang/de_DE.json"),
            });
        });

        logger.info("[STARTUP] Regitsered all ipc handler");

        if (!store.get("profiles") || store.get("profiles").length <= 0) {
            store.set("profiles", [
                {
                    name: "Fabric 1.20.2",
                    loader: "fabric",
                    version: "1.20.2",
                },
            ]);
            store.set("selectedProfile", {
                name: "Fabric 1.20.2",
                loader: "fabric",
                version: "1.20.2",
            });
        }

        trayManager.init(top, app, __dirname);

        const lastPos = store.get("windowPosition");

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
            icon: process.platform === "win32" ? path.join(__dirname + "/public/img/logo.ico") : path.join(__dirname + "/public/img/logo256x256.png"),
            webPreferences: {
                preload: path.join(__dirname, "preload.js"),
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        top.mainWindow.loadFile("src/public/login.html").then(() => {
            top.mainWindow.webContents.send("sendVersion", app.getVersion());
            logger.info(`[STARTUP] Loaded login window (${new Date() - startTimestamp}ms after start)`);
        });

        top.mainWindow.show();

        top.mainWindow.on("close", () => {
            const bounds = top.mainWindow.getBounds();
            store.set("windowPosition", bounds);
        });

        discordRPCManager.init(top);
    });
}

function refreshSettings() {
    top.mainWindow.webContents.send("sendSettings", {
        maxMemMB: store.get("maxMemMB") || Math.floor(os.totalmem() / 1000000 / 2),
        minimizeOnStart: store.get("minimizeOnStart"),
        hideDiscordRPC: store.get("hideDiscordRPC"),
        javaPath: store.get("javaPath"),
    });
}

function proceedToMain() {
    top.mainWindow.loadFile("src/public/main.html").then(() => {
        top.mainWindow.webContents.send("sendVersion", app.getVersion());
        top.mainWindow.webContents.send("sendMaxmemory", os.totalmem());
        refreshSettings();

        logger.info(`[STARTUP] Loaded main window (${new Date() - startTimestamp}ms after start)`);

        if (!foundjava) {
            top.mainWindow.webContents.send("showJavaModal", {});
            logger.info("[JAVA] Sent JavaInstallModal!");
        }
    });
}