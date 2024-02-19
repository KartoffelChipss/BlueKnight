const path = require("path");
const { getLang } = require("./langManager");
const { shell, nativeImage, nativeTheme, Tray, Menu } = require("electron");
const logger = require("electron-log");
const devMode = process.env.NODE_ENV === 'development'

function init(top, app, mainDir) {
    let iconColor = "black";
    if (nativeTheme.shouldUseDarkColors) {
        iconColor = "white";
    }

    top.tray = null;

    let preferredIconType = "ico";

    if (process.platform === "darwin" || process.platform === "linux") {
        preferredIconType = "png";
    }

    top.tray = new Tray(path.join(mainDir + `/public/img/logo.${preferredIconType}`));

    let menu = [
        {
            label: getLang(app.getLocale(), "tray_help_title") ?? "Hilfe",
            icon: nativeImage.createFromPath(mainDir + `/public/img/icons/${iconColor}/help.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                shell.openExternal("https://strassburger.org/discord");
            },
        },
        {
            type: "separator",
        },
        {
            label: getLang(app.getLocale(), "tray_home_title") ?? "Startseite",
            icon: nativeImage.createFromPath(mainDir + `/public/img/icons/${iconColor}/home.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                top.mainWindow.show();
                top.mainWindow.webContents.send("openSection", "main");
            },
        },
        {
            label: getLang(app.getLocale(), "tray_settings_title") ?? "Einstellungen",
            icon: nativeImage.createFromPath(mainDir + `/public/img/icons/${iconColor}/settings.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                top.mainWindow.show();
                top.mainWindow.webContents.send("openSection", "settings");
            },
        },
        {
            type: "separator",
        },
        {
            label: getLang(app.getLocale(), "tray_quit_title") ?? "Beenden",
            icon: nativeImage.createFromPath(mainDir + `/public/img/icons/${iconColor}/off.${preferredIconType}`).resize({ width: 16 }),
            role: "quit",
        },
    ];

    const builtmenu = Menu.buildFromTemplate(menu);
    top.tray.setContextMenu(builtmenu);

    top.tray.setToolTip("Instantradio");

    // if (!devMode) Menu.setApplicationMenu(builtmenu);

    top.tray.on("click", function (e) {
        if (top.mainWindow.isVisible()) {
            top.mainWindow.hide();
        } else {
            top.mainWindow.show();
        }
    });

    logger.info("[STARTUP] Set up tray menu");
}

module.exports = { init };