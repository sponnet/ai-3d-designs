#!/usr/bin/env python3
"""Run SolidCraft MCP tool calls against the running SolidCraft app, without an MCP client.

Usage:
    python3 tools/solidcraft-call.py calls.json [--connect 127.0.0.1:27878]

calls.json is a list of [tool, arguments] pairs, run in order on one connection, e.g.
    [["inspect_design", {"measure": false, "sketches": false}],
     ["batch", {"commands": [{"command": "solid.box", "params": {"length": 20, "width": 10, "height": 5}}]}],
     ["screenshot", {"source": "model", "view": "iso"}]]

Text results are printed; images are written next to the working directory as shot<N>.png.
The repository root is passed as --allow-path, so `save`, `export` and `screenshot {path}` may write into it.
"""
import argparse, base64, json, os, subprocess

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ap = argparse.ArgumentParser()
ap.add_argument("calls")
ap.add_argument("--connect", default="127.0.0.1:27878")
args = ap.parse_args()

calls = json.load(open(args.calls))
p = subprocess.Popen(["solidcraft-cli", "mcp", "--connect", args.connect, "--allow-path", REPO],
                     stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)

def send(msg):
    p.stdin.write(json.dumps(msg) + "\n"); p.stdin.flush()

def recv(i):
    while True:
        msg = json.loads(p.stdout.readline())
        if msg.get("id") == i:
            return msg

send({"jsonrpc": "2.0", "id": 0, "method": "initialize",
      "params": {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": "solidcraft-call", "version": "1"}}})
recv(0)
send({"jsonrpc": "2.0", "method": "notifications/initialized"})

for n, (tool, arguments) in enumerate(calls, 1):
    send({"jsonrpc": "2.0", "id": n, "method": "tools/call", "params": {"name": tool, "arguments": arguments}})
    reply = recv(n)
    result = reply.get("result", {})
    print(f"=== {tool} {'ERROR' if result.get('isError') or 'error' in reply else ''}")
    if "error" in reply:
        print(reply["error"])
    for item in result.get("content", []):
        if item["type"] == "text":
            print(item["text"])
        elif item["type"] == "image":
            name = f"shot{n}.png"
            open(name, "wb").write(base64.b64decode(item["data"]))
            print("image ->", name)

p.stdin.close()
p.wait()
