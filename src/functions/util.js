const { BrowserWindow } = require('electron');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');
const fetch = require('node-fetch');
const { pipeline } = require("stream/promises");

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

module.exports = {
    getMainWindow,
    blueKnightRoot,
    profilespath,
    downloadFile,
};