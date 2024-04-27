var tabs = {

    class: {
        bar: 'addontypes',
        tab: 'addontypes--tab',
        line: 'addontypes--line',
        active: '-active'
    },

    colorAttribute: 'data-tab-color',

    select: function (_tab) {
        var parent = _tab.parentElement;
        var selected = parent.querySelector('.' + tabs.class.active);
        var line = parent.querySelector('.' + tabs.class.line);
        var tabColor = _tab.getAttribute(tabs.colorAttribute);

        if (tabColor) {
            line.style.backgroundColor = tabColor;
        } else {
            line.style.backgroundColor = null;
        }

        if (selected) {
            selected.classList.remove(tabs.class.active);
        }

        line.style.left = _tab.offsetLeft + 'px';
        line.style.width = _tab.offsetWidth + 'px';

        _tab.classList.add(tabs.class.active);
    },

    setUp: function (_tabBar) {
        var allTabs = _tabBar.querySelectorAll('.' + tabs.class.tab);

        for (var i = 0, ii = allTabs.length; i < ii; i++) {
            allTabs[i].addEventListener('click', function () {
                tabs.select(this);
            }, false);
        }

        tabs.select(allTabs[0]);
    },

    init: function () {
        var tabBars = document.querySelectorAll('.' + tabs.class.bar);

        for (var i = 0, ii = tabBars.length; i < ii; i++) {
            tabs.setUp(tabBars[i]);
        }
    }
};

window.addEventListener("load", () => {
    tabs.init();
});