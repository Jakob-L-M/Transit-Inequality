var map = L.map('map').setView([60.190007, 24.938611], 10);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const bad_col = [253, 76, 10]
const medium_col = [250, 217, 15]
const good_col = [30, 253, 57]

const max_time = Math.log2(4200) // 1h

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(Math.floor(r)) + componentToHex(Math.floor(g)) + componentToHex(Math.floor(b));
}

var jqxhr = $.getJSON("scrape/time.json", function (data) {
    console.log("got json");

    var dest = 2;

    console.log(data[dest]['lon'], data[dest]['lat'])

    addCircle(data[dest]['lon'], data[dest]['lat'], '#000', '#47B5F5', 150);

    for (i in data) {
        let stop = data[i]
        let time = data[dest]['times'][i]

        if (time < 0) {
            continue
        }

        let col = "";
        let ratio = Math.log2(time)/max_time

        if (ratio > 1) {
            col = rgbToHex(bad_col[0], bad_col[1], bad_col[2])
        } else if (ratio > 0.5) {
            col = rgbToHex((bad_col[0]*(2*(ratio-0.5)) + medium_col[0]*(1-ratio)*2) , bad_col[1]*(2*(ratio-0.5)) + medium_col[1]*(1-ratio)*2, bad_col[2]*(2*(ratio-0.5)) + medium_col[2]*(1-ratio)*2)
        } else {
            col = rgbToHex(medium_col[0]*(ratio*2) + good_col[0]*(0.5-ratio)*2 , medium_col[1]*(ratio*2) + good_col[1]*(0.5-ratio)*2, medium_col[2]*(ratio*2) + good_col[2]*(0.5-ratio)*2)
        }
        console.log(col)
        addCircle(stop['lon'], stop['lat'],col, col, 100, stop['name'], data[dest]['name'], time);
    }
})
    .done(function () {
        console.log("finished map");
    })
    .fail(function () {
        console.log("error");
    })

function addCircle(lon, lat, edgecol, col, size, from="", to="", time=0) {
    var circle = L.circle([lat, lon], {
        color: edgecol,
        fillColor: col,
        fillOpacity: 1,
        radius: size
    })

    circle.bindPopup(`
    ${from} -> ${to} 
    ${Math.floor(time/3600)}h ${Math.floor((time%3600)/60)}m ${time%60}s
    `);
    circle.addTo(map);
}