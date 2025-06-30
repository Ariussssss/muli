# -*- coding: utf-8 -*-
# @Author: Arius
# @Email: arius@qq.com
# @Date:   2025-06-24
import shutil
import sqlite3
import subprocess
import sys

from muli.controller import SQLITE_FILE_PATH
from muli.utils import encode_sqlite

SONG_DIR = "/home/arius/Music/Spotify"


def load():
    command = f"fd -t f -i '(mp4|mp3|webm)' {SONG_DIR}"
    result = subprocess.run(
        command,
        shell=True,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
    )
    songs = result.stdout.split('\n')
    with sqlite3.connect(f"{SQLITE_FILE_PATH}?mode=rw", uri=True) as conn:
        cursor = conn.cursor()
        cursor.execute(''' DELETE FROM DOWNLOAD ''')
        cursor.execute(''' DELETE FROM PLAYLIST WHERE lock = 1 ''')
        for _idx, s in enumerate(songs):
            if s.strip():
                # print(idx, s)
                s = encode_sqlite(s)
                tag = s.split('/')[-2]
                # print(tag, s)
                sql = f'''INSERT OR IGNORE INTO DOWNLOAD (song_id, url) values ('', '{s}')'''
                # print(sql)
                cursor.execute(sql)
                sql = f'''INSERT OR IGNORE INTO PLAYLIST (url, name, lock) values ('{s}', '{tag}', 1)'''
                # print(sql)
                cursor.execute(sql)
        cursor.close()
        conn.commit()


def move(target, playlist):
    if not target.startswith(SONG_DIR):
        target = SONG_DIR + target
    new_dir = f'{SONG_DIR}/{playlist}'
    shutil.move(target, new_dir)
    load()


def main():
    load()
    pass


if __name__ == "__main__":
    if len(sys.argv) > 1:
        func = sys.argv[1]
        props = ', '.join([f"'{p}'" for p in sys.argv[2:] if p])
        cmd = f"{func}({props})"
        eval(cmd)
    else:
        main()
