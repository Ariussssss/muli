# -*- coding: utf-8 -*-
# @Author: Arius
# @Email: arius@qq.com
# @Date:   2025-06-30
import json
import os
import sys

import requests

from muli import logger
from muli.local import move


def all_device():
    res = requests.get('http://127.0.0.1:3210/api/connected_devices')
    print(json.dumps(res.json(), indent=2))
    return res.json()


def get_last():
    res = all_device()
    m = 0
    target = None
    for _sid, d in res['devices'].items():
        if d['last_active'] > m:
            m = d['last_active']
            target = d
    return target


def msg_to_last(msg):
    target = get_last()
    target = target['device_id']
    if target:
        r = requests.post('http://127.0.0.1:3210/api/send_signal', json={"device_ids": [target], "signal": msg})
        print(json.dumps(r.json(), indent=2))
        return True
    return False


def ps():
    if not msg_to_last({'task': 'toggle'}):
        os.system('emacsclient -e "(emms-pause)"')


def next():
    if not msg_to_last({'task': 'next'}):
        os.system('emacsclient -e "(emms-next)"')


def ap(playlist):
    if not msg_to_last({'task': 'playlist', 'name': playlist}):
        os.system(f'emacsclient -e "(with-current-buffer emms-playlist-buffer (arz/do-emms-load-type \"{playlist}\"))"')


def fav(playlist):
    target = get_last()
    if target:
        device_id = target['device_id']
        if 'last_song' in target:
            last_song = target['last_song']
            logger.debug(last_song)
            move(last_song, playlist)
        r = requests.post(
            'http://127.0.0.1:3210/api/send_signal', json={"device_ids": [device_id], "signal": {'task': 'refresh'}}
        )
        print(json.dumps(r.json(), indent=2))


def main():
    pass


if __name__ == "__main__":
    if len(sys.argv) > 1:
        func = sys.argv[1]
        props = ', '.join([f"'{p}'" for p in sys.argv[2:] if p])
        cmd = f"{func}({props})"
        eval(cmd)
    else:
        main()
