const request = require('request');
var fs = require('fs');
const { time } = require('console');

// local docker:
// http://localhost:9080/otp/routers/hsl/index/graphql

// official api:
// https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql

async function get_rout(lon1, lat1, lon2, lat2) {
    var req = {
        url: 'http://localhost:9080/otp/routers/hsl/index/graphql',
        method: 'POST',
        headers: { "Content-Type": "application/graphql" },
        body: `{
        plan(
        from: {lat: ${lat1}, lon: ${lon1}},
        to: {lat: ${lat2}, lon: ${lon2}},
        numItineraries: 1,
        date: "2022-11-22",
        time: "08:00:00",
        transportModes: [{mode: BUS}, {mode: RAIL}, {mode:TRAM}, {mode: FERRY}, {mode:WALK}, {mode:SUBWAY}],
        walkReluctance: 1,
        walkBoardCost: 0,
        minTransferTime: 0,
        walkSpeed: 1.6,
        ) {
        date
        itineraries {
            legs {
            startTime
            endTime
            mode
            route {
                gtfsId
            }
            from {
                name
                stop {
                zoneId
                }
            }
            to {
                name
                stop {
                zoneId
                }
            }
            duration
            distance
            transitLeg
            }
        }
        }
  }`
    };

    return new Promise(function (resolve, reject) {

        request(req, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(JSON.parse(body))
            }
            else {
                reject(error)
            }
        });
    });
}

let stop_req = {
    url: 'http://localhost:9080/otp/routers/hsl/index/graphql',
    method: 'POST',
    headers: { "Content-Type": "application/graphql" },
    body: `
    {
      stops {
        gtfsId
        name
        lat
        lon
        zoneId
      }
    }
    `
}

if (fs.existsSync('datasets/hsl/hexahons.json') | true) {

    var stops = JSON.parse(fs.readFileSync('./datasets/hsl/hexagons.json'));

    console.log(stops)

    build_times(stops)
} else {
    var stops = []
    request(stop_req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let res = JSON.parse(body)

            for (entry in res['data']['stops']) {
                data = res['data']['stops'][entry];

                if (data['zoneId'] == 'A' || data['zoneId'] == 'B') {
                    stops.push(data)
                }
            }

            fs.writeFile("time.json", JSON.stringify(stops), function (err) {
                if (err) {
                    console.log(err);
                }
            });

            build_times(stops)
        }
        else {
            console.log('Error while getting stops', error)
        }
    });
}

async function build_times(stops) {

    // console.log(stops[0], stops[1])

    // create dictionary
    var times = JSON.parse(fs.readFileSync('./time.json'))
    /*
    for (let i = 0; i < stops.length; i++) {
        stop_dic[stops[i]['id']] = i
    }

    // populate times
    for (let i = 0; i < stops.length; i++) {
        if (!stops[i]['times']) {
            stops[i]['times'] = Array(stops.length)
            for (let j = 0; j < stops.length; j++) {
                stops[i]['times'][j] = -1
            }
        }
    }

    fs.writeFile("time.json", JSON.stringify(stops), function (err) {
        if (err) {
            console.log(err);
        }
    })

    */

    const origin = stops[1746] // Central station

    console.log('Origin:', origin)

    const start_time = 1669096800


    for (let i = 30; i < stops.length; i++) {
        // for (let j = 0; j < stops.length; j++) {


        let rout = await get_rout(origin.center['lon'], origin.center['lat'], stops[i].center['lon'], stops[i].center['lat'])
        let time = 0;
        try {
            let transit = rout['data']['plan']['itineraries'][0]['legs']

            //console.log(transit)

            time = transit[transit.length - 1].endTime / 1000 - start_time

        } catch {
            time = -1;
        }

        times[stops[i].id] = time;

        console.log(`${origin.id} -> ${stops[i].id}: ${Math.floor(time / 3600)}h ${Math.floor((time % 3600) / 60)}m ${Math.floor(time % 60)}s - ${time} - (${i}/${stops.length})`)


        if (i % 10 == 0) {
            fs.writeFile("time.json", JSON.stringify(times), function (err) {
                if (err) {
                    console.log(err);
                }
            });
        }
        continue;
        for (let s = 0; s < transit.length; s++) {

            for (let e = s; e < transit.length; e++) {

                var start = -1;
                if (transit[s]['from']['name'] == 'Origin') {
                    start = i;
                } else if (stop_dic[transit[s]['from']['name']]) {
                    start = stop_dic[transit[s]['from']['name']]
                } else {
                    console.log('\tStation', transit[s]['from']['name'], 'not found')
                    continue;
                }

                var end = -1;
                if (transit[e]['to']['name'] == 'Destination') {
                    end = j;
                } else if (stop_dic[transit[e]['to']['name']]) {
                    end = stop_dic[transit[e]['to']['name']]
                } else {
                    console.log('\tStation', transit[e]['to']['name'], 'not found')
                    continue
                }

                let time = transit[e]['endTime'] - transit[s]['startTime']
                time = Math.floor(time / 1000)
                if (stops[start]['times'][end] == -1) {
                    stops[start]['times'][end] = time
                } else {

                    stops[start]['times'][end] = Math.min(time, stops[start]['times'][end])
                    stops[end]['times'][start] = Math.min(time, stops[end]['times'][start])
                }

            }
        }


        //var time = stops[i]['times'][j]
        //console.log(`${stops[i]['name']} -> ${stops[j]['name']}: ${Math.floor(time / 3600)}h ${Math.floor((time % 3600) / 60)}m ${Math.floor(time % 60)}s (${i * stops.length + j + 1}/${stops.length * stops.length})`)

        /*
        }

        fs.writeFile("time.json", JSON.stringify(stops), function (err) {
            if (err) {
                console.log(err);
            }
        });
        */
        console.log('\n###############################\n')
    }
    fs.writeFile("time.json", JSON.stringify(times), function (err) {
        if (err) {
            console.log(err);
        }
    });
}

