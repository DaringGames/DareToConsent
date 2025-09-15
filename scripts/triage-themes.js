/**
 * Triage mis-scored dares that were previously flagged by audit-themes.js.
 *
 * Steps:
 * 1) Find examples with comment like: "Rescore suggested: 80-89 -> 60-69 (...)"
 * 2) For each flagged example:
 *    - Parse recommended decile (e.g., "60-69" => target decile 6, target spicyness ~ 65)
 *    - Variety check: compare Jaccard token similarity vs examples already in the target decile.
 *      If similar (>= THRESHOLD), prefer removal IF:
 *         - Theme would still have >= 30 examples AND
 *         - Removing it won't eliminate the last example in its current decile bucket
 *      Else, keep and MOVE by updating its spicyness to a representative value in the target decile.
 *    - Remove the "comment" field from processed examples.
 * 3) After triage, sort examples by spicyness ascending per theme.
 * 4) Write back to themes.json and print a summary.
 *
 * This script trusts the dataset-level validator for ensuring all deciles remain represented.
 */

const fs = require('fs');
const path = require('path');

const THEMES_DIR = path.resolve(__dirname, '../online/public/data/themes');
const MONO_PATH  = path.resolve(__dirname, '../online/public/data/themes.json');

function loadThemes() {
  // Prefer split directory
  if (fs.existsSync(THEMES_DIR) && fs.statSync(THEMES_DIR).isDirectory()) {
    const files = fs.readdirSync(THEMES_DIR).filter(f => f.toLowerCase().endsWith('.json'));
    if (files.length > 0) {
      const data = {};
      const fileMap = {};
      for (const fn of files) {
        const fp = path.join(THEMES_DIR, fn);
        const raw = fs.readFileSync(fp, 'utf8');
        const json = JSON.parse(raw);
        const key = (json && json.name) ? json.name : path.basename(fn, '.json');
        data[key] = json;
        fileMap[key] = fp;
      }
      return { data, source: 'dir', fileMap };
    }
  }
  // Fallback to monolith
  const raw = fs.readFileSync(MONO_PATH, 'utf8');
  const data = JSON.parse(raw);
  return { data, source: 'monolith', fileMap: null };
}

// Tokenization utilities (aligned with audit heuristics)
const STOPWORDS = new Set([
  'both','players','player','current','dare','accepter','each','other','over','under','clothes','clothed',
  'for','a','an','the','and','or','to','of','in','on','at','by','with','from','into','up','down','near',
  'your','you','yours','their','them','then','than','it','its','this','that','these','those',
  'add','then','switch','roles','hold','count','seconds','second','slow','slowly','fast','faster','quick','quickly',
  'together','while','once','twice','three','four','five','six','seven','eight','nine','ten',
  'one','two','three','four','five','six','seven','eight','nine','ten'
]);

function normalizeText(s) {
  return (s || '')
    .toLowerCase()
    .replace(/['’]/g, '')               // remove apostrophes
    .replace(/[^a-z0-9\s]/g, ' ')       // remove punctuation
    .replace(/\s+/g, ' ')               // collapse spaces
    .trim();
}

function tokenize(s) {
  const norm = normalizeText(s);
  if (!norm) return [];
  return norm.split(' ').filter(w => w && w.length > 1 && !STOPWORDS.has(w));
}

function jaccardTitle(a, b) {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  const uni = A.size + B.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function decileOf(sp) {
  const s = Math.max(0, Math.min(99, sp|0));
  return Math.floor(s / 10);
}

function representativeScoreForDecile(decileLow) {
  // 60-69 => choose 65; 0-9 => 5, etc.
  const low = decileLow;
  return Math.max(0, Math.min(99, low + 5));
}

function parseRescoreTarget(comment) {
  // Formats like: "Rescore suggested: 80-89 -> 60-69 (makeout) ..."
  // or "Rescore suggested: 90-99 -> 30-39 (...)"
  if (!comment) return null;
  const m = comment.match(/Rescore suggested:\s*(\d{1,2})-\d{1,2}\s*-\>?\s*(\d{1,2})-\d{1,2}/i) || comment.match(/Rescore suggested:\s*(\d{1,2})-\d{1,2}\s*->\s*(\d{1,2})-\d{1,2}/i);
  if (!m) return null;
  const targetLow = parseInt(m[2], 10);
  const targetDecile = Math.floor(targetLow / 10);
  const targetScore = representativeScoreForDecile(targetLow);
  return { targetDecile, targetScore, targetLow };
}

function bucketCounts(examples) {
  const counts = Array(10).fill(0);
  for (const ex of examples) counts[decileOf(ex.spicyness|0)]++;
  return counts;
}

function canRemoveExample(examples, idx) {
  // Must keep at least 30 examples
  if (examples.length <= 30) return false;
  // Must not remove the last example in its decile bucket
  const d = decileOf(examples[idx].spicyness|0);
  let countInBucket = 0;
  for (let i = 0; i < examples.length; i++) {
    if (i === idx) continue;
    if (decileOf(examples[i].spicyness|0) === d) countInBucket++;
  }
  return countInBucket >= 1; // safe to remove if at least one remains
}

function triageTheme(themeName, theme) {
  const THRESHOLD = 0.80; // similarity threshold for "not significant variety"

  let examples = theme.examples || [];
  let removed = 0;
  let moved = 0;
  let keptFlagged = 0;

  // Collect indices of flagged examples
  const flagged = [];
  for (let i = 0; i < examples.length; i++) {
    const ex = examples[i];
    if (ex && typeof ex.comment === 'string' && ex.comment.toLowerCase().startsWith('rescore suggested')) {
      flagged.push(i);
    }
  }

  // Process each flagged example
  // We'll mark for deletion or mutation and then apply operations
  const toRemove = new Set();
  const toUpdate = new Map(); // idx -> new example object

  for (const idx of flagged) {
    const ex = examples[idx];
    const parsed = parseRescoreTarget(ex.comment || '');
    if (!parsed) {
      // If we cannot parse, drop the comment and keep as-is
      const copy = { ...ex };
      delete copy.comment;
      toUpdate.set(idx, copy);
      keptFlagged++;
      continue;
    }

    const { targetDecile, targetScore } = parsed;
    const targetExamples = examples.filter((e, j) => j !== idx && decileOf(e.spicyness|0) === targetDecile);

    // Variety check against examples in the target decile
    let similarFound = false;
    for (const te of targetExamples) {
      const sim = jaccardTitle(ex.title || '', te.title || '');
      if (sim >= THRESHOLD) { similarFound = true; break; }
    }

    if (similarFound && canRemoveExample(examples, idx)) {
      toRemove.add(idx);
      removed++;
    } else {
      // Move (rescore) into target decile
      const copy = { ...ex, spicyness: targetScore };
      delete copy.comment;
      toUpdate.set(idx, copy);
      moved++;
    }
  }

  // Apply removals/updates
  const newExamples = [];
  for (let i = 0; i < examples.length; i++) {
    if (toRemove.has(i)) continue;
    const updated = toUpdate.get(i);
    newExamples.push(updated ? updated : examples[i]);
  }

  // Sort by spicyness ascending (move items to the more appropriate spot in list order)
  newExamples.sort((a, b) => (a.spicyness|0) - (b.spicyness|0));

  // Replace in theme
  theme.examples = newExamples;

  return { removed, moved, keptFlagged, finalCount: newExamples.length, buckets: bucketCounts(newExamples) };
}

function main() {
  const { data, source, fileMap } = loadThemes();

  const summary = {};
  let totalRemoved = 0;
  let totalMoved = 0;
  let totalKeptFlag = 0;

  for (const [themeName, theme] of Object.entries(data)) {
    if (!theme || !Array.isArray(theme.examples)) continue;
    const res = triageTheme(themeName, theme);
    summary[themeName] = res;
    totalRemoved += res.removed;
    totalMoved += res.moved;
    totalKeptFlag += res.keptFlagged;
  }

  // Write back
  if (source === 'dir' && fileMap) {
    for (const [key, obj] of Object.entries(data)) {
      const fp = fileMap[key] || path.join(THEMES_DIR, `${key}.json`);
      fs.writeFileSync(fp, JSON.stringify(obj, null, 2) + '\n', 'utf8');
    }
  } else {
    fs.writeFileSync(MONO_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  }

  // Print report
  console.log(`[triage] Source: ${source === 'dir' ? THEMES_DIR : MONO_PATH}`);
  console.log('[triage] Completed triage of mis-scored items');
  console.log(`[triage] Moved (rescored): ${totalMoved}`);
  console.log(`[triage] Removed (low variety): ${totalRemoved}`);
  console.log(`[triage] Kept (could not parse flag, dropped comment): ${totalKeptFlag}`);
  for (const [name, res] of Object.entries(summary)) {
    console.log(`- ${name}: moved=${res.moved}, removed=${res.removed}, keptFlagged=${res.keptFlagged}, examples=${res.finalCount}, buckets=${res.buckets.join(',')}`);
  }
}

main();