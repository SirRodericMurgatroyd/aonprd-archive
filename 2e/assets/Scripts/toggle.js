function initShelynsCorner() {
    document.querySelectorAll('.theme-open').forEach(open => open.addEventListener('click', openThemeWindow));
    document.querySelector('.shelyns-corner-wrapper .close-shelyns-corner').addEventListener('click', closeThemeWindow);

    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-remaster').addEventListener('change', toggleCore);
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-dyslexia').addEventListener('change', toggleDyslex);
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-sidebar-hover').addEventListener('change', toggleSidebarHover);
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-sidebar-shrink').addEventListener('change', toggleSidebarAllowShrink);
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-page-compress').addEventListener('change', togglePageCompressSetting);
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-modern-menu').addEventListener('change', toggleMenuSetting);
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-link-previews').addEventListener('change', togglePreviewsSetting);
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-link-previews-search').addEventListener('change', toggleSearchBarPreviewsSetting);
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-orc').addEventListener('change', toggleOrc);
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-boar').addEventListener('change', toggleBoar);

    applyCore(getCore());
    applyDyslex(getDyslex());
    applySidebarHover(getSidebarHover());
    applySidebarAllowShrink(getSidebarAllowShrink());
    applyPageCompressSetting(getPageCompressSetting());
    applyOrc(getOrc());
    applyBoar(getBoar());
}

function openThemeWindow() {
    const useRemaster = !getCore();
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-remaster').checked = useRemaster;

    const useDyslexiaFriendlyFonts = getDyslex();
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-dyslexia').checked = useDyslexiaFriendlyFonts;

    const useSidebarHover = getSidebarHover();
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-sidebar-hover').checked = useSidebarHover;

    const allowSidebarShrink = getSidebarAllowShrink();
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-sidebar-shrink').checked = allowSidebarShrink;

    const usePageCompress = getPageCompressSetting();
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-page-compress').checked = usePageCompress;

    const useModernMenu = 'min' === getFeature("menu", "min");
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-modern-menu').checked = useModernMenu;

    const useLinkPreviews = "1" === getFeature("link-previews-enabled", "1");
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-link-previews').checked = useLinkPreviews;

    const useLinkPreviewsInSearch = '1' === getFeature('search-bar-previews-enabled', '0')
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-link-previews-search').checked = useLinkPreviewsInSearch;

    const useOrc = getOrc();
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-orc').checked = useOrc;

    const useBoar = getBoar();
    document.querySelector('.shelyns-corner-wrapper #shelyns-corner-setting-boar').checked = useBoar;

    document.querySelector('.shelyns-corner-wrapper').classList.toggle('is-shown');

    const themeGalleryWrapper = document.querySelector('.shelyns-corner-wrapper .theme-gallery-wrapper');

    if (!themeGalleryWrapper.querySelector('.theme-gallery')) {
        window.fetch('/theme-gallery').then(async response => {
            const dummyElement = document.createElement('div');
            dummyElement.innerHTML = await response.text();

            const themeGallery = dummyElement.querySelector('.theme-gallery');

            if (themeGallery) {
                themeGalleryWrapper.innerHTML = '';
                themeGalleryWrapper.appendChild(themeGallery);
            }
        });
    }

    document.querySelector('.shelyns-corner-wrapper .shelyns-corner').scrollIntoView();
}

function closeThemeWindow() {
    document.querySelector('.shelyns-corner-wrapper').classList.remove('is-shown');
}

function toggleTheme() {
    var theme = getFeature("theme", "dark");
    if (theme === "dark") {
        goLight();
    } else if (theme === "light") {
        goDark();
    }
}
function loadTheme() {
    applyThemeFeel()
}
function setTheme(theme) {
    setFeature("theme", theme);
    applyThemeFeel();
}
function setFeel(feel) {
    setFeature("feel", feel);
    applyThemeFeel();
}

function applyThemeFeel() {
    var b = document.body;
    var old = Array.from(b.classList).filter(c => !c.includes("_theme") && !c.includes("_feel"))
    var theme = (getFeature("theme", ""));
    var feel = (getFeature("feel", "classic_feel"));
    document.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }));
    document.dispatchEvent(new CustomEvent('feel-changed', { detail: feel }));
    b.className = old.concat(theme,feel).join(" ")
}
function getCore() { return '1' == getFeature("LegacyMode", '0',true) }
function applyCore(legacy) {
    var b = document.body;
    if (!legacy) b.classList.add("remastered_core")
    else b.classList.remove("remastered_core")
}
function loadCore(s, a) {
    console.log("loadCore", s, a)
    var legacy = getCore()
    s.set_checked(!legacy)
    applyCore(legacy)
}

function toggleCore(s, a) {
    const value = getCore() ? '0' : '1';
    setFeature("LegacyMode", value,true)
    applyCore(value == '1')
    window.location.replace(window.location.href);
}
function getDyslex() { return '1' == getFeature("dyslex", '0') }
function applyDyslex(dyslex) {
    var b = document.body;
    if (dyslex) b.style.setProperty("--font-1", "Andika", "important")
    else b.style.removeProperty("--font-1");
}
function loadDyslex(s, a) {
    console.log("loadDyslex", s, a)
    var dyslex = getDyslex()
    s.set_checked(dyslex)
    applyDyslex(dyslex)
}

function toggleDyslex(s, a) {
    const value = getDyslex() ? '0' : '1';
    setFeature("dyslex", value)
    applyDyslex(value == '1')
}

function getOrc() { return '1' == getFeature("orc", '0') }
function applyOrc(orc) {
    var b = document.body;
    if (orc) b.classList.add("orc_mode")
    else b.classList.remove("orc_mode")
}
function loadOrc(s, a) {
    console.log("loadOrc",s,a)
    var orc = getOrc()
    s.set_checked(orc)
    applyOrc(orc)
}

function toggleOrc(s, a) {
    const value = getOrc() ? '0' : '1';
    setFeature("orc", value)
    applyOrc(value == '1')
}

function getBoar() {
    return '1' == getFeature("boar", '0')
}

function applyBoar(boar) {
    var b = document.body;
    if (boar) b.classList.add("boar_mode")
    else b.classList.remove("boar_mode")
}

function loadBoar(s, a) {
    console.log("loadBoar",s,a)
    var boar = getBoar()
    s.set_checked(boar)
    applyBoar(boar)
}

function toggleBoar(s, a) {
    const value = getBoar() ? '0' : '1';
    setFeature("boar", value)
    applyBoar(value == '1')
}

function initializeMenuToggle(el) {
    var isMobile = window.innerWidth <= 500;
    if (isMobile)
        setMenuState('min')
    else
        setMenuState(getFeature("menu", "min"));
}

function toggleMenu(event) {
    var oldState = getFeature("menu", "min");
    var newState = oldState == "min" ? "max" : "min";
    setMenuState(newState);
    event.preventDefault();
    return false;
}

function setMenuState(newState,refresh=false) {
    var main = document.getElementById('main-wrapper');
    var menu = document.getElementById('main-menu');

    if (newState == "min") {
        document.body.classList.remove('old');
        main.classList.remove('old');
        menu.classList.remove('old');
        // setVisible("ctl00_RadDrawer1", true)
        setVisible("main-menu", false)
        document.getElementById('minMaxMenu').innerText = "Maximize Menu";
    } else {
        main.classList.add('old');
        menu.classList.add('old');
        //setVisible("ctl00_RadDrawer1", false)
        setVisible("main-menu", true)
        document.body.classList.add('old');
        document.getElementById('minMaxMenu').innerText = "Modern Menu";
    }
    if (refresh) {
        location.reload();
    }
    setFeature("menu", newState);
}

function getSidebarHover() {
    return 'true' === getFeature('drawerHover', 'true');
}

function applySidebarHover(sidebarHover) {
    if (sidebarHover) {
        document.body.classList.remove('modern-menu-no-hover-expand');
    } else {
        document.body.classList.add('modern-menu-no-hover-expand');
    }
}

function toggleSidebarHover() {
    const value = getSidebarHover() ? 'false' : 'true';
    setFeature('drawerHover', value)
    applySidebarHover(value === 'true')
}

function getSidebarAllowShrink() {
    return 'true' === getFeature('drawerExpand', 'true');
}

function applySidebarAllowShrink(allowShrink) {
    if (allowShrink) {
        document.body.classList.remove('modern-menu-always-expanded');
    } else {
        document.body.classList.add('modern-menu-always-expanded');
    }
}

function toggleSidebarAllowShrink() {
    const value = getSidebarAllowShrink() ? 'false' : 'true';
    setFeature('drawerExpand', value)
    applySidebarAllowShrink(value === 'true')
}

function getFeature(featureName, defaultValue, useCookie=false) {
    if (window.localStorage && !useCookie) {
        var value = window.localStorage.getItem(featureName);
        if (value === null) {
            value = getFeatureFromCookie(featureName, defaultValue);
            if (value != null)
                migrateSavedCookieToLocalStorage(featureName, value)
        }

        if (value == null)
            return defaultValue;
        else
            return value;
    } else {
        return getFeatureFromCookie(featureName, defaultValue);
    }
}

function setFeature(featureName,value, useCookie = false) {
    if (window.localStorage && !useCookie) {
        window.localStorage.setItem(featureName, value);
    } else {
        return setFeatureToCookie(featureName,value);
    }
}

function migrateSavedCookieToLocalStorage(featureName, value) {
    window.localStorage.setItem(featureName, value);
    document.cookie = featureName + "=; Expires=" + expiryTime(-1) + ";";
}

function getFeatureFromCookie(featureName,defaultValue) {
    var name = featureName + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return defaultValue;
}

function setFeatureToCookie(featureName, value) {
    document.cookie = featureName + "=" + value + "; Expires=" + expiryTime(500) + ";";
}

function expiryTime(days) {
    var d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    return expires;
}


loadTheme();
