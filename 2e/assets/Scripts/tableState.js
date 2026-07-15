var table;
function realTableIDs(table, items) {
    var columns = table.get_columns();
    return items.map(c => columns.findIndex(col => col.get_uniqueName() == c.get_uniqueName()))
}
function loadTableColumns(s, a) {
    table = s.get_masterTableView();
    var state = JSON.parse(getFeature(table._data.ClientID, "[]"));
    setTable(state);
}
function setTable(state) {
    state.forEach((col, i) => {
        let found = table.get_columns().findIndex(c => c.get_uniqueName() == col.name)
        if (found) table.swapColumns(col.name, table.get_columns()[i].get_uniqueName());
    })
    state.forEach(col => {
        let found = table.get_columns().findIndex(c => c.get_uniqueName() == col.name)
        if (found) {
            if (!col.shown) table.hideColumn(found); else table.showColumn(found);
        }
    })
    drawColumnsHeader(state);
}
function updateTableColumns(s, a) {
    table = s.get_masterTableView();
    var state = table.get_columns().map(c => ({ "name": c.get_uniqueName(), "shown": c.get_visible() }));
    setFeature(table._data.ClientID, JSON.stringify(state));
    drawColumnsHeader(state)
}
function showColumn(c) {
    table.showColumn(table.get_columns().findIndex(col => col.get_uniqueName() == c));
}
function resetTable() {
    var state = JSON.parse(getFeature(table._data.ClientID, "[]"));
    state = state.sort((a, b) => a.name.split("_")[0] - b.name.split("_")[0]);
    state=state.map(c => { c.shown=true; return c});
    setFeature(table._data.ClientID, JSON.stringify(state));
    setTable(state);
}
function stateIsModified(state) {
    for (var i = 0; i < state.length - 1; i++) {
        if ((!state[i].shown)||( (state[i].name.split("_")[0] - state[i+1].name.split("_")[0]))>0) {
            return true;
        }
    }
    return false
}
function drawColumnsHeader(state) {
    var target = document.querySelector(".rgCommandCellLeft");
    var hid = state.filter(c => !c.shown);
    var inner = ""
    if (hid.length > 0) {
        inner = "<span class='lab'>Hidden:</span>"
        hid.forEach(c => inner += `<span class='columnHidden trait'>${c.name.split("_")[1].replaceAll("."," ")} <span class="columnShow" onClick="showColumn('${c.name}')">X</span></span>`);
    }
    if (stateIsModified(state)) {
        inner += '<span class="columnShow" onClick="resetTable()" title="Reset column Visibility and Order">Reset?</span>'
    }
    if (target != null) {
        target.innerHTML = inner;
    } else {
        /*
        target = document.querySelector(".rgCommandCell");
        document.getElementById("mobileHideMenu")?.remove()
        target.innerHTML += "<span id='mobileHideMenu'>"+inner+"</span>";*/
    }
}