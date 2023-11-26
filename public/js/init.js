window.bridge.sendProfile((event, profile) => {
    console.log(profile)
    document.querySelectorAll(".userface").forEach((userfacebox) => {
        userfacebox.src = `https://visage.surgeplay.com/face/512/${profile.id}`;
    });
    document.querySelectorAll(".username").forEach((usernamebox) => {
        usernamebox.innerHTML = profile.name;
    });
})

window.bridge.sendSettings((event, settings) => {
    if (!settings) return;

    if (settings.maxMemMB) {
        document.getElementById("memslider").value = settings.maxMemMB;
        document.getElementById("meminput").value = settings.maxMemMB;
    }

    document.getElementById("minimizeOnStartCheckbox").checked = settings.minimizeOnStart ?? false;
    document.getElementById("showDiscordRPCheckbox").checked = settings.showDiscordRP ?? false;
})

let maxMemMB;

window.bridge.sendMaxmemory((event, maxmem) => {
    let maxmemGB = Math.floor(maxmem / 1000000000);
    let maxmemMB = Math.floor(maxmem / 1000000);
    console.log(maxmemMB);
    maxMemMB = maxmemMB;

    let memslider = document.getElementById("memslider");
    memslider.setAttribute("max", maxmemMB);
    //memslider.value = Math.floor(maxmemMB / 2);

    document.getElementById("memMarks").innerHTML = `
        <span>2GB</span>
        <span>${maxmemGB}GB</span>
    `

    let meminput = document.getElementById("meminput");
    //meminput.value = Math.floor(maxmemMB / 2);
    meminput.setAttribute("min", 2000);
    meminput.setAttribute("max", maxmemMB);
});

function setMaxMem(value) {
    if (value > maxMemMB) return;
    if (value < 2000) return;

    document.getElementById("meminput").value = value;
    document.getElementById("memslider").value = value;
    window.api.invoke('setMaxMem', value);
    console.log("[SETTINGS] Set max memory to " + value + "MB");
}