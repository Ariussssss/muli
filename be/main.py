# -*- coding: utf-8 -*-
# @Author: Arius
# @Email: arius@qq.com
# @Date:   2025-06-26
import os
import sqlite3
import sys
from pathlib import Path

from flask import Flask, Response, request
from flask_cors import CORS
from waitress import serve

from muli.controller import SQLITE_FILE_PATH
from muli.local import SONG_DIR

app = Flask(__name__)
CORS(app, origin='*')
MEDIA_FOLDER = '/home/arius/Music/Spotify'
CHUNK_SIZE = 1024 * 1024


@app.route("/", methods=["GET"])
def hello():
    return {
        "msg": "ok",
        "status": "success",
    }


@app.route("/api/all", methods=["GET"])
def get_all():
    with sqlite3.connect(f"{SQLITE_FILE_PATH}?mode=ro", uri=True) as conn:
        cursor = conn.cursor()
        cursor.execute(''' SELECT url FROM DOWNLOAD ''')
        res = cursor.fetchall()
        return {'downloads': [row[0].replace(SONG_DIR, '') for row in res]}


@app.route('/stream/<path:filename>')
def stream_file(filename):
    file_path = os.path.join(MEDIA_FOLDER, filename)

    if not os.path.exists(file_path):
        return "File not found", 404

    file_size = os.path.getsize(file_path)
    file_ext = Path(filename).suffix.lower()

    range_header = request.headers.get('Range')
    start, end = 0, None

    if range_header:
        ranges = range_header.replace('bytes=', '').split('-')
        start = int(ranges[0])
        if ranges[1]:
            end = int(ranges[1])

    content_type = 'application/octet-stream'
    if file_ext == '.mp4':
        content_type = 'video/mp4'
    elif file_ext == '.webm':
        content_type = 'video/webm'
    elif file_ext == '.mp3':
        content_type = 'audio/mpeg'

    if end is None:
        end = min(start + CHUNK_SIZE, file_size - 1)
    else:
        end = min(end, file_size - 1)

    length = end - start + 1

    with open(file_path, 'rb') as f:
        f.seek(start)
        data = f.read(length)

    response = Response(
        data,
        206,
        mimetype=content_type,
        direct_passthrough=True,
    )

    response.headers.add('Content-Range', f'bytes {start}-{end}/{file_size}')
    response.headers.add('Accept-Ranges', 'bytes')
    response.headers.add('Content-Length', str(length))

    return response


@app.route('/media/<path:filename>')
def get_media_info(filename):
    file_path = os.path.join(MEDIA_FOLDER, filename)

    if not os.path.exists(file_path):
        return "File not found", 404

    file_size = os.path.getsize(file_path)
    file_ext = Path(filename).suffix.lower()

    content_type = 'application/octet-stream'
    if file_ext == '.mp4':
        content_type = 'video/mp4'
    elif file_ext == '.webm':
        content_type = 'video/webm'
    elif file_ext == '.mp3':
        content_type = 'audio/mpeg'

    return {'url': f'/stream/{filename}', 'size': file_size, 'type': content_type}


def start():
    serve(app, host="0.0.0.0", port=3210)


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
