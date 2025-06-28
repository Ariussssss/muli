# -*- coding: utf-8 -*-
# @Author: Arius
# @Email: arius@qq.com
# @Date:   2025-06-24
import sqlite3
import sys

from muli import logger

SQLITE_FILE = "muli.sqlite3.db"
SQLITE_FILE_PATH = f"file:{SQLITE_FILE}"


def create_db():
    try:
        conn = sqlite3.connect(f"{SQLITE_FILE_PATH}?mode=rw", uri=True)
    except sqlite3.OperationalError:
        conn = sqlite3.connect(SQLITE_FILE)
        cursor = conn.cursor()
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS SONG(
                id               TEXT PRIMARY KEY,
                title            TEXT,
                artist           TEXT
        );
        '''
        )
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS PLAYLIST(
                url              TEXT,
                name             TEXT,
                lock             INTEGER
            );
        '''
        )
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS DOWNLOAD(
                url               TEXT,
                song_id           TEXT,
                UNIQUE(url)
            );
        '''
        )
        cursor.execute(
            '''
            CREATE TABLE IF NOT EXISTS LOG(
                name           TEXT,
                value          INTEGER,
                created_at     DATETIME
            );
        '''
        )
        print("Table created successfully")
        cursor.close()
        conn.commit()
        conn.close()

    else:
        conn.close()


def main():
    # print(logger)
    # logger.debug('test')
    create_db()
    pass


if __name__ == "__main__":
    if len(sys.argv) > 1:
        func = sys.argv[1]
        props = ', '.join([f"'{p}'" for p in sys.argv[2:] if p])
        cmd = f"{func}({props})"
        eval(cmd)
    else:
        main()
