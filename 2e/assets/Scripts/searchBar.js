var searchEnabled = true;

function doSearch(s) {
    if (searchEnabled) window.location = window.location.origin + "/Search.aspx?q=" + encodeURIComponent(s);
}
function doJump(s) {
    if (searchEnabled) window.location = window.location.origin + "/Search.aspx?q=" + encodeURIComponent(s) + "&teleport=true";
}
function toggleVisible(target) {
    var tgt = document.getElementById(target);
    tgt.setAttribute("aria-hidden", !(tgt.getAttribute("aria-hidden") == 'true'))
}
function setVisible(target, bool) { document.getElementById(target).setAttribute("aria-hidden", !bool)}
function getVisible(target) { return document.getElementById(target).getAttribute("aria-hidden") != 'true'}

function setEnabled(target, bool) { document.getElementById(target).setAttribute("disabled", !bool) }
function getEnabled(target) { return document.getElementById(target).getAttribute("disabled") != 'true' }

function searchButtonClick() {
    var open = getVisible('searchTextContainer')
    if (!open) { document.getElementById("searchText").focus() }
    toggleVisible('searchTextContainer')
    var s = document.getElementById("searchText").value;
    if ((s.length > 0) && open) {
        doSearch(s)
    }
}

function jumpButtonClick() {
    toggleVisible('searchTextContainer')
    var s = document.getElementById("searchText").value;
    if (s.length > 0) {
        doJump(s)
    }
}

function enterSearch(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        var s = e.target.value;
        if (s.length > 0) {
            doSearch(s)
        }
    }
}

function initializeSearchBar() {
    var searchBar = document.getElementById("searchText");

    searchBar.addEventListener("keydown", enterSearch);
}

function priceConversion(hit) {
    const i = hit.price
    if (i < 1) return "Free"
    var c = i % 10;
    var s = Math.floor(i / 10) % 10;
    var g = Math.floor(i / 100);
    //var p = Math.floor(i / 1000);
    var str = ""
    if (c > 0) str = `${c} cp ` + str
    if (s > 0) str = `${s} sp ` + str
    if (g > 0) str = `${g} gp ` + str
    //if (p > 0) str = `${p} pp ` + str

    if ('level' in hit) str = `<span>Level ${hit.level}<span/><br>` + str
    return str

}
const customTraits = new Set(["Uncommon", "Rare", "Unique"])
const alignmentTraits = new Set([
    "LG", "NG", "CG",
    "LN", "N", "CN",
    "LE", "NE", "CE"
])
const sizeTraits = new Set(["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"])
function traitClass(trait) {
    if (customTraits.has(trait)) return "trait" + trait.toLowerCase()
    if (alignmentTraits.has(trait)) return "traitalignment"
    if (sizeTraits.has(trait)) return "traitsize"
    return "trait"
}
function pfsIcon(pfs) {
    switch (pfs) {
        case "Standard": return '<img alt="PFS Standard" title="PFS Standard" style=" height: 1.3em;width: 1.3em;margin-bottom: -0.3em;" src="Images\\Icons\\PFS_Standard.png">'
        case "Limited": return '<img alt="PFS Limited" title="PFS Limited" style=" height: 1.3em;width: 1.3em;margin-bottom: -0.3em;" src="Images\\Icons\\PFS_Limited.png">'
        case "Restricted": return '<img alt="PFS Restricted" title="PFS Restricted" style=" height: 1.3em;width: 1.3em;margin-bottom: -0.3em;" src="Images\\Icons\\PFS_Restricted.png">'
        default: return ""
    }
}

function weaponSearchPreview(weapon) {
    weapon.name +=
        `<div class="extra-info">${weapon.hands}-Handed ${weapon.weapon_category} ${weapon.weapon_group} ${weapon.damage}
                ${weapon.range_raw != undefined ? "&emsp; Range: " + weapon.range_raw : ""}
                ${weapon.reload_raw != undefined ? "Reload: " + weapon.reload_raw : ""} </div>`
}

function creatureSearchPreview(creature) {
    creature.price = `<span>Level ${creature.level}<span/>
                      <br>${creature.hp} HP`   
    creature.name +=
        `<div class="extra-info">
            <b>AC</b> ${creature.ac}
            <b>&emsp;Fort</b> +${creature.fortitude_save} 
            <b>&emsp;Ref</b> +${creature.reflex_save} 
            <b>&emsp;Will</b> +${creature.will_save}
            <b>&emsp;Perception</b> +${creature.perception}
            ${creature.weakness_raw != undefined ? `<br><b>Weakness:</b> ${creature.weakness_raw}` : ""}
            ${creature.resistance_raw != undefined ? `<br><b>Resistance:</b> ${creature.resistance_raw}` : ""}
            ${creature.immunity!= undefined && creature.immunity.length ? `<br><b>Immunity:</b> ${creature.immunity.join(", ")}` : ""}
        </div>`
}

function actionsFor(actions) {
    switch ((actions ?? "").trim()) {
        case "": return ""
        case "Single Action": return ' <span class="action" title="Single Action" role="img" aria-label="Single Action">[one-action]</span> '
        case "Two Actions": return ' <span class="action" title="Two Actions" role="img" aria-label="Two Actions">[two-actions]</span> '
        case "Three Actions": return ' <span class="action" title="Three Actions" role="img" aria-label="Three Actions">[three-actions]</span> '
        case "Reaction": return ' <span class="action" title="Reaction" role="img" aria-label="Reaction">[reaction]</span> '
        case "Free Action": return ' <span class="action" title="Free Action" role="img" aria-label="Free Action">[free-action]</span> '
    }
    if (actions.includes("to")){
        return actions.split("to").map(actionsFor).join(" to ")
    }
    if (actions.includes(" or more Actions")) {
        return actionsFor(actions.split(" or more Actions")[0]).trim() + "+ "
    }
    if (actions.includes(" or ")) {
        return actions.split(" or ").map(actionsFor).join(" or ")
    }
    return `<i class="ra ra-hourglass" title="${actions}" role="img" aria-label="${actions}"></i> `

}

function spellSearchPreview(spell) {
    function varToName(v) {
        ret = v.replace("_raw", "").replace("_", " ").trim()
        return ret.charAt(0).toUpperCase()+ret.slice(1)
    }
    var data = ["trigger", "target", "area", "range_raw", "saving_throw", "defense", "duration_raw", "effect"]
    var desc = data.map(v => ((spell[v]) ? "<span><b>" + varToName(v) + "</b> " + spell[v] + "</span>" : "")).filter(x => x.length)
    var trads = (spell.tradition ?? []).join(", ");
    spell.price = `Rank ${spell.level} ${trads.length ? "<br>" + trads:""}`
    spell.name +=
        `<div class="extra-info">
            ${desc.join("&emsp;")}
        </div>       `
}

function shieldSearchPreview(shield) {
    shield.name +=
        `<div class="extra-info"> 
            +${shield.ac} <b>AC</b> / ${shield.hardness} <b>Hardness</b> / ${shield.hp_raw} <b>HP (BT)</b>
        </div>`
}
function armorSearchPreview(armor) {
    armor.name +=
        `<div class="extra-info"> 
            ${armor.armor_category} ${armor.armor_group ?? ""} +${armor.ac} <b>AC</b> / +${armor.dex_cap ?? "&infin;"} <b>Dex Cap</b>
        </div>`
}


function featSearchPreview(feat) {
    feat.price = "Level " + feat.level
    feat.name +=
        `<div class="extra-info">  
            ${(feat.prerequisite != undefined) ? `<b>Prerequisite</b> <span style="font-variant:initial">${feat.prerequisite}</span>` : ""}
        </div>`
}

function classSearchPreview(c) {
    c.desc = c.summary;
}

function classFeatureSearchPreview(feature) {
    feature.price = feature.class + " " + feature.level
    feature.desc = feature.summary;
}

function rulesSearchPreview(rules) {
    var breadcrumbs = [rules.source].concat(rules.breadcrumbs || []);
    rules.name +=
        `<div class="extra-info">
            ${breadcrumbs.join(' / ')}
        </div>`
}

function setDescription(hit) {
    hit.desc = "<span>" + [hit.summary ?? "", hit.trait.map(t => `<span class="${traitClass(t)}"> ${t}</span>`).join("")].filter(x => x.length).join("<br>")+"</span>"
}
function semanticSearchHandler(data) {
    if (!data.hits) {
        return {
            "results": []
        };
    }
    var hits = data.hits.hits.map(i => i._source);
    hits.filter(h => 'image' in h)
        .forEach(h => h.image = h.image[0])
    hits.filter(h => 'price' in h)
        .forEach(h => h.price = priceConversion(h))
    hits.filter(h => "actions" in h)
        .forEach(h => h.name = actionsFor(h.actions) + h.name)
    hits.filter(h => "pfs" in h)
        .forEach(h => h.name += pfsIcon(h.pfs))

    hits.filter(h => 'trait' in h)
        .forEach(setDescription)
    hits.filter(h => h.type == "Class")
        .forEach(classSearchPreview)
    hits.filter(h => h.type == "Class Feature")
        .forEach(classFeatureSearchPreview)
    hits.filter(h => h.type == "Feat")
        .forEach(featSearchPreview)

    hits.filter(h => h.type == "Weapon" && h.weapon_category == "Ammunition")
        .forEach(h => h.type = "Ammunition")

    hits.filter(h => h.type == "Spell")
        .forEach(spellSearchPreview)
    hits.filter(h => h.item_subcategory == "Base Weapons")
        .forEach(weaponSearchPreview)
    hits.filter(h => h.type == "Creature")
        .forEach(creatureSearchPreview)
    hits.filter(h => h.item_subcategory == "Base Armor")
        .forEach(armorSearchPreview)
    hits.filter(h => h.type == "Rules")
        .forEach(rulesSearchPreview)
    hits.filter(h => h.item_subcategory == "Base Shields")
        .forEach(shieldSearchPreview)

    var categories = [...new Set(hits.map(h => h.type))]
    var categorized = new Map()
    categories.forEach(c => categorized.set(c, {
        name: c,
        results: hits.filter(h => h.type == c)
    }))
    var response = ({
        "results": Object.fromEntries(categorized),
        "action": {
            "url": `/Search.aspx?q=${$("#desktopSearch .prompt").val()}`,
            "text": `View all ${data.hits.total.value}+ results`
        }
    })

    return response
}

function semanticMobileSearchHandler(data) {
    var hits = data.hits.hits.map(i => i._source);
    hits.filter(h => 'image' in h)
        .forEach(h => h.image = h.image[0])
    hits.filter(h => 'price' in h)
        .forEach(h => h.price = priceConversion(h))
    hits.filter(h => h.type == "Feat")
        .forEach(h => h.price = "Level " + h.level)
    hits.filter(h => h.type == "Spell")
        .forEach(h => h.price = "Level " + h.level)
    hits.filter(h => h.type == "Weapon" && h.weapon_category == "Ammunition").forEach(h => h.type = "Ammunition")
    hits.forEach(h => h.name = h.name + " - " + h.type + (h.level ? " " + h.level : ""))
    var response = ({
        "results": hits,
        "action": {
            "url": `/Search.aspx?q=${$("#mobileSearch .prompt").val()}`,
            "text": `View all ${data.hits.total.value}+ results`
        }
    })
    return response
}

function jumpToSearch(id) {
    event.preventDefault()
    var target = $(id +" .prompt").val()?? "";
    window.location = `/Search.aspx?q=${target}`
}

function fetchSearchResult(settings, callback) {
    var body = {
        "query": {
            "function_score": {
                "query": {
                    "bool": {
                        "should": queryIsComplex(settings.urlData.query)
                            ? buildComplexQueryBody(settings.urlData.query)
                            : buildStandardQueryBody(settings.urlData.query),
                        "minimum_should_match": 1,
                        "must_not": [
                            {
                                "term": {
                                    "exclude_from_search": true,
                                },
                            },
                            {
                                "term": {
                                    "category": "item-bonus",
                                },
                            },
                            {
                                "exists": {
                                    "field": legacyMode ? "legacy_id" : "remaster_id",
                                },
                            },
                            {
                                "exists": {
                                    "field": "item_child_id",
                                },
                            },
                        ],
                    },
                },
                "boost_mode": "multiply",
                "functions": [
                    {
                        "filter": {
                            "terms": {
                                "type": ["Ancestry", "Class", "Versatile Heritage"]
                            }
                        },
                        "weight": 1.2,
                    },
                    {
                        "filter": {
                            "terms": {
                                "type": ["Trait"]
                            }
                        },
                        "weight": 1.05,
                    },
                ],
            },
        },
        "size": 20,
        "sort": [
            "_score",
            "_doc",
        ],
        "_source": {
            "excludes": [
                "text",
            ],
        },
    };

    fetch(
        elasticUrl + '/_search',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        }
    )
        .then(response => response.json())
        .then(data => callback(data))
        .catch(error => {
            console.log('Error:', error);
        });
}

function queryIsComplex(query) {
    return query.includes(':')
        || query.includes('(')
        || query.includes(')')
        || query.includes('"')
        || query.includes('+')
        || query.includes('-')
        || query.includes('*')
        || query.includes('?')
        || query.includes('/')
        || query.includes('~')
        || query.includes(' OR ')
        || query.includes(' AND ')
        || query.includes(' || ')
        || query.includes(' && ')
}

function buildStandardQueryBody(query) {
    return [
        {
            "match_phrase_prefix": {
                "name.sayt": {
                    "query": query,
                },
            },
        },
        {
            "match_phrase_prefix": {
                "legacy_name.sayt": {
                    "query": query,
                },
            },
        },
        {
            "match_phrase_prefix": {
                "remaster_name.sayt": {
                    "query": query,
                },
            },
        },
        {
            "match_phrase_prefix": {
                "text.sayt": {
                    "query": query,
                    "boost": 0.1,
                },
            },
        },
        {
            "term": {
                "name": query,
            }
        },
        {
            "term": {
                "legacy_name": query,
            }
        },
        {
            "term": {
                "remaster_name": query,
            }
        },
        {
            "bool": {
                "must": query
                    .split(/ +/)
                    .map(term => {
                        return {
                            "multi_match": {
                                "query": term,
                                "type": "best_fields",
                                "fields": [
                                    "name",
                                    "legacy_name",
                                    "remaster_name",
                                    "text^0.1",
                                    "trait_raw",
                                    "type",
                                ],
                                "fuzziness": "auto",
                            },
                        };
                    }),
            },
        },
    ];
}

function buildComplexQueryBody(query) {
    return [
        {
            "query_string": {
                "query": query,
                "default_operator": "AND",
                "fields": [
                    "name",
                    "legacy_name",
                    "remaster_name",
                    "text^0.1",
                    "trait_raw",
                    "type",
                ],
            },
        },
    ];
}

function initializeElasticSearch() {
    $("#desktopSearch")
        .search({
            type: 'category',
            apiSettings: {
                responseAsync: fetchSearchResult,
                onResponse: semanticSearchHandler,
            },
            fields: {
                results: 'results',
                title: 'name',
                description: 'desc',
                url: 'url'
            },
            minCharacters: 3,
            maxResults: 20
        })
        .on('keydown', enterSearch)
    $("#mobileSearch")
        .search({
            apiSettings: {
                responseAsync: fetchSearchResult,
                onResponse: semanticMobileSearchHandler,
            },
            fields: {
                results: 'results',
                title: 'name',
                price: null,
                description: 'desc',
                url: 'url'
            },
            minCharacters: 3,
            maxResults: 4
        })
        .on('keydown', enterSearch)
}
