# -*- coding: utf-8 -*-
# @Author: Arius
# @Email: arius@qq.com
# @Date:   2025-06-24
import json
import os
import sys


def encode_sqlite(s):
    return s.replace("'", "''").encode('utf-8', 'ignore').decode('utf-8')


def fix_filename(filename):
    return filename[:92]


def format_cache(key):
    current_file_path = os.path.dirname(os.path.abspath(__file__))
    return f"{current_file_path}/../../cache/{key}"


def cache_log(key, content):
    with open(format_cache(key), 'w') as f:
        f.write(content)


def read_cache(key):
    with open(format_cache(key), 'r') as f:
        return f.read()


def cache_json(content, key='last.json'):
    cache_log(key, json.dumps(content, indent=2, ensure_ascii=False))


def read_cache_json(key='last.json'):
    return json.loads(read_cache(key))


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
