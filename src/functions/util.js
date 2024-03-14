const { BrowserWindow } = require("electron");
const path = require("path");
const { app } = require("electron");
const fs = require("fs");
const fetch = require("node-fetch");
const { pipeline } = require("stream/promises");
const logger = require("electron-log");
const Store = require("electron-store");
const store = new Store();

const blueKnightRoot = path.join(`${app.getPath("appData") ?? "."}${path.sep}.blueknight`);
const profilespath = path.join(blueKnightRoot, `profiles`);

/**
 * Downloads a file from a given url and saves it to the profile folder
 * @param {String} url
 * @param {String} profile
 * @param {String} filename
 */
const downloadFile = async (url, profile, filename) => {
    let profileModsPath = path.join(profilespath, profile, "mods");
    if (!fs.existsSync(profileModsPath)) fs.mkdirSync(profileModsPath);
    const destination = path.resolve(profileModsPath, filename);
    pipeline((await fetch(url)).body, fs.createWriteStream(destination));
};

function getMainWindow() {
    return BrowserWindow.getAllWindows()[0];
}

/**
 * Checks if Java is installed and sets the stores the path if it is found
 * @returns {Boolean} - Returns true if Java is installed
 */
function checkForJava() {
    const setJavaPath = store.get("javaPath");
    if (setJavaPath) {
        if (!fs.existsSync(setJavaPath)) {
            logger.info("[JAVA] Custom set path does not exist");
            logger.info("[JAVA] Java not found. Opening modal after login.");
            return false;
        } else {
            logger.info("[JAVA] Using custom set java path: " + setJavaPath);
            return true;
        }
    } else {
        require("find-java-home")(async (err, home) => {
            logger.info("[JAVA] Looking for installed java path...");
            if (err) return logger.error(err);

            if (!home) {
                logger.info("[JAVA] Could not find java path");
                logger.info("[JAVA] Java not found. Opening modal after login.");
                return false;
            }

            let javaPath;
            if (process.platform === "win32") javaPath = path.join(home, "bin", "javaw.exe");
            else javaPath = path.join(home, "bin", "java");

            if (!fs.existsSync(javaPath)) {
                logger.info("[JAVA] Could not find java path");
                logger.info("[JAVA] Java not found. Opening modal after login.");
                return false;
            }

            logger.info("[JAVA] Found installed java!");
            store.set("javaPath", javaPath);
            logger.info("[JAVA] Java path: " + javaPath);
            return true;
        });
    }
}

module.exports = {
    getMainWindow,
    blueKnightRoot,
    profilespath,
    downloadFile,
    checkForJava,
};
