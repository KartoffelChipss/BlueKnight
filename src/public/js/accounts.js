window.api.invoke('updateAccounts');

window.bridge.updateAccounts((event, data) => {
    console.log("Received accounts: ", data);
    const userLists = document.querySelectorAll(".userlist");

    userLists.forEach((userList) => {
        userList.innerHTML = "";

        userList.innerHTML += `
            <div class="user main" onclick="changeUser('${data.current.id}')" data-id="${data.current.id}">
                <span class="username">${data.current.name}</span>
                <div class="faceBox">
                    <img class="userface" src="https://visage.surgeplay.com/face/512/${data.current.id}">
                    <div class="actionbox red" onclick="removeUser('${data.current.id}')">
                        <svg style="rotate: 45deg;" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe" stroke-width="0.0002"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="#fefefe" fill-rule="evenodd" d="M9 17a1 1 0 102 0v-6h6a1 1 0 100-2h-6V3a1 1 0 10-2 0v6H3a1 1 0 000 2h6v6z"></path> </g></svg>
                    </div>
                </div>
            </div>`;

        data.accounts.forEach((account) => {
            userList.innerHTML += `
                <div class="user" onclick="changeUser('${account.id}')" data-id="${account.id}">
                    <span class="username">${account.name}</span>
                    <div class="faceBox">
                        <img class="userface" src="https://visage.surgeplay.com/face/512/${account.id}">
                        <div class="actionbox red" onclick="removeUser('${account.id}')">
                            <svg style="rotate: 45deg;" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe" stroke-width="0.0002"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="#fefefe" fill-rule="evenodd" d="M9 17a1 1 0 102 0v-6h6a1 1 0 100-2h-6V3a1 1 0 10-2 0v6H3a1 1 0 000 2h6v6z"></path> </g></svg>
                        </div>
                    </div>
                </div>`;
        });

        userList.innerHTML += `
            <div class="user adduser" onclick="addUser()">
                <span class="username" data-lang="accounts_add">${getTranslation("accounts_add")}</span>
                <div class="actionbox green">
                    <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#fefefe" stroke-width="0.0002"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="#fefefe" fill-rule="evenodd" d="M9 17a1 1 0 102 0v-6h6a1 1 0 100-2h-6V3a1 1 0 10-2 0v6H3a1 1 0 000 2h6v6z"></path> </g></svg>
                </div>
            </div>`;
    });
});

function changeUser(id) {
    window.api.invoke('selectAccount', id);
}

function removeUser(id) {
    window.api.invoke('removeAccount', id);
}

function addUser() {
    window.api.invoke('addAccount');
}