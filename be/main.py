# -*- coding: utf-8 -*-
# @Author: Arius
# @Email: arius@qq.com
# @Date:   2025-06-26
import json
import os
import sqlite3
import sys
import time
import traceback
from pathlib import Path
from threading import Event, Thread

from flask import Flask, Response, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from muli import logger
from muli.controller import SQLITE_FILE_PATH
from muli.local import SONG_DIR
from muli.utils import encode_sqlite

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", json=json)
cleanup_thread = None
cleanup_event = Event()
CORS(app, origin='*')
connected_clients = {}
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


@app.route("/api/log", methods=["POST"])
def log():
    data = request.get_json()
    name = data.get('name')
    value = int(data.get('value', 1))

    logger.debug(f'log: {data}, {name}, {value}')
    if name and value:
        with sqlite3.connect(f"{SQLITE_FILE_PATH}?mode=rw", uri=True) as conn:
            cursor = conn.cursor()
            cursor.execute(
                f'''INSERT INTO LOG (name, value, created_at) VALUES ('{encode_sqlite(name)}', {value}, datetime('now', '+8 hours'))'''
            )
            cursor.close()
            conn.commit()
    return {
        "msg": "ok",
        "status": "success",
    }


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


@socketio.on_error_default
def default_error_handler(e):
    tb = traceback.format_exc()
    logger.error(f"SocketIO Error: {str(e)}\nTraceback:\n{tb}")
    emit('error', {'message': 'An error occurred', 'error': str(e)})


@socketio.on('connect')
def handle_connect():
    sid = request.sid
    emit('connection_ack', {'socket_id': sid})


@socketio.on('register_device')
def handle_register_device(message):
    logger.debug(message)
    if isinstance(message, str):
        data = json.loads(message)
    else:
        data = message

    logger.debug(f'register_device {data}')
    socket_id = request.sid
    device_id = data.get('device_id')

    if device_id:
        target_sockets = [
            sid for sid, info in connected_clients.items() if 'device_id' in info and (info['device_id'] == device_id)
        ]
        for sid in target_sockets:
            del connected_clients[sid]
        if socket_id not in connected_clients:
            connected_clients[socket_id] = {}
        connected_clients[socket_id]['device_id'] = device_id
        connected_clients[socket_id]['ip'] = request.remote_addr
        connected_clients[socket_id]['last_active'] = time.time()
        print(f"Device registered: {device_id} (Socket: {socket_id})")
        emit('registration_success', {'message': 'Device registered successfully'})
    else:
        emit('registration_error', {'message': 'Device ID is required'})


@socketio.on('heartbeat')
def handle_heartbeat(message=''):
    logger.debug(message)
    sid = request.sid
    if isinstance(message, str):
        data = json.loads(message)
    else:
        data = message
        if 'song' in data:
            if sid not in connected_clients:
                connected_clients[sid] = {}
            connected_clients[sid]['last_song'] = data['song']
    logger.debug(f'heartbeat {sid}')
    if sid in connected_clients:
        connected_clients[sid]['last_active'] = time.time()
        emit('heartbeat_ack')


# API endpoint to get connected devices
@app.route('/api/connected_devices', methods=['GET'])
def get_connected_devices():
    return {'devices': connected_clients}


# API endpoint to send signal to specific devices
@app.route('/api/send_signal', methods=['POST'])
def send_signal():
    data = request.json
    device_ids = data.get('device_ids', [])
    signal = data.get('signal', {})

    if not device_ids or not signal:
        return {'error': 'Device IDs and signal are required'}, 400

    # Find socket IDs for the requested device IDs
    target_sockets = [sid for sid, info in connected_clients.items() if info['device_id'] in device_ids]

    if not target_sockets:
        return {'error': 'No matching devices connected'}, 404

    # Send signal to each target device
    for socket_id in target_sockets:
        socketio.emit(signal['task'], signal, room=socket_id)

    return {'message': f"Signal sent to {len(target_sockets)} device(s)", 'devices': device_ids}


def cleanup_inactive_clients():
    """Background thread to remove inactive clients"""
    while not cleanup_event.is_set():
        current_time = time.time()
        inactive_threshold = 60  # 1 minute without activity

        # Find inactive clients
        inactive_clients = [
            sid
            for sid, client in connected_clients.items()
            if ('last_active' not in client) or (current_time - client['last_active'] > inactive_threshold)
        ]

        # Remove inactive clients
        for sid in inactive_clients:
            device_id = connected_clients[sid]['device_id']
            print(f"Removing inactive client: {device_id} (Socket: {sid})")
            del connected_clients[sid]
            socketio.server.disconnect(sid)

        time.sleep(30)  # Check every 30 seconds


def start_cleanup_thread():
    global cleanup_thread
    if cleanup_thread is None:
        cleanup_thread = Thread(target=cleanup_inactive_clients)
        cleanup_thread.daemon = True
        cleanup_thread.start()


def stop_cleanup_thread():
    cleanup_event.set()
    if cleanup_thread:
        cleanup_thread.join()


def start():
    start_cleanup_thread()
    try:
        # socketio.run(app, host="0.0.0.0", port=3210, debug=True)
        socketio.run(app, host="0.0.0.0", port=3210)
    finally:
        stop_cleanup_thread()


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
