import json
import time
import multiprocessing as mp
import os
from task import time_bfs
# origin = '1331140' # Aalto metro station
# pbar = tqdm(total=len(stops)-NUM_STOPS)

PROCESSES = 8

FOLDER = 'hsl'

with open(FOLDER + '/stops.json', 'r') as f:
    stops = json.load(f)

with open(FOLDER + '/distances.json', 'r') as f:
    distances = json.load(f)

with open(FOLDER + '/hexagons.json', 'r') as f:
    hexagons = json.load(f)

with open(FOLDER + '/stop_data.json', 'r') as f:
    stop_data = json.load(f)

with open(FOLDER + '/trips.json', 'r') as f:
    trips = json.load(f)


def run(arr):
    print(f"Running with {PROCESSES} processes!")

    start = time.time()
    with mp.Pool(PROCESSES) as p:
        p.map_async(
            time_bfs,
            arr,
        )
        # clean up
        p.close()
        p.join()

    print(f"Time taken = {time.time() - start:.10f}")


if __name__ == '__main__':

    to_delete = []
    for s in stops:
        if s not in stop_data:
            to_delete.append(s)
        else:
            stops[s]['type'] = 'stop'

    for s in to_delete:
        del stops[s]

    for hexagon in hexagons:
        stops[hexagon['id']] = {'name': hexagon['id'],
                            'type': 'hexagon',
                            'lat': hexagon['center']['lat'],
                            'lon': hexagon['center']['lon']
                            }

    print('Total points:', len(stops))

    for s_time in ['000000', '040000', '080000', '120000', '160000', '200000']:
        arr = []
        for s in stops:
            if stops[s]['type'] == 'hexagon' and not os.path.exists(FOLDER + '/' + s_time + '/' + s + '.json'):
                args = {'FOLDER': FOLDER,
                'stops': stops,
                'stop_data': stop_data,
                'trips': trips,
                'distances': distances,
                'origin': s,
                'start_time': s_time}

                arr.append(args)

        run(arr)
