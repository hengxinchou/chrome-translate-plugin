import json
import redis
result = {}
r = redis.Redis(host='localhost', port=6379,decode_responses=True, charset='UTF-8', encoding='UTF-8')

with open('./thesaurus/en_thesaurus.jsonl','r',encoding='utf8') as fp:
    line = fp.readline()
    i = 1
    while line:
        t1 = json_data = json.loads(line)
        result[t1['word']]=t1['desc']
        print("key {} is {}".format(t1['word'], t1['desc']))
        previous_text = r.get(t1['word'])
        if previous_text:
            message = "{}, {}".format(t1['pos'], ". \t ".join(t1['desc']).replace('"', ''))
            message = str(previous_text) + " .\n " +  message
            r.set(t1['word'], message)
        else:
            message = t1['word'] + " : \n"
            message = message + "{}, {}".format(t1['pos'], ". \t ".join(t1['desc']).replace('"', ''))
            r.set(t1['word'], message)
        line = fp.readline()
        i = i + 1
