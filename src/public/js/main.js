let mainMain = document.querySelector("main.main");
let settingsMain = document.querySelector("main.settings");
let profilesMain = document.querySelector("main.profiles");
let modsMain = document.querySelector("main.mods");
let profileviewMain = document.querySelector("main.profileview");

const playBtn = document.getElementById("playBtn");

let clickedModBtn = false;

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
    const mains = document.querySelectorAll("main");

    mains.forEach(main => {
        main.classList.remove("__shown");
    });

    if (section === "main") {
        mainMain.classList.add("__shown");
        return;
    }

    if (section === "settings") {
        settingsMain.classList.add("__shown");
        return;
    }

    if (section === "profiles") {
        profilesMain.classList.add("__shown");
        return;
    }

    if (section === "mods") {
        modsMain.classList.add("__shown");
        if (!clickedModBtn) {
            document.getElementById("addontypes_button_mods").click();
            clickedModBtn = true;
        }
        modsMain.querySelector(".addontypes--tab.-active").click();
        return;
    }

    if (section === "profileview") {
        await loadProfileView(profilename);
        profileviewMain.classList.add("__shown");
        profileviewMain.querySelector(".addontypes--tab.-active").click();
        return;
    }
}

window.addEventListener("keydown", (e) => {
    if ((e.key === "Escape" || e.keyCode === 27)) {
        if (document.getElementById("downloadModModal").classList.contains("_shown")) return closeDownloadModModal();
        if (document.querySelector(".modal._shown")) return closeModal(document.querySelector(".modal._shown").id);
        if (profileviewMain.classList.contains("__shown")) return changeSection("profiles");
        changeSection("main");
    }
});

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

function deleteProfile(profileName) {
    window.api.invoke('deleteProfile', profileName).then(success => {
        if (!success) return loadWarning("Failed to delete profile!");

        closeModal("deleteProfileModal");
        changeSection("profiles");
    });
}

function selectProfile(name, loader, version, switchToMain = false) {
    if (!name || !loader || !version) return;

    // console.log("Loaded profile: " + name + " " + loader + " " + version)
    document.getElementById("currentprofile_loader").value = loader;
    document.getElementById("currentprofile_version").value = version;

    window.api.invoke('selectProfile', {
        name,
        loader,
        version
    });

    window.api.invoke('getProfiles')

    if (switchToMain) changeSection("main");
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
    document.getElementById(modalid).classList.add("_shown");
}

function closeModal(modalid) {
    document.getElementById(modalid).classList.remove("_shown");
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