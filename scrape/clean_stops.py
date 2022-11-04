import pandas as pd

df = pd.read_json('time.json')
df = df.iloc[:, :5]

df = df.drop_duplicates('name')

df.to_json('time.json', orient='records')