let mainMain = document.querySelector("main.main");
let settingsMain = document.querySelector("main.settings");
let profilesMain = document.querySelector("main.profiles");

const playBtn = document.getElementById("playBtn");

window.bridge.openSection((event, section) => {
    changeSection(section);
})

function changeSection(section) {
    if (section === "main") {
        mainMain.classList.add("__shown");
        settingsMain.classList.remove("__shown");
        profilesMain.classList.remove("__shown");
        return;
    }

    if (section === "settings") {
        mainMain.classList.remove("__shown");
        settingsMain.classList.add("__shown");
        profilesMain.classList.remove("__shown");
        return;
    }

    if (section === "profiles") {
        mainMain.classList.remove("__shown");
        settingsMain.classList.remove("__shown");
        profilesMain.classList.add("__shown");
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