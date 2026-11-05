# Walawe Quickstart Guide

Get started with Walawe in under 10 minutes.

## 1. Prerequisites
Make sure Walawe Gateway and PostgreSQL are running locally.

## 2. Python Integration
First, install the Python SDK:

cd packages/sdk-python
pip install -e .

Then, run this code:

from walawe import Walawe

client = Walawe(api_key="wlw_testkey123")

for chunk in client.chat_completions(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello!"}]
):
    print(chunk["text"], end="", flush=True)
