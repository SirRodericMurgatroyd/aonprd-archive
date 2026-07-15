function hideFilter(buttonName, divName, headerName) {
    if (document.getElementById(divName).style.display == "none") {
        document.getElementById(divName).style.display = "block";
        document.getElementById(buttonName).innerHTML = headerName.replace("’", "'") + " &#9660;";
    } else {
        document.getElementById(divName).style.display = "none";
        document.getElementById(buttonName).innerHTML = headerName.replace("’", "'") + " &#9658;";
    }
}