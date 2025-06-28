# -*- coding: utf-8 -*-
# @Author: Arius
# @Email: arius@qq.com
# @Date:   2025-06-24
import json
import sys

import musicbrainzngs
from duckduckgo_search import DDGS

from muli.utils import cache_json, read_cache_json

PROXIES = {
    "http": "http://127.0.0.1:7890",
    "https": "http://127.0.0.1:7890",
}


def get_song_metadata(song_name, artist=None):
    musicbrainzngs.set_useragent("MyMusicApp", "0.1", "my@email.com")
    results = musicbrainzngs.search_recordings(recording=song_name, artist=artist, limit=1)
    cache_json(results)
    results = read_cache_json()
    if results['recording-list']:
        recording = results['recording-list'][0]
        return {
            "title": recording.get('title'),
            "artist": recording['artist-credit'][0]['name'],
            "release_date": recording['release-list'][0]['date'],
            "id": recording['id'],
        }
    return None


def main():
    get_song_metadata("恋爱告急", "鞠婧祎")
    pass


if __name__ == "__main__":
    if len(sys.argv) > 1:
        func = sys.argv[1]
        props = ', '.join([f"'{p}'" for p in sys.argv[2:] if p])
        cmd = f"{func}({props})"
        eval(cmd)
    else:
        main()
