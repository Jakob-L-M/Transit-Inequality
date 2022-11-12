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
var hex_id = 'hex_1746'

$.getJSON("scrape/datasets/hsl/hexagons.json", function (hexagons) {

    HEXAGONS = hexagons;

    $.getJSON("scrape/datasets/hsl/time_map.json", function (time_map) {

        TIMEMAP = time_map;

        var svg = d3.select('#time_bar').append("svg")
            .attr("height", "90vh")
            .attr("width", "5vw")


        var height = $(window).height()
        var width = $(window).width()

        let c = -1;
        var rect = svg.selectAll("rect")
            .data(TIMEMAP).enter()
            .append("rect")
            .attr("id", (d) => `_${d[3]}`)
            .attr("x", 0)
            .attr("y", (d) => `${3 * d[3]}vh`)
            .attr("height", `3vh`)
            .attr("width", "2vw")
            .attr("fill", (d) => rgbToHex(d[0], d[1], d[2]))
            .on("mouseover", (d) => hover_in(d.target.id.substring(1)))
            .on("mouseout", (d) => hover_out(d.target.id.substring(1)))

        c = 0;
        var text = svg.selectAll("text")
            .data(TIMEMAP).enter()
            .append("text")
            .attr('text-anchor', 'left')
            //.attr('x', (d) => `${3*c}vh`)
            //.attr("y", (d) => {c += 1; return `${3*c}vh`})
            .attr('transform', (d) => { c++; return `translate(${0.023 * width}, ${(c - 0.3) * (0.9 * height / 30)})` })
            .style('font-family', 'Helvetica')
            .style('font-size', (d) => { c = 0; return '1.5vh' })
            .text((d) => { c++; return `${c * 5}` });

        for (t in time_map) {
            feature_groups.push(new L.FeatureGroup());
        }

        setMap();
    });
})

function setMapWithHex(hex) {
    hex_id = hex;
    setMap()
}

function setMap() {

    var TIME_OF_DAY = `${(0 + document.getElementById('start_time').value).slice(-2)}0000`

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

            let ind = Math.floor(time / intervall)

            if (time >= 8400) {
                ind = 29
            }

            if (time == -1) {
                ind = 30
            }

            //console.log(time, time_map[intervall * ind])
            //console.log(polygons[polygon]['time'], col, rgbToHex(col[0], col[1], col[2]))
            addPolygon(current.geometry.coordinates[0], ind, TIMEMAP[ind], { name: current.id, time: time })

        }

        for (feat in feature_groups) {
            let t = feature_groups[feat]
            t.timeid = feat;

            t.on('mouseover', function (e) {
                hover_in(t.timeid)
            });
            t.on('mouseout', function (e) {
                hover_out(t.timeid)
            });
            t.addTo(map)
        }
    });
}

function hover_out(id) {
    let col = TIMEMAP[id]
    let hex = rgbToHex(col[0], col[1], col[2])
    feature_groups[id].setStyle({
        fillOpacity: .85,
        fillColor: hex,
        weight: 0,
    })

    d3.select(`#_${id}`).style('fill', hex)
}

function hover_in(id) {
    feature_groups[id].setStyle({
        fillOpacity: 1,
        weight: 2,
    })
    d3.select(`#_${id}`).style('fill', '#000')
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
    poly.bindPopup(`Time to get here: ${Math.floor(pol.time / 3600)}:${Math.floor((pol.time % 3600) / 60)}:${pol.time % 60}h, <button onClick="setMapWithHex('${pol.name}')">Set origin here</button>`);
    feature_groups[ind].addLayer(poly)
}