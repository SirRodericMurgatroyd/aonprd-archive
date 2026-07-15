var x = 0;
var y = 0;
var elem;
var drawer;
var canShrink = true;
function updateMousePos(event) {
    x = event.clientX;
    y = event.clientY;
}
document.addEventListener("mousemove", updateMousePos);
document.addEventListener("mousedown", updateMousePos);

function closeInterrupt(sender, args) {
    args._cancel = (!canShrink) || (x < 250);
}
function handleItemClick(s, a) {
    var i = a.get_item()[0];
    if (i && i.children[0]) {
        var a = i.children[0].href;
        if (i.classList.contains("classic-toggle")) {
            setMenuState('max', true);
        } else if (a) {
            window.location.href = a;
        }
    }
}
function handleGameDropDown(sender, args) {
    var g = args.get_item()._properties._data;
    sender._element.children[0].style.background = "url(" + g.imageUrl + ")"
    sender._element.children[0].setAttribute('title', g.value)
    window.location.href = (g.value == "Pathfinder 1e") ? "https://aonprd.com" : (g.value == "Pathfinder 2e") ? "https://2e.aonprd.com" : (g.value == "Starfinder 2e") ? "https://2e.aonsrd.com" : "https://aonsrd.com"
}
function handleGameDropDownLoad(sender, args) {
    var i = sender._selectedIndex;
    sender._element.children[0].style.background = "url(" + sender._itemData[i].imageUrl + ")"
    sender._element.children[0].setAttribute('title', sender._itemData[i].value)
}

function switchDrawer() {
    if (drawer.visible && canShrink) hide(); else show();
}

function loadDrawerExpandSetting(s, a) {
    try {
        s.set_checked(JSON.parse(getFeature("drawerExpand", "true")));
    } catch {
        s.set_checked(true);
    }
}
function toggleDrawerExpandSetting() {
    try
    {
        canShrink = !JSON.parse(getFeature("drawerExpand", "true"));
    } catch {
        canShrink = false;
    }
    
    applyDrawerExpandSettings(canShrink);
    setFeature("drawerExpand", canShrink);
}

function applyDrawerExpandSettings(s) {
    if (!s) {
        document.querySelector("body").classList.add("fixedSidebar")
    } else {
        document.querySelector("body").classList.remove("fixedSidebar");
    }
}
function loadDrawerHoverSetting(s, a) {
    try {
        s.set_checked(JSON.parse(getFeature("drawerHover", "true")));
    } catch {
        s.set_checked(true);
    }
}
function toggleDrawerHoverSetting() {
    var s;

    try {
        s = JSON.parse(getFeature("drawerHover", "true"));
    } catch {
        s = true;
    }

    applyDrawerHoverSettings(!s);
    setFeature("drawerHover", !s);
}

function loadMenuSetting(s, a) {
    s.set_checked("min"==(getFeature("menu", "min")));
}
function toggleMenuSetting() {
    toggleMenu(event);
}

function loadPreviewsSetting(s, a) {
    s.set_checked("1" == getFeature("link-previews-enabled", "1"));
}
function togglePreviewsSetting() {
    const value = getFeature('link-previews-enabled', '1') == '1' ? '0' : '1';
    setFeature('link-previews-enabled', value);

    const event = new CustomEvent('link-previews-changed', { detail: value });
    document.dispatchEvent(event);
}

function loadSearchBarPreviewsSetting(s, a) {
    s.set_checked('1' == getFeature('search-bar-previews-enabled', '0'));
}
function toggleSearchBarPreviewsSetting() {
    const value = getFeature('search-bar-previews-enabled', '0') == '1' ? '0' : '1';
    setFeature('search-bar-previews-enabled', value);
}

var show = () => drawer.show();
var hide = () => drawer.hide();

function applyDrawerHoverSettings(s) {
    if (!s) {
        elem._element.removeEventListener('mouseover', show);
        elem._element.removeEventListener('mouseleave', hide);
    } else {
        elem._element.addEventListener('mouseover', show);
        elem._element.addEventListener('mouseleave', hide);
    }
}

function getPageCompressSetting() {
    try {
        return JSON.parse(getFeature("pageCompress", "false"));
    } catch {
        return false;
    }
}

function loadPageCompressSetting(s, a) {
    var b = getPageCompressSetting();
    s.set_checked(b);
    applyPageCompressSetting();
}
function togglePageCompressSetting() {
    var s = getPageCompressSetting();
    setFeature("pageCompress", !s);
    applyPageCompressSetting();
}

function applyPageCompressSetting() {
    var s = getPageCompressSetting();
    if (s) {
        document.getElementById("main-wrapper").classList.add("compressed");
    } else {
        document.getElementById("main-wrapper").classList.remove("compressed");
    }
}

function drawerLoad(s, a) {
    elem = document.getElementById("ctl00_RadDrawer1").control;
    drawer = elem.get_kendoWidget();

    try {
        applyDrawerHoverSettings(JSON.parse(getFeature("drawerHover", "true")));
    } catch {
        applyDrawerHoverSettings(true);
    }

    try {
        canShrink = (JSON.parse(getFeature("drawerExpand", "true")) || (window.innerWidth <= 500));
    } catch {
        canShrink = true;
    }
    
    applyDrawerExpandSettings(canShrink);
    var lastExpand = null;
    for (i of drawer.drawerItemsWrapper[0].childNodes[0].children) {
        if (i.classList.contains("expand")) lastExpand = i;
        if (i.children[1] && (i.children[1].href == window.location.href)) {
            if (i.classList.contains("drawerExpand")) {
                lastExpand.classList.add("k-state-selected");
            } else {
                i.classList.add("k-state-selected");
            }
            i.classList.add("current");
        }
    }
}