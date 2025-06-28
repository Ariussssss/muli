FROM python:3.8-slim

COPY main.py           .
COPY requirements.txt   .
COPY config.prod.json config.json

USER root
RUN pip install -r requirements.txt
CMD python main.py
