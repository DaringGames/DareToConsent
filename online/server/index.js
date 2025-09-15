import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use(express.static(path.join(__dirname, '../public')));
app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  let joinInfo = { roomCode: null, playerId: null };

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
  function scheduleAbsentPrompt(room, delayMs = 10000) {
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
    scheduleAbsentPrompt(room, 10000);
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
  socket.on('room:create', ({ name }) => {
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'room:create', 10, 10*60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    const room = createRoom();
    const safeName = (typeof name === 'string' ? name.trim().slice(0, 30) : '');
    const player = { id: nano(), name: safeName || 'Player', color: null, connected: true };
    // Assign first available color
    player.color = nextColor(room);
    room.players.push(player);
    room.hostId = player.id;
    joinInfo = { roomCode: room.code, playerId: player.id };
    socket.join(room.code);
    socket.emit('player:you', { playerId: player.id });
    // Track mapping for per-socket tailoring
    socket.data = { roomCode: room.code, playerId: player.id };
    console.log(`[room:create] ${room.code} host=${player.name}`);
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
    const safeName = (typeof name === 'string' ? name.trim().slice(0, 30) : '');
    const player = { id: nano(), name: safeName || 'Player', color: null, connected: true };
    player.color = nextColor(room);
    room.players.push(player);
    joinInfo = { roomCode: room.code, playerId: player.id };
    socket.join(room.code);
    socket.emit('player:you', { playerId: player.id });
    // Track mapping for per-socket tailoring
    socket.data = { roomCode: room.code, playerId: player.id };
    console.log(`[room:join] ${room.code} ${player.name}`);
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

    // Remove from players
    const idx = room.players.findIndex(p => p.id === removedId);
    if (idx >= 0) room.players.splice(idx, 1);

    // Reassign host if needed
    if (room.hostId === removedId) {
      room.hostId = room.players[0]?.id || null;
    }

    // Update turn order and index
    if (room.turn?.order) {
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
          }
        }
      }
    }

    // Clear any absent timers targeting this player
    if (room._absent?.targetId === removedId) {
      clearAbsentTimers(room, { dismiss: true });
    }

    socket.leave(code);
    console.log(`[room:leave] ${code}`);
    // Reset join info so further emits don't go to old room
    socket.data = { roomCode: null, playerId: null };
    joinInfo = { roomCode: null, playerId: null };

    const changed = updateStateForConnectedCount(room);
    touch(room);
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
    if (typeof name === 'string') player.name = name.trim().slice(0, 30);
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

    // Authoritative server-side seeding (ignore client-provided seeds)
    let key = (typeof theme === 'string' && THEMES && THEMES[theme]) ? theme
            : (THEMES && THEMES['Sensual'] ? 'Sensual' : (theme || 'Sensual'));
    let seed = serverSeedForTheme(key);
    if (!Array.isArray(seed) || seed.length === 0) {
      key = (THEMES && THEMES['Sensual']) ? 'Sensual' : key;
      seed = serverSeedForTheme(key);
    }

    room.chosenTheme = key;
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
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'turn:selectDare', 30, 60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    room.turn.selectedDareIndex = index;
    room.turn.submissions = [];
    room.turn.status = 'collecting';
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
    touch(room);
    emitRoom(room);
  });

  socket.on('turn:pass', () => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'turn:pass', 30, 60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
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

  socket.on('turn:complete', ({ completedMostDaring }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    const ip = getClientIp(socket);
    if (!rateLimitAllow(ip, 'turn:complete', 30, 60*1000)) {
      return emitError(socket, 'Rate limit exceeded. Please wait a bit and try again.', 'RATE_LIMIT');
    }
    room.turn.status = 'done';
    room.turn.index = (room.turn.index + 1) % room.turn.order.length;
    // reset selections
    room.turn.selectedDareIndex = null;
    room.turn.submissions = [];
    // client will call menu:add if needed
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
    const titleSafe = (typeof title === 'string' ? title.trim().slice(0, 120) : '');
    const extraSafe = (typeof extra === 'string' ? extra.trim().slice(0, 160) : '');
    if (!titleSafe || !extraSafe) return;
    if ((room.dareMenu?.length || 0) >= 100) {
      return emitError(socket, 'This game already has the maximum of 100 dares.', 'DARE_LIMIT');
    }
    room.dareMenu.push({ title: titleSafe, extra: extraSafe, createdBy: joinInfo.playerId, createdAt: Date.now() });
    touch(room);
    emitRoom(room);
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

    // Update turn order and index
    if (room.turn?.order) {
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
          }
        }
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

