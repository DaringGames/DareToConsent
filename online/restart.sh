#!/bin/bash
set -euo pipefail

# Always run from the directory this script lives in, so it works no matter
# where it is invoked from (e.g., "bash online/restart.sh" or "./restart.sh").
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Kill any process bound to port 3001 (ignore if none)
PID="$(lsof -tiTCP:3001 -sTCP:LISTEN || true)"
if [ -n "$PID" ]; then
  kill "$PID" 2>/dev/null || true
  sleep 0.3
  # If it didn't die, force kill
  if kill -0 "$PID" 2>/dev/null; then
    kill -9 "$PID" 2>/dev/null || true
    sleep 0.2
  fi
fi

# Start the server in the background and detach so this script can exit
mkdir -p ./tmp
LOG_FILE="$(pwd)/tmp/server.out.log"
nohup npm start >"$LOG_FILE" 2>&1 &
NEWPID=$!

echo "Server starting in background (PID $NEWPID) from $SCRIPT_DIR. Logs: $LOG_FILE"
exit 0
