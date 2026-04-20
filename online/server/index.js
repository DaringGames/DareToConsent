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
const LANGUAGES = ['en', 'es', 'pt'];
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
    throw e;
  }
}
function maybeSendDigest() {
  try {
    const today = new Date().toISOString().slice(0,10);
    if (stats.lastDigestDay !== today && stats.successSinceLastSend) sendDigest();
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
function sanitizePrefs(v) {
  const arr = Array.isArray(v) ? v : [];
  const out = arr.filter(x => GENDERS.includes(x));
  return out.length ? [...new Set(out)] : [...GENDERS];
}
function resolveThemeKey(name) {
  const n = String(name || '').trim().toLowerCase();
  return Object.keys(THEMES || {}).find(k => k.toLowerCase() === n) || null;
}
function serverSeedForTheme(key) {
  const t = THEMES?.[key];
  if (!t || !Array.isArray(t.starts)) return [];
  return t.starts.map(s => ({ title: s.title, extra: s.extra, spicyness: s.spicyness }));
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
    dareMenu: [],
    turn: null,
    settings: {},
    consents: {},
    consentTouched: {},
    pendingPrompts: {},
    completedSinceDareAdded: 0,
    _turnTimer: null
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
    if (!p.avatarUrl || !p.avatarUrl.startsWith(base)) continue;
    keys.push(p.avatarUrl.slice(base.length));
  }
  deleteS3Keys(keys);
}
async function sweepExpiredAvatars() {
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
function scheduleTurnTimer(room, ms, fn) {
  clearTurnTimer(room);
  if (room.turn) room.turn.timerEndsAt = Date.now() + ms;
  room._turnTimer = setTimeout(() => {
    room._turnTimer = null;
    try { fn(); } catch (e) { console.error('turn timer failed', e); }
  }, ms);
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
    timerEndsAt: null
  };
  if (room.turn.index >= room.turn.order.length) room.turn.index = 0;
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
    timerEndsAt: null
  };
}
function finalizeDareResponses(room) {
  if (!room || room.turn?.phase !== 'dareRespond') return;
  const active = activeId(room);
  const dareId = room.turn.selectedDareId;
  for (const p of connectedPlayers(room)) {
    if (p.id === active) continue;
    if (Object.prototype.hasOwnProperty.call(room.turn.responses || {}, p.id)) continue;
    const val = getConsent(room, p.id, active, dareId);
    room.turn.responses[p.id] = val;
  }
  room.turn.phase = 'choosePartner';
  room.turn.timerEndsAt = null;
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
    room.state = 'lobby';
    room.paused = true;
    clearTurnTimer(room);
    return true;
  }
  return false;
}
function safeTurnForViewer(room, viewerId) {
  if (!room.turn) return null;
  const turn = { ...room.turn };
  const active = activeId(room);
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
    const pub = {
      id: room.id,
      code: room.code,
      state: room.state,
      paused: room.paused,
      players: room.players.map(publicPlayer),
      chosenTheme: room.chosenTheme,
      dareMenu: room.dareMenu.map(d => ({ id: d.id, title: d.title, extra: d.extra, createdBy: d.createdBy || null, sourceLang: d.sourceLang || 'en', createdAt: d.createdAt })),
      turn: safeTurnForViewer(room, pid),
      createdAt: room.createdAt,
      hostId: room.hostId,
      completedSinceDareAdded: room.completedSinceDareAdded || 0,
      me: pid ? {
        id: pid,
        counts: viewerCounts(room, pid),
        consent: viewerConsent(room, pid),
        pendingPrompts: room.pendingPrompts[pid] || []
      } : null
    };
    s.emit('room:state', pub);
  }
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
app.use(express.json({ limit: '350kb' }));
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
  const key = `${AVATAR_PREFIX}/${room.code}/${player.id}-${Date.now().toString(36)}-${shortId()}.${contentType.split('/')[1]}`;
  try {
    await getS3().send(new PutObjectCommand({
      Bucket: AVATAR_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'private, max-age=28800',
      Metadata: { room: room.code, player: player.id, expires: String(Date.now() + 8 * 60 * 60 * 1000) }
    }));
    const url = `${AVATAR_BASE_URL}/${key}`;
    player.avatarUrl = url;
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
    const player = {
      id: nano(),
      name: sanitizeText(payload?.name, 30) || 'Player',
      color: null,
      avatarUrl: null,
      gender: sanitizeGender(payload?.gender),
      preferredGenders: sanitizePrefs(payload?.preferredGenders),
      language: sanitizeLanguage(payload?.language),
      connected: true
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
    const wanted = resolveThemeKey(theme);
    const fallback = resolveThemeKey('Sensual') || Object.keys(THEMES || {})[0] || null;
    room.settings.preferredTheme = wanted || fallback;
    room.chosenTheme = room.settings.preferredTheme;
    attach(room, player);
    stats.attemptedStarts++;
    logEvent(room.code, 'create', `Room created by ${player.name}`);
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
    touch(room);
    emitRoom(room);
  });

  socket.on('room:leave', () => {
    const room = currentRoom();
    if (!room) return;
    const removedId = joinInfo.playerId;
    const pending = pendingDisconnects.get(removedId);
    if (pending) { clearTimeout(pending); pendingDisconnects.delete(removedId); }
    const who = playerName(room, removedId);
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
    socket.leave(room.code);
    socket.data = { roomCode: null, playerId: null };
    joinInfo = { roomCode: null, playerId: null };
    logEvent(room.code, 'leave', `${who} left the room`);
    updateStateForConnectedCount(room);
    touch(room);
    emitRoom(room);
  });

  socket.on('room:peek', ({ code }) => {
    if (!rateLimitAllow(getClientIp(socket), 'room:peek', 180, 60*1000)) return;
    const safeCode = sanitizeText(code, 64).toLowerCase();
    if (purgeIfExpired(safeCode) || !rooms.has(safeCode)) return socket.emit('room:peek:result', { ok: false });
    const room = rooms.get(safeCode);
    socket.emit('room:peek:result', {
      ok: true,
      state: {
        code: room.code,
        state: room.state,
        players: room.players.map(publicPlayer),
        hostId: room.hostId,
        chosenTheme: room.chosenTheme
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
    attach(room, player);
    touch(room);
    emitRoom(room);
  });

  socket.on('player:update', ({ name, color, gender, preferredGenders, language }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player) return;
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
    if (!rateLimitAllow(getClientIp(socket), 'theme:finalize', 10, 60*1000)) return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    if (connectedPlayers(room).length < 3) return;
    let key = resolveThemeKey(room.settings.preferredTheme) || resolveThemeKey(room.chosenTheme) || resolveThemeKey(theme) || resolveThemeKey('Sensual') || Object.keys(THEMES || {})[0];
    let seed = serverSeedForTheme(key);
    if (!seed.length) {
      key = resolveThemeKey('Sensual') || key;
      seed = serverSeedForTheme(key);
    }
    room.chosenTheme = key;
    room.dareMenu = seed.slice(0, MAX_DARES).map(d => ({ id: shortId(), title: sanitizeText(d.title, 160), extra: sanitizeText(d.extra, 180), createdAt: Date.now(), sourceLang: 'en' }));
    room.state = 'main';
    room.paused = false;
    room.turn = { order: room.players.map(p => p.id), index: 0 };
    setChooseMode(room);
    for (const player of room.players) queueOnboardingPrompt(room, player);
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
    room.state = 'main';
    room.paused = false;
    touch(room);
    emitRoom(room);
  });

  socket.on('consent:promptSubmit', ({ promptId, type, entries, targetId, dareId, values }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player) return;
    const prompt = (room.pendingPrompts[player.id] || []).find(p => p.id === promptId);
    if (!prompt || (type && prompt.type !== type)) return;
    if (prompt.type === 'onboarding') applyOnboarding(room, player.id, entries);
    if (prompt.type === 'new-player') applyNewPlayerPrompt(room, player.id, targetId || prompt.player?.id, values || {});
    if (prompt.type === 'new-dare') applyNewDarePrompt(room, player.id, dareId || prompt.dare?.id, values || {});
    removePrompt(room, player.id, prompt.id);
    touch(room);
    emitRoom(room);
  });

  socket.on('consent:update', ({ targetId, dareId, value }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player || !findDare(room, dareId)) return;
    if (!room.players.some(p => p.id === targetId && p.id !== player.id)) return;
    setConsent(room, player.id, targetId, dareId, !!value, { touched: true });
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:chooseMode', ({ mode }) => {
    const room = currentRoom();
    if (!room || room.state !== 'main' || activeId(room) !== joinInfo.playerId || room.turn?.phase !== 'chooseMode') return;
    if (!['dare', 'player'].includes(mode)) return;
    room.turn.phase = mode === 'dare' ? 'chooseDare' : 'choosePlayer';
    room.turn.mode = mode;
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:selectDare', ({ dareId }) => {
    const room = currentRoom();
    if (!room || room.state !== 'main' || activeId(room) !== joinInfo.playerId || room.turn?.phase !== 'chooseDare') return;
    if (!findDare(room, dareId)) return;
    room.turn.phase = 'dareRespond';
    room.turn.selectedDareId = dareId;
    room.turn.selectedPlayerId = null;
    room.turn.responses = {};
    scheduleTurnTimer(room, 5000, () => finalizeDareResponses(room));
    logEvent(room.code, 'select-dare', `${playerName(room, joinInfo.playerId)} chose ${findDare(room, dareId)?.title || 'a dare'}`);
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:submitDareResponse', ({ dareId, value, sendNow }) => {
    const room = currentRoom();
    if (!room || room.turn?.phase !== 'dareRespond') return;
    const active = activeId(room);
    const playerId = joinInfo.playerId;
    if (playerId === active || dareId !== room.turn.selectedDareId) return;
    setConsent(room, playerId, active, dareId, !!value, { touched: true });
    room.turn.responses[playerId] = !!value;
    const expected = connectedPlayers(room).filter(p => p.id !== active).length;
    if (sendNow || Object.keys(room.turn.responses).length >= expected) {
      finalizeDareResponses(room);
    } else {
      scheduleTurnTimer(room, 5000, () => finalizeDareResponses(room));
      touch(room);
      emitRoom(room);
    }
  });

  socket.on('turn:selectPlayer', ({ playerId }) => {
    const room = currentRoom();
    if (!room || room.state !== 'main' || activeId(room) !== joinInfo.playerId || room.turn?.phase !== 'choosePlayer') return;
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
    if (!room || room.state !== 'main' || activeId(room) !== joinInfo.playerId) return;
    logEvent(room.code, 'pass', `${playerName(room, joinInfo.playerId)} passed`);
    advanceTurn(room);
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:complete', () => {
    const room = currentRoom();
    if (!room || room.turn?.phase !== 'performing' || activeId(room) !== joinInfo.playerId) return;
    const dareId = room.turn.performing?.dareId;
    const idx = dareIndex(room, dareId);
    const thresholdStart = Math.max(0, room.dareMenu.length - eligibleAddCount(room));
    logEvent(room.code, 'complete', `${playerName(room, joinInfo.playerId)} completed ${findDare(room, dareId)?.title || 'a dare'}`);
    if (idx >= thresholdStart) {
      clearTurnTimer(room);
      room.turn.phase = 'adding';
      room.turn.addingBy = joinInfo.playerId;
      room.turn.timerEndsAt = null;
    } else {
      room.completedSinceDareAdded = (room.completedSinceDareAdded || 0) + 1;
      advanceTurn(room);
    }
    touch(room);
    emitRoom(room);
  });

  socket.on('menu:addDare', ({ title }) => {
    const room = currentRoom();
    const player = currentPlayer(room);
    if (!room || !player || room.turn?.phase !== 'adding' || room.turn?.addingBy !== player.id) return;
    const titleSafe = sanitizeText(title, 160);
    if (!titleSafe || room.dareMenu.length >= MAX_DARES) return;
    const previous = room.dareMenu[room.dareMenu.length - 1]?.id || null;
    const dare = { id: shortId(), title: titleSafe, extra: '', createdBy: player.id, createdAt: Date.now(), sourceLang: player.language || 'en' };
    room.dareMenu.push(dare);
    room.completedSinceDareAdded = 0;
    queueNewDarePrompts(room, dare, previous);
    logEvent(room.code, 'add-dare', `${player.name} added dare: ${titleSafe}`);
    advanceTurn(room);
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
        touch(room);
        emitRoom(room);
      }
      pendingDisconnects.delete(playerId);
    }, 2000);
    pendingDisconnects.set(playerId, t);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`DareToConsent online dev server on http://localhost:${PORT}`);
});
