var map = L.map('map').setView([60.190007, 24.938611], 10);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const intervall = 180;

const bad_col = [253, 76, 10]
const medium_col = [250, 217, 15]
const good_col = [30, 253, 57]

const max_time = 7200 // 2h

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(Math.floor(r)) + componentToHex(Math.floor(g)) + componentToHex(Math.floor(b));
}


$.getJSON("scrape/datasets/hsl/polygons.json", function (polygons) {
    console.log("got polygons", polygons);

    $.getJSON("scrape/datasets/hsl/time_map.json", function (time_map) {
        console.log("got time map", time_map);

        var feature_groups = []

        for (t in time_map) {
            feature_groups.push(new L.FeatureGroup({weight:1, color: '#000'}));
        }

        for (let polygon = 0; polygon < polygons.length; polygon++) {
            if (polygons[polygon]['time'] > 5020) continue;
            let ind = Math.floor(polygons[polygon]['time'] / intervall)
            //console.log(polygons[polygon]['time'], col, rgbToHex(col[0], col[1], col[2]))
            addPolygon(polygons[polygon]['shape'], ind, time_map[ind], polygons[polygon], feature_groups)

        }

        console.log(feature_groups)

        for (feat in feature_groups) {
            let t = feature_groups[feat]
            t.on('mouseover', function (e) {
                for (i in t._layers) {
                    t._layers[i].setStyle({
                        fillOpacity: 1
                    })
                }
            });
            t.on('mouseout', function (e) {
                for (i in t._layers) {
                    t._layers[i].setStyle({
                        fillOpacity: .45
                    })
                }
            });
            t.addTo(map)
        }
    });
})

function addCircle(lon, lat, edgecol, col, size, from = "", to = "", time = 0) {
    var circle = L.circle([lat, lon], {
        color: edgecol,
        fillColor: col,
        fillOpacity: 1,
        radius: size
    })

    circle.bindPopup(`
    ${from} -> ${to} 
    ${Math.floor(time / 3600)}h ${Math.floor((time % 3600) / 60)}m ${time % 60}s
    `);
    circle.addTo(map);
}

function addPolygon(ponits, ind, col, pol, groups) {
    let poly = L.polygon(ponits, { fillColor: rgbToHex(col[0], col[1], col[2]), weight: 0.5, color: '#000', fillOpacity: .35 })
    poly.bindPopup(`Name: ${pol.name}, Time: ${pol.time}`);
    groups[ind].addLayer(poly)
}