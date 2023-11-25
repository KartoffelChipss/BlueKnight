let mainMain = document.querySelector("main.main");
let settingsMain = document.querySelector("main.settings");
let profilesMain = document.querySelector("main.profiles");

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

window.bridge.sendDownloadProgress((event, progressevent) => {
    const playBtn = document.getElementById("playBtn");

    if (progressevent.task >= progressevent.total) {
        playBtn.setAttribute("disabled", true);
        playBtn.innerHTML = `Spielen`
        return;
    }

    let percentage = Math.floor(progressevent.task / progressevent.total);

    playBtn.setAttribute("disabled", true);
    playBtn.innerHTML = `Laden... (${percentage}%)`;
});