const Store = require("electron-store");
const store = new Store();
const path = require("path");
const fs = require("fs");
const logger = require("electron-log");
const { profilespath, getMainWindow } = require("../functions/util.js");

class ProfileManager {
    constructor() {
        this.selectedProfile = store.get("selectedProfile") || null;
        this.profiles = store.get("profiles") || [];

        if (this.profiles.length === 0) {
            this.addProfile({
                name: "Fabric 1.20.4",
                loader: "fabric",
                version: "1.20.4",
            });

            this.selectProfile(this.getProfiles()[0].name);
            logger.info("[PROFILES] No profiles found, creating default profile");
        }
    }

    /**
     * Get the selected profile
     * @returns {import('../types').Profile} - The selected profile
     */
    getSelectedProfile() {
        return this.selectedProfile;
    }

    /**
     * Get all profiles
     * @returns {import('../types').Profile[]} - The profiles
     */
    getProfiles() {
        return this.profiles;
    }

    /**
     * Add a profile
     * @param {import('../types').Profile} profile - The profile to add
     */
    addProfile(profile) {
        this.profiles.push(profile);
        store.set("profiles", this.profiles);

        if (!this.selectedProfile) {
            this.selectedProfile = profile;
            store.set("selectedProfile", this.selectedProfile);
        }

        if (!fs.existsSync(this.getPath(profile))) fs.mkdirSync(this.getPath(profile), { recursive: true });

        this.sendProfilesUpdate();
    }

    /**
     * Remove a profile
     * @param {String} name - The name of the profile to remove
     */
    removeProfile(name) {
        if (this.profiles.length === 1) return console.error("Cannot remove the last profile");

        this.profiles = this.profiles.filter(profile => profile.name !== name);
        store.set("profiles", this.profiles);

        if (this.selectedProfile && this.selectedProfile.name === name) {
            this.selectedProfile = this.profiles[0];
            store.set("selectedProfile", this.selectedProfile);
        }
        
        fs.rmSync(path.join(profilespath, name), { recursive: true });
        
        this.sendProfilesUpdate();
    }

    /**
     * Select a profile
     * @param {String} name - The name of the profile to select
     */
    selectProfile(name) {
        this.selectedProfile = this.profiles.find(profile => profile.name === name);
        store.set("selectedProfile", this.selectedProfile);
        this.sendProfilesUpdate();
    }
    
    /**
     * Find a profile by its name
     * @param {String} name - The name of the profile to find
     */
    findProfile(name) {
        return this.profiles.find(profile => profile.name === name);
    }

    /**
     * Get the path to a profile
     * @param {import('../types').Profile} profile 
     */
    getPath(profile) {
        return path.join(profilespath, profile.name);
    }

    /**
     * Get the path to the selected profile
     */
    getSelectedPath() {
        return this.getPath(this.selectedProfile);
    }

    /**
     * Get the path to a profiles mods
     * @param {import('../types').Profile} profile 
     */
    getModsPath(profile) {
        return path.join(this.getPath(profile), "mods");
    }

    /**
     * Get the path to the mods folder of the selected profile
     */
    getSelectedModsPath() {
        return path.join(this.getSelectedPath(), "mods");
    }

    /**
     * Get the path to a profiles ressourcepacks
     * @param {import('../types').Profile} profile 
     */
    getRessourcePacksPath(profile) {
        return path.join(this.getPath(profile), "resourcepacks");
    }

    /**
     * Get the path to the ressource packs folder of the selected profile
     */
    getSelectedRessourcePacksPath() {
        return path.join(this.getSelectedPath(), "resourcepacks");
    }

    /**
     * Get the path to a profiles shaderpacks
     * @param {import('../types').Profile} profile 
     */
    getShadersPath(profile) {
        return path.join(this.getPath(profile), "shaderpacks");
    }

    /**
     * Get the path to the shaderpacks folder of the selected profile
     */
    getSelectedShadersPath() {
        return path.join(this.getSelectedPath(), "shaderpacks");
    }

    /**
     * Get the profile update data
     */
    getUpdateData() {
        return {
            profiles: store.get("profiles"),
            selectedProfile: store.get("selectedProfile"),
        };
    }

    /**
     * Send a profiles update to the main window
     */
    sendProfilesUpdate() {
        getMainWindow().webContents.send("sendProfiles", {
            profiles: store.get("profiles"),
            selectedProfile: store.get("selectedProfile"),
        });
    }
}

module.exports = ProfileManager;