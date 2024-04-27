let lang = {};

window.bridge.sendLang((event, data) => {
    lang = data;
    console.log("new lang recieved: " + data.selected);
    document.querySelectorAll("[data-lang]").forEach((ele, index) => {
        ele.innerHTML = data[data.selected][ele.dataset.lang] ?? "Missing translation";
    });
    document.querySelectorAll("[data-langplaceholder]").forEach((ele, index) => {
        ele.setAttribute("placeholder", data[data.selected][ele.dataset.langplaceholder] ?? "Missing translation");
    });
    document.querySelectorAll("[data-langtitle]").forEach((ele, index) => {
        ele.setAttribute("title", data[data.selected][ele.dataset.langtitle] ?? "Missing translation");
    });
});

function refreshLang() {
    window.api.invoke("getLang");
}

refreshLang();

function getTranslation(key) {
    return lang[lang.selected] ? lang[lang.selected][key] ?? "Missing translation" : "Missing translation";
}