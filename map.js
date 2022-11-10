var map = L.map('map').setView([60.240007, 24.908611], 11);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    minZoom: 11,
    attribution: '© OpenStreetMap'
}).addTo(map);

const intervall = 300;

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


$.getJSON("scrape/datasets/hsl/hexagons.json", function (hexagons) {
    console.log("got hexagons", hexagons);

    $.getJSON("scrape/datasets/hsl/time_map.json", function (time_map) {
        console.log("got time map", time_map);

        $.getJSON("scrape/datasets/hsl/090000/hex_1886.json", function (initial) {

            console.log("got initial times", initial);

            var feature_groups = []

            for (t in time_map) {
                feature_groups.push(new L.FeatureGroup());
            }

            for (let polygon = 0; polygon < hexagons.length; polygon++) {
                let current = hexagons[polygon];
                //console.log(current)

                let time = initial[current.id]

                // hexagon can not be reached
                if (time == undefined) continue;

                let ind = Math.floor(time / intervall)

                if (time >= 8400) {
                    ind = 29
                }

                //console.log(time, time_map[intervall * ind])
                //console.log(polygons[polygon]['time'], col, rgbToHex(col[0], col[1], col[2]))
                addPolygon(current.geometry.coordinates[0], ind, time_map[intervall * ind], { name: current.id, time: time }, feature_groups)

            }

            console.log(feature_groups)

            for (feat in feature_groups) {
                let t = feature_groups[feat]
                t.timeid = feat;

                t.on('mouseover', function (e) {
                    t.setStyle({
                        fillOpacity: 1,
                        fillColor: '#002561'
                    })
                });
                t.on('mouseout', function (e) {
                    let col = time_map[intervall * t.timeid]
                    t.setStyle({
                        fillOpacity: .8,
                        fillColor: rgbToHex(col[0], col[1], col[2])
                    })
                });
                t.addTo(map)
            }
        });
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

    let poly = L.polygon(ponits, { fillColor: rgbToHex(col[0], col[1], col[2]), weight: 0, color: '#000', fillOpacity: .8 })
    poly.bindPopup(`Name: ${pol.name}, Time: ${pol.time}`);
    groups[ind].addLayer(poly)
}