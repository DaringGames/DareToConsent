## Handoff - online dependency and server exposure cleanup

Recent prompts
- User asked to review the old AI-built `online` folder before major changes.
- User clarified that in-room player hacking is not a realistic concern, but dependency updates and internet/AWS-hosting exposure are important.

What changed
- Updated all direct online dependencies to current latest versions:
  - `@aws-sdk/client-ses@3.1030.0`
  - `dotenv@17.4.2`
  - `express@5.2.1`
  - `nanoid@5.1.7`
  - `socket.io@4.8.3`
- Removed the side-effecting `GET /admin/send-digest-now` endpoint.
- Admin endpoints now require `x-admin-token`; token-in-query auth was removed.
- Reworked dotenv loading to use explicit quiet config instead of `node -r dotenv/config`, avoiding dotenv 17 startup banner noise.

Checks run
- `node --check server/index.js`
- `node --check public/client.js`
- `npm audit --omit=dev` reports 0 vulnerabilities.
- `npm outdated` reports no outdated packages.
- Smoke-tested `PORT=3101 node server/index.js` and `npm start`; `/health` returned `{"ok":true}`.

Notes
- Express is now 5.x. The app's current simple routes passed the smoke test, but deeper behavior should still be watched during the upcoming overhaul.
- `git status` still shows unrelated/untracked items that predated this task: `env.example`, `handoff.md`, and `original assets/GameNight/`.
