const Store = require("electron-store");
const store = new Store();
const RPC = require("discord-rpc");
const logger = require("electron-log");
const { AccountManager } = require("./AccountManager");

const startTimestamp = new Date();

function init(top) {
    let client = new RPC.Client({ transport: "ipc" });

    let dcLoginSuccess = true;

    client
        .login({ clientId: "1178319000212611123" })
        .then(() => {
            logger.info("[DiscordRCP] Login successfull!");
            logger.info("[DiscordRCP] Projecting to: " + client.user.username);
        })
        .catch((err) => {
            dcLoginSuccess = false;
            logger.error("[DiscordRCP] ", err);
        });

    client.on("ready", () => {
        setInterval(() => {
            if (!dcLoginSuccess || !store.get("discordRCP") || !top.mainWindow.isVisible()) return;
            logger.info("[DiscordRCP] Updated DiscordRCP");

            let selectedProfile = store.get("selectedProfile");

            const accountManager = new AccountManager();
            const activeAccount = accountManager.findAccount(store.get("activeAccount"));

            if (!activeAccount) return;

            client
                .setActivity({
                    details: `${selectedProfile.name} (${capitalizeFirstLetter(selectedProfile.loader)} ${selectedProfile.version})`,
                    // state: `${new Date() - startTimestamp}ms in the launcher`,
                    startTimestamp: startTimestamp,
                    largeImageKey: "logo",
                    smallImageKey: `https://visage.surgeplay.com/face/512/${activeAccount.id}`,
                    smallImageText: activeAccount.name,
                    buttons: [
                        { label: "BlueKnight", url: "https://github.com/KartoffelChipss/blueknight" },
                    ]
                })
                .catch((err) => {
                    logger.error("[DiscordRCP] ", err);
                });
        }, 20 * 1000);
    });
}

function setActivity(state, details, largeImageKey) {
    if (!dcLoginSuccess || !store.get("discordRCP") || !top.mainWindow.isVisible()) return;

    client
        .setActivity({
            state: state,
            details: details,
            largeImageKey: largeImageKey,
        })
        .catch((err) => {
            logger.error("[DiscordRCP] ", err);
        });
}

function capitalizeFirstLetter(str) {
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { init, setActivity };