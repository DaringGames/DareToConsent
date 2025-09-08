#!/bin/bash
set -e

# Kill any process bound to port 3001 (ignore if none)
PID="$(lsof -tiTCP:3001 -sTCP:LISTEN || true)"
if [ -n "$PID" ]; then
  kill "$PID" 2>/dev/null || true
  sleep 0.3
fi

# Start the server in the background and detach so this script can exit
mkdir -p ./tmp
LOG_FILE="./tmp/server.out.log"
nohup npm start >"$LOG_FILE" 2>&1 &

echo "Server starting in background (PID $!). Logs: $LOG_FILE"
exit 0

