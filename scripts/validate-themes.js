#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const THEMES_PATH = path.join(process.cwd(), 'online/public/data/themes.json');

function formatBucketLabel(i) { return `${i*10}-${i*10+9}`; }

function validateThemes(themes) {
  const results = [];
  for (const [key, theme] of Object.entries(themes)) {
    const examples = Array.isArray(theme.examples) ? theme.examples : [];
    const warnings = [];
    if (examples.length < 30) {
      warnings.push(`Examples count is ${examples.length} (< 30)`);
    }
    const buckets = Array(10).fill(0);
    for (const ex of examples) {
      const sRaw = ex.spicyness;
      const s = typeof sRaw === 'number' && !isNaN(sRaw) ? sRaw : null;
      if (s === null) continue;
      const b = Math.floor(Math.max(0, Math.min(99, s)) / 10);
      buckets[b]++;
    }
    const missingRanges = [];
    for (let i = 0; i < 10; i++) {
      if (buckets[i] < 1) missingRanges.push(formatBucketLabel(i));
    }
    if (missingRanges.length > 0) {
      warnings.push(`Missing spicyness coverage for ranges: ${missingRanges.join(', ')}`);
    }
    results.push({ theme: theme.name || key, warnings, buckets, exampleCount: examples.length });
  }
  return results;
}

function main() {
  try {
    const raw = fs.readFileSync(THEMES_PATH, 'utf8');
    const json = JSON.parse(raw);
    const results = validateThemes(json);
    let warningsTotal = 0;
    for (const r of results) {
      if (r.warnings.length) {
        console.warn(`\n[WARN] Theme "${r.theme}"`);
        for (const w of r.warnings) {
          console.warn(` - ${w}`);
        }
      } else {
        console.log(`\n[OK] Theme "${r.theme}" meets targets`);
      }
      // Print summary distribution
      console.log(`   examples=${r.exampleCount}, bucket counts: ${r.buckets.join(', ')}`);
      warningsTotal += r.warnings.length;
    }
    if (warningsTotal > 0) {
      console.error(`\nValidation failed: ${warningsTotal} warning(s) across ${results.length} theme(s).`);
      process.exit(1);
    } else {
      console.log('\nValidation passed.');
    }
  } catch (err) {
    console.error('Error reading or parsing themes file:', err.message);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}