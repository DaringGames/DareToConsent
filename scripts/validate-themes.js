#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.join(process.cwd(), 'online/public/data/themes');
const MONO_PATH  = path.join(process.cwd(), 'online/public/data', 'themes.json');
const MIN_EXAMPLES = parseInt(process.env.MIN_EXAMPLES || '20', 10);

function formatBucketLabel(i) { return `${i*10}-${i*10+9}`; }

function loadThemesObject() {
  // Prefer split files in the themes/ directory
  try {
    if (fs.existsSync(THEMES_DIR) && fs.statSync(THEMES_DIR).isDirectory()) {
      const files = fs.readdirSync(THEMES_DIR).filter(f => f.toLowerCase().endsWith('.json'));
      if (files.length === 0) throw new Error('No theme files found in themes dir');
      const data = {};
      files.sort().forEach(fn => {
        // Skip the index.json manifest and any non-theme helpers
        if (/^index\.json$/i.test(fn)) return;
        const full = path.join(THEMES_DIR, fn);
        const raw = fs.readFileSync(full, 'utf8');
        const json = JSON.parse(raw);
        // Only include objects that look like themes (must have examples array)
        if (!json || typeof json !== 'object' || !Array.isArray(json.examples)) return;
        const key = (json && json.name) ? json.name : path.basename(fn, '.json');
        data[key] = json;
      });
      return { data, source: 'dir' };
    }
  } catch (err) {
    console.error('Error loading split themes:', err.message);
    // Fallback to monolith below
  }

  // Fallback to monolithic file
  const raw = fs.readFileSync(MONO_PATH, 'utf8');
  const json = JSON.parse(raw);
  return { data: json, source: 'monolith' };
}

function validateThemes(themes) {
  const results = [];
  for (const [key, theme] of Object.entries(themes)) {
    const examples = Array.isArray(theme.examples) ? theme.examples : [];
    const warnings = [];
    if (examples.length < MIN_EXAMPLES) {
      warnings.push(`Examples count is ${examples.length} (< ${MIN_EXAMPLES})`);
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
    const { data, source } = loadThemesObject();
    const results = validateThemes(data);
    let warningsTotal = 0;
    console.log(`[validate] Source: ${source === 'dir' ? THEMES_DIR : MONO_PATH}`);
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
    console.error('Error reading or parsing themes:', err.message);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}