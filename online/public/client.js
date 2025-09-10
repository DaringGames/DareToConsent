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

// Choose accessible text color (#f7f9ff or #081020) based on background color
function contrastOn(hex){
  try {
    const rgb = (hex||'#000').replace('#','').trim();
    const to255 = (s)=>parseInt(s,16);
    let r,g,b;
    if (rgb.length===3){
      r = to255(rgb[0]+rgb[0]); g = to255(rgb[1]+rgb[1]); b = to255(rgb[2]+rgb[2]);
    } else {
      r = to255(rgb.slice(0,2)); g = to255(rgb.slice(2,4)); b = to255(rgb.slice(4,6));
    }
    const srgb = [r,g,b].map(v=>{
      v/=255;
      return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
    });
    const Lbg = 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
    const light = '#f7f9ff';
    const dark = '#081020';
    const Llight = (()=>{ const c=light.slice(1); const R=parseInt(c.slice(0,2),16)/255; const G=parseInt(c.slice(2,4),16)/255; const B=parseInt(c.slice(4,6),16)/255; const s=[R,G,B].map(v=>v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4)); return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2]; })();
    const Ldark = (()=>{ const c=dark.slice(1); const R=parseInt(c.slice(0,2),16)/255; const G=parseInt(c.slice(2,4),16)/255; const B=parseInt(c.slice(4,6),16)/255; const s=[R,G,B].map(v=>v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4)); return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2]; })();
    const contrast = (L1,L2)=>{ const a=Math.max(L1,L2), b=Math.min(L1,L2); return (a+0.05)/(b+0.05); };
    return contrast(Lbg, Llight) >= contrast(Lbg, Ldark) ? light : dark;
  } catch { return '#f7f9ff'; }
}

let state = { room:null, me:{ name:'', color:'' } };
let local = { addAfterComplete:false, lastCompleterId:null };
let peekedRoom = null;

function navigate(hash){ location.hash = hash; render(); }

let selectedTheme = 'Sensual';

function titleView(){
  const codeInHash = location.hash?.slice(1) || '';
  const hostName = peekedRoom ? peekedRoom.players.find(p => p.id === peekedRoom.hostId)?.name || 'the host' : '';
  const subtitle = codeInHash && hostName ? `Join ${hostName}'s game` : 'Join a game or create a new one';
  return `
  <div class="card">
    <h1>Dare to Consent</h1>
    <p>${subtitle}</p>
    <div class="grid-landing${codeInHash ? ' single' : ''}">
      <div class="card panel">
        <h3>Join Game</h3>
        <input id="join-code" placeholder="three-words-like-this" value="${codeInHash}" />
        <input id="join-name" placeholder="Your name" />
        <button class="primary" id="join-btn">Join</button>
      </div>
      ${codeInHash ? '' : `<div class="or">or</div>`}
      ${codeInHash ? '' : `
        <div class="card panel">
          <h3>Create Game</h3>
          <select id="create-theme">
            ${THEMES ? Object.keys(THEMES).map(k=>`<option value="${k}" ${k===selectedTheme?'selected':''}>Theme: ${THEMES[k].name} Dares</option>`).join('') : `<option value="Sensual" selected>Theme: Sensual Dares</option>`}
          </select>
          <input id="create-name" placeholder="Your name" />
          <button class="primary" id="create-btn">Create</button>
        </div>
      `}
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

function profileMenuHtml(r){
  const name = state.me?.name || 'Player';
  const meId = state.me?.id || r?.players.find(p=>p.name===state.me.name && p.color===state.me.color)?.id;
  const me = (r?.players||[]).find(p=>p.id===meId);
  const colorHex = COLOR_HEX[me?.color || state.me?.color] || '#1b2030';
  const textColor = contrastOn(colorHex);
  const taken = new Set((r?.players||[]).filter(p=>p.id!==meId).map(p=>p.color).filter(Boolean));
  const swatches = COLORS.map(c=>{
    const isTaken = taken.has(c);
    const selected = (c=== (me?.color || state.me?.color)) ? 'selected' : '';
    return `<button class="color-swatch ${selected} ${isTaken?'taken':''}" data-color="${c}" ${isTaken?'data-taken="1" disabled':''} style="background:${COLOR_HEX[c]||'#4a5168'}" title="${c}${isTaken?' (taken)':''}"></button>`;
  }).join('');
  return `
    <div class="profile">
      <button id="profile-menu-toggle" class="pill name" style="background:${colorHex};color:${textColor}">
        ${name} <span class="caret">▾</span>
      </button>
      <div id="profile-menu" class="dropdown">
        <div class="menu-row"><button id="change-name">Change name</button></div>
        <div class="section-title">Choose your color</div>
        <div class="color-palette">${swatches}</div>
        <div class="menu-row"><button id="add-players">Add Players</button></div>
        <div class="menu-row"><button id="leave-game" class="danger">Leave game</button></div>
      </div>
    </div>`;
}

function lobbyView(){
  const r = state.room;
  const url = `${location.origin}/#${r.code}`;
  const isHost = r.hostId === state.me?.id;
  const canStart = !!THEMES && r.players.length >= 3 && isHost;
  return `
  <div class="card">
    <div class="row between">
      <h2>Room: ${r.code}</h2>
      ${profileMenuHtml(r)}
    </div>
    <div class="qr"><div id="qr"></div></div>
    <small>Share this link: <a href="${url}">${url}</a></small>
    <h3>Players</h3>
    <div class="players">${r.players.map(p=>{ const bg = COLOR_HEX[p.color]||'#1b2030'; const tc = contrastOn(bg); return `<span class="pill name" style="background:${bg};color:${tc}">${p.name}</span>`; }).join('')}</div>
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
    <button class="primary dare-btn" data-dare-select="${i}">
      <div class="dare-btn-title">Dare: ${d.title}</div>
      ${d.extra ? `<div class="dare-btn-extra">🌶️ Extra Challenge: ${d.extra}</div>` : ''}
    </button>
  `).join('')}</div>`;
}

function chosenDareHtml(){
  const r = state.room; if (!r) return '';
  const idx = r.turn?.selectedDareIndex;
  if (idx==null) return '';
  const d = r.dareMenu?.[idx];
  if (!d) return '';
  return `<div class="card">
    <p><b>Dare: ${d.title}</b></p>
    ${d.extra ? `<p><small>🌶️ Extra Challenge: ${d.extra}</small></p>` : ''}
  </div>`;
}

function submissionsTable(){
  const r = state.room; if (!r) return '';
  const meId = state.me?.id || r?.players.find(p=>p.name===state.me.name && p.color===state.me.color)?.id;
  const activeId = r?.turn?.order?.[r.turn.index];

  const rows = (r.players||[])
    // Exclude only the active player (they don't respond). Include my own row.
    .filter(p => (!activeId || p.id !== activeId))
    .map(p=>{
      const sub = (r.turn?.submissions||[]).find(s => s.playerId === p.id);
      // Only the active player can see response details
      const canSee = meId === activeId;
      const resp = (sub && canSee && sub.response) ? sub.response : null;
      const color = COLOR_HEX[p.color] || '#4a5168';

      const label =
        resp === 'HECK_YES' ? "I'll do the dare AND the extra challenge!" :
        resp === 'YES_PLEASE' ? "I'll do the dare (but not the extra challenge)" :
        resp === 'NO_THANKS' ? "No Thanks" : '';

      const cell = resp
        ? `<span class="response-${resp}">${label}</span>`
        : (sub ? `<span class="muted">Responded</span>` : `<span class="muted">Waiting . . .</span>`);

      return `<tr>
        <td><span class="dot" style="background:${color}"></span>${p?.name||'Player'}</td>
        <td>${cell}</td>
      </tr>`;
    }).join('');

  return `<table class="table">
    <thead><tr><th>Player</th><th>Response</th></tr></thead>
    <tbody>${rows}</tbody>
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
if (showAddOnly) {
  header = 'You get to write a new dare!';
} else if (idx == null) {
  header = isMyTurn ? 'Choose a dare to perform with another player' : `Waiting for ${curPlayer?.name||'Player'}`;
} else {
  const subs = r.turn?.submissions || [];
  if (isMyTurn) {
    const expected = r.players.filter(p => p.id !== curId && p.connected !== false).length;
    const gotPositive = subs.some(s => s.response === 'HECK_YES' || s.response === 'YES_PLEASE');
    if (!gotPositive && subs.length < expected) header = 'Waiting for responses . . . ';
    else if (gotPositive) header = 'Do your dare (or pass)';
    else header = "Tell the group you've decided to pass";
  } else {
    const mySub = subs.find(s => s.playerId === meId);
    const expected = r.players.filter(p => p.id !== curId && p.connected !== false).length;
    if (!mySub) header = `Do this Dare with ${curPlayer?.name||'Player'}?`;
    else if (subs.length < expected) header = 'Waiting for more responses';
    else header = `Waiting for ${curPlayer?.name||'Player'}`;
  }
}

  
  let body = '';
  if (showAddOnly) {
    body = `
    <div class="card">
      <h3 class="add-dare-title">Confer with the group, and write something more ${((THEMES?.[r.chosenTheme]?.name || r.chosenTheme || 'daring').replace(/\s*Dares\s*$/i,'').toLowerCase())} than previous dares</h3>
      <input id="new-dare" placeholder="New dare" />
      <input id="new-extra" placeholder="Extra challenge" />
      <div class="row">
        <button id="add-dare" class="primary">Add to Menu</button>
      </div>
      <div class="or-section">
        <div class="or-divider">— OR —</div>
        <div><strong>Choose one of these:</strong></div>
      </div>
      <div id="examples" class="examples"></div>
    </div>`;
  } else if (idx == null) {
    body = isMyTurn ? `
      <div class="card">
        ${dareButtonsHtml()}
      </div>
    ` : '';
  } else {
    // Dare selected
    const myResp = (r.turn?.submissions||[]).find(s => s.playerId === meId)?.response || null;
    const actionCard = isMyTurn ? `
      <div class="card">
        <div class="row">
          <button id="btn-end-turn" class="primary">End Turn</button>
        </div>
      </div>
    ` : `
      <div class="card">
        <div class="grid">
          <button data-resp="HECK_YES" class="btn-response HECK_YES ${myResp==='HECK_YES'?'selected':''}">I'll do the dare AND the extra challenge!</button>
          <button data-resp="YES_PLEASE" class="btn-response YES_PLEASE ${myResp==='YES_PLEASE'?'selected':''}">I'll do the dare (but not the extra challenge)</button>
          <button data-resp="NO_THANKS" class="btn-response NO_THANKS ${myResp==='NO_THANKS'?'selected':''}">No Thanks</button>
        </div>
      </div>
    `;
    body = `
      ${chosenDareHtml()}
      <div class="card">
        ${submissionsTable()}
      </div>
      ${actionCard}
    `;
  }

  return `
  <div class="card">
    <div class="row between">
      <h2>${header}</h2>
      ${profileMenuHtml(r)}
    </div>
    ${body}
  </div>`;
}

function wordCloud(theme){
  // Repurposed to render example dares with extra challenges and a score
  const t = THEMES?.[theme];
  const list = Array.isArray(t?.examples) ? t.examples : [];
  const c = $('#examples'); if (!c) return;
  const esc = s => (s||'').toString().replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  c.innerHTML = list.map((ex,i)=>`
    <button class="dare-btn example-dare" data-example-index="${i}" data-title="${esc(ex.title)}" data-extra="${esc.extra ? esc(ex.extra) : ''}" data-score="${(ex.spicyness!=null?ex.spicyness:'')}">
      <div class="dare-btn-title">Dare: ${ex.title}</div>
      <div class="dare-btn-extra">🌶️ Extra Challenge: ${ex.extra}</div>
    </button>
  `).join('');
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
  const doJoin = ()=>{
    const code = ($('#join-code')?.value || '').trim().toLowerCase();
    const name = ($('#join-name')?.value || '').trim() || 'Player';
    if (!code) return; // need a room code
    state.me = { name };
    // Persist intent so a refresh immediately resumes
    try { saveSession({ code, name }); } catch {}
    socket.emit('room:join', { code, name });
  };
  $('#create-btn')?.addEventListener('click', ()=>{
    const name = $('#create-name').value.trim()||'Player';
    const sel = $('#create-theme');
    if (sel && sel.value) selectedTheme = sel.value;
    state.me = { name };
    // Persist name so we can resume properly
    try { saveSession({ name }); } catch {}
    socket.emit('room:create', { name });
  });
  $('#create-theme')?.addEventListener('change', (e)=>{
    selectedTheme = e.target.value || 'Sensual';
  });
  $('#join-btn')?.addEventListener('click', doJoin);
  $('#join-name')?.addEventListener('keydown', (e)=>{ if (e.key==='Enter') doJoin(); });
  $('#join-code')?.addEventListener('keydown', (e)=>{ if (e.key==='Enter') doJoin(); });
  $('#create-name')?.addEventListener('keydown', (e)=>{ if (e.key==='Enter') { const name = $('#create-name').value.trim()||'Player'; const sel = $('#create-theme'); if (sel && sel.value && name) { if (sel && sel.value) selectedTheme = sel.value; state.me = { name }; socket.emit('room:create', { name }); } } });
  $('#start-game')?.addEventListener('click', ()=>{
    const key = selectedTheme || 'Sensual';
    const seed = seedForTheme(key);
    if (!seed?.length) return;
    socket.emit('theme:finalize', { theme: key, seedDares: seed });
  });

  // Profile menu (name/color/leave)
  const pmToggle = $('#profile-menu-toggle');
  const pm = $('#profile-menu');
  if (pmToggle && pm) {
    const closeMenu = (e)=>{
      if (!pm.contains(e.target) && e.target !== pmToggle) {
        pm.classList.remove('show');
        document.removeEventListener('click', closeMenu);
      }
    };
    pmToggle.addEventListener('click', (e)=>{
      e.stopPropagation();
      pm.classList.toggle('show');
      if (pm.classList.contains('show')) {
        setTimeout(()=>document.addEventListener('click', closeMenu), 0);
      }
    });
    $('#change-name')?.addEventListener('click', async ()=>{
      const cur = state.me?.name || '';
      const input = await showPrompt('Change your name', { initialValue: cur, placeholder:'Your name', confirmText:'Save', cancelText:'Cancel', maxLength: 30 });
      const next = (input || '').trim().slice(0,30);
      if (next && next !== cur) {
        state.me.name = next;
        try { saveSession({ name: next }); } catch {}
        socket.emit('player:update', { name: next });
        render();
      }
    });

    $('#add-players')?.addEventListener('click', async ()=>{
      pm.classList.remove('show');
      document.removeEventListener('click', closeMenu);
      const r = state.room;
      const url = r?.code ? `${location.origin}/#${r.code}` : location.href;
      await showInviteOverlay(url);
    });

    $$('#profile-menu [data-color]')?.forEach(el=>{
      el.addEventListener('click', ()=>{
        if (el.hasAttribute('disabled') || el.getAttribute('data-taken')==='1' || el.classList.contains('taken')) return;
        const c = el.getAttribute('data-color');
        if (c && c !== state.me?.color) {
          state.me.color = c;
          socket.emit('player:update', { color: c });
          render();
        }
      });
    });
  }

  // Leave game
  $('#leave-game')?.addEventListener('click', async ()=>{
    const ok = await showConfirm('Leave this game?', { confirmText:'Leave', cancelText:'Stay' });
    if (ok) {
      socket.emit('room:leave');
      state.room = null;
      try { clearSession(); clearUI(); } catch {}
      try { history.replaceState(null, '', '#'); } catch { location.hash = ''; }
      render();
    }
  });

  // Dare selection buttons with confirmation
  $$('#app [data-dare-select]')?.forEach(btn=>btn.addEventListener('click', async ()=>{
    const index = +btn.getAttribute('data-dare-select');
    const d = state?.room?.dareMenu?.[index];
    const title = d?.title || 'this dare';
    const lines = [`Dare: ${title}`];
    if (d?.extra) lines.push(`🌶️ Extra Challenge: ${d.extra}`);
    const ok = await showConfirm(lines.join('\n'), { title: 'Propose this dare?', confirmText:'Use Dare', cancelText:'Cancel' });
    if (ok) {
      socket.emit('turn:selectDare', { index });
    }
  }));

  // Turn actions
  $('#btn-end-turn')?.addEventListener('click', ()=>{
    const r = state.room;
    const most = r?.turn?.selectedDareIndex===r?.dareMenu?.length-1;
    // After completing the most daring dare, show ONLY the add UI
    local.addAfterComplete = !!most;
    local.lastCompleterId = state.me?.id || null;
    // Persist UI hint so refresh doesn't lose the "add" screen opportunity
    try { saveUI({ addAfterComplete: local.addAfterComplete, lastCompleterId: local.lastCompleterId, roomCode: state.room?.code }); } catch {}
    socket.emit('turn:complete', { completedMostDaring: !!most });
    if (local.addAfterComplete) render();
  });

  // Responses
  $$('#app [data-resp]')?.forEach(b=>b.addEventListener('click', ()=>{
    socket.emit('turn:submit', { response: b.getAttribute('data-resp') });
  }));

  // Add new dare (only visible when local.addAfterComplete)
  $('#add-dare')?.addEventListener('click', async ()=>{
    const title = ($('#new-dare')?.value || '').trim();
    const extra = ($('#new-extra')?.value || '').trim();
    if (!title || !extra) {
      await showConfirm('Please enter both a Dare and an Extra Challenge', { confirmText:'OK', cancelText:'Cancel' });
      return;
    }
    socket.emit('menu:addDare', { title, extra });
    local.addAfterComplete = false;
    try { saveUI({ addAfterComplete: false }); } catch {}
    const nd = $('#new-dare'); const ne = $('#new-extra');
    if (nd) nd.value = '';
    if (ne) ne.value = '';
    render();
  });

  // Example dares click to fill inputs (delegated to handle dynamic content)
  $('#examples')?.addEventListener('click', (e)=>{
    const el = e.target.closest('[data-example-index]');
    if (!el) return;
    const decode = (s)=> (s||'')
      .replace(/"/g, '"')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/&/g, '&');

    let title = decode(el.getAttribute('data-title') || '');
    let extra = decode(el.getAttribute('data-extra') || '');

    // Fallback to inner text if attributes are missing/empty
    if (!title) {
      const tEl = el.querySelector('.dare-btn-title');
      if (tEl) title = (tEl.textContent || '').replace(/^Dare:\s*/i, '').trim();
    }
    if (!extra) {
      const xEl = el.querySelector('.dare-btn-extra');
      if (xEl) {
        const t = xEl.textContent || '';
        extra = t.replace(/^.*Extra Challenge:\s*/i, '').trim();
      }
    }

    const nd = $('#new-dare'); const ne = $('#new-extra');
    if (nd) nd.value = title;
    if (ne) ne.value = extra;
  });

  // QR and examples list
  if (r?.state==='lobby') import('/lib/qrcode-wrapper.js')
    .then((m)=>{
      const el = $('#qr'); if (!el) return;
      const url = `${location.origin}/#${r.code}`;
      const fn = m.renderQRCode || m.default;
      const p = fn ? fn(el, url, { size: 220 }) : null;
      if (p && typeof p.then === 'function') p.catch(()=>{ /* fallback is the share link below */ });
    })
    .catch(()=>{ /* fallback is the share link below */ });
  if (r?.state==='main') wordCloud(r.chosenTheme);
}

socket.on('room:state', (room)=>{
  state.room = room;
  // Ensure URL hash reflects the current room code for easy sharing
  if (room?.code && location.hash.slice(1) !== room.code) {
    try { history.replaceState(null, '', `#${room.code}`); } catch { location.hash = room.code; }
  }
  // Normalize UI persistence across rooms to avoid stale "add dare" gating
  try {
    const ui = loadUI();
    const uiRoom = ui?.roomCode || null;
    const uiAdd = !!ui?.addAfterComplete;
    if (uiAdd && uiRoom !== room.code) {
      local.addAfterComplete = false;
      saveUI({ addAfterComplete: false, roomCode: room.code });
    } else if (uiRoom !== room.code) {
      saveUI({ roomCode: room.code });
    }
  } catch {}
  render();
  // Persist session info so we can resume on refresh/reconnect
  try {
    const update = {};
    if (room?.code) update.code = room.code;
    if (state.me?.name) update.name = state.me.name;
    if (state.me?.id) update.playerId = state.me.id;
    if (Object.keys(update).length) saveSession(update);
  } catch {}
});
socket.on('player:you', ({ playerId })=>{
  state.me.id = playerId;
  // Save player id for resume
  try { saveSession({ playerId, code: state.room?.code, name: state.me?.name }); } catch {}
  // Clear stale UI hint if it belonged to a different player/session
  try {
    const ui = loadUI();
    if (ui?.addAfterComplete && ui?.lastCompleterId && ui.lastCompleterId !== playerId) {
      local.addAfterComplete = false;
      saveUI({ addAfterComplete: false });
    }
  } catch {}
});

socket.on('room:peek:result', (result) => {
  if (result.ok) {
    peekedRoom = result.state;
    render();
  }
});

function prefillFromHash(){
  const code = location.hash?.slice(1);
  if (!code) return;
  setTimeout(()=>{ const input = document.querySelector('#join-code'); if (input && !input.value) input.value = code; }, 0);
}

// Handle user navigating to a different #room while in a game
window.addEventListener('hashchange', async ()=>{
  const newCode = location.hash?.slice(1);
  const current = state?.room?.code;
  if (current && newCode && newCode !== current) {
    const ok = await showConfirm(`Leave this game and join ${newCode}?`, { confirmText:'Leave & Join', cancelText:'Stay' });
    if (ok) {
      // Leave current room on server and go back to landing to join
      socket.emit('room:leave');
      state.room = null;
      // Clear persisted session/UI so we don't auto-resume the old room
      try { clearSession(); clearUI(); } catch {}
      render();
      prefillFromHash();
    } else {
      // Revert hash to current room code
      try { history.replaceState(null, '', `#${current}`); } catch { location.hash = current; }
    }
  }
});

/* --- Session/UI persistence helpers and bootstrapping --- */
const SESSION_KEY = 'dtc.session';
const UI_KEY = 'dtc.ui';

function loadSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
function saveSession(part){ try { const cur = loadSession() || {}; const next = { ...cur, ...part }; localStorage.setItem(SESSION_KEY, JSON.stringify(next)); } catch {} }
function clearSession(){ try { localStorage.removeItem(SESSION_KEY); } catch {} }

function loadUI(){ try { return JSON.parse(localStorage.getItem(UI_KEY) || 'null'); } catch { return null; } }
function saveUI(part){ try { const cur = loadUI() || {}; const next = { ...cur, ...part }; localStorage.setItem(UI_KEY, JSON.stringify(next)); } catch {} }
function clearUI(){ try { localStorage.removeItem(UI_KEY); } catch {} }

function hydrateSession(){
  const s = loadSession();
  if (s?.name && !state.me.name) state.me.name = s.name;
  if (s?.playerId) state.me.id = s.playerId;
  const ui = loadUI();
  if (ui) { local.addAfterComplete = !!ui.addAfterComplete; local.lastCompleterId = ui.lastCompleterId || null; }
}

function attemptResume(){
  const s = loadSession();
  const code = s?.code || location.hash?.slice(1) || '';
  const playerId = s?.playerId;
  if (code && playerId) socket.emit('room:resume', { code, playerId });
}

// Try to resume when socket connects/reconnects
socket.on('connect', attemptResume);

// Initial boot
hydrateSession();
render();
loadThemes();
prefillFromHash();
if (socket.connected) attemptResume();

if (location.hash?.slice(1) && !state.room) {
  socket.emit('room:peek', { code: location.hash.slice(1) });
}

// --- Pretty overlay dialogs ---
function ensureOverlayRoot(){
  let root = document.getElementById('overlay-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'overlay-root';
    document.body.appendChild(root);
  }
  return root;
}

function showConfirm(message, { title='', confirmText='OK', cancelText='Cancel' }={}){
  return new Promise(resolve => {
    const host = ensureOverlayRoot();
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal card">
        <div class="modal-content">
          <h3 class="modal-title">${title || ''}</h3>
          <p class="modal-message"></p>
          <div class="row modal-buttons">
            <button class="btn-cancel">${cancelText}</button>
            <button class="primary btn-ok">${confirmText}</button>
          </div>
        </div>
      </div>`;
    host.appendChild(overlay);

    const msgEl = overlay.querySelector('.modal-message');
    // Preserve line breaks
    msgEl.textContent = '';
    (message||'').toString().split('\n').forEach((line, i) => {
      if (i>0) msgEl.appendChild(document.createElement('br'));
      msgEl.appendChild(document.createTextNode(line));
    });

    const cleanup = () => { overlay.classList.remove('show'); setTimeout(()=>overlay.remove(), 150); };
    const decide = (val) => { cleanup(); resolve(val); };

    overlay.addEventListener('click', (e)=>{ if (e.target === overlay) decide(false); });
    overlay.querySelector('.btn-cancel').addEventListener('click', ()=>decide(false));
    overlay.querySelector('.btn-ok').addEventListener('click', ()=>decide(true));

    const onKey = (e)=>{
      if (e.key === 'Escape') { e.preventDefault(); decide(false); }
      if (e.key === 'Enter') { e.preventDefault(); decide(true); }
    };
    document.addEventListener('keydown', onKey, { once:true });

    requestAnimationFrame(()=>overlay.classList.add('show'));
  });
}

// Pretty overlay prompt with text input
function showPrompt(title, { placeholder='', initialValue='', confirmText='OK', cancelText='Cancel', maxLength=60 }={}){
  return new Promise(resolve=>{
    const esc = (s)=> (s||'').toString().replace(/&/g,'&').replace(/"/g,'"').replace(/</g,'<');
    const host = ensureOverlayRoot();
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal card">
        <div class="modal-content">
          <h3 class="modal-title">${title || ''}</h3>
          <input class="modal-input" type="text" ${maxLength ? `maxlength="${maxLength}"` : ''} placeholder="${esc(placeholder)}" />
          <div class="row modal-buttons">
            <button class="btn-cancel">${cancelText}</button>
            <button class="primary btn-ok">${confirmText}</button>
          </div>
        </div>
      </div>`;
    host.appendChild(overlay);

    const input = overlay.querySelector('.modal-input');
    if (typeof initialValue === 'string') input.value = initialValue;
    setTimeout(()=>{ input.focus(); input.select?.(); }, 0);

    const cleanup = () => { overlay.classList.remove('show'); setTimeout(()=>overlay.remove(), 150); };
    const decide = (val) => { cleanup(); resolve(val); };

    overlay.addEventListener('click', (e)=>{ if (e.target === overlay) decide(null); });
    overlay.querySelector('.btn-cancel').addEventListener('click', ()=>decide(null));
    overlay.querySelector('.btn-ok').addEventListener('click', ()=>decide(input.value));

    input.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter') { e.preventDefault(); overlay.querySelector('.btn-ok').click(); }
      if (e.key === 'Escape') { e.preventDefault(); decide(null); }
    });

    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') { e.preventDefault(); decide(null); }
    }, { once:true });

    requestAnimationFrame(()=>overlay.classList.add('show'));
  });
}

// Invite overlay with QR code and share URL
function showInviteOverlay(url, { title='Add Players', instructions='Ask new players to scan this QR code or visit the link below:' } = {}) {
  return new Promise(resolve => {
    const host = ensureOverlayRoot();
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal card">
        <div class="modal-content">
          <h3 class="modal-title">${title}</h3>
          <div class="qr"><div id="invite-qr"></div></div>
          <p class="modal-message">${instructions}</p>
          <div class="row" style="justify-content:center; margin-top:6px;">
            <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>
          </div>
          <div class="row modal-buttons">
            <button class="primary btn-ok">OK</button>
          </div>
        </div>
      </div>`;
    host.appendChild(overlay);

    // Render QR code
    import('/lib/qrcode-wrapper.js')
      .then(m => {
        const el = overlay.querySelector('#invite-qr');
        if (el) {
          const fn = m.renderQRCode || m.default;
          if (fn) fn(el, url, { size: 220 });
        }
      })
      .catch(()=>{});

    const cleanup = () => { overlay.classList.remove('show'); setTimeout(()=>overlay.remove(), 150); };
    const decide = () => { cleanup(); resolve(true); };

    overlay.addEventListener('click', (e)=>{ if (e.target === overlay) decide(); });
    overlay.querySelector('.btn-ok').addEventListener('click', decide);

    const onKey = (e)=>{
      if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); decide(); }
    };
    document.addEventListener('keydown', onKey, { once:true });

    requestAnimationFrame(()=>overlay.classList.add('show'));
  });
}
