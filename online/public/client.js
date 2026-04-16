// socket.io client is loaded globally via script tag in index.html
const socket = io();
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];

const COLORS = [
  'Purple','Red','White','Brown','Grey','DkBlue','Silver','Green','Orange','Lavender','DkRed','Black','Blue','Pink','LtBlue','LtPink','Yellow','DkGreen'
];
const COLOR_HEX = {
  Purple:'#7e52b7', Red:'#d64045', White:'#f4f6f9', Brown:'#8b5e3c', Grey:'#7a8a99',
  DkBlue:'#2d4e8a', Silver:'#c0c7d1', Green:'#2e8b57', Orange:'#f28c28', Lavender:'#b497c5',
  DkRed:'#8b1e2b', Black:'#0c0f15', Blue:'#3b82f6', Pink:'#e78fb3', LtBlue:'#78c4ff',
  LtPink:'#ffc4dd', Yellow:'#ffd166', DkGreen:'#1f6f43'
};
const GENDERS = ['male', 'female', 'nonbinary'];
const LANGS = ['en', 'es', 'pt'];
const SESSION_KEY = 'dtc.session';
const UI_KEY = 'dtc.ui';
const PAGE_SIZE = 4;

const I18N = {
  en: {
    title:'Dare to Consent',
    tagline:'Would you play Spin-the-Bottle if it only chose people who WANT to kiss each other?',
    joinGame:'Join Game',
    createGame:'Create Game',
    room:'Room',
    players:'Players',
    startGame:'Start Game',
    resumeGame:'Resume Game',
    waitingForPlayers:'Waiting for at least 3 players',
    yourName:'Your name',
    yourGender:'Your gender',
    prefer:'You prefer dares with players who are',
    male:'male',
    female:'female',
    nonbinary:'nonbinary/other',
    language:'Language',
    english:'English',
    spanish:'Spanish',
    portuguese:'Portuguese',
    join:'Join',
    create:'Create',
    theme:'Theme',
    changeName:'Change name',
    chooseColor:'Choose your color',
    useSelfie:'Use selfie',
    addPlayers:'Add Players',
    leaveGame:'Leave game',
    share:'Share this link',
    yourTurn:'It is your turn',
    chooseDareMode:'Choose a dare and see who will do it with you',
    choosePlayerMode:'Choose a person and see what dares they will do with you',
    chooseDare:'Choose a dare',
    choosePlayer:'Choose a player',
    waitingChoose:'Waiting for {name} to choose',
    waitingRespond:'Waiting for {name} to respond',
    waitingPerform:'Waiting for {a} and {b} to do: {dare}',
    waitingAdd:'Waiting for {name} to add a new dare',
    consentPlayers:'Click a player to edit which dares you consent to do with them:',
    consentDares:'Click a dare to edit which players you consent to do the dare with:',
    consentCount:'consents to {count} dares',
    dareCount:'{count} players consent',
    oneDare:'consents to 1 dare',
    onePlayer:'1 player consents',
    back:'Back',
    save:'Save',
    submit:'Submit',
    sendNow:'Send Now',
    yesPlease:'Yes please',
    noThanks:'No thanks',
    sendingIn:'Sending in {seconds}',
    selectedDare:'{name} has chosen "{dare}"',
    chosenYou:'{name} wants to see what dares you will do with them',
    activeOptionsPlayers:'Choose who to do this dare with, or pass',
    activeOptionsDares:'Choose what dare to do with {name}, or pass',
    pass:'Pass',
    weDidIt:'We did it',
    noOptions:'No current matches. You can pass.',
    areYouSure:'You previously said you did not want this dare with this person. Continue?',
    addDareTitle:'You get to write a new dare',
    newDare:'New dare',
    addToMenu:'Add to Menu',
    examples:'Choose one of these',
    milder:'Show milder dares',
    spicier:'Show spicier dares',
    onboardingTitle:'Set your dare preferences',
    onboardingHelp:'For this dare, choose who you would do it with.',
    joinedTitle:'{name} has joined!',
    joinedHelp:'Choose which dares you consent to do with this player.',
    newDareTitle:'A new dare has been added',
    newDareHelp:'You consent to this dare with:',
    mature:'Mature content',
    matureBody:'This game is intended for adults 18 years or older.',
    adult:'I am 18+',
    under:'I am too young',
    ok:'OK',
    cancel:'Cancel',
    loading:'Loading',
    uploadFailed:'Selfie upload failed. Please try a smaller photo.'
  },
  es: {
    title:'Dare to Consent',
    tagline:'¿Jugarías a la botella si solo eligiera personas que QUIEREN besarse?',
    joinGame:'Unirse al juego',
    createGame:'Crear juego',
    room:'Sala',
    players:'Jugadores',
    startGame:'Empezar juego',
    resumeGame:'Reanudar juego',
    waitingForPlayers:'Esperando al menos 3 jugadores',
    yourName:'Tu nombre',
    yourGender:'Tu género',
    prefer:'Prefieres retos con jugadores que son',
    male:'hombre',
    female:'mujer',
    nonbinary:'no binario/otro',
    language:'Idioma',
    english:'Inglés',
    spanish:'Español',
    portuguese:'Portugués',
    join:'Unirse',
    create:'Crear',
    theme:'Tema',
    changeName:'Cambiar nombre',
    chooseColor:'Elige tu color',
    useSelfie:'Usar selfie',
    addPlayers:'Agregar jugadores',
    leaveGame:'Salir del juego',
    share:'Comparte este enlace',
    yourTurn:'Es tu turno',
    chooseDareMode:'Elige un reto y mira quién lo hará contigo',
    choosePlayerMode:'Elige una persona y mira qué retos hará contigo',
    chooseDare:'Elige un reto',
    choosePlayer:'Elige un jugador',
    waitingChoose:'Esperando a que {name} elija',
    waitingRespond:'Esperando la respuesta de {name}',
    waitingPerform:'Esperando a que {a} y {b} hagan: {dare}',
    waitingAdd:'Esperando a que {name} agregue un nuevo reto',
    consentPlayers:'Toca un jugador para editar qué retos aceptas hacer con esa persona:',
    consentDares:'Toca un reto para editar con qué jugadores aceptas hacerlo:',
    consentCount:'acepta {count} retos',
    dareCount:'{count} jugadores aceptan',
    oneDare:'acepta 1 reto',
    onePlayer:'1 jugador acepta',
    back:'Atrás',
    save:'Guardar',
    submit:'Enviar',
    sendNow:'Enviar ahora',
    yesPlease:'Sí, por favor',
    noThanks:'No, gracias',
    sendingIn:'Enviando en {seconds}',
    selectedDare:'{name} eligió "{dare}"',
    chosenYou:'{name} quiere ver qué retos harías con él/ella',
    activeOptionsPlayers:'Elige con quién hacer este reto, o pasa',
    activeOptionsDares:'Elige qué reto hacer con {name}, o pasa',
    pass:'Pasar',
    weDidIt:'Lo hicimos',
    noOptions:'No hay coincidencias actuales. Puedes pasar.',
    areYouSure:'Antes dijiste que no querías este reto con esta persona. ¿Continuar?',
    addDareTitle:'Puedes escribir un nuevo reto',
    newDare:'Nuevo reto',
    addToMenu:'Agregar al menú',
    examples:'Elige uno de estos',
    milder:'Mostrar retos más suaves',
    spicier:'Mostrar retos más picantes',
    onboardingTitle:'Configura tus preferencias',
    onboardingHelp:'Para este reto, elige con quién lo harías.',
    joinedTitle:'¡{name} se unió!',
    joinedHelp:'Elige qué retos aceptas hacer con este jugador.',
    newDareTitle:'Se agregó un nuevo reto',
    newDareHelp:'Aceptas este reto con:',
    mature:'Contenido para adultos',
    matureBody:'Este juego es para personas adultas de 18 años o más.',
    adult:'Tengo 18+',
    under:'Soy menor',
    ok:'OK',
    cancel:'Cancelar',
    loading:'Cargando',
    uploadFailed:'No se pudo subir la selfie. Prueba con una foto más pequeña.'
  },
  pt: {
    title:'Dare to Consent',
    tagline:'Você jogaria Verdade ou Consequência se ele só escolhesse pessoas que QUEREM se beijar?',
    joinGame:'Entrar no jogo',
    createGame:'Criar jogo',
    room:'Sala',
    players:'Jogadores',
    startGame:'Começar jogo',
    resumeGame:'Retomar jogo',
    waitingForPlayers:'Aguardando pelo menos 3 jogadores',
    yourName:'Seu nome',
    yourGender:'Seu gênero',
    prefer:'Você prefere desafios com jogadores que são',
    male:'homem',
    female:'mulher',
    nonbinary:'não binário/outro',
    language:'Idioma',
    english:'Inglês',
    spanish:'Espanhol',
    portuguese:'Português',
    join:'Entrar',
    create:'Criar',
    theme:'Tema',
    changeName:'Mudar nome',
    chooseColor:'Escolha sua cor',
    useSelfie:'Usar selfie',
    addPlayers:'Adicionar jogadores',
    leaveGame:'Sair do jogo',
    share:'Compartilhe este link',
    yourTurn:'É a sua vez',
    chooseDareMode:'Escolha um desafio e veja quem fará com você',
    choosePlayerMode:'Escolha uma pessoa e veja quais desafios ela fará com você',
    chooseDare:'Escolha um desafio',
    choosePlayer:'Escolha um jogador',
    waitingChoose:'Aguardando {name} escolher',
    waitingRespond:'Aguardando resposta de {name}',
    waitingPerform:'Aguardando {a} e {b} fazerem: {dare}',
    waitingAdd:'Aguardando {name} adicionar um novo desafio',
    consentPlayers:'Toque em um jogador para editar quais desafios você aceita fazer com essa pessoa:',
    consentDares:'Toque em um desafio para editar com quais jogadores você aceita fazê-lo:',
    consentCount:'aceita {count} desafios',
    dareCount:'{count} jogadores aceitam',
    oneDare:'aceita 1 desafio',
    onePlayer:'1 jogador aceita',
    back:'Voltar',
    save:'Salvar',
    submit:'Enviar',
    sendNow:'Enviar agora',
    yesPlease:'Sim, por favor',
    noThanks:'Não, obrigado',
    sendingIn:'Enviando em {seconds}',
    selectedDare:'{name} escolheu "{dare}"',
    chosenYou:'{name} quer ver quais desafios você faria com ele/ela',
    activeOptionsPlayers:'Escolha com quem fazer este desafio, ou passe',
    activeOptionsDares:'Escolha qual desafio fazer com {name}, ou passe',
    pass:'Passar',
    weDidIt:'Nós fizemos',
    noOptions:'Não há combinações atuais. Você pode passar.',
    areYouSure:'Você disse antes que não queria este desafio com esta pessoa. Continuar?',
    addDareTitle:'Você pode escrever um novo desafio',
    newDare:'Novo desafio',
    addToMenu:'Adicionar ao menu',
    examples:'Escolha um destes',
    milder:'Mostrar desafios mais leves',
    spicier:'Mostrar desafios mais picantes',
    onboardingTitle:'Defina suas preferências',
    onboardingHelp:'Para este desafio, escolha com quem você faria.',
    joinedTitle:'{name} entrou!',
    joinedHelp:'Escolha quais desafios você aceita fazer com este jogador.',
    newDareTitle:'Um novo desafio foi adicionado',
    newDareHelp:'Você aceita este desafio com:',
    mature:'Conteúdo adulto',
    matureBody:'Este jogo é destinado a adultos com 18 anos ou mais.',
    adult:'Tenho 18+',
    under:'Sou menor',
    ok:'OK',
    cancel:'Cancelar',
    loading:'Carregando',
    uploadFailed:'Falha ao enviar a selfie. Tente uma foto menor.'
  }
};

let THEMES = null;
let selectedTheme = 'Sensual';
let peekedRoom = null;
function browserLanguage(){
  try {
    const langs = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const raw of langs) {
      const code = String(raw || '').toLowerCase().split('-')[0];
      if (LANGS.includes(code)) return code;
    }
  } catch {}
  return 'en';
}
let state = { room:null, me:{ name:'', id:null, language:browserLanguage(), gender:'nonbinary', preferredGenders:[...GENDERS] } };
let local = { edit:null, prompt:{}, exampleOffsets:{} };

function lang(){ return state.me.language || loadSession()?.language || 'en'; }
function t(key, vars={}){
  const s = (I18N[lang()]?.[key] || I18N.en[key] || key).toString();
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
function escapeHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
}
function escapeAttr(s){ return escapeHtml(s).replace(/`/g, '&#96;'); }
function sanitizeInput(s, max){ return String(s == null ? '' : s).replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, max); }
function contrastOn(hex){
  try {
    const rgb = (hex||'#000').replace('#','');
    const r = parseInt(rgb.slice(0,2),16), g = parseInt(rgb.slice(2,4),16), b = parseInt(rgb.slice(4,6),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return yiq >= 150 ? '#081020' : '#f7f9ff';
  } catch { return '#f7f9ff'; }
}
function loadSession(){ try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } }
function saveSession(part){ try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ...(loadSession() || {}), ...part })); } catch {} }
function clearSession(){ try { localStorage.removeItem(SESSION_KEY); } catch {} }
function loadUI(){ try { return JSON.parse(localStorage.getItem(UI_KEY) || 'null'); } catch { return null; } }
function saveUI(part){ try { localStorage.setItem(UI_KEY, JSON.stringify({ ...(loadUI() || {}), ...part })); } catch {} }
function meId(){ return state.me?.id || null; }
function mePlayer(){ return state.room?.players?.find(p => p.id === meId()) || null; }
function player(id){ return state.room?.players?.find(p => p.id === id) || null; }
function dare(id){ return state.room?.dareMenu?.find(d => d.id === id) || null; }
function activeId(){ return state.room?.turn?.order?.[state.room?.turn?.index] || null; }
function activePlayer(){ return player(activeId()); }
function isActive(){ return !!meId() && meId() === activeId(); }
function secondsLeft(){
  const end = state.room?.turn?.timerEndsAt || 0;
  return Math.max(0, Math.ceil((end - Date.now()) / 1000));
}
function countText(n, kind){
  if (kind === 'dare') return n === 1 ? t('oneDare') : t('consentCount', { count:n });
  return n === 1 ? t('onePlayer') : t('dareCount', { count:n });
}
function avatarHtml(p, small=false){
  if (p?.avatarUrl) return `<span class="avatar ${small?'small':''}"><img src="${escapeAttr(p.avatarUrl)}" alt=""></span>`;
  const bg = COLOR_HEX[p?.color] || '#1b2030';
  const tc = contrastOn(bg);
  return `<span class="avatar color ${small?'small':''}" style="background:${bg};color:${tc}">${escapeHtml((p?.name || '?').slice(0,1).toUpperCase())}</span>`;
}
function namePill(p){
  return `<span class="player-pill">${avatarHtml(p, true)}<span>${escapeHtml(p?.name || 'Player')}</span></span>`;
}

async function loadThemes(){
  try {
    const idxRes = await fetch('/data/themes/index.json', { cache: 'no-store' });
    if (idxRes.ok) {
      const list = await idxRes.json();
      const entries = await Promise.all((Array.isArray(list) ? list : []).map(n => {
        const base = String(n || '').replace(/\.json$/i, '');
        return fetch(`/data/themes/${encodeURIComponent(base)}.json`, { cache:'no-store' }).then(r => r.json()).then(json => [base, json]);
      }));
      THEMES = entries.reduce((acc, [k, v]) => { acc[k] = v; return acc; }, {});
      render();
      return;
    }
  } catch (e) {
    console.warn('Failed to load split themes', e);
  }
  try {
    THEMES = await (await fetch('/data/themes.json', { cache:'no-store' })).json();
    render();
  } catch (e) {
    console.error('Failed to load themes', e);
  }
}
function localizedExample(ex){
  const l = lang();
  const tr = ex?.translations?.[l] || ex?.i18n?.[l] || null;
  return {
    ...ex,
    title: tr?.title || ex?.[`title_${l}`] || ex?.title || '',
    extra: tr?.extra || ex?.[`extra_${l}`] || ex?.extra || ''
  };
}
function examplesListForTheme(theme){
  const tData = THEMES?.[theme];
  const room = state.room;
  const taken = new Set((room?.dareMenu || []).map(d => (d.title || '').trim().toLowerCase()));
  const raw = Array.isArray(tData?.examples) ? tData.examples : [];
  return raw
    .filter(ex => !taken.has((ex?.title || '').trim().toLowerCase()))
    .map((ex, i) => ({ ...localizedExample(ex), __idx:i, sp: typeof ex.spicyness === 'number' ? ex.spicyness : 0 }))
    .sort((a,b) => (a.sp - b.sp) || (a.__idx - b.__idx));
}

function genderFields(prefix, selected='nonbinary', prefs=GENDERS){
  return `
    <label class="field-label">${t('yourGender')}</label>
    <div class="choice-row">${GENDERS.map(g => `
      <label><input type="radio" name="${prefix}-gender" value="${g}" ${selected===g?'checked':''}> ${t(g)}</label>
    `).join('')}</div>
    <label class="field-label">${t('prefer')}</label>
    <div class="choice-row">${GENDERS.map(g => `
      <label><input type="checkbox" name="${prefix}-pref" value="${g}" ${(prefs||[]).includes(g)?'checked':''}> ${t(g)}</label>
    `).join('')}</div>
  `;
}
function languageSelect(id, value=lang()){
  return `<label class="field-label" for="${id}">${t('language')}</label>
  <select id="${id}">
    <option value="en" ${value==='en'?'selected':''}>${t('english')}</option>
    <option value="es" ${value==='es'?'selected':''}>${t('spanish')}</option>
    <option value="pt" ${value==='pt'?'selected':''}>${t('portuguese')}</option>
  </select>`;
}
function collectProfile(prefix){
  const name = sanitizeInput($(`#${prefix}-name`)?.value || 'Player', 30) || 'Player';
  const gender = $(`input[name="${prefix}-gender"]:checked`)?.value || 'nonbinary';
  const preferredGenders = $$(`input[name="${prefix}-pref"]:checked`).map(x => x.value);
  const language = $(`#${prefix}-language`)?.value || lang();
  return { name, gender, preferredGenders: preferredGenders.length ? preferredGenders : [...GENDERS], language };
}

function titleView(){
  const codeInHash = location.hash?.slice(1) || '';
  const sess = loadSession() || {};
  const hostName = peekedRoom ? peekedRoom.players?.find(p => p.id === peekedRoom.hostId)?.name || 'the host' : '';
  const subtitle = codeInHash && hostName ? `Join ${escapeHtml(hostName)}'s game` : t('tagline');
  return `
    <section class="card landing">
      <h1>${t('title')}</h1>
      <p>${subtitle}</p>
      <div class="grid-landing${codeInHash ? ' single' : ''}">
        <div class="panel">
          <h3>${t('joinGame')}</h3>
          <input id="join-code" placeholder="three-words-like-this" value="${escapeAttr(codeInHash)}" maxlength="64">
          <input id="join-name" placeholder="${t('yourName')}" value="${escapeAttr(sess.name || '')}" maxlength="30">
          ${genderFields('join', sess.gender || 'nonbinary', sess.preferredGenders || GENDERS)}
          ${languageSelect('join-language', sess.language || lang())}
          <button class="primary" id="join-btn">${t('join')}</button>
        </div>
        ${codeInHash ? '' : `<div class="or">or</div>
        <div class="panel">
          <h3>${t('createGame')}</h3>
          <select id="create-theme">
            ${(THEMES ? Object.keys(THEMES) : ['Sensual']).map(k => `<option value="${escapeAttr(k)}" ${k===selectedTheme?'selected':''}>${t('theme')}: ${escapeHtml(THEMES?.[k]?.name || k)}</option>`).join('')}
          </select>
          <input id="create-name" placeholder="${t('yourName')}" value="${escapeAttr(sess.name || '')}" maxlength="30">
          ${genderFields('create', sess.gender || 'nonbinary', sess.preferredGenders || GENDERS)}
          ${languageSelect('create-language', sess.language || lang())}
          <button class="primary" id="create-btn">${t('create')}</button>
        </div>`}
      </div>
    </section>`;
}

function profileMenuHtml(room){
  const me = mePlayer() || state.me;
  const taken = new Set((room?.players||[]).filter(p => p.id !== meId()).map(p => p.color).filter(Boolean));
  const swatches = COLORS.map(c => {
    const disabled = taken.has(c);
    return `<button type="button" class="color-swatch ${me?.color===c?'selected':''} ${disabled?'taken':''}" data-color="${c}" ${disabled?'disabled':''} style="background:${COLOR_HEX[c]||'#4a5168'}" title="${c}"></button>`;
  }).join('');
  return `
    <div class="profile">
      <button id="profile-menu-toggle" class="profile-toggle">${avatarHtml(me)}<span>${escapeHtml(me?.name || 'Player')}</span><span class="caret">▾</span></button>
      <div id="profile-menu" class="dropdown">
        <div class="menu-row"><button id="change-name">${t('changeName')}</button></div>
        <label class="field-label">${t('chooseColor')}</label>
        <div class="color-palette">${swatches}</div>
        <div class="menu-row">
          <label class="file-button">${t('useSelfie')}<input id="selfie-input" type="file" accept="image/*" capture="user"></label>
        </div>
        ${languageSelect('profile-language', me?.language || lang())}
        <div class="menu-row"><button id="add-players">${t('addPlayers')}</button></div>
        <div class="menu-row"><button id="leave-game" class="danger">${t('leaveGame')}</button></div>
      </div>
    </div>`;
}
function lobbyView(){
  const r = state.room;
  const url = `${location.origin}/#${r.code}`;
  const connectedCount = (r.players || []).filter(p => p.connected !== false).length;
  const canProceed = connectedCount >= 3;
  return `
    <section class="card">
      <div class="row between">
        <h2>${t('room')}: ${escapeHtml(r.code)}</h2>
        ${profileMenuHtml(r)}
      </div>
      <div class="qr"><div id="qr"></div></div>
      <small>${t('share')}: <a href="${url}">${url}</a></small>
      <h3>${t('players')}</h3>
      <div class="players">${r.players.map(namePill).join('')}</div>
      <button class="primary" id="${r.paused ? 'resume-game' : 'start-game'}" ${canProceed ? '' : 'disabled'}>${canProceed ? (r.paused ? t('resumeGame') : t('startGame')) : t('waitingForPlayers')}</button>
    </section>`;
}
function statusText(){
  const r = state.room;
  const turn = r?.turn;
  const act = activePlayer();
  if (!turn) return '';
  if (turn.phase === 'adding') return turn.addingBy === meId() ? t('addDareTitle') : t('waitingAdd', { name: player(turn.addingBy)?.name || 'Player' });
  if (turn.phase === 'performing') {
    const a = player(turn.performing?.activeId);
    const b = player(turn.performing?.partnerId);
    const d = dare(turn.performing?.dareId);
    return t('waitingPerform', { a:a?.name || 'Player', b:b?.name || 'Player', dare:d?.title || '' });
  }
  if (isActive()) {
    if (turn.phase === 'chooseMode') return t('yourTurn');
    if (turn.phase === 'chooseDare') return t('chooseDare');
    if (turn.phase === 'choosePlayer') return t('choosePlayer');
    if (turn.phase === 'dareRespond') return t('waitingRespond', { name:'players' });
    if (turn.phase === 'personRespond') return t('waitingRespond', { name:player(turn.selectedPlayerId)?.name || 'Player' });
    if (turn.phase === 'choosePartner') return t('activeOptionsPlayers');
    if (turn.phase === 'chooseDareForPlayer') return t('activeOptionsDares', { name: player(turn.selectedPlayerId)?.name || 'Player' });
  }
  if (turn.phase === 'dareRespond') return t('selectedDare', { name:act?.name || 'Player', dare:dare(turn.selectedDareId)?.title || '' });
  if (turn.phase === 'personRespond') return t('waitingRespond', { name:player(turn.selectedPlayerId)?.name || 'Player' });
  return t('waitingChoose', { name:act?.name || 'Player' });
}
function defaultDashboard(){
  const r = state.room;
  const counts = r.me?.counts || { players:[], dares:[] };
  const others = r.players.filter(p => p.id !== meId() && p.connected !== false);
  return `
    <div class="split">
      <section>
        <h3>${t('consentPlayers')}</h3>
        <div class="list">${others.map(p => {
          const count = counts.players.find(c => c.playerId === p.id)?.count || 0;
          return `<button class="list-item" data-edit-player="${p.id}">${namePill(p)} <small>${countText(count, 'dare')}</small></button>`;
        }).join('') || `<p><small>${t('waitingForPlayers')}</small></p>`}</div>
      </section>
      <section>
        <h3>${t('consentDares')}</h3>
        <div class="list">${r.dareMenu.map(d => {
          const count = counts.dares.find(c => c.dareId === d.id)?.count || 0;
          return `<button class="list-item" data-edit-dare="${d.id}"><span>${escapeHtml(d.title)}</span> <small>${countText(count, 'player')}</small></button>`;
        }).join('')}</div>
      </section>
    </div>`;
}
function editPanel(){
  const r = state.room;
  const edit = local.edit;
  if (!edit) return defaultDashboard();
  if (edit.type === 'player') {
    const p = player(edit.id);
    if (!p) { local.edit = null; return defaultDashboard(); }
    const count = r.me?.counts?.players?.find(c => c.playerId === p.id)?.count || 0;
    return `
      <section class="panel">
        <button class="secondary narrow" id="back-edit">${t('back')}</button>
        <h3>${escapeHtml(p.name)} ${countText(count, 'dare')}</h3>
        <div class="check-list">${r.dareMenu.map(d => `
          <label><input type="checkbox" data-consent-target="${p.id}" data-consent-dare="${d.id}" ${r.me?.consent?.[p.id]?.[d.id]?'checked':''}> ${escapeHtml(d.title)}</label>
        `).join('')}</div>
      </section>`;
  }
  const d = dare(edit.id);
  if (!d) { local.edit = null; return defaultDashboard(); }
  const count = r.me?.counts?.dares?.find(c => c.dareId === d.id)?.count || 0;
  return `
    <section class="panel">
      <button class="secondary narrow" id="back-edit">${t('back')}</button>
      <h3>${countText(count, 'player')} "${escapeHtml(d.title)}"</h3>
      <div class="check-list">${r.players.filter(p => p.id !== meId() && p.connected !== false).map(p => `
        <label><input type="checkbox" data-consent-target="${p.id}" data-consent-dare="${d.id}" ${r.me?.consent?.[p.id]?.[d.id]?'checked':''}> ${namePill(p)}</label>
      `).join('')}</div>
    </section>`;
}
function activeBody(){
  const r = state.room;
  const turn = r.turn;
  const counts = r.me?.counts || { players:[], dares:[] };
  if (!isActive()) return editPanel();
  if (turn.phase === 'chooseMode') return `
    <div class="panel">
      <button class="choice-big" data-mode="dare">${t('chooseDareMode')}</button>
      <button class="choice-big" data-mode="player">${t('choosePlayerMode')}</button>
    </div>`;
  if (turn.phase === 'chooseDare') return `
    <div class="panel">
      <h3>${t('chooseDare')}</h3>
      <div class="list">${r.dareMenu.map(d => {
        const count = counts.dares.find(c => c.dareId === d.id)?.count || 0;
        return `<button class="list-item ${count===0?'disabled':''}" data-select-dare="${d.id}" ${count===0?'disabled':''}><span>${escapeHtml(d.title)}</span><small>${countText(count, 'player')}</small></button>`;
      }).join('')}</div>
    </div>`;
  if (turn.phase === 'choosePlayer') return `
    <div class="panel">
      <h3>${t('choosePlayer')}</h3>
      <div class="list">${r.players.filter(p => p.id !== meId() && p.connected !== false).map(p => {
        const count = counts.players.find(c => c.playerId === p.id)?.count || 0;
        return `<button class="list-item ${count===0?'disabled':''}" data-select-player="${p.id}" ${count===0?'disabled':''}>${namePill(p)}<small>${countText(count, 'dare')}</small></button>`;
      }).join('')}</div>
    </div>`;
  if (turn.phase === 'choosePartner') {
    const d = dare(turn.selectedDareId);
    const yes = Object.entries(turn.responses || {}).filter(([,v]) => !!v).map(([id]) => player(id)).filter(Boolean);
    return `
      <div class="panel">
        <h3>${t('activeOptionsPlayers')}</h3>
        <p><b>${escapeHtml(d?.title || '')}</b></p>
        <div class="list">${yes.map(p => `<button class="list-item" data-choose-partner="${p.id}">${namePill(p)}</button>`).join('') || `<p>${t('noOptions')}</p>`}</div>
        <button class="danger" id="pass-turn">${t('pass')}</button>
      </div>`;
  }
  if (turn.phase === 'chooseDareForPlayer') {
    const p = player(turn.selectedPlayerId);
    const yes = r.dareMenu.filter(d => turn.responses?.[d.id]);
    return `
      <div class="panel">
        <h3>${t('activeOptionsDares', { name:p?.name || 'Player' })}</h3>
        <div class="list">${yes.map(d => `<button class="list-item" data-choose-dare-final="${d.id}"><span>${escapeHtml(d.title)}</span></button>`).join('') || `<p>${t('noOptions')}</p>`}</div>
        <button class="danger" id="pass-turn">${t('pass')}</button>
      </div>`;
  }
  if (turn.phase === 'performing') {
    const d = dare(turn.performing?.dareId);
    const p = player(turn.performing?.partnerId);
    return `
      <div class="panel">
        <h3>${escapeHtml(d?.title || '')}</h3>
        <p>${namePill(mePlayer())} ${namePill(p)}</p>
        <button class="primary" id="complete-turn">${t('weDidIt')}</button>
        <button class="danger" id="pass-turn">${t('pass')}</button>
      </div>`;
  }
  if (turn.phase === 'adding' && turn.addingBy === meId()) {
    return `
      <div class="panel">
        <h3>${t('addDareTitle')}</h3>
        <input id="new-dare" placeholder="${t('newDare')}" maxlength="160">
        <button class="primary" id="add-dare">${t('addToMenu')}</button>
        <div class="or-section">${t('examples')}</div>
        <div id="examples"></div>
      </div>`;
  }
  return editPanel();
}
function mainView(){
  const r = state.room;
  return `
    <section class="card game">
      <div class="row between">
        <h2 aria-live="polite">${escapeHtml(statusText())}</h2>
        ${profileMenuHtml(r)}
      </div>
      ${activeBody()}
    </section>
    ${overlayHtml()}`;
}

function promptState(prompt){
  local.prompt[prompt.id] ||= {};
  return local.prompt[prompt.id];
}
function overlayHtml(){
  const r = state.room;
  const prompt = r?.me?.pendingPrompts?.[0];
  if (prompt) return `<div class="blocking">${promptOverlay(prompt)}</div>`;
  const turn = r?.turn;
  if (turn?.phase === 'dareRespond' && !isActive() && !Object.prototype.hasOwnProperty.call(turn.responses || {}, meId())) {
    return `<div class="blocking">${dareResponseOverlay(turn)}</div>`;
  }
  if (turn?.phase === 'personRespond' && turn.selectedPlayerId === meId()) {
    return `<div class="blocking">${personResponseOverlay(turn)}</div>`;
  }
  return '';
}
function promptOverlay(prompt){
  if (prompt.type === 'onboarding') return onboardingOverlay(prompt);
  if (prompt.type === 'new-player') return newPlayerOverlay(prompt);
  if (prompt.type === 'new-dare') return newDareOverlay(prompt);
  return '';
}
function onboardingOverlay(prompt){
  const ps = promptState(prompt);
  ps.step ??= 0;
  ps.selections ||= {};
  const cur = prompt.dares[ps.step];
  if (!cur) return '';
  const prev = prompt.dares[ps.step - 1];
  ps.selections[cur.id] ||= prev ? { ...(ps.selections[prev.id] || {}) } : { ...(prompt.firstDefaults || {}) };
  return `
    <div class="modal-card">
      <h3>${t('onboardingTitle')}</h3>
      <p>${t('onboardingHelp')}</p>
      <h2>${escapeHtml(cur.title)}</h2>
      <div class="check-list">${(prompt.players || []).map(p => `
        <label><input type="checkbox" data-onboard-player="${p.id}" ${ps.selections[cur.id]?.[p.id]?'checked':''}> ${namePill(p)}</label>
      `).join('')}</div>
      <div class="row">
        <button class="secondary" id="onboard-prev" ${ps.step === 0 ? 'disabled' : ''}>${t('back')}</button>
        <button class="primary" id="onboard-next">${ps.step === prompt.dares.length - 1 ? t('submit') : t('save')}</button>
      </div>
    </div>`;
}
function newPlayerOverlay(prompt){
  const ps = promptState(prompt);
  ps.values ||= { ...(prompt.defaults || {}) };
  return `
    <div class="modal-card">
      <h3>${t('joinedTitle', { name:prompt.player?.name || 'Player' })}</h3>
      <p>${t('joinedHelp')}</p>
      <div class="check-list">${(prompt.dares || []).map(d => `
        <label><input type="checkbox" data-new-player-dare="${d.id}" ${ps.values[d.id]?'checked':''}> ${escapeHtml(d.title)}</label>
      `).join('')}</div>
      <button class="primary" id="submit-new-player">${t('submit')}</button>
    </div>`;
}
function newDareOverlay(prompt){
  const ps = promptState(prompt);
  ps.values ||= { ...(prompt.defaults || {}) };
  return `
    <div class="modal-card">
      <h3>${t('newDareTitle')}</h3>
      <p><b>${escapeHtml(prompt.dare?.title || '')}</b></p>
      <p>${t('newDareHelp')}</p>
      <div class="check-list">${(prompt.players || []).map(p => `
        <label><input type="checkbox" data-new-dare-player="${p.id}" ${ps.values[p.id]?'checked':''}> ${namePill(p)}</label>
      `).join('')}</div>
      <button class="primary" id="submit-new-dare">${t('submit')}</button>
    </div>`;
}
function dareResponseOverlay(turn){
  const d = dare(turn.selectedDareId);
  const act = activePlayer();
  const current = !!state.room?.me?.consent?.[act?.id]?.[d?.id];
  return `
    <div class="modal-card">
      <h3>${t('selectedDare', { name:act?.name || 'Player', dare:d?.title || '' })}</h3>
      <div class="radio-stack">
        <label><input type="radio" name="dare-response" value="yes" ${current?'checked':''}> ${t('yesPlease')}</label>
        <label><input type="radio" name="dare-response" value="no" ${!current?'checked':''}> ${t('noThanks')}</label>
      </div>
      <button class="primary" id="send-dare-response">${t('sendNow')}</button>
      <small>${t('sendingIn', { seconds:secondsLeft() })}</small>
    </div>`;
}
function personResponseOverlay(turn){
  const act = activePlayer();
  return `
    <div class="modal-card">
      <h3>${t('chosenYou', { name:act?.name || 'Player' })}</h3>
      <div class="check-list">${state.room.dareMenu.map(d => `
        <label><input type="checkbox" data-person-dare="${d.id}" ${turn.responses?.[d.id]?'checked':''}> ${escapeHtml(d.title)}</label>
      `).join('')}</div>
      <button class="primary" id="send-person-response">${t('sendNow')}</button>
      <small>${t('sendingIn', { seconds:secondsLeft() })}</small>
    </div>`;
}

function renderExamples(){
  const el = $('#examples');
  if (!el) return;
  const theme = state.room?.chosenTheme || selectedTheme;
  const list = examplesListForTheme(theme);
  const offset = local.exampleOffsets[theme] || 0;
  const page = list.slice(offset, offset + PAGE_SIZE);
  el.innerHTML = `
    <div class="list">${page.map(ex => `<button class="list-item" data-example-title="${escapeAttr(ex.title)}"><span>${escapeHtml(ex.title)}</span><small>${ex.sp}</small></button>`).join('')}</div>
    <div class="examples-nav">
      <button id="examples-prev" ${offset <= 0 ? 'disabled' : ''}>${t('milder')}</button>
      <button id="examples-next" ${(offset + PAGE_SIZE) >= list.length ? 'disabled' : ''}>${t('spicier')}</button>
    </div>`;
}

function render(){
  const root = $('#app');
  const r = state.room;
  root.innerHTML = !r ? titleView() : (r.state === 'lobby' ? lobbyView() : mainView());
  try {
    const h2 = root.querySelector('h2');
    const status = h2?.textContent?.trim() || '';
    document.title = `${t('title')}${status ? ' - ' + status : ''}`;
  } catch {}
  wire();
  if (r?.state === 'lobby') renderQr();
  if (r?.state === 'main') renderExamples();
}

function wire(){
  $('#join-language')?.addEventListener('change', e => { state.me.language = e.target.value; saveSession({ language:e.target.value }); render(); });
  $('#create-language')?.addEventListener('change', e => { state.me.language = e.target.value; saveSession({ language:e.target.value }); render(); });
  $('#create-theme')?.addEventListener('change', e => selectedTheme = e.target.value || 'Sensual');
  $('#join-btn')?.addEventListener('click', doJoin);
  $('#create-btn')?.addEventListener('click', doCreate);
  $('#join-code')?.addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });
  $('#join-name')?.addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });
  $('#create-name')?.addEventListener('keydown', e => { if (e.key === 'Enter') doCreate(); });
  $('#start-game')?.addEventListener('click', () => socket.emit('theme:finalize', { theme:selectedTheme || 'Sensual' }));
  $('#resume-game')?.addEventListener('click', () => socket.emit('game:resume'));
  wireProfile();
  $$('[data-edit-player]').forEach(b => b.addEventListener('click', () => { local.edit = { type:'player', id:b.dataset.editPlayer }; render(); }));
  $$('[data-edit-dare]').forEach(b => b.addEventListener('click', () => { local.edit = { type:'dare', id:b.dataset.editDare }; render(); }));
  $('#back-edit')?.addEventListener('click', () => { local.edit = null; render(); });
  $$('[data-consent-target][data-consent-dare]').forEach(cb => cb.addEventListener('change', () => {
    socket.emit('consent:update', { targetId:cb.dataset.consentTarget, dareId:cb.dataset.consentDare, value:cb.checked });
  }));
  $$('[data-mode]').forEach(b => b.addEventListener('click', () => socket.emit('turn:chooseMode', { mode:b.dataset.mode })));
  $$('[data-select-dare]').forEach(b => b.addEventListener('click', () => socket.emit('turn:selectDare', { dareId:b.dataset.selectDare })));
  $$('[data-select-player]').forEach(b => b.addEventListener('click', () => socket.emit('turn:selectPlayer', { playerId:b.dataset.selectPlayer })));
  $$('[data-choose-partner]').forEach(b => b.addEventListener('click', async () => {
    const didConsent = !!state.room?.me?.consent?.[b.dataset.choosePartner]?.[state.room?.turn?.selectedDareId];
    if (!didConsent && !await showConfirm(t('areYouSure'), { confirmText:t('ok'), cancelText:t('cancel') })) return;
    socket.emit('turn:choosePartner', { playerId:b.dataset.choosePartner });
  }));
  $$('[data-choose-dare-final]').forEach(b => b.addEventListener('click', async () => {
    const target = state.room?.turn?.selectedPlayerId;
    const didConsent = !!state.room?.me?.consent?.[target]?.[b.dataset.chooseDareFinal];
    if (!didConsent && !await showConfirm(t('areYouSure'), { confirmText:t('ok'), cancelText:t('cancel') })) return;
    socket.emit('turn:chooseDareForPlayer', { dareId:b.dataset.chooseDareFinal });
  }));
  $('#pass-turn')?.addEventListener('click', () => socket.emit('turn:pass'));
  $('#complete-turn')?.addEventListener('click', () => socket.emit('turn:complete'));
  $('#add-dare')?.addEventListener('click', () => {
    const title = sanitizeInput($('#new-dare')?.value || '', 160);
    if (title) socket.emit('menu:addDare', { title });
  });
  $('#examples')?.addEventListener('click', e => {
    const b = e.target.closest('[data-example-title]');
    if (b && $('#new-dare')) $('#new-dare').value = b.dataset.exampleTitle || '';
  });
  $('#examples-prev')?.addEventListener('click', () => shiftExamples(-PAGE_SIZE));
  $('#examples-next')?.addEventListener('click', () => shiftExamples(PAGE_SIZE));
  wirePromptControls();
}
function shiftExamples(delta){
  const theme = state.room?.chosenTheme || selectedTheme;
  const list = examplesListForTheme(theme);
  const max = Math.max(0, list.length - PAGE_SIZE);
  local.exampleOffsets[theme] = Math.max(0, Math.min(max, (local.exampleOffsets[theme] || 0) + delta));
  saveUI({ exampleOffsets:local.exampleOffsets });
  renderExamples();
}
async function doJoin(){
  const code = sanitizeInput($('#join-code')?.value || '', 64).toLowerCase();
  if (!code) return;
  const profile = collectProfile('join');
  const ok = await showAgeGate();
  if (!ok) return location.assign('https://pbskids.org/');
  state.me = { ...state.me, ...profile };
  saveSession({ ...profile, code, playerId:null });
  socket.emit('room:join', { code, ...profile });
}
async function doCreate(){
  const profile = collectProfile('create');
  const ok = await showAgeGate();
  if (!ok) return location.assign('https://pbskids.org/');
  state.me = { ...state.me, ...profile };
  saveSession({ ...profile, playerId:null });
  socket.emit('room:create', { theme:selectedTheme || 'Sensual', ...profile });
}
function wireProfile(){
  const toggle = $('#profile-menu-toggle');
  const menu = $('#profile-menu');
  if (!toggle || !menu) return;
  const close = e => {
    if (!menu.contains(e.target) && e.target !== toggle) {
      menu.classList.remove('show');
      document.removeEventListener('click', close);
    }
  };
  toggle.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('show');
    setTimeout(() => document.addEventListener('click', close), 0);
  });
  $('#change-name')?.addEventListener('click', async () => {
    const next = sanitizeInput(await showPrompt(t('changeName'), { initialValue:mePlayer()?.name || state.me.name, placeholder:t('yourName'), confirmText:t('save'), cancelText:t('cancel'), maxLength:30 }) || '', 30);
    if (next) {
      state.me.name = next;
      saveSession({ name:next });
      socket.emit('player:update', { name:next });
    }
  });
  $$('#profile-menu [data-color]').forEach(b => b.addEventListener('click', () => {
    socket.emit('player:update', { color:b.dataset.color });
  }));
  $('#profile-language')?.addEventListener('change', e => {
    state.me.language = e.target.value;
    saveSession({ language:e.target.value });
    socket.emit('player:update', { language:e.target.value });
    render();
  });
  $('#selfie-input')?.addEventListener('change', e => uploadSelfie(e.target.files?.[0]));
  $('#add-players')?.addEventListener('click', () => showInviteOverlay(`${location.origin}/#${state.room.code}`));
  $('#leave-game')?.addEventListener('click', async () => {
    if (!await showConfirm('Leave this game?', { confirmText:t('leaveGame'), cancelText:t('cancel') })) return;
    socket.emit('room:leave');
    state.room = null;
    state.me.id = null;
    clearSession();
    history.replaceState(null, '', '#');
    render();
  });
}
function wirePromptControls(){
  const prompt = state.room?.me?.pendingPrompts?.[0];
  if (prompt) {
    const ps = promptState(prompt);
    if (prompt.type === 'onboarding') {
      const cur = prompt.dares[ps.step];
      $$('[data-onboard-player]').forEach(cb => cb.addEventListener('change', () => {
        ps.selections[cur.id] ||= {};
        ps.selections[cur.id][cb.dataset.onboardPlayer] = cb.checked;
      }));
      $('#onboard-prev')?.addEventListener('click', () => { ps.step = Math.max(0, ps.step - 1); render(); });
      $('#onboard-next')?.addEventListener('click', () => {
        if (ps.step < prompt.dares.length - 1) {
          ps.step++;
          render();
          return;
        }
        const entries = [];
        for (const d of prompt.dares) {
          const vals = ps.selections[d.id] || {};
          for (const p of prompt.players) entries.push({ dareId:d.id, targetId:p.id, value:!!vals[p.id] });
        }
        socket.emit('consent:promptSubmit', { promptId:prompt.id, type:prompt.type, entries });
        delete local.prompt[prompt.id];
      });
    }
    if (prompt.type === 'new-player') {
      $$('[data-new-player-dare]').forEach(cb => cb.addEventListener('change', () => { ps.values[cb.dataset.newPlayerDare] = cb.checked; }));
      $('#submit-new-player')?.addEventListener('click', () => {
        socket.emit('consent:promptSubmit', { promptId:prompt.id, type:prompt.type, targetId:prompt.player.id, values:ps.values });
        delete local.prompt[prompt.id];
      });
    }
    if (prompt.type === 'new-dare') {
      $$('[data-new-dare-player]').forEach(cb => cb.addEventListener('change', () => { ps.values[cb.dataset.newDarePlayer] = cb.checked; }));
      $('#submit-new-dare')?.addEventListener('click', () => {
        socket.emit('consent:promptSubmit', { promptId:prompt.id, type:prompt.type, dareId:prompt.dare.id, values:ps.values });
        delete local.prompt[prompt.id];
      });
    }
  }
  $$('input[name="dare-response"]').forEach(r => r.addEventListener('change', () => {
    const yes = $('input[name="dare-response"]:checked')?.value === 'yes';
    socket.emit('consent:update', { targetId:activeId(), dareId:state.room.turn.selectedDareId, value:yes });
  }));
  $('#send-dare-response')?.addEventListener('click', () => sendDareResponse(true));
  $$('[data-person-dare]').forEach(cb => cb.addEventListener('change', () => sendPersonResponses(false)));
  $('#send-person-response')?.addEventListener('click', () => sendPersonResponses(true));
}
function sendDareResponse(sendNow){
  const yes = $('input[name="dare-response"]:checked')?.value === 'yes';
  socket.emit('turn:submitDareResponse', { dareId:state.room.turn.selectedDareId, value:yes, sendNow });
}
function sendPersonResponses(sendNow){
  const entries = $$('[data-person-dare]').map(cb => ({ dareId:cb.dataset.personDare, value:cb.checked }));
  socket.emit('turn:submitPersonResponses', { entries, sendNow });
}
async function uploadSelfie(file){
  if (!file || !state.room || !meId()) return;
  try {
    const dataUrl = await resizeImage(file, 112);
    const res = await fetch('/api/avatar', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ code:state.room.code, playerId:meId(), image:dataUrl })
    });
    if (!res.ok) throw new Error('upload failed');
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'upload failed');
  } catch (e) {
    console.error(e);
    showConfirm(t('uploadFailed'), { confirmText:t('ok'), cancelText:t('cancel') });
  }
}
function resizeImage(file, size){
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.76));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

function renderQr(){
  import('/lib/qrcode-wrapper.js')
    .then(m => {
      const el = $('#qr');
      if (!el) return;
      const fn = m.renderQRCode || m.default;
      if (fn) fn(el, `${location.origin}/#${state.room.code}`, { size:220 });
    })
    .catch(() => {});
}
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
    overlay.className = 'overlay show';
    overlay.innerHTML = `<div class="modal card"><h3>${escapeHtml(title)}</h3><p></p><div class="row modal-buttons"><button class="btn-cancel">${escapeHtml(cancelText)}</button><button class="primary btn-ok">${escapeHtml(confirmText)}</button></div></div>`;
    overlay.querySelector('p').textContent = message || '';
    host.appendChild(overlay);
    const close = val => { overlay.remove(); resolve(val); };
    overlay.querySelector('.btn-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('.btn-ok').addEventListener('click', () => close(true));
  });
}
function showPrompt(title, { placeholder='', initialValue='', confirmText='OK', cancelText='Cancel', maxLength=60 }={}){
  return new Promise(resolve => {
    const host = ensureOverlayRoot();
    const overlay = document.createElement('div');
    overlay.className = 'overlay show';
    overlay.innerHTML = `<div class="modal card"><h3>${escapeHtml(title)}</h3><input class="modal-input" maxlength="${maxLength}" placeholder="${escapeAttr(placeholder)}"><div class="row modal-buttons"><button class="btn-cancel">${escapeHtml(cancelText)}</button><button class="primary btn-ok">${escapeHtml(confirmText)}</button></div></div>`;
    const input = overlay.querySelector('input');
    input.value = initialValue || '';
    host.appendChild(overlay);
    input.focus();
    const close = val => { overlay.remove(); resolve(val); };
    overlay.querySelector('.btn-cancel').addEventListener('click', () => close(null));
    overlay.querySelector('.btn-ok').addEventListener('click', () => close(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') close(input.value); });
  });
}
function showAgeGate(){
  return showConfirm(t('matureBody'), { title:t('mature'), confirmText:t('adult'), cancelText:t('under') });
}
function showInviteOverlay(url){
  return new Promise(resolve => {
    const host = ensureOverlayRoot();
    const overlay = document.createElement('div');
    overlay.className = 'overlay show';
    overlay.innerHTML = `<div class="modal card"><h3>${t('addPlayers')}</h3><div class="qr"><div id="invite-qr"></div></div><p><a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></p><button class="primary btn-ok">${t('ok')}</button></div>`;
    host.appendChild(overlay);
    import('/lib/qrcode-wrapper.js').then(m => { const fn = m.renderQRCode || m.default; if (fn) fn(overlay.querySelector('#invite-qr'), url, { size:220 }); }).catch(()=>{});
    overlay.querySelector('.btn-ok').addEventListener('click', () => { overlay.remove(); resolve(true); });
  });
}

socket.on('room:state', room => {
  state.room = room;
  if (room?.me?.id) state.me.id = room.me.id;
  const p = room?.players?.find(p => p.id === state.me.id);
  if (p) {
    state.me = { ...state.me, name:p.name, color:p.color, language:p.language || state.me.language, gender:p.gender || state.me.gender };
    saveSession({ code:room.code, playerId:p.id, name:p.name, language:p.language || state.me.language, gender:p.gender || state.me.gender });
  }
  if (room?.code && location.hash.slice(1) !== room.code) {
    try { history.replaceState(null, '', `#${room.code}`); } catch { location.hash = room.code; }
  }
  render();
});
socket.on('player:you', ({ playerId }) => {
  state.me.id = playerId;
  saveSession({ playerId, code:state.room?.code, name:state.me.name, language:state.me.language, gender:state.me.gender, preferredGenders:state.me.preferredGenders });
});
socket.on('room:peek:result', result => {
  peekedRoom = result.ok ? result.state : null;
  render();
});
socket.on('room:error', ({ code, message }) => {
  if (code === 'NO_SUCH_ROOM' || code === 'ROOM_EXPIRED') {
    state.room = null;
    state.me.id = null;
    peekedRoom = null;
    clearSession();
    try { history.replaceState(null, '', '#'); } catch {}
    render();
  }
  showConfirm(message || 'Error', { confirmText:t('ok'), cancelText:t('cancel') });
});
socket.on('connect', () => {
  const s = loadSession();
  const code = s?.code || location.hash?.slice(1) || '';
  if (s?.playerId && code) socket.emit('room:resume', { code, playerId:s.playerId });
});

window.addEventListener('hashchange', () => {
  const code = location.hash?.slice(1) || '';
  if (!state.room && code) socket.emit('room:peek', { code });
});
setInterval(() => {
  if (state.room?.turn?.timerEndsAt && state.room.turn.timerEndsAt > Date.now()) render();
}, 1000);

function hydrate(){
  const s = loadSession() || {};
  const ui = loadUI() || {};
  state.me = {
    ...state.me,
    name:s.name || '',
    id:s.playerId || null,
    language:s.language || browserLanguage(),
    gender:s.gender || 'nonbinary',
    preferredGenders:s.preferredGenders || [...GENDERS]
  };
  local.exampleOffsets = ui.exampleOffsets || {};
}
hydrate();
render();
loadThemes();
if (location.hash?.slice(1)) socket.emit('room:peek', { code:location.hash.slice(1) });
