const Store = require("electron-store");
const store = new Store();

/**
 * Get a lang string
 * @param {String} locale - The locale to get the lang string for
 * @param {String} key - The key to get the lang string for
 */
function getLang(locale = "en_US", key) {
    let selectedLang = store.get("lang") ?? "en_US";

    if (selectedLang === "auto" && (locale === "de" || locale === "de_DE")) selectedLang = "de_DE";
    else if (selectedLang === "auto") selectedLang = "en_US";

    let lang = require(`../lang/${selectedLang}.json`);

    return lang[key];
}

module.exports = { getLang };