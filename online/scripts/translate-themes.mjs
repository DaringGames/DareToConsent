import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const themesDir = path.join(root, 'public/data/themes');
const profile = process.env.AWS_PROFILE || 'worst-prod';
const region = process.env.AWS_REGION || 'us-west-2';
const targets = [
  ['es', 'es'],
  ['pt', 'pt'],
  ['zh', 'zh'],
  ['tl', 'tl'],
  ['vi', 'vi'],
  ['ar', 'ar'],
  ['fr', 'fr'],
  ['ko', 'ko'],
  ['ru', 'ru'],
  ['ht', 'ht'],
  ['hi', 'hi'],
  ['de', 'de'],
  ['nl', 'nl'],
  ['pl', 'pl'],
  ['it', 'it']
];

function translate(text, target) {
  if (!text || !text.trim()) return '';
  const out = execFileSync('aws', [
    '--profile', profile,
    '--region', region,
    'translate', 'translate-text',
    '--source-language-code', 'en',
    '--target-language-code', target,
    '--text', text,
    '--query', 'TranslatedText',
    '--output', 'text'
  ], { encoding: 'utf8' });
  return out.trim();
}

function translateEntry(entry, targetKey, awsTarget) {
  entry.translations ||= {};
  entry.translations[targetKey] ||= {};
  if (entry.title && !entry.translations[targetKey].title) {
    entry.translations[targetKey].title = translate(entry.title, awsTarget);
  }
  if (entry.extra && !entry.translations[targetKey].extra) {
    entry.translations[targetKey].extra = translate(entry.extra, awsTarget);
  }
}

const files = fs.readdirSync(themesDir)
  .filter(file => file.endsWith('.json') && file !== 'index.json')
  .sort();

let changed = 0;
for (const file of files) {
  const full = path.join(themesDir, file);
  const json = JSON.parse(fs.readFileSync(full, 'utf8'));
  for (const entry of [...(json.starts || []), ...(json.examples || [])]) {
    for (const [targetKey, awsTarget] of targets) translateEntry(entry, targetKey, awsTarget);
  }
  fs.writeFileSync(full, `${JSON.stringify(json, null, 2)}\n`);
  changed++;
  console.log(`translated ${file}`);
}

console.log(`Updated ${changed} theme files.`);
