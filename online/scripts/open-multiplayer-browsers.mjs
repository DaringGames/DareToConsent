import { chromium } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const playerCount = Number.parseInt(process.env.PLAYERS || '3', 10);
const players = Array.from({ length: Math.max(1, playerCount) }, (_, i) => `Player ${i + 1}`);
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dtc-playwright-players-'));
const contexts = [];

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseURL}/health`);
      if (res.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`No server responding at ${baseURL}/health`);
}

await waitForServer();

for (let i = 0; i < players.length; i++) {
  const userDataDir = path.join(root, `player-${i + 1}`);
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    locale: 'en-US',
    viewport: { width: 390, height: 844 },
    args: [
      `--window-position=${80 + i * 430},80`,
      '--window-size=430,900'
    ]
  });
  const page = context.pages()[0] || await context.newPage();
  await page.goto(baseURL);
  await page.locator('#join-name, #create-name').first().fill(players[i]).catch(() => {});
  contexts.push(context);
}

console.log(`Opened ${contexts.length} isolated browser sessions at ${baseURL}.`);
console.log('Press Ctrl+C in this terminal to close them.');

const shutdown = async () => {
  for (const context of contexts) {
    try { await context.close(); } catch {}
  }
  try { fs.rmSync(root, { recursive: true, force: true }); } catch {}
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await new Promise(() => {});
