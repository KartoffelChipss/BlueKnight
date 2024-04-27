const { app, BrowserWindow, shell, nativeImage } = require("electron");
const path = require("path");
const fetch = require("cross-fetch");
const { ipcMain } = require("electron/main");
const Store = require("electron-store");
const fs = require("fs");
const os = require("os");
const logger = require("electron-log");
const NodeCace = require("node-cache");
const trayManager = require("./functions/trayManager.js");
const discordRPCManager = require("./functions/discordRPCManager.js");
const { blueKnightRoot, profilespath, downloadFile, checkForJava } = require("./functions/util.js");
const crypto = require('crypto');

const modinfoCache = new NodeCace({ stdTTL: 600, checkperiod: 120 });
const modVersionCache = new NodeCace({ stdTTL: 1800, checkperiod: 120 });
const modFileHashCache = new NodeCace({ stdTTL: 1800, checkperiod: 120 });
const addonsSearchCache = new NodeCace({ stdTTL: 1800, checkperiod: 120 });

logger.transports.file.resolvePathFn = () => path.join(blueKnightRoot, "logs.log");
logger.transports.file.level = "info";

const { AccountManager } = require("./functions/AccountManager.js");
let accountManager = new AccountManager();

const MinecraftManager = require("./functions/MinecraftManager.js");
let minecraftManager = new MinecraftManager();

const ProfileManager = require("./functions/ProfileManager.js");
const profileManager = new ProfileManager();

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
            if (args.path) {
                shell.openPath(args.path);
                return;
            }
            if (args.item) {
                shell.showItemInFolder(args.item);
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
            const selectedProfile = profileManager.getSelectedProfile();
            minecraftManager.launch(selectedProfile.name ?? "profile1", selectedProfile.loader ?? "fabric", selectedProfile.version ?? "1.20.4", accountManager.getActiveAccount())
                .catch((err) => {
                    logger.error("[LAUNCHER] ", err);
                    top.mainWindow.webContents.send("sendMCstarted");
                });
        });

        ipcMain.handle("deleteProfileMod", (event, modPath) => {
            if (!modPath) return null;

            fs.unlinkSync(path.join(modPath));
            logger.info("[PROFILES] Removed mod: " + modPath);
            return fs.existsSync(modPath) ? false : true;
        });

        ipcMain.handle("getProfileMods", async (event, args) => {
            if (!args.name) return;
            const profile = profileManager.findProfile(args.name);
            const profileModsPath = profileManager.getModsPath(profile);

            if (!fs.existsSync(profileModsPath)) return null;

            let modnames = fs.readdirSync(profileModsPath);
            let mods = [];

            for (let i = 0; i < modnames.length; i++) {
                const modname = modnames[i];
                const modId = modname.split("_")[0];

                mods.push({
                    id: null,
                    versionid: null,
                    gameVersions: null,
                    versionData: null,
                    name: modname,
                    path: path.join(profileModsPath, modname),
                    data: null,
                    foundOnMR: false,
                });

                if (i === modnames.length - 1) return mods;
            }
        });

        ipcMain.handle("getModData", async (event, modPath) => {
            if (!modPath) return null;
            if (!fs.existsSync(modPath)) return null;

            const data = await fetchModFilefromMR(modPath);

            return {
                id: data.project_id,
                versionid: data.id,
                gameVersions: data.game_versions,
                versionData: data,
                name: data.name,
                path: modPath,
                data: data,
                foundOnMR: true,
            };
        });

        ipcMain.handle("getExtensiveModData", async (event, modid) => {
            if (!modid) return null;

            const data = await fetchModfromMR(modid);

            return data;
        });

        ipcMain.handle("createProfile", async (event, data) => {
            if (!data.name || !data.loader || !data.version) return;

            profileManager.addProfile({
                name: data.name,
                loader: data.loader,
                version: data.version,
            });
        });

        ipcMain.handle("deleteProfile", async (event, name) => {
            if (!name) return null;

            console.log("[PROFILES] Deleting profile: " + name)

            profileManager.removeProfile(name);
            return true;
        });

        ipcMain.handle("getProfileData", (event, name) => {
            if (!name) return null;
            return profileManager.findProfile(name);
        });

        ipcMain.handle("getProfiles", (event, data) => {
            profileManager.sendProfilesUpdate();
        });

        ipcMain.handle("getSelectedProfile", (event, data) => {
            return profileManager.getSelectedProfile();
        });

        ipcMain.handle("selectProfile", (event, data) => {
            if (!data.name || !data.loader || !data.version) return;

            profileManager.selectProfile(data.name);

            logger.info(`[PROFILES] Switched to ${data.name}`);
        });

        ipcMain.handle("openProfileFolder", (event, profileName) => {
            const myProfilePath = path.join(profilespath, profileName);
            if (!fs.existsSync(myProfilePath)) fs.mkdirSync(myProfilePath);
            shell.openPath(myProfilePath);
            logger.info("[PROFILES] Opened folder '" + myProfilePath + "'");
        });

        ipcMain.handle("openRootFolder", (event, data) => {
            logger.info("[PROFILES] Opened folder '" + profilespath + "'");
            shell.openPath(profilespath);
        });

        ipcMain.handle("searchMods", async (event, data) => {
            if (!data || !data.options) return null;
        
            const options = data.options;
            const url = `https://api.modrinth.com/v2/search?${options}`;
        
            if (addonsSearchCache.has(options)) {
                //console.log(`Found in cache: ${options} (${addonsSearchCache.get(options).hits.length} results)`);
                return Promise.resolve(addonsSearchCache.get(options));
            }
        
            try {
                const response = await fetch(url);
                const searchData = await response.json();
                
                if (searchData && searchData.hits) addonsSearchCache.set(options, searchData);
                
                return searchData;
            } catch (error) {
                return Promise.reject(error);
            }
        });

        ipcMain.handle("downloadMod", (event, data) => {
            logger.info("[DOWNLOADS] Recieved Mod download request for " + data.filetoDownload.filename);
            downloadFile(data.filetoDownload.url, data.targetProfile, `${data.modid}_${data.modversionid}_${data.filetoDownload.filename}`);
            logger.info("[DOWNLOADS] Finished downlaoding " + data.filetoDownload.filename);
            top.mainWindow.webContents.send("modDownloadResult", {
                result: "success",
            });

            // Delete old versions of installed mod
            const modsDirPath = path.join(profilespath, data.targetProfile, "mods");
            if (!fs.existsSync(modsDirPath)) fs.mkdirSync(modsDirPath, { recursive: true });
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
            let selectedLang = store.get("lang") ?? "en_US";

            if (selectedLang === "auto" && (app.getLocale() === "de" || app.getLocale() === "de_DE")) selectedLang = "de_DE";
            else if (selectedLang === "auto") selectedLang = "en_US";

            top.mainWindow.webContents.send("sendLang", {
                selected: selectedLang,
                en_US: require("./lang/en_US.json"),
                de_DE: require("./lang/de_DE.json"),
            });

            logger.info("[LANG] Sent lang refresh");
        });

        ipcMain.handle("getVersion", (event, data) => {
            return app.getVersion();
        });

        logger.info("[STARTUP] Regitsered all ipc handler");

        trayManager.init(top, app, __dirname);

        top.mainWindow = createMainWindow();

        top.mainWindow.loadFile("src/public/login.html").then(() => {
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
        top.mainWindow.webContents.send("sendMaxmemory", os.totalmem());
        refreshSettings();

        logger.info(`[STARTUP] Loaded main window (${new Date() - startTimestamp}ms after start)`);

        if (!foundjava) {
            top.mainWindow.webContents.send("showJavaModal", {});
            logger.info("[JAVA] Sent JavaInstallModal!");
        }
    });
}

/**
 * Create the main window
 * @returns {BrowserWindow} - The main window
 */
function createMainWindow() {
    const lastPos = store.get("windowPosition");

    return new BrowserWindow({
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
}

async function fetchModfromMR(modid) {
    if (modinfoCache.has(modid)) return modinfoCache.get(modid);

    const res = await fetch(`https://api.modrinth.com/v2/project/${modid}`);
    // console.log("Fetching: " + `https://api.modrinth.com/v2/project/${modid}`)
    const data = await res.json();
    modinfoCache.set(modid, data);
    return data;
}

async function fetchModVersionfromMR(modid, versionid) {
    if (!versionid || versionid.length !== 8) return null;
    const cacheKey = `${modid}_${versionid}`;
    if (modVersionCache.has(cacheKey)) return modVersionCache.get(cacheKey);

    const res = await fetch(`https://api.modrinth.com/v2/project/${modid}/version/${versionid}`);
    const data = await res.json();
    modVersionCache.set(cacheKey, data);
    return data;
}

function getFileHash(filename, algorithm = 'sha512') {
    return new Promise((resolve, reject) => {
        let shasum = crypto.createHash(algorithm);
        try {
            let s = fs.ReadStream(filename)
            s.on('data', function (data) {
                shasum.update(data)
            })
            s.on('end', function () {
                const hash = shasum.digest('hex')
                return resolve(hash);
            })
        } catch (error) {
            return reject('calc fail');
        }
    });
}

async function fetchModFilefromMR(modPath) {
    if (modFileHashCache.has(modPath)) return modFileHashCache.get(modPath);
    const algorithm = 'sha512';
    const fileHash = await getFileHash(path.join(modPath), algorithm);
    const res = await fetch(`https://api.modrinth.com/v2/version_file/${fileHash}?algorithm=${algorithm}`);
    const data = await res.json();
    modFileHashCache.set(modPath, data);
    return data;
}