#!/usr/bin/env node
'use strict';

/*
  Audit script for DareToConsent themes.

  Actions:
  - Detect near-duplicate example titles within each theme and add a "comment" field on the later duplicate.
  - Suggest rescoring (by decile) for examples whose content appears significantly milder/spicier than their current spicyness.
  - Writes updated JSON back to online/public/data/themes.json.
  - Prints a summary to stdout.

  Notes:
  - JSON doesn't support comments; we persist human-readable notes in an additional "comment" string field on affected examples.
  - Validator ignores unknown fields, so this is safe.
*/

const fs = require('fs');
const path = require('path');

const THEMES_PATH = path.join(__dirname, '..', 'online', 'public', 'data', 'themes.json');

// Load themes
const raw = fs.readFileSync(THEMES_PATH, 'utf8');
const data = JSON.parse(raw);

const stopwords = new Set([
  'both','players','player','switch','roles','each','other',
  'for','the','a','an','to','and','or','with','your','you','yours',
  'of','in','on','over','under','clothes','clothed',
  'seconds','second','count','slow','slowly','gently','gentle','quick','brief',
  'pose','while','then','repeat','add','one','two','three','more','last','first',
  'near','together','holding','hold','maintain','keep','from','into','onto','at'
]);

function tokenizeTitle(str) {
  if (!str) return new Set();
  // Normalize punctuation and whitespace; keep ASCII letters/digits
  const basic = str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const toks = basic.split(/\s+/).filter(Boolean).filter(t => !stopwords.has(t));
  return new Set(toks);
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function decileFromSpicy(sp) {
  const s = Math.max(0, Math.min(99, Number(sp) || 0));
  return Math.floor(s / 10);
}

function rangeFromDecile(d) {
  return `${d*10}-${d*10+9}`;
}

// Recommend decile based on keywords/phrases in title+extra.
// Returns { decile, why } or null if no strong signal found.
function recommendDecile(title, extra) {
  const c = `${title || ''} ${extra || ''}`.toLowerCase();

  let best = -1;
  let why = null;

  const bump = (d, w) => {
    if (d > best) { best = d; why = w; }
  };

  // Highest intensity first
  if (/\bstreak(ing)?\b/.test(c)) bump(9, 'streaking');
  if (/\boral\b|\bblowjob\b|\bcunnilingus\b|\bfellatio\b|\bgoing down\b/.test(c)) bump(9, 'oral sex');
  if (/\bpenetrat(e|ion|ive)\b|\bpenis\b|\bvagina\b|\bintercourse\b|\bsex\b(?!y)/.test(c)) bump(9, 'penetrative sex');
  if (/\buntil climax\b/.test(c)) bump(9, 'until climax');

  if (/\bflash(ing)?\b/.test(c)) bump(8, 'flashing');
  if (/\bdry[-\s]?hump(ing)?\b|\bgrind(ing)?\b/.test(c)) bump(8, 'dry humping / grinding');

  // Over/under clothes zone mapping
  const mentionsGenitals = /\bgenitals?\b/.test(c);
  const mentionsButt = /\bbutt\b|\bass\b/.test(c);
  const mentionsChest = /\bchest\b|\bbreast(s)?\b|\bboob(s)?\b/.test(c);
  const mentionsOver = /\bover clothes\b/.test(c);
  const mentionsUnder = /\bunder\b|\bunder( ?clothes| ?wear| ?shirt| ?pants)\b/.test(c);

  if (mentionsGenitals && mentionsUnder) bump(8, 'genitals under clothes');
  else if (mentionsGenitals && (mentionsOver || /clothes/.test(c))) bump(7, 'genitals over clothes');

  if (mentionsButt && mentionsUnder) bump(7, 'butt under clothes');
  else if (mentionsButt) bump(6, 'butt over clothes');

  if (mentionsChest && mentionsUnder) bump(7, 'chest under clothes');
  else if (mentionsChest) bump(6, 'chest over clothes');

  // High-intensity closeness (non-sexual cuddle indicators) — allow decile 8 to avoid false positives on Cuddly endgame
  if (/\bblanket(s)?\b/.test(c) && (/\bchest\b/.test(c) || /\bspoon(ing)?\b/.test(c) || /\bcuddle\b/.test(c))) bump(8, 'intense cuddling under blanket');
  if (/\bfull[-\s]?body\b/.test(c) && /\bcuddle\b/.test(c)) bump(8, 'full-body cuddle');
  if (/\bheartbeat\b/.test(c) && /\bchest\b/.test(c)) bump(8, 'heartbeat chest-to-chest');

  // Mid-high
  if (/\blap dance\b/.test(c)) bump(7, 'lap dance');
  if (/\btongue\b/.test(c)) bump(7, 'tongue use');

  // Kissing granularity
  if (/\bkiss(ing)? (on )?the lips\b|\blip(s)? kiss\b/.test(c)) bump(6, 'kiss on lips');
  if (/\bmake ?out\b|\bmakeout\b/.test(c)) bump(6, 'makeout');
  if (/\bkiss(ing)? (on )?the cheek\b|\bcheek kiss\b|\bforehead kiss\b/.test(c)) bump(4, 'cheek/forehead kiss');
  if (/\bneck kiss(ing)?\b|\b(kiss|kisses) (along|on) (the )?neck\b/.test(c)) bump(5, 'neck kisses');

  // Close body positioning
  if (/\bstraddle\b|\bsit (in|on) (the )?other'?s? lap\b|\bintertwine(d)? legs\b/.test(c)) bump(6, 'straddle/lap/legs intertwined');

  // Lower intensity anchors
  if (/\bslow[-\s]?dance\b|\bdance closely\b/.test(c)) bump(4, 'slow dance');
  if (/\bhug\b|\bembrace\b/.test(c)) bump(3, 'hug/embrace');
  if (/\bhold hands\b|\bhand massage\b|\beye contact\b|\bforehead(s)?\b/.test(c)) bump(1, 'very mild intimacy');

  if (best < 0) return null;
  return { decile: best, why };
}

// Perform audit
let totalDup = 0;
let totalRescore = 0;
for (const themeName of Object.keys(data)) {
  const theme = data[themeName];
  if (!theme || !Array.isArray(theme.examples)) continue;

  const examples = theme.examples;
  const tokens = examples.map(ex => tokenizeTitle(ex.title || ''));

  // Duplicate detection within the same theme
  const dupOf = new Array(examples.length).fill(-1);
  const threshold = 0.85;

  for (let i = 0; i < examples.length; i++) {
    for (let j = i + 1; j < examples.length; j++) {
      if (dupOf[j] !== -1) continue; // already marked
      const sim = jaccard(tokens[i], tokens[j]);
      if (sim >= threshold) {
        dupOf[j] = i;
        totalDup++;
      }
    }
  }

  // Rescore suggestions
  for (let idx = 0; idx < examples.length; idx++) {
    const ex = examples[idx];
    const issues = [];

    if (dupOf[idx] !== -1) {
      const srcIdx = dupOf[idx];
      const srcTitle = (examples[srcIdx] && examples[srcIdx].title) || '';
      issues.push(`Possible duplicate of #${srcIdx}: "${srcTitle}"`);
    }

    const rec = recommendDecile(ex.title || '', ex.extra || '');
    if (rec) {
      const cur = decileFromSpicy(ex.spicyness);
      const diff = Math.abs(rec.decile - cur);
      if (diff > 1) {
        issues.push(`Rescore suggested: ${rangeFromDecile(cur)} -> ${rangeFromDecile(rec.decile)} (${rec.why})`);
        totalRescore++;
      }
    }

    if (issues.length > 0) {
      const suffix = 'Flag for possible removal or reordering.';
      const msg = issues.join(' | ') + ' — ' + suffix;
      ex.comment = msg;
    } else {
      // Drop stale automated rescore flags if the current heuristics no longer suggest a big move
      if (typeof ex.comment === 'string' && /^Rescore suggested:/i.test(ex.comment)) {
        delete ex.comment;
      }
    }
  }
}

// Write back
fs.writeFileSync(THEMES_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');

// Summary
console.log(`[audit] Duplicates flagged: ${totalDup}`);
console.log(`[audit] Rescore suggestions: ${totalRescore}`);
console.log(`[audit] Updated: ${THEMES_PATH}`);