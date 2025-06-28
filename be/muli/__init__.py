# -*- coding: utf-8 -*-
# @Author: Arius
# @Email: arius@qq.com
# @Date:   2025-06-24
import os

from loguru import logger

current_file_path = os.path.dirname(os.path.abspath(__file__))

logger.add(
    f"{current_file_path}/../../cache/muli.log",
    rotation="10 MB",  # Rotate when file reaches 10MB
    enqueue=True,  # Thread-safe logging
)
