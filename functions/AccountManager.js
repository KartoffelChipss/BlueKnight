const { Minecraft } = require("msmc");
const { Auth } = require("msmc");
const authManager = new Auth("select_account");
const Store = require("electron-store");
const { safeStorage } = require("electron");
const store = new Store();

/**
 * @typedef {Object} Account
 * @property {String} id - The UUID of the account
 * @property {String} name - The name of the account
 * @property {String} accessToken - The access token of the account
 * @property {Minecraft} minecraft - The Minecraft instance of the account
 */

class AccountManager {

    /**
     * @param {Electron.BrowserWindow} mainWindow - The main window of the application
     */
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.activeAccountID = store.get("activeAccount") || null;
        this.accounts = store.get("accounts") || [];
    }

    /**
     * Initializes the account manager
     * @param {Electron.BrowserWindow} mainWindow - The main window of the application
     * @returns {Promise<void>}
     */
    async init(mainWindow) {
        this.mainWindow = mainWindow;

        if (this.activeAccountID === null || (this.activeAccountID && !this.findAccount(this.activeAccountID))) {
            let newAccount = await this.openMicrosoftLogin();
            this.addAccount(newAccount);
            this.selectAccount(newAccount.id);
        }

        const accounts = this.getAccounts();

        for (let account of accounts) {
            let tokenString = this.decryptToken(account.accessToken);

            let token = null;
            let tokenXbox = null;
            if (tokenString) tokenXbox = await authManager.refresh(tokenString);
            if (tokenString && tokenXbox) token = await tokenXbox.getMinecraft();

            if (token) {
                account.minecraft = token;
            } else {
                this.removeAccount(account.id);
            }
        }

        this.sendUpdatedAccounts();
    }

    loginWithNewAccount() {
        return new Promise(async (resolve, reject) => {
            try {
                let account = await this.openMicrosoftLogin();
                this.addAccount(account);
                this.selectAccount(account.id);
                this.sendUpdatedAccounts();
                resolve(account);
            } catch (error) {
                reject(error);
            }
        });
    }

    sendUpdatedAccounts(mainWindow) {
        // console.log(mainWindow.webContents)
        // // console.log("Update accounts: ", {
        // //     current: this.getActiveAccount(),
        // //     accounts: this.getAccounts().filter(account => account.id !== this.activeAccountID)
        // // })
        // mainWindow.webContents.send("updateAccounts", {
        //     current: this.getActiveAccount(),
        //     accounts: this.getAccounts().filter(account => account.id !== this.activeAccountID)
        // });
    }

    getUpdateData() {
        return {
            current: this.getActiveAccount(),
            accounts: this.getAccounts().filter(account => account.id !== this.activeAccountID)
        }
    }

    /**
     * Selects an account to be the active account
     * @param {String} id - The UUID of the account to select
     */
    selectAccount(id) {
        this.activeAccountID = id;
        store.set("activeAccount", this.activeAccountID);
        this.sendUpdatedAccounts();
    }

    /**
     * Adds an account to the account manager
     * @param {Account} account 
     */
    addAccount(account) {
        if (this.accounts.find(acc => acc.id === account.id)) return;

        this.accounts.push(account);
        // remove minecraft field before saving
        account = { ...account };
        delete account.minecraft;
        this.saveAccounts();
        this.sendUpdatedAccounts();
    }

    /**
     * Finds an account by its UUID
     * @param {String} id - The UUID of the account to find
     * @returns {Account|undefined} - The account if found, otherwise undefined
     */
    findAccount(id) {
        return this.accounts.find(account => account.id === id);
    }

    /**
     * Removes an account from the account manager
     * @param {String} id - The UUID of the account to remove
     */
    async removeAccount(id) {
        let newAccounts = this.accounts.filter(account => account.id !== id);

        if (this.activeAccountID === id && newAccounts[0]) {
            this.activeAccountID = newAccounts[0].id;
            store.set("activeAccount", this.activeAccountID);
        }

        if (newAccounts.length === 0) {
            await this.openMicrosoftLogin()
                .then(account => {
                    this.accounts = newAccounts;
                    this.addAccount(account);
                    this.selectAccount(account.id);
                    this.saveAccounts();
                    this.sendUpdatedAccounts();
                })
                .catch(error => {
                    if (error.message === "") return;
                    else console.log(error.message);
                });

            return;
        }

        this.accounts = newAccounts;
        this.saveAccounts();
        this.sendUpdatedAccounts();
    }

    /**
     * Returns the active account
     * @returns {Account} - The active account
     */
    getActiveAccount() {
        return this.findAccount(this.activeAccountID);
    }

    /**
     * Returns the active account
     * @returns {Account[]} - All other accounts
     */
    getAccounts() {
        return this.accounts;
    }

    /**
     * Opens the Microsoft login window and returns the account
     * @returns {Promise<Account>} - The account that was logged in
     */
    async openMicrosoftLogin() {
        return new Promise(async (resolve, reject) => {

            const lastPos = store.get("windowPosition");
            let loginWidth = 550;
            let loginHeight = 550;
            let loginX = lastPos ? (lastPos.x + (lastPos.width / 2 - loginWidth / 2)).toFixed(0) : undefined;
            let loginY = lastPos ? (lastPos.y + (lastPos.height / 2 - loginHeight / 2)).toFixed(0) : undefined;
            const xboxManager = await authManager.launch("electron", {
                title: "Microsoft Authentication",
                icon: __dirname + "/public/img/logo.ico",
                backgroundColor: "#1A1B1E",
                width: loginWidth,
                height: loginHeight,
                x: loginX,
                y: loginY,
            }).catch(reject);

            let user = await xboxManager.getMinecraft();

            let savabletoken = xboxManager.save();
            savabletoken = this.encryptToken(savabletoken);

            const account = {
                id: user.profile.id,
                name: user.profile.name,
                accessToken: savabletoken,
                minecraft: user
            };

            resolve(account);
        });
    }

    /**
     * Encrypts a token
     * @param {String} token - The token to encrypt
     * @returns {String} - The encrypted token
     */
    encryptToken(token) {
        return safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(token).toString("base64") : token;
    }

    /**
     * Decrypts a token
     * @param {String} token - The token to decrypt
     * @returns {String} - The decrypted token
     */
    decryptToken(token) {
        return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(token, "base64")) : token;
    }

    saveAccounts() {
        let storagbleAccounts = this.accounts.map(account => {
            let acc = { ...account };
            delete acc.minecraft;
            return acc;
        });

        store.set("accounts", storagbleAccounts);
    }
}

module.exports = { AccountManager };