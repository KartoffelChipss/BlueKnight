async function loadProfileView(profilename) {
    const profileData = await window.api.invoke("getProfileData", profilename);
    // console.log("Profile data: ", profileData);

    profileviewMain.querySelector("h1").innerHTML = profilename;
    profileviewMain.querySelector(".loader_icon").src = `./img/loader/${profileData.loader}.png`;
    profileviewMain.querySelector(".loader_icon").alt = `${profileData.loader}-logo`;
    profileviewMain.querySelector(".loader").innerHTML = capitalizeFirstLetter(profileData.loader);
    profileviewMain.querySelector(".version").innerHTML = profileData.version;

    const modlist = profileviewMain.querySelector(".modlist");
    modlist.innerHTML = `<div class="loader"><img src="./img/spinner.svg"></div>`;

    const playBtn = profileviewMain.querySelector(".playBtn");
    playBtn.setAttribute("onclick", `selectProfile("${profilename}", "${profileData.loader}", "${profileData.version}", true); launchMC();`);

    const addmodsbtn = profileviewMain.querySelector(".addmodsbtn");
    addmodsbtn.setAttribute("onclick", `selectProfile("${profilename}", "${profileData.loader}", "${profileData.version}", false); changeSection("mods");`);

    const openfolderBtn = profileviewMain.querySelector(".openfolderBtn");
    openfolderBtn.setAttribute("onclick", `openProfileFolder("${profilename}")`);

    const deleteButton = document.getElementById("deleteProfileModalDeleteBtn");
    deleteButton.setAttribute("onclick", `deleteProfile("${profilename}")`);

    profileviewMain.querySelector(".nomods").style.display = "none";
}

function loadProfileAddons(type) {
    const modlist = profileviewMain.querySelector(".modlist");
    const profilename = profileviewMain.querySelector("h1").innerText;

    window.api.invoke("getProfileAddons", { name: profilename, type }).then(mods => {
        modlist.innerHTML = "";

        if (mods === null || mods.length === 0) {
            profileviewMain.querySelector(".nomods").style.display = "flex";
            return;
        }

        mods.forEach(mod => {
            if (!mod.foundOnMR) {
                modlist.innerHTML += `
                    <div class="mod" id="pmv-${profilename}-${mod.name}">
                        <img src="${mod.icon_url || "./img/noicon.svg"}" onerror="this.src='./img/noicon.svg'">

                        <div class="descbox">
                            <div class="titlebox">
                                <h3>${mod.name}</h3>
                            </div>
                        </div>

                        <div class="modBtns">
                            <button data-langtitle="profileview_showmodinfolder" title="Show in File-Explorer" type="button" class="icon grey findModInFilesystem" onclick="showModinFolder('${mod.path}')">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1 5C1 3.34315 2.34315 2 4 2H8.43845C9.81505 2 11.015 2.93689 11.3489 4.27239L11.7808 6H13.5H20C21.6569 6 23 7.34315 23 9V19C23 20.6569 21.6569 22 20 22H4C2.34315 22 1 20.6569 1 19V10V9V5ZM3 9V10V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V9C21 8.44772 20.5523 8 20 8H13.5H11.7808H4C3.44772 8 3 8.44772 3 9ZM9.71922 6H4C3.64936 6 3.31278 6.06015 3 6.17071V5C3 4.44772 3.44772 4 4 4H8.43845C8.89732 4 9.2973 4.3123 9.40859 4.75746L9.71922 6Z" fill="#fefefe"></path> </g></svg>
                            </button>
                            <button data-langtitle="profileview_deletemod" title="Delete mod" type="button" class="icon grey redhover deleteMod" onclick="deleteProfileMod('${mod.path}', this)">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                            </button>
                        </div>
                    </div>`;
                return;
            }
        });

        let modId = null;
        let version_number = null;

        mods.forEach(mod => {
            window.api.invoke("getModData", mod.path).then(modData => {
                if (!modData || !modData.foundOnMR) return;
                modId = modData?.id;
                version_number = modData?.data?.version_number ?? "0.0.0";
                document.getElementById(`pmv-${profilename}-${mod.name}`).innerHTML = `
                    <img src="${modData.icon_url}" onerror="this.src='./img/noicon.svg'">

                    <div class="descbox">
                        <div class="titlebox">
                            <h3>${modData.name}</h3>
                            <span class="tag">${modData?.data?.version_number ?? "0.0.0"}</span>
                            <button class="tag" onclick="openExternalLink('https://modrinth.com/mod/${modData.id}')">
                                <svg fill="#fefefe" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.192"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" d="M19,14 L19,19 C19,20.1045695 18.1045695,21 17,21 L5,21 C3.8954305,21 3,20.1045695 3,19 L3,7 C3,5.8954305 3.8954305,5 5,5 L10,5 L10,7 L5,7 L5,19 L17,19 L17,14 L19,14 Z M18.9971001,6.41421356 L11.7042068,13.7071068 L10.2899933,12.2928932 L17.5828865,5 L12.9971001,5 L12.9971001,3 L20.9971001,3 L20.9971001,11 L18.9971001,11 L18.9971001,6.41421356 Z"></path> </g></svg>
                            </button>
                        </div>
                        <!--<span class="desc">${modData.data}</span>-->
                    </div>

                    <div class="modBtns">
                        <button data-langtitle="profileview_showmodinfolder" title="Show in File-Explorer" type="button" class="icon grey findModInFilesystem" onclick="showModinFolder('${mod.path}')">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1 5C1 3.34315 2.34315 2 4 2H8.43845C9.81505 2 11.015 2.93689 11.3489 4.27239L11.7808 6H13.5H20C21.6569 6 23 7.34315 23 9V19C23 20.6569 21.6569 22 20 22H4C2.34315 22 1 20.6569 1 19V10V9V5ZM3 9V10V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V9C21 8.44772 20.5523 8 20 8H13.5H11.7808H4C3.44772 8 3 8.44772 3 9ZM9.71922 6H4C3.64936 6 3.31278 6.06015 3 6.17071V5C3 4.44772 3.44772 4 4 4H8.43845C8.89732 4 9.2973 4.3123 9.40859 4.75746L9.71922 6Z" fill="#fefefe"></path> </g></svg>
                        </button>
                        <button data-langtitle="profileview_deletemod" title="Delete mod" type="button" class="icon grey redhover deleteMod" onclick="deleteProfileMod('${mod.path}', this)">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                        </button>
                    </div>`;

                window.api.invoke("getExtensiveModData", modId).then(modData => {
                    document.getElementById(`pmv-${profilename}-${mod.name}`).innerHTML = `
                            <img src="${modData.icon_url}" onerror="this.src='./img/noicon.svg'">
        
                            <div class="descbox">
                                <div class="titlebox">
                                    <h3>${modData.title}</h3>
                                    <span class="tag">${version_number}</span>
                                    <button class="tag" onclick="openExternalLink('https://modrinth.com/mod/${modData.id}')">
                                        <svg fill="#fefefe" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.192"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" d="M19,14 L19,19 C19,20.1045695 18.1045695,21 17,21 L5,21 C3.8954305,21 3,20.1045695 3,19 L3,7 C3,5.8954305 3.8954305,5 5,5 L10,5 L10,7 L5,7 L5,19 L17,19 L17,14 L19,14 Z M18.9971001,6.41421356 L11.7042068,13.7071068 L10.2899933,12.2928932 L17.5828865,5 L12.9971001,5 L12.9971001,3 L20.9971001,3 L20.9971001,11 L18.9971001,11 L18.9971001,6.41421356 Z"></path> </g></svg>
                                    </button>
                                </div>
                                <span class="desc">${modData.description}</span>
                            </div>
        
                            <div class="modBtns">
                                <button data-langtitle="profileview_showmodinfolder" title="Show in File-Explorer" type="button" class="icon grey findModInFilesystem" onclick="showModinFolder('${mod.path}')">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M1 5C1 3.34315 2.34315 2 4 2H8.43845C9.81505 2 11.015 2.93689 11.3489 4.27239L11.7808 6H13.5H20C21.6569 6 23 7.34315 23 9V19C23 20.6569 21.6569 22 20 22H4C2.34315 22 1 20.6569 1 19V10V9V5ZM3 9V10V19C3 19.5523 3.44772 20 4 20H20C20.5523 20 21 19.5523 21 19V9C21 8.44772 20.5523 8 20 8H13.5H11.7808H4C3.44772 8 3 8.44772 3 9ZM9.71922 6H4C3.64936 6 3.31278 6.06015 3 6.17071V5C3 4.44772 3.44772 4 4 4H8.43845C8.89732 4 9.2973 4.3123 9.40859 4.75746L9.71922 6Z" fill="#fefefe"></path> </g></svg>
                                </button>
                                <button data-langtitle="profileview_deletemod" title="Delete mod" type="button" class="icon grey redhover deleteMod" onclick="deleteProfileMod('${mod.path}', this)">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 6L17.1991 18.0129C17.129 19.065 17.0939 19.5911 16.8667 19.99C16.6666 20.3412 16.3648 20.6235 16.0011 20.7998C15.588 21 15.0607 21 14.0062 21H9.99377C8.93927 21 8.41202 21 7.99889 20.7998C7.63517 20.6235 7.33339 20.3412 7.13332 19.99C6.90607 19.5911 6.871 19.065 6.80086 18.0129L6 6M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M14 10V17M10 10V17" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                                </button>
                            </div>`;
                });
            });
        })
    })
}

function showModinFolder(path) {
    window.api.invoke("openExternal", { item: path });
    console.log("Opening mod in folder: " + path);
}

function deleteProfileMod(path, btn) {
    console.log("Deleting mod: " + path);
    window.api.invoke("deleteProfileMod", path).then(success => {
        if (!success) return loadWarning("Failed to delete mod!");

        btn.parentElement.parentElement.remove();
    });
}

function selectProfileViewAddonType() {

}