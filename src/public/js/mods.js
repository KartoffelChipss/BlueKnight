const modlist = document.getElementById("modlist");
const searchInput = document.getElementById("searchInput");

let retries = 0;

const mrProjectTypes = {
    mods: "mod",
    modpacks: "modpack",
    resourcepacks: "resourcepack",
    shaders: "shader"
}

function getPaginationButtons(query, page) {
    return `<div class="pagination">
                <button type="button" id="prevButton" onclick="searchAddons('${query}', ${page - 1 < 0 ? 0 : page - 1})">
                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 4l-6 6 6 6"></path> </g></svg>
                </button>
                <span id="modPageNum">${page + 1}</span>
                <button type="button" id="nextButton" onclick="searchAddons('${query}', ${page + 1})">
                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l6-6-6-6"></path> </g></svg>
                </button>
            </div>`;
}

function searchAddons(query, page) {
    const resourceType = document.getElementById("selected_addontype").value ?? "mods";
    const resourceTypeTranslated = getTranslation(`addons_${resourceType}`) ?? "Mods";
    const mrResourceType = mrProjectTypes[resourceType];
    const currentprofile_loader = document.getElementById("currentprofile_loader").value || "fabric";
    const currentprofile_version = document.getElementById("currentprofile_version").value;

    console.log(`Searching for query: "${query}", page: "${page}" and type: "${resourceType}"`)

    modlist.innerHTML = "";

    let searchOptions = {
        query: "",
        offset: "",
        limit: "&limit=10",
        loaderCategory: "",
        version: "",
        index: "&index=downloads"
    }

    if (query === undefined || query === null) query = "";
    if (page === undefined || page < 0) page = 0;

    searchOptions.offset = `&offset=${page * 10}`;

    searchOptions.query = `&query=${query}`;

    if (currentprofile_loader === "vanilla" && (resourceType === "mods" || resourceType === "modpacks" || resourceType === "shaders")) {
        modlist.innerHTML = `<div class="noMods">
            <h2>Keine ${resourceTypeTranslated} für Vanilla</h2>
            <p>${resourceTypeTranslated} sind nur für Fabric, Quilt oder Forge verfügbar.</p>
        </div>`;
        modlist.innerHTML += getPaginationButtons(query, page);
        return;
    }

    if (currentprofile_version) searchOptions.version = `[%22versions:${currentprofile_version}%22],`;

    if (resourceType === "mods" || resourceType === "modpacks") searchOptions.loaderCategory = `[%22categories:${currentprofile_loader}%22],`;

    const searchUrlOptions = `facets=[${searchOptions.loaderCategory}${searchOptions.version}[%22project_type:${mrResourceType}%22]]${searchOptions.index}${searchOptions.offset}${searchOptions.limit}${searchOptions.query}`;

    console.log("Search URL: " + searchUrlOptions)

    window.api.invoke("searchMods", { options: searchUrlOptions }).then((data) => {
        modlist.innerHTML = "";
        
        if (!data || !data.hits) {
            console.log(`No hits for query: "${query}", page: "${page}" and type: "${resourceType}"`);
            modlist.innerHTML = getPaginationButtons(query, page);
            return;
        }

        console.log(`Recieved ${data.hits.length} hits for query: "${query}", page: "${page}" and type: "${resourceType}"`)

        data.hits.forEach((mod, index) => {
            if (!mod) return;
            modlist.innerHTML += `<div class="modbox">
                <div style="display: flex; align-items: center;">
                    <img src="${mod.icon_url}" onerror="this.src='./img/noicon.svg'">
                    <div class="desc">
                        <h3>
                            ${mod.title}
                            <div class="tags">
                                <div class="tag">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M8 9C8 6.79086 9.79086 5 12 5C14.2091 5 16 6.79086 16 9C16 11.2091 14.2091 13 12 13C9.79086 13 8 11.2091 8 9ZM15.8243 13.6235C17.1533 12.523 18 10.8604 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 10.8604 6.84668 12.523 8.17572 13.6235C4.98421 14.7459 3 17.2474 3 20C3 20.5523 3.44772 21 4 21C4.55228 21 5 20.5523 5 20C5 17.7306 7.3553 15 12 15C16.6447 15 19 17.7306 19 20C19 20.5523 19.4477 21 20 21C20.5523 21 21 20.5523 21 20C21 17.2474 19.0158 14.7459 15.8243 13.6235Z" fill="#fefefe"></path> </g></svg>
                                    <span>${mod.author}</span>
                                </div>
                                <div class="tag">
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12.5 4V17M12.5 17L7 12.2105M12.5 17L18 12.2105" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M6 21H19" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                                    <span>${mod.downloads.toLocaleString(undefined)}</span>
                                </div>
                                <button class="tag" onclick="openExternalLink('https://modrinth.com/mod/${mod.project_id}')">
                                    <svg fill="#fefefe" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe" stroke-width="0.192"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" d="M19,14 L19,19 C19,20.1045695 18.1045695,21 17,21 L5,21 C3.8954305,21 3,20.1045695 3,19 L3,7 C3,5.8954305 3.8954305,5 5,5 L10,5 L10,7 L5,7 L5,19 L17,19 L17,14 L19,14 Z M18.9971001,6.41421356 L11.7042068,13.7071068 L10.2899933,12.2928932 L17.5828865,5 L12.9971001,5 L12.9971001,3 L20.9971001,3 L20.9971001,11 L18.9971001,11 L18.9971001,6.41421356 Z"></path> </g></svg>
                                </button>
                            </div>
                        </h3>
                        <p>${mod.description}</p>
                        
                    </div>
                </div>
                <div class="buttons">
                    <button type="button" onclick="downloadAddon(this, '${mod.project_id}', '${resourceType}')">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12.5 4V17M12.5 17L7 12.2105M12.5 17L18 12.2105" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M6 21H19" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                    </button>
                </div>
            </div>`;
        });

        modlist.innerHTML += getPaginationButtons(query, page);

        modlist.scrollTop = 0;
    });
}

searchAddons();

function clearSearch() {
    searchInput.value = "";
    searchAddons();
}

function resetModDownladBtn() {
    let modDownloadButton = document.getElementById("modDownloadButton");
    if (modDownloadButton.hasAttribute("disabled")) modDownloadButton.removeAttribute("disabled");
    modDownloadButton.innerHTML = "Herunterladen";
}

function closeDownloadModModal() {
    let downloadModModal = document.getElementById("downloadModModal");
    resetModDownladBtn();
    if (downloadModModal.classList.contains("_shown")) downloadModModal.classList.remove('_shown');
}

function showDownloadMod(modid) {
    let downloadModModal = document.getElementById("downloadModModal");
    let modDownloadButton = document.getElementById("modDownloadButton");

    downloadModModal.classList.add("_shown");

    resetModDownladBtn();
    modDownloadButton.setAttribute("onclick", `downloadMod('${modid}')`);
}

function resetDownloadButton(btn) {
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12.5 4V17M12.5 17L7 12.2105M12.5 17L18 12.2105" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M6 21H19" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`;
    btn.removeAttribute("disabled");
}

function downloadAddon(button, addonId, addonType) {
    console.log(`Downloading ${addonType} with id: ${addonId}`);

    button.setAttribute("disabled", true);

    button.innerHTML = `<svg version="1.1" id="L9" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
            <path fill="#fff" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
                <animateTransform 
                attributeName="transform" 
                attributeType="XML" 
                type="rotate"
                dur="1s"
                from="0 50 50"
                to="360 50 50" 
                repeatCount="indefinite" />
            </path>
        </svg>`;
        
    window.api.invoke("downloadAddon", { addonId, addonType })
        .then((success) => {
            console.log(success)
            if (success) {
                console.log("Successfull downlaod");
                button.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 5L8 15l-5-4"></path> </g></svg>`;
                setTimeout(() => {
                    resetDownloadButton(button);
                }, 500)
            } else {
                console.log("Error while downloading addon!");
                loadWarning(getTranslation("err_download"));
                resetDownloadButton(button);
            }
        })
        .catch((error) => {
            console.log("Error while downloading addon: ", error);
            loadWarning(getTranslation("err_download"));
            resetDownloadButton(button);
        })
}

function downloadMod(modid) {
    let modDownloadButton = document.getElementById("modDownloadButton");
    let targetProfileMatsch = document.getElementById("modDownloadProfileSelect").value;

    let targetProfileSplit = targetProfileMatsch.split("?");
    let targetProfile = targetProfileSplit[0];
    let modversion = targetProfileSplit[1];

    console.log(targetProfile + " " + modversion)

    fetchAsync(`https://api.modrinth.com/v2/project/${modid}/version`).then(data => {
        if (!data) return;

        let availableversionspre = data.filter(ver => ver.game_versions.includes(modversion));

        if (availableversionspre.length <= 0) {
            loadWarning(`Nicht für Version ${modversion} verfügbar!`);
            console.log("[DOWNLOADS] No plugin version for your mc version!");
            return;
        }

        const modloader = document.getElementById("currentprofile_loader").value || "fabric";

        let availableversions = availableversionspre.filter(ver => ver.loaders.includes(modloader));

        if (availableversions.length <= 0) {
            loadWarning(`Nicht für ${capitalizeFirstLetter(modloader)} in Minecraft ${modversion} verfügbar!`);
            console.log("[DOWNLOADS] No plugin version for you loader and mc version!");
            return;
        }

        let versiontoDownload = availableversions[0];
        let filetoDownload = versiontoDownload.files[0];

        modDownloadButton.setAttribute("disabled", true);
        modDownloadButton.innerHTML = `<svg version="1.1" id="L9" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
            viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
            <path fill="#fff" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
                <animateTransform 
                attributeName="transform" 
                attributeType="XML" 
                type="rotate"
                dur="1s" 
                from="0 50 50"
                to="360 50 50" 
                repeatCount="indefinite" />
            </path>
        </svg>`;

        window.api.invoke("downloadMod", {
            targetProfile,
            modid,
            modversion,
            modversionid: versiontoDownload.id,
            filetoDownload
        });
    });
}

window.bridge.modDownloadResult((event, data) => {
    let modDownloadButton = document.getElementById("modDownloadButton");

    if (data.result === "success") {
        console.log("Successfull downlaod");
        modDownloadButton.innerHTML = `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 5L8 15l-5-4"></path> </g></svg>`;
        setTimeout(() => {
            closeDownloadModModal();
        }, 500)
    }

    if (data.result === "error") {
        resetModDownladBtn();
        console.log("Successfull downlaod");
    }
})

window.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.keyCode === 13) && document.activeElement === searchInput) {
        console.log("Search for: " + searchInput.value)
        searchAddons(searchInput.value);
    }
});

function capitalizeFirstLetter(str) {
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function selectAddonType(type) {
    document.getElementById("selected_addontype").value = type;
    document.getElementById("searchInput").setAttribute("placeholder", getTranslation(`addons_${type}_search`))
    searchAddons(searchInput.value);
}