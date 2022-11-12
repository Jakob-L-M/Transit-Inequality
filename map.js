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

var feature_groups = []
var HEXAGONS = [];
var TIMEMAP = [];
var TIME_OF_DAY = '200000'

$.getJSON("scrape/datasets/hsl/hexagons.json", function (hexagons) {

    HEXAGONS = hexagons;

    $.getJSON("scrape/datasets/hsl/time_map.json", function (time_map) {

        TIMEMAP = time_map;

        for (t in time_map) {
            feature_groups.push(new L.FeatureGroup());
        }

        $.getJSON("scrape/datasets/hsl/120000/hex_1746.json", function (initial) {

            // console.log("got initial times", initial);

            setMap('hex_1746');
        });
    });
})


function setMap(hex_id) {

    for (feat in feature_groups) {
        feature_groups[feat].clearLayers();
    }

    $.getJSON(`scrape/datasets/hsl/${TIME_OF_DAY}/${hex_id}.json`, function (times) {

        for (let polygon = 0; polygon < HEXAGONS.length; polygon++) {
            let current = HEXAGONS[polygon];
            //console.log(current)

            let time = times[current.id]

            // hexagon can not be reached
            if (time == undefined) continue;

            let ind = Math.floor(time / intervall) + 1

            if (time >= 8400) {
                ind = 30
            }

            if (time == -1) {
                ind = 0
            }

            //console.log(time, time_map[intervall * ind])
            //console.log(polygons[polygon]['time'], col, rgbToHex(col[0], col[1], col[2]))
            addPolygon(current.geometry.coordinates[0], ind, TIMEMAP[ind], { name: current.id, time: time })

        }

        for (feat in feature_groups) {
            let t = feature_groups[feat]
            t.timeid = feat;

            t.on('mouseover', function (e) {
                t.setStyle({
                    fillOpacity: 1,
                    weight: 2,
                })
            });
            t.on('mouseout', function (e) {
                let col = TIMEMAP[t.timeid]
                let hex = rgbToHex(col[0], col[1], col[2])
                t.setStyle({
                    fillOpacity: .85,
                    fillColor: hex,
                    weight: 0,
                })
            });
            t.addTo(map)
        }
    });
}

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

function addPolygon(ponits, ind, col, pol) {
    let poly = L.polygon(ponits, { fillColor: rgbToHex(col[0], col[1], col[2]), weight: 0, color: '#000', fillOpacity: .85 })
    poly.bindPopup(`Time to get here: ${Math.floor(pol.time / 3600)}:${pol.time % 3600}:${pol.time % 60}h, <button onClick="setMap('${pol.name}')">Set origin here</button>`);
    feature_groups[ind].addLayer(poly)
}