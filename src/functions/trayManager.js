const path = require("path");
const { getLang } = require("./langManager");
const { shell, nativeImage, nativeTheme, Tray, Menu } = require("electron");
const logger = require("electron-log");
const devMode = process.env.NODE_ENV === 'development'
const AboutWindow = require("./AboutWindowManager.js");

function init(top, app, mainDir) {
    const aboutWindowManager = new AboutWindow();

    const isMac = process.platform === 'darwin';

    let iconColor = "black";
    if (nativeTheme.shouldUseDarkColors) iconColor = "white";

    top.tray = null;

    let preferredIconType = "ico";

    if (process.platform === "darwin" || process.platform === "linux") preferredIconType = "png";

    top.tray = new Tray(path.join(mainDir + `/public/img/logo.${preferredIconType}`));

    let menu = [
        {
            label: getLang(app.getLocale(), "tray_help_title") ?? "Help",
            icon: nativeImage.createFromPath(mainDir + `/public/img/icons/${iconColor}/help.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                shell.openExternal("https://strassburger.org/discord");
            },
        },
        {
            type: "separator",
        },
        {
            label: getLang(app.getLocale(), "tray_home_title") ?? "Home",
            icon: nativeImage.createFromPath(mainDir + `/public/img/icons/${iconColor}/home.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                top.mainWindow.show();
                top.mainWindow.webContents.send("openSection", "main");
            },
        },
        {
            label: getLang(app.getLocale(), "tray_settings_title") ?? "Settings",
            icon: nativeImage.createFromPath(mainDir + `/public/img/icons/${iconColor}/settings.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                top.mainWindow.show();
                top.mainWindow.webContents.send("openSection", "settings");
            },
        },
        {
            label: getLang(app.getLocale(), "tray_settings_about") ?? "About",
            icon: nativeImage.createFromPath(mainDir + `/public/img/icons/${iconColor}/about.${preferredIconType}`).resize({ width: 16 }),
            click: (item, window, event) => {
                aboutWindowManager.show();
            },
        },
        {
            type: "separator",
        },
        {
            label: getLang(app.getLocale(), "tray_quit_title") ?? "Quit",
            icon: nativeImage.createFromPath(mainDir + `/public/img/icons/${iconColor}/off.${preferredIconType}`).resize({ width: 16 }),
            role: "quit",
        },
    ];

    const builtmenu = Menu.buildFromTemplate(menu);
    top.tray.setContextMenu(builtmenu);

    top.tray.setToolTip("BlueKnight");

    const appMenuTemplate = [
        {
            label: "BlueKnight",
            submenu: [
                {
                    label: getLang(app.getLocale(), "tray_settings_about") ?? "About",
                    accelerator: 'CmdOrCtrl+I',
                    click: (item, window, event) => {
                        aboutWindowManager.show();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: getLang(app.getLocale(), "tray_home_title") ?? "Home",
                    accelerator: 'CmdOrCtrl+Shift+H',
                    click: (item, window, event) => {
                        top.mainWindow.show();
                        top.mainWindow.webContents.send("openSection", "main");
                    },
                },
                {
                    label: getLang(app.getLocale(), "tray_settings_title") ?? "Settings",
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: (item, window, event) => {
                        top.mainWindow.show();
                        top.mainWindow.webContents.send("openSection", "settings");
                    },
                },
                {
                    label: getLang(app.getLocale(), "tray_addons_title") ?? "Addons",
                    accelerator: 'CmdOrCtrl+Shift+A',
                    click: (item, window, event) => {
                        top.mainWindow.show();
                        top.mainWindow.webContents.send("openSection", "mods");
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: getLang(app.getLocale(), "tray_hide_title") ?? "Hide",
                    accelerator: "CmdOrCtrl+H",
                    click: (item, window, event) => {
                        top.mainWindow.hide();
                    },
                },
                {
                    type: "separator",
                },
                {
                    label: getLang(app.getLocale(), "tray_quit_title") ?? "Quit",
                    role: "quit",
                },
            ]
        },
        // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
                { role: 'resetzoom' },
                { role: 'zoomin' },
                { role: 'zoomout' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'GitHub',
                    click: async () => {
                        shell.openExternal('https://github.com/KartoffelChipss/blueknight');
                    }
                },
                {
                    label: 'Discord',
                    click: async () => {
                        shell.openExternal('https://strassburger.org/discord');
                    }
                }
            ]
        }
    ];

    console.log("AppMenuTemplate", appMenuTemplate)

    const appMenu = Menu.buildFromTemplate(appMenuTemplate);
    Menu.setApplicationMenu(appMenu);

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