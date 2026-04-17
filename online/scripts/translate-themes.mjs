import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const themesDir = path.join(root, 'public/data/themes');
const profile = process.env.AWS_PROFILE || 'worst-prod';
const region = process.env.AWS_REGION || 'us-west-2';
const concurrency = Number.parseInt(process.env.TRANSLATE_CONCURRENCY || '4', 10);
const includeExtra = process.env.TRANSLATE_EXTRA === '1';
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

async function translate(text, target) {
  if (!text || !text.trim()) return '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { stdout } = await execFileAsync('aws', [
        '--profile', profile,
        '--region', region,
        'translate', 'translate-text',
        '--source-language-code', 'en',
        '--target-language-code', target,
        '--text', text,
        '--query', 'TranslatedText',
        '--output', 'text'
      ], { encoding: 'utf8' });
      return stdout.trim();
    } catch (error) {
      const detail = `${error.stderr || ''} ${error.message || ''}`;
      if (attempt < 3 && /InvalidSignatureException|Signature expired|ThrottlingException|TooManyRequestsException/i.test(detail)) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      throw error;
    }
  }
  return '';
}

function enqueueEntry(tasks, entry, targetKey, awsTarget) {
  entry.translations ||= {};
  entry.translations[targetKey] ||= {};
  if (entry.title && !entry.translations[targetKey].title) {
    tasks.push(async () => {
      entry.translations[targetKey].title = await translate(entry.title, awsTarget);
    });
  }
  if (includeExtra && entry.extra && !entry.translations[targetKey].extra) {
    tasks.push(async () => {
      entry.translations[targetKey].extra = await translate(entry.extra, awsTarget);
    });
  }
}

async function runLimited(tasks) {
  let next = 0;
  let done = 0;
  const workers = Array.from({ length:Math.min(concurrency, tasks.length) }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      await task();
      done++;
      if (done % 100 === 0) console.log(`  ${done}/${tasks.length} translations done`);
    }
  });
  await Promise.all(workers);
}

const files = fs.readdirSync(themesDir)
  .filter(file => file.endsWith('.json') && file !== 'index.json')
  .sort();

let changed = 0;
for (const file of files) {
  const full = path.join(themesDir, file);
  const json = JSON.parse(fs.readFileSync(full, 'utf8'));
  const tasks = [];
  for (const entry of [...(json.starts || []), ...(json.examples || [])]) {
    for (const [targetKey, awsTarget] of targets) enqueueEntry(tasks, entry, targetKey, awsTarget);
  }
  if (tasks.length) {
    console.log(`translating ${file}: ${tasks.length} missing strings`);
    await runLimited(tasks);
  } else {
    console.log(`translated ${file}: no missing strings`);
  }
  fs.writeFileSync(full, `${JSON.stringify(json, null, 2)}\n`);
  changed++;
  console.log(`translated ${file}`);
}

console.log(`Updated ${changed} theme files.`);
