let lang = {};

window.bridge.sendLang((event, data) => {
    lang = data;
    console.log("new lang recieved: " + data.selected);
    document.querySelectorAll("[data-lang]").forEach((ele, index) => {
        ele.innerHTML = data[data.selected][ele.dataset.lang] ?? "Missing tranalation";
    });
    document.querySelectorAll("[data-langplaceholder]").forEach((ele, index) => {
        ele.setAttribute("placeholder", data[data.selected][ele.dataset.langplaceholder] ?? "Missing tranalation");
    });
});

function refreshLang() {
    window.api.invoke("getLang");
}

refreshLang();