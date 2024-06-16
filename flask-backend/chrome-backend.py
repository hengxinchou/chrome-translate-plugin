from flask import Flask
from flask import request as flask_request
import redis
from markupsafe import escape
from flask_cors import CORS
import re
import pyttsx3
import os

import json
from urllib import request, parse
from hashlib import md5
import inflect
import random

app = Flask(__name__)
CORS(app)

BAIDU_FANYI_APPID = os.getenv("BAIDU_FANYI_APPID")
BAIDU_FANYI_PASSWD = os.getenv("BAIDU_FANYI_PASSWD")

from logging.config import dictConfig

dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'stream': 'ext://flask.logging.wsgi_errors_stream',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})

redis_instance0 = redis.Redis(host = 'localhost', port = 6379, decode_responses = True, charset = 'UTF-8', encoding = 'UTF-8', db = 0)
redis_instance1 = redis.Redis(host = 'localhost', port = 6379, decode_responses = True, charset = 'UTF-8', encoding = 'UTF-8', db = 1)

@app.route("/thesaurus/<word>")
def find_thesaurus(word):
    # word = str(escape(word.strip()))
    inflect_engine = inflect.engine()
    word = word.strip().lower()
    app.logger.info("###zhx110: " + word)
    redis_get_result = redis_instance0.get(word)
    if redis_get_result is None:
        ret = inflect_engine.singular_noun(word)
        # 判断是否是复数
        if isinstance(ret, str):
            word = ret
            redis_get_result = redis_instance0.get(word)
        # 判断是否是ing
        if redis_get_result is None and word.endswith('ing'):
            word = word[0:len(word)-3]
            redis_get_result = redis_instance0.get(word)
            if redis_get_result is None and word[-1] == word[-2]:
                word = word[0:len(word)-1]
                redis_get_result = redis_instance0.get(word)
            if redis_get_result is None:
                word = word + 'e'
                redis_get_result = redis_instance0.get(word)
        # 判断是否是ed
        if redis_get_result is None and word.endswith('ed'):
            word = word[0:len(word)-2]
            redis_get_result = redis_instance0.get(word)
            if redis_get_result is None and word[-1] == word[-2]:
                word = word[0:len(word)-1]
                redis_get_result = redis_instance0.get(word)
            if redis_get_result is None:
                word = word + 'e'
                redis_get_result = redis_instance0.get(word)
    result_info = None
    breakpoint()
    if redis_get_result is None:
        result_info = 'can not "{}" find in thesaurus'.format(word)
    else:
        redis_string_result = str(redis_get_result)
        redis_string_result = re.sub("\t", '    ', redis_string_result)
        result_array = redis_string_result.split("\n")
        result_info = "<br>".join(result_array)
    app.logger.info("###zhx111: " + result_info)
    return { "result": result_info }

@app.route("/pronunciation/<word>")
def speak(word):
    word = word.lower()
    pyttsx3.speak(word)
    return { "result": "pronunciate " + word +  " successfully" }

@app.post("/translatesection")
def translatesection():
    data = flask_request.get_json()
    selectedText = escape(data["selectedText"].strip())
    from1 = data['from']
    to = data['to']
    translateResult = getCacheOrCallApi(selectedText, from1, to)
    return { "result": translateResult }

def getCacheOrCallApi(selectedText, from1, to):
    translateResult = None
    md5_key = make_md5(selectedText)
    redis_cache = redis_instance1.get(md5_key)
    if redis_cache:
        app.logger.info("###zhx112: " + str(redis_cache))
        translateResult = str(redis_cache)
        redis_instance1.expire(md5_key, 1800)
    else:
        translateResult = translateBaidu(selectedText, from1, to)
        redis_instance1.set(md5_key, translateResult, 1800)
    app.logger.info("###zhx113: " + translateResult)
    return translateResult

# see more https://api.fanyi.baidu.com/product/113
def translateBaidu(q, from1, to):
    appid = BAIDU_FANYI_APPID
    passwd = BAIDU_FANYI_PASSWD
    salt = random.randint(32768, 65536)

    sign = make_md5(appid + q + str(salt) + passwd)
    data = { "q": q, "from": from1, "to":to, "appid": appid, "salt": salt, "sign": sign }
    datas = parse.urlencode(data).encode('utf-8')
    url = "https://api.fanyi.baidu.com/api/trans/vip/translate"
    app.logger.info("###zhx-300: call baidu api : ")
    req = request.Request(url)
    header = {'Content-Type': 'application/x-www-form-urlencoded'}
    req = request.Request(url,data=datas,headers=header)
    response = request.urlopen(req)
    text = response.read()
    result_obj = json.loads(text.decode('utf-8'))
    result = ""
    for i in result_obj['trans_result']:
        result = result + i['dst']
    return result

def make_md5(s, encoding='utf-8'):
    return md5(s.encode(encoding)).hexdigest()
