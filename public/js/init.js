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
    document.getElementById("hideDiscordRPCCheckbox").checked = settings.hideDiscordRPC ?? false;
});

window.bridge.sendProfiles((event, data) => {
    if (data.selectedProfile) {
        document.getElementById("profileSelectBtn").innerHTML = `
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7l6 6 6-6"></path> </g></svg>
            ${data.selectedProfile.name}`;
    }
    if (data.profiles) {
        const profileTable = document.getElementById("profileTable");
        profileTable.querySelector("tbody").innerHTML = `<tr>
            <th>Name</th>
            <th>Loader</th>
            <th>Version</th>
            <th></th>
        </tr>`;
        data.profiles.forEach((profile, index) => {
            profileTable.querySelector("tbody").innerHTML += `
            <tr>
                <td>${profile.name}</td>
                <td>${profile.loader}</td>
                <td>${profile.version}</td>
                <td>
                    <button type="button" onclick="selectProfile('${profile.name}', '${profile.loader}', '${profile.version}')" title="Profil auswählen">
                        <svg viewBox="-1 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-65.000000, -3803.000000)" fill="#fefefe"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M18.074,3650.7335 L12.308,3654.6315 C10.903,3655.5815 9,3654.5835 9,3652.8985 L9,3645.1015 C9,3643.4155 10.903,3642.4185 12.308,3643.3685 L18.074,3647.2665 C19.306,3648.0995 19.306,3649.9005 18.074,3650.7335" id="play-[#fefefe]"> </path> </g> </g> </g> </g></svg>
                    </button>
                    <button type="button" onclick="openProfileFolder('${profile.name}')" title="Speicherort öffnen">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1 5C1 3.34315 2.34315 2 4 2H8.43845C9.81505 2 11.015 2.93689 11.3489 4.27239L11.7808 6H13.5H20C21.6569 6 23 7.34315 23 9V19C23 20.6569 21.6569 22 20 22H4C2.34315 22 1 20.6569 1 19V10V9V5ZM3 9V10V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V9C21 8.44772 20.5523 8 20 8H13.5H11.7808H4C3.44772 8 3 8.44772 3 9ZM9.71922 6H4C3.64936 6 3.31278 6.06015 3 6.17071V5C3 4.44772 3.44772 4 4 4H8.43845C8.89732 4 9.2973 4.3123 9.40859 4.75746L9.71922 6Z" fill="#fefefe"></path> </g></svg>
                    </button>
                    <button type="button" onclick="addModsToProfile('${profile.name}')" title="Profil bearbeiten">
                        <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.8 12.963L2 18l4.8-.63L18.11 6.58a2.612 2.612 0 00-3.601-3.785L3.8 12.963z"></path> </g></svg>
                    </button>
                </td>
            </tr>`
        });
    }

    if (document.getElementById('newProfileModal').classList.contains('_shown')) document.getElementById('newProfileModal').classList.remove('_shown');
});

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