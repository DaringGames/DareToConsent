import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

import words from '../public/data/words.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ quiet: true });
try { dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true }); } catch {}

const nano = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);
const shortId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);
const GENDERS = ['male', 'female', 'nonbinary'];
const LANGUAGES = ['en', 'es', 'pt', 'zh', 'tl', 'vi', 'ar', 'fr', 'ko', 'ru', 'ht', 'hi', 'de', 'nl', 'pl', 'it'];
const COLORS = [
  'Purple','Red','White','Brown','Grey','DkBlue','Silver','Green','Orange','Lavender','DkRed','Black','Blue','Pink','LtBlue','LtPink','Yellow','DkGreen'
];
const EXPIRE_MS = 3 * 60 * 60 * 1000;
const SWEEP_MS = 5 * 60 * 1000;
const MAX_DARES = 100;
const AVATAR_MAX_BYTES = 180_000;
const S3_REGION = process.env.AWS_REGION || process.env.S3_REGION || 'us-west-2';
const AVATAR_BUCKET = process.env.DTC_AVATAR_BUCKET || process.env.S3_BUCKET || 'worstinworld-assets-prod';
const AVATAR_PREFIX = (process.env.DTC_AVATAR_PREFIX || 'img/dtc-selfies').replace(/^\/+|\/+$/g, '');
const AVATAR_BASE_URL = (process.env.DTC_AVATAR_BASE_URL || `https://${AVATAR_BUCKET}.s3.${S3_REGION}.amazonaws.com`).replace(/\/+$/g, '');
const AVATAR_STORAGE = (process.env.DTC_AVATAR_STORAGE || '').toLowerCase();
const AVATAR_LOCAL_ROUTE = '/avatar-cache';
const AVATAR_LOCAL_DIR = process.env.DTC_AVATAR_LOCAL_DIR || path.join(__dirname, '../.avatar-cache');
const AVATAR_TTL_MS = 8 * 60 * 60 * 1000;
const AVATAR_SWEEP_MS = 30 * 60 * 1000;

let THEMES = {};
function loadServerThemes() {
  const themesDir = path.join(__dirname, '../public/data/themes');
  const indexPath = path.join(themesDir, 'index.json');
  try {
    const names = fs.existsSync(indexPath)
      ? JSON.parse(fs.readFileSync(indexPath, 'utf8'))
      : fs.readdirSync(themesDir).filter(f => f.endsWith('.json')).map(f => path.basename(f, '.json'));
    const data = {};
    for (const baseRaw of names || []) {
      const base = String(baseRaw).replace(/\.json$/i, '');
      const fp = path.join(themesDir, `${base}.json`);
      if (!fs.existsSync(fp)) continue;
      const json = JSON.parse(fs.readFileSync(fp, 'utf8'));
      data[json?.name || base] = json;
    }
    if (Object.keys(data).length) return data;
  } catch (e) {
    console.error('Failed to load split themes', e);
  }
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/themes.json'), 'utf8'));
  } catch {
    return {};
  }
}
THEMES = loadServerThemes();

const stats = {
  since: Date.now(),
  visitors: new Set(),
  attemptedStarts: 0,
  successfulStarts: 0,
  games: new Map(),
  successSinceLastSend: false,
  lastSentAt: 0,
  lastDigestDay: new Date().toISOString().slice(0,10)
};

function ensureGame(code) {
  let g = stats.games.get(code);
  if (!g) {
    g = { code, createdAt: Date.now(), theme: null, started: false, events: [] };
    stats.games.set(code, g);
  }
  return g;
}
function logEvent(code, type, message) {
  try {
    const g = ensureGame(code);
    g.events.push({ ts: Date.now(), type, message });
    if (g.events.length > 500) g.events.shift();
  } catch {}
}
function formatTs(ts) {
  try { return new Date(ts).toISOString(); } catch { return String(ts); }
}

const SES_REGION = process.env.AWS_REGION || process.env.SES_REGION || 'us-west-2';
const DIGEST_TO = process.env.DTC_DIGEST_TO || null;
const DIGEST_FROM = process.env.DTC_DIGEST_FROM || `no-reply@${process.env.DEFAULT_DOMAIN || 'daretoconsent.com'}`;
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '607100099518';
const SES_IDENTITY = process.env.SES_IDENTITY || (DIGEST_FROM.includes('@') ? DIGEST_FROM.split('@')[1] : 'daretoconsent.com');
const SES_SOURCE_ARN = process.env.SES_SOURCE_ARN || `arn:aws:ses:${SES_REGION}:${AWS_ACCOUNT_ID}:identity/${SES_IDENTITY}`;
let sesClient = null;
let s3Client = null;
function getSes() {
  if (!sesClient) sesClient = new SESClient({ region: SES_REGION });
  return sesClient;
}
function getS3() {
  if (!s3Client) s3Client = new S3Client({ region: S3_REGION });
  return s3Client;
}
function isLocalHostname(hostname) {
  const h = String(hostname || '').toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h.startsWith('192.168.') || h.startsWith('10.') || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}
function useLocalAvatarStorage(req) {
  if (AVATAR_STORAGE === 'local') return true;
  if (AVATAR_STORAGE === 's3') return false;
  return isLocalHostname(req.hostname);
}
function localAvatarPathFromUrl(url) {
  if (!url || !String(url).startsWith(`${AVATAR_LOCAL_ROUTE}/`)) return null;
  const rel = String(url).slice(AVATAR_LOCAL_ROUTE.length + 1);
  const resolved = path.resolve(AVATAR_LOCAL_DIR, rel);
  const root = path.resolve(AVATAR_LOCAL_DIR);
  return resolved.startsWith(root + path.sep) ? resolved : null;
}
async function deleteLocalAvatarUrl(url) {
  const fp = localAvatarPathFromUrl(url);
  if (!fp) return;
  try { await fs.promises.rm(fp, { force: true }); } catch {}
}

let lastEmailStatus = {
  at: 0,
  ok: false,
  messageId: null,
  error: null,
  to: DIGEST_TO,
  from: DIGEST_FROM,
  region: SES_REGION
};
function makeDigestText() {
  const lines = [];
  lines.push('Dare to Consent - daily usage summary');
  lines.push(`Period start: ${formatTs(stats.since)}`);
  lines.push(`Generated at: ${formatTs(Date.now())}`);
  lines.push('');
  lines.push(`1) Total unique visitors: ${stats.visitors.size}`);
  lines.push(`2) Attempted game starts (room:create): ${stats.attemptedStarts}`);
  lines.push(`3) Games successfully started (>=3 players and clicked start): ${stats.successfulStarts}`);
  lines.push('');
  const started = Array.from(stats.games.values()).filter(g => g.started).sort((a,b) => b.createdAt - a.createdAt).slice(0, 5);
  if (!started.length) {
    lines.push('No successfully started games in this period.');
  } else {
    lines.push('4) Up to 5 game logs:');
    for (const g of started) {
      lines.push('');
      lines.push(`Game ${g.code} - theme: ${g.theme || '(unknown)'} - createdAt: ${formatTs(g.createdAt)}`);
      for (const ev of g.events) lines.push(` - [${formatTs(ev.ts)}] ${ev.type}: ${ev.message}`);
    }
  }
  return lines.join('\n');
}
async function sendDigest({ to=null, subj=null } = {}) {
  const toAddr = (typeof to === 'string' && to.trim()) ? to.trim() : DIGEST_TO;
  if (!toAddr) {
    lastEmailStatus = { at: Date.now(), ok: false, messageId: null, error: 'no_recipient_configured', to: null, from: DIGEST_FROM, region: SES_REGION };
    return null;
  }
  const subject = (typeof subj === 'string' && subj.trim()) ? subj.trim() : 'Dare to Consent - Daily Summary';
  const cmd = new SendEmailCommand({
    Destination: { ToAddresses: [toAddr] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: { Text: { Data: makeDigestText(), Charset: 'UTF-8' } }
    },
    Source: DIGEST_FROM,
    SourceArn: SES_SOURCE_ARN,
    ReturnPath: DIGEST_FROM,
    ReturnPathArn: SES_SOURCE_ARN
  });
  try {
    const resp = await getSes().send(cmd);
    lastEmailStatus = { at: Date.now(), ok: true, messageId: resp?.MessageId || null, error: null, to: toAddr, from: DIGEST_FROM, region: SES_REGION };
    stats.since = Date.now();
    stats.visitors.clear();
    stats.attemptedStarts = 0;
    stats.successfulStarts = 0;
    stats.games.clear();
    stats.successSinceLastSend = false;
    stats.lastSentAt = Date.now();
    stats.lastDigestDay = new Date().toISOString().slice(0,10);
    return resp?.MessageId || null;
  } catch (e) {
    lastEmailStatus = { at: Date.now(), ok: false, messageId: null, error: String(e?.name || e?.message || e), to: toAddr, from: DIGEST_FROM, region: SES_REGION, sourceArn: SES_SOURCE_ARN };
    console.error('[digest] sendDigest failed', e);
    return null;
  }
}
async function maybeSendDigest() {
  try {
    const today = new Date().toISOString().slice(0,10);
    if (stats.lastDigestDay !== today && stats.successSinceLastSend) await sendDigest();
  } catch (e) {
    console.error('[digest] maybeSendDigest error', e);
  }
}
setInterval(maybeSendDigest, 5 * 60 * 1000);

function getReqIp(req) {
  try {
    const xf = (req.headers?.['x-forwarded-for'] || '').toString();
    return xf ? xf.split(',')[0].trim() : (req.socket?.remoteAddress || 'unknown');
  } catch { return 'unknown'; }
}
function getClientIp(socket) {
  try {
    const xf = (socket.handshake?.headers?.['x-forwarded-for'] || '').toString();
    return xf ? xf.split(',')[0].trim() : (socket.handshake?.address || 'unknown');
  } catch { return 'unknown'; }
}

const ipCounters = new Map();
function rateLimitAllow(ip, action, limit, windowMs) {
  const key = `${ip}|${action}`;
  const now = Date.now();
  const rec = ipCounters.get(key);
  if (!rec || rec.resetAt <= now) {
    ipCounters.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count < limit) {
    rec.count++;
    return true;
  }
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of ipCounters.entries()) if (!v || v.resetAt <= now) ipCounters.delete(k);
}, 60 * 1000);

function sanitizeText(v, maxLen = 120) {
  try {
    return String(v || '').replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen);
  } catch {
    return '';
  }
}
function sanitizeGender(v) {
  return GENDERS.includes(v) ? v : 'nonbinary';
}
function sanitizeLanguage(v) {
  return LANGUAGES.includes(v) ? v : 'en';
}
function sanitizeLanguageCode(v) {
  const code = String(v || '').trim().toLowerCase();
  return LANGUAGES.includes(code) ? code : null;
}
function sanitizePrefs(v) {
  const arr = Array.isArray(v) ? v : [];
  const out = arr.filter(x => GENDERS.includes(x));
  return out.length ? [...new Set(out)] : [...GENDERS];
}
function resolveThemeKey(name) {
  const n = String(name || '').trim().toLowerCase();
  return Object.keys(THEMES || {}).find(k => k.toLowerCase() === n) || null;
}
function sanitizeDareTranslations(baseTitle, baseExtra, rawTranslations) {
  const out = {};
  const titleEn = sanitizeText(baseTitle, 160);
  const extraEn = sanitizeText(baseExtra, 180);
  if (titleEn || extraEn) {
    out.en = {};
    if (titleEn) out.en.title = titleEn;
    if (extraEn) out.en.extra = extraEn;
  }
  for (const [rawCode, copy] of Object.entries(rawTranslations || {})) {
    const code = sanitizeLanguageCode(rawCode);
    if (!code) continue;
    const title = sanitizeText(copy?.title, 160);
    const extra = sanitizeText(copy?.extra, 180);
    if (!title && !extra) continue;
    out[code] ||= {};
    if (title) out[code].title = title;
    if (extra) out[code].extra = extra;
  }
  return out;
}
function buildThemeDareRecord(room, entry, { section, index, createdBy=null } = {}) {
  const translations = sanitizeDareTranslations(entry?.title, entry?.extra, entry?.translations);
  const menuLanguage = room?.menuLanguage || 'en';
  const menuCopy = translations[menuLanguage] || translations.en || {};
  const sourceLang = translations[menuLanguage]?.title ? menuLanguage : 'en';
  return {
    id: shortId(),
    title: sanitizeText(menuCopy.title, 160),
    extra: sanitizeText(menuCopy.extra, 180),
    translations,
    createdBy,
    createdAt: Date.now(),
    sourceLang,
    themeRef: section ? { theme: room?.chosenTheme || null, section, index } : null
  };
}
function serverSeedForTheme(room, key) {
  const t = THEMES?.[key];
  if (!t || !Array.isArray(t.starts)) return [];
  return t.starts.map((s, index) => ({ ...buildThemeDareRecord(room, s, { section:'starts', index }), spicyness: s.spicyness }));
}
function themeEntry(key, section, index) {
  const list = THEMES?.[key]?.[section];
  return Array.isArray(list) ? list[index] || null : null;
}
function pickWord() {
  return words[Math.floor(Math.random() * words.length)];
}
function generateCode() {
  return `${pickWord()}-${pickWord()}-${pickWord()}`;
}
function nextColor(room) {
  const taken = new Set(room.players.map(p => p.color).filter(Boolean));
  return COLORS.find(c => !taken.has(c)) || null;
}
function emitError(socket, message, code='ERROR') {
  socket.emit('room:error', { code, message });
}
function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    avatarUrl: p.avatarUrl || null,
    gender: p.gender,
    language: p.language || 'en',
    connected: p.connected !== false
  };
}

const rooms = new Map();
const pendingDisconnects = new Map();
const DISCONNECT_GRACE_MS = 5000;
const PRESENCE_IDLE_MS = 30000;
const PRESENCE_CONFIRM_MS = 30000;

function createRoom() {
  let code;
  do { code = generateCode(); } while (rooms.has(code));
  const room = {
    id: nano(),
    code,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    hostId: null,
    state: 'lobby',
    paused: false,
    players: [],
    chosenTheme: null,
    menuLanguage: 'en',
    dareMenu: [],
    turn: null,
    settings: {},
    consents: {},
    consentTouched: {},
    pendingPrompts: {},
    completedSinceDareAdded: 0,
    _turnTimer: null,
    _presence: null,
    _presenceTimer: null
  };
  rooms.set(code, room);
  return room;
}
function touch(room) {
  if (room) room.lastActivity = Date.now();
}
function isExpired(room) {
  return !room || (Date.now() - (room.lastActivity || room.createdAt || 0)) > EXPIRE_MS;
}
function purgeIfExpired(code) {
  const room = rooms.get(code);
  if (room && isExpired(room)) {
    clearTurnTimer(room);
    purgeRoomAvatars(room);
    rooms.delete(code);
    return true;
  }
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if ((now - (room.lastActivity || room.createdAt || 0)) > EXPIRE_MS) {
      clearTurnTimer(room);
      purgeRoomAvatars(room);
      rooms.delete(code);
      io.to(code).emit('room:error', { code: 'ROOM_EXPIRED', message: 'Room expired' });
    }
  }
}, SWEEP_MS);

async function deleteS3Keys(keys) {
  if (!keys.length) return;
  try {
    await getS3().send(new DeleteObjectsCommand({
      Bucket: AVATAR_BUCKET,
      Delete: { Objects: keys.map(Key => ({ Key })), Quiet: true }
    }));
  } catch (e) {
    console.warn('[avatar] delete failed', e?.name || e?.message || e);
  }
}
function purgeRoomAvatars(room) {
  const keys = [];
  const base = `${AVATAR_BASE_URL}/`;
  for (const p of room?.players || []) {
    if (!p.avatarUrl) continue;
    if (p.avatarUrl.startsWith(base)) {
      keys.push(p.avatarUrl.slice(base.length));
    } else {
      deleteLocalAvatarUrl(p.avatarUrl);
    }
  }
  deleteS3Keys(keys);
}
async function sweepExpiredLocalAvatars() {
  const cutoff = Date.now() - AVATAR_TTL_MS;
  const walk = async dir => {
    let entries = [];
    try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return; }
    await Promise.all(entries.map(async entry => {
      const fp = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fp);
        try { await fs.promises.rmdir(fp); } catch {}
        return;
      }
      try {
        const st = await fs.promises.stat(fp);
        if (st.mtimeMs < cutoff) await fs.promises.rm(fp, { force: true });
      } catch {}
    }));
  };
  await walk(AVATAR_LOCAL_DIR);
}
async function sweepExpiredAvatars() {
  await sweepExpiredLocalAvatars();
  if (AVATAR_STORAGE === 'local') return;
  const cutoff = Date.now() - AVATAR_TTL_MS;
  let ContinuationToken;
  try {
    do {
      const resp = await getS3().send(new ListObjectsV2Command({
        Bucket: AVATAR_BUCKET,
        Prefix: `${AVATAR_PREFIX}/`,
        ContinuationToken
      }));
      const stale = (resp.Contents || [])
        .filter(obj => obj.Key && obj.LastModified && obj.LastModified.getTime() < cutoff)
        .map(obj => obj.Key);
      for (let i = 0; i < stale.length; i += 1000) await deleteS3Keys(stale.slice(i, i + 1000));
      ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : null;
    } while (ContinuationToken);
  } catch (e) {
    console.warn('[avatar] sweep failed', e?.name || e?.message || e);
  }
}
setInterval(sweepExpiredAvatars, AVATAR_SWEEP_MS);

function ensureConsentMaps(room, from, to) {
  room.consents[from] ||= {};
  room.consents[from][to] ||= {};
  room.consentTouched[from] ||= {};
  room.consentTouched[from][to] ||= {};
}
function getConsent(room, from, to, dareId) {
  return !!room.consents?.[from]?.[to]?.[dareId];
}
function hasTouched(room, from, to, dareId) {
  return Object.prototype.hasOwnProperty.call(room.consentTouched?.[from]?.[to] || {}, dareId);
}
function setConsent(room, from, to, dareId, value, { touched=true } = {}) {
  if (!from || !to || !dareId || from === to) return;
  ensureConsentMaps(room, from, to);
  room.consents[from][to][dareId] = !!value;
  if (touched) room.consentTouched[from][to][dareId] = true;
}
function genderDefault(player, target) {
  return !!(player?.preferredGenders || []).includes(target?.gender);
}
function playerName(room, id) {
  return room.players.find(p => p.id === id)?.name || 'Player';
}
function playerById(room, id) {
  return room?.players.find(p => p.id === id) || null;
}
function activeId(room) {
  return room.turn?.order?.[room.turn.index] || null;
}
function connectedPlayers(room) {
  return room.players.filter(p => p.connected !== false);
}
function findDare(room, dareId) {
  return room.dareMenu.find(d => d.id === dareId) || null;
}
function dareIndex(room, dareId) {
  return room.dareMenu.findIndex(d => d.id === dareId);
}
function consentCountFor(room, targetId, dareId) {
  return room.players.filter(p => p.id !== targetId && p.connected !== false && getConsent(room, p.id, targetId, dareId)).length;
}
function playerDareCountFor(room, fromId, targetId) {
  return room.dareMenu.filter(d => getConsent(room, fromId, targetId, d.id)).length;
}
function viewerConsent(room, meId) {
  const out = {};
  for (const p of room.players) {
    if (p.id === meId) continue;
    out[p.id] = {};
    for (const d of room.dareMenu) out[p.id][d.id] = getConsent(room, meId, p.id, d.id);
  }
  return out;
}
function viewerCounts(room, meId) {
  return {
    players: room.players.filter(p => p.id !== meId && p.connected !== false).map(p => ({
      playerId: p.id,
      count: playerDareCountFor(room, p.id, meId)
    })),
    dares: room.dareMenu.map(d => ({
      dareId: d.id,
      count: consentCountFor(room, meId, d.id)
    }))
  };
}
function addPrompt(room, playerId, prompt) {
  room.pendingPrompts[playerId] ||= [];
  room.pendingPrompts[playerId].push({ id: shortId(), createdAt: Date.now(), ...prompt });
}
function removePrompt(room, playerId, promptId) {
  const list = room.pendingPrompts[playerId] || [];
  room.pendingPrompts[playerId] = list.filter(p => p.id !== promptId);
}
function buildOnboardingPrompt(room, player) {
  const targets = room.players.filter(p => p.id !== player.id && p.connected !== false);
  const firstDefaults = {};
  for (const t of targets) firstDefaults[t.id] = genderDefault(player, t);
  return {
    type: 'onboarding',
    dares: room.dareMenu.map(d => ({ id: d.id, title: d.title })),
    players: targets.map(publicPlayer),
    firstDefaults
  };
}
function queueOnboardingPrompt(room, player) {
  const prompt = buildOnboardingPrompt(room, player);
  for (const dare of room.dareMenu) {
    for (const target of prompt.players) {
      setConsent(room, player.id, target.id, dare.id, !!prompt.firstDefaults[target.id], { touched: false });
    }
  }
  addPrompt(room, player.id, prompt);
}
function defaultForNewPlayerByHistory(room, player, newPlayer, dareId) {
  const sameGender = room.players.filter(p => p.id !== player.id && p.id !== newPlayer.id && p.gender === newPlayer.gender);
  let total = 0;
  let yes = 0;
  for (const target of sameGender) {
    if (!hasTouched(room, player.id, target.id, dareId)) continue;
    total++;
    if (getConsent(room, player.id, target.id, dareId)) yes++;
  }
  if (total > 0) return yes / total >= 0.5;
  return genderDefault(player, newPlayer);
}
function queueExistingPlayerNewJoinPrompts(room, newPlayer) {
  for (const player of room.players) {
    if (player.id === newPlayer.id) continue;
    const defaults = {};
    for (const dare of room.dareMenu) defaults[dare.id] = defaultForNewPlayerByHistory(room, player, newPlayer, dare.id);
    for (const dare of room.dareMenu) setConsent(room, player.id, newPlayer.id, dare.id, defaults[dare.id], { touched: false });
    addPrompt(room, player.id, {
      type: 'new-player',
      player: publicPlayer(newPlayer),
      dares: room.dareMenu.map(d => ({ id: d.id, title: d.title })),
      defaults
    });
  }
}
function queueNewDarePrompts(room, dare, previousDareId) {
  for (const player of room.players) {
    const defaults = {};
    const targets = room.players.filter(p => p.id !== player.id && p.connected !== false);
    for (const target of targets) {
      let val = genderDefault(player, target);
      if (previousDareId && hasTouched(room, player.id, target.id, previousDareId)) {
        val = getConsent(room, player.id, target.id, previousDareId);
      }
      defaults[target.id] = val;
      setConsent(room, player.id, target.id, dare.id, val, { touched: false });
    }
    addPrompt(room, player.id, {
      type: 'new-dare',
      dare: { id: dare.id, title: dare.title },
      players: targets.map(publicPlayer),
      defaults
    });
  }
}
function applyOnboarding(room, playerId, entries) {
  for (const e of Array.isArray(entries) ? entries : []) {
    if (!room.dareMenu.some(d => d.id === e.dareId)) continue;
    if (!room.players.some(p => p.id === e.targetId && p.id !== playerId)) continue;
    setConsent(room, playerId, e.targetId, e.dareId, !!e.value, { touched: true });
  }
}
function applyNewPlayerPrompt(room, playerId, targetId, values) {
  const target = room.players.find(p => p.id === targetId);
  if (!target) return;
  for (const dare of room.dareMenu) {
    setConsent(room, playerId, target.id, dare.id, !!values?.[dare.id], { touched: true });
  }
}
function applyNewDarePrompt(room, playerId, dareId, values) {
  if (!findDare(room, dareId)) return;
  for (const target of room.players) {
    if (target.id === playerId) continue;
    setConsent(room, playerId, target.id, dareId, !!values?.[target.id], { touched: true });
  }
}
function clearTurnTimer(room) {
  if (room?._turnTimer) clearTimeout(room._turnTimer);
  if (room) room._turnTimer = null;
}
function clearPresenceTimer(room) {
  if (room?._presenceTimer) clearTimeout(room._presenceTimer);
  if (room) room._presenceTimer = null;
}
function clearPresence(room) {
  clearPresenceTimer(room);
  if (room) room._presence = null;
}
function blockingTargets(room) {
  if (!room?.turn || room.state !== 'main') return [];
  const phase = room.turn.phase;
  if (phase === 'awaitingOnboarding') return onboardingPendingIds(room);
  if (['chooseMode', 'chooseDare', 'choosePlayer', 'choosePartner', 'chooseDareForPlayer'].includes(phase)) {
    return activeId(room) ? [activeId(room)] : [];
  }
  if (phase === 'adding' && room.turn.addingBy) return [room.turn.addingBy];
  return [];
}
function blockingContextKey(room, targetId) {
  if (!room?.turn || !targetId) return null;
  const phase = room.turn.phase;
  if (phase === 'awaitingOnboarding') {
    return ['awaitingOnboarding', [...onboardingPendingIds(room)].sort().join(',')].join('|');
  }
  if (phase === 'chooseMode') return ['chooseMode', activeId(room) || ''].join('|');
  if (phase === 'chooseDare') return ['chooseDare', activeId(room) || ''].join('|');
  if (phase === 'choosePlayer') return ['choosePlayer', activeId(room) || ''].join('|');
  if (phase === 'choosePartner') return ['choosePartner', activeId(room) || '', room.turn.selectedDareId || ''].join('|');
  if (phase === 'chooseDareForPlayer') return ['chooseDareForPlayer', activeId(room) || '', room.turn.selectedPlayerId || ''].join('|');
  if (phase === 'adding') return ['adding', room.turn.addingBy || ''].join('|');
  return [phase, targetId].join('|');
}
function choosePresenceTarget(room, currentId=null) {
  const blocked = blockingTargets(room)
    .map(id => playerById(room, id))
    .filter(Boolean);
  if (!blocked.length) return null;
  if (currentId && blocked.some(player => player.id === currentId)) return currentId;
  blocked.sort((a, b) => {
    if ((a.connected === false) !== (b.connected === false)) return a.connected === false ? -1 : 1;
    const aLast = a.lastInteractionAt || 0;
    const bLast = b.lastInteractionAt || 0;
    if (aLast !== bLast) return aLast - bLast;
    return (a.id || '').localeCompare(b.id || '');
  });
  return blocked[0]?.id || null;
}
function schedulePresenceSync(room, ms) {
  clearPresenceTimer(room);
  room._presenceTimer = setTimeout(() => {
    room._presenceTimer = null;
    if (!rooms.has(room.code)) return;
    if (syncPresence(room)) {
      touch(room);
      emitRoom(room);
    }
  }, Math.max(0, ms | 0));
}
function startPresenceIdle(room, targetId, blockKey, ms=PRESENCE_IDLE_MS) {
  room._presence = {
    targetId,
    blockKey,
    stage: 'idle',
    promptId: shortId(),
    countdownEndsAt: Date.now() + ms
  };
  schedulePresenceSync(room, ms);
}
function startPresenceSelf(room, targetId, blockKey, ms=PRESENCE_CONFIRM_MS) {
  room._presence = {
    targetId,
    blockKey,
    stage: 'self',
    promptId: shortId(),
    countdownEndsAt: Date.now() + ms
  };
  schedulePresenceSync(room, ms);
}
function startPresencePeer(room, targetId, blockKey) {
  clearPresenceTimer(room);
  room._presence = {
    targetId,
    blockKey,
    stage: 'peer',
    promptId: shortId(),
    countdownEndsAt: null
  };
}
function syncPresence(room) {
  if (!room) return false;
  const targetId = choosePresenceTarget(room, room._presence?.targetId || null);
  if (!targetId) {
    const had = !!room._presence;
    clearPresence(room);
    return had;
  }
  const target = playerById(room, targetId);
  if (!target) {
    const had = !!room._presence;
    clearPresence(room);
    return had;
  }
  const now = Date.now();
  const blockKey = blockingContextKey(room, targetId);
  let changed = false;
  if (!room._presence || room._presence.targetId !== targetId || room._presence.blockKey !== blockKey) {
    clearPresence(room);
    startPresenceIdle(room, targetId, blockKey, PRESENCE_IDLE_MS);
    changed = true;
  }
  const presence = room._presence;
  if (!presence) return changed;
  if (presence.stage === 'idle') {
    const endsAt = presence.countdownEndsAt || (now + PRESENCE_IDLE_MS);
    if (now >= endsAt) {
      if (target.connected === false) startPresencePeer(room, targetId, blockKey);
      else startPresenceSelf(room, targetId, blockKey);
      return true;
    }
    schedulePresenceSync(room, endsAt - now);
    return changed;
  }
  if (presence.stage === 'self') {
    if (target.connected === false || now >= (presence.countdownEndsAt || 0)) {
      startPresencePeer(room, targetId, blockKey);
      return true;
    }
    schedulePresenceSync(room, (presence.countdownEndsAt || 0) - now);
    return changed;
  }
  if (presence.stage === 'peer' && !blockingTargets(room).includes(targetId)) {
    clearPresence(room);
    return true;
  }
  return changed;
}
function notePlayerActivity(room, playerId) {
  const player = playerById(room, playerId);
  if (!player) return false;
  player.lastInteractionAt = Date.now();
  let changed = false;
  if (room._presence?.targetId === playerId) {
    clearPresence(room);
    changed = true;
  }
  return syncPresence(room) || changed;
}
function viewerPresencePrompt(room, viewerId) {
  const presence = room?._presence;
  if (!presence || !viewerId) return null;
  const target = playerById(room, presence.targetId);
  if (!target || !blockingTargets(room).includes(target.id)) return null;
  if (presence.stage === 'self' && viewerId === target.id && target.connected !== false) {
    return {
      type: 'self',
      promptId: presence.promptId,
      targetId: target.id,
      targetName: target.name || 'Player',
      countdownEndsAt: presence.countdownEndsAt || null
    };
  }
  if (presence.stage === 'peer' && viewerId !== target.id) {
    return {
      type: 'peer',
      promptId: presence.promptId,
      targetId: target.id,
      targetName: target.name || 'Player'
    };
  }
  return null;
}
async function ejectPlayerSockets(roomCode, playerId, payload) {
  const sockets = await io.in(roomCode).fetchSockets();
  await Promise.all(sockets
    .filter(s => s.data?.playerId === playerId)
    .map(async s => {
      s.emit('room:error', payload);
      try { await s.leave(roomCode); } catch {}
      try { s.data = { roomCode:null, playerId:null }; } catch {}
    }));
}
function removePlayerFromRoom(room, removedId) {
  if (!room || !removedId) return false;
  const pending = pendingDisconnects.get(removedId);
  if (pending) {
    clearTimeout(pending);
    pendingDisconnects.delete(removedId);
  }
  const exists = room.players.some(p => p.id === removedId);
  if (!exists) return false;
  room.players = room.players.filter(p => p.id !== removedId);
  delete room.pendingPrompts[removedId];
  if (room.hostId === removedId) room.hostId = room.players[0]?.id || null;
  if (room.turn?.order) {
    const oldIdx = room.turn.order.indexOf(removedId);
    const wasActive = activeId(room) === removedId;
    room.turn.order = room.turn.order.filter(id => id !== removedId);
    if (oldIdx >= 0 && oldIdx < room.turn.index) room.turn.index--;
    if (room.turn.index >= room.turn.order.length) room.turn.index = 0;
    if (wasActive) setChooseMode(room);
  }
  syncOnboardingGate(room);
  if (room._presence?.targetId === removedId) clearPresence(room);
  updateStateForConnectedCount(room);
  syncPresence(room);
  return true;
}
function scheduleTurnTimer(room, ms, fn) {
  clearTurnTimer(room);
  if (room.turn) room.turn.timerEndsAt = Date.now() + ms;
  room._turnTimer = setTimeout(() => {
    room._turnTimer = null;
    try { fn(); } catch (e) { console.error('turn timer failed', e); }
  }, ms);
}
function onboardingPendingIds(room) {
  return (room?.players || [])
    .filter(player => (room.pendingPrompts[player.id] || []).some(prompt => prompt.type === 'onboarding'))
    .map(player => player.id);
}
function syncOnboardingGate(room) {
  if (!room?.turn) return;
  const pendingSetupIds = onboardingPendingIds(room);
  room.turn.pendingSetupIds = pendingSetupIds;
  if (pendingSetupIds.length) {
    clearTurnTimer(room);
    room.turn.phase = 'awaitingOnboarding';
    room.turn.mode = null;
    room.turn.selectedDareId = null;
    room.turn.selectedPlayerId = null;
    room.turn.responses = {};
    room.turn.performing = null;
    room.turn.timerEndsAt = null;
    return;
  }
  if (room.turn.phase === 'awaitingOnboarding') room.turn.phase = 'chooseMode';
  syncPresence(room);
}
function setChooseMode(room) {
  clearTurnTimer(room);
  room.turn = {
    order: room.turn?.order?.length ? room.turn.order.filter(id => room.players.some(p => p.id === id)) : room.players.map(p => p.id),
    index: room.turn?.index || 0,
    phase: 'chooseMode',
    mode: null,
    selectedDareId: null,
    selectedPlayerId: null,
    responses: {},
    performing: null,
    timerEndsAt: null,
    pendingSetupIds: []
  };
  if (room.turn.index >= room.turn.order.length) room.turn.index = 0;
  syncOnboardingGate(room);
  syncPresence(room);
}
function advanceTurn(room) {
  clearTurnTimer(room);
  const order = (room.turn?.order || []).filter(id => room.players.some(p => p.id === id));
  room.turn = {
    order,
    index: order.length ? ((room.turn?.index || 0) + 1) % order.length : 0,
    phase: 'chooseMode',
    mode: null,
    selectedDareId: null,
    selectedPlayerId: null,
    responses: {},
    performing: null,
    timerEndsAt: null,
    pendingSetupIds: []
  };
  syncOnboardingGate(room);
  syncPresence(room);
}
function scheduleNextDareResponseTimer(room) {
  if (!room || room.turn?.phase !== 'dareRespond') return;
  const active = activeId(room);
  const pendingIds = connectedPlayers(room)
    .filter(player => player.id !== active && !Object.prototype.hasOwnProperty.call(room.turn.responses || {}, player.id))
    .map(player => player.id);
  if (!pendingIds.length) {
    finalizeDareResponses(room);
    return;
  }
  const deadlines = pendingIds
    .map(id => room.turn.responseDeadlines?.[id])
    .filter(deadline => Number.isFinite(deadline));
  if (!deadlines.length) return;
  const nextDeadline = Math.min(...deadlines);
  scheduleTurnTimer(room, Math.max(0, nextDeadline - Date.now()), () => finalizeDareResponses(room));
}
function resetDareResponseDeadline(room, playerId, ms=5000) {
  if (!room || room.turn?.phase !== 'dareRespond' || !playerId) return;
  room.turn.responseDeadlines ||= {};
  room.turn.responseDeadlines[playerId] = Date.now() + ms;
  scheduleNextDareResponseTimer(room);
}
function finalizeDareResponses(room) {
  if (!room || room.turn?.phase !== 'dareRespond') return;
  const active = activeId(room);
  const dareId = room.turn.selectedDareId;
  const now = Date.now();
  for (const p of connectedPlayers(room)) {
    if (p.id === active) continue;
    if (Object.prototype.hasOwnProperty.call(room.turn.responses || {}, p.id)) continue;
    const deadline = room.turn.responseDeadlines?.[p.id];
    if (Number.isFinite(deadline) && deadline > now) continue;
    const val = getConsent(room, p.id, active, dareId);
    room.turn.responses[p.id] = val;
    if (room.turn.responseDeadlines) delete room.turn.responseDeadlines[p.id];
  }
  const pendingIds = connectedPlayers(room)
    .filter(player => player.id !== active && !Object.prototype.hasOwnProperty.call(room.turn.responses || {}, player.id))
    .map(player => player.id);
  if (pendingIds.length) {
    scheduleNextDareResponseTimer(room);
    touch(room);
    emitRoom(room);
    return;
  }
  room.turn.phase = 'choosePartner';
  room.turn.timerEndsAt = null;
  delete room.turn.responseDeadlines;
  clearTurnTimer(room);
  touch(room);
  emitRoom(room);
}
function finalizePersonResponses(room) {
  if (!room || room.turn?.phase !== 'personRespond') return;
  const active = activeId(room);
  const targetId = room.turn.selectedPlayerId;
  const responses = {};
  for (const d of room.dareMenu) responses[d.id] = getConsent(room, targetId, active, d.id);
  room.turn.responses = responses;
  room.turn.phase = 'chooseDareForPlayer';
  room.turn.timerEndsAt = null;
  clearTurnTimer(room);
  touch(room);
  emitRoom(room);
}
function eligibleAddCount(room) {
  const completedWithoutNewDare = room.completedSinceDareAdded || 0;
  const expandedEligibility = 2 + Math.floor(Math.max(0, completedWithoutNewDare - 1) / 2);
  return Math.min(room.dareMenu.length, expandedEligibility);
}
function updateStateForConnectedCount(room) {
  const connectedCount = connectedPlayers(room).length;
  if (room.state === 'main' && connectedCount < 3) {
    const blockedId = choosePresenceTarget(room, room._presence?.targetId || null);
    const blockedPlayer = blockedId ? playerById(room, blockedId) : null;
    if (blockedPlayer?.connected === false) return false;
    room.state = 'lobby';
    room.paused = true;
    clearTurnTimer(room);
    clearPresence(room);
    return true;
  }
  return false;
}
function safeTurnForViewer(room, viewerId) {
  if (!room.turn) return null;
  const turn = { ...room.turn };
  const active = activeId(room);
  if (turn.phase === 'dareRespond') {
    if (viewerId && viewerId !== active) {
      turn.timerEndsAt = turn.responseDeadlines?.[viewerId] || null;
    }
    delete turn.responseDeadlines;
  }
  if (viewerId !== active && turn.phase !== 'performing') {
    if (turn.phase === 'choosePartner' || turn.phase === 'chooseDareForPlayer') {
      turn.responses = {};
    }
  }
  return turn;
}
async function emitRoom(room) {
  const sockets = await io.in(room.code).fetchSockets();
  for (const s of sockets) {
    const pid = s.data?.playerId || null;
    s.emit('room:state', publicRoomState(room, pid));
  }
}
function publicRoomState(room, pid) {
  return {
    id: room.id,
    code: room.code,
    state: room.state,
    paused: room.paused,
    players: room.players.map(publicPlayer),
    chosenTheme: room.chosenTheme,
    menuLanguage: room.menuLanguage || 'en',
    dareMenu: room.dareMenu.map(d => ({
      id: d.id,
      title: d.title,
      extra: d.extra,
      translations: d.translations || null,
      createdBy: d.createdBy || null,
      sourceLang: d.sourceLang || 'en',
      createdAt: d.createdAt,
      themeRef: d.themeRef || null
    })),
    turn: safeTurnForViewer(room, pid),
    createdAt: room.createdAt,
    hostId: room.hostId,
    completedSinceDareAdded: room.completedSinceDareAdded || 0,
    me: pid ? {
      id: pid,
      counts: viewerCounts(room, pid),
      consent: viewerConsent(room, pid),
      pendingPrompts: room.pendingPrompts[pid] || [],
      presencePrompt: viewerPresencePrompt(room, pid)
    } : null
  };
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 1_000_000
});

app.use((req, _res, next) => {
  try { stats.visitors.add(getReqIp(req)); } catch {}
  next();
});
app.use((req, res, next) => {
  if (req.path === '/client.js' || req.path === '/styles.css') {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});
app.use(express.json({ limit: '350kb' }));
fs.mkdirSync(AVATAR_LOCAL_DIR, { recursive: true });
app.use(AVATAR_LOCAL_ROUTE, express.static(AVATAR_LOCAL_DIR, {
  setHeaders(res) {
    res.setHeader('Cache-Control', 'private, max-age=28800');
  }
}));
app.use(express.static(path.join(__dirname, '../public')));
app.get('/health', (_req, res) => res.json({ ok: true }));

const ADMIN_TOKEN = process.env.DTC_ADMIN_TOKEN || null;
function adminAllowed(req) {
  return !!ADMIN_TOKEN && String(req.headers?.['x-admin-token'] || '') === ADMIN_TOKEN;
}
app.get('/admin/digest-preview', (req, res) => {
  if (!adminAllowed(req)) return res.status(404).send('Not found');
  res.type('text/plain').send(makeDigestText());
});
app.get('/admin/digest-info', (req, res) => {
  if (!adminAllowed(req)) return res.status(404).send('Not found');
  res.json({ lastEmailStatus, stats: { since: stats.since, visitors: stats.visitors.size, attemptedStarts: stats.attemptedStarts, successfulStarts: stats.successfulStarts, lastSentAt: stats.lastSentAt || 0, lastDigestDay: stats.lastDigestDay, successSinceLastSend: !!stats.successSinceLastSend } });
});

app.post('/api/avatar', async (req, res) => {
  const ip = getReqIp(req);
  if (!rateLimitAllow(ip, 'avatar', 20, 10 * 60 * 1000)) return res.status(429).json({ ok: false, error: 'rate_limited' });
  const code = sanitizeText(req.body?.code, 64).toLowerCase();
  const playerId = sanitizeText(req.body?.playerId, 40);
  const image = String(req.body?.image || '');
  if (purgeIfExpired(code) || !rooms.has(code)) return res.status(404).json({ ok: false, error: 'room_not_found' });
  const room = rooms.get(code);
  const player = room.players.find(p => p.id === playerId);
  if (!player) return res.status(403).json({ ok: false, error: 'player_not_found' });
  const match = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,([a-z0-9+/=]+)$/i);
  if (!match) return res.status(400).json({ ok: false, error: 'bad_image' });
  const ext = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
  const body = Buffer.from(match[2], 'base64');
  if (!body.length || body.length > AVATAR_MAX_BYTES) return res.status(400).json({ ok: false, error: 'image_too_large' });
  const magic = body.subarray(0, 12).toString('hex');
  const isJpeg = magic.startsWith('ffd8ff');
  const isPng = magic.startsWith('89504e470d0a1a0a');
  const isWebp = body.subarray(0, 4).toString() === 'RIFF' && body.subarray(8, 12).toString() === 'WEBP';
  if (!isJpeg && !isPng && !isWebp) return res.status(400).json({ ok: false, error: 'bad_image' });
  const contentType = isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/jpeg';
  const extName = contentType.split('/')[1];
  const fileName = `${player.id}-${Date.now().toString(36)}-${shortId()}.${extName}`;
  const previousUrl = player.avatarUrl;
  try {
    let url;
    if (useLocalAvatarStorage(req)) {
      const dir = path.join(AVATAR_LOCAL_DIR, room.code);
      await fs.promises.mkdir(dir, { recursive: true });
      await fs.promises.writeFile(path.join(dir, fileName), body);
      url = `${AVATAR_LOCAL_ROUTE}/${room.code}/${fileName}`;
    } else {
      const key = `${AVATAR_PREFIX}/${room.code}/${fileName}`;
      await getS3().send(new PutObjectCommand({
        Bucket: AVATAR_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'private, max-age=28800',
        Metadata: { room: room.code, player: player.id, expires: String(Date.now() + 8 * 60 * 60 * 1000) }
      }));
      url = `${AVATAR_BASE_URL}/${key}`;
    }
    player.avatarUrl = url;
    if (previousUrl && previousUrl !== url) {
      if (previousUrl.startsWith(AVATAR_LOCAL_ROUTE)) await deleteLocalAvatarUrl(previousUrl);
      else if (previousUrl.startsWith(`${AVATAR_BASE_URL}/`)) deleteS3Keys([previousUrl.slice(AVATAR_BASE_URL.length + 1)]);
    }
    touch(room);
    await emitRoom(room);
    res.json({ ok: true, url });
  } catch (e) {
    console.error('[avatar] upload failed', e);
    res.status(500).json({ ok: false, error: 'upload_failed' });
  }
});

io.on('connection', (socket) => {
  let joinInfo = { roomCode: null, playerId: null };
  try { stats.visitors.add(getClientIp(socket)); } catch {}

  function currentRoom() {
    return rooms.get(joinInfo.roomCode);
  }
  function currentPlayer(room) {
    return room?.players.find(p => p.id === joinInfo.playerId) || null;
  }
  function makePlayer(room, payload) {
    const now = Date.now();
    const player = {
      id: nano(),
      name: sanitizeText(payload?.name, 30) || 'Player',
      color: null,
      avatarUrl: null,
      gender: sanitizeGender(payload?.gender),
      preferredGenders: sanitizePrefs(payload?.preferredGenders),
      language: sanitizeLanguage(payload?.language),
      connected: true,
      lastInteractionAt: now
    };
    player.color = nextColor(room);
    return player;
  }
  function attach(room, player) {
    joinInfo = { roomCode: room.code, playerId: player.id };
    socket.join(room.code);
    socket.data = { roomCode: room.code, playerId: player.id };
    socket.emit('player:you', { playerId: player.id });
  }

  socket.on('room:create', ({ name, theme, gender, preferredGenders, language }) => {
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'room:create', 10, 10*60*1000)) return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    const room = createRoom();
    const player = makePlayer(room, { name, gender, preferredGenders, language });
    room.players.push(player);
    room.hostId = player.id;
    room.menuLanguage = player.language || 'en';
    const wanted = resolveThemeKey(theme);
    const fallback = resolveThemeKey('Sensual') || Object.keys(THEMES || {})[0] || null;
    room.settings.preferredTheme = wanted || fallback;
    room.chosenTheme = room.settings.preferredTheme;
    attach(room, player);
    stats.attemptedStarts++;
    logEvent(room.code, 'create', `Room created by ${player.name}`);
    syncPresence(room);
    touch(room);
    emitRoom(room);
  });

  socket.on('room:join', ({ code, name, gender, preferredGenders, language }) => {
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'room:join', 60, 10*60*1000)) return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    const safeCode = sanitizeText(code, 64).toLowerCase();
    if (purgeIfExpired(safeCode) || !rooms.has(safeCode)) return emitError(socket, 'No such game (it may have expired).', 'NO_SUCH_ROOM');
    const room = rooms.get(safeCode);
    const player = makePlayer(room, { name, gender, preferredGenders, language });
    room.players.push(player);
    if (room.state === 'main' && room.turn?.order) {
      const insertAt = Math.min(room.turn.order.length, (room.turn.index || 0) + 1);
      room.turn.order.splice(insertAt, 0, player.id);
      queueOnboardingPrompt(room, player);
      queueExistingPlayerNewJoinPrompts(room, player);
    }
    attach(room, player);
    logEvent(room.code, 'join', `${player.name} joined the room`);
    syncPresence(room);
    touch(room);
    emitRoom(room);
  });

  socket.on('room:leave', () => {
    const room = currentRoom();
    if (!room) return;
    const removedId = joinInfo.playerId;
    const who = playerName(room, removedId);
    removePlayerFromRoom(room, removedId);
    socket.leave(room.code);
    socket.data = { roomCode: null, playerId: null };
    joinInfo = { roomCode: null, playerId: null };
    logEvent(room.code, 'leave', `${who} left the room`);
    touch(room);
    emitRoom(room);
  });

  socket.on('room:peek', ({ code }) => {
    if (!rateLimitAllow(getClientIp(socket), 'room:peek', 180, 60*1000)) return;
    const safeCode = sanitizeText(code, 64).toLowerCase();
    if (purgeIfExpired(safeCode) || !rooms.has(safeCode)) {
      return socket.emit('room:peek:result', { ok: false, code: 'NO_SUCH_ROOM', message: 'No such game (it may have expired).' });
    }
    const room = rooms.get(safeCode);
    socket.emit('room:peek:result', {
      ok: true,
      state: {
        code: room.code,
        state: room.state,
        players: room.players.map(publicPlayer),
        hostId: room.hostId,
        chosenTheme: room.chosenTheme,
        menuLanguage: room.menuLanguage || 'en'
      }
    });
  });

  socket.on('room:resume', ({ code, playerId }) => {
    const safeCode = sanitizeText(code, 64).toLowerCase();
    if (purgeIfExpired(safeCode) || !rooms.has(safeCode)) return emitError(socket, 'No such game (it may have expired).', 'NO_SUCH_ROOM');
    const room = rooms.get(safeCode);
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;
    const t = pendingDisconnects.get(playerId);
    if (t) { clearTimeout(t); pendingDisconnects.delete(playerId); }
    player.connected = true;
    notePlayerActivity(room, player.id);
    attach(room, player);
    touch(room);
    emitRoom(room);
  });

  socket.on('player:update', ({ name, color, gender, preferredGenders, language }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player) return;
    notePlayerActivity(room, player.id);
    if (!rateLimitAllow(getClientIp(socket), 'player:update', 60, 60*1000)) return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    if (typeof name === 'string') player.name = sanitizeText(name, 30) || player.name;
    if (typeof color === 'string') {
      const taken = new Set(room.players.filter(p => p.id !== player.id).map(p => p.color));
      if (!taken.has(color)) {
        player.color = color;
        player.avatarUrl = null;
      }
    }
    if (typeof gender === 'string') player.gender = sanitizeGender(gender);
    if (Array.isArray(preferredGenders)) player.preferredGenders = sanitizePrefs(preferredGenders);
    if (typeof language === 'string') player.language = sanitizeLanguage(language);
    touch(room);
    emitRoom(room);
  });

  socket.on('theme:finalize', ({ theme }) => {
    const room = currentRoom();
    if (!room || room.state !== 'lobby') return;
    notePlayerActivity(room, joinInfo.playerId);
    if (!rateLimitAllow(getClientIp(socket), 'theme:finalize', 10, 60*1000)) return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    if (connectedPlayers(room).length < 3) return;
    let key = resolveThemeKey(room.settings.preferredTheme) || resolveThemeKey(room.chosenTheme) || resolveThemeKey(theme) || resolveThemeKey('Sensual') || Object.keys(THEMES || {})[0];
    room.chosenTheme = key;
    let seed = serverSeedForTheme(room, key);
    if (!seed.length) {
      key = resolveThemeKey('Sensual') || key;
      room.chosenTheme = key;
      seed = serverSeedForTheme(room, key);
    }
    room.dareMenu = seed.slice(0, MAX_DARES);
    room.state = 'main';
    room.paused = false;
    room.turn = { order: room.players.map(p => p.id), index: 0 };
    setChooseMode(room);
    for (const player of room.players) queueOnboardingPrompt(room, player);
    syncOnboardingGate(room);
    const g = ensureGame(room.code);
    g.theme = key;
    if (!g.started) {
      g.started = true;
      stats.successfulStarts++;
      stats.successSinceLastSend = true;
    }
    logEvent(room.code, 'start', `Game started (theme: ${key})`);
    touch(room);
    emitRoom(room);
  });

  socket.on('game:resume', () => {
    const room = currentRoom();
    if (!room || connectedPlayers(room).length < 3) return;
    notePlayerActivity(room, joinInfo.playerId);
    room.state = 'main';
    room.paused = false;
    syncPresence(room);
    touch(room);
    emitRoom(room);
  });

  socket.on('consent:promptSubmit', ({ promptId, type, entries, targetId, dareId, values }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player) return;
    notePlayerActivity(room, player.id);
    const prompt = (room.pendingPrompts[player.id] || []).find(p => p.id === promptId);
    if (!prompt || (type && prompt.type !== type)) return;
    if (prompt.type === 'onboarding') applyOnboarding(room, player.id, entries);
    if (prompt.type === 'new-player') applyNewPlayerPrompt(room, player.id, targetId || prompt.player?.id, values || {});
    if (prompt.type === 'new-dare') applyNewDarePrompt(room, player.id, dareId || prompt.dare?.id, values || {});
    removePrompt(room, player.id, prompt.id);
    if (prompt.type === 'onboarding') syncOnboardingGate(room);
    touch(room);
    emitRoom(room);
  });

  socket.on('consent:update', ({ targetId, dareId, value }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player || !findDare(room, dareId)) return;
    notePlayerActivity(room, player.id);
    if (!room.players.some(p => p.id === targetId && p.id !== player.id)) return;
    setConsent(room, player.id, targetId, dareId, !!value, { touched: true });
    if (room.turn?.phase === 'dareRespond' && player.id !== activeId(room) && dareId === room.turn.selectedDareId && targetId === activeId(room)) {
      resetDareResponseDeadline(room, player.id);
    }
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:chooseMode', ({ mode }) => {
    const room = currentRoom();
    if (!room || room.state !== 'main' || activeId(room) !== joinInfo.playerId || room.turn?.phase !== 'chooseMode') return;
    notePlayerActivity(room, joinInfo.playerId);
    if (!['dare', 'player'].includes(mode)) return;
    room.turn.phase = mode === 'dare' ? 'chooseDare' : 'choosePlayer';
    room.turn.mode = mode;
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:backToMode', () => {
    const room = currentRoom();
    if (!room || room.state !== 'main' || activeId(room) !== joinInfo.playerId) return;
    notePlayerActivity(room, joinInfo.playerId);
    if (!['chooseDare', 'choosePlayer'].includes(room.turn?.phase)) return;
    room.turn.phase = 'chooseMode';
    room.turn.mode = null;
    room.turn.selectedDareId = null;
    room.turn.selectedPlayerId = null;
    room.turn.responses = {};
    room.turn.timerEndsAt = null;
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:selectDare', ({ dareId }) => {
    const room = currentRoom();
    if (!room || room.state !== 'main' || activeId(room) !== joinInfo.playerId || room.turn?.phase !== 'chooseDare') return;
    notePlayerActivity(room, joinInfo.playerId);
    if (!findDare(room, dareId)) return;
    room.turn.phase = 'dareRespond';
    room.turn.selectedDareId = dareId;
    room.turn.selectedPlayerId = null;
    room.turn.responses = {};
    room.turn.responseDeadlines = {};
    for (const player of connectedPlayers(room)) {
      if (player.id === joinInfo.playerId) continue;
      room.turn.responseDeadlines[player.id] = Date.now() + 5000;
    }
    scheduleNextDareResponseTimer(room);
    logEvent(room.code, 'select-dare', `${playerName(room, joinInfo.playerId)} chose ${findDare(room, dareId)?.title || 'a dare'}`);
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:submitDareResponse', ({ dareId, value, sendNow }) => {
    const room = currentRoom();
    if (!room || room.turn?.phase !== 'dareRespond') return;
    notePlayerActivity(room, joinInfo.playerId);
    const active = activeId(room);
    const playerId = joinInfo.playerId;
    if (playerId === active || dareId !== room.turn.selectedDareId) return;
    setConsent(room, playerId, active, dareId, !!value, { touched: true });
    if (!sendNow) {
      resetDareResponseDeadline(room, playerId);
      touch(room);
      emitRoom(room);
      return;
    }
    room.turn.responses[playerId] = !!value;
    if (room.turn.responseDeadlines) delete room.turn.responseDeadlines[playerId];
    const expected = connectedPlayers(room).filter(p => p.id !== active).length;
    if (sendNow || Object.keys(room.turn.responses).length >= expected) {
      finalizeDareResponses(room);
    } else {
      scheduleNextDareResponseTimer(room);
      touch(room);
      emitRoom(room);
    }
  });

  socket.on('turn:selectPlayer', ({ playerId }) => {
    const room = currentRoom();
    if (!room || room.state !== 'main' || activeId(room) !== joinInfo.playerId || room.turn?.phase !== 'choosePlayer') return;
    notePlayerActivity(room, joinInfo.playerId);
    const target = room.players.find(p => p.id === playerId && p.id !== joinInfo.playerId && p.connected !== false);
    if (!target) return;
    room.turn.phase = 'personRespond';
    room.turn.selectedPlayerId = target.id;
    room.turn.selectedDareId = null;
    room.turn.responses = {};
    for (const d of room.dareMenu) room.turn.responses[d.id] = getConsent(room, target.id, joinInfo.playerId, d.id);
    scheduleTurnTimer(room, 10000, () => finalizePersonResponses(room));
    logEvent(room.code, 'select-player', `${playerName(room, joinInfo.playerId)} chose ${target.name}`);
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:submitPersonResponses', ({ entries, sendNow }) => {
    const room = currentRoom();
    if (!room || room.turn?.phase !== 'personRespond') return;
    notePlayerActivity(room, joinInfo.playerId);
    const active = activeId(room);
    if (joinInfo.playerId !== room.turn.selectedPlayerId) return;
    for (const e of Array.isArray(entries) ? entries : []) {
      if (!findDare(room, e.dareId)) continue;
      setConsent(room, joinInfo.playerId, active, e.dareId, !!e.value, { touched: true });
      room.turn.responses[e.dareId] = !!e.value;
    }
    if (sendNow) {
      finalizePersonResponses(room);
    } else {
      scheduleTurnTimer(room, 10000, () => finalizePersonResponses(room));
      touch(room);
      emitRoom(room);
    }
  });

  socket.on('turn:choosePartner', ({ playerId }) => {
    const room = currentRoom();
    if (!room || room.turn?.phase !== 'choosePartner' || activeId(room) !== joinInfo.playerId) return;
    notePlayerActivity(room, joinInfo.playerId);
    if (!room.turn.responses?.[playerId]) return;
    const dareId = room.turn.selectedDareId;
    setConsent(room, joinInfo.playerId, playerId, dareId, true, { touched: true });
    room.turn.phase = 'performing';
    room.turn.performing = { activeId: joinInfo.playerId, partnerId: playerId, dareId };
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:chooseDareForPlayer', ({ dareId }) => {
    const room = currentRoom();
    if (!room || room.turn?.phase !== 'chooseDareForPlayer' || activeId(room) !== joinInfo.playerId) return;
    notePlayerActivity(room, joinInfo.playerId);
    if (!room.turn.responses?.[dareId]) return;
    const partnerId = room.turn.selectedPlayerId;
    setConsent(room, joinInfo.playerId, partnerId, dareId, true, { touched: true });
    room.turn.phase = 'performing';
    room.turn.performing = { activeId: joinInfo.playerId, partnerId, dareId };
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:pass', () => {
    const room = currentRoom();
    if (!room || room.state !== 'main') return;
    notePlayerActivity(room, joinInfo.playerId);
    const performing = room.turn?.phase === 'performing' ? room.turn.performing : null;
    const isPerformingParticipant = performing && [performing.activeId, performing.partnerId].includes(joinInfo.playerId);
    if (!isPerformingParticipant && activeId(room) !== joinInfo.playerId) return;
    logEvent(room.code, 'pass', `${playerName(room, joinInfo.playerId)} passed`);
    advanceTurn(room);
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:complete', () => {
    const room = currentRoom();
    if (!room || room.turn?.phase !== 'performing') return;
    notePlayerActivity(room, joinInfo.playerId);
    const performing = room.turn.performing || {};
    const activePerformerId = performing.activeId;
    const partnerId = performing.partnerId;
    if (![activePerformerId, partnerId].includes(joinInfo.playerId)) return;
    const dareId = room.turn.performing?.dareId;
    const idx = dareIndex(room, dareId);
    const thresholdStart = Math.max(0, room.dareMenu.length - eligibleAddCount(room));
    logEvent(room.code, 'complete', `${playerName(room, joinInfo.playerId)} completed ${findDare(room, dareId)?.title || 'a dare'}`);
    if (idx >= thresholdStart) {
      clearTurnTimer(room);
      room.turn.phase = 'adding';
      room.turn.addingBy = activePerformerId;
      room.turn.timerEndsAt = null;
    } else {
      room.completedSinceDareAdded = (room.completedSinceDareAdded || 0) + 1;
      advanceTurn(room);
    }
    touch(room);
    emitRoom(room);
  });

  socket.on('menu:addDare', ({ title, exampleIndex }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player || room.turn?.phase !== 'adding' || room.turn?.addingBy !== player.id) return;
    notePlayerActivity(room, player.id);
    const titleSafe = sanitizeText(title, 160);
    if (!titleSafe || room.dareMenu.length >= MAX_DARES) return;
    const previous = room.dareMenu[room.dareMenu.length - 1]?.id || null;
    const example = Number.isInteger(exampleIndex) ? themeEntry(room.chosenTheme, 'examples', exampleIndex) : null;
    const dare = example
      ? buildThemeDareRecord(room, example, { section:'examples', index: exampleIndex, createdBy: player.id })
      : {
          id: shortId(),
          title: titleSafe,
          extra: '',
          translations: null,
          createdBy: player.id,
          createdAt: Date.now(),
          sourceLang: player.language || 'en',
          themeRef: null
        };
    room.dareMenu.push(dare);
    room.completedSinceDareAdded = 0;
    queueNewDarePrompts(room, dare, previous);
    logEvent(room.code, 'add-dare', `${player.name} added dare: ${dare.title}`);
    advanceTurn(room);
    touch(room);
    emitRoom(room);
  });

  socket.on('ui:activity', () => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player) return;
    const before = JSON.stringify(viewerPresencePrompt(room, player.id));
    const changed = notePlayerActivity(room, player.id);
    const after = JSON.stringify(viewerPresencePrompt(room, player.id));
    touch(room);
    if (changed && before !== after) socket.emit('room:state', publicRoomState(room, player.id));
  });

  socket.on('presence:selfConfirm', ({ promptId, targetId }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player || player.id !== targetId) return;
    const presence = room._presence;
    if (!presence || presence.promptId !== promptId || presence.targetId !== targetId || presence.stage !== 'self') return;
    notePlayerActivity(room, player.id);
    touch(room);
    emitRoom(room);
  });

  socket.on('presence:peerResponse', async ({ promptId, targetId, stillPlaying }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player || player.id === targetId) return;
    const presence = room._presence;
    if (!presence || presence.promptId !== promptId || presence.targetId !== targetId || presence.stage !== 'peer') return;
    if (stillPlaying) {
      const target = playerById(room, targetId);
      const blockKey = blockingContextKey(room, targetId);
      if (target?.connected === false) startPresenceIdle(room, targetId, blockKey, PRESENCE_IDLE_MS);
      else startPresenceSelf(room, targetId, blockKey, PRESENCE_CONFIRM_MS);
      touch(room);
      emitRoom(room);
      return;
    }
    removePlayerFromRoom(room, targetId);
    await ejectPlayerSockets(room.code, targetId, {
      code: 'PLAYER_REMOVED',
      message: 'You were removed from the game for not responding.'
    });
    touch(room);
    emitRoom(room);
  });

  socket.on('disconnect', () => {
    const { roomCode, playerId } = joinInfo;
    if (!roomCode || !playerId) return;
    const existing = pendingDisconnects.get(playerId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      const room = rooms.get(roomCode);
      if (!room) return;
      const player = room.players.find(p => p.id === playerId);
      if (player) {
        player.connected = false;
        updateStateForConnectedCount(room);
        syncPresence(room);
        touch(room);
        emitRoom(room);
      }
      pendingDisconnects.delete(playerId);
    }, DISCONNECT_GRACE_MS);
    pendingDisconnects.set(playerId, t);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`DareToConsent online dev server on http://localhost:${PORT}`);
});
