import json
from queue import PriorityQueue as PQueue

def parse_time(time):
    return int(time[0:2])*3600 + int(time[3:5])*60 + int(time[6:8])

def save_times(args, start_time, data):

    origin = args['origin']
    stops = args['stops']
    FOLDER = args['FOLDER']

    folder = start_time[:2] + start_time[3:5] + start_time[6:8]
    times = {}

    for stop in data:
        if stops[stop]['type'] == 'hexagon':
            times[stop] = data[stop]

    with open(FOLDER + '/' + folder + '/' + origin + '.json', 'w') as f:
        json.dump(times, f)


def time_bfs(args, start_time='09:00:00'):

    # extract args
    origin = args['origin']
    stops = args['stops']
    stop_data = args['stop_data']
    trips = args['trips']
    distances = args['distances']


    best_q_position = {}

    for s in stops:
        best_q_position[s] = 1_000_000_000

    dist_from_origin = {}
    seen = set()
    starting_time = parse_time('09:00:00')

    q = PQueue()
    q.put((starting_time, origin))

    while not q.empty():
        time, cur = q.get()

        cur = str(cur)

        if cur not in seen and cur in stops:

            seen.add(cur)
            dist_from_origin[cur] = time - starting_time

            # add all unseen stops in walking distance
            for walk_time, n_id in distances[cur][1:]:
                temp = str(n_id)
                if temp not in seen and (time + walk_time) < best_q_position[temp]:
                    q.put((time + walk_time, temp))
                    best_q_position[temp] = time + walk_time

            # for a stop: add all trips leaving station
            if stops[cur]['type'] == 'stop':
                for dep_time, trip_id, pos in stop_data[cur]:
                    if dep_time < time:
                        continue

                    # get all further stops on the trip and add them to the queue
                    for arr_time, dep_time, n_id in trips[trip_id][pos-1:]:
                        temp = str(n_id)
                        if temp in stops:
                            if temp not in seen and arr_time < best_q_position[temp]:
                                q.put((arr_time, temp))
                                best_q_position[temp] = arr_time


    save_times(args, start_time, dist_from_origin)
    print('\tfinished', origin, flush=True)

if __name__ == '__main__':
    print('No')