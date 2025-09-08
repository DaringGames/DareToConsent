import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { customAlphabet } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
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

function createRoom() {
  let code;
  do { code = generateCode(); } while (rooms.has(code));
  const room = {
    id: nano(),
    code,
    createdAt: Date.now(),
    hostId: null,
    state: 'lobby', // lobby|main
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
  const { id, code, state, players, chosenTheme, dareMenu, turn, createdAt, hostId } = room;
  return { id, code, state, players, chosenTheme, dareMenu, turn, createdAt, hostId };
}

/* removed: collaborative theme elimination */

// Serve static client
app.use(express.static(path.join(__dirname, '../public')));
app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  let joinInfo = { roomCode: null, playerId: null };

  function emitRoom(room) {
    socket.emit('room:state', roomPublicState(room));
    socket.to(joinInfo.roomCode).emit('room:state', roomPublicState(room));
  }

  socket.on('room:create', ({ name }) => {
    const room = createRoom();
    const player = { id: nano(), name: name?.trim() || 'Player', color: null, connected: true };
    // Assign first available color
    player.color = nextColor(room);
    room.players.push(player);
    room.hostId = player.id;
    joinInfo = { roomCode: room.code, playerId: player.id };
    socket.join(room.code);
    socket.emit('player:you', { playerId: player.id });
    console.log(`[room:create] ${room.code} host=${player.name}`);
    emitRoom(room);
  });

  socket.on('room:join', ({ code, name }) => {
    const room = rooms.get(code);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    const player = { id: nano(), name: name?.trim() || 'Player', color: null, connected: true };
    player.color = nextColor(room);
    room.players.push(player);
    joinInfo = { roomCode: room.code, playerId: player.id };
    socket.join(room.code);
    socket.emit('player:you', { playerId: player.id });
    console.log(`[room:join] ${room.code} ${player.name}`);
    emitRoom(room);
  });

  socket.on('room:peek', ({ code }) => {
    const room = rooms.get(code);
    if (!room) return socket.emit('room:peek:result', { ok: false });
    const colors = room.players.map(p => p.color).filter(Boolean);
    socket.emit('room:peek:result', { ok: true, state: roomPublicState(room), usedColors: colors });
  });

  socket.on('player:update', ({ name, color }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === joinInfo.playerId);
    if (!player) return;
    if (typeof name === 'string') player.name = name.trim().slice(0, 30);
    // Color updates via UI are not used in this prototype; keep unique if sent
    if (typeof color === 'string') {
      const taken = new Set(room.players.filter(p => p.id !== player.id).map(p => p.color));
      if (!taken.has(color)) player.color = color;
    }
    emitRoom(room);
  });

  // removed: collaborative theme start

  // removed: collaborative theme voting

  // removed: collaborative theme round advancement

  // removed: collaborative theme tie resolution

  socket.on('theme:finalize', ({ theme, seedDares }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room) return;
    // Only the host can start the game
    if (room.hostId !== joinInfo.playerId) return;
    // Enforce minimum player requirement of 3 connected players
    const connectedCount = room.players.filter(p => p.connected !== false).length;
    if (connectedCount < 3) return;

    const safeSeed = Array.isArray(seedDares) ? seedDares : [];
    room.chosenTheme = theme;
    room.dareMenu = safeSeed.map(d => ({ ...d, createdAt: Date.now() }));
    room.state = 'main';
    // Initialize turn order by join sequence
    room.turn = {
      order: room.players.map(p => p.id),
      index: 0,
      selectedDareIndex: null,
      submissions: [],
      status: 'collecting'
    };
    emitRoom(room);
  });

  socket.on('turn:selectDare', ({ index }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    room.turn.selectedDareIndex = index;
    room.turn.submissions = [];
    room.turn.status = 'collecting';
    emitRoom(room);
  });

  socket.on('turn:submit', ({ response }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    const playerId = joinInfo.playerId;
    const exists = room.turn.submissions.find(s => s.playerId === playerId);
    const submission = { playerId, response, ts: Date.now() };
    if (exists) Object.assign(exists, submission); else room.turn.submissions.push(submission);
    emitRoom(room);
  });

  socket.on('turn:pass', () => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    room.turn.selectedDareIndex = null;
    room.turn.submissions = [];
    room.turn.status = 'done';
    // next player
    room.turn.index = (room.turn.index + 1) % room.turn.order.length;
    room.turn.status = 'collecting';
    emitRoom(room);
  });

  socket.on('turn:complete', ({ completedMostDaring }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    room.turn.status = 'done';
    room.turn.index = (room.turn.index + 1) % room.turn.order.length;
    // reset selections
    room.turn.selectedDareIndex = null;
    room.turn.submissions = [];
    // client will call menu:add if needed
    emitRoom(room);
  });

  socket.on('menu:addDare', ({ title, extra }) => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room || room.state !== 'main') return;
    room.dareMenu.push({ title: title?.trim(), extra: extra?.trim(), createdBy: joinInfo.playerId, createdAt: Date.now() });
    emitRoom(room);
  });

  socket.on('disconnect', () => {
    const room = rooms.get(joinInfo.roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === joinInfo.playerId);
    if (player) player.connected = false;
    console.log(`[disconnect] ${joinInfo.roomCode} ${player?.name || ''}`);
    emitRoom(room);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`DareToConsent online dev server on http://localhost:${PORT}`);
});
