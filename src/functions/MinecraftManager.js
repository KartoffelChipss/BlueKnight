const logger = require("electron-log");
const { getMainWindow, profilespath } = require("./util");
const { Client } = require("minecraft-launcher-core");
const { vanilla, fabric, forge, liner, quilt } = require("tomate-loaders");
const devMode = process.env.NODE_ENV === "development";
const Store = require("electron-store");
const store = new Store();
const path = require("path");

class MinecraftManager {
    constructor() {
        this.launcher = new Client();
        this._registerEvents();
    }

    _registerEvents() {
        const mainWindow = getMainWindow();

        this.launcher.on(
            "data",
            liner((line) => {
                if (line.match(/\[Render thread\/INFO\]: Setting user:/g) || line.match(/\[MCLC\]: Launching with arguments/) || line.includes("Launching with arguments") || line.includes("Setting user")) {
                    logger.info("[LAUNCHER] Minecraft started!")
                    const mainWindow = getMainWindow();
                    if (mainWindow) mainWindow.webContents.send("sendMCstarted");
                    if (store.get("minimizeOnStart") && mainWindow) mainWindow.hide();
                }
        
                logger.info("[LAUNCHER-DATA] " + line);
            })
        );
        
        this.launcher.on("progress", (e) => {
            if (devMode) {
                logger.info("[LAUNCHER-PROGRESS]:");
                logger.info(e);
            }
            if (getMainWindow()) getMainWindow().webContents.send("sendDownloadProgress", e);
        });
        
        this.launcher.on("close", (e) => {
            logger.info("[LAUNCHER] Launcher closed!");
            if (getMainWindow()) {
                getMainWindow().webContents.send("sendMCstarted");
                getMainWindow().show();
            }
        });

        this.launcher.on("debug", e => {
            if (devMode) logger.info("[LAUNCHER-DEBUG] " + e);
        });
    }

    /**
     * Launches the game
     * @param {String} profileName - The name of the profile to launch
     * @param {import('../types').modLoader} loader - The loader to use
     * @param {String} version - The version of the game to launch
     * @param {import("./AccountManager").Account} account - The account to use
     * @returns 
     */
    launch(profileName, loader, version, account) {
        return new Promise(async (resolve, reject) => {
            const currentuser = account.minecraft;
            if (!currentuser) return;
        
            let rootPath = path.join(profilespath, profileName);
        
            logger.info("Root Path: ");
            logger.info(rootPath);
        
            let launchConfig;
            if (loader === "fabric") {
                logger.info("[LAUNCHER] Getting Fabric config...");
                launchConfig = await fabric.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath,
                });
                logger.info("[LAUNCHER] Finished getting Fabric config!");
            } else if (loader === "forge") {
                logger.info("[LAUNCHER] Starting Forge...");
                launchConfig = await forge.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath,
                });
                logger.info("[LAUNCHER] Finished getting Forge config!");
            } else if (loader === "quilt") {
                logger.info("[LAUNCHER] Starting Quilt...");
                launchConfig = await quilt.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath,
                });
                logger.info("[LAUNCHER] Finished getting Quilt config!");
            } else {
                logger.info("[LAUNCHER] Starting Vanilla...");
                launchConfig = await vanilla.getMCLCLaunchConfig({
                    gameVersion: version,
                    rootPath,
                });
                logger.info("[LAUNCHER] Finished getting Vanilla config!");
            }
        
            let opts = {
                ...launchConfig,
                authorization: currentuser.mclc(),
                overrides: {
                    detached: false,
                },
                memory: {
                    max: (store.get("maxMemMB") || "4000") + "M",
                    min: "2G",
                },
                javaPath: store.get("javaPath"),
            };
        
            logger.info("[LAUNCHER] Using javapath: " + store.get("javaPath"));
        
            logger.info("[LAUNCHER] Launching game...");
            this.launcher.launch(opts).catch((err) => reject(err));
            logger.info("[LAUNCHER] Launched game!");
            resolve();
        });
    }
}

module.exports = MinecraftManager;