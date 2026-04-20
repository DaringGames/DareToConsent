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
    waitingAdd:'Waiting for {name} to add a new dare',
    consentPlayers:'Click a player to edit which dares you consent to do with them:',
    consentDares:'Click a dare to edit which players you consent to do the dare with:',
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
let local = { edit:null, prompt:{}, exampleOffsets:{}, landingMode:null, pendingJoinCode:'' };

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

function profileSetupView(mode, codeInHash, sess, subtitle){
  const prefix = mode === 'create' ? 'create' : 'join';
  const code = local.pendingJoinCode || codeInHash || sess.code || '';
  return `
    <section class="card landing">
      <button class="secondary narrow" id="landing-back">${t('back')}</button>
      <h1>${t('setupProfile')}</h1>
      <p>${escapeHtml(subtitle)}</p>
      <div class="panel">
        <h3>${mode === 'create' ? t('createGame') : t('joinGame')}</h3>
        ${mode === 'join' ? `<label class="field-label" for="join-code">${t('gameCode')}</label><input id="join-code" placeholder="three-words-like-this" value="${escapeAttr(code)}" maxlength="64">` : ''}
        <input id="${prefix}-name" placeholder="${t('yourName')}" value="${escapeAttr(sess.name || '')}" maxlength="30">
        ${genderFields(prefix, sess.gender || 'nonbinary', sess.preferredGenders || GENDERS)}
        ${languageSelect(`${prefix}-language`, sess.language || lang())}
        <p><small>${t('profileHelp')}</small></p>
        <button class="primary" id="${prefix}-btn">${mode === 'create' ? t('create') : t('join')}</button>
      </div>
    </section>`;
}

function titleView(){
  const codeInHash = location.hash?.slice(1) || '';
  const sess = loadSession() || {};
  const hostName = peekedRoom ? peekedRoom.players?.find(p => p.id === peekedRoom.hostId)?.name || 'the host' : '';
  const subtitle = codeInHash && hostName ? t('joinHost', { name:hostName }) : t('tagline');
  if (local.landingMode) return profileSetupView(local.landingMode, codeInHash, sess, subtitle);
  const quickCode = local.pendingJoinCode || codeInHash || '';
  return `
    <section class="card landing">
      <h1>${t('title')}</h1>
      <p>${escapeHtml(subtitle)}</p>
      <div class="grid-landing${codeInHash ? ' single' : ''}">
        <div class="panel">
          <h3>${t('joinGame')}</h3>
          <label class="field-label" for="quick-join-code">${t('gameCode')}</label>
          <input id="quick-join-code" placeholder="three-words-like-this" value="${escapeAttr(quickCode)}" maxlength="64">
          <button class="primary" id="choose-join">${t('join')}</button>
        </div>
        ${codeInHash ? '' : `<div class="or">${t('or')}</div>
        <div class="panel">
          <h3>${t('createGame')}</h3>
          <select id="create-theme">
            ${(THEMES ? Object.keys(THEMES) : ['Sensual']).map(k => `<option value="${escapeAttr(k)}" ${k===selectedTheme?'selected':''}>${t('theme')}: ${escapeHtml(THEMES?.[k]?.name || k)}</option>`).join('')}
          </select>
          <button class="primary" id="choose-create">${t('create')}</button>
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
        <p class="edit-instruction">${escapeHtml(playerEditSummary(p.name, count))}</p>
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
      <p class="edit-instruction">${escapeHtml(dareEditSummary(d.title, count))}</p>
      <div class="check-list">${r.players.filter(p => p.id !== meId() && p.connected !== false).map(p => `
        <label><input type="checkbox" data-consent-target="${p.id}" data-consent-dare="${d.id}" ${r.me?.consent?.[p.id]?.[d.id]?'checked':''}> ${namePill(p)}</label>
      `).join('')}</div>
    </section>`;
}
function activeWaitingPanel(){
  const r = state.room;
  const turn = r.turn;
  if (turn.phase === 'dareRespond') {
    const d = dare(turn.selectedDareId);
    const waiting = r.players.filter(p => p.id !== meId() && p.connected !== false && !Object.prototype.hasOwnProperty.call(turn.responses || {}, p.id));
    return `
      <div class="panel waiting-panel">
        <h3>${t('waitingResponsesTitle')}</h3>
        <p><b>${escapeHtml(d?.title || '')}</b></p>
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
  if (!isActive()) return editPanel();
  if (turn.phase === 'chooseMode') return `
    <div class="panel">
      <button class="choice-big" data-mode="dare"><span class="choice-title">${t('chooseDareModeTitle')}</span><span class="choice-desc">${t('chooseDareModeDesc')}</span></button>
      <button class="choice-big" data-mode="player"><span class="choice-title">${t('choosePlayerModeTitle')}</span><span class="choice-desc">${t('choosePlayerModeDesc')}</span></button>
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
  if (turn.phase === 'dareRespond' || turn.phase === 'personRespond') return activeWaitingPanel();
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
      <h3>${escapeHtml(t('onboardingDareTitle', { number:ps.step + 1, dare:cur.title }))}</h3>
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
    <div class="list">${page.map(ex => `<button class="list-item" data-example-title="${escapeAttr(ex.title)}"><span>${escapeHtml(ex.title)}</span><small class="spice-rating"><span aria-hidden="true">🌶️</span>${ex.sp}</small></button>`).join('')}</div>
    <div class="examples-nav">
      <button id="examples-prev" ${offset <= 0 ? 'disabled' : ''}>${t('milder')}</button>
      <button id="examples-next" ${(offset + PAGE_SIZE) >= list.length ? 'disabled' : ''}>${t('spicier')}</button>
    </div>`;
}

function render(){
  const root = $('#app');
  const r = state.room;
  document.documentElement.lang = lang();
  document.documentElement.dir = lang() === 'ar' ? 'rtl' : 'ltr';
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
  $('#choose-join')?.addEventListener('click', () => {
    local.pendingJoinCode = sanitizeInput($('#quick-join-code')?.value || location.hash?.slice(1) || '', 64).toLowerCase();
    pushLocalHistory('profile');
    local.landingMode = 'join';
    render();
  });
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
      local.pendingJoinCode = sanitizeInput($('#quick-join-code')?.value || '', 64).toLowerCase();
      pushLocalHistory('profile');
      local.landingMode = 'join';
      render();
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
    if (e.target.closest('#examples-prev')) {
      shiftExamples(-PAGE_SIZE);
      return;
    }
    if (e.target.closest('#examples-next')) {
      shiftExamples(PAGE_SIZE);
      return;
    }
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
    sendDareResponse(false);
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
    const draw = () => {
      const crop = cropFromControls(img, controls);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img.source, crop.sx, crop.sy, crop.side, crop.side, 0, 0, canvas.width, canvas.height);
    };
    const close = value => {
      overlay.remove();
      img.cleanup?.();
      resolve(value);
    };
    Object.values(controls).forEach(input => input.addEventListener('input', draw));
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
  const leaveHome = code === 'NO_SUCH_ROOM' || code === 'ROOM_EXPIRED';
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
