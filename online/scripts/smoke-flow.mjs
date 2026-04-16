import { io } from 'socket.io-client';

const url = process.env.SMOKE_URL || 'http://localhost:3101';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function makePlayer(name, gender='nonbinary') {
  const socket = io(url, { transports: ['websocket'] });
  const record = { socket, name, id: null, states: [] };
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

const alice = makePlayer('Alice', 'female');
const bob = makePlayer('Bob', 'male');
const casey = makePlayer('Casey', 'nonbinary');

await wait(200);
alice.socket.emit('room:create', { ...alice.profile, theme: 'Sensual' });
await wait(250);

const code = latest(alice).code;
bob.socket.emit('room:join', { code, ...bob.profile });
casey.socket.emit('room:join', { code, ...casey.profile });
await wait(400);

alice.socket.emit('theme:finalize', { theme: 'Sensual' });
await wait(600);

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
await wait(500);

let state = latest(alice);
if (state.turn.phase !== 'chooseMode') throw new Error(`expected chooseMode, got ${state.turn.phase}`);

alice.socket.emit('turn:chooseMode', { mode: 'dare' });
await wait(200);
state = latest(alice);
if (state.turn.phase !== 'chooseDare') throw new Error(`expected chooseDare, got ${state.turn.phase}`);

const dareId = state.dareMenu[0].id;
alice.socket.emit('turn:selectDare', { dareId });
await wait(200);
bob.socket.emit('turn:submitDareResponse', { dareId, value: true, sendNow: false });
casey.socket.emit('turn:submitDareResponse', { dareId, value: false, sendNow: true });
await wait(500);

state = latest(alice);
if (state.turn.phase !== 'choosePartner') throw new Error(`expected choosePartner, got ${state.turn.phase}`);

alice.socket.emit('turn:choosePartner', { playerId: bob.id });
await wait(300);
state = latest(alice);
if (state.turn.phase !== 'performing') throw new Error(`expected performing, got ${state.turn.phase}`);

alice.socket.emit('turn:complete');
await wait(300);
state = latest(alice);
if (state.turn.phase !== 'chooseMode') throw new Error(`expected chooseMode after completion, got ${state.turn.phase}`);

for (const record of [alice, bob, casey]) record.socket.close();
console.log(JSON.stringify({ ok: true, code, phase: state.turn.phase }, null, 2));
