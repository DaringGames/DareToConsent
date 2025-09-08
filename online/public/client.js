// socket.io client is loaded globally via script tag in index.html
const socket = io();
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

const COLORS = [
  'Purple','Red','White','Brown','Grey','DkBlue','Silver','Green','Orange','Lavender','DkRed','Black','Blue','Pink','LtBlue','LtPink','Yellow','DkGreen'
];

// Color mapping for UI pills and dropdown dots
const COLOR_HEX = {
  Purple:'#7e52b7', Red:'#d64045', White:'#f4f6f9', Brown:'#8b5e3c', Grey:'#7a8a99',
  DkBlue:'#2d4e8a', Silver:'#c0c7d1', Green:'#2e8b57', Orange:'#f28c28', Lavender:'#b497c5',
  DkRed:'#8b1e2b', Black:'#0c0f15', Blue:'#3b82f6', Pink:'#e78fb3', LtBlue:'#78c4ff',
  LtPink:'#ffc4dd', Yellow:'#ffd166', DkGreen:'#1f6f43'
};

let state = { room:null, me:{ name:'', color:'' } };
let local = { addAfterComplete:false, lastCompleterId:null };

function navigate(hash){ location.hash = hash; render(); }

let selectedTheme = 'Sensual';

function titleView(){
  const codeInHash = location.hash?.slice(1) || '';
  return `
  <div class="card">
    <h1>Dare to Consent</h1>
    <p>Start a room or join one with a 3-word code.</p>
    <div class="grid">
      ${codeInHash ? '' : `
      <div class="card">
        <h3>Create Game</h3>
        <input id="create-name" placeholder="Your name" />
        <label for="create-theme"><small>Theme</small></label>
        <select id="create-theme">
          ${THEMES ? Object.keys(THEMES).map(k=>`<option value="${k}" ${k===selectedTheme?'selected':''}>${THEMES[k].name}</option>`).join('') : `<option value="Sensual" selected>Sensual</option>`}
        </select>
        <button class="primary" id="create-btn">Create</button>
      </div>
      `}
      <div class="card">
        <h3>Join Game</h3>
        <input id="join-code" placeholder="three-words-like-this" value="${codeInHash}" />
        <input id="join-name" placeholder="Your name" />
        <button class="primary" id="join-btn">Join</button>
      </div>
    </div>
  </div>`;
}

// Theme data
let THEMES = null;
async function loadThemes(){
  try {
    const res = await fetch('/data/themes.json', { cache: 'no-store' });
    THEMES = await res.json();
    render();
  } catch (e) {
    console.error('Failed to load themes.json', e);
  }
}

function lobbyView(){
  const r = state.room;
  const url = `${location.origin}/#${r.code}`;
  const isHost = r.hostId === state.me?.id;
  const canStart = !!THEMES && r.players.length >= 3 && isHost;
  return `
  <div class="card">
    <h2>Room: ${r.code}</h2>
    <div class="qr"><canvas id="qr"></canvas></div>
    <small>Share this link: <a href="${url}">${url}</a></small>
    <h3>Players</h3>
    <div class="players">${r.players.map(p=>`<span class="pill name" style="background:${COLOR_HEX[p.color]||'#1b2030'}">${p.name}</span>`).join('')}</div>
    ${isHost ? `
      <div class="col">
        <button class="primary" id="start-game" ${canStart?'':'disabled'}>${canStart?'Start Game':(!THEMES?'Loading themes…':'Waiting for at least 3 players')}</button>
      </div>
    ` : `<small>Waiting for host to start the game…</small>`}
  </div>`;
}

function seedForTheme(key){
  const t = THEMES?.[key];
  return t?.starts?.map(s => ({ title: s.title, extra: s.extra })) || [];
}

function dareButtonsHtml(){
  const r = state.room; if (!r) return '';
  const list = r.dareMenu || [];
  return `<div class="grid">${list.map((d,i)=>`
    <button class="primary" data-dare-select="${i}">${d.title}</button>
  `).join('')}</div>`;
}

function chosenDareHtml(){
  const r = state.room; if (!r) return '';
  const idx = r.turn?.selectedDareIndex;
  if (idx==null) return '';
  const d = r.dareMenu?.[idx];
  if (!d) return '';
  return `<div class="card">
    <h3>Dare</h3>
    <p><b>${d.title}</b><br/><small>Extra: ${d.extra||'—'}</small></p>
  </div>`;
}

function submissionsTable(){
  const r = state.room; if (!r) return '';
  const order = { HECK_YES:0, YES_PLEASE:1, NO_THANKS:2 };
  const rows = (r.turn?.submissions||[]).slice().sort((a,b)=>{
    const d = order[a.response]-order[b.response];
    return d!==0?d:a.ts-b.ts;
  });
  return `<table class="table">
    <thead><tr><th>Player</th><th>Response</th></tr></thead>
    <tbody>${rows.map(s=>{
      const p = r.players.find(p=>p.id===s.playerId);
      const resp = s.response;
      return `<tr><td>${p?.name||'Player'}</td><td class="response-${resp}">${resp.replace('_',' ')}</td></tr>`;
    }).join('')}</tbody>
  </table>`;
}

function mainView(){
  const r = state.room; if (!r) return '';
  const meId = state.me?.id || r?.players.find(p=>p.name===state.me.name && p.color===state.me.color)?.id;
  const isMyTurn = r?.turn?.order?.[r.turn.index]===meId;
  const curId = r?.turn?.order?.[r.turn.index];
  const curPlayer = r.players.find(p=>p.id===curId);
  const idx = r?.turn?.selectedDareIndex;
  const showAddOnly = !!local.addAfterComplete;

  let header = '';
  if (showAddOnly) header = 'Write a new Dare';
  else if (idx == null) header = isMyTurn ? 'Choose a dare' : `Waiting for ${curPlayer?.name||'Player'}`;
  else header = isMyTurn ? 'Complete your Dare or Pass' : 'Submit Your Card';

  let body = '';
  if (showAddOnly) {
    body = `
    <div class="card">
      <h3>Add a More Daring Dare</h3>
      <input id="new-dare" placeholder="New dare" />
      <input id="new-extra" placeholder="Extra challenge (optional)" />
      <div id="suggestions" class="players"></div>
      <button id="add-dare" class="primary">Add to Menu</button>
    </div>`;
  } else if (idx == null) {
    body = isMyTurn ? `
      <div class="card">
        ${dareButtonsHtml()}
      </div>
    ` : '';
  } else {
    // Dare selected
    const actionCard = isMyTurn ? `
      <div class="card">
        <div class="row">
          <button id="btn-pass">Pass</button>
          <button id="btn-complete" class="primary">Mark Dare Completed / Next Player</button>
        </div>
      </div>
    ` : `
      <div class="card">
        <h3>Submit Your Card</h3>
        <div class="grid">
          <button data-resp="HECK_YES" class="primary">Heck Yes</button>
          <button data-resp="YES_PLEASE">Yes Please</button>
          <button data-resp="NO_THANKS">No Thanks</button>
        </div>
      </div>
    `;
    body = `
      ${chosenDareHtml()}
      ${actionCard}
      <div class="card">
        <h3>Responses</h3>
        ${submissionsTable()}
      </div>
    `;
  }

  return `
  <div class="card">
    <h2>${header}</h2>
    ${body}
  </div>`;
}

function wordCloud(theme){
  const t = THEMES?.[theme];
  const sug = t?.suggestions||[];
  const c = $('#suggestions'); if (!c) return;
  c.innerHTML = sug.map(w=>`<button class="pill" data-suggest="${w}">${w}</button>`).join('');
}

function render(){
  const root = $('#app');
  const r = state.room;
  let html = '';
  if (!r) html = titleView();
  else if (r.state==='lobby') html = lobbyView();
  else if (r.state==='main') html = mainView();
  root.innerHTML = html;

  // wiring
  $('#create-btn')?.addEventListener('click', ()=>{
    const name = $('#create-name').value.trim()||'Player';
    const sel = $('#create-theme');
    if (sel && sel.value) selectedTheme = sel.value;
    state.me = { name };
    socket.emit('room:create', { name });
  });
  $('#create-theme')?.addEventListener('change', (e)=>{
    selectedTheme = e.target.value || 'Sensual';
  });
  $('#join-btn')?.addEventListener('click', ()=>{
    const code = $('#join-code').value.trim().toLowerCase();
    const name = $('#join-name').value.trim()||'Player';
    state.me = { name };
    socket.emit('room:join', { code, name });
  });
  $('#start-game')?.addEventListener('click', ()=>{
    const key = selectedTheme || 'Sensual';
    const seed = seedForTheme(key);
    if (!seed?.length) return;
    socket.emit('theme:finalize', { theme: key, seedDares: seed });
  });

  // Dare selection buttons with confirmation
  $$('#app [data-dare-select]')?.forEach(btn=>btn.addEventListener('click', ()=>{
    const index = +btn.getAttribute('data-dare-select');
    const d = state?.room?.dareMenu?.[index];
    const title = d?.title || 'this dare';
    if (confirm(`Use this dare?\n\n${title}`)) {
      socket.emit('turn:selectDare', { index });
    }
  }));

  // Turn actions
  $('#btn-pass')?.addEventListener('click', ()=>socket.emit('turn:pass'));
  $('#btn-complete')?.addEventListener('click', ()=>{
    const r = state.room;
    const most = r?.turn?.selectedDareIndex===r?.dareMenu?.length-1;
    // After completing the most daring dare, show ONLY the add UI
    local.addAfterComplete = !!most;
    local.lastCompleterId = state.me?.id || null;
    socket.emit('turn:complete', { completedMostDaring: !!most });
    if (local.addAfterComplete) render();
  });

  // Responses
  $$('#app [data-resp]')?.forEach(b=>b.addEventListener('click', ()=>{
    socket.emit('turn:submit', { response: b.getAttribute('data-resp') });
  }));

  // Add new dare (only visible when local.addAfterComplete)
  $('#add-dare')?.addEventListener('click', ()=>{
    const title = $('#new-dare').value.trim();
    const extra = $('#new-extra').value.trim();
    if (title) {
      socket.emit('menu:addDare', { title, extra });
      local.addAfterComplete = false;
      const nd = $('#new-dare'); const ne = $('#new-extra');
      if (nd) nd.value = '';
      if (ne) ne.value = '';
      render();
    }
  });

  // QR and suggestions
  if (r?.state==='lobby') import('/lib/qr.js').then(({default: QR})=>{
    const c = $('#qr'); if (!c) return; const q = QR(); q.canvas(c, `${location.origin}/#${r.code}`);
  });
  if (r?.state==='main') wordCloud(r.chosenTheme);
}

socket.on('room:state', (room)=>{
  state.room = room;
  // Ensure URL hash reflects the current room code for easy sharing
  if (room?.code && location.hash.slice(1) !== room.code) {
    try { history.replaceState(null, '', `#${room.code}`); } catch { location.hash = room.code; }
  }
  render();
});
socket.on('player:you', ({ playerId })=>{ state.me.id = playerId; });

function prefillFromHash(){
  const code = location.hash?.slice(1);
  if (!code) return;
  setTimeout(()=>{ const input = document.querySelector('#join-code'); if (input && !input.value) input.value = code; }, 0);
}

render();
loadThemes();
prefillFromHash();
