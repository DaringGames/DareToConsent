Online version of Dare to Consent (prototype).

Overview
- Node.js + Express serves static client and Socket.IO for realtime.
- Rooms use three-word codes for easy joining and QR codes for sharing.
- Flow: Lobby → Theme Elimination → Main Loop (dare selection, submissions, completion, escalation).

Run
- npm install
- npm start
- Open http://localhost:3001

Notes
- No database; room state in memory until server restarts.
- Logs contain room and player IDs for debugging only.
