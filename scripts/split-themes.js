#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const MONO_PATH = path.join(__dirname, '..', 'online', 'public', 'data', 'themes.json');
const OUT_DIR = path.join(__dirname, '..', 'online', 'public', 'data', 'themes');

function main() {
  if (!fs.existsSync(MONO_PATH)) {
    console.error(`Source file not found: ${MONO_PATH}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(MONO_PATH, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse themes.json:', err.message);
    process.exit(2);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = Object.entries(data);
  let count = 0;
  for (const [key, obj] of entries) {
    if (!obj || typeof obj !== 'object') continue;
    const filename = key.replace(/[^A-Za-z0-9_-]/g, '_') + '.json';
    const outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
    count++;
  }
  console.log(`Wrote ${count} themes to ${OUT_DIR}`);
}

if (require.main === module) {
  main();
}