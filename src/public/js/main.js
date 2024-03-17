let mainMain = document.querySelector("main.main");
let settingsMain = document.querySelector("main.settings");
let profilesMain = document.querySelector("main.profiles");
let modsMain = document.querySelector("main.mods");
let profileviewMain = document.querySelector("main.profileview");

const playBtn = document.getElementById("playBtn");

async function fetchAsync(url) {
    let headers = new Headers({
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Kartoffelstream/v0.1/JanStraßburger"
    });
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

function loadWarning(msg) {
    let warnbox = document.getElementById("warnbox");
    let warnspan = warnbox.querySelector("span");

    warnspan.innerHTML = msg;
    warnbox.classList.add("_shown");

    setTimeout(() => {
        warnbox.classList.remove("_shown");
    }, 3500);
}

window.bridge.openSection((event, section) => {
    changeSection(section);
})

async function changeSection(section, profilename) {
    if (section === "main") {
        mainMain.classList.add("__shown");
        settingsMain.classList.remove("__shown");
        profilesMain.classList.remove("__shown");
        modsMain.classList.remove("__shown");
        profileviewMain.classList.remove("__shown");
        return;
    }

    if (section === "settings") {
        mainMain.classList.remove("__shown");
        settingsMain.classList.add("__shown");
        profilesMain.classList.remove("__shown");
        modsMain.classList.remove("__shown");
        profileviewMain.classList.remove("__shown");
        return;
    }

    if (section === "profiles") {
        mainMain.classList.remove("__shown");
        settingsMain.classList.remove("__shown");
        profilesMain.classList.add("__shown");
        modsMain.classList.remove("__shown");
        profileviewMain.classList.remove("__shown");
        return;
    }

    if (section === "mods") {
        mainMain.classList.remove("__shown");
        settingsMain.classList.remove("__shown");
        profilesMain.classList.remove("__shown");
        modsMain.classList.add("__shown");
        profileviewMain.classList.remove("__shown");
        return;
    }

    if (section === "profileview") {
        await loadProfileView(profilename);

        mainMain.classList.remove("__shown");
        settingsMain.classList.remove("__shown");
        profilesMain.classList.remove("__shown");
        modsMain.classList.remove("__shown");
        profileviewMain.classList.add("__shown");
        return;
    }
}

async function loadProfileView(profilename) {
    const profileData = await window.api.invoke("getProfileData", profilename);
    // console.log("Profile data: ", profileData);

    profileviewMain.querySelector("h1").innerHTML = profilename;
    profileviewMain.querySelector(".loader_icon").src = `./img/loader/${profileData.loader}.png`;
    profileviewMain.querySelector(".loader_icon").alt = `${profileData.loader}-logo`;
    profileviewMain.querySelector(".loader").innerHTML = capitalizeFirstLetter(profileData.loader);
    profileviewMain.querySelector(".version").innerHTML = profileData.version;

    profileviewMain.querySelector(".modlist").innerHTML = `<div class="loader"><img src="./img/spinner.svg"></div>`;

    const playBtn = profileviewMain.querySelector(".playBtn");
    playBtn.setAttribute("onclick", `selectProfile("${profilename}", "${profileData.loader}", "${profileData.version}")`);

    const openfolderBtn = profileviewMain.querySelector(".openfolderBtn");
    openfolderBtn.setAttribute("onclick", `openProfileFolder("${profilename}")`);

    profileviewMain.querySelector(".nomods").style.display = "none";

    window.api.invoke("getProfileMods", { name: profilename }).then(mods => {
        profileviewMain.querySelector(".modlist").innerHTML = "";

        if (mods === null || mods.length === 0) {
            profileviewMain.querySelector(".nomods").style.display = "flex";
            return;
        }

        console.log(mods)

        mods.forEach(mod => {
            if (!mod.foundOnMR) {
                profileviewMain.querySelector(".modlist").innerHTML += `
                    <div class="mod">
                        <img src="./img/noicon.svg">

                        <div class="descbox">
                            <div class="titlebox">
                                <h3>${mod.name}</h3>
                            </div>
                        </div>

                        <div class="modBtns">
                            <button type="button" class="icon grey findModInFilesystem" onclick="showModinFolder('${mod.path}')">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1 5C1 3.34315 2.34315 2 4 2H8.43845C9.81505 2 11.015 2.93689 11.3489 4.27239L11.7808 6H13.5H20C21.6569 6 23 7.34315 23 9V19C23 20.6569 21.6569 22 20 22H4C2.34315 22 1 20.6569 1 19V10V9V5ZM3 9V10V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V9C21 8.44772 20.5523 8 20 8H13.5H11.7808H4C3.44772 8 3 8.44772 3 9ZM9.71922 6H4C3.64936 6 3.31278 6.06015 3 6.17071V5C3 4.44772 3.44772 4 4 4H8.43845C8.89732 4 9.2973 4.3123 9.40859 4.75746L9.71922 6Z" fill="#fefefe"></path> </g></svg>
                            </button>
                            <button type="button" class="icon grey redhover deleteMod" onclick="window.api.invoke('openRootFolder')">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                            </button>
                        </div>
                    </div>`;
                return;
            }

            profileviewMain.querySelector(".modlist").innerHTML += `
                <div class="mod">
                    <img src="${mod.data.icon_url}" onerror="this.src='./img/noicon.svg'">

                    <div class="descbox">
                        <div class="titlebox">
                            <h3>${mod.data.title}</h3>
                            <span class="tag">${mod.versionData?.version_number ?? "0.0.0"}</span>
                            <button class="tag" onclick="openExternalLink('https://modrinth.com/mod/${mod.id}')">
                                <svg fill="#fefefe" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.192"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" d="M19,14 L19,19 C19,20.1045695 18.1045695,21 17,21 L5,21 C3.8954305,21 3,20.1045695 3,19 L3,7 C3,5.8954305 3.8954305,5 5,5 L10,5 L10,7 L5,7 L5,19 L17,19 L17,14 L19,14 Z M18.9971001,6.41421356 L11.7042068,13.7071068 L10.2899933,12.2928932 L17.5828865,5 L12.9971001,5 L12.9971001,3 L20.9971001,3 L20.9971001,11 L18.9971001,11 L18.9971001,6.41421356 Z"></path> </g></svg>
                            </button>
                        </div>
                        <span class="desc">${mod.data?.description}</span>
                    </div>

                    <div class="modBtns">
                        <button type="button" class="icon grey findModInFilesystem" onclick="showModinFolder('${mod.path}')">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1 5C1 3.34315 2.34315 2 4 2H8.43845C9.81505 2 11.015 2.93689 11.3489 4.27239L11.7808 6H13.5H20C21.6569 6 23 7.34315 23 9V19C23 20.6569 21.6569 22 20 22H4C2.34315 22 1 20.6569 1 19V10V9V5ZM3 9V10V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V9C21 8.44772 20.5523 8 20 8H13.5H11.7808H4C3.44772 8 3 8.44772 3 9ZM9.71922 6H4C3.64936 6 3.31278 6.06015 3 6.17071V5C3 4.44772 3.44772 4 4 4H8.43845C8.89732 4 9.2973 4.3123 9.40859 4.75746L9.71922 6Z" fill="#fefefe"></path> </g></svg>
                        </button>
                        <button type="button" class="icon grey redhover deleteMod" onclick="deleteProfileMod('${profilename}', '${mod.name}', this)">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                        </button>
                    </div>
                </div>`;
        });
    })
}

function showModinFolder(path) {
    window.api.invoke("openExternal", { item: path });
    console.log("Opening mod in folder: " + path);
}

function deleteProfileMod(profileName, modName, btn) {
    window.api.invoke("deleteProfileMod", { profileName, modName });
    btn.parentElement.parentElement.remove();
}

function launchMC() {
    console.log(playBtn)
    playBtn.setAttribute("disabled", true);
    playBtn.innerHTML = lang[lang.selected].loading;
    window.api.invoke('launchMC');
}

window.bridge.sendMCstarted((event, data) => {
    playBtn.removeAttribute("disabled");
    playBtn.innerHTML = lang[lang.selected].bottombox_play;
});

window.bridge.sendDownloadProgress((event, progressevent) => {
    //console.log(progressevent)

    if (progressevent.task >= progressevent.total) {
        playBtn.innerHTML = lang[lang.selected].loading;
        return;
    }

    let percentage = Math.floor((progressevent.task * 100) / progressevent.total);

    //console.log((progressevent.task * 100) / progressevent.total)

    playBtn.setAttribute("disabled", true);
    playBtn.innerHTML = `${lang[lang.selected].loading} (${percentage}%)`;
});

console.log(navigator.deviceMemory)

function setSetting(setting, value) {
    window.api.invoke("setSetting", {
        setting,
        value,
    });
}

function createNewProfile() {
    let name = document.getElementById("newProfileName").value;
    let invalidPathChars = /[<>:"\/\\|?*\x00-\x1F]/;
    let invalidWords = /^(?:aux|con|clock\$|nul|prn|com[1-9]|lpt[1-9])$/i;

    if (!name || name.length > 100 || invalidWords.test(name).valueOf() || invalidPathChars.test(name).valueOf()) {
        alert("Invalid name!");
        return;
    }

    let loader = document.getElementById("newProfileLoader").value;
    let version = document.getElementById("newProfileVersion").value;

    window.api.invoke('createProfile', {
        name,
        loader,
        version
    });
}

function selectProfile(name, loader, version) {
    if (!name || !loader || !version) return;

    // console.log("Loaded profile: " + name + " " + loader + " " + version)
    document.getElementById("currentprofile_loader").value = loader;
    searchMods();

    window.api.invoke('selectProfile', {
        name,
        loader,
        version
    });

    changeSection("main");
}

function setJavaPath(value) {
    if (!value || value === "" || value === "undefined") return;
    
    setSetting('javaPath', value)
}

function openProfileFolder(name) {
    window.api.invoke('openProfileFolder', name)
}

function openExternalLink(url) {
    window.api.invoke("openExternal", { url });
}

window.bridge.showWarnbox((event, data) => {
    let warnbox = document.getElementById(data.boxid);
    warnbox.classList.add("_shown");

    setTimeout(() => {
        warnbox.classList.remove("_shown");
    }, 5 * 1000);
})

function openModal(modalid) {
    document.getElementById(modalid).classList.add("_open");
}

function closeModal(modalid) {
    document.getElementById(modalid).classList.remove("_open");
}

window.onclick = (e) => {
    if (e.target.tagName === "BODY") {
        document.querySelectorAll("dialog._open").forEach((ele, index) => {
            if (ele.id === "javamodal") return;
            ele.classList.remove("_open");
        });
    }
}

window.bridge.showJavaModal(data => { openModal("javamodal"); });