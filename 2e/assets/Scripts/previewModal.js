var converter = new showdown.Converter()
var domParser = new DOMParser()
var deckCache;

function htmlToElement(html) {
    var html = converter.makeHtml(html)
    var e = domParser.parseFromString(html, "text/html").firstChild
    return e
}
function updateLikeButton(likeButton) {
    if (!getDeck().has(likeButton.getAttribute("data-id"))) {
        likeButton.classList.remove("liked")
        likeButton.title = "Add to Deck of Many Things"
    }
    else {
        likeButton.classList.add("liked")
        likeButton.title = "Remove from Deck of Many Things"
    }
}

function createLikeButton(item,window) {
    var oUL = window._popupElement.getElementsByClassName('rwCommands')[0];
    var oLI = document.createElement("LI");
    var likeButton = document.createElement("span");
    likeButton.setAttribute("data-id") = id
    likeButton.className = "rwCommandButton likeButton";
    updateLikeButton(likeButton)
    oLI.onclick = () => toggleLike(item)
    oLI.className = "rwListItem";
    oLI.appendChild(likeButton)
    oUL.insertBefore(oLI, oUL.firstChild);
}

function loadCache() {
    return deckCache = JSON.parse(getFeature("deckCache", "{}"))
}

function showDeck(show) {
    if (show) $(".RadDrawer_AoNVar").addClass("showDeck")
    else $(".RadDrawer_AoNVar").removeClass("showDeck")
}

function loadDeck() {
    updateDeck(getDeck())
}

function getDeck() {
    var deck = new Set(JSON.parse(getFeature("deckOfManyThings", "[]")))
    return deck
}
function setDeck(deck) {
    setFeature("deckOfManyThings", JSON.stringify(Array.from(deck)))
    updateDeck(deck)
}

function updateCache(deck) {
    var prev = _.keys(deckCache)
    var added = _.difference([...deck], prev)
    if (added.length == 0) return Promise.resolve()
    else {
        console.log(`Caching new items:`, added)
        return fetch(
            "https://elasticsearch.aonprd.com/aon-test/_mget",
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: `{"docs":[${Array.from(added).map(d => `{"_id":"${d}"}`).join(",")}]}`,
            }
        )
            .catch(error => console.log(error.response.data))
            .then(response => response.json())
            .then(data => data.docs.map(d => d._source))
            .then(data => data.forEach(i => deckCache[i.id] = i))
            .then(() => setFeature("deckCache", JSON.stringify(deckCache)))
    }
          

}

function updateDeck(deck) {
    updateCache(deck).then(() => updateMenuDropdown(deck))
    Array.from(document.getElementsByClassName("likeButton")).forEach(updateLikeButton)          
    // TODO: fix deck
    //document.getElementById("deck-count").innerHTML = (deck.size < 10 ? deck.size :"+")
}

//function getDeckPreviewSetting() { return '1' == getFeature("deck-previews-enabled", '0') }

//function loadDeckPreviewsSetting(s, a) {
//    s.set_checked(getDeckPreviewSetting())

//}
//function toggleDeckPreviewsSetting(s, a) {
//    const value = getDeckPreviewSetting() ? '0' : '1';
//    setFeature("deck-previews-enabled", value)
//    loadDeck()
//}

function updateMenuDropdown(ids) {
    var data = [...ids].map(id => deckCache[id])
    var menu = _.map(_.groupBy(data, 'category'),
        ((v, c) => (
            (`<li data-role='drawer-item' class="k-drawer-item expand section">
                                <a class="k-icon number">${v.length}</a>
                                <a class='k-item-text'>${c.replace(/(?<= )[^\s]|^./g, a => a.toUpperCase())}</a>
                            </li>`)
                .concat("<div>"+v.map(i => (`<li data-role='drawer-item' class="k-drawer-item drawerExpand">
                                <span class="k-icon likeButton liked" data-id="${i.id}" onClick="toggleLike()"></span>
                                <a class='k-item-text' href="${i.url}">${i.name}</a>
                             
                            </li>`)).join("\n")
                +"</div>")
        ))
    ).join("\n")
    $("#deck-list").html(menu + (`<li data-role='drawer-item' id="deck-close" class="k-drawer-item section" onclick="showDeck(false)">
                            <a class="k-icon">&#xe100</a>
                            <a class='k-item-text' style="white-space:nowrap">Close Deck</a>
                        </li>`))
}

function toggleLike() {
    var id = event.target.getAttribute("data-id")
    console.log(event,id)
    var d = getDeck()
    var like = d.has(id)
    if (like) d.delete(id)
    else d.add(id)
    setDeck(d)
}

function openWindowFor(id) {
    fetch(
        "https://elasticsearch.aonprd.com/aon-test/_mget",
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: `{"docs":[{"_id":"${id}"}]}`,
        }
    )
        .then(response => response.json())
        .then(data => data.docs.map(s => {
            let i = s._source
            let body = htmlToElement(i.markdown);
            let title = [i.category, i.item_category, i.item_subcategory, i.subcategory, i.name].filter(x => x).map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(" / ")
            let wEst = Math.max(800, title.length * 12)
            let hEst = Math.min(720, Math.max(220, 24 * (i.markdown.length / (wEst / 12))))
            let w = GetRadWindowManager().open(null, i.name, body, wEst, hEst, 0, 0)
            w.set_title(title)
            w.set_destroyOnClose(true)
            w.set_keepInScreenBounds(true)
            w.set_behaviors(Telerik.Web.UI.WindowBehaviors.Move
                + Telerik.Web.UI.WindowBehaviors.Minimize
                + Telerik.Web.UI.WindowBehaviors.Pin
                + Telerik.Web.UI.WindowBehaviors.Close)
            w.center()
            createLikeButton(id,w)  
        }))
        .catch(error => {
            console.log('Error:', error);
        });
}

function bootupDOMT() {
    console.log("Setting timeout for Loading Deck")
    setTimeout(() => {
        console.log("Loading Deck")
        loadCache()
        loadDeck()
        setupStorageListener()
    },500)
}

function setupStorageListener() {
    window.addEventListener('storage', (e) => {
        console.log("storageEvent", e.key)
        switch (e.key) {
            case "deckOfManyThings":
                loadDeck()
                break;
            case "theme":
            case "feel":
                applyThemeFeel()
            break;
            case "pageCompress":
                applyPageCompressSetting()
            break;
        }
    });
}

bootupDOMT()