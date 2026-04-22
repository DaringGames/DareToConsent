import { io } from 'socket.io-client';

const url = process.env.SMOKE_URL || 'http://localhost:3101';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function makePlayer(name, gender='nonbinary') {
  const socket = io(url, { transports: ['websocket'] });
  const record = { socket, name, id: null, states: [], connected: false };
  socket.on('connect', () => { record.connected = true; });
  socket.on('disconnect', () => { record.connected = false; });
  socket.on('player:you', ({ playerId }) => { record.id = playerId; });
  socket.on('room:state', room => record.states.push(room));
  socket.on('room:error', error => { throw new Error(`${name}: ${error?.message || error?.code || 'room error'}`); });
  record.profile = {
    name,
    gender,
    preferredGenders: ['male', 'female', 'nonbinary'],
    language: 'en'
  };
  return record;
}

function latest(record) {
  const state = record.states.at(-1);
  if (!state) throw new Error(`${record.name} has no room state`);
  return state;
}

async function waitForState(record, predicate, timeoutMs=5000, stepMs=100) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const state = record.states.at(-1);
    if (state && predicate(state)) return state;
    if (Date.now() >= deadline) throw new Error(`${record.name} timed out waiting for room state`);
    await wait(stepMs);
  }
}

async function waitForConnected(record, timeoutMs=5000, stepMs=50) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (record.connected) return;
    if (Date.now() >= deadline) throw new Error(`${record.name} timed out waiting for socket connect`);
    await wait(stepMs);
  }
}

function submitNewDarePrompt(record) {
  const prompt = latest(record).me.pendingPrompts[0];
  if (!prompt || prompt.type !== 'new-dare') return;
  const values = {};
  for (const player of prompt.players || []) values[player.id] = true;
  record.socket.emit('consent:promptSubmit', {
    promptId: prompt.id,
    type: prompt.type,
    dareId: prompt.dare?.id,
    values
  });
}

const alice = makePlayer('Alice', 'female');
const bob = makePlayer('Bob', 'male');
const casey = makePlayer('Casey', 'nonbinary');

await Promise.all([waitForConnected(alice), waitForConnected(bob), waitForConnected(casey)]);
alice.socket.emit('room:create', { ...alice.profile, theme: 'Sensual' });
const code = (await waitForState(alice, state => !!state.code)).code;
bob.socket.emit('room:join', { code, ...bob.profile });
casey.socket.emit('room:join', { code, ...casey.profile });
await Promise.all([
  waitForState(alice, state => state.players?.length >= 3),
  waitForState(bob, state => state.players?.length >= 3),
  waitForState(casey, state => state.players?.length >= 3)
]);

alice.socket.emit('theme:finalize', { theme: 'Sensual' });
await Promise.all([
  waitForState(alice, state => state.me?.pendingPrompts?.[0]?.type === 'onboarding'),
  waitForState(bob, state => state.me?.pendingPrompts?.[0]?.type === 'onboarding'),
  waitForState(casey, state => state.me?.pendingPrompts?.[0]?.type === 'onboarding')
]);

for (const record of [alice, bob, casey]) {
  const prompt = latest(record).me.pendingPrompts[0];
  if (!prompt || prompt.type !== 'onboarding') throw new Error(`${record.name} missing onboarding prompt`);
  const entries = [];
  for (const dare of prompt.dares) {
    for (const player of prompt.players) {
      entries.push({ dareId: dare.id, targetId: player.id, value: true });
    }
  }
  record.socket.emit('consent:promptSubmit', { promptId: prompt.id, type: prompt.type, entries });
}

let state = await waitForState(alice, next => next.turn?.phase === 'chooseMode');
if (state.turn.phase !== 'chooseMode') throw new Error(`expected chooseMode, got ${state.turn.phase}`);

alice.socket.emit('turn:chooseMode', { mode: 'dare' });
state = await waitForState(alice, next => next.turn?.phase === 'chooseDare');
if (state.turn.phase !== 'chooseDare') throw new Error(`expected chooseDare, got ${state.turn.phase}`);

const dareId = state.dareMenu[0].id;
alice.socket.emit('turn:selectDare', { dareId });
bob.socket.emit('turn:submitDareResponse', { dareId, value: true, sendNow: false });
casey.socket.emit('turn:submitDareResponse', { dareId, value: false, sendNow: true });
state = await waitForState(alice, next => next.turn?.phase === 'choosePartner');
if (state.turn.phase !== 'choosePartner') throw new Error(`expected choosePartner, got ${state.turn.phase}`);

alice.socket.emit('turn:choosePartner', { playerId: bob.id });
state = await waitForState(alice, next => next.turn?.phase === 'performing');
if (state.turn.phase !== 'performing') throw new Error(`expected performing, got ${state.turn.phase}`);

alice.socket.emit('turn:complete');
state = await waitForState(alice, next => ['adding', 'chooseMode'].includes(next.turn?.phase));
if (state.turn.phase === 'adding') {
  const addingRecord = [alice, bob, casey].find(record => record.id === state.turn.addingBy);
  if (!addingRecord) throw new Error(`unknown adding player ${state.turn.addingBy}`);
  addingRecord.socket.emit('menu:addDare', { title: 'Share a favorite compliment' });
  await Promise.all([
    waitForState(alice, next => next.me?.pendingPrompts?.[0]?.type === 'new-dare'),
    waitForState(bob, next => next.me?.pendingPrompts?.[0]?.type === 'new-dare'),
    waitForState(casey, next => next.me?.pendingPrompts?.[0]?.type === 'new-dare')
  ]);
  for (const record of [alice, bob, casey]) submitNewDarePrompt(record);
  state = await waitForState(alice, next => next.turn?.phase === 'chooseMode');
}
if (state.turn.phase !== 'chooseMode') throw new Error(`expected chooseMode after completion, got ${state.turn.phase}`);

for (const record of [alice, bob, casey]) record.socket.close();
console.log(JSON.stringify({ ok: true, code, phase: state.turn.phase }, null, 2));
