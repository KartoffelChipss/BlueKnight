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

    document.getElementById("javaPath").value = settings.javaPath;
});

window.bridge.sendProfiles((event, data) => {
    if (data.selectedProfile) {
        let profileSelectBtn = document.getElementById("profileSelectBtn");
        profileSelectBtn.dataset.name = data.selectedProfile.name;
        profileSelectBtn.dataset.version = data.selectedProfile.version;
        profileSelectBtn.dataset.loader = data.selectedProfile.loader;

        profileSelectBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7 8H17M7 12H17M11 16H17M4 4H20V20H4V4Z" stroke="#fefefe" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
            <span>${data.selectedProfile.name}</span>`;
    }
    if (data.profiles) {
        const profileTable = document.getElementById("profileTable");
        const modDownloadProfileSelect = document.getElementById("modDownloadProfileSelect");

        modDownloadProfileSelect.innerHTML = "";

        profileTable.querySelector("tbody").innerHTML = `<tr>
            <th>Name</th>
            <th>Loader</th>
            <th>Version</th>
            <th></th>
        </tr>`;

        data.profiles.forEach((profile, index) => {
            let modsBtn = `<button type="button" onclick="addModsToProfile('${profile.name}')" title="Mods verwalten">
                <svg fill="#fefefe" height="200px" width="200px" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path class="cls-1" d="M9,14H6V8H9ZM8.875,2H6.7226A1.99139,1.99139,0,0,1,5,3,2.486,2.486,0,0,1,3,2H2V6H3A1.79727,1.79727,0,0,1,4.5,5C5.55147,5,5.99725,6.98981,6,7H9c.333-1.53876,1-2.43573,1.741-2.43573,1.481,0,3.259,2.05109,3.259,2.05109S13,2,8.875,2Z"></path> </g></svg>
            </button>`;

            if (profile.loader !== "vanilla") modDownloadProfileSelect.innerHTML += `<option value="${profile.name}?${profile.version}">${profile.name}</option>`;

            if (profile.loader === "vanilla") modsBtn = "";

            profileTable.querySelector("tbody").innerHTML += `
            <tr>
                <td>${profile.name}</td>
                <td>${profile.loader}</td>
                <td>${profile.version}</td>
                <td>
                    <button class="success" type="button" onclick="selectProfile('${profile.name}', '${profile.loader}', '${profile.version}')" title="Profil auswählen">
                        <svg viewBox="-1 0 12 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><defs> </defs> <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-65.000000, -3803.000000)" fill="#fefefe"> <g id="icons" transform="translate(56.000000, 160.000000)"> <path d="M18.074,3650.7335 L12.308,3654.6315 C10.903,3655.5815 9,3654.5835 9,3652.8985 L9,3645.1015 C9,3643.4155 10.903,3642.4185 12.308,3643.3685 L18.074,3647.2665 C19.306,3648.0995 19.306,3649.9005 18.074,3650.7335" id="play-[#fefefe]"> </path> </g> </g> </g> </g></svg>
                    </button>
                    <button type="button" onclick="openProfileFolder('${profile.name}')" title="Speicherort öffnen">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1 5C1 3.34315 2.34315 2 4 2H8.43845C9.81505 2 11.015 2.93689 11.3489 4.27239L11.7808 6H13.5H20C21.6569 6 23 7.34315 23 9V19C23 20.6569 21.6569 22 20 22H4C2.34315 22 1 20.6569 1 19V10V9V5ZM3 9V10V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V9C21 8.44772 20.5523 8 20 8H13.5H11.7808H4C3.44772 8 3 8.44772 3 9ZM9.71922 6H4C3.64936 6 3.31278 6.06015 3 6.17071V5C3 4.44772 3.44772 4 4 4H8.43845C8.89732 4 9.2973 4.3123 9.40859 4.75746L9.71922 6Z" fill="#fefefe"></path> </g></svg>
                    </button>
                    ${modsBtn}
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