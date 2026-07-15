function initiateToggle(el) {
    el.addEventListener("change", toggleTheme);
    var theme = getFeature("theme", "dark");
    if (theme === "dark") {
        goDark();
    } else {
        el.checked = true;
        goLight();
    }
}

function toggleTheme() {
    var theme = getFeature("theme", "dark");
    if (theme === "dark") {
        goLight();
    } else if (theme === "light") {
        goDark();
    }
}

function initializeMenuToggle(el) {
    el.addEventListener("click", toggleMenu);
    setMenuState(getFeature("menu", "max"));
}

function toggleMenu(event) {
    var oldState = getFeature("menu", "min");
    var newState = oldState == "min" ? "max" : "min";
    setMenuState(newState);
    event.preventDefault();
    return false;
}

function setMenuState(newState) {
    var main = document.getElementById('main-wrapper');
    var menu = document.getElementById('main-menu');

    if (newState === "min") {
        main.classList.remove('old');
        menu.classList.remove('old');
        document.getElementById('minMaxMenu').innerText = "Maximize Menu";
    } else {
        main.classList.add('old');
        menu.classList.add('old');
        document.getElementById('minMaxMenu').innerText = "Minimize Menu";
    }
    setFeature("menu", newState);
}


function goLight() {
    document.getElementsByTagName("body")[0].className = document.getElementsByTagName("body")[0].className.replace(/(?:^|\s)dark(?!\S)/g, 'light');
    setFeature("theme", "light");
}

function goDark() {
    document.getElementsByTagName("body")[0].className = document.getElementsByTagName("body")[0].className.replace(/(?:^|\s)light(?!\S)/g, 'dark');
    setFeature("theme", "dark");
}


function getFeature(featureName, defaultValue) {
    if (window.localStorage) {
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

function setFeature(featureName, value) {
    if (window.localStorage) {
        window.localStorage.setItem(featureName, value);
    } else {
        return getFeatureFromCookie(featureName, defaultValue);
    }
}

function migrateSavedCookieToLocalStorage(featureName, value) {
    window.localStorage.setItem(featureName, value);
    document.cookie = featureName + "=; Expires=" + expiryTime(-1) + ";";
}

function getFeatureFromCookie(featureName) {
    var name = featureName + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return null;
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