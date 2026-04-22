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
const LANGS = ['en', 'es', 'pt', 'zh', 'tl', 'vi', 'ar', 'fr', 'ko', 'ru', 'ht', 'hi', 'de', 'nl', 'pl', 'it'];
const LANGUAGE_NAMES = {
  en:'English',
  es:'Español',
  pt:'Português',
  zh:'中文',
  tl:'Tagalog',
  vi:'Tiếng Việt',
  ar:'العربية',
  fr:'Français',
  ko:'한국어',
  ru:'Русский',
  ht:'Kreyòl Ayisyen',
  hi:'हिन्दी',
  de:'Deutsch',
  nl:'Nederlands',
  pl:'Polski',
  it:'Italiano'
};
const SESSION_KEY = 'dtc.session';
const UI_KEY = 'dtc.ui';
const PAGE_SIZE = 4;
const SELFIE_WORK_MAX_DIM = 1600;

const I18N = {
  en: {
    title:'Dare to Consent',
    tagline:'Would you play Spin-the-Bottle if it only chose people who WANT to kiss each other?',
    splashBlurbLead:'Gather your most uninhibited friends to play the',
    freePrintCardGame:'free-to-print card game',
    splashBlurbTail:'or play online:',
    joinHost:'Join {name}\'s game',
    joinGame:'Join Game',
    createGame:'Create Game',
    gameCode:'Game code',
    setupProfile:'Set up your profile',
    profileHelp:'These choices help prefill consent. You can change consent details once you are in the game.',
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
    or:'or',
    theme:'Theme',
    changeName:'Change name',
    chooseColor:'Choose your color',
    useSelfie:'Use selfie',
    adjustSelfie:'Adjust your selfie',
    selfieHelp:'Move and zoom the photo so your face is centered.',
    usePhoto:'Use Photo',
    zoom:'Zoom',
    horizontal:'Horizontal',
    vertical:'Vertical',
    addPlayers:'Add Players',
    leaveGame:'Leave game',
    share:'Share this link',
    yourTurn:'It is your turn',
    chooseDareMode:'Choose a dare and see who will do it with you',
    choosePlayerMode:'Choose a person and see what dares they will do with you',
    chooseDareModeTitle:'Choose a Dare',
    chooseDareModeDesc:'See who will do it with you',
    choosePlayerModeTitle:'Choose a Person',
    choosePlayerModeDesc:'See what dares they will do with you',
    chooseDare:'Choose a dare',
    choosePlayer:'Choose a player',
    waitingChoose:'Waiting for {name} to choose',
    waitingRespond:'Waiting for {name} to respond',
    waitingResponsesTitle:'Waiting for responses',
    waitingOn:'Waiting on',
    collectingResponses:'Collecting responses',
    waitingPerform:'Waiting for {a} and {b} to do: {dare}',
    performDareTitle:'Time to do a dare',
    performDareWith:'Time to do a dare with {name}',
    waitingAdd:'Waiting for {name} to add a new dare',
    waitingConsentSetup:'Waiting for {names} to configure consent',
    consentPlayers:'Click a player to edit which dares you consent to do with them:',
    consentDares:'Click a dare to edit which players you consent to do the dare with:',
    managePlayerConsent:'Manage Player Consent',
    manageDareConsent:'Manage Dare Consent',
    consentCount:'consents to {count} dares',
    dareCount:'{count} players consent',
    oneDare:'consents to 1 dare',
    onePlayer:'1 player consents',
    playerEditSummary:'{name} consents to {count} dares. What dares do you consent to for {name}?',
    playerEditSummaryOne:'{name} consents to 1 dare. What dares do you consent to for {name}?',
    dareEditSummary:'{count} players consent to "{dare}". What players do you consent to do this dare with?',
    dareEditSummaryOne:'1 player consents to "{dare}". What players do you consent to do this dare with?',
    back:'Back',
    save:'Save',
    submit:'Submit',
    sendNow:'Send Now',
    yesPlease:'Yes please',
    noThanks:'No thanks',
    sendingIn:'Sending in {seconds}',
    selectedDare:'{name} has chosen "{dare}"',
    chosenYou:'{name} chose you for a dare! You consent to:',
    activeOptionsPlayers:'Choose who to do this dare with, or pass',
    activeOptionsDares:'Choose what dare to do with {name}, or pass',
    pass:'Pass',
    weDidIt:'We did it',
    noOptions:'No current matches. You can pass.',
    areYouSure:'You previously said you did not want this dare with this person. Continue?',
    addDareTitle:'You get to write a new dare',
    newDare:'New dare',
    addToMenu:'Add to Menu',
    examples:'Here are some ideas:',
    milder:'❄️ Show milder dares',
    spicier:'🌶️ Show spicier dares',
    onboardingTitle:'Set your dare preferences',
    onboardingDareTitle:'Dare #{number}: {dare}',
    onboardingHelp:'You consent to this dare with:',
    joinedTitle:'{name} has joined!',
    joinedHelp:'Choose which dares you consent to do with this player.',
    newDareTitle:'A new dare has been added',
    newDareHelp:'You consent to this dare with:',
    stillThereTitle:'Are you still there?',
    stillThereHelp:'We are waiting on you. Tap below if you are still playing.',
    stillHere:'I\'m still here',
    secondsToRespond:'{seconds} seconds to respond',
    stillTherePeer:'Is {name} still playing?',
    stillTherePeerHelp:'If they are still playing, we will keep waiting. If not, we will remove them from this game.',
    yesKeepWaiting:'Yes, keep waiting',
    noRemovePlayer:'No, remove them',
    mature:'Mature content',
    matureBody:'This game is intended for adults 18 years or older.',
    adult:'I am 18+',
    under:'I am too young',
    ok:'OK',
    cancel:'Cancel',
    loading:'Loading',
    uploadFailed:'Selfie upload failed. Please try a JPG, PNG, WebP, or HEIC photo.'
  },
  es: {
    title:'Dare to Consent',
    tagline:'¿Jugarías a la botella si solo eligiera personas que QUIEREN besarse?',
    joinHost:'Unirse al juego de {name}',
    joinGame:'Unirse al juego',
    createGame:'Crear juego',
    gameCode:'Código del juego',
    setupProfile:'Configura tu perfil',
    profileHelp:'Estas opciones ayudan a prellenar el consentimiento. Puedes cambiar los detalles de consentimiento cuando estés dentro del juego.',
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
    or:'o',
    theme:'Tema',
    changeName:'Cambiar nombre',
    chooseColor:'Elige tu color',
    useSelfie:'Usar selfie',
    adjustSelfie:'Ajusta tu selfie',
    selfieHelp:'Mueve y amplía la foto para centrar tu cara.',
    usePhoto:'Usar foto',
    zoom:'Zoom',
    horizontal:'Horizontal',
    vertical:'Vertical',
    addPlayers:'Agregar jugadores',
    leaveGame:'Salir del juego',
    share:'Comparte este enlace',
    yourTurn:'Es tu turno',
    chooseDareMode:'Elige un reto y mira quién lo hará contigo',
    choosePlayerMode:'Elige una persona y mira qué retos hará contigo',
    chooseDareModeTitle:'Elige un reto',
    chooseDareModeDesc:'Mira quién lo hará contigo',
    choosePlayerModeTitle:'Elige una persona',
    choosePlayerModeDesc:'Mira qué retos hará contigo',
    chooseDare:'Elige un reto',
    choosePlayer:'Elige un jugador',
    waitingChoose:'Esperando a que {name} elija',
    waitingRespond:'Esperando la respuesta de {name}',
    waitingResponsesTitle:'Esperando respuestas',
    waitingOn:'Esperando a',
    collectingResponses:'Recopilando respuestas',
    waitingPerform:'Esperando a que {a} y {b} hagan: {dare}',
    waitingAdd:'Esperando a que {name} agregue un nuevo reto',
    consentPlayers:'Toca un jugador para editar qué retos aceptas hacer con esa persona:',
    consentDares:'Toca un reto para editar con qué jugadores aceptas hacerlo:',
    consentCount:'acepta {count} retos',
    dareCount:'{count} jugadores aceptan',
    oneDare:'acepta 1 reto',
    onePlayer:'1 jugador acepta',
    playerEditSummary:'{name} acepta {count} retos. ¿Qué retos aceptas hacer con {name}?',
    playerEditSummaryOne:'{name} acepta 1 reto. ¿Qué retos aceptas hacer con {name}?',
    dareEditSummary:'{count} jugadores aceptan hacer "{dare}". ¿Con qué jugadores aceptas hacer este reto?',
    dareEditSummaryOne:'1 jugador acepta hacer "{dare}". ¿Con qué jugadores aceptas hacer este reto?',
    back:'Atrás',
    save:'Guardar',
    submit:'Enviar',
    sendNow:'Enviar ahora',
    yesPlease:'Sí, por favor',
    noThanks:'No, gracias',
    sendingIn:'Enviando en {seconds}',
    selectedDare:'{name} eligió "{dare}"',
    chosenYou:'¡{name} te eligió para un reto! Aceptas:',
    activeOptionsPlayers:'Elige con quién hacer este reto, o pasa',
    activeOptionsDares:'Elige qué reto hacer con {name}, o pasa',
    pass:'Pasar',
    weDidIt:'Lo hicimos',
    noOptions:'No hay coincidencias actuales. Puedes pasar.',
    areYouSure:'Antes dijiste que no querías este reto con esta persona. ¿Continuar?',
    addDareTitle:'Puedes escribir un nuevo reto',
    newDare:'Nuevo reto',
    addToMenu:'Agregar al menú',
    examples:'Aquí tienes algunas ideas:',
    milder:'❄️ Mostrar retos más suaves',
    spicier:'🌶️ Mostrar retos más picantes',
    onboardingTitle:'Configura tus preferencias',
    onboardingDareTitle:'Reto #{number}: {dare}',
    onboardingHelp:'Aceptas este reto con:',
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
    uploadFailed:'No se pudo subir la selfie. Prueba con una foto JPG, PNG, WebP o HEIC.'
  },
  pt: {
    title:'Dare to Consent',
    tagline:'Você jogaria Verdade ou Consequência se ele só escolhesse pessoas que QUEREM se beijar?',
    joinHost:'Entrar no jogo de {name}',
    joinGame:'Entrar no jogo',
    createGame:'Criar jogo',
    gameCode:'Código do jogo',
    setupProfile:'Configure seu perfil',
    profileHelp:'Essas escolhas ajudam a preencher o consentimento. Você pode mudar os detalhes de consentimento depois de entrar no jogo.',
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
    or:'ou',
    theme:'Tema',
    changeName:'Mudar nome',
    chooseColor:'Escolha sua cor',
    useSelfie:'Usar selfie',
    adjustSelfie:'Ajuste sua selfie',
    selfieHelp:'Mova e amplie a foto para centralizar seu rosto.',
    usePhoto:'Usar foto',
    zoom:'Zoom',
    horizontal:'Horizontal',
    vertical:'Vertical',
    addPlayers:'Adicionar jogadores',
    leaveGame:'Sair do jogo',
    share:'Compartilhe este link',
    yourTurn:'É a sua vez',
    chooseDareMode:'Escolha um desafio e veja quem fará com você',
    choosePlayerMode:'Escolha uma pessoa e veja quais desafios ela fará com você',
    chooseDareModeTitle:'Escolha um desafio',
    chooseDareModeDesc:'Veja quem fará com você',
    choosePlayerModeTitle:'Escolha uma pessoa',
    choosePlayerModeDesc:'Veja quais desafios ela fará com você',
    chooseDare:'Escolha um desafio',
    choosePlayer:'Escolha um jogador',
    waitingChoose:'Aguardando {name} escolher',
    waitingRespond:'Aguardando resposta de {name}',
    waitingResponsesTitle:'Aguardando respostas',
    waitingOn:'Aguardando',
    collectingResponses:'Coletando respostas',
    waitingPerform:'Aguardando {a} e {b} fazerem: {dare}',
    waitingAdd:'Aguardando {name} adicionar um novo desafio',
    consentPlayers:'Toque em um jogador para editar quais desafios você aceita fazer com essa pessoa:',
    consentDares:'Toque em um desafio para editar com quais jogadores você aceita fazê-lo:',
    consentCount:'aceita {count} desafios',
    dareCount:'{count} jogadores aceitam',
    oneDare:'aceita 1 desafio',
    onePlayer:'1 jogador aceita',
    playerEditSummary:'{name} aceita {count} desafios. Quais desafios você aceita fazer com {name}?',
    playerEditSummaryOne:'{name} aceita 1 desafio. Quais desafios você aceita fazer com {name}?',
    dareEditSummary:'{count} jogadores aceitam fazer "{dare}". Com quais jogadores você aceita fazer este desafio?',
    dareEditSummaryOne:'1 jogador aceita fazer "{dare}". Com quais jogadores você aceita fazer este desafio?',
    back:'Voltar',
    save:'Salvar',
    submit:'Enviar',
    sendNow:'Enviar agora',
    yesPlease:'Sim, por favor',
    noThanks:'Não, obrigado',
    sendingIn:'Enviando em {seconds}',
    selectedDare:'{name} escolheu "{dare}"',
    chosenYou:'{name} escolheu você para um desafio! Você aceita:',
    activeOptionsPlayers:'Escolha com quem fazer este desafio, ou passe',
    activeOptionsDares:'Escolha qual desafio fazer com {name}, ou passe',
    pass:'Passar',
    weDidIt:'Nós fizemos',
    noOptions:'Não há combinações atuais. Você pode passar.',
    areYouSure:'Você disse antes que não queria este desafio com esta pessoa. Continuar?',
    addDareTitle:'Você pode escrever um novo desafio',
    newDare:'Novo desafio',
    addToMenu:'Adicionar ao menu',
    examples:'Aqui estão algumas ideias:',
    milder:'❄️ Mostrar desafios mais leves',
    spicier:'🌶️ Mostrar desafios mais picantes',
    onboardingTitle:'Defina suas preferências',
    onboardingDareTitle:'Desafio #{number}: {dare}',
    onboardingHelp:'Você aceita este desafio com:',
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
    uploadFailed:'Falha ao enviar a selfie. Tente uma foto JPG, PNG, WebP ou HEIC.'
  }
};

Object.assign(I18N, {
  zh: { ...I18N.en,
    tagline:'如果转瓶子只会选到真正想亲吻彼此的人，你会玩吗？', joinHost:'加入{name}的游戏', joinGame:'加入游戏', createGame:'创建游戏', gameCode:'游戏代码', setupProfile:'设置你的资料', profileHelp:'这些选择会用来预填同意设置。进入游戏后你仍然可以更改具体同意内容。', room:'房间', players:'玩家', startGame:'开始游戏', resumeGame:'继续游戏', waitingForPlayers:'等待至少3名玩家', yourName:'你的名字', yourGender:'你的性别', prefer:'你偏好和以下性别的玩家做挑战', male:'男性', female:'女性', nonbinary:'非二元/其他', language:'语言', join:'加入', create:'创建', or:'或', theme:'主题', changeName:'更改名字', chooseColor:'选择你的颜色', useSelfie:'使用自拍', addPlayers:'添加玩家', leaveGame:'离开游戏', share:'分享此链接', yourTurn:'轮到你了', chooseDareModeTitle:'选择挑战', chooseDareModeDesc:'看看谁愿意和你一起做', choosePlayerModeTitle:'选择玩家', choosePlayerModeDesc:'看看对方愿意和你做哪些挑战', chooseDare:'选择挑战', choosePlayer:'选择玩家', waitingChoose:'等待{name}选择', waitingRespond:'等待{name}回应', waitingResponsesTitle:'等待回应', waitingOn:'等待', collectingResponses:'正在收集回应', waitingPerform:'等待{a}和{b}完成：{dare}', waitingAdd:'等待{name}添加新挑战', consentPlayers:'点击玩家，编辑你愿意和对方做哪些挑战：', consentDares:'点击挑战，编辑你愿意和哪些玩家做这个挑战：', consentCount:'同意{count}个挑战', dareCount:'{count}名玩家同意', oneDare:'同意1个挑战', onePlayer:'1名玩家同意', playerEditSummary:'{name}同意{count}个挑战。你愿意和{name}做哪些挑战？', playerEditSummaryOne:'{name}同意1个挑战。你愿意和{name}做哪些挑战？', dareEditSummary:'{count}名玩家同意“{dare}”。你愿意和哪些玩家做这个挑战？', dareEditSummaryOne:'1名玩家同意“{dare}”。你愿意和哪些玩家做这个挑战？', back:'返回', save:'保存', submit:'提交', sendNow:'立即发送', yesPlease:'愿意', noThanks:'不了，谢谢', sendingIn:'{seconds}秒后发送', selectedDare:'{name}选择了“{dare}”', chosenYou:'{name}选择了你做挑战！你同意：', activeOptionsPlayers:'选择和谁做这个挑战，或跳过', activeOptionsDares:'选择和{name}做哪个挑战，或跳过', pass:'跳过', weDidIt:'我们完成了', noOptions:'当前没有匹配。你可以跳过。', areYouSure:'你之前说过不想和这个人做这个挑战。继续吗？', addDareTitle:'你可以写一个新挑战', newDare:'新挑战', addToMenu:'添加到菜单', examples:'这里有一些灵感：', milder:'❄️ 显示更温和的挑战', spicier:'🌶️ 显示更刺激的挑战', onboardingTitle:'设置你的挑战偏好', onboardingDareTitle:'挑战 #{number}：{dare}', onboardingHelp:'你同意和以下玩家做这个挑战：', joinedTitle:'{name}加入了！', joinedHelp:'选择你愿意和这名玩家做哪些挑战。', newDareTitle:'已添加新挑战', newDareHelp:'你愿意和这些人做这个挑战：', mature:'成人内容', matureBody:'本游戏仅适合18岁及以上成人。', adult:'我已满18岁', under:'我未成年', ok:'确定', cancel:'取消', loading:'加载中', uploadFailed:'自拍上传失败。请尝试使用 JPG、PNG、WebP 或 HEIC 照片。'
  },
  tl: { ...I18N.en,
    tagline:'Maglalaro ka ba ng Spin-the-Bottle kung pipili lang ito ng mga taong GUSTONG humalik sa isa\'t isa?', joinHost:'Sumali sa laro ni {name}', joinGame:'Sumali sa Laro', createGame:'Gumawa ng Laro', gameCode:'Code ng laro', setupProfile:'Ayusin ang iyong profile', profileHelp:'Ginagamit ang mga sagot na ito para punan ang paunang consent. Maaari mo pa itong baguhin sa loob ng laro.', room:'Kuwarto', players:'Mga manlalaro', startGame:'Simulan ang Laro', resumeGame:'Ipagpatuloy ang Laro', waitingForPlayers:'Naghihintay ng hindi bababa sa 3 manlalaro', yourName:'Pangalan mo', yourGender:'Kasarian mo', prefer:'Mas gusto mong gumawa ng dare kasama ang mga manlalarong', male:'lalaki', female:'babae', nonbinary:'nonbinary/iba pa', language:'Wika', join:'Sumali', create:'Gumawa', or:'o', theme:'Tema', changeName:'Palitan ang pangalan', chooseColor:'Piliin ang kulay mo', useSelfie:'Gumamit ng selfie', addPlayers:'Magdagdag ng Manlalaro', leaveGame:'Umalis sa laro', share:'Ibahagi ang link na ito', yourTurn:'Ikaw na', chooseDareModeTitle:'Pumili ng Dare', chooseDareModeDesc:'Tingnan kung sino ang gagawa nito kasama ka', choosePlayerModeTitle:'Pumili ng Tao', choosePlayerModeDesc:'Tingnan kung aling dares ang gagawin nila kasama ka', chooseDare:'Pumili ng dare', choosePlayer:'Pumili ng manlalaro', waitingChoose:'Naghihintay kay {name} na pumili', waitingRespond:'Naghihintay sa sagot ni {name}', waitingResponsesTitle:'Naghihintay ng mga sagot', waitingOn:'Naghihintay kina', collectingResponses:'Kinokolekta ang mga sagot', waitingPerform:'Naghihintay kina {a} at {b} na gawin: {dare}', waitingAdd:'Naghihintay kay {name} na magdagdag ng bagong dare', consentPlayers:'Pindutin ang manlalaro para baguhin kung aling dares ang payag kang gawin kasama sila:', consentDares:'Pindutin ang dare para baguhin kung sinong mga manlalaro ang payag kang gawin ito kasama:', consentCount:'pumapayag sa {count} dares', dareCount:'{count} manlalaro ang pumapayag', oneDare:'pumapayag sa 1 dare', onePlayer:'1 manlalaro ang pumapayag', playerEditSummary:'Pumapayag si {name} sa {count} dares. Aling dares ang payag mong gawin kasama si {name}?', playerEditSummaryOne:'Pumapayag si {name} sa 1 dare. Aling dares ang payag mong gawin kasama si {name}?', dareEditSummary:'{count} manlalaro ang pumapayag sa "{dare}". Sinong mga manlalaro ang payag mong gawin ang dare na ito kasama?', dareEditSummaryOne:'1 manlalaro ang pumapayag sa "{dare}". Sinong mga manlalaro ang payag mong gawin ang dare na ito kasama?', back:'Bumalik', save:'I-save', submit:'Isumite', sendNow:'Ipadala Ngayon', yesPlease:'Oo, gusto ko', noThanks:'Hindi, salamat', sendingIn:'Ipapadala sa {seconds}', selectedDare:'Pinili ni {name} ang "{dare}"', chosenYou:'Pinili ka ni {name} para sa dare! Payag ka sa:', activeOptionsPlayers:'Piliin kung sino ang gagawa ng dare na ito kasama mo, o pumasa', activeOptionsDares:'Piliin kung aling dare ang gagawin kasama si {name}, o pumasa', pass:'Pumasa', weDidIt:'Nagawa namin', noOptions:'Walang tugma ngayon. Maaari kang pumasa.', areYouSure:'Dati mong sinabi na ayaw mo sa dare na ito kasama ang taong ito. Ituloy?', addDareTitle:'Maaari kang magsulat ng bagong dare', newDare:'Bagong dare', addToMenu:'Idagdag sa Menu', examples:'Narito ang ilang ideya:', milder:'❄️ Magpakita ng mas banayad na dares', spicier:'🌶️ Magpakita ng mas maanghang na dares', onboardingTitle:'Itakda ang iyong dare preferences', onboardingDareTitle:'Dare #{number}: {dare}', onboardingHelp:'Payag ka sa dare na ito kasama ang:', joinedTitle:'Sumali si {name}!', joinedHelp:'Piliin kung aling dares ang payag kang gawin kasama ang manlalarong ito.', newDareTitle:'May bagong dare na idinagdag', newDareHelp:'Payag kang gawin ang dare na ito kasama ang:', mature:'Pang-adultong nilalaman', matureBody:'Ang larong ito ay para sa mga nasa edad 18 pataas.', adult:'18+ ako', under:'Masyado pa akong bata', ok:'OK', cancel:'Kanselahin', loading:'Naglo-load', uploadFailed:'Nabigo ang pag-upload ng selfie. Subukan ang mas maliit na larawan.'
  },
  vi: { ...I18N.en,
    tagline:'Bạn có chơi Xoay Chai nếu nó chỉ chọn những người MUỐN hôn nhau không?', joinHost:'Tham gia trò chơi của {name}', joinGame:'Tham gia trò chơi', createGame:'Tạo trò chơi', gameCode:'Mã trò chơi', setupProfile:'Thiết lập hồ sơ', profileHelp:'Các lựa chọn này giúp điền sẵn phần đồng ý. Bạn vẫn có thể đổi chi tiết đồng ý sau khi vào trò chơi.', room:'Phòng', players:'Người chơi', startGame:'Bắt đầu', resumeGame:'Tiếp tục', waitingForPlayers:'Đang chờ ít nhất 3 người chơi', yourName:'Tên của bạn', yourGender:'Giới tính của bạn', prefer:'Bạn thích làm thử thách với người chơi là', male:'nam', female:'nữ', nonbinary:'phi nhị nguyên/khác', language:'Ngôn ngữ', join:'Tham gia', create:'Tạo', or:'hoặc', theme:'Chủ đề', changeName:'Đổi tên', chooseColor:'Chọn màu của bạn', useSelfie:'Dùng ảnh selfie', addPlayers:'Thêm người chơi', leaveGame:'Rời trò chơi', share:'Chia sẻ liên kết này', yourTurn:'Đến lượt bạn', chooseDareModeTitle:'Chọn thử thách', chooseDareModeDesc:'Xem ai sẽ làm cùng bạn', choosePlayerModeTitle:'Chọn một người', choosePlayerModeDesc:'Xem họ sẽ làm thử thách nào cùng bạn', chooseDare:'Chọn thử thách', choosePlayer:'Chọn người chơi', waitingChoose:'Đang chờ {name} chọn', waitingRespond:'Đang chờ {name} trả lời', waitingResponsesTitle:'Đang chờ phản hồi', waitingOn:'Đang chờ', collectingResponses:'Đang thu phản hồi', waitingPerform:'Đang chờ {a} và {b} thực hiện: {dare}', waitingAdd:'Đang chờ {name} thêm thử thách mới', consentPlayers:'Nhấn vào người chơi để chỉnh các thử thách bạn đồng ý làm với họ:', consentDares:'Nhấn vào thử thách để chỉnh những người bạn đồng ý làm thử thách này cùng:', consentCount:'đồng ý {count} thử thách', dareCount:'{count} người chơi đồng ý', oneDare:'đồng ý 1 thử thách', onePlayer:'1 người chơi đồng ý', playerEditSummary:'{name} đồng ý {count} thử thách. Bạn đồng ý làm thử thách nào với {name}?', playerEditSummaryOne:'{name} đồng ý 1 thử thách. Bạn đồng ý làm thử thách nào với {name}?', dareEditSummary:'{count} người chơi đồng ý "{dare}". Bạn đồng ý làm thử thách này với những người nào?', dareEditSummaryOne:'1 người chơi đồng ý "{dare}". Bạn đồng ý làm thử thách này với những người nào?', back:'Quay lại', save:'Lưu', submit:'Gửi', sendNow:'Gửi ngay', yesPlease:'Có', noThanks:'Không, cảm ơn', sendingIn:'Gửi sau {seconds}', selectedDare:'{name} đã chọn "{dare}"', chosenYou:'{name} đã chọn bạn cho một thử thách! Bạn đồng ý:', activeOptionsPlayers:'Chọn người làm thử thách này cùng bạn, hoặc bỏ qua', activeOptionsDares:'Chọn thử thách làm với {name}, hoặc bỏ qua', pass:'Bỏ qua', weDidIt:'Chúng tôi đã làm', noOptions:'Hiện không có lựa chọn phù hợp. Bạn có thể bỏ qua.', areYouSure:'Trước đó bạn nói không muốn làm thử thách này với người này. Tiếp tục?', addDareTitle:'Bạn được viết thử thách mới', newDare:'Thử thách mới', addToMenu:'Thêm vào menu', examples:'Một vài ý tưởng:', milder:'❄️ Hiển thị thử thách nhẹ hơn', spicier:'🌶️ Hiển thị thử thách táo bạo hơn', onboardingTitle:'Đặt tùy chọn thử thách', onboardingDareTitle:'Thử thách #{number}: {dare}', onboardingHelp:'Bạn đồng ý làm thử thách này với:', joinedTitle:'{name} đã tham gia!', joinedHelp:'Chọn thử thách bạn đồng ý làm với người chơi này.', newDareTitle:'Đã thêm thử thách mới', newDareHelp:'Bạn đồng ý làm thử thách này với:', mature:'Nội dung người lớn', matureBody:'Trò chơi này dành cho người từ 18 tuổi trở lên.', adult:'Tôi từ 18 tuổi', under:'Tôi chưa đủ tuổi', ok:'OK', cancel:'Hủy', loading:'Đang tải', uploadFailed:'Tải ảnh selfie thất bại. Hãy thử ảnh nhỏ hơn.'
  },
  fr: { ...I18N.en,
    tagline:'Jouerais-tu à la bouteille si elle ne choisissait que des personnes qui VEULENT s’embrasser ?', joinHost:'Rejoindre la partie de {name}', joinGame:'Rejoindre la partie', createGame:'Créer une partie', gameCode:'Code de la partie', setupProfile:'Configure ton profil', profileHelp:'Ces choix servent à préremplir le consentement. Tu pourras modifier les détails une fois dans la partie.', room:'Salon', players:'Joueurs', startGame:'Commencer', resumeGame:'Reprendre', waitingForPlayers:'En attente d’au moins 3 joueurs', yourName:'Ton nom', yourGender:'Ton genre', prefer:'Tu préfères faire des défis avec des joueurs qui sont', male:'homme', female:'femme', nonbinary:'non binaire/autre', language:'Langue', join:'Rejoindre', create:'Créer', or:'ou', theme:'Thème', changeName:'Changer de nom', chooseColor:'Choisis ta couleur', useSelfie:'Utiliser un selfie', addPlayers:'Ajouter des joueurs', leaveGame:'Quitter la partie', share:'Partager ce lien', yourTurn:'C’est ton tour', chooseDareModeTitle:'Choisir un défi', chooseDareModeDesc:'Voir qui le fera avec toi', choosePlayerModeTitle:'Choisir une personne', choosePlayerModeDesc:'Voir quels défis elle fera avec toi', chooseDare:'Choisis un défi', choosePlayer:'Choisis un joueur', waitingChoose:'En attente du choix de {name}', waitingRespond:'En attente de la réponse de {name}', waitingResponsesTitle:'En attente des réponses', waitingOn:'En attente de', collectingResponses:'Réponses en cours', waitingPerform:'En attente que {a} et {b} fassent : {dare}', waitingAdd:'En attente que {name} ajoute un nouveau défi', consentPlayers:'Clique sur un joueur pour modifier les défis que tu acceptes de faire avec cette personne :', consentDares:'Clique sur un défi pour modifier avec quels joueurs tu acceptes de le faire :', consentCount:'accepte {count} défis', dareCount:'{count} joueurs acceptent', oneDare:'accepte 1 défi', onePlayer:'1 joueur accepte', playerEditSummary:'{name} accepte {count} défis. Quels défis acceptes-tu de faire avec {name} ?', playerEditSummaryOne:'{name} accepte 1 défi. Quels défis acceptes-tu de faire avec {name} ?', dareEditSummary:'{count} joueurs acceptent « {dare} ». Avec quels joueurs acceptes-tu de faire ce défi ?', dareEditSummaryOne:'1 joueur accepte « {dare} ». Avec quels joueurs acceptes-tu de faire ce défi ?', back:'Retour', save:'Enregistrer', submit:'Envoyer', sendNow:'Envoyer maintenant', yesPlease:'Oui, volontiers', noThanks:'Non merci', sendingIn:'Envoi dans {seconds}', selectedDare:'{name} a choisi « {dare} »', chosenYou:'{name} t’a choisi pour un défi ! Tu acceptes :', activeOptionsPlayers:'Choisis avec qui faire ce défi, ou passe', activeOptionsDares:'Choisis quel défi faire avec {name}, ou passe', pass:'Passer', weDidIt:'On l’a fait', noOptions:'Aucune correspondance pour le moment. Tu peux passer.', areYouSure:'Tu avais dit ne pas vouloir faire ce défi avec cette personne. Continuer ?', addDareTitle:'Tu peux écrire un nouveau défi', newDare:'Nouveau défi', addToMenu:'Ajouter au menu', examples:'Voici quelques idées :', milder:'❄️ Afficher des défis plus doux', spicier:'🌶️ Afficher des défis plus osés', onboardingTitle:'Définis tes préférences de défis', onboardingDareTitle:'Défi #{number} : {dare}', onboardingHelp:'Tu acceptes ce défi avec :', joinedTitle:'{name} a rejoint !', joinedHelp:'Choisis les défis que tu acceptes de faire avec ce joueur.', newDareTitle:'Un nouveau défi a été ajouté', newDareHelp:'Tu acceptes ce défi avec :', mature:'Contenu adulte', matureBody:'Ce jeu est destiné aux adultes de 18 ans ou plus.', adult:'J’ai 18 ans ou plus', under:'Je suis trop jeune', ok:'OK', cancel:'Annuler', loading:'Chargement', uploadFailed:'Échec du téléchargement du selfie. Essaie une photo plus petite.'
  },
  de: { ...I18N.en,
    tagline:'Würdest du Flaschendrehen spielen, wenn nur Menschen gewählt werden, die einander küssen WOLLEN?', joinHost:'Dem Spiel von {name} beitreten', joinGame:'Spiel beitreten', createGame:'Spiel erstellen', gameCode:'Spielcode', setupProfile:'Profil einrichten', profileHelp:'Diese Angaben füllen die Zustimmung vor. Du kannst Details später im Spiel ändern.', room:'Raum', players:'Spieler', startGame:'Spiel starten', resumeGame:'Spiel fortsetzen', waitingForPlayers:'Warte auf mindestens 3 Spieler', yourName:'Dein Name', yourGender:'Dein Geschlecht', prefer:'Du bevorzugst Mutproben mit Spielern, die sind', male:'männlich', female:'weiblich', nonbinary:'nichtbinär/andere', language:'Sprache', join:'Beitreten', create:'Erstellen', or:'oder', theme:'Thema', changeName:'Namen ändern', chooseColor:'Wähle deine Farbe', useSelfie:'Selfie verwenden', addPlayers:'Spieler hinzufügen', leaveGame:'Spiel verlassen', share:'Diesen Link teilen', yourTurn:'Du bist dran', chooseDareModeTitle:'Mutprobe wählen', chooseDareModeDesc:'Sieh, wer sie mit dir macht', choosePlayerModeTitle:'Person wählen', choosePlayerModeDesc:'Sieh, welche Mutproben sie mit dir macht', chooseDare:'Mutprobe wählen', choosePlayer:'Spieler wählen', waitingChoose:'Warte darauf, dass {name} wählt', waitingRespond:'Warte auf Antwort von {name}', waitingResponsesTitle:'Warte auf Antworten', waitingOn:'Warte auf', collectingResponses:'Sammle Antworten', waitingPerform:'Warte darauf, dass {a} und {b} ausführen: {dare}', waitingAdd:'Warte darauf, dass {name} eine neue Mutprobe hinzufügt', consentPlayers:'Tippe auf einen Spieler, um zu bearbeiten, welche Mutproben du mit dieser Person machen willst:', consentDares:'Tippe auf eine Mutprobe, um zu bearbeiten, mit welchen Spielern du sie machen willst:', consentCount:'stimmt {count} Mutproben zu', dareCount:'{count} Spieler stimmen zu', oneDare:'stimmt 1 Mutprobe zu', onePlayer:'1 Spieler stimmt zu', playerEditSummary:'{name} stimmt {count} Mutproben zu. Welchen Mutproben stimmst du für {name} zu?', playerEditSummaryOne:'{name} stimmt 1 Mutprobe zu. Welchen Mutproben stimmst du für {name} zu?', dareEditSummary:'{count} Spieler stimmen „{dare}“ zu. Mit welchen Spielern willst du diese Mutprobe machen?', dareEditSummaryOne:'1 Spieler stimmt „{dare}“ zu. Mit welchen Spielern willst du diese Mutprobe machen?', back:'Zurück', save:'Speichern', submit:'Absenden', sendNow:'Jetzt senden', yesPlease:'Ja bitte', noThanks:'Nein danke', sendingIn:'Senden in {seconds}', selectedDare:'{name} hat „{dare}“ gewählt', chosenYou:'{name} hat dich für eine Mutprobe gewählt! Du stimmst zu:', activeOptionsPlayers:'Wähle, mit wem du diese Mutprobe machst, oder passe', activeOptionsDares:'Wähle, welche Mutprobe du mit {name} machst, oder passe', pass:'Passen', weDidIt:'Wir haben es gemacht', noOptions:'Aktuell keine Treffer. Du kannst passen.', areYouSure:'Du hast vorher gesagt, dass du diese Mutprobe mit dieser Person nicht möchtest. Fortfahren?', addDareTitle:'Du darfst eine neue Mutprobe schreiben', newDare:'Neue Mutprobe', addToMenu:'Zum Menü hinzufügen', examples:'Hier sind ein paar Ideen:', milder:'❄️ Mildere Mutproben anzeigen', spicier:'🌶️ Pikantere Mutproben anzeigen', onboardingTitle:'Lege deine Mutproben-Vorlieben fest', onboardingDareTitle:'Mutprobe #{number}: {dare}', onboardingHelp:'Du stimmst dieser Mutprobe zu mit:', joinedTitle:'{name} ist beigetreten!', joinedHelp:'Wähle, welche Mutproben du mit diesem Spieler machen willst.', newDareTitle:'Eine neue Mutprobe wurde hinzugefügt', newDareHelp:'Du stimmst dieser Mutprobe zu mit:', mature:'Inhalte für Erwachsene', matureBody:'Dieses Spiel ist für Erwachsene ab 18 Jahren gedacht.', adult:'Ich bin 18+', under:'Ich bin zu jung', ok:'OK', cancel:'Abbrechen', loading:'Lädt', uploadFailed:'Selfie-Upload fehlgeschlagen. Versuche ein kleineres Foto.'
  },
  ar: { ...I18N.en, tagline:'هل ستلعب لعبة تدوير الزجاجة إذا كانت تختار فقط أشخاصا يريدون تقبيل بعضهم؟', joinGame:'انضم إلى اللعبة', createGame:'أنشئ لعبة', gameCode:'رمز اللعبة', setupProfile:'إعداد ملفك', profileHelp:'تساعد هذه الاختيارات على ملء الموافقة مبدئيا. يمكنك تغيير التفاصيل بعد دخول اللعبة.', room:'الغرفة', players:'اللاعبون', startGame:'ابدأ اللعبة', waitingForPlayers:'بانتظار 3 لاعبين على الأقل', yourName:'اسمك', yourGender:'جنسك', prefer:'تفضل أداء التحديات مع لاعبين هم', male:'ذكر', female:'أنثى', nonbinary:'غير ثنائي/آخر', language:'اللغة', join:'انضم', create:'أنشئ', or:'أو', theme:'السمة', yourTurn:'حان دورك', chooseDareModeTitle:'اختر تحديا', chooseDareModeDesc:'اعرف من سيقوم به معك', choosePlayerModeTitle:'اختر شخصا', choosePlayerModeDesc:'اعرف أي تحديات سيقوم بها معك', consentPlayers:'اضغط على لاعب لتعديل التحديات التي توافق على القيام بها معه:', consentDares:'اضغط على تحد لتعديل اللاعبين الذين توافق على القيام به معهم:', playerEditSummary:'{name} يوافق على {count} تحديات. ما التحديات التي توافق عليها مع {name}؟', playerEditSummaryOne:'{name} يوافق على تحد واحد. ما التحديات التي توافق عليها مع {name}؟', dareEditSummary:'{count} لاعبين يوافقون على "{dare}". مع أي لاعبين توافق على هذا التحدي؟', dareEditSummaryOne:'لاعب واحد يوافق على "{dare}". مع أي لاعبين توافق على هذا التحدي؟', back:'رجوع', save:'حفظ', submit:'إرسال', sendNow:'أرسل الآن', yesPlease:'نعم من فضلك', noThanks:'لا شكرا', pass:'تجاوز', weDidIt:'فعلناها', examples:'إليك بعض الأفكار:', milder:'❄️ أظهر تحديات ألطف', spicier:'🌶️ أظهر تحديات أكثر جرأة', ok:'حسنا', cancel:'إلغاء' },
  ko: { ...I18N.en, tagline:'서로 키스하고 싶어 하는 사람만 고르는 병 돌리기라면 하시겠어요?', joinGame:'게임 참여', createGame:'게임 만들기', gameCode:'게임 코드', setupProfile:'프로필 설정', profileHelp:'이 선택은 동의 설정을 미리 채우는 데 사용됩니다. 게임에 들어간 뒤에도 세부 동의를 바꿀 수 있습니다.', room:'방', players:'플레이어', startGame:'게임 시작', waitingForPlayers:'최소 3명의 플레이어를 기다리는 중', yourName:'이름', yourGender:'성별', prefer:'함께 도전하고 싶은 플레이어의 성별', male:'남성', female:'여성', nonbinary:'논바이너리/기타', language:'언어', join:'참여', create:'만들기', or:'또는', theme:'테마', yourTurn:'당신 차례입니다', chooseDareModeTitle:'도전 선택', chooseDareModeDesc:'누가 함께할지 보기', choosePlayerModeTitle:'사람 선택', choosePlayerModeDesc:'상대가 어떤 도전을 함께할지 보기', consentPlayers:'플레이어를 눌러 그 사람과 함께할 도전을 편집하세요:', consentDares:'도전을 눌러 함께할 플레이어를 편집하세요:', playerEditSummary:'{name}은(는) {count}개 도전에 동의합니다. {name}과 어떤 도전에 동의하나요?', playerEditSummaryOne:'{name}은(는) 1개 도전에 동의합니다. {name}과 어떤 도전에 동의하나요?', dareEditSummary:'{count}명의 플레이어가 "{dare}"에 동의합니다. 이 도전을 누구와 하겠습니까?', dareEditSummaryOne:'1명의 플레이어가 "{dare}"에 동의합니다. 이 도전을 누구와 하겠습니까?', back:'뒤로', save:'저장', submit:'제출', sendNow:'지금 보내기', yesPlease:'좋아요', noThanks:'아니요', pass:'패스', weDidIt:'완료했어요', examples:'아이디어:', milder:'❄️ 더 순한 도전 보기', spicier:'🌶️ 더 매운 도전 보기', ok:'확인', cancel:'취소' },
  ru: { ...I18N.en, tagline:'Вы бы сыграли в бутылочку, если бы она выбирала только тех, кто ХОЧЕТ поцеловать друг друга?', joinGame:'Присоединиться', createGame:'Создать игру', gameCode:'Код игры', setupProfile:'Настройте профиль', profileHelp:'Эти ответы используются для предварительного согласия. Позже их можно изменить.', room:'Комната', players:'Игроки', startGame:'Начать игру', waitingForPlayers:'Ожидание минимум 3 игроков', yourName:'Ваше имя', yourGender:'Ваш пол', prefer:'Вы предпочитаете испытания с игроками, которые', male:'мужчины', female:'женщины', nonbinary:'небинарные/другое', language:'Язык', join:'Войти', create:'Создать', or:'или', theme:'Тема', yourTurn:'Ваш ход', chooseDareModeTitle:'Выбрать испытание', chooseDareModeDesc:'Посмотреть, кто сделает его с вами', choosePlayerModeTitle:'Выбрать человека', choosePlayerModeDesc:'Посмотреть, какие испытания он сделает с вами', consentPlayers:'Нажмите игрока, чтобы изменить, какие испытания вы согласны делать с ним:', consentDares:'Нажмите испытание, чтобы изменить, с кем вы согласны его делать:', playerEditSummary:'{name} согласен на {count} испытаний. На какие испытания вы согласны с {name}?', playerEditSummaryOne:'{name} согласен на 1 испытание. На какие испытания вы согласны с {name}?', dareEditSummary:'{count} игроков согласны на «{dare}». С какими игроками вы согласны сделать это испытание?', dareEditSummaryOne:'1 игрок согласен на «{dare}». С какими игроками вы согласны сделать это испытание?', back:'Назад', save:'Сохранить', submit:'Отправить', sendNow:'Отправить сейчас', yesPlease:'Да', noThanks:'Нет, спасибо', pass:'Пас', weDidIt:'Мы сделали это', examples:'Вот несколько идей:', milder:'❄️ Показать мягче', spicier:'🌶️ Показать острее', ok:'OK', cancel:'Отмена' },
  ht: { ...I18N.en, tagline:'Èske ou ta jwe vire boutèy si li chwazi sèlman moun ki VLE bo youn lòt?', joinGame:'Antre nan jwèt', createGame:'Kreye jwèt', gameCode:'Kòd jwèt', setupProfile:'Mete pwofil ou', profileHelp:'Chwa sa yo ede ranpli konsantman an davans. Ou ka chanje detay yo nan jwèt la.', room:'Chanm', players:'Jwè yo', startGame:'Kòmanse jwèt', waitingForPlayers:'Ap tann omwen 3 jwè', yourName:'Non ou', yourGender:'Sèks ou', prefer:'Ou prefere fè defi ak jwè ki se', male:'gason', female:'fi', nonbinary:'nonbinè/lòt', language:'Lang', join:'Antre', create:'Kreye', or:'oswa', theme:'Tèm', yourTurn:'Se tou pa ou', chooseDareModeTitle:'Chwazi yon defi', chooseDareModeDesc:'Gade kiyès k ap fè li avè ou', choosePlayerModeTitle:'Chwazi yon moun', choosePlayerModeDesc:'Gade ki defi li ap fè avè ou', consentPlayers:'Klike sou yon jwè pou chanje ki defi ou dakò fè avè li:', consentDares:'Klike sou yon defi pou chanje ak ki jwè ou dakò fè li:', playerEditSummary:'{name} dakò ak {count} defi. Ki defi ou dakò fè ak {name}?', playerEditSummaryOne:'{name} dakò ak 1 defi. Ki defi ou dakò fè ak {name}?', dareEditSummary:'{count} jwè dakò ak "{dare}". Ak ki jwè ou dakò fè defi sa a?', dareEditSummaryOne:'1 jwè dakò ak "{dare}". Ak ki jwè ou dakò fè defi sa a?', back:'Retounen', save:'Sove', submit:'Voye', sendNow:'Voye kounye a', yesPlease:'Wi tanpri', noThanks:'Non mèsi', pass:'Pase', weDidIt:'Nou fè li', examples:'Men kèk lide:', milder:'❄️ Montre defi pi dou', spicier:'🌶️ Montre defi pi cho', ok:'OK', cancel:'Anile' },
  hi: { ...I18N.en, tagline:'क्या आप स्पिन-द-बॉटल खेलेंगे अगर यह केवल उन लोगों को चुने जो सच में एक-दूसरे को चूमना चाहते हैं?', joinGame:'गेम में शामिल हों', createGame:'गेम बनाएं', gameCode:'गेम कोड', setupProfile:'अपनी प्रोफाइल सेट करें', profileHelp:'ये विकल्प सहमति को पहले से भरने में मदद करते हैं। गेम में आने के बाद आप इन्हें बदल सकते हैं।', room:'कमरा', players:'खिलाड़ी', startGame:'गेम शुरू करें', waitingForPlayers:'कम से कम 3 खिलाड़ियों की प्रतीक्षा', yourName:'आपका नाम', yourGender:'आपका जेंडर', prefer:'आप इन खिलाड़ियों के साथ डेयर पसंद करते हैं', male:'पुरुष', female:'महिला', nonbinary:'नॉनबाइनरी/अन्य', language:'भाषा', join:'शामिल हों', create:'बनाएं', or:'या', theme:'थीम', yourTurn:'आपकी बारी है', chooseDareModeTitle:'डेयर चुनें', chooseDareModeDesc:'देखें कौन आपके साथ करेगा', choosePlayerModeTitle:'व्यक्ति चुनें', choosePlayerModeDesc:'देखें वे आपके साथ कौन से डेयर करेंगे', consentPlayers:'किस खिलाड़ी के साथ कौन से डेयर करने हैं, बदलने के लिए खिलाड़ी पर क्लिक करें:', consentDares:'किसके साथ यह डेयर करना है, बदलने के लिए डेयर पर क्लिक करें:', playerEditSummary:'{name} {count} डेयर के लिए सहमत है। आप {name} के साथ कौन से डेयर करना चाहते हैं?', playerEditSummaryOne:'{name} 1 डेयर के लिए सहमत है। आप {name} के साथ कौन से डेयर करना चाहते हैं?', dareEditSummary:'{count} खिलाड़ी "{dare}" के लिए सहमत हैं। आप यह डेयर किन खिलाड़ियों के साथ करना चाहते हैं?', dareEditSummaryOne:'1 खिलाड़ी "{dare}" के लिए सहमत है। आप यह डेयर किन खिलाड़ियों के साथ करना चाहते हैं?', back:'वापस', save:'सेव करें', submit:'भेजें', sendNow:'अभी भेजें', yesPlease:'हाँ', noThanks:'नहीं धन्यवाद', pass:'पास', weDidIt:'हमने कर लिया', examples:'कुछ आइडिया:', milder:'❄️ हल्के डेयर दिखाएं', spicier:'🌶️ ज़्यादा मसालेदार डेयर दिखाएं', ok:'ठीक है', cancel:'रद्द करें' },
  nl: { ...I18N.en, tagline:'Zou je flesje draaien spelen als het alleen mensen kiest die elkaar WILLEN kussen?', joinGame:'Meedoen', createGame:'Spel maken', gameCode:'Spelcode', setupProfile:'Stel je profiel in', profileHelp:'Deze keuzes vullen toestemming vooraf in. Je kunt details later wijzigen.', room:'Kamer', players:'Spelers', startGame:'Start spel', waitingForPlayers:'Wachten op minstens 3 spelers', yourName:'Je naam', yourGender:'Je gender', prefer:'Je doet liever opdrachten met spelers die zijn', male:'man', female:'vrouw', nonbinary:'non-binair/anders', language:'Taal', join:'Meedoen', create:'Maken', or:'of', theme:'Thema', yourTurn:'Jij bent aan de beurt', chooseDareModeTitle:'Kies een opdracht', chooseDareModeDesc:'Zie wie hem met jou wil doen', choosePlayerModeTitle:'Kies een persoon', choosePlayerModeDesc:'Zie welke opdrachten die met jou wil doen', consentPlayers:'Klik een speler om te bewerken welke opdrachten je met die persoon wilt doen:', consentDares:'Klik een opdracht om te bewerken met welke spelers je die wilt doen:', playerEditSummary:'{name} stemt in met {count} opdrachten. Met welke opdrachten stem jij in voor {name}?', playerEditSummaryOne:'{name} stemt in met 1 opdracht. Met welke opdrachten stem jij in voor {name}?', dareEditSummary:'{count} spelers stemmen in met "{dare}". Met welke spelers wil jij deze opdracht doen?', dareEditSummaryOne:'1 speler stemt in met "{dare}". Met welke spelers wil jij deze opdracht doen?', back:'Terug', save:'Opslaan', submit:'Verzenden', sendNow:'Nu verzenden', yesPlease:'Ja graag', noThanks:'Nee bedankt', pass:'Passen', weDidIt:'We hebben het gedaan', examples:'Hier zijn wat ideeën:', milder:'❄️ Mildere opdrachten tonen', spicier:'🌶️ Pittigere opdrachten tonen', ok:'OK', cancel:'Annuleren' },
  pl: { ...I18N.en, tagline:'Czy zagrasz w butelkę, jeśli wybiera tylko osoby, które CHCĄ się pocałować?', joinGame:'Dołącz do gry', createGame:'Utwórz grę', gameCode:'Kod gry', setupProfile:'Ustaw profil', profileHelp:'Te wybory wstępnie uzupełniają zgody. Możesz je później zmienić.', room:'Pokój', players:'Gracze', startGame:'Rozpocznij grę', waitingForPlayers:'Czekamy na co najmniej 3 graczy', yourName:'Twoje imię', yourGender:'Twoja płeć', prefer:'Wolisz wyzwania z graczami, którzy są', male:'mężczyzna', female:'kobieta', nonbinary:'niebinarna/inna', language:'Język', join:'Dołącz', create:'Utwórz', or:'albo', theme:'Motyw', yourTurn:'Twoja kolej', chooseDareModeTitle:'Wybierz wyzwanie', chooseDareModeDesc:'Zobacz, kto zrobi je z tobą', choosePlayerModeTitle:'Wybierz osobę', choosePlayerModeDesc:'Zobacz, jakie wyzwania zrobi z tobą', consentPlayers:'Kliknij gracza, aby zmienić, jakie wyzwania zgadzasz się robić z tą osobą:', consentDares:'Kliknij wyzwanie, aby zmienić, z kim zgadzasz się je zrobić:', playerEditSummary:'{name} zgadza się na {count} wyzwań. Na jakie wyzwania zgadzasz się z {name}?', playerEditSummaryOne:'{name} zgadza się na 1 wyzwanie. Na jakie wyzwania zgadzasz się z {name}?', dareEditSummary:'{count} graczy zgadza się na „{dare}”. Z którymi graczami zgadzasz się zrobić to wyzwanie?', dareEditSummaryOne:'1 gracz zgadza się na „{dare}”. Z którymi graczami zgadzasz się zrobić to wyzwanie?', back:'Wstecz', save:'Zapisz', submit:'Wyślij', sendNow:'Wyślij teraz', yesPlease:'Tak', noThanks:'Nie, dziękuję', pass:'Pas', weDidIt:'Zrobiliśmy to', examples:'Kilka pomysłów:', milder:'❄️ Pokaż łagodniejsze', spicier:'🌶️ Pokaż ostrzejsze', ok:'OK', cancel:'Anuluj' },
  it: { ...I18N.en, tagline:'Giocheresti al gioco della bottiglia se scegliesse solo persone che VOGLIONO baciarsi?', joinGame:'Unisciti al gioco', createGame:'Crea gioco', gameCode:'Codice gioco', setupProfile:'Configura il profilo', profileHelp:'Queste scelte precompilano il consenso. Puoi modificarle più tardi nel gioco.', room:'Stanza', players:'Giocatori', startGame:'Inizia gioco', waitingForPlayers:'In attesa di almeno 3 giocatori', yourName:'Il tuo nome', yourGender:'Il tuo genere', prefer:'Preferisci fare sfide con giocatori che sono', male:'uomo', female:'donna', nonbinary:'non binario/altro', language:'Lingua', join:'Entra', create:'Crea', or:'oppure', theme:'Tema', yourTurn:'È il tuo turno', chooseDareModeTitle:'Scegli una sfida', chooseDareModeDesc:'Vedi chi la farà con te', choosePlayerModeTitle:'Scegli una persona', choosePlayerModeDesc:'Vedi quali sfide farà con te', consentPlayers:'Tocca un giocatore per modificare quali sfide accetti di fare con quella persona:', consentDares:'Tocca una sfida per modificare con quali giocatori accetti di farla:', playerEditSummary:'{name} accetta {count} sfide. Quali sfide accetti di fare con {name}?', playerEditSummaryOne:'{name} accetta 1 sfida. Quali sfide accetti di fare con {name}?', dareEditSummary:'{count} giocatori accettano "{dare}". Con quali giocatori accetti di fare questa sfida?', dareEditSummaryOne:'1 giocatore accetta "{dare}". Con quali giocatori accetti di fare questa sfida?', back:'Indietro', save:'Salva', submit:'Invia', sendNow:'Invia ora', yesPlease:'Sì, volentieri', noThanks:'No grazie', pass:'Passa', weDidIt:'L’abbiamo fatto', examples:'Ecco alcune idee:', milder:'❄️ Mostra sfide più leggere', spicier:'🌶️ Mostra sfide più piccanti', ok:'OK', cancel:'Annulla' }
});

Object.entries({
  en:['Manage Player Consent', 'Manage Dare Consent'],
  es:['Gestionar consentimiento de jugadores', 'Gestionar consentimiento de retos'],
  pt:['Gerenciar consentimento de jogadores', 'Gerenciar consentimento de desafios'],
  zh:['管理玩家同意', '管理挑战同意'],
  tl:['Pamahalaan ang Consent ng Manlalaro', 'Pamahalaan ang Consent sa Dare'],
  vi:['Quản lý đồng ý của người chơi', 'Quản lý đồng ý thử thách'],
  ar:['إدارة موافقة اللاعبين', 'إدارة موافقة التحديات'],
  fr:['Gérer le consentement des joueurs', 'Gérer le consentement des défis'],
  ko:['플레이어 동의 관리', '도전 동의 관리'],
  ru:['Управление согласием игроков', 'Управление согласием на испытания'],
  ht:['Jere konsantman jwè yo', 'Jere konsantman defi yo'],
  hi:['खिलाड़ी सहमति प्रबंधित करें', 'डेयर सहमति प्रबंधित करें'],
  de:['Spielerzustimmung verwalten', 'Mutproben-Zustimmung verwalten'],
  nl:['Spelerstoestemming beheren', 'Opdrachttoestemming beheren'],
  pl:['Zarządzaj zgodą graczy', 'Zarządzaj zgodą na wyzwania'],
  it:['Gestisci consenso giocatori', 'Gestisci consenso sfide']
}).forEach(([code, [managePlayerConsent, manageDareConsent]]) => {
  I18N[code] ||= { ...I18N.en };
  Object.assign(I18N[code], { managePlayerConsent, manageDareConsent });
});

Object.entries({
  en:['Gather your most uninhibited friends to play the', 'free-to-print card game', 'or play online:'],
  es:['Reúne a tus amistades más desinhibidas para jugar el', 'juego de cartas para imprimir gratis', 'o jugar en línea:'],
  pt:['Junte seus amigos mais desinibidos para jogar o', 'jogo de cartas grátis para imprimir', 'ou jogar online:'],
  zh:['叫上你最放得开的朋友，一起来玩这款', '可免费下载打印的卡牌游戏', '或在线游玩：'],
  tl:['Tipunin ang pinaka-walang-prenong mga kaibigan mo para laruin ang', 'libreng mai-print na card game', 'o maglaro online:'],
  vi:['Rủ những người bạn táo bạo nhất của bạn để chơi', 'trò chơi thẻ bài in miễn phí', 'hoặc chơi trực tuyến:'],
  ar:['اجمع أكثر أصدقائك تحررا للعب', 'لعبة البطاقات المجانية القابلة للطباعة', 'أو العب عبر الإنترنت:'],
  fr:['Rassemble tes amis les plus décomplexés pour jouer au', 'jeu de cartes à imprimer gratuitement', 'ou jouer en ligne :'],
  ko:['가장 거리낌 없는 친구들을 모아', '무료로 인쇄할 수 있는 카드 게임', '을 하거나 온라인으로 플레이하세요:'],
  ru:['Соберите самых раскрепощённых друзей, чтобы сыграть в', 'бесплатную карточную игру для печати', 'или играть онлайн:'],
  ht:['Rasanble zanmi ou ki pi san wont pou jwe', 'jwèt kat gratis pou enprime a', 'oswa jwe sou entènèt:'],
  hi:['अपने सबसे बेफिक्र दोस्तों को इकट्ठा करें और खेलें', 'मुफ्त प्रिंट-करने-योग्य कार्ड गेम', 'या ऑनलाइन खेलें:'],
  de:['Hol dir deine ungehemmtesten Freunde dazu, das', 'kostenlos ausdruckbare Kartenspiel', 'zu spielen oder online zu spielen:'],
  nl:['Verzamel je meest ongeremde vrienden om het', 'gratis uit te printen kaartspel', 'te spelen of online te spelen:'],
  pl:['Zbierz swoich najbardziej bez zahamowań znajomych, aby zagrać w', 'darmową grę karcianą do wydrukowania', 'lub zagrać online:'],
  it:['Riunisci i tuoi amici più disinibiti per giocare al', 'gioco di carte gratuito da stampare', 'o giocare online:']
}).forEach(([code, [splashBlurbLead, freePrintCardGame, splashBlurbTail]]) => {
  I18N[code] ||= { ...I18N.en };
  Object.assign(I18N[code], { splashBlurbLead, freePrintCardGame, splashBlurbTail });
});

Object.entries({
  es:{
    zoom:'Acercar',
    horizontal:'Horizontal',
    vertical:'Vertical',
    performDareTitle:'Es hora de hacer un reto',
    performDareWith:'Es hora de hacer un reto con {name}',
    waitingConsentSetup:'Esperando a que {names} configuren el consentimiento',
    ok:'Aceptar'
  },
  pt:{
    zoom:'Aproximar',
    horizontal:'Horizontal',
    vertical:'Vertical',
    performDareTitle:'É hora de cumprir um desafio',
    performDareWith:'É hora de cumprir um desafio com {name}',
    waitingConsentSetup:'Aguardando {names} configurarem o consentimento',
    ok:'OK'
  },
  zh:{
    english:'英语',
    spanish:'西班牙语',
    portuguese:'葡萄牙语',
    adjustSelfie:'调整自拍',
    selfieHelp:'移动并缩放照片，让你的脸位于中央。',
    usePhoto:'使用照片',
    zoom:'缩放',
    horizontal:'水平',
    vertical:'垂直',
    chooseDareMode:'选择一个挑战，看看谁会和你一起做',
    choosePlayerMode:'选择一个人，看看对方愿意和你做哪些挑战',
    performDareTitle:'该去完成一个挑战了',
    performDareWith:'该和{name}一起完成一个挑战了',
    waitingConsentSetup:'等待{names}完成同意设置'
  },
  tl:{
    english:'Ingles',
    spanish:'Espanyol',
    portuguese:'Portuges',
    adjustSelfie:'Ayusin ang iyong selfie',
    selfieHelp:'Igalaw at i-zoom ang larawan para nakagitna ang mukha mo.',
    usePhoto:'Gamitin ang Larawan',
    zoom:'Zoom',
    horizontal:'Pahalang',
    vertical:'Patayo',
    chooseDareMode:'Pumili ng dare at tingnan kung sino ang gagawa nito kasama mo',
    choosePlayerMode:'Pumili ng tao at tingnan kung aling mga dare ang gagawin nila kasama mo',
    performDareTitle:'Panahon na para gumawa ng dare',
    performDareWith:'Panahon na para gumawa ng dare kasama si {name}',
    waitingConsentSetup:'Naghihintay kina {names} na mag-set up ng consent',
    onboardingDareTitle:'Dare #{number}: {dare}',
    ok:'Sige'
  },
  vi:{
    english:'Tiếng Anh',
    spanish:'Tiếng Tây Ban Nha',
    portuguese:'Tiếng Bồ Đào Nha',
    adjustSelfie:'Chỉnh ảnh selfie',
    selfieHelp:'Di chuyển và phóng to ảnh để khuôn mặt bạn nằm giữa.',
    usePhoto:'Dùng ảnh này',
    zoom:'Thu phóng',
    horizontal:'Ngang',
    vertical:'Dọc',
    chooseDareMode:'Chọn một thử thách và xem ai sẽ làm cùng bạn',
    choosePlayerMode:'Chọn một người và xem họ sẽ làm những thử thách nào với bạn',
    performDareTitle:'Đến lúc thực hiện thử thách',
    performDareWith:'Đến lúc thực hiện thử thách với {name}',
    waitingConsentSetup:'Đang chờ {names} thiết lập đồng ý',
    ok:'Đồng ý'
  },
  fr:{
    english:'Anglais',
    spanish:'Espagnol',
    portuguese:'Portugais',
    adjustSelfie:'Ajuste ton selfie',
    selfieHelp:'Déplace et zoome la photo pour centrer ton visage.',
    usePhoto:'Utiliser la photo',
    zoom:'Zoom',
    horizontal:'Horizontal',
    vertical:'Vertical',
    chooseDareMode:'Choisis un défi et vois qui le fera avec toi',
    choosePlayerMode:'Choisis une personne et vois quels défis elle fera avec toi',
    performDareTitle:'C’est le moment de faire un défi',
    performDareWith:'C’est le moment de faire un défi avec {name}',
    waitingConsentSetup:'En attente que {names} configurent leur consentement',
    ok:'D’accord'
  },
  de:{
    english:'Englisch',
    spanish:'Spanisch',
    portuguese:'Portugiesisch',
    adjustSelfie:'Passe dein Selfie an',
    selfieHelp:'Verschiebe und vergrößere das Foto, damit dein Gesicht zentriert ist.',
    usePhoto:'Foto verwenden',
    zoom:'Zoom',
    horizontal:'Horizontal',
    vertical:'Vertikal',
    chooseDareMode:'Wähle eine Mutprobe und sieh, wer sie mit dir macht',
    choosePlayerMode:'Wähle eine Person und sieh, welche Mutproben sie mit dir macht',
    performDareTitle:'Zeit für eine Mutprobe',
    performDareWith:'Zeit für eine Mutprobe mit {name}',
    waitingConsentSetup:'Warte darauf, dass {names} ihre Zustimmung festlegen',
    ok:'OK'
  },
  ar:{
    joinHost:'انضم إلى لعبة {name}',
    resumeGame:'استئناف اللعبة',
    english:'الإنجليزية',
    spanish:'الإسبانية',
    portuguese:'البرتغالية',
    changeName:'غيّر الاسم',
    chooseColor:'اختر لونك',
    useSelfie:'استخدم صورة سيلفي',
    adjustSelfie:'اضبط صورة السيلفي',
    selfieHelp:'حرّك الصورة وكبّرها حتى يصبح وجهك في المنتصف.',
    usePhoto:'استخدم الصورة',
    zoom:'تكبير',
    horizontal:'أفقي',
    vertical:'عمودي',
    addPlayers:'أضف لاعبين',
    leaveGame:'غادر اللعبة',
    share:'شارك هذا الرابط',
    chooseDareMode:'اختر تحديا واعرف من سيفعله معك',
    choosePlayerMode:'اختر شخصا واعرف ما التحديات التي سيفعلها معك',
    chooseDare:'اختر تحديا',
    choosePlayer:'اختر لاعبا',
    waitingChoose:'بانتظار {name} ليختار',
    waitingRespond:'بانتظار رد {name}',
    waitingResponsesTitle:'بانتظار الردود',
    waitingOn:'بانتظار',
    collectingResponses:'جارٍ جمع الردود',
    waitingPerform:'بانتظار {a} و{b} لتنفيذ: {dare}',
    performDareTitle:'حان وقت تنفيذ تحد',
    performDareWith:'حان وقت تنفيذ تحد مع {name}',
    waitingAdd:'بانتظار {name} لإضافة تحد جديد',
    waitingConsentSetup:'بانتظار {names} لإعداد الموافقات',
    consentCount:'يوافق على {count} تحديات',
    dareCount:'{count} لاعبين يوافقون',
    oneDare:'يوافق على تحد واحد',
    onePlayer:'لاعب واحد يوافق',
    sendingIn:'سيتم الإرسال خلال {seconds}',
    selectedDare:'اختار {name} "{dare}"',
    chosenYou:'اختارك {name} لتحد! أنت توافق على:',
    activeOptionsPlayers:'اختر من سيقوم بهذا التحدي معك، أو تجاوز',
    activeOptionsDares:'اختر أي تحد ستقوم به مع {name}، أو تجاوز',
    noOptions:'لا توجد تطابقات حاليا. يمكنك التجاوز.',
    areYouSure:'سبق أن قلت إنك لا تريد هذا التحدي مع هذا الشخص. هل تريد المتابعة؟',
    addDareTitle:'يمكنك كتابة تحد جديد',
    newDare:'تحد جديد',
    addToMenu:'أضف إلى القائمة',
    onboardingTitle:'حدد تفضيلات التحديات',
    onboardingDareTitle:'التحدي #{number}: {dare}',
    onboardingHelp:'أنت توافق على هذا التحدي مع:',
    joinedTitle:'انضم {name}!',
    joinedHelp:'اختر التحديات التي توافق على القيام بها مع هذا اللاعب.',
    newDareTitle:'تمت إضافة تحد جديد',
    newDareHelp:'أنت توافق على هذا التحدي مع:',
    mature:'محتوى للبالغين',
    matureBody:'هذه اللعبة مخصصة للبالغين بعمر 18 سنة أو أكثر.',
    adult:'عمري 18+',
    under:'أنا أصغر من ذلك',
    loading:'جارٍ التحميل',
    uploadFailed:'فشل رفع صورة السيلفي. جرّب صورة بصيغة JPG أو PNG أو WebP أو HEIC.'
  },
  ko:{
    joinHost:'{name}님의 게임에 참여',
    resumeGame:'게임 계속하기',
    english:'영어',
    spanish:'스페인어',
    portuguese:'포르투갈어',
    changeName:'이름 변경',
    chooseColor:'색상 선택',
    useSelfie:'셀피 사용',
    adjustSelfie:'셀피 조정',
    selfieHelp:'얼굴이 가운데 오도록 사진을 움직이고 확대하세요.',
    usePhoto:'이 사진 사용',
    zoom:'확대',
    horizontal:'가로',
    vertical:'세로',
    addPlayers:'플레이어 추가',
    leaveGame:'게임 나가기',
    share:'이 링크 공유',
    chooseDareMode:'도전을 고르고 누가 함께할지 확인하세요',
    choosePlayerMode:'사람을 고르고 그 사람이 어떤 도전을 함께할지 확인하세요',
    chooseDare:'도전 고르기',
    choosePlayer:'플레이어 고르기',
    waitingChoose:'{name}님이 고르는 중',
    waitingRespond:'{name}님의 응답을 기다리는 중',
    waitingResponsesTitle:'응답을 기다리는 중',
    waitingOn:'기다리는 중',
    collectingResponses:'응답 수집 중',
    waitingPerform:'{a}님과 {b}님이 다음을 수행하는 중: {dare}',
    performDareTitle:'이제 도전을 할 시간입니다',
    performDareWith:'이제 {name}님과 도전을 할 시간입니다',
    waitingAdd:'{name}님이 새 도전을 추가하는 중',
    waitingConsentSetup:'{names}님이 동의를 설정하는 중',
    consentCount:'{count}개 도전에 동의함',
    dareCount:'{count}명의 플레이어가 동의함',
    oneDare:'1개 도전에 동의함',
    onePlayer:'1명의 플레이어가 동의함',
    sendingIn:'{seconds}초 후 전송',
    selectedDare:'{name}님이 "{dare}"을(를) 선택했습니다',
    chosenYou:'{name}님이 당신을 도전에 선택했습니다! 다음에 동의하나요:',
    activeOptionsPlayers:'이 도전을 누구와 할지 고르거나 패스하세요',
    activeOptionsDares:'{name}님과 어떤 도전을 할지 고르거나 패스하세요',
    noOptions:'현재 가능한 조합이 없습니다. 패스할 수 있습니다.',
    areYouSure:'이전에 이 사람과 이 도전을 원하지 않는다고 했습니다. 계속할까요?',
    addDareTitle:'새 도전을 작성할 수 있습니다',
    newDare:'새 도전',
    addToMenu:'메뉴에 추가',
    onboardingTitle:'도전 선호 설정',
    onboardingDareTitle:'도전 #{number}: {dare}',
    onboardingHelp:'다음 사람들과 이 도전에 동의합니다:',
    joinedTitle:'{name}님이 참가했습니다!',
    joinedHelp:'이 플레이어와 어떤 도전을 할지 고르세요.',
    newDareTitle:'새 도전이 추가되었습니다',
    newDareHelp:'다음 사람들과 이 도전에 동의합니다:',
    mature:'성인용 콘텐츠',
    matureBody:'이 게임은 18세 이상 성인용입니다.',
    adult:'저는 18세 이상입니다',
    under:'저는 너무 어립니다',
    loading:'불러오는 중',
    uploadFailed:'셀피 업로드에 실패했습니다. JPG, PNG, WebP 또는 HEIC 사진을 사용해 주세요.'
  },
  ru:{
    joinHost:'Присоединиться к игре {name}',
    resumeGame:'Продолжить игру',
    english:'Английский',
    spanish:'Испанский',
    portuguese:'Португальский',
    changeName:'Изменить имя',
    chooseColor:'Выберите цвет',
    useSelfie:'Использовать селфи',
    adjustSelfie:'Настройте селфи',
    selfieHelp:'Переместите и увеличьте фото так, чтобы лицо было по центру.',
    usePhoto:'Использовать фото',
    zoom:'Масштаб',
    horizontal:'По горизонтали',
    vertical:'По вертикали',
    addPlayers:'Добавить игроков',
    leaveGame:'Выйти из игры',
    share:'Поделиться ссылкой',
    chooseDareMode:'Выберите испытание и посмотрите, кто сделает его с вами',
    choosePlayerMode:'Выберите человека и посмотрите, какие испытания он сделает с вами',
    chooseDare:'Выбрать испытание',
    choosePlayer:'Выбрать игрока',
    waitingChoose:'Ждём, пока {name} выберет',
    waitingRespond:'Ждём ответа от {name}',
    waitingResponsesTitle:'Ждём ответов',
    waitingOn:'Ждём',
    collectingResponses:'Собираем ответы',
    waitingPerform:'Ждём, пока {a} и {b} выполнят: {dare}',
    performDareTitle:'Пора выполнить испытание',
    performDareWith:'Пора выполнить испытание с {name}',
    waitingAdd:'Ждём, пока {name} добавит новое испытание',
    waitingConsentSetup:'Ждём, пока {names} настроят согласие',
    consentCount:'согласен на {count} испытаний',
    dareCount:'{count} игроков согласны',
    oneDare:'согласен на 1 испытание',
    onePlayer:'1 игрок согласен',
    sendingIn:'Отправка через {seconds}',
    selectedDare:'{name} выбрал(а) "{dare}"',
    chosenYou:'{name} выбрал(а) вас для испытания! Вы согласны на:',
    activeOptionsPlayers:'Выберите, с кем выполнить это испытание, или пасуйте',
    activeOptionsDares:'Выберите, какое испытание выполнить с {name}, или пасуйте',
    noOptions:'Сейчас нет совпадений. Можно пасовать.',
    areYouSure:'Раньше вы говорили, что не хотите это испытание с этим человеком. Продолжить?',
    addDareTitle:'Теперь вы можете написать новое испытание',
    newDare:'Новое испытание',
    addToMenu:'Добавить в список',
    onboardingTitle:'Настройте предпочтения по испытаниям',
    onboardingDareTitle:'Испытание #{number}: {dare}',
    onboardingHelp:'Вы согласны на это испытание с:',
    joinedTitle:'{name} присоединился(-ась)!',
    joinedHelp:'Выберите, на какие испытания вы согласны с этим игроком.',
    newDareTitle:'Добавлено новое испытание',
    newDareHelp:'Вы согласны на это испытание с:',
    mature:'Контент для взрослых',
    matureBody:'Эта игра предназначена только для взрослых 18 лет и старше.',
    adult:'Мне 18+',
    under:'Я слишком молод(а)',
    ok:'ОК',
    loading:'Загрузка',
    uploadFailed:'Не удалось загрузить селфи. Попробуйте фото JPG, PNG, WebP или HEIC.'
  },
  ht:{
    joinHost:'Antre nan jwèt {name}',
    resumeGame:'Reprann jwèt la',
    english:'Angle',
    spanish:'Panyòl',
    portuguese:'Pòtigè',
    changeName:'Chanje non',
    chooseColor:'Chwazi koulè ou',
    useSelfie:'Sèvi ak selfie',
    adjustSelfie:'Ajiste selfie ou',
    selfieHelp:'Deplase epi agrandi foto a pou figi ou rete nan mitan.',
    usePhoto:'Sèvi ak foto a',
    zoom:'Zoom',
    horizontal:'Orizontal',
    vertical:'Vètikal',
    addPlayers:'Ajoute jwè',
    leaveGame:'Kite jwèt la',
    share:'Pataje lyen sa a',
    chooseDareMode:'Chwazi yon defi epi gade kiyès ki pral fè li avè ou',
    choosePlayerMode:'Chwazi yon moun epi gade ki defi yo pral fè avè ou',
    chooseDare:'Chwazi yon defi',
    choosePlayer:'Chwazi yon jwè',
    waitingChoose:'Ap tann {name} pou chwazi',
    waitingRespond:'Ap tann repons {name}',
    waitingResponsesTitle:'Ap tann repons yo',
    waitingOn:'Ap tann',
    collectingResponses:'Ap ranmase repons yo',
    waitingPerform:'Ap tann {a} ak {b} fè: {dare}',
    performDareTitle:'Lè pou fè yon defi',
    performDareWith:'Lè pou fè yon defi ak {name}',
    waitingAdd:'Ap tann {name} ajoute yon nouvo defi',
    waitingConsentSetup:'Ap tann {names} mete konsantman yo',
    consentCount:'dakò ak {count} defi',
    dareCount:'{count} jwè dakò',
    oneDare:'dakò ak 1 defi',
    onePlayer:'1 jwè dakò',
    sendingIn:'Ap voye nan {seconds}',
    selectedDare:'{name} chwazi "{dare}"',
    chosenYou:'{name} chwazi ou pou yon defi! Ou dakò ak:',
    activeOptionsPlayers:'Chwazi kiyès pou fè defi sa a avè ou, oswa pase',
    activeOptionsDares:'Chwazi ki defi pou fè ak {name}, oswa pase',
    noOptions:'Pa gen okenn matche kounye a. Ou ka pase.',
    areYouSure:'Ou te deja di ou pa t vle defi sa a ak moun sa a. Kontinye?',
    addDareTitle:'Ou ka ekri yon nouvo defi',
    newDare:'Nouvo defi',
    addToMenu:'Ajoute nan meni an',
    onboardingTitle:'Mete preferans defi ou yo',
    onboardingDareTitle:'Defi #{number}: {dare}',
    onboardingHelp:'Ou dakò ak defi sa a ak:',
    joinedTitle:'{name} antre!',
    joinedHelp:'Chwazi ki defi ou dakò fè ak jwè sa a.',
    newDareTitle:'Yo ajoute yon nouvo defi',
    newDareHelp:'Ou dakò ak defi sa a ak:',
    mature:'Kontni granmoun',
    matureBody:'Jwèt sa a fèt pou granmoun 18 an oswa plis.',
    adult:'Mwen gen 18+',
    under:'Mwen twò jèn',
    ok:'Dakò',
    loading:'Ap chaje',
    uploadFailed:'Telechajman selfie a echwe. Eseye yon foto JPG, PNG, WebP oswa HEIC.'
  },
  hi:{
    joinHost:'{name} के गेम में शामिल हों',
    resumeGame:'गेम जारी रखें',
    english:'अंग्रेज़ी',
    spanish:'स्पेनिश',
    portuguese:'पुर्तगाली',
    changeName:'नाम बदलें',
    chooseColor:'अपना रंग चुनें',
    useSelfie:'सेल्फी इस्तेमाल करें',
    adjustSelfie:'अपनी सेल्फी ठीक करें',
    selfieHelp:'फोटो को खिसकाएँ और ज़ूम करें ताकि आपका चेहरा बीच में रहे.',
    usePhoto:'फोटो इस्तेमाल करें',
    zoom:'ज़ूम',
    horizontal:'क्षैतिज',
    vertical:'लंबवत',
    addPlayers:'खिलाड़ी जोड़ें',
    leaveGame:'गेम छोड़ें',
    share:'यह लिंक साझा करें',
    chooseDareMode:'कोई डेयर चुनें और देखें कौन इसे आपके साथ करेगा',
    choosePlayerMode:'किसी व्यक्ति को चुनें और देखें वे आपके साथ कौन से डेयर करेंगे',
    chooseDare:'डेयर चुनें',
    choosePlayer:'खिलाड़ी चुनें',
    waitingChoose:'{name} के चुनने की प्रतीक्षा',
    waitingRespond:'{name} के जवाब की प्रतीक्षा',
    waitingResponsesTitle:'जवाबों की प्रतीक्षा',
    waitingOn:'प्रतीक्षा में',
    collectingResponses:'जवाब इकट्ठा किए जा रहे हैं',
    waitingPerform:'{a} और {b} के यह करने की प्रतीक्षा: {dare}',
    performDareTitle:'अब डेयर करने का समय है',
    performDareWith:'अब {name} के साथ डेयर करने का समय है',
    waitingAdd:'{name} के नया डेयर जोड़ने की प्रतीक्षा',
    waitingConsentSetup:'{names} के सहमति सेट करने की प्रतीक्षा',
    consentCount:'{count} डेयर के लिए सहमत',
    dareCount:'{count} खिलाड़ी सहमत हैं',
    oneDare:'1 डेयर के लिए सहमत',
    onePlayer:'1 खिलाड़ी सहमत है',
    sendingIn:'{seconds} में भेजा जाएगा',
    selectedDare:'{name} ने "{dare}" चुना है',
    chosenYou:'{name} ने आपको डेयर के लिए चुना! आप इन पर सहमत हैं:',
    activeOptionsPlayers:'चुनें यह डेयर किसके साथ करना है, या पास करें',
    activeOptionsDares:'चुनें {name} के साथ कौन सा डेयर करना है, या पास करें',
    noOptions:'अभी कोई मेल नहीं है. आप पास कर सकते हैं.',
    areYouSure:'आपने पहले कहा था कि आप इस व्यक्ति के साथ यह डेयर नहीं चाहते. जारी रखें?',
    addDareTitle:'अब आप नया डेयर लिख सकते हैं',
    newDare:'नया डेयर',
    addToMenu:'मेन्यू में जोड़ें',
    onboardingTitle:'अपनी डेयर पसंद सेट करें',
    onboardingDareTitle:'डेयर #{number}: {dare}',
    onboardingHelp:'आप इस डेयर के लिए इनके साथ सहमत हैं:',
    joinedTitle:'{name} जुड़ गया/गई!',
    joinedHelp:'चुनें आप इस खिलाड़ी के साथ कौन से डेयर करने के लिए सहमत हैं.',
    newDareTitle:'नया डेयर जोड़ा गया है',
    newDareHelp:'आप इस डेयर के लिए इनके साथ सहमत हैं:',
    mature:'वयस्क सामग्री',
    matureBody:'यह गेम 18 वर्ष या उससे अधिक उम्र के वयस्कों के लिए है.',
    adult:'मैं 18+ हूँ',
    under:'मैं बहुत छोटा/छोटी हूँ',
    loading:'लोड हो रहा है',
    uploadFailed:'सेल्फी अपलोड विफल रहा. कृपया JPG, PNG, WebP, या HEIC फोटो आज़माएँ.'
  },
  nl:{
    joinHost:'Word lid van het spel van {name}',
    resumeGame:'Spel hervatten',
    english:'Engels',
    spanish:'Spaans',
    portuguese:'Portugees',
    changeName:'Naam wijzigen',
    chooseColor:'Kies je kleur',
    useSelfie:'Selfie gebruiken',
    adjustSelfie:'Pas je selfie aan',
    selfieHelp:'Verplaats en zoom de foto zodat je gezicht in het midden staat.',
    usePhoto:'Foto gebruiken',
    zoom:'Zoomen',
    horizontal:'Horizontaal',
    vertical:'Verticaal',
    addPlayers:'Spelers toevoegen',
    leaveGame:'Spel verlaten',
    share:'Deel deze link',
    chooseDareMode:'Kies een opdracht en zie wie hem met je doet',
    choosePlayerMode:'Kies een persoon en zie welke opdrachten die met je doet',
    chooseDare:'Kies een opdracht',
    choosePlayer:'Kies een speler',
    waitingChoose:'Wachten tot {name} kiest',
    waitingRespond:'Wachten op antwoord van {name}',
    waitingResponsesTitle:'Wachten op reacties',
    waitingOn:'Wachten op',
    collectingResponses:'Reacties verzamelen',
    waitingPerform:'Wachten tot {a} en {b} dit doen: {dare}',
    performDareTitle:'Tijd om een opdracht te doen',
    performDareWith:'Tijd om een opdracht te doen met {name}',
    waitingAdd:'Wachten tot {name} een nieuwe opdracht toevoegt',
    waitingConsentSetup:'Wachten tot {names} toestemming instellen',
    consentCount:'stemt in met {count} opdrachten',
    dareCount:'{count} spelers stemmen in',
    oneDare:'stemt in met 1 opdracht',
    onePlayer:'1 speler stemt in',
    sendingIn:'Verzenden over {seconds}',
    selectedDare:'{name} heeft "{dare}" gekozen',
    chosenYou:'{name} koos jou voor een opdracht! Je stemt in met:',
    activeOptionsPlayers:'Kies met wie je deze opdracht doet, of pas',
    activeOptionsDares:'Kies welke opdracht je met {name} doet, of pas',
    noOptions:'Er zijn nu geen matches. Je kunt passen.',
    areYouSure:'Je zei eerder dat je deze opdracht niet met deze persoon wilde. Doorgaan?',
    addDareTitle:'Je mag een nieuwe opdracht schrijven',
    newDare:'Nieuwe opdracht',
    addToMenu:'Aan menu toevoegen',
    onboardingTitle:'Stel je voorkeuren voor opdrachten in',
    onboardingDareTitle:'Opdracht #{number}: {dare}',
    onboardingHelp:'Je stemt in met deze opdracht met:',
    joinedTitle:'{name} is aangesloten!',
    joinedHelp:'Kies welke opdrachten je met deze speler wilt doen.',
    newDareTitle:'Er is een nieuwe opdracht toegevoegd',
    newDareHelp:'Je stemt in met deze opdracht met:',
    mature:'Volwassen inhoud',
    matureBody:'Dit spel is bedoeld voor volwassenen van 18 jaar en ouder.',
    adult:'Ik ben 18+',
    under:'Ik ben te jong',
    ok:'OK',
    loading:'Laden',
    uploadFailed:'Selfie uploaden mislukt. Probeer een JPG-, PNG-, WebP- of HEIC-foto.'
  },
  pl:{
    joinHost:'Dołącz do gry {name}',
    resumeGame:'Wznów grę',
    english:'Angielski',
    spanish:'Hiszpański',
    portuguese:'Portugalski',
    changeName:'Zmień imię',
    chooseColor:'Wybierz kolor',
    useSelfie:'Użyj selfie',
    adjustSelfie:'Dopasuj selfie',
    selfieHelp:'Przesuń i przybliż zdjęcie, aby twarz była na środku.',
    usePhoto:'Użyj zdjęcia',
    zoom:'Powiększenie',
    horizontal:'Poziomo',
    vertical:'Pionowo',
    addPlayers:'Dodaj graczy',
    leaveGame:'Opuść grę',
    share:'Udostępnij ten link',
    chooseDareMode:'Wybierz wyzwanie i zobacz, kto zrobi je z tobą',
    choosePlayerMode:'Wybierz osobę i zobacz, jakie wyzwania zrobi z tobą',
    chooseDare:'Wybierz wyzwanie',
    choosePlayer:'Wybierz gracza',
    waitingChoose:'Czekamy, aż {name} wybierze',
    waitingRespond:'Czekamy na odpowiedź od {name}',
    waitingResponsesTitle:'Czekamy na odpowiedzi',
    waitingOn:'Czekamy na',
    collectingResponses:'Zbieranie odpowiedzi',
    waitingPerform:'Czekamy, aż {a} i {b} zrobią: {dare}',
    performDareTitle:'Czas zrobić wyzwanie',
    performDareWith:'Czas zrobić wyzwanie z {name}',
    waitingAdd:'Czekamy, aż {name} doda nowe wyzwanie',
    waitingConsentSetup:'Czekamy, aż {names} ustawią zgodę',
    consentCount:'zgadza się na {count} wyzwań',
    dareCount:'{count} graczy się zgadza',
    oneDare:'zgadza się na 1 wyzwanie',
    onePlayer:'1 gracz się zgadza',
    sendingIn:'Wysyłanie za {seconds}',
    selectedDare:'{name} wybrał(a) "{dare}"',
    chosenYou:'{name} wybrał(a) cię do wyzwania! Zgadzasz się na:',
    activeOptionsPlayers:'Wybierz, z kim zrobić to wyzwanie, albo spasuj',
    activeOptionsDares:'Wybierz, jakie wyzwanie zrobić z {name}, albo spasuj',
    noOptions:'Brak aktualnych dopasowań. Możesz spasować.',
    areYouSure:'Wcześniej było powiedziane, że nie chcesz tego wyzwania z tą osobą. Kontynuować?',
    addDareTitle:'Możesz napisać nowe wyzwanie',
    newDare:'Nowe wyzwanie',
    addToMenu:'Dodaj do menu',
    onboardingTitle:'Ustaw preferencje wyzwań',
    onboardingDareTitle:'Wyzwanie #{number}: {dare}',
    onboardingHelp:'Zgadzasz się na to wyzwanie z:',
    joinedTitle:'{name} dołączył(a)!',
    joinedHelp:'Wybierz, na które wyzwania zgadzasz się z tym graczem.',
    newDareTitle:'Dodano nowe wyzwanie',
    newDareHelp:'Zgadzasz się na to wyzwanie z:',
    mature:'Treści dla dorosłych',
    matureBody:'Ta gra jest przeznaczona dla dorosłych w wieku 18 lat lub starszych.',
    adult:'Mam 18+',
    under:'Jestem za młody/za młoda',
    ok:'OK',
    loading:'Ładowanie',
    uploadFailed:'Przesyłanie selfie nie powiodło się. Spróbuj zdjęcia JPG, PNG, WebP lub HEIC.'
  },
  it:{
    joinHost:'Unisciti alla partita di {name}',
    resumeGame:'Riprendi la partita',
    english:'Inglese',
    spanish:'Spagnolo',
    portuguese:'Portoghese',
    changeName:'Cambia nome',
    chooseColor:'Scegli il tuo colore',
    useSelfie:'Usa selfie',
    adjustSelfie:'Regola il selfie',
    selfieHelp:'Sposta e ingrandisci la foto in modo che il tuo viso sia al centro.',
    usePhoto:'Usa foto',
    zoom:'Zoom',
    horizontal:'Orizzontale',
    vertical:'Verticale',
    addPlayers:'Aggiungi giocatori',
    leaveGame:'Lascia la partita',
    share:'Condividi questo link',
    chooseDareMode:'Scegli una sfida e vedi chi la farà con te',
    choosePlayerMode:'Scegli una persona e vedi quali sfide farà con te',
    chooseDare:'Scegli una sfida',
    choosePlayer:'Scegli un giocatore',
    waitingChoose:'In attesa che {name} scelga',
    waitingRespond:'In attesa della risposta di {name}',
    waitingResponsesTitle:'In attesa delle risposte',
    waitingOn:'In attesa di',
    collectingResponses:'Raccolta risposte',
    waitingPerform:'In attesa che {a} e {b} facciano: {dare}',
    performDareTitle:'È il momento di fare una sfida',
    performDareWith:'È il momento di fare una sfida con {name}',
    waitingAdd:'In attesa che {name} aggiunga una nuova sfida',
    waitingConsentSetup:'In attesa che {names} configurino il consenso',
    consentCount:'accetta {count} sfide',
    dareCount:'{count} giocatori accettano',
    oneDare:'accetta 1 sfida',
    onePlayer:'1 giocatore accetta',
    sendingIn:'Invio tra {seconds}',
    selectedDare:'{name} ha scelto "{dare}"',
    chosenYou:'{name} ha scelto te per una sfida! Accetti:',
    activeOptionsPlayers:'Scegli con chi fare questa sfida, oppure passa',
    activeOptionsDares:'Scegli quale sfida fare con {name}, oppure passa',
    noOptions:'Al momento non ci sono abbinamenti. Puoi passare.',
    areYouSure:'Avevi detto che non volevi questa sfida con questa persona. Continuare?',
    addDareTitle:'Puoi scrivere una nuova sfida',
    newDare:'Nuova sfida',
    addToMenu:'Aggiungi al menu',
    onboardingTitle:'Imposta le tue preferenze per le sfide',
    onboardingDareTitle:'Sfida #{number}: {dare}',
    onboardingHelp:'Accetti questa sfida con:',
    joinedTitle:'{name} si è unito/a!',
    joinedHelp:'Scegli quali sfide accetti di fare con questo giocatore.',
    newDareTitle:'È stata aggiunta una nuova sfida',
    newDareHelp:'Accetti questa sfida con:',
    mature:'Contenuti per adulti',
    matureBody:'Questo gioco è destinato ad adulti dai 18 anni in su.',
    adult:'Ho 18+',
    under:'Sono troppo giovane',
    ok:'OK',
    loading:'Caricamento',
    uploadFailed:'Caricamento selfie non riuscito. Prova con una foto JPG, PNG, WebP o HEIC.'
  }
}).forEach(([code, overrides]) => {
  I18N[code] ||= { ...I18N.en };
  Object.assign(I18N[code], overrides);
});

const THEME_NAME_I18N = {
  en:{ Awkward:'Awkward', Creative:'Creative', Cuddly:'Cuddly', Daring:'Daring', Disgusting:'Disgusting', Exhausting:'Exhausting', Humiliating:'Humiliating', Inedible:'Inedible', Intimate:'Intimate', Juvenile:'Juvenile', Kinky:'Kinky', Messy:'Messy', Risky:'Risky', Sensual:'Sensual', Wacky:'Wacky' },
  es:{ Awkward:'Incómodo', Creative:'Creativo', Cuddly:'Cariñoso', Daring:'Atrevido', Disgusting:'Asqueroso', Exhausting:'Agotador', Humiliating:'Humillante', Inedible:'Incomible', Intimate:'Íntimo', Juvenile:'Juvenil', Kinky:'Kinky', Messy:'Desordenado', Risky:'Arriesgado', Sensual:'Sensual', Wacky:'Alocado' },
  pt:{ Awkward:'Constrangedor', Creative:'Criativo', Cuddly:'Carinhoso', Daring:'Ousado', Disgusting:'Nojento', Exhausting:'Cansativo', Humiliating:'Humilhante', Inedible:'Intragável', Intimate:'Íntimo', Juvenile:'Juvenil', Kinky:'Kinky', Messy:'Bagunçado', Risky:'Arriscado', Sensual:'Sensual', Wacky:'Maluco' },
  zh:{ Awkward:'尴尬', Creative:'创意', Cuddly:'亲昵', Daring:'大胆', Disgusting:'恶心', Exhausting:'累人', Humiliating:'羞辱', Inedible:'难以下咽', Intimate:'亲密', Juvenile:'幼稚', Kinky:'癖好', Messy:'凌乱', Risky:'冒险', Sensual:'感官', Wacky:'古怪' },
  tl:{ Awkward:'Ilang', Creative:'Malikhain', Cuddly:'Mahilig yumakap', Daring:'Matapang', Disgusting:'Kadiri', Exhausting:'Nakakapagod', Humiliating:'Nakakahiya', Inedible:'Hindi nakakain', Intimate:'Matalik', Juvenile:'Pambata', Kinky:'Kinky', Messy:'Magulo', Risky:'Mapanganib', Sensual:'Sensuwal', Wacky:'Loko-loko' },
  vi:{ Awkward:'Ngượng ngùng', Creative:'Sáng tạo', Cuddly:'Âu yếm', Daring:'Táo bạo', Disgusting:'Ghê tởm', Exhausting:'Kiệt sức', Humiliating:'Nhục nhã', Inedible:'Không ăn được', Intimate:'Thân mật', Juvenile:'Trẻ con', Kinky:'Kinky', Messy:'Lộn xộn', Risky:'Mạo hiểm', Sensual:'Gợi cảm', Wacky:'Quái chiêu' },
  ar:{ Awkward:'محرج', Creative:'إبداعي', Cuddly:'حنون', Daring:'جريء', Disgusting:'مقرف', Exhausting:'مرهق', Humiliating:'مهين', Inedible:'غير صالح للأكل', Intimate:'حميمي', Juvenile:'طفولي', Kinky:'كينكي', Messy:'فوضوي', Risky:'محفوف بالمخاطر', Sensual:'حسي', Wacky:'غريب' },
  fr:{ Awkward:'Malaise', Creative:'Créatif', Cuddly:'Câlin', Daring:'Audacieux', Disgusting:'Dégoûtant', Exhausting:'Épuisant', Humiliating:'Humiliant', Inedible:'Immangeable', Intimate:'Intime', Juvenile:'Juvénile', Kinky:'Kinky', Messy:'Bordélique', Risky:'Risqué', Sensual:'Sensuel', Wacky:'Déjanté' },
  ko:{ Awkward:'어색함', Creative:'창의적', Cuddly:'포근함', Daring:'대담함', Disgusting:'역겨움', Exhausting:'고됨', Humiliating:'굴욕적', Inedible:'먹기 힘든', Intimate:'친밀함', Juvenile:'유치함', Kinky:'페티시', Messy:'지저분함', Risky:'위험함', Sensual:'관능적', Wacky:'엉뚱함' },
  ru:{ Awkward:'Неловкий', Creative:'Творческий', Cuddly:'Ласковый', Daring:'Смелый', Disgusting:'Отвратительный', Exhausting:'Изматывающий', Humiliating:'Унизительный', Inedible:'Несъедобный', Intimate:'Интимный', Juvenile:'Детский', Kinky:'Фетиш', Messy:'Неряшливый', Risky:'Рискованный', Sensual:'Чувственный', Wacky:'Чудаковатый' },
  ht:{ Awkward:'Anbarasan', Creative:'Kreyatif', Cuddly:'Toudous', Daring:'Odasye', Disgusting:'Degoutan', Exhausting:'Fatigan', Humiliating:'Imilyan', Inedible:'Pa manjab', Intimate:'Entim', Juvenile:'Timoun', Kinky:'Kinky', Messy:'Sal', Risky:'Ris', Sensual:'Sansyèl', Wacky:'Foufou' },
  hi:{ Awkward:'अटपटा', Creative:'रचनात्मक', Cuddly:'प्यारा', Daring:'साहसी', Disgusting:'घिनौना', Exhausting:'थकाने वाला', Humiliating:'अपमानजनक', Inedible:'अखाद्य', Intimate:'अंतरंग', Juvenile:'बचकाना', Kinky:'किंकी', Messy:'बिखरा हुआ', Risky:'जोखिम भरा', Sensual:'कामुक', Wacky:'सनकी' },
  de:{ Awkward:'Peinlich', Creative:'Kreativ', Cuddly:'Kuschelig', Daring:'Wagemutig', Disgusting:'Eklig', Exhausting:'Erschöpfend', Humiliating:'Demütigend', Inedible:'Ungenießbar', Intimate:'Intim', Juvenile:'Kindisch', Kinky:'Kinky', Messy:'Chaotisch', Risky:'Riskant', Sensual:'Sinnlich', Wacky:'Schräg' },
  nl:{ Awkward:'Ongemakkelijk', Creative:'Creatief', Cuddly:'Knuffelig', Daring:'Gedurfd', Disgusting:'Walgelijk', Exhausting:'Uitputtend', Humiliating:'Vernederend', Inedible:'Oneetbaar', Intimate:'Intiem', Juvenile:'Kinderachtig', Kinky:'Kinky', Messy:'Rommelig', Risky:'Riskant', Sensual:'Sensueel', Wacky:'Mallotig' },
  pl:{ Awkward:'Niezręczny', Creative:'Kreatywny', Cuddly:'Przytulaśny', Daring:'Odważny', Disgusting:'Obrzydliwy', Exhausting:'Wyczerpujący', Humiliating:'Upokarzający', Inedible:'Niejadalny', Intimate:'Intymny', Juvenile:'Niedojrzały', Kinky:'Kinky', Messy:'Bałaganiarski', Risky:'Ryzykowny', Sensual:'Zmysłowy', Wacky:'Odjechany' },
  it:{ Awkward:'Imbarazzante', Creative:'Creativo', Cuddly:'Coccoloso', Daring:'Audace', Disgusting:'Disgustoso', Exhausting:'Sfiancante', Humiliating:'Umiliante', Inedible:'Immangiabile', Intimate:'Intimo', Juvenile:'Infantile', Kinky:'Kinky', Messy:'Disordinato', Risky:'Rischioso', Sensual:'Sensuale', Wacky:'Strambo' }
};

Object.values(I18N).forEach(locale => {
  if (!locale.splashBlurbLead) locale.splashBlurbLead = I18N.en.splashBlurbLead;
  if (!locale.freePrintCardGame) locale.freePrintCardGame = I18N.en.freePrintCardGame;
  if (!locale.splashBlurbTail) locale.splashBlurbTail = I18N.en.splashBlurbTail;
  if (!locale.waitingConsentSetup) locale.waitingConsentSetup = I18N.en.waitingConsentSetup;
  if (!locale.performDareTitle) locale.performDareTitle = I18N.en.performDareTitle;
  if (!locale.performDareWith) locale.performDareWith = I18N.en.performDareWith;
  if (!locale.stillThereTitle) locale.stillThereTitle = I18N.en.stillThereTitle;
  if (!locale.stillThereHelp) locale.stillThereHelp = I18N.en.stillThereHelp;
  if (!locale.stillHere) locale.stillHere = I18N.en.stillHere;
  if (!locale.secondsToRespond) locale.secondsToRespond = I18N.en.secondsToRespond;
  if (!locale.stillTherePeer) locale.stillTherePeer = I18N.en.stillTherePeer;
  if (!locale.stillTherePeerHelp) locale.stillTherePeerHelp = I18N.en.stillTherePeerHelp;
  if (!locale.yesKeepWaiting) locale.yesKeepWaiting = I18N.en.yesKeepWaiting;
  if (!locale.noRemovePlayer) locale.noRemovePlayer = I18N.en.noRemovePlayer;
});
let THEMES = null;
let selectedTheme = 'Sensual';
let peekedRoom = null;
let lastUiActivitySentAt = 0;
let uiActivityBound = false;
const PRESENCE_I18N = {
  es: {
    stillThereTitle:'¿Sigues ahí?',
    stillThereHelp:'Te estamos esperando. Toca abajo si sigues jugando.',
    stillHere:'Sigo aquí',
    secondsToRespond:'{seconds} segundos para responder',
    stillTherePeer:'¿{name} sigue jugando?',
    stillTherePeerHelp:'Si sigue jugando, seguiremos esperando. Si no, la quitaremos de esta partida.',
    yesKeepWaiting:'Sí, sigamos esperando',
    noRemovePlayer:'No, quitarla'
  },
  pt: {
    stillThereTitle:'Você ainda está aí?',
    stillThereHelp:'Estamos esperando por você. Toque abaixo se ainda estiver jogando.',
    stillHere:'Ainda estou aqui',
    secondsToRespond:'{seconds} segundos para responder',
    stillTherePeer:'{name} ainda está jogando?',
    stillTherePeerHelp:'Se ainda estiver jogando, continuaremos esperando. Caso contrário, vamos removê-la desta partida.',
    yesKeepWaiting:'Sim, continuar esperando',
    noRemovePlayer:'Não, remover'
  },
  zh: {
    stillThereTitle:'你还在吗？',
    stillThereHelp:'大家正在等你。如果你还在玩，请点下面。',
    stillHere:'我还在',
    secondsToRespond:'还有 {seconds} 秒可回应',
    stillTherePeer:'{name} 还在玩吗？',
    stillTherePeerHelp:'如果她还在玩，我们会继续等；如果没有，我们会把她移出本局。',
    yesKeepWaiting:'是，继续等待',
    noRemovePlayer:'不，移除她'
  },
  tl: {
    stillThereTitle:'Nandiyan ka pa ba?',
    stillThereHelp:'Hinihintay ka namin. Pindutin ito kung naglalaro ka pa.',
    stillHere:'Nandito pa ako',
    secondsToRespond:'{seconds} segundo para sumagot',
    stillTherePeer:'Naglalaro pa ba si {name}?',
    stillTherePeerHelp:'Kung naglalaro pa siya, maghihintay pa kami. Kung hindi, aalisin namin siya sa larong ito.',
    yesKeepWaiting:'Oo, maghintay pa',
    noRemovePlayer:'Hindi, alisin siya'
  },
  vi: {
    stillThereTitle:'Bạn vẫn ở đó chứ?',
    stillThereHelp:'Mọi người đang chờ bạn. Hãy chạm bên dưới nếu bạn vẫn đang chơi.',
    stillHere:'Tôi vẫn ở đây',
    secondsToRespond:'Còn {seconds} giây để trả lời',
    stillTherePeer:'{name} còn đang chơi không?',
    stillTherePeerHelp:'Nếu vẫn còn chơi, chúng tôi sẽ tiếp tục chờ. Nếu không, chúng tôi sẽ xóa họ khỏi ván này.',
    yesKeepWaiting:'Có, tiếp tục chờ',
    noRemovePlayer:'Không, xóa họ'
  },
  ar: {
    stillThereTitle:'هل ما زلت هنا؟',
    stillThereHelp:'نحن ننتظرك. اضغط أدناه إذا كنت ما زلت تلعب.',
    stillHere:'ما زلت هنا',
    secondsToRespond:'لديك {seconds} ثانية للرد',
    stillTherePeer:'هل ما زالت {name} تلعب؟',
    stillTherePeerHelp:'إذا كانت ما زالت تلعب فسوف نواصل الانتظار، وإذا لم تكن كذلك فسنزيلها من هذه اللعبة.',
    yesKeepWaiting:'نعم، واصلوا الانتظار',
    noRemovePlayer:'لا، أزيلوها'
  },
  fr: {
    stillThereTitle:'Tu es toujours là ?',
    stillThereHelp:'On t’attend. Appuie ci-dessous si tu joues toujours.',
    stillHere:'Je suis toujours là',
    secondsToRespond:'{seconds} secondes pour répondre',
    stillTherePeer:'Est-ce que {name} joue toujours ?',
    stillTherePeerHelp:'Si elle joue toujours, on continue d’attendre. Sinon, on la retire de cette partie.',
    yesKeepWaiting:'Oui, continuer à attendre',
    noRemovePlayer:'Non, la retirer'
  },
  ko: {
    stillThereTitle:'아직 거기 있나요?',
    stillThereHelp:'모두가 당신을 기다리고 있습니다. 아직 플레이 중이면 아래를 누르세요.',
    stillHere:'저 아직 있어요',
    secondsToRespond:'응답까지 {seconds}초',
    stillTherePeer:'{name}님이 아직 플레이 중인가요?',
    stillTherePeerHelp:'아직 플레이 중이면 계속 기다리고, 아니면 이 게임에서 제거합니다.',
    yesKeepWaiting:'네, 계속 기다리기',
    noRemovePlayer:'아니요, 제거하기'
  },
  ru: {
    stillThereTitle:'Ты ещё здесь?',
    stillThereHelp:'Мы тебя ждём. Нажми ниже, если ты всё ещё играешь.',
    stillHere:'Я всё ещё здесь',
    secondsToRespond:'{seconds} сек. на ответ',
    stillTherePeer:'{name} всё ещё играет?',
    stillTherePeerHelp:'Если она всё ещё играет, мы продолжим ждать. Если нет, мы удалим её из этой игры.',
    yesKeepWaiting:'Да, подождать ещё',
    noRemovePlayer:'Нет, удалить её'
  },
  ht: {
    stillThereTitle:'Ou toujou la?',
    stillThereHelp:'N ap tann ou. Tape anba a si ou toujou ap jwe.',
    stillHere:'Mwen toujou la',
    secondsToRespond:'{seconds} segonn pou reponn',
    stillTherePeer:'Èske {name} toujou ap jwe?',
    stillTherePeerHelp:'Si li toujou ap jwe, n ap kontinye tann. Si se pa sa, n ap retire li nan jwèt sa a.',
    yesKeepWaiting:'Wi, kontinye tann',
    noRemovePlayer:'Non, retire li'
  },
  hi: {
    stillThereTitle:'क्या आप अभी भी वहाँ हैं?',
    stillThereHelp:'हम आपका इंतज़ार कर रहे हैं। अगर आप अभी भी खेल रहे हैं तो नीचे दबाएँ।',
    stillHere:'मैं अभी भी यहाँ हूँ',
    secondsToRespond:'जवाब देने के लिए {seconds} सेकंड',
    stillTherePeer:'क्या {name} अभी भी खेल रही है?',
    stillTherePeerHelp:'अगर वह अभी भी खेल रही है, तो हम इंतज़ार जारी रखेंगे। नहीं तो हम उसे इस गेम से हटा देंगे।',
    yesKeepWaiting:'हाँ, इंतज़ार जारी रखें',
    noRemovePlayer:'नहीं, उसे हटाएँ'
  },
  de: {
    stillThereTitle:'Bist du noch da?',
    stillThereHelp:'Wir warten auf dich. Tippe unten, wenn du noch mitspielst.',
    stillHere:'Ich bin noch da',
    secondsToRespond:'{seconds} Sekunden zum Antworten',
    stillTherePeer:'Spielt {name} noch mit?',
    stillTherePeerHelp:'Wenn sie noch mitspielt, warten wir weiter. Andernfalls entfernen wir sie aus diesem Spiel.',
    yesKeepWaiting:'Ja, weiter warten',
    noRemovePlayer:'Nein, entfernen'
  },
  nl: {
    stillThereTitle:'Ben je er nog?',
    stillThereHelp:'We wachten op je. Tik hieronder als je nog meespeelt.',
    stillHere:'Ik ben er nog',
    secondsToRespond:'Nog {seconds} seconden om te reageren',
    stillTherePeer:'Speelt {name} nog mee?',
    stillTherePeerHelp:'Als ze nog meespeelt, wachten we verder. Zo niet, dan verwijderen we haar uit dit spel.',
    yesKeepWaiting:'Ja, blijf wachten',
    noRemovePlayer:'Nee, verwijder haar'
  },
  pl: {
    stillThereTitle:'Czy nadal tam jesteś?',
    stillThereHelp:'Czekamy na Ciebie. Kliknij poniżej, jeśli nadal grasz.',
    stillHere:'Nadal tu jestem',
    secondsToRespond:'{seconds} s na odpowiedź',
    stillTherePeer:'Czy {name} nadal gra?',
    stillTherePeerHelp:'Jeśli nadal gra, będziemy dalej czekać. Jeśli nie, usuniemy ją z tej gry.',
    yesKeepWaiting:'Tak, czekajmy dalej',
    noRemovePlayer:'Nie, usuń ją'
  },
  it: {
    stillThereTitle:'Ci sei ancora?',
    stillThereHelp:'Ti stiamo aspettando. Tocca qui sotto se stai ancora giocando.',
    stillHere:'Ci sono ancora',
    secondsToRespond:'{seconds} secondi per rispondere',
    stillTherePeer:'{name} sta ancora giocando?',
    stillTherePeerHelp:'Se sta ancora giocando continueremo ad aspettare. Altrimenti la rimuoveremo da questa partita.',
    yesKeepWaiting:'Sì, continuiamo ad aspettare',
    noRemovePlayer:'No, rimuovila'
  }
};
Object.entries(PRESENCE_I18N).forEach(([code, strings]) => {
  I18N[code] ||= { ...I18N.en };
  Object.assign(I18N[code], strings);
});
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
let local = { edit:null, prompt:{}, exampleOffsets:{}, landingMode:null, pendingJoinCode:'', pendingPeekAction:null, pendingExample:null, takeoverPanelKey:'' };

function lang(){ return state.me.language || loadSession()?.language || 'en'; }
function t(key, vars={}){
  const s = (I18N[lang()]?.[key] || I18N.en[key] || key).toString();
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
function themeDisplayName(key){
  return THEME_NAME_I18N[lang()]?.[key] || THEMES?.[key]?.name || key;
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
function pushLocalHistory(kind){ try { history.pushState({ dtcLocal:kind }, '', location.href); } catch {} }
function clearLocalBack(){
  const prompt = state.room?.me?.pendingPrompts?.[0];
  if (prompt?.type === 'onboarding') {
    const ps = promptState(prompt);
    if ((ps.step || 0) > 0) {
      ps.step--;
      render();
      return true;
    }
  }
  if (local.edit) {
    local.edit = null;
    render();
    return true;
  }
  if (isActive() && ['chooseDare', 'choosePlayer'].includes(state.room?.turn?.phase)) {
    socket.emit('turn:backToMode');
    return true;
  }
  if (local.landingMode) {
    local.landingMode = null;
    render();
    return true;
  }
  return false;
}
function requestLocalBack(){
  if (history.state?.dtcLocal) {
    history.back();
    return;
  }
  clearLocalBack();
}
function meId(){ return state.me?.id || null; }
function mePlayer(){ return state.room?.players?.find(p => p.id === meId()) || null; }
function player(id){ return state.room?.players?.find(p => p.id === id) || null; }
function dare(id){ return state.room?.dareMenu?.find(d => d.id === id) || null; }
function resolveDareRecord(value){
  if (!value) return null;
  if (typeof value === 'string') return dare(value);
  if (value.id) return dare(value.id) || value;
  return value;
}
function dareTitleText(value){
  const d = resolveDareRecord(value);
  if (!d) return '';
  return d.translations?.[lang()]?.title || d.title || '';
}
function dareExtraText(value){
  const d = resolveDareRecord(value);
  if (!d) return '';
  return d.translations?.[lang()]?.extra || d.extra || '';
}
function activeId(){ return state.room?.turn?.order?.[state.room?.turn?.index] || null; }
function activePlayer(){ return player(activeId()); }
function pendingSetupPlayers(){ return (state.room?.turn?.pendingSetupIds || []).map(id => player(id)).filter(Boolean); }
function isActive(){ return !!meId() && meId() === activeId(); }
function secondsLeft(){
  const end = state.room?.turn?.timerEndsAt || 0;
  return Math.max(0, Math.ceil((end - Date.now()) / 1000));
}
function promptSecondsLeft(endsAt){
  return Math.max(0, Math.ceil(((endsAt || 0) - Date.now()) / 1000));
}
function renderPresenceCountdown(endsAt){
  return t('secondsToRespond', { seconds:promptSecondsLeft(endsAt) });
}
function renderTurnCountdown(){
  return t('sendingIn', { seconds:secondsLeft() });
}
function stripLeadingIconLabel(text){
  return String(text || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
}
function spiceGlyph(kind){
  if (kind === 'cool') {
    return `<span class="spice-glyph spice-glyph-cool" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 2 13.8 6.3 18 4.9 15.7 9l4.3 1-4.3 1 2.3 4.1-4.2-1.4L12 18l-1.8-4.3L6 15.1 8.3 11 4 10l4.3-1L6 4.9l4.2 1.4L12 2Z" fill="#8cf3ff" stroke="#dcfcff" stroke-width="1.2" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.2" fill="#effcff"/></svg></span>`;
  }
  return `<span class="spice-glyph spice-glyph-hot" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M14.8 2.7c.4 2.4-.8 3.7-2 4.9-1.1 1.1-2.1 2.1-2.1 4 0 1.2.5 2.1 1.2 2.8-3-.4-5.1-2.8-5.1-5.8 0-2.5 1.4-4.7 3.4-5.9-.2 1.5.2 2.6 1 3.5.8-1.4 2.1-2.3 3.6-3.5ZM13.1 9.1c2.3 1.2 3.9 3.5 3.9 6.1 0 3.8-3.1 6.8-7 6.8s-7-3-7-6.8c0-2.5 1.4-4.8 3.6-6 0 2.5 1.8 4.5 4.3 5 1.6.3 3.4-.2 4.6-1.4.9-.9 1.5-2.2 1.5-3.7.9.9 1.5 2.2 1.5 3.7 0 2.8-2.1 5.2-4.8 5.7 1.1-.9 1.8-2.2 1.8-3.7 0-1-.3-2-1-2.7-.1.3-.3.5-.5.7-.8.8-2 .9-3 .4-1.2-.6-2-1.8-1.9-3.1-1.6 1.1-2.6 2.9-2.6 4.9 0 3.2 2.6 5.8 5.9 5.8s5.9-2.6 5.9-5.8c0-2.7-1.8-5-4.2-5.7Z" fill="#ff59b1" stroke="#ffd0f0" stroke-width="1" stroke-linejoin="round"/></svg></span>`;
}
function takeoverPanelClass(key){
  const animate = local.takeoverPanelKey !== key;
  local.takeoverPanelKey = key;
  return `panel takeover-panel${animate ? ' panel-animate' : ''}`;
}
function clearTakeoverPanelKey(){
  local.takeoverPanelKey = '';
}
function countText(n, kind){
  if (kind === 'dare') return n === 1 ? t('oneDare') : t('consentCount', { count:n });
  return n === 1 ? t('onePlayer') : t('dareCount', { count:n });
}
function playerEditSummary(name, count){
  return count === 1 ? t('playerEditSummaryOne', { name }) : t('playerEditSummary', { name, count });
}
function dareEditSummary(title, count){
  return count === 1 ? t('dareEditSummaryOne', { dare:title }) : t('dareEditSummary', { dare:title, count });
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
  const takenThemeExamples = new Set((room?.dareMenu || [])
    .filter(d => d?.themeRef?.theme === theme && d?.themeRef?.section === 'examples')
    .map(d => `${d.themeRef.section}:${d.themeRef.index}`));
  const raw = Array.isArray(tData?.examples) ? tData.examples : [];
  return raw
    .map((ex, index) => ({ ex, index }))
    .filter(({ ex, index }) => !takenThemeExamples.has(`examples:${index}`) && !taken.has((ex?.title || '').trim().toLowerCase()))
    .map(({ ex, index }) => ({ ...localizedExample(ex), __idx:index, sp: typeof ex.spicyness === 'number' ? ex.spicyness : 0 }))
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
    ${LANGS.map(code => `<option value="${code}" ${value===code?'selected':''}>${escapeHtml(LANGUAGE_NAMES[code] || code)}</option>`).join('')}
  </select>`;
}
function collectProfile(prefix){
  const name = sanitizeInput($(`#${prefix}-name`)?.value || 'Player', 30) || 'Player';
  const gender = $(`input[name="${prefix}-gender"]:checked`)?.value || 'nonbinary';
  const preferredGenders = $$(`input[name="${prefix}-pref"]:checked`).map(x => x.value);
  const language = $(`#${prefix}-language`)?.value || lang();
  return { name, gender, preferredGenders: preferredGenders.length ? preferredGenders : [...GENDERS], language };
}
function collectProfileDraft(prefix){
  const name = sanitizeInput($(`#${prefix}-name`)?.value || '', 30);
  const gender = $(`input[name="${prefix}-gender"]:checked`)?.value || 'nonbinary';
  const preferredGenders = $$(`input[name="${prefix}-pref"]:checked`).map(x => x.value);
  const language = $(`#${prefix}-language`)?.value || lang();
  return { name, gender, preferredGenders: preferredGenders.length ? preferredGenders : [...GENDERS], language };
}
function requestJoinProfile(rawCode){
  const code = sanitizeInput(rawCode || '', 64).toLowerCase();
  const input = $('#quick-join-code');
  if (!code) {
    input?.reportValidity?.();
    return;
  }
  local.pendingJoinCode = code;
  local.pendingPeekAction = 'join';
  socket.emit('room:peek', { code });
}

function profileSetupView(mode, codeInHash, sess, subtitle){
  const prefix = mode === 'create' ? 'create' : 'join';
  const code = local.pendingJoinCode || codeInHash || sess.code || '';
  return `
    <section class="card landing setup-screen">
      <button class="secondary narrow" id="landing-back">${t('back')}</button>
      <h1>${t('setupProfile')}</h1>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
      <div class="panel">
        <h3>${mode === 'create' ? t('createGame') : t('joinGame')}</h3>
        ${mode === 'join' ? `<label class="field-label" for="join-code">${t('gameCode')}</label><input id="join-code" placeholder="three-words-like-this" value="${escapeAttr(code)}" maxlength="64">` : ''}
        <input id="${prefix}-name" placeholder="${t('yourName')}" value="${escapeAttr(sess.name || '')}" maxlength="30">
        ${genderFields(prefix, sess.gender || 'nonbinary', sess.preferredGenders || GENDERS)}
        ${languageSelect(`${prefix}-language`, sess.language || lang())}
        <button class="primary" id="${prefix}-btn">${mode === 'create' ? t('create') : t('join')}</button>
      </div>
    </section>`;
}

function titleView(){
  const codeInHash = location.hash?.slice(1) || '';
  const sess = loadSession() || {};
  const hostName = peekedRoom ? peekedRoom.players?.find(p => p.id === peekedRoom.hostId)?.name || 'the host' : '';
  const joinSubtitle = hostName ? t('joinHost', { name:hostName }) : '';
  if (local.landingMode === 'create') return profileSetupView('create', codeInHash, sess, '');
  if (local.landingMode === 'join') return profileSetupView('join', codeInHash, sess, joinSubtitle);
  if (codeInHash) return profileSetupView('join', codeInHash, sess, joinSubtitle);
  const quickCode = local.pendingJoinCode || codeInHash || '';
  return `
    <section class="card landing">
      <h1>${t('title')}</h1>
      <p>${escapeHtml(t('tagline'))}</p>
      <p class="landing-blurb">${escapeHtml(t('splashBlurbLead'))} <a href="https://github.com/DaringGames/DareToConsent/" target="_blank" rel="noopener noreferrer">${escapeHtml(t('freePrintCardGame'))}</a> ${escapeHtml(t('splashBlurbTail'))}</p>
      <div class="grid-landing${codeInHash ? ' single' : ''}">
        ${codeInHash ? '' : `<div class="panel">
          <h3>${t('createGame')}</h3>
          <select id="create-theme">
            ${(THEMES ? Object.keys(THEMES) : ['Sensual']).map(k => `<option value="${escapeAttr(k)}" ${k===selectedTheme?'selected':''}>${t('theme')}: ${escapeHtml(themeDisplayName(k))}</option>`).join('')}
          </select>
          <button class="primary" id="choose-create">${t('create')}</button>
        </div>
        <div class="or">${t('or')}</div>`}
        <div class="panel">
          <h3>${t('joinGame')}</h3>
          <label class="field-label" for="quick-join-code">${t('gameCode')}</label>
          <input id="quick-join-code" placeholder="three-words-like-this" value="${escapeAttr(quickCode)}" maxlength="64" required>
          <button class="primary" id="choose-join">${t('join')}</button>
        </div>
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
  const actionLabel = canProceed ? (r.paused ? t('resumeGame') : t('startGame')) : `<span class="spinner" aria-hidden="true"></span><span>${t('waitingForPlayers')}</span>`;
  return `
    <section class="card lobby-screen">
      <div class="row between">
        <h2>${t('room')}: ${escapeHtml(r.code)}</h2>
        ${profileMenuHtml(r)}
      </div>
      <div class="qr"><div id="qr"></div></div>
      <small>${t('share')}: <a href="${url}">${url}</a></small>
      <h3>${t('players')}</h3>
      <div class="players">${r.players.map(namePill).join('')}</div>
      <button class="primary waiting-action" id="${r.paused ? 'resume-game' : 'start-game'}" ${canProceed ? '' : 'disabled'}>${actionLabel}</button>
    </section>`;
}
function statusText(){
  const r = state.room;
  const turn = r?.turn;
  const act = activePlayer();
  if (!turn) return '';
  if (turn.phase === 'awaitingOnboarding') {
    const names = pendingSetupPlayers().map(p => p.name).join(', ') || 'players';
    return t('waitingConsentSetup', { names });
  }
  if (turn.phase === 'adding') return turn.addingBy === meId() ? t('addDareTitle') : t('waitingAdd', { name: player(turn.addingBy)?.name || 'Player' });
  if (turn.phase === 'performing') {
    const a = player(turn.performing?.activeId);
    const b = player(turn.performing?.partnerId);
    const d = dare(turn.performing?.dareId);
    return t('waitingPerform', { a:a?.name || 'Player', b:b?.name || 'Player', dare:dareTitleText(d) });
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
  if (turn.phase === 'dareRespond') return t('selectedDare', { name:act?.name || 'Player', dare:dareTitleText(turn.selectedDareId) });
  if (turn.phase === 'personRespond') return t('waitingRespond', { name:player(turn.selectedPlayerId)?.name || 'Player' });
  return t('waitingChoose', { name:act?.name || 'Player' });
}
function defaultDashboard(){
  const r = state.room;
  const counts = r.me?.counts || { players:[], dares:[] };
  const others = r.players.filter(p => p.id !== meId() && p.connected !== false);
  return `
    <div class="split consent-dashboard">
      <section>
        <h3>${t('managePlayerConsent')}</h3>
        <div class="list">${others.map(p => {
          const count = counts.players.find(c => c.playerId === p.id)?.count || 0;
          return `<button class="list-item" data-edit-player="${p.id}">${namePill(p)} <small>${countText(count, 'dare')}</small></button>`;
        }).join('') || `<p><small>${t('waitingForPlayers')}</small></p>`}</div>
      </section>
      <section>
        <h3>${t('manageDareConsent')}</h3>
        <div class="list">${r.dareMenu.map(d => {
          const count = counts.dares.find(c => c.dareId === d.id)?.count || 0;
          return `<button class="list-item" data-edit-dare="${d.id}"><span>${escapeHtml(dareTitleText(d))}</span> <small>${countText(count, 'player')}</small></button>`;
        }).join('')}</div>
      </section>
    </div>`;
}
function editPanel(){
  const r = state.room;
  const edit = local.edit;
  if (!edit) {
    clearTakeoverPanelKey();
    return defaultDashboard();
  }
  if (edit.type === 'player') {
    const p = player(edit.id);
    if (!p) { local.edit = null; clearTakeoverPanelKey(); return defaultDashboard(); }
    const count = r.me?.counts?.players?.find(c => c.playerId === p.id)?.count || 0;
    return `
      <section class="${takeoverPanelClass(`edit-player:${p.id}`)}">
        <div class="edit-panel-header">
          <button class="secondary narrow" id="back-edit">${t('back')}</button>
          ${avatarHtml(p)}
        </div>
        <p class="edit-instruction">${escapeHtml(playerEditSummary(p.name, count))}</p>
        <div class="check-list">${r.dareMenu.map(d => `
          <label><input type="checkbox" data-consent-target="${p.id}" data-consent-dare="${d.id}" ${r.me?.consent?.[p.id]?.[d.id]?'checked':''}> ${escapeHtml(dareTitleText(d))}</label>
        `).join('')}</div>
      </section>`;
  }
  const d = dare(edit.id);
  if (!d) { local.edit = null; clearTakeoverPanelKey(); return defaultDashboard(); }
  const count = r.me?.counts?.dares?.find(c => c.dareId === d.id)?.count || 0;
  return `
    <section class="${takeoverPanelClass(`edit-dare:${d.id}`)}">
      <button class="secondary narrow" id="back-edit">${t('back')}</button>
      <p class="edit-instruction">${escapeHtml(dareEditSummary(dareTitleText(d), count))}</p>
      <div class="check-list">${r.players.filter(p => p.id !== meId() && p.connected !== false).map(p => `
        <label><input type="checkbox" data-consent-target="${p.id}" data-consent-dare="${d.id}" ${r.me?.consent?.[p.id]?.[d.id]?'checked':''}> ${namePill(p)}</label>
      `).join('')}</div>
    </section>`;
}
function activeWaitingPanel(){
  const r = state.room;
  const turn = r.turn;
  if (turn.phase === 'awaitingOnboarding') {
    const waiting = pendingSetupPlayers();
    const names = waiting.map(p => p.name).join(', ') || 'players';
    return `
      <div class="${takeoverPanelClass(`awaitingOnboarding:${(turn.pendingSetupIds || []).join(',')}`)} waiting-panel">
        <h3>${escapeHtml(t('waitingConsentSetup', { names }))}</h3>
        ${waiting.length ? `<div class="players">${waiting.map(namePill).join('')}</div>` : ''}
      </div>`;
  }
  if (turn.phase === 'dareRespond') {
    const d = dare(turn.selectedDareId);
    const waiting = r.players.filter(p => p.id !== meId() && p.connected !== false && !Object.prototype.hasOwnProperty.call(turn.responses || {}, p.id));
    return `
      <div class="panel waiting-panel">
        <h3>${t('waitingResponsesTitle')}</h3>
        <p><b>${escapeHtml(dareTitleText(d))}</b></p>
        <p>${escapeHtml(waiting.length ? `${t('waitingOn')}:` : t('collectingResponses'))}</p>
        ${waiting.length ? `<div class="players">${waiting.map(namePill).join('')}</div>` : ''}
      </div>`;
  }
  if (turn.phase === 'personRespond') {
    const p = player(turn.selectedPlayerId);
    return `
      <div class="panel waiting-panel">
        <h3>${t('waitingResponsesTitle')}</h3>
        <p>${escapeHtml(t('waitingRespond', { name:p?.name || 'Player' }))}</p>
        ${p ? `<div class="players">${namePill(p)}</div>` : ''}
      </div>`;
  }
  return '';
}
function activeBody(){
  const r = state.room;
  const turn = r.turn;
  const counts = r.me?.counts || { players:[], dares:[] };
  if (turn.phase === 'awaitingOnboarding') return activeWaitingPanel();
  if (turn.phase === 'performing' && turn.performing?.partnerId === meId() && !isActive()) {
    const d = dare(turn.performing?.dareId);
    const act = player(turn.performing?.activeId);
    return `
      <div class="${takeoverPanelClass(`performing:${turn.performing?.activeId}:${turn.performing?.partnerId}:${turn.performing?.dareId}`)} performing-panel">
        <h3>${escapeHtml(t('performDareWith', { name: act?.name || 'Player' }))}</h3>
        <p class="performing-dare"><b>${escapeHtml(dareTitleText(d))}</b></p>
        <div class="players">${[act, mePlayer()].filter(Boolean).map(namePill).join('')}</div>
        <button class="primary" id="complete-turn">${t('weDidIt')}</button>
        <button class="danger" id="pass-turn">${t('pass')}</button>
      </div>`;
  }
  if (!isActive()) return editPanel();
  if (turn.phase === 'chooseMode') return `
    <div class="${takeoverPanelClass(`chooseMode:${activeId()}`)} turn-mode-panel">
      <button class="choice-big" data-mode="dare"><span class="choice-title">${t('chooseDareModeTitle')}</span><span class="choice-desc">${t('chooseDareModeDesc')}</span></button>
      <button class="choice-big" data-mode="player"><span class="choice-title">${t('choosePlayerModeTitle')}</span><span class="choice-desc">${t('choosePlayerModeDesc')}</span></button>
    </div>`;
  if (turn.phase === 'chooseDare') return `
    <div class="${takeoverPanelClass(`chooseDare:${activeId()}`)}">
      <button class="secondary narrow" id="back-turn-mode">${t('back')}</button>
      <h3>${t('chooseDare')}</h3>
      <div class="list">${r.dareMenu.map(d => {
        const count = counts.dares.find(c => c.dareId === d.id)?.count || 0;
        return `<button class="list-item ${count===0?'disabled':''}" data-select-dare="${d.id}" ${count===0?'disabled':''}><span>${escapeHtml(dareTitleText(d))}</span><small>${countText(count, 'player')}</small></button>`;
      }).join('')}</div>
    </div>`;
  if (turn.phase === 'choosePlayer') return `
    <div class="${takeoverPanelClass(`choosePlayer:${activeId()}`)}">
      <button class="secondary narrow" id="back-turn-mode">${t('back')}</button>
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
      <div class="${takeoverPanelClass(`choosePartner:${turn.selectedDareId}`)} final-choice-panel">
        <h3>${t('activeOptionsPlayers')}</h3>
        <p><b>${escapeHtml(dareTitleText(d))}</b></p>
        <div class="list">${yes.map(p => `<button class="list-item" data-choose-partner="${p.id}">${namePill(p)}</button>`).join('') || `<p>${t('noOptions')}</p>`}</div>
        <button class="danger" id="pass-turn">${t('pass')}</button>
      </div>`;
  }
  if (turn.phase === 'chooseDareForPlayer') {
    const p = player(turn.selectedPlayerId);
    const yes = r.dareMenu.filter(d => turn.responses?.[d.id]);
    return `
      <div class="${takeoverPanelClass(`chooseDareForPlayer:${turn.selectedPlayerId}`)} final-choice-panel">
        <h3>${t('activeOptionsDares', { name:p?.name || 'Player' })}</h3>
        <div class="list">${yes.map(d => `<button class="list-item" data-choose-dare-final="${d.id}"><span>${escapeHtml(dareTitleText(d))}</span></button>`).join('') || `<p>${t('noOptions')}</p>`}</div>
        <button class="danger" id="pass-turn">${t('pass')}</button>
      </div>`;
  }
  if (turn.phase === 'dareRespond' || turn.phase === 'personRespond') return activeWaitingPanel();
  if (turn.phase === 'performing') {
    const d = dare(turn.performing?.dareId);
    const p = player(turn.performing?.partnerId);
    return `
      <div class="${takeoverPanelClass(`performing:${turn.performing?.activeId}:${turn.performing?.partnerId}:${turn.performing?.dareId}`)} performing-panel">
        <h3>${escapeHtml(t('performDareWith', { name: p?.name || 'Player' }))}</h3>
        <p class="performing-dare"><b>${escapeHtml(dareTitleText(d))}</b></p>
        <p>${namePill(mePlayer())} ${namePill(p)}</p>
        <button class="primary" id="complete-turn">${t('weDidIt')}</button>
        <button class="danger" id="pass-turn">${t('pass')}</button>
      </div>`;
  }
  if (turn.phase === 'adding' && turn.addingBy === meId()) {
    return `
      <div class="${takeoverPanelClass(`adding:${turn.addingBy}:${state.room?.chosenTheme || ''}`)} add-dare-panel">
        <h3>${t('addDareTitle')}</h3>
        <input id="new-dare" placeholder="${t('newDare')}" maxlength="160">
        <button class="primary" id="add-dare">${t('addToMenu')}</button>
        <div class="or-section">${t('examples')}</div>
        <div id="examples"></div>
      </div>`;
  }
  clearTakeoverPanelKey();
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
    </section>`;
}

function promptState(prompt){
  local.prompt[prompt.id] ||= {};
  return local.prompt[prompt.id];
}
function overlayHtml(){
  const r = state.room;
  const presence = r?.me?.presencePrompt;
  if (presence) return `<div class="blocking takeover-blocking">${presenceOverlay(presence)}</div>`;
  const prompt = r?.me?.pendingPrompts?.[0];
  if (prompt) return `<div class="blocking takeover-blocking">${promptOverlay(prompt)}</div>`;
  const turn = r?.turn;
  if (turn?.phase === 'dareRespond' && !isActive() && !Object.prototype.hasOwnProperty.call(turn.responses || {}, meId())) {
    return `<div class="blocking takeover-blocking">${dareResponseOverlay(turn)}</div>`;
  }
  if (turn?.phase === 'personRespond' && turn.selectedPlayerId === meId()) {
    return `<div class="blocking takeover-blocking">${personResponseOverlay(turn)}</div>`;
  }
  return '';
}
function blockingOverlayKey(){
  const r = state.room;
  const presence = r?.me?.presencePrompt;
  if (presence) return `presence:${presence.type}:${presence.promptId}`;
  const prompt = r?.me?.pendingPrompts?.[0];
  if (prompt) {
    const step = prompt.type === 'onboarding' ? (promptState(prompt).step ?? 0) : 0;
    return `prompt:${prompt.type}:${prompt.id}:${step}`;
  }
  const turn = r?.turn;
  if (turn?.phase === 'dareRespond' && !isActive() && !Object.prototype.hasOwnProperty.call(turn.responses || {}, meId())) {
    return `turn:dareRespond:${turn.selectedDareId}:${meId()}`;
  }
  if (turn?.phase === 'personRespond' && turn.selectedPlayerId === meId()) {
    return `turn:personRespond:${turn.selectedPlayerId}:${activeId()}`;
  }
  return '';
}
function presenceOverlay(prompt){
  if (prompt.type === 'self') {
    return `
      <div class="modal-card live-overlay-card presence-card">
        <h3>${t('stillThereTitle')}</h3>
        <p>${t('stillThereHelp')}</p>
        <button class="primary" id="presence-self-confirm">${t('stillHere')}</button>
        <small data-countdown="presence">${renderPresenceCountdown(prompt.countdownEndsAt)}</small>
      </div>`;
  }
  return `
    <div class="modal-card live-overlay-card presence-card">
      <h3>${t('stillTherePeer', { name:prompt.targetName || 'Player' })}</h3>
      <p>${t('stillTherePeerHelp')}</p>
      <div class="row">
        <button class="primary" data-presence-peer="yes">${t('yesKeepWaiting')}</button>
        <button class="danger" data-presence-peer="no">${t('noRemovePlayer')}</button>
      </div>
    </div>`;
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
    <div class="modal-card live-overlay-card">
      <h3>${escapeHtml(t('onboardingDareTitle', { number:ps.step + 1, dare:dareTitleText(cur) || cur.title || '' }))}</h3>
      <p>${escapeHtml(t('onboardingHelp'))}</p>
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
    <div class="modal-card live-overlay-card">
      <h3>${t('joinedTitle', { name:prompt.player?.name || 'Player' })}</h3>
      <p>${t('joinedHelp')}</p>
      <div class="check-list">${(prompt.dares || []).map(d => `
        <label><input type="checkbox" data-new-player-dare="${d.id}" ${ps.values[d.id]?'checked':''}> ${escapeHtml(dareTitleText(d) || d.title || '')}</label>
      `).join('')}</div>
      <button class="primary" id="submit-new-player">${t('submit')}</button>
    </div>`;
}
function newDareOverlay(prompt){
  const ps = promptState(prompt);
  ps.values ||= { ...(prompt.defaults || {}) };
  return `
    <div class="modal-card live-overlay-card">
      <h3>${t('newDareTitle')}</h3>
      <p><b>${escapeHtml(dareTitleText(prompt.dare) || prompt.dare?.title || '')}</b></p>
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
    <div class="modal-card live-overlay-card">
      <h3>${t('selectedDare', { name:act?.name || 'Player', dare:dareTitleText(d) })}</h3>
      <div class="radio-stack">
        <label><input type="radio" name="dare-response" value="yes" ${current?'checked':''}> ${t('yesPlease')}</label>
        <label><input type="radio" name="dare-response" value="no" ${!current?'checked':''}> ${t('noThanks')}</label>
      </div>
      <button class="primary" id="send-dare-response">${t('sendNow')}</button>
      <small data-countdown="turn">${renderTurnCountdown()}</small>
    </div>`;
}
function personResponseOverlay(turn){
  const act = activePlayer();
  return `
    <div class="modal-card live-overlay-card">
      <h3>${t('chosenYou', { name:act?.name || 'Player' })}</h3>
      <div class="check-list">${state.room.dareMenu.map(d => `
        <label><input type="checkbox" data-person-dare="${d.id}" ${turn.responses?.[d.id]?'checked':''}> ${escapeHtml(dareTitleText(d))}</label>
      `).join('')}</div>
      <button class="primary" id="send-person-response">${t('sendNow')}</button>
      <small data-countdown="turn">${renderTurnCountdown()}</small>
    </div>`;
}

function renderExamples(){
  const el = $('#examples');
  if (!el) return;
  const theme = state.room?.chosenTheme || selectedTheme;
  const list = examplesListForTheme(theme);
  const offset = local.exampleOffsets[theme] || 0;
  const page = list.slice(offset, offset + PAGE_SIZE);
  const milderLabel = stripLeadingIconLabel(t('milder'));
  const spicierLabel = stripLeadingIconLabel(t('spicier'));
  el.innerHTML = `
    <div class="list">${page.map(ex => `<button class="list-item spice-item" style="${spiceStyle(ex.sp)}" data-example-title="${escapeAttr(ex.title)}" data-example-index="${ex.__idx}"><span>${escapeHtml(ex.title)}</span><small class="spice-rating">${spiceGlyph('hot')}${ex.sp}</small></button>`).join('')}</div>
    <div class="examples-nav">
      <button id="examples-prev" ${offset <= 0 ? 'disabled' : ''}>${spiceGlyph('cool')}<span>${escapeHtml(milderLabel)}</span></button>
      <button id="examples-next" ${(offset + PAGE_SIZE) >= list.length ? 'disabled' : ''}>${spiceGlyph('hot')}<span>${escapeHtml(spicierLabel)}</span></button>
    </div>`;
}

function spiceStyle(spice){
  const value = Math.max(0, Math.min(100, Number(spice) || 0));
  const heat = value / 100;
  const intensity = Math.pow(heat, 1.25);
  const coolHue = 198 - intensity * 32;
  const mainHue = 228 + intensity * 102;
  const hotHue = 314 + intensity * 64;
  const glow = 0.34 + intensity * 0.86;
  const coolAlpha = Math.max(0.02, 0.34 - intensity * 0.42);
  const mainAlpha = 0.22 + intensity * 0.36;
  const hotAlpha = 0.1 + intensity * 0.64;
  const edgeAlpha = 0.42 + intensity * 0.5;
  const coolStop = 34 - intensity * 18;
  const hotStart = 72 - intensity * 26;
  const mainLight = 40 + intensity * 10;
  const hotLight = 52 + intensity * 10;
  return `--spice-cool-hue:${coolHue.toFixed(1)};--spice-main-hue:${mainHue.toFixed(1)};--spice-hot-hue:${hotHue.toFixed(1)};--spice-glow:${glow.toFixed(3)};--spice-cool-alpha:${coolAlpha.toFixed(3)};--spice-main-alpha:${mainAlpha.toFixed(3)};--spice-hot-alpha:${hotAlpha.toFixed(3)};--spice-edge-alpha:${edgeAlpha.toFixed(3)};--spice-cool-stop:${coolStop.toFixed(1)}%;--spice-hot-start:${hotStart.toFixed(1)}%;--spice-main-light:${mainLight.toFixed(1)}%;--spice-hot-light:${hotLight.toFixed(1)}%`;
}

function currentViewName(){
  const r = state.room;
  if (!r) return local.landingMode ? 'profile' : 'landing';
  if (r.state === 'lobby') return 'lobby';
  const phase = r.turn?.phase || 'dashboard';
  if (['awaitingOnboarding', 'chooseMode', 'chooseDare', 'choosePlayer', 'choosePartner', 'chooseDareForPlayer', 'performing'].includes(phase)) return 'turn';
  if (phase === 'adding') return 'add-dare';
  if (local.edit) return 'edit-consent';
  return 'main';
}

function render(){
  const root = $('#app');
  const r = state.room;
  document.documentElement.lang = lang();
  document.documentElement.dir = lang() === 'ar' ? 'rtl' : 'ltr';
  document.body.dataset.view = currentViewName();
  if (!r || r.state === 'lobby') clearTakeoverPanelKey();
  root.innerHTML = !r ? titleView() : (r.state === 'lobby' ? lobbyView() : mainView());
  try {
    const h2 = root.querySelector('h2');
    const status = h2?.textContent?.trim() || '';
    document.title = `${t('title')}${status ? ' - ' + status : ''}`;
  } catch {}
  renderBlockingOverlay();
  wire();
  if (r?.state === 'lobby') renderQr();
  if (r?.state === 'main') renderExamples();
}

function wire(){
  $('#join-language')?.addEventListener('change', e => {
    const draft = collectProfileDraft('join');
    state.me.language = e.target.value;
    saveSession(draft);
    render();
  });
  $('#create-language')?.addEventListener('change', e => {
    const draft = collectProfileDraft('create');
    state.me.language = e.target.value;
    saveSession(draft);
    render();
  });
  $('#create-theme')?.addEventListener('change', e => selectedTheme = e.target.value || 'Sensual');
  $('#choose-join')?.addEventListener('click', () => requestJoinProfile($('#quick-join-code')?.value || location.hash?.slice(1) || ''));
  $('#choose-create')?.addEventListener('click', () => {
    pushLocalHistory('profile');
    local.landingMode = 'create';
    render();
  });
  $('#landing-back')?.addEventListener('click', requestLocalBack);
  $('#join-btn')?.addEventListener('click', doJoin);
  $('#create-btn')?.addEventListener('click', doCreate);
  $('#quick-join-code')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      requestJoinProfile($('#quick-join-code')?.value || '');
    }
  });
  $('#join-code')?.addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });
  $('#join-name')?.addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(); });
  $('#create-name')?.addEventListener('keydown', e => { if (e.key === 'Enter') doCreate(); });
  $('#start-game')?.addEventListener('click', () => socket.emit('theme:finalize', { theme:selectedTheme || 'Sensual' }));
  $('#resume-game')?.addEventListener('click', () => socket.emit('game:resume'));
  wireProfile();
  $$('[data-edit-player]').forEach(b => b.addEventListener('click', () => { pushLocalHistory('edit'); local.edit = { type:'player', id:b.dataset.editPlayer }; render(); }));
  $$('[data-edit-dare]').forEach(b => b.addEventListener('click', () => { pushLocalHistory('edit'); local.edit = { type:'dare', id:b.dataset.editDare }; render(); }));
  $('#back-edit')?.addEventListener('click', requestLocalBack);
  $$('[data-consent-target][data-consent-dare]').forEach(cb => cb.addEventListener('change', () => {
    socket.emit('consent:update', { targetId:cb.dataset.consentTarget, dareId:cb.dataset.consentDare, value:cb.checked });
  }));
  $$('[data-mode]').forEach(b => b.addEventListener('click', () => {
    pushLocalHistory('turn-mode');
    socket.emit('turn:chooseMode', { mode:b.dataset.mode });
  }));
  $('#back-turn-mode')?.addEventListener('click', requestLocalBack);
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
  $('#new-dare')?.addEventListener('input', e => {
    if (local.pendingExample && e.target.value !== local.pendingExample.displayTitle) local.pendingExample = null;
  });
  $('#add-dare')?.addEventListener('click', () => {
    const title = sanitizeInput($('#new-dare')?.value || '', 160);
    if (!title) return;
    const useExample = local.pendingExample && title === local.pendingExample.displayTitle;
    socket.emit('menu:addDare', useExample ? { title, exampleIndex:local.pendingExample.index } : { title });
    local.pendingExample = null;
  });
  $('#examples')?.addEventListener('click', e => {
    if (e.target.closest('#examples-prev')) {
      shiftExamples(-PAGE_SIZE);
      return;
    }
    if (e.target.closest('#examples-next')) {
      shiftExamples(PAGE_SIZE);
      return;
    }
    const b = e.target.closest('[data-example-title]');
    if (b && $('#new-dare')) {
      const displayTitle = b.dataset.exampleTitle || '';
      $('#new-dare').value = displayTitle;
      local.pendingExample = {
        theme: state.room?.chosenTheme || selectedTheme,
        index: Number(b.dataset.exampleIndex),
        displayTitle
      };
    }
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
  $('#selfie-input')?.addEventListener('change', async e => {
    await uploadSelfie(e.target.files?.[0]);
    e.target.value = '';
  });
  $('#add-players')?.addEventListener('click', () => showInviteOverlay(`${location.origin}/#${state.room.code}`));
  $('#leave-game')?.addEventListener('click', async () => {
    if (!await showConfirm('Leave this game?', { confirmText:t('leaveGame'), cancelText:t('cancel') })) return;
    socket.emit('room:leave');
    state.room = null;
    state.me.id = null;
    local.landingMode = null;
    local.pendingJoinCode = '';
    clearSession();
    history.replaceState(null, '', '#');
    render();
  });
}
function wirePromptControls(){
  const presence = state.room?.me?.presencePrompt;
  if (presence?.type === 'self') {
    $('#presence-self-confirm')?.addEventListener('click', () => {
      emitUiActivity(true);
      socket.emit('presence:selfConfirm', { promptId:presence.promptId, targetId:presence.targetId });
    });
  }
  $$('[data-presence-peer]').forEach(button => button.addEventListener('click', () => {
    const prompt = state.room?.me?.presencePrompt;
    if (!prompt || prompt.type !== 'peer') return;
    emitUiActivity(true);
    socket.emit('presence:peerResponse', {
      promptId: prompt.promptId,
      targetId: prompt.targetId,
      stillPlaying: button.dataset.presencePeer === 'yes'
    });
  }));
  const prompt = state.room?.me?.pendingPrompts?.[0];
  if (prompt) {
    const ps = promptState(prompt);
    if (prompt.type === 'onboarding') {
      const cur = prompt.dares[ps.step];
      $$('[data-onboard-player]').forEach(cb => cb.addEventListener('change', () => {
        ps.selections[cur.id] ||= {};
        ps.selections[cur.id][cb.dataset.onboardPlayer] = cb.checked;
      }));
      $('#onboard-prev')?.addEventListener('click', requestLocalBack);
      $('#onboard-next')?.addEventListener('click', () => {
        if (ps.step < prompt.dares.length - 1) {
          pushLocalHistory('onboarding');
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
function emitUiActivity(force=false){
  if (!state.room || !meId()) return;
  const now = Date.now();
  if (!force && (now - lastUiActivitySentAt) < 4000) return;
  lastUiActivitySentAt = now;
  socket.emit('ui:activity');
}
function bindUiActivity(){
  if (uiActivityBound) return;
  uiActivityBound = true;
  const ping = () => emitUiActivity(false);
  ['pointerdown', 'keydown', 'input', 'touchstart'].forEach(type => {
    window.addEventListener(type, ping, { passive:true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') emitUiActivity(true);
  });
  window.addEventListener('focus', () => emitUiActivity(true));
}
function refreshCountdownLabels(){
  $$('[data-countdown="turn"]').forEach(el => {
    el.textContent = renderTurnCountdown();
  });
  $$('[data-countdown="presence"]').forEach(el => {
    el.textContent = renderPresenceCountdown(state.room?.me?.presencePrompt?.countdownEndsAt || 0);
  });
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
    const dataUrl = await showSelfieCropper(file);
    if (!dataUrl) return;
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
async function loadImageSource(file, converted=false){
  const imageLike = file?.type?.startsWith('image/') || /\.(heic|heif)$/i.test(file?.name || '');
  if (!imageLike) throw new Error('not an image');
  if (window.createImageBitmap) {
    try {
      const options = { imageOrientation:'from-image' };
      if (file.size > 1_500_000) {
        options.resizeWidth = SELFIE_WORK_MAX_DIM;
        options.resizeQuality = 'high';
      }
      const bitmap = await createImageBitmap(file, options);
      return downsampleImageSource({ source:bitmap, width:bitmap.width, height:bitmap.height, cleanup:() => bitmap.close?.() });
    } catch {}
  }
  try {
    return await loadImageElement(file);
  } catch (e) {
    if (!converted) return loadImageSource(await convertHeicToJpeg(file), true);
    throw e;
  }
}
function loadImageElement(file){
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve(downsampleImageSource({ source:img, width:img.naturalWidth || img.width, height:img.naturalHeight || img.height, cleanup:() => URL.revokeObjectURL(url) }));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image decode failed')); };
    img.src = url;
  });
}
function downsampleImageSource(img, maxDim=SELFIE_WORK_MAX_DIM){
  const maxSide = Math.max(img.width, img.height);
  if (maxSide <= maxDim) return img;
  const scale = maxDim / maxSide;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d', { alpha:false });
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img.source, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
  img.cleanup?.();
  return { source:canvas, width:canvas.width, height:canvas.height, cleanup:() => {} };
}
function cropImageToDataUrl(img, crop, size=160){
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { alpha:false });
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img.source, crop.sx, crop.sy, crop.side, crop.side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.72);
}
let heic2anyLoader = null;
function loadHeic2Any(){
  if (window.heic2any) return Promise.resolve(window.heic2any);
  heic2anyLoader ||= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/lib/heic2any.min.js';
    script.async = true;
    script.onload = () => window.heic2any ? resolve(window.heic2any) : reject(new Error('heic converter unavailable'));
    script.onerror = () => reject(new Error('heic converter failed to load'));
    document.head.appendChild(script);
  });
  return heic2anyLoader;
}
async function convertHeicToJpeg(file){
  const heic2any = await loadHeic2Any();
  const converted = await heic2any({ blob:file, toType:'image/jpeg', quality:0.82 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) throw new Error('heic conversion failed');
  return new File([blob], `${(file.name || 'selfie').replace(/\.[^.]*$/, '')}.jpg`, { type:'image/jpeg' });
}
function cropFromControls(img, controls){
  const zoom = Number(controls.zoom?.value || 1);
  const side = Math.max(1, Math.min(img.width, img.height) / zoom);
  const cx = (Number(controls.x?.value || 50) / 100) * img.width;
  const cy = (Number(controls.y?.value || 50) / 100) * img.height;
  const maxX = Math.max(0, img.width - side);
  const maxY = Math.max(0, img.height - side);
  return {
    sx:Math.min(maxX, Math.max(0, cx - side / 2)),
    sy:Math.min(maxY, Math.max(0, cy - side / 2)),
    side
  };
}
function clampCropValue(value, min, max){
  return Math.min(max, Math.max(min, value));
}
function setRangeValue(input, value){
  input.value = String(clampCropValue(value, Number(input.min), Number(input.max)));
}
async function showSelfieCropper(file){
  const img = await loadImageSource(file);
  return new Promise(resolve => {
    const host = ensureOverlayRoot();
    const overlay = document.createElement('div');
    overlay.className = 'overlay show';
    overlay.innerHTML = `
      <div class="modal card selfie-modal">
        <h3>${escapeHtml(t('adjustSelfie'))}</h3>
        <p>${escapeHtml(t('selfieHelp'))}</p>
        <canvas class="selfie-canvas" width="240" height="240" aria-label="${escapeAttr(t('adjustSelfie'))}"></canvas>
        <label class="field-label" for="selfie-zoom">${escapeHtml(t('zoom'))}</label>
        <input id="selfie-zoom" type="range" min="1" max="4" step="0.01" value="1">
        <label class="field-label" for="selfie-x">${escapeHtml(t('horizontal'))}</label>
        <input id="selfie-x" type="range" min="0" max="100" step="1" value="50">
        <label class="field-label" for="selfie-y">${escapeHtml(t('vertical'))}</label>
        <input id="selfie-y" type="range" min="0" max="100" step="1" value="50">
        <div class="row modal-buttons">
          <button class="btn-cancel">${escapeHtml(t('cancel'))}</button>
          <button class="primary btn-ok">${escapeHtml(t('usePhoto'))}</button>
        </div>
      </div>`;
    host.appendChild(overlay);
    const canvas = overlay.querySelector('canvas');
    const ctx = canvas.getContext('2d', { alpha:false });
    const controls = { zoom:overlay.querySelector('#selfie-zoom'), x:overlay.querySelector('#selfie-x'), y:overlay.querySelector('#selfie-y') };
    const activePointers = new Map();
    let gestureStart = null;
    const pointFromEvent = event => ({ id:event.pointerId, x:event.clientX, y:event.clientY });
    const midpoint = points => ({
      x:(points[0].x + points[1].x) / 2,
      y:(points[0].y + points[1].y) / 2
    });
    const distance = points => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    const cropCenter = crop => ({ x:crop.sx + crop.side / 2, y:crop.sy + crop.side / 2 });
    const updateCenterControls = (centerX, centerY) => {
      setRangeValue(controls.x, (centerX / img.width) * 100);
      setRangeValue(controls.y, (centerY / img.height) * 100);
    };
    const startGesture = () => {
      const points = [...activePointers.values()];
      const crop = cropFromControls(img, controls);
      const center = cropCenter(crop);
      if (points.length >= 2) {
        const firstTwo = points.slice(0, 2);
        gestureStart = {
          type:'pinch',
          points:firstTwo,
          midpoint:midpoint(firstTwo),
          distance:Math.max(1, distance(firstTwo)),
          center,
          side:crop.side,
          zoom:Number(controls.zoom.value)
        };
      } else if (points.length === 1) {
        gestureStart = { type:'drag', point:points[0], center, side:crop.side };
      } else {
        gestureStart = null;
      }
      canvas.classList.toggle('dragging', !!gestureStart);
    };
    const draw = () => {
      const crop = cropFromControls(img, controls);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img.source, crop.sx, crop.sy, crop.side, crop.side, 0, 0, canvas.width, canvas.height);
    };
    const updateGesture = () => {
      if (!gestureStart) return;
      const rect = canvas.getBoundingClientRect();
      const points = [...activePointers.values()];
      if (gestureStart.type === 'pinch' && points.length >= 2) {
        const firstTwo = points.slice(0, 2);
        const currentMidpoint = midpoint(firstTwo);
        const zoomScale = distance(firstTwo) / gestureStart.distance;
        setRangeValue(controls.zoom, gestureStart.zoom * zoomScale);
        const dx = currentMidpoint.x - gestureStart.midpoint.x;
        const dy = currentMidpoint.y - gestureStart.midpoint.y;
        updateCenterControls(
          gestureStart.center.x - (dx / rect.width) * gestureStart.side,
          gestureStart.center.y - (dy / rect.height) * gestureStart.side
        );
        draw();
      } else if (gestureStart.type === 'drag' && points.length === 1) {
        const dx = points[0].x - gestureStart.point.x;
        const dy = points[0].y - gestureStart.point.y;
        updateCenterControls(
          gestureStart.center.x - (dx / rect.width) * gestureStart.side,
          gestureStart.center.y - (dy / rect.height) * gestureStart.side
        );
        draw();
      }
    };
    const close = value => {
      overlay.remove();
      img.cleanup?.();
      resolve(value);
    };
    Object.values(controls).forEach(input => input.addEventListener('input', draw));
    canvas.addEventListener('pointerdown', event => {
      event.preventDefault();
      canvas.setPointerCapture?.(event.pointerId);
      activePointers.set(event.pointerId, pointFromEvent(event));
      startGesture();
    });
    canvas.addEventListener('pointermove', event => {
      if (!activePointers.has(event.pointerId)) return;
      event.preventDefault();
      activePointers.set(event.pointerId, pointFromEvent(event));
      updateGesture();
    });
    const endPointer = event => {
      activePointers.delete(event.pointerId);
      try { canvas.releasePointerCapture?.(event.pointerId); } catch {}
      startGesture();
    };
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('lostpointercapture', endPointer);
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      setRangeValue(controls.zoom, Number(controls.zoom.value) * factor);
      draw();
    }, { passive:false });
    overlay.querySelector('.btn-cancel').addEventListener('click', () => close(null));
    overlay.querySelector('.btn-ok').addEventListener('click', () => close(cropImageToDataUrl(img, cropFromControls(img, controls))));
    draw();
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
function ensureBlockingRoot(){
  let root = document.getElementById('blocking-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'blocking-root';
    document.body.appendChild(root);
  }
  return root;
}
function renderBlockingOverlay(){
  const host = ensureBlockingRoot();
  const key = blockingOverlayKey();
  if (!key) {
    host.innerHTML = '';
    host.dataset.overlayKey = '';
    return;
  }
  if (host.dataset.overlayKey === key) {
    refreshCountdownLabels();
    return;
  }
  host.dataset.overlayKey = key;
  host.innerHTML = overlayHtml();
}
function showConfirm(message, { title='', confirmText='OK', cancelText='Cancel' }={}){
  return new Promise(resolve => {
    const host = ensureOverlayRoot();
    const overlay = document.createElement('div');
    overlay.className = 'overlay show';
    const cancel = cancelText ? `<button class="btn-cancel">${escapeHtml(cancelText)}</button>` : '';
    overlay.innerHTML = `<div class="modal card"><h3>${escapeHtml(title)}</h3><p></p><div class="row modal-buttons">${cancel}<button class="primary btn-ok">${escapeHtml(confirmText)}</button></div></div>`;
    overlay.querySelector('p').textContent = message || '';
    host.appendChild(overlay);
    const close = val => { overlay.remove(); resolve(val); };
    overlay.querySelector('.btn-cancel')?.addEventListener('click', () => close(false));
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
    overlay.className = 'overlay show invite-takeover';
    overlay.innerHTML = `<div class="modal card invite-modal"><h3>${t('addPlayers')}</h3><div class="qr"><div id="invite-qr"></div></div><p><a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></p><button class="primary btn-ok">${t('ok')}</button></div>`;
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
  const wasPendingJoinLookup = local.pendingPeekAction === 'join';
  local.pendingPeekAction = null;
  peekedRoom = result.ok ? result.state : null;
  if (wasPendingJoinLookup) {
    if (result.ok) {
      pushLocalHistory('profile');
      local.landingMode = 'join';
    } else {
      showConfirm(result.message || 'Error', { confirmText:t('ok'), cancelText:null });
    }
  }
  render();
});
socket.on('room:error', ({ code, message }) => {
  const roomCode = location.hash?.slice(1) || '';
  const leaveHome = code === 'NO_SUCH_ROOM' || code === 'ROOM_EXPIRED' || code === 'PLAYER_REMOVED';
  if (code === 'NO_SUCH_ROOM' || code === 'ROOM_EXPIRED') {
    state.room = null;
    state.me.id = null;
    peekedRoom = null;
    local.landingMode = null;
    local.pendingJoinCode = '';
    clearSession();
    try { history.replaceState(null, '', '#'); } catch {}
    render();
  }
  if (code === 'PLAYER_REMOVED') {
    state.room = null;
    state.me.id = null;
    local.edit = null;
    local.landingMode = 'join';
    local.pendingJoinCode = roomCode;
    saveSession({ playerId:null, code:roomCode });
    if (roomCode) socket.emit('room:peek', { code: roomCode });
    render();
  }
  showConfirm(message || 'Error', { confirmText:t('ok'), cancelText:leaveHome ? null : t('cancel') });
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
window.addEventListener('popstate', () => {
  clearLocalBack();
});
setInterval(() => {
  const turnEndsAt = state.room?.turn?.timerEndsAt || 0;
  const presenceEndsAt = state.room?.me?.presencePrompt?.countdownEndsAt || 0;
  const nextEnd = Math.max(turnEndsAt, presenceEndsAt);
  if (!nextEnd) return;
  if (nextEnd > Date.now()) {
    refreshCountdownLabels();
    return;
  }
  render();
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
bindUiActivity();
render();
loadThemes();
if (location.hash?.slice(1)) socket.emit('room:peek', { code:location.hash.slice(1) });
