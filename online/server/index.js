import 'dotenv/config';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Also try loading a project-root .env if running from online/ dir
try { dotenv.config({ path: path.join(__dirname, '../../.env') }); } catch {}

// Load themes on server for authoritative seeding (prefer split files, fallback to monolith)
let THEMES = {};
function loadServerThemes() {
  const themesDir = path.join(__dirname, '../public/data/themes');
  const indexPath = path.join(themesDir, 'index.json');
  try {
    if (fs.existsSync(themesDir) && fs.statSync(themesDir).isDirectory()) {
      let names = [];
      if (fs.existsSync(indexPath)) {
        const rawIdx = fs.readFileSync(indexPath, 'utf8');
        const list = JSON.parse(rawIdx);
        names = Array.isArray(list) ? list : [];
      } else {
        names = fs.readdirSync(themesDir)
          .filter(f => f.toLowerCase().endsWith('.json'))
          .map(f => path.basename(f, '.json'));
      }
      const data = {};
      for (const base of names) {
        const fp = path.join(themesDir, `${base}.json`);
        if (!fs.existsSync(fp)) continue;
        const raw = fs.readFileSync(fp, 'utf8');
        const json = JSON.parse(raw);
        const key = (json && json.name) ? json.name : base;
        data[key] = json;
      }
      if (Object.keys(data).length > 0) return data;
    }
  } catch (e) {
    console.error('Failed to load split themes', e);
  }
  // Fallback to monolith
  try {
    const monoPath = path.join(__dirname, '../public/data/themes.json');
    const raw = fs.readFileSync(monoPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load fallback themes.json', e);
    return {};
  }
}
THEMES = loadServerThemes();

// --- Analytics and daily digest email (in-memory, reset after send) ---
const stats = {
  since: Date.now(),
  visitors: new Set(),
  attemptedStarts: 0,
  successfulStarts: 0,
  games: new Map(), // code -> { code, createdAt, theme:null|string, started:false, events:[{ts,type,message}] }
  successSinceLastSend: false,
  lastSentAt: 0,
  // Initialize to today's UTC date so the first digest waits for the next day boundary
  lastDigestDay: new Date().toISOString().slice(0,10)
};

function getReqIp(req) {
  try {
    const xf = (req.headers?.['x-forwarded-for'] || '').toString();
    const ip = xf ? xf.split(',')[0].trim() : (req.socket?.remoteAddress || '');
    return ip || 'unknown';
  } catch { return 'unknown'; }
}
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
function playerName(room, pid) {
  const p = (room?.players || []).find(p => p.id === pid);
  return (p?.name || 'Player');
}

// AWS SES client (uses instance role if present)
const SES_REGION = process.env.AWS_REGION || process.env.SES_REGION || 'us-west-2';
const DIGEST_TO = process.env.DTC_DIGEST_TO || 'JamesWillettVentures@gmail.com';
const DIGEST_FROM = process.env.DTC_DIGEST_FROM || `no-reply@${process.env.DEFAULT_DOMAIN || 'daretoconsent.com'}`;
// Explicit SES identity/ARN to avoid IAM resource mismatches
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '607100099518';
const SES_IDENTITY = process.env.SES_IDENTITY || (DIGEST_FROM.includes('@') ? DIGEST_FROM.split('@')[1] : 'daretoconsent.com');
const SES_SOURCE_ARN = process.env.SES_SOURCE_ARN || `arn:aws:ses:${SES_REGION}:${AWS_ACCOUNT_ID}:identity/${SES_IDENTITY}`;
let sesClient = null;
function getSes() {
  if (!sesClient) sesClient = new SESClient({ region: SES_REGION });
  return sesClient;
}
// Track last email attempt for diagnostics
let lastEmailStatus = {
  at: 0,
  ok: false,
  messageId: null,
  error: null,
  to: DIGEST_TO,
  from: DIGEST_FROM,
  region: SES_REGION
};
function formatTs(ts) {
  try { return new Date(ts).toISOString(); } catch { return String(ts); }
}
function makeDigestText() {
  const lines = [];
  lines.push(`Dare to Consent — daily usage summary`);
  lines.push(`Period start: ${formatTs(stats.since)}`);
  lines.push(`Generated at: ${formatTs(Date.now())}`);
  lines.push('');
  lines.push(`1) Total unique visitors: ${stats.visitors.size}`);
  lines.push(`2) Attempted game starts (room:create): ${stats.attemptedStarts}`);
  lines.push(`3) Games successfully started (>=3 players and clicked start): ${stats.successfulStarts}`);
  lines.push('');
  const started = Array.from(stats.games.values())
    .filter(g => g.started)
    .sort((a,b) => b.createdAt - a.createdAt)
    .slice(0, 5);
  if (started.length === 0) {
    lines.push(`No successfully started games in this period.`);
  } else {
    lines.push(`4) Up to 5 game logs:`);
    for (const g of started) {
      lines.push('');
      lines.push(`Game ${g.code} — theme: ${g.theme || '(unknown)'} — createdAt: ${formatTs(g.createdAt)}`);
      for (const ev of g.events) {
        lines.push(` - [${formatTs(ev.ts)}] ${ev.type}: ${ev.message}`);
      }
    }
  }
  return lines.join('\n');
}
async function sendDigest({ force=false, to=null, subj=null } = {}) {
  const text = makeDigestText();
  const subject = (typeof subj === 'string' && subj.trim()) ? subj.trim() : `Dare to Consent — Daily Summary`;
  const toAddr = (typeof to === 'string' && to.trim()) ? to.trim() : DIGEST_TO;
  try {
    console.log(`[digest] preparing send from=${DIGEST_FROM} to=${toAddr} region=${SES_REGION} subj=${subj}`);
    const ses = getSes();
    const cmd = new SendEmailCommand({
      Destination: { ToAddresses: [toAddr] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Text: { Data: text, Charset: 'UTF-8' } }
      },
      Source: DIGEST_FROM,
      SourceArn: SES_SOURCE_ARN,
      ReturnPath: DIGEST_FROM,
      ReturnPathArn: SES_SOURCE_ARN
    });
    const resp = await ses.send(cmd);
    const msgId = resp?.MessageId || null;
    console.log(`[digest] sent daily summary to ${toAddr} (${msgId || 'no-id'})`);
    lastEmailStatus = {
      at: Date.now(),
      ok: true,
      messageId: msgId,
      error: null,
      to: toAddr,
      from: DIGEST_FROM,
      region: SES_REGION
    };
    // Reset counters after successful send
    stats.since = Date.now();
    stats.visitors.clear();
    stats.attemptedStarts = 0;
    stats.successfulStarts = 0;
    stats.games.clear();
    stats.successSinceLastSend = false;
    stats.lastSentAt = Date.now();
    stats.lastDigestDay = new Date().toISOString().slice(0,10); // UTC date
    return msgId;
  } catch (e) {
    console.error('[digest] failed to send summary', e);
    lastEmailStatus = {
      at: Date.now(),
      ok: false,
      messageId: null,
      error: String(e?.name || e?.message || e),
      to: toAddr,
      from: DIGEST_FROM,
      region: SES_REGION,
      sourceArn: SES_SOURCE_ARN
    };
    throw e;
  }
}
function maybeSendDigest() {
  try {
    const today = new Date().toISOString().slice(0,10); // UTC day boundary
    const dayChanged = stats.lastDigestDay !== today;
    if (!dayChanged) return;
    if (!stats.successSinceLastSend) return; // accumulate until at least one success occurs
    sendDigest({ force:false });
  } catch (e) {
    console.error('[digest] maybeSendDigest error', e);
  }
}
// Check every 5 minutes for daily send opportunity
setInterval(maybeSendDigest, 5 * 60 * 1000);

// Basic sanitization for user-provided strings: strip control chars and enforce max length
function sanitizeText(v, maxLen = 120) {
  try {
    const s = (typeof v === 'string' ? v : String(v || ''))
      .replace(/[\x00-\x1F\x7F]/g, '') // drop control chars
      .trim();
    return (typeof maxLen === 'number' ? s.slice(0, maxLen) : s);
  } catch {
    return '';
  }
}

// Resolve a theme name to a valid key in THEMES (case-insensitive), or null
function resolveThemeKey(name){
  try {
    const names = Object.keys(THEMES || {});
    const n = (name || '').toString().trim().toLowerCase();
    if (!n) return null;
    return names.find(k => k.toLowerCase() === n) || null;
  } catch { return null; }
}

function serverSeedForTheme(key) {
  try {
    const t = THEMES?.[key];
    if (!t || !Array.isArray(t.starts)) return [];
    return t.starts.map(s => ({ title: s.title, extra: s.extra }));
  } catch {
    return [];
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  maxHttpBufferSize: 1_000_000 // 1MB to prevent oversized payload abuse
});

// Three-word code generator
import words from '../public/data/words.js';
const nano = customAlphabet('abcdefghijklmnopqrstuvwxyz', 10);
function pickWord() {
  return words[Math.floor(Math.random() * words.length)];
}
function generateCode() {
  return `${pickWord()}-${pickWord()}-${pickWord()}`;
}

// Player color palette and helper
const COLORS = [
  'Purple','Red','White','Brown','Grey','DkBlue','Silver','Green','Orange','Lavender','DkRed','Black','Blue','Pink','LtBlue','LtPink','Yellow','DkGreen'
];
function nextColor(room){
  const taken = new Set(room.players.map(p=>p.color).filter(Boolean));
  return COLORS.find(c=>!taken.has(c)) || null;
}

// In-memory rooms
const rooms = new Map();
// Track pending disconnects to avoid marking a player disconnected during quick refresh/reconnect
const pendingDisconnects = new Map();

// Inactivity expiration and rate limiting
const EXPIRE_MS = 3 * 60 * 60 * 1000; // 3 hours
const SWEEP_MS = 5 * 60 * 1000; // sweep every 5 minutes
const ipCounters = new Map(); // key: ip|action -> { count, resetAt }

// Periodically prune stale rate-limit counters to avoid unbounded growth
function pruneIpCounters() {
  const now = Date.now();
  for (const [k, v] of ipCounters.entries()) {
    if (!v || v.resetAt <= now) ipCounters.delete(k);
  }
}
setInterval(pruneIpCounters, 60 * 1000);

function getClientIp(socket) {
  try {
    const xf = (socket.handshake?.headers?.['x-forwarded-for'] || '').toString();
    const ip = xf ? xf.split(',')[0].trim() : (socket.handshake?.address || '');
    return ip || 'unknown';
  } catch { return 'unknown'; }
}

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

function emitError(socket, message, code='ERROR') {
  try {
    socket.emit('room:error', { code, message });
    // legacy fallback for earlier clients
    socket.emit('error', { message, code });
  } catch {}
}

function isExpired(room) {
  if (!room) return true;
  return (Date.now() - (room.lastActivity || room.createdAt || 0)) > EXPIRE_MS;
}

function purgeIfExpired(code) {
  const room = rooms.get(code);
  if (room && isExpired(room)) {
    rooms.delete(code);
    return true;
  }
  return false;
}

function touch(room) {
  if (room) room.lastActivity = Date.now();
}

// Periodic sweep to clean up expired rooms
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if ((now - (room.lastActivity || room.createdAt || 0)) > EXPIRE_MS) {
      rooms.delete(code);
      try { io.to(code).emit('room:error', { code:'ROOM_EXPIRED', message:'Room expired' }); } catch {}
    }
  }
}, SWEEP_MS);

function createRoom() {
  let code;
  do { code = generateCode(); } while (rooms.has(code));
  const room = {
    id: nano(),
    code,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    hostId: null,
    state: 'lobby', // lobby|main
    paused: false, // whether the game is paused due to <3 connected players
    players: [], // {id,name,color,connected}
    chosenTheme: null,
    dareMenu: [], // [{title, extra, createdBy, createdAt}]
    turn: null, // see below
    settings: {}
  };
  rooms.set(code, room);
  return room;
}

function roomPublicState(room) {
  // Do not expose IPs or secrets
  const { id, code, state, paused, players, chosenTheme, dareMenu, turn, createdAt, hostId } = room;
  return { id, code, state, paused, players, chosenTheme, dareMenu, turn, createdAt, hostId };
}

/* removed: collaborative theme elimination */

// Serve static client
app.use((req, _res, next) => {
  try {
    const ip = getReqIp(req);
    if (ip) stats.visitors.add(ip);
  } catch {}
  next();
});
app.use(express.static(path.join(__dirname, '../public')));
app.get('/health', (_req, res) => res.json({ ok: true }));

// Optional admin diagnostics for digest preview/sending (guarded by token)
const ADMIN_TOKEN = process.env.DTC_ADMIN_TOKEN || null;
function adminAllowed(req) {
  if (!ADMIN_TOKEN) return false;
  try {
    const q = (req.query?.token || '').toString();
    const h = (req.headers?.['x-admin-token'] || '').toString();
    return q === ADMIN_TOKEN || h === ADMIN_TOKEN;
  } catch { return false; }
}
app.get('/admin/digest-preview', (req, res) => {
  if (!adminAllowed(req)) return res.status(404).send('Not found');
  res.type('text/plain').send(makeDigestText());
});
app.get('/admin/digest-info', (req, res) => {
  if (!adminAllowed(req)) return res.status(404).send('Not found');
  res.json({
    lastEmailStatus,
    stats: {
      since: stats.since,
      visitors: stats.visitors.size,
      attemptedStarts: stats.attemptedStarts,
      successfulStarts: stats.successfulStarts,
      lastSentAt: stats.lastSentAt || 0,
      lastDigestDay: stats.lastDigestDay,
      successSinceLastSend: !!stats.successSinceLastSend
    },
    email: {
      toDefault: DIGEST_TO,
      from: DIGEST_FROM,
      region: SES_REGION
    }
  });
});
app.post('/admin/send-digest-now', async (req, res) => {
  if (!adminAllowed(req)) return res.status(404).send('Not found');
  try {
    const to = (req.query?.to || '').toString().trim() || null;
    const subj = (req.query?.subj || '').toString().trim() || null;
    const messageId = await sendDigest({ force:true, to, subj });
    res.json({ ok: true, messageId });
  } catch (e) {
    console.error('[admin] send-digest-now failed', e);
    res.status(500).json({ ok: false, error: 'send_failed' });
  }
});

// Convenience GET endpoint so sending can be triggered via a browser URL
app.get('/admin/send-digest-now', async (req, res) => {
  if (!adminAllowed(req)) return res.status(404).send('Not found');
  try {
    const to = (req.query?.to || '').toString().trim() || null;
    const subj = (req.query?.subj || '').toString().trim() || null;
    const messageId = await sendDigest({ force:true, to, subj });
    res.json({ ok: true, messageId });
  } catch (e) {
    console.error('[admin] send-digest-now GET failed', e);
    res.status(500).json({ ok: false, error: 'send_failed' });
  }
});

io.on('connection', (socket) => {
  let joinInfo = { roomCode: null, playerId: null };
  // Count unique visitors by socket IP as well
  try { const ip = getClientIp(socket); if (ip) stats.visitors.add(ip); } catch {}

  async function emitRoom(room) {
    const base = roomPublicState(room);
    const activeId = room.turn?.order?.[room.turn?.index];

    const sockets = await io.in(room.code).fetchSockets();
    for (const s of sockets) {
      const pid = s.data?.playerId || null;

      // Clone state and filter submissions per recipient
      const pub = { ...base };
      if (room.turn) {
        const subs = room.turn.submissions || [];
        const canSeeAll = pid && activeId && pid === activeId;
        // Show all details to the active player, show only own details to others,
        // but still include placeholder entries for other responders so clients can
        // render "Responded" without revealing their choice.
        const visible = subs.map(t => {
          if (canSeeAll || t.playerId === pid) return t;
          return { playerId: t.playerId, ts: t.ts };
        });
        pub.turn = { ...room.turn, submissions: visible };
      }

      s.emit('room:state', pub);
    }
  }

  // --- Absent-player coordination helpers ---
  function getActiveId(room) {
    return room.turn?.order?.[room.turn?.index] || null;
  }
  function getActivePlayer(room) {
    const id = getActiveId(room);
    return id ? (room.players.find(p => p.id === id) || null) : null;
  }
  function ensureAbsent(room) {
    if (!room._absent) room._absent = { promptTimer: null, recheckTimer: null, targetId: null, promptId: null };
    return room._absent;
  }
  function clearAbsentTimers(room, { dismiss=false } = {}) {
    const ac = room._absent;
    if (!ac) return;
    if (ac.promptTimer) clearTimeout(ac.promptTimer);
    if (ac.recheckTimer) clearTimeout(ac.recheckTimer);
    if (dismiss && ac.promptId) io.to(room.code).emit('absent:dismiss', { promptId: ac.promptId });
    room._absent = null;
  }
  function scheduleAbsentPrompt(room, delayMs = 1000) {
    try {
      const active = getActivePlayer(room);
      const activeId = getActiveId(room);
      if (!activeId || !active) return;
      // Schedule regardless of current flag; we re-check connectivity at fire time
      console.log(`[absent] schedule prompt in ${Math.max(0, delayMs|0)}ms for`, active?.name, 'room', room.code);
      const ac = ensureAbsent(room);
      ac.targetId = activeId;
      ac.promptId = nano();
      if (ac.promptTimer) clearTimeout(ac.promptTimer);
      ac.promptTimer = setTimeout(() => {
        const r = rooms.get(room.code);
        if (!r) return;
        const currentId = getActiveId(r);
        if (!currentId || currentId !== ac.targetId) return;
        const target = r.players.find(p => p.id === ac.targetId);
        if (!target || target.connected !== false) return;
        console.log(`[absent] emit prompt for`, target?.name, 'room', r.code);
        io.to(room.code).emit('absent:prompt', { promptId: ac.promptId, targetId: ac.targetId, targetName: target.name || 'Player' });
      }, Math.max(0, delayMs|0));
    } catch (e) {
      console.error('scheduleAbsentPrompt error', e);
    }
  }
  function scheduleReaskIfStillAbsent(room, delayMs = 60000) {
    const ac = ensureAbsent(room);
    if (ac.recheckTimer) clearTimeout(ac.recheckTimer);
    ac.recheckTimer = setTimeout(() => {
      const r = rooms.get(room.code);
      if (!r) return;
      const activeId = getActiveId(r);
      if (!activeId || activeId !== ac.targetId) return;
      const target = r.players.find(p => p.id === ac.targetId);
      if (!target || target.connected !== false) return;
      ac.promptId = nano();
      io.to(room.code).emit('absent:prompt', { promptId: ac.promptId, targetId: ac.targetId, targetName: target.name || 'Player' });
    }, Math.max(0, delayMs|0));
  }
  function onTurnFocus(room) {
    const act = getActivePlayer(room);
    console.log(`[turn] focus room ${room.code} active=`, act?.name, 'connected=', act?.connected);
    clearAbsentTimers(room, { dismiss: true });
    scheduleAbsentPrompt(room, 1000);
  }
  // Pause the game if connected players drop below 3; returns true if state changed
  function updateStateForConnectedCount(room) {
    const connectedCount = (room.players || []).filter(p => p.connected !== false).length;
    if (room.state === 'main' && connectedCount < 3) {
      room.state = 'lobby';
      room.paused = true;
      console.log(`[pause] room ${room.code} paused due to insufficient players (${connectedCount})`);
      return true;
    }
    return false;
  }
  socket.on('room:create', ({ name, theme }) => {
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'room:create', 10, 10*60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    const room = createRoom();
    const safeName = sanitizeText(name, 30);
    const player = { id: nano(), name: safeName || 'Player', color: null, connected: true };
    // Assign first available color
    player.color = nextColor(room);
    room.players.push(player);
    room.hostId = player.id;
    // Persist the creator's theme preference so later "start game" uses it authoritatively
    try {
      const wanted = (typeof theme === 'string' ? theme : null);
      const resolved = resolveThemeKey(wanted);
      const fallback = resolveThemeKey('Sensual') || (Object.keys(THEMES||{})[0] || null);
      const pref = resolved || fallback;
      room.settings = room.settings || {};
      if (pref) {
        room.settings.preferredTheme = pref;
        // Reflect intended theme in lobby state so all clients see it before the game starts
        room.chosenTheme = pref;
        console.log(`[room:create] theme pref=${pref} (requested=${wanted||''}) room=${room.code}`);
      } else {
        console.warn(`[room:create] no valid theme resolved (requested=${wanted||''}) room=${room.code}`);
      }
    } catch (e) {
      console.error('[room:create] failed to resolve/store preferred theme', e);
    }
    joinInfo = { roomCode: room.code, playerId: player.id };
    socket.join(room.code);
    socket.emit('player:you', { playerId: player.id });
    // Track mapping for per-socket tailoring
    socket.data = { roomCode: room.code, playerId: player.id };
    console.log(`[room:create] ${room.code} host=${player.name}`);
    try {
      stats.attemptedStarts++;
      logEvent(room.code, 'create', `Room created by ${player.name}`);
    } catch {}
    touch(room);
    emitRoom(room);
  });

  socket.on('room:join', ({ code, name }) => {
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'room:join', 60, 10*60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    const safeCode = (typeof code === 'string' ? code.trim().toLowerCase().slice(0, 64) : '');
    if (purgeIfExpired(safeCode) || !rooms.has(safeCode)) {
      return emitError(socket, 'No such game (it may have expired).', 'NO_SUCH_ROOM');
    }
    const room = rooms.get(safeCode);
    const safeName = sanitizeText(name, 30);
    const player = { id: nano(), name: safeName || 'Player', color: null, connected: true };
    player.color = nextColor(room);
    room.players.push(player);
    joinInfo = { roomCode: room.code, playerId: player.id };
    socket.join(room.code);
    socket.emit('player:you', { playerId: player.id });
    // Track mapping for per-socket tailoring
    socket.data = { roomCode: room.code, playerId: player.id };
    console.log(`[room:join] ${room.code} ${player.name}`);
    try { logEvent(room.code, 'join', `${player.name} joined the room`); } catch {}

    // If a player joins while a game is in progress, add them into the turn rotation
    // so they get turns going forward. Insert them just after the current active index
    // to keep rotation fairness, and avoid duplicates.
    try {
      if (room.state === 'main' && room.turn && Array.isArray(room.turn.order)) {
        const already = room.turn.order.includes(player.id);
        if (!already) {
          const curIdx = typeof room.turn.index === 'number' ? room.turn.index : -1;
          const insertAt = Math.max(0, Math.min(room.turn.order.length, (curIdx >= 0 ? curIdx + 1 : room.turn.order.length)));
          room.turn.order.splice(insertAt, 0, player.id);
          console.log(`[room:join] inserted into turn.order at ${insertAt}; orderSize=${room.turn.order.length} room=${room.code}`);
        }
      }
    } catch (e) {
      console.warn('[room:join] failed to insert player into turn order', e);
    }

    touch(room);
    emitRoom(room);
  });

  socket.on('room:leave', () => {
    const code = joinInfo.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    // Cancel any pending disconnect flag for this player
    const pending = pendingDisconnects.get(joinInfo.playerId);
    if (pending) { clearTimeout(pending); pendingDisconnects.delete(joinInfo.playerId); }

    const removedId = joinInfo.playerId;
    const who = room.players.find(p => p.id === removedId)?.name || 'Player';

    // Remove from players
    const idx = room.players.findIndex(p => p.id === removedId);
    if (idx >= 0) room.players.splice(idx, 1);

    // Reassign host if needed
    if (room.hostId === removedId) {
      room.hostId = room.players[0]?.id || null;
    }

    // Update turn order and index (and sanitize turn state if removal affects active/authoring player)
    if (room.turn?.order) {
      const wasActive = (room.turn.order?.[room.turn.index] || null) === removedId;
      const wasAddingOwner = room.turn?.addingBy === removedId;

      const removedIdx = room.turn.order.indexOf(removedId);
      if (removedIdx >= 0) {
        room.turn.order.splice(removedIdx, 1);
        if (room.turn.order.length === 0) {
          room.turn.index = 0;
        } else {
          if (removedIdx < room.turn.index) {
            room.turn.index = (room.turn.index - 1 + room.turn.order.length) % room.turn.order.length;
          } else if (removedIdx === room.turn.index) {
            if (room.turn.index >= room.turn.order.length) room.turn.index = 0;
            // At this point, room.turn.index points to the next player
          }
        }
      }

      // Drop any submissions from the removed player
      if (Array.isArray(room.turn.submissions)) {
        room.turn.submissions = room.turn.submissions.filter(s => s && s.playerId !== removedId);
      }

      if (wasAddingOwner) {
        // Cancel authoring window and hand turn to next player
        room.turn.status = 'collecting';
        delete room.turn.addingBy;
        room.turn.selectedDareIndex = null;
        room.turn.submissions = [];
        console.log(`[remove] authoring player removed -> resume collecting index=${room.turn.index} room=${room.code}`);
      } else if (wasActive) {
        // Active chooser removed: reset selection and resume with next player
        room.turn.selectedDareIndex = null;
        room.turn.submissions = [];
        room.turn.status = 'collecting';
        console.log(`[remove] active chooser removed -> resume collecting index=${room.turn.index} room=${room.code}`);
      }
    }

    // Clear any absent timers targeting this player
    if (room._absent?.targetId === removedId) {
      clearAbsentTimers(room, { dismiss: true });
    }

    socket.leave(code);
    console.log(`[room:leave] ${code}`);
    try { logEvent(code, 'leave', `${who} left the room`); } catch {}
    // Reset join info so further emits don't go to old room
    socket.data = { roomCode: null, playerId: null };
    joinInfo = { roomCode: null, playerId: null };

    const changed = updateStateForConnectedCount(room);
    touch(room);
    if (!changed && room.state === 'main') onTurnFocus(room);
    emitRoom(room);
  });

  socket.on('room:peek', ({ code }) => {
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'room:peek', 180, 60*1000)) {
      return; // silently drop excessive peeks
    }
    const safeCode = (typeof code === 'string' ? code.trim().toLowerCase().slice(0, 64) : '');
    if (purgeIfExpired(safeCode) || !rooms.has(safeCode)) {
      return socket.emit('room:peek:result', { ok: false });
    }
    const room = rooms.get(safeCode);
    const colors = room.players.map(p => p.color).filter(Boolean);
    socket.emit('room:peek:result', { ok: true, state: roomPublicState(room), usedColors: colors });
  });

  // Resume an existing player session after refresh/reconnect
  socket.on('room:resume', ({ code, playerId }) => {
    const safeCode = (typeof code === 'string' ? code.trim().toLowerCase().slice(0, 64) : '');
    if (purgeIfExpired(safeCode) || !rooms.has(safeCode)) {
      return emitError(socket, 'No such game (it may have expired).', 'NO_SUCH_ROOM');
    }
    const room = rooms.get(safeCode);
    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    // Cancel any pending disconnect mark for this player
    const t = pendingDisconnects.get(playerId);
    if (t) { clearTimeout(t); pendingDisconnects.delete(playerId); }

    joinInfo = { roomCode: room.code, playerId: player.id };
    socket.join(room.code);
    player.connected = true;
    // If this player is the active turn, cancel any absent prompt/re-ask
    if (getActiveId(room) === player.id) {
      clearAbsentTimers(room, { dismiss: true });
    }
    socket.emit('player:you', { playerId: player.id });
    // Track mapping for per-socket tailoring
    socket.data = { roomCode: room.code, playerId: player.id };
    touch(room);
    emitRoom(room);
  });

  socket.on('player:update', ({ name, color }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room) return;
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'player:update', 30, 60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    const player = room.players.find(p => p.id === joinInfo.playerId);
    if (!player) return;
    if (typeof name === 'string') player.name = sanitizeText(name, 30);
    // Color updates via UI are not used in this prototype; keep unique if sent
    if (typeof color === 'string') {
      const taken = new Set(room.players.filter(p => p.id !== player.id).map(p => p.color));
      if (!taken.has(color)) player.color = color;
    }
    touch(room);
    emitRoom(room);
  });

  // removed: collaborative theme start

  // removed: collaborative theme voting

  // removed: collaborative theme round advancement

  // removed: collaborative theme tie resolution

  socket.on('theme:finalize', ({ theme }) => {
    const roomCode = joinInfo.roomCode;
    const playerId = joinInfo.playerId;
    const room = rooms.get(roomCode);
    if (!room) { console.warn(`[theme:finalize] no room for socket code=${roomCode}`); return; }
    const ip = getClientIp(socket);
    const player = room.players.find(p => p.id === playerId) || null;
    console.log(`[theme:finalize] request by pid=${playerId} name=${player?.name||''} ip=${ip} room=${room.code} state=${room.state} paused=${room.paused}`);

    if (!rateLimitAllow(ip, 'theme:finalize', 10, 60*1000)) {
      console.warn(`[theme:finalize] rate-limited pid=${playerId} ip=${ip}`);
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    // Allow any player to start the game when enough players are connected
    if (room.state !== 'lobby') {
      console.warn(`[theme:finalize] reject not in lobby (state=${room.state}) pid=${playerId}`);
      return;
    }
    // Enforce minimum player requirement of 3 connected players
    const connectedCount = room.players.filter(p => p.connected !== false).length;
    if (connectedCount < 3) {
      console.warn(`[theme:finalize] reject insufficient players connected=${connectedCount} pid=${playerId}`);
      return;
    }

    // Authoritative server-side seeding
    // Prefer creator's stored theme; then any lobby-reflected choice; then the request param; fallback to Sensual/first.
    const stored = resolveThemeKey(room?.settings?.preferredTheme);
    const lobby  = resolveThemeKey(room?.chosenTheme);
    const param  = resolveThemeKey(typeof theme === 'string' ? theme : null);
    const candidate = stored || lobby || param;
    let key = candidate || (resolveThemeKey('Sensual') || (Object.keys(THEMES||{})[0] || 'Sensual'));
    let seed = serverSeedForTheme(key);
    if (!Array.isArray(seed) || seed.length === 0) {
      const fb = resolveThemeKey('Sensual') || key;
      key = fb;
      seed = serverSeedForTheme(key);
    }
    console.log(`[theme:finalize] choose theme key=${key} (stored=${stored||''} lobby=${lobby||''} param=${param||''}) room=${room.code}`);

    room.chosenTheme = key;
    // Mark game started once
    try {
      const g = ensureGame(room.code);
      g.theme = key;
      if (!g.started) {
        g.started = true;
        stats.successfulStarts++;
        stats.successSinceLastSend = true;
        logEvent(room.code, 'start', `Game started (theme: ${key})`);
      } else {
        logEvent(room.code, 'start', `Game resumed (theme: ${key})`);
      }
    } catch {}
    room.dareMenu = (seed || []).slice(0, 100).map(d => ({ ...d, createdAt: Date.now() }));
    room.state = 'main';
    room.paused = false;
    // Initialize turn order by join sequence
    room.turn = {
      order: room.players.map(p => p.id),
      index: 0,
      selectedDareIndex: null,
      submissions: [],
      status: 'collecting'
    };
    touch(room);
    console.log(`[theme:finalize] START by pid=${playerId} name=${player?.name||''} room=${room.code} theme=${key} connected=${connectedCount}`);
    onTurnFocus(room);
    emitRoom(room);
  });

  // Resume game after pause (any player)
  socket.on('game:resume', () => {
    const roomCode = joinInfo.roomCode;
    const playerId = joinInfo.playerId;
    const room = rooms.get(roomCode);
    if (!room) { console.warn(`[game:resume] no room for socket code=${roomCode}`); return; }
    const ip = getClientIp(socket);
    const player = room.players.find(p => p.id === playerId) || null;
    console.log(`[game:resume] request by pid=${playerId} name=${player?.name||''} ip=${ip} room=${room.code} state=${room.state} paused=${room.paused}`);

    const connectedCount = (room.players || []).filter(p => p.connected !== false).length;
    if (connectedCount < 3) {
      console.warn(`[game:resume] reject insufficient players connected=${connectedCount} pid=${playerId}`);
      return;
    }
    room.state = 'main';
    room.paused = false;
    touch(room);
    console.log(`[game:resume] RESUME by pid=${playerId} name=${player?.name||''} room=${room.code} connected=${connectedCount}`);
    onTurnFocus(room);
    emitRoom(room);
  });

  socket.on('turn:selectDare', ({ index }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    // Block selecting a dare while a player is writing a new dare
    if (room.turn?.status === 'adding') return;
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'turn:selectDare', 30, 60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    room.turn.selectedDareIndex = index;
    room.turn.submissions = [];
    room.turn.status = 'collecting';
    try {
      const chooserId = joinInfo.playerId;
      const chooser = room.players.find(p => p.id === chooserId)?.name || 'Player';
      const title = room.dareMenu?.[index]?.title || `index ${index}`;
      logEvent(room.code, 'select', `${chooser} proposed dare: ${title}`);
    } catch {}
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:submit', ({ response }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'turn:submit', 240, 60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    const playerId = joinInfo.playerId;
    const resp = typeof response === 'string' ? response : '';
    if (!['HECK_YES','YES_PLEASE','NO_THANKS'].includes(resp)) return;
    const exists = room.turn.submissions.find(s => s.playerId === playerId);
    const submission = { playerId, response: resp, ts: Date.now() };
    if (exists) Object.assign(exists, submission); else room.turn.submissions.push(submission);
    try {
      const who = playerName(room, playerId);
      logEvent(room.code, 'respond', `${who} responded ${resp}`);
    } catch {}
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:pass', () => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    // Block pass during add-a-dare window
    if (room.turn?.status === 'adding') return;
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'turn:pass', 30, 60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }

    // Log pass event (include dare title if available) before resetting state
    try {
      const idx = room.turn?.selectedDareIndex;
      const title = (typeof idx === 'number' && idx >= 0) ? (room.dareMenu?.[idx]?.title || null) : null;
      const who = playerName(room, joinInfo.playerId);
      logEvent(room.code, 'pass', `${who} passed${title ? ` on: ${title}` : ''}`);
    } catch {}

    room.turn.selectedDareIndex = null;
    room.turn.submissions = [];
    room.turn.status = 'done';
    // next player
    room.turn.index = (room.turn.index + 1) % room.turn.order.length;
    room.turn.status = 'collecting';
    touch(room);
    onTurnFocus(room);
    emitRoom(room);
  });

  socket.on('turn:complete', ({ completedMostDaring, completerId }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'turn:complete', 30, 60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }

    const beforeIndex = room.turn?.index;
    const beforeActive = (room.turn?.order || [])[beforeIndex] || null;
    const chooser = joinInfo.playerId;

    // Reset selections for the completed dare
    room.turn.selectedDareIndex = null;
    room.turn.submissions = [];

    if (completedMostDaring) {
      // Do NOT advance the turn yet. The active chooser (current player) must write a new dare.
      room.turn.status = 'adding';
      room.turn.addingBy = chooser;
      console.log(`[turn:complete] MOST-DARING completed by chooser=${chooser}; lock add window to chooser; keep index=${beforeIndex} active=${beforeActive} room=${room.code}`);
    } else {
      // Normal completion: advance to next player and continue collecting
      room.turn.status = 'collecting';
      delete room.turn.addingBy;
      room.turn.index = (room.turn.index + 1) % room.turn.order.length;
      const afterActive = room.turn.order[room.turn.index];
      console.log(`[turn:complete] normal completion by chooser=${chooser}; index ${beforeIndex}->${room.turn.index} active=${afterActive} room=${room.code}`);
    }

    try {
      const who = playerName(room, chooser);
      logEvent(room.code, 'complete', `${who} confirmed completion${completedMostDaring ? ' (most daring)' : ''}`);
    } catch {}
    touch(room);
    onTurnFocus(room);
    emitRoom(room);
  });

  socket.on('menu:addDare', ({ title, extra }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'menu:addDare', 20, 60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    const titleSafe = sanitizeText(title, 120);
    const extraSafe = sanitizeText(extra, 160);
    if (!titleSafe || !extraSafe) return;
    if ((room.dareMenu?.length || 0) >= 100) {
      return emitError(socket, 'This game already has the maximum of 100 dares.', 'DARE_LIMIT');
    }
    room.dareMenu.push({ title: titleSafe, extra: extraSafe, createdBy: joinInfo.playerId, createdAt: Date.now() });

    try {
      const who = playerName(room, joinInfo.playerId);
      logEvent(room.code, 'add-dare', `${who} added dare: ${titleSafe} (extra: ${extraSafe})`);
    } catch {}

    // Exit 'adding' window and advance turn to the next player to choose a dare
    const beforeIndex = room.turn?.index | 0;
    room.turn.status = 'collecting';
    delete room.turn.addingBy;
    room.turn.index = (room.turn.index + 1) % room.turn.order.length;
    const afterActive = room.turn.order[room.turn.index];

    console.log(`[menu:addDare] added by pid=${joinInfo.playerId}; index ${beforeIndex}->${room.turn.index} active=${afterActive} room=${room.code}`);

    touch(room);
    onTurnFocus(room);
    emitRoom(room);
  });

  // Manual idle escalation from the active player's browser:
  // After 60s idle + 10s no response to the "Need more time?" nudge,
  // the active client emits 'idle:escalate' to ask the room if they're still playing.
  socket.on('idle:escalate', () => {
    const code = joinInfo.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room || room.state !== 'main') return;
    const activeId = (room.turn?.order || [])[room.turn?.index || 0] || null;
    // Only the active player may escalate their own idle state
    if (!activeId || activeId !== joinInfo.playerId) return;
    // Only escalate if the active player is still connected (i.e., we can see their browser)
    const target = room.players.find(p => p.id === activeId);
    if (!target || target.connected === false) return;

    const ac = ensureAbsent(room);
    ac.targetId = activeId;
    ac.promptId = nano();
    // Prompt the entire room to confirm whether the active player is still playing
    io.to(room.code).emit('absent:prompt', { promptId: ac.promptId, targetId: ac.targetId, targetName: target.name || 'Player' });
  });
 
  // One-player coordinated resolution: Is the absent active player still playing?
  socket.on('absent:response', ({ promptId, targetId, present }) => {
    const code = joinInfo.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const ac = room._absent;
    if (!ac) return;
    if (ac.promptId !== promptId || ac.targetId !== targetId) return;

    // Dismiss dialog for everyone
    io.to(room.code).emit('absent:dismiss', { promptId });

    if (present) {
      // Re-ask after 60s if still absent and still their turn
      scheduleReaskIfStillAbsent(room, 60000);
      touch(room);
      return;
    }

    // Remove the absent player from the game
    const removedId = targetId;

    // Cancel any pending disconnect timer for that player
    const pend = pendingDisconnects.get(removedId);
    if (pend) { clearTimeout(pend); pendingDisconnects.delete(removedId); }

    // Remove from players
    const idx = room.players.findIndex(p => p.id === removedId);
    if (idx >= 0) room.players.splice(idx, 1);

    // Reassign host if needed
    if (room.hostId === removedId) {
      room.hostId = room.players[0]?.id || null;
    }

    // Update turn order and index (and sanitize turn state if removal affects active/authoring player)
    if (room.turn?.order) {
      const wasActive = (room.turn.order?.[room.turn.index] || null) === removedId;
      const wasAddingOwner = room.turn?.addingBy === removedId;

      const removedIdx = room.turn.order.indexOf(removedId);
      if (removedIdx >= 0) {
        room.turn.order.splice(removedIdx, 1);
        if (room.turn.order.length === 0) {
          room.turn.index = 0;
        } else {
          if (removedIdx < room.turn.index) {
            room.turn.index = (room.turn.index - 1 + room.turn.order.length) % room.turn.order.length;
          } else if (removedIdx === room.turn.index) {
            if (room.turn.index >= room.turn.order.length) room.turn.index = 0;
            // At this point, room.turn.index points to the next player
          }
        }
      }

      // Drop any submissions from the removed player
      if (Array.isArray(room.turn.submissions)) {
        room.turn.submissions = room.turn.submissions.filter(s => s && s.playerId !== removedId);
      }

      if (wasAddingOwner) {
        // Cancel authoring window and hand turn to next player
        room.turn.status = 'collecting';
        delete room.turn.addingBy;
        room.turn.selectedDareIndex = null;
        room.turn.submissions = [];
        console.log(`[remove.absent] authoring player removed -> resume collecting index=${room.turn.index} room=${room.code}`);
      } else if (wasActive) {
        // Active chooser removed: reset selection and resume with next player
        room.turn.selectedDareIndex = null;
        room.turn.submissions = [];
        room.turn.status = 'collecting';
        console.log(`[remove.absent] active chooser removed -> resume collecting index=${room.turn.index} room=${room.code}`);
      }
    }

    // Check if we must pause due to insufficient players
    const pausedChanged = updateStateForConnectedCount(room);
    if (pausedChanged) {
      clearAbsentTimers(room, { dismiss: true });
      touch(room);
      emitRoom(room);
      return;
    }


    // Clear absent timers and push updated state
    clearAbsentTimers(room);
    touch(room);
    emitRoom(room);

    // Establish focus on the (potentially new) active player
    onTurnFocus(room);
  });
socket.on('disconnect', () => {
  const { roomCode, playerId } = joinInfo;
  if (!roomCode || !playerId) return;

  // Delay marking disconnected to allow quick refresh/resume
  const existing = pendingDisconnects.get(playerId);
  if (existing) clearTimeout(existing);

  const t = setTimeout(() => {
    const room = rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.connected = false;
      console.log(`[disconnect] ${roomCode} ${player?.name || ''}`);
      // Pause the game if too few connected remain
      const changed = updateStateForConnectedCount(room);
      touch(room);
      emitRoom(room);
      if (!changed) {
        // If it's their turn, schedule an absent prompt
        const isActive = room.turn?.order?.[room.turn.index] === playerId;
        console.log(`[absent] after disconnect isActive=${!!isActive} for`, player?.name);
        if (isActive) {
          scheduleAbsentPrompt(room, 10000);
        }
      }
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

