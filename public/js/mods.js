const modlist = document.getElementById("modlist");
const searchInput = document.getElementById("searchInput");

function searchMods(query, offset, limit, goingBack) {
    let profileSelectBtn = document.getElementById("profileSelectBtn");

    if (offset === undefined || offset < 0) offset = 0;
    if (limit === undefined || limit < 10) limit = 10;

    let queryString = "";
    if (query) queryString = `&query=${query}`;

    let modPageNum = (Number(document.getElementById("modPageNum").innerHTML) ?? 0);

    let newPageNum = modPageNum + 1;

    if (offset === undefined || offset <= 0) newPageNum = 1;

    if (goingBack && goingBack === true) newPageNum = modPageNum - 1;

    console.log("Loading mods page "+ modPageNum + ":")
    console.log(`https://api.modrinth.com/v2/search?facets=[[%22categories:${profileSelectBtn.dataset.loader}%22],["versions:${profileSelectBtn.dataset.loader}"],[%22project_type:mod%22]]&offset=${offset}&limit=${limit}${queryString}`)

    fetchAsync(`https://api.modrinth.com/v2/search?facets=[[%22categories:${profileSelectBtn.dataset.loader}%22],["versions:${profileSelectBtn.dataset.version}"],[%22project_type:mod%22]]&offset=${offset}&limit=${limit}${queryString}`).then((data) => {
        modlist.innerHTML = "";

        if (!data || !data.hits) {
            searchMods(searchInput.value ?? "")
            return;
        }

        data.hits.forEach((mod, index) => {
            modlist.innerHTML += `<div class="modbox">
                <div style="display: flex; align-items: center;">
                    <img src="${mod.icon_url}">
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
                            </div>
                        </h3>
                        <p>${mod.description}</p>
                        
                    </div>
                </div>
                <div class="buttons">
                    <button type="button" onclick="downloadMod('${mod.project_id}')">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12.5 4V17M12.5 17L7 12.2105M12.5 17L18 12.2105" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M6 21H19" stroke="#fefefe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                    </button>
                </div>
            </div>`;
        });

        modlist.innerHTML += `<div class="pagination">
            <button type="button" id="prevButton" onclick="searchMods('${searchInput.value ?? ""}', ${offset - 10}, ${limit}, true)">
                <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 4l-6 6 6 6"></path> </g></svg>
            </button>
            <span id="modPageNum">${newPageNum}</span>
            <button type="button" id="nextButton" onclick="searchMods('${searchInput.value ?? ""}', ${offset + 10}, ${limit})">
                <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l6-6-6-6"></path> </g></svg>
            </button>
        </div>`;

        modlist.scrollTop = 0;
    });
}

searchMods()

function clearSearch() {
    searchInput.value = "";
    searchMods();
}

window.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.keyCode === 13) && document.activeElement === searchInput) {
        searchMods(searchInput.value);
    }
})