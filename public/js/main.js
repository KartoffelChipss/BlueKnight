let mainMain = document.querySelector("main.main");
let settingsMain = document.querySelector("main.settings");
let profilesMain = document.querySelector("main.profiles");
let modsMain = document.querySelector("main.mods");

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

function changeSection(section) {
    if (section === "main") {
        mainMain.classList.add("__shown");
        settingsMain.classList.remove("__shown");
        profilesMain.classList.remove("__shown");
        modsMain.classList.remove("__shown");
        return;
    }

    if (section === "settings") {
        mainMain.classList.remove("__shown");
        settingsMain.classList.add("__shown");
        profilesMain.classList.remove("__shown");
        modsMain.classList.remove("__shown");
        return;
    }

    if (section === "profiles") {
        mainMain.classList.remove("__shown");
        settingsMain.classList.remove("__shown");
        profilesMain.classList.add("__shown");
        modsMain.classList.remove("__shown");
        return;
    }

    if (section === "mods") {
        mainMain.classList.remove("__shown");
        settingsMain.classList.remove("__shown");
        profilesMain.classList.remove("__shown");
        modsMain.classList.add("__shown");
        return;
    }
}

function launchMC() {
    console.log(playBtn)
    playBtn.setAttribute("disabled", true);
    playBtn.innerHTML = `Laden...`;
    window.api.invoke('launchMC');
}

window.bridge.sendMCstarted((event, data) => {
    playBtn.removeAttribute("disabled");
    playBtn.innerHTML = `Spielen`
});

window.bridge.sendDownloadProgress((event, progressevent) => {
    //console.log(progressevent)

    if (progressevent.task >= progressevent.total) {
        playBtn.innerHTML = `Laden...`;
        return;
    }

    let percentage = Math.floor((progressevent.task * 100) / progressevent.total);

    //console.log((progressevent.task * 100) / progressevent.total)

    playBtn.setAttribute("disabled", true);
    playBtn.innerHTML = `Laden... (${percentage}%)`;
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

    // document.getElementById("profileSelectBtn").innerHTML = `
    //     <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7l6 6 6-6"></path> </g></svg>
    //     ${name}`;

    window.api.invoke('selectProfile', {
        name,
        loader,
        version
    });

    changeSection("main");
}

function openProfileFolder(name) {
    window.api.invoke('openProfileFolder', name)
}

function openExternalLink(url) {
    window.api.invoke("openExternal", { url });
}