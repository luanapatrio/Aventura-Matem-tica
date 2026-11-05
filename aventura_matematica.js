const GAME_W = 1280;
const GAME_H = 720;
const FLOOR_Y = 660;      // topo do chão
const HAZ_H = 18;         // altura das poças
const PIPE_BOTTOM = 570;  // base dos túneis (corredor de 90px até o chão)
const PLAYER_SPEED = 210;
const JUMP_FORCE = -680;
let FONT = 'Trebuchet MS, Verdana, Arial, sans-serif';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#0b1220',

    scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
},
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: { preload: preload, create: create, update: update }
};

// ---------- Estado global ----------
let player, aura, platforms, items, door, doorGlow, doorLabel;
let cursors, keys;
// Controles para celular e tablet
let mobileControlsElement = null;

const touchControls = {
    left: false,
    right: false,
    jump: false,
    switchPressed: false
};
let score = 0;
let currentLevel = 1;
const maxLevels = 4;
let scoreText, levelText, chipsText, modeText, modeDot;
let bgStars, bgCity, bgGrid, bgSky;
let sceneryObjects = [];


let gameStarted = false;
let quizActive = false;
let levelTransitioning = false;
let respawning = false;
let doorOpen = false;
let playerMode = 'water'; // 'water' | 'fire'

let collectedChips = 0;
let totalChips = 0;
let questionDeck = [];
let messageBox = null;

let levelObjects = [];   // objetos visuais da fase (destruídos ao trocar de fase)
let levelEvents = [];    // timers da fase
let hazards = [];        // poças perigosas (retângulos de dados)
let hazardVisuals = [];
let gate = null;
let lever = null;
let spawnPoint = { x: 90, y: 600 };
let introEls = [];

const HZ_COLOR = { fire: 0xf97316, water: 0x38bdf8, acid: 0x84cc16 };

// ==========================================================
// PERGUNTAS (crianças de 7 a 10 anos) - 8 perguntas por fase
// ==========================================================
const questionsByLevel = {
    1: [
        { q: "Byte recolheu 48 garrafas de manhã e 37 à tarde. Quantas garrafas recolheu no total?", options: ["75", "85", "95"], answer: "85" },
        { q: "A escola tinha 120 latinhas para reciclar. Já entregaram 45. Quantas ainda faltam entregar?", options: ["65", "75", "85"], answer: "75" },
        { q: "Cada turma plantou 6 mudas. Com 7 turmas, quantas mudas foram plantadas?", options: ["36", "42", "48"], answer: "42" },
        { q: "Que horas o relógio está marcando?\n(ponteiro curto = horas, ponteiro longo = minutos)", clock: [4, 30], options: ["4h30", "5h30", "6h20"], answer: "4h30" },
        { q: "O mutirão começou às 8h e durou 3 horas. A que horas terminou?", options: ["10h", "11h", "12h"], answer: "11h" },
        { q: "Byte tem 36 tampinhas e quer dividir igualmente em 4 caixas. Quantas tampinhas vão em cada caixa?", options: ["8", "9", "12"], answer: "9" },
        { q: "Na horta foram plantadas 25 mudas pela manhã e 18 à tarde. Quantas mudas foram plantadas?", options: ["38", "43", "53"], answer: "43" },
        { q: "A turma juntou 50 tampinhas e usou 17 em uma atividade. Quantas sobraram?", options: ["23", "33", "37"], answer: "33" }
    ],
    2: [
        { q: "Em um mutirão contra a dengue, 4 turmas eliminaram 28 focos cada uma. Quantos focos foram eliminados no total?", options: ["102", "112", "122"], answer: "112" },
        { q: "Byte tinha 300 mudas e já plantou 138. Quantas mudas ainda restam?", options: ["162", "172", "238"], answer: "162" },
        { q: "96 alunos formaram grupos de 8 pessoas. Quantos grupos foram formados?", options: ["10", "12", "14"], answer: "12" },
        { q: "Que horas o relógio está marcando?\n(ponteiro curto = horas, ponteiro longo = minutos)", clock: [7, 45], options: ["7h45", "8h45", "9h35"], answer: "7h45" },
        { q: "A oficina de reciclagem começou às 14h e terminou às 16h30. Quanto tempo ela durou?", options: ["2h", "2h30min", "3h30min"], answer: "2h30min" },
        { q: "Uma hora tem 60 minutos. Quantos minutos existem em 2 horas e meia?", options: ["120", "150", "180"], answer: "150" },
        { q: "Uma escola organizou 84 livros em 7 prateleiras iguais. Quantos livros ficaram em cada prateleira?", options: ["10", "12", "14"], answer: "12" },
        { q: "Cada equipe recolheu 8 kg de papel. Se 9 equipes participaram, quantos quilos foram recolhidos?", options: ["64 kg", "72 kg", "80 kg"], answer: "72 kg" }
    ],
    3: [
        { q: "Byte coletou 5 caixas com 24 garrafas cada e usou 35 garrafas em uma oficina. Quantas garrafas sobraram?", options: ["85", "95", "155"], answer: "85" },
        { q: "Um canteiro tem 9 fileiras com 15 mudas em cada uma. Quantas mudas há no canteiro?", options: ["125", "135", "145"], answer: "135" },
        { q: "Para reciclar 144 kg de papel, 6 turmas ajudaram igualmente. Quantos kg cada turma juntou?", options: ["22 kg", "24 kg", "26 kg"], answer: "24 kg" },
        { q: "Que horas o relógio está marcando?\n(ponteiro curto = horas, ponteiro longo = minutos)", clock: [10, 10], options: ["10h10", "2h50", "10h02"], answer: "10h10" },
        { q: "O ônibus da excursão ecológica saiu às 9h40 e a viagem durou 1h35min. A que horas ele chegou?", options: ["11h05", "11h15", "11h25"], answer: "11h15" },
        { q: "Byte começou a carregar a bateria às 15h50 e ela levou 25 minutos. A que horas terminou?", options: ["15h75", "16h15", "16h25"], answer: "16h15" },
        { q: "Uma equipe organizou 7 caixas com 18 garrafas cada. Quantas garrafas organizou?", options: ["116", "126", "136"], answer: "126" },
        { q: "168 sementes serão divididas igualmente em 7 canteiros. Quantas sementes vão em cada canteiro?", options: ["22", "24", "26"], answer: "24" }
    ]
};

// ==========================================================
// FASES  (coordenadas em pixels, x/y = canto superior esquerdo)
// ==========================================================
const levels = {
    1: {
        name: 'Pátio da Escola',
        width: 2000,
        spawn: { x: 90, y: 600 },
        platforms: [
            { x: 0, y: 660, w: 2000, h: 60 },
            { x: 160, y: 540, w: 180, h: 20 },
            { x: 760, y: 540, w: 160, h: 20 },
            { x: 980, y: 430, w: 160, h: 20 },
            { x: 1440, y: 540, w: 150, h: 20 },
            { x: 1650, y: 430, w: 150, h: 20 },
            { x: 1440, y: 320, w: 150, h: 20 },
            { x: 1780, y: 210, w: 170, h: 20 }
        ],
        hazards: [
            { type: 'fire', x: 540, w: 100 },
            { type: 'water', x: 1200, w: 100 }
        ],
        chips: [
            { x: 240, y: 620 }, { x: 590, y: 590 }, { x: 850, y: 620 }, { x: 1000, y: 620 }, { x: 1250, y: 590 }, { x: 1450, y: 620 }, { x: 1650, y: 620 }, { x: 1810, y: 620 }
        ],
        door: { x: 1865, y: 170 },
        signs: [
            { x: 170, y: 640, text: '← → andar\n↑ pular' },
            { x: 430, y: 640, text: 'Lava à frente!\n↓ troca para\nMódulo FOGO' },
            { x: 1090, y: 640, text: 'Água à frente!\n↓ troca para\nMódulo ÁGUA' }
        ]
    },
    2: {
        name: 'Laboratório Ecológico',
        width: 2000,
        spawn: { x: 90, y: 600 },
        platforms: [
            { x: 0, y: 660, w: 2000, h: 60 },
            { x: 140, y: 540, w: 150, h: 20 },
            { x: 580, y: 520, w: 160, h: 20 },
            { x: 1020, y: 540, w: 150, h: 20 },
            { x: 1230, y: 430, w: 150, h: 20 },
            { x: 1040, y: 320, w: 150, h: 20 },
            { x: 1620, y: 540, w: 130, h: 20 }
        ],
        hazards: [
            { type: 'fire', x: 820, w: 100 },
            { type: 'water', x: 1420, w: 100 }
        ],
        chips: [
            { x: 220, y: 620 }, { x: 600, y: 620 }, { x: 870, y: 590 }, { x: 1120, y: 620 }, { x: 1470, y: 590 }, { x: 1600, y: 620 }, { x: 1750, y: 620 }, { x: 1900, y: 620 }
        ],
        lever: { x: 1115, y: 320 },
        gate: { x: 1790, y: 0, w: 30, h: 660 },
        door: { x: 1900, y: 620 },
        signs: [
            { x: 725, y: 640, text: 'Lava!\n↓ Módulo FOGO' },
            { x: 1325, y: 640, text: 'Água!\n↓ Módulo ÁGUA' },
            { x: 1115, y: 262, text: 'Alavanca!' },
            { x: 1695, y: 640, text: 'Barreira de energia!\nProcure a alavanca' }
        ]
    },
    3: {
        name: 'Usina de Reciclagem',
        width: 2200,
        spawn: { x: 80, y: 600 },
        platforms: [
            { x: 0, y: 660, w: 2200, h: 60 },
            { x: 100, y: 540, w: 150, h: 20 },
            { x: 580, y: 530, w: 150, h: 20 },
            { x: 850, y: 430, w: 120, h: 20 },
            { x: 1220, y: 540, w: 150, h: 20 },
            { x: 1420, y: 430, w: 150, h: 20 },
            { x: 1230, y: 320, w: 150, h: 20 }
        ],
        hazards: [
            { type: 'fire', x: 400, w: 100 },
            { type: 'water', x: 1020, w: 100 }
        ],
        chips: [
            { x: 200, y: 620 }, { x: 450, y: 590 }, { x: 700, y: 620 }, { x: 900, y: 620 }, { x: 1070, y: 590 }, { x: 1300, y: 620 }, { x: 1550, y: 620 }, { x: 1800, y: 620 }
        ],
        lever: { x: 1305, y: 320 },
        gate: { x: 1740, y: 0, w: 30, h: 660 },
        door: { x: 2100, y: 620 },
        signs: [
            { x: 290, y: 640, text: 'Lava!\n↓ Módulo FOGO' },
            { x: 925, y: 640, text: 'Água!\n↓ Módulo ÁGUA' },
            { x: 1305, y: 262, text: 'Alavanca!' },
            { x: 1650, y: 500, text: 'Barreira de energia!\nUse a alavanca' },
        ]
    }
};

// Fase 4 e fase bônus reutilizam a estrutura visual da fase 3, com nomes e desafios próprios.
// A arquitetura pode receber mapas exclusivos depois sem alterar a progressão.

levels[4] = {
    name: 'Cidade Sustentável',
    width: 2200,
    spawn: { x: 80, y: 600 },

    platforms: [
        { x: 0, y: 660, w: 2200, h: 60 },
        { x: 180, y: 530, w: 150, h: 20 },
        { x: 450, y: 420, w: 150, h: 20 },
        { x: 760, y: 540, w: 160, h: 20 },
        { x: 1050, y: 430, w: 160, h: 20 },
        { x: 1370, y: 530, w: 150, h: 20 },
        { x: 1650, y: 410, w: 160, h: 20 },
        { x: 1900, y: 530, w: 150, h: 20 }
    ],

    hazards: [
        { type: 'water', x: 350, w: 90 },
        { type: 'fire', x: 650, w: 100 },
        { type: 'water', x: 1250, w: 100 },
        { type: 'fire', x: 1800, w: 90 }
    ],

    chips: [
        { x: 220, y: 490 },
        { x: 510, y: 380 },
        { x: 700, y: 620 },
        { x: 850, y: 500 },
        { x: 1100, y: 390 },
        { x: 1450, y: 490 },
        { x: 1700, y: 370 },
        { x: 2000, y: 490 }
    ],

    door: { x: 2100, y: 620 },

    signs: [
        { x: 350, y: 640, text: 'Água à frente!\nUse o Módulo ÁGUA' },
        { x: 650, y: 640, text: 'Lava à frente!\nUse o Módulo FOGO' },
        { x: 1250, y: 640, text: 'Cuidado com a água!' },
        { x: 1800, y: 640, text: 'Cuidado com a lava!' }
    ]
};

levels[5] = {
    name: 'Planeta dos Desafios',
    width: 2400,
    spawn: { x: 80, y: 600 },

    platforms: [
        { x: 0, y: 660, w: 2400, h: 60 },
        { x: 180, y: 530, w: 130, h: 20 },
        { x: 430, y: 420, w: 140, h: 20 },
        { x: 700, y: 530, w: 130, h: 20 },
        { x: 970, y: 400, w: 150, h: 20 },
        { x: 1260, y: 510, w: 140, h: 20 },
        { x: 1540, y: 390, w: 150, h: 20 },
        { x: 1830, y: 500, w: 140, h: 20 },
        { x: 2110, y: 380, w: 150, h: 20 }
    ],

    hazards: [
        { type: 'acid', x: 330, w: 80 },
        { type: 'fire', x: 600, w: 90 },
        { type: 'water', x: 890, w: 90 },
        { type: 'acid', x: 1160, w: 80 },
        { type: 'fire', x: 1450, w: 90 },
        { type: 'water', x: 1740, w: 90 },
        { type: 'acid', x: 2020, w: 80 }
    ],

    chips: [
        { x: 220, y: 490 },
        { x: 480, y: 380 },
        { x: 740, y: 490 },
        { x: 1020, y: 360 },
        { x: 1300, y: 470 },
        { x: 1590, y: 350 },
        { x: 1870, y: 460 },
        { x: 2160, y: 340 }
    ],

    door: { x: 2310, y: 620 },

    signs: [
        { x: 330, y: 640, text: 'Obstáculo espacial!\nPule por cima' },
        { x: 600, y: 640, text: 'Lava!\nMódulo FOGO' },
        { x: 890, y: 640, text: 'Água!\nMódulo ÁGUA' },
        { x: 1160, y: 640, text: 'Cuidado com o ácido!' },
        { x: 1450, y: 640, text: 'Lava!\nMódulo FOGO' },
        { x: 1740, y: 640, text: 'Água!\nMódulo ÁGUA' }
    ]
};


questionsByLevel[4] = [
    { q: 'Uma turma arrecadou 8 caixas com 24 livros cada. Quantos livros arrecadou?', options: ['182', '192', '202'], answer: '192' },
    { q: 'A escola tinha 450 folhas para reciclar e usou 175. Quantas sobraram?', options: ['265', '275', '285'], answer: '275' },
    { q: '72 sementes foram divididas igualmente entre 9 canteiros. Quantas por canteiro?', options: ['7', '8', '9'], answer: '8' },
    { q: 'A atividade começou às 13h25 e durou 1h40. Quando terminou?', options: ['14h55', '15h05', '15h15'], answer: '15h05' },
    { q: 'Há 12 equipes com 15 alunos em cada. Quantos alunos participam?', options: ['160', '170', '180'], answer: '180' },
    { q: 'Uma coleta tinha 360 latinhas. Foram separadas em 6 grupos iguais. Quantas por grupo?', options: ['50', '60', '70'], answer: '60' },
    { q: 'Uma escola montou 15 kits com 12 lápis cada. Quantos lápis foram usados?', options: ['170', '180', '190'], answer: '180' },
    { q: '540 folhas foram distribuídas igualmente entre 6 salas. Quantas folhas cada sala recebeu?', options: ['80', '90', '100'], answer: '90' }
];
questionsByLevel[5] = [
    { q: 'Desafio bônus: 3 turmas recolheram 125 tampinhas cada. Quantas tampinhas no total?', options: ['275', '375', '425'], answer: '375' },
    { q: 'Byte tem 240 sementes e planta 4/6 delas. Quantas sementes plantou?', options: ['120', '160', '180'], answer: '160' },
    { q: 'Uma trilha tem 1.250 metros. A equipe percorreu 875 metros. Quantos faltam?', options: ['325 m', '375 m', '425 m'], answer: '375 m' },
    { q: 'Uma oficina durou 2h15min e começou às 9h30. Quando terminou?', options: ['11h15', '11h45', '12h15'], answer: '11h45' },
    { q: 'Cinco equipes recolheram 48 kg de papel cada. Qual foi o total?', options: ['220 kg', '240 kg', '260 kg'], answer: '240 kg' },
    { q: 'Desafio criativo: 96 mudas serão divididas em 8 fileiras iguais. Quantas por fileira?', options: ['10', '12', '14'], answer: '12' },
    { q: 'Oito equipes recolheram 125 tampinhas cada. Quantas tampinhas foram recolhidas?', options: ['900', '1.000', '1.100'], answer: '1.000' },
    { q: 'Uma escola tinha 200 mudas e plantou três quartos delas. Quantas mudas foram plantadas?', options: ['100', '150', '175'], answer: '150' }
];

function getSavedProgress() {
    try { return JSON.parse(localStorage.getItem('aventuraMatematicaProgress') || '{"completedLevels":[],"score":0,"achievements":[]}'); }
    catch (_) { return { completedLevels: [], score: 0, achievements: [] }; }
}
function saveProgress() {
    const data = getSavedProgress();

    data.score = Math.max(Number(data.score) || 0, score);
    data.currentLevel = currentLevel;
    data.collectedChips = collectedChips;

    localStorage.setItem(
        'aventuraMatematicaProgress',
        JSON.stringify(data)
    );
}
function exitGame(scene) {
    if (!gameStarted || levelTransitioning) return;

    // Salva o progresso atual
    saveProgress();

    // Para a narração, se estiver acontecendo
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    // Pausa o jogo
    scene.physics.pause();
    gameStarted = false;

    // Esconde os controles de celular
    if (scene.mobileControlsElement) {
        scene.mobileControlsElement.style.display = 'none';
    }

    // Limpa a tela de confirmação
    const elements = [];

    const add = (obj) => {
        obj.setScrollFactor(0).setDepth(300);
        elements.push(obj);
        return obj;
    };

    add(scene.add.rectangle(
        GAME_W / 2, GAME_H / 2,
        GAME_W, GAME_H, 0x020617, 0.85
    ));

    add(scene.add.rectangle(
        GAME_W / 2, GAME_H / 2,
        540, 280, 0x0f172a, 1
    )).setStrokeStyle(4, 0x2dd4bf);

    add(scene.add.text(
        GAME_W / 2, GAME_H / 2 - 75,
        'Deseja sair da aventura?',
        {
            fontFamily: FONT,
            fontSize: '30px',
            color: '#ffffff',
            fontStyle: 'bold'
        }
    ).setOrigin(0.5));

    add(scene.add.text(
        GAME_W / 2, GAME_H / 2 - 20,
        'Seu progresso ficará salvo!',
        {
            fontFamily: FONT,
            fontSize: '22px',
            color: '#34d399'
        }
    ).setOrigin(0.5));

    const createButton = (x, text, color, callback) => {
        const btn = add(scene.add.rectangle(
            x, GAME_H / 2 + 65,
            190, 60, color
        )).setInteractive({ useHandCursor: true });

        add(scene.add.text(
            x, GAME_H / 2 + 65,
            text,
            {
                fontFamily: FONT,
                fontSize: '22px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5));

        btn.on('pointerdown', callback);
    };

    // Continuar jogando
    createButton(
        GAME_W / 2 - 110,
        'CONTINUAR',
        0x0d9488,
        () => {
            elements.forEach(e => e.destroy());
            gameStarted = true;
            scene.physics.resume();

            if (scene.mobileControlsElement) {
                scene.mobileControlsElement.style.display = 'flex';
            }
        }
    );

    // Confirmar saída
    createButton(
        GAME_W / 2 + 110,
        'SAIR',
        0xdc2626,
        () => {
            elements.forEach(e => e.destroy());

            // Limpa a pergunta aberta, se houver
            quizActive = false;
            window.location.reload();
        }
    );
}
function markLevelComplete(level) {
    const data = getSavedProgress();
    if (!data.completedLevels.includes(level)) data.completedLevels.push(level);
    data.score = Math.max(Number(data.score) || 0, score);
    data.currentLevel = level < 5 ? level + 1 : 1;
    if (level === 4 && !data.achievements.includes('Quatro fases concluídas')) data.achievements.push('Quatro fases concluídas');
    if (level === 5 && !data.achievements.includes('Mestre da Matemática')) data.achievements.push('Mestre da Matemática');
    localStorage.setItem('aventuraMatematicaProgress', JSON.stringify(data));
}
function setGameFont(active) {
    FONT = active ? 'Verdana, Arial, sans-serif' : 'Trebuchet MS, Verdana, Arial, sans-serif';
}
function speakText(text) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(String(text));
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
}

function preload() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

    // --- bloco sólido invisível (corpos de colisão) ---
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture('solid', 4, 4);
    g.clear();

    // --- céu em degradê ---
    const top = [11, 18, 32], bot = [18, 78, 92];
    for (let y = 0; y < GAME_H; y += 4) {
        const t = y / GAME_H;
        const r = Math.round(top[0] + (bot[0] - top[0]) * t);
        const gg = Math.round(top[1] + (bot[1] - top[1]) * t);
        const b = Math.round(top[2] + (bot[2] - top[2]) * t);
        g.fillStyle((r << 16) | (gg << 8) | b, 1);
        g.fillRect(0, y, 16, 4);
    }
    g.generateTexture('bg_sky', 16, GAME_H);
    g.clear();

    // --- estrelas ---
    for (let i = 0; i < 70; i++) {
        g.fillStyle(0xffffff, 0.25 + rnd() * 0.6);
        g.fillCircle(Math.floor(rnd() * 512), Math.floor(rnd() * 400), rnd() < 0.2 ? 2 : 1);
    }
    g.generateTexture('bg_stars', 512, 512);
    g.clear();

    // --- grade tecnológica sutil ---
    g.lineStyle(1, 0x5eead4, 0.07);
    g.strokeRect(0, 0, 128, 128);
    g.lineStyle(1, 0x5eead4, 0.04);
    g.lineBetween(64, 0, 64, 128);
    g.lineBetween(0, 64, 128, 64);
    g.generateTexture('bg_grid', 128, 128);
    g.clear();

    // --- skyline com prédios, árvores e turbinas eólicas ---
    let bx = 0;
    while (bx < 512) {
        let w = 40 + Math.floor(rnd() * 40);
        if (bx + w > 512) w = 512 - bx;
        const h = 50 + Math.floor(rnd() * 100);
        g.fillStyle(0x0f2a40, 1);
        g.fillRect(bx, 256 - h, w, h);
        g.fillStyle(0xfde68a, 0.35);
        for (let wy = 256 - h + 8; wy < 248; wy += 14) {
            for (let wx = bx + 6; wx < bx + w - 8; wx += 12) {
                if (rnd() < 0.55) g.fillRect(wx, wy, 4, 6);
            }
        }
        bx += w;
    }
    g.fillStyle(0x0b3b3a, 1);
    [60, 140, 230, 320, 410, 470].forEach(tx => {
        g.fillCircle(tx, 236, 18);
        g.fillCircle(tx + 14, 242, 14);
        g.fillRect(tx - 2, 240, 4, 16);
    });
    [150, 380].forEach(tx => {
        g.fillStyle(0x1e4a63, 1);
        g.fillRect(tx - 2, 96, 4, 160);
        g.lineStyle(3, 0x1e4a63, 1);
        g.lineBetween(tx, 96, tx - 26, 74);
        g.lineBetween(tx, 96, tx + 26, 74);
        g.lineBetween(tx, 96, tx, 62);
        g.fillCircle(tx, 96, 4);
    });
    g.generateTexture('bg_city', 512, 256);
    g.clear();

    // --- terra (plataformas) ---
    g.fillStyle(0x4b3a2e, 1);
    g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 22; i++) {
        g.fillStyle(rnd() < 0.5 ? 0x3b2d23 : 0x6b5545, 1);
        g.fillRect(Math.floor(rnd() * 58), Math.floor(rnd() * 58), 3 + Math.floor(rnd() * 5), 3 + Math.floor(rnd() * 4));
    }
    g.generateTexture('dirt', 64, 64);
    g.clear();

    // --- grama ---
    g.fillStyle(0x16a34a, 1);
    g.fillRect(0, 0, 64, 9);
    g.fillStyle(0x4ade80, 1);
    g.fillRect(0, 0, 64, 3);
    g.fillStyle(0x15803d, 1);
    [4, 20, 36, 52].forEach(x => g.fillTriangle(x, 8, x + 8, 8, x + 4, 15));
    g.generateTexture('grass', 64, 16);
    g.clear();

    // --- cano de metal (túneis) ---
    g.fillStyle(0x475569, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x64748b, 1);
    g.fillRect(0, 0, 6, 64);
    g.fillStyle(0x334155, 1);
    g.fillRect(58, 0, 6, 64);
    g.fillRect(0, 30, 64, 3);
    g.fillStyle(0x94a3b8, 1);
    [[12, 8], [52, 8], [12, 44], [52, 44]].forEach(p => g.fillCircle(p[0], p[1], 2));
    g.generateTexture('pipe', 64, 64);
    g.clear();

    // --- poças: lava, água e ácido ---
    const makeHazard = (key, base, mid, topC, spark) => {
        g.fillStyle(base, 1); g.fillRect(0, 0, 64, 32);
        g.fillStyle(mid, 1); g.fillRect(0, 6, 64, 12);
        g.fillStyle(topC, 1); g.fillRect(0, 0, 64, 5);
        g.fillStyle(spark, 0.85);
        g.fillCircle(14, 11, 4); g.fillCircle(46, 16, 3); g.fillCircle(30, 8, 2);
        g.generateTexture(key, 64, 32);
        g.clear();
    };
    makeHazard('hz_fire', 0x991b1b, 0xea580c, 0xfbbf24, 0xfde047);
    makeHazard('hz_water', 0x1e3a8a, 0x2563eb, 0x7dd3fc, 0xe0f2fe);
    makeHazard('hz_acid', 0x365314, 0x65a30d, 0xbef264, 0xecfccb);

    // --- barreira de energia ---
    g.fillStyle(0x083344, 1);
    g.fillRect(0, 0, 32, 64);
    g.fillStyle(0x22d3ee, 0.5);
    g.fillRect(3, 0, 2, 64);
    g.fillRect(27, 0, 2, 64);
    g.fillStyle(0x67e8f9, 1);
    g.fillRect(14, 0, 4, 64);
    g.fillStyle(0xcffafe, 1);
    g.fillRect(10, 10, 12, 3);
    g.fillRect(10, 38, 12, 3);
    g.generateTexture('energy', 32, 64);
    g.clear();

    // --- brilho suave ---
    for (let i = 0; i < 10; i++) {
        g.fillStyle(0xffffff, 0.07);
        g.fillCircle(32, 32, 32 - i * 3);
    }
    g.generateTexture('glow', 64, 64);
    g.clear();

    // --- chip de energia (item) ---
    g.fillStyle(0xd1d5db, 1);
    for (let i = 0; i < 4; i++) {
        g.fillRect(7 + i * 7, 0, 3, 6);
        g.fillRect(7 + i * 7, 28, 3, 6);
        g.fillRect(0, 7 + i * 7, 6, 3);
        g.fillRect(28, 7 + i * 7, 6, 3);
    }
    g.fillStyle(0xfbbf24, 1);
    g.fillRoundedRect(5, 5, 24, 24, 5);
    g.fillStyle(0xb45309, 1);
    g.fillRoundedRect(9, 9, 16, 16, 3);
    g.fillStyle(0xfde68a, 1);
    g.fillRoundedRect(12, 12, 10, 10, 2);
    g.generateTexture('chip', 34, 34);
    g.clear();

    // --- porta fechada ---
    g.fillStyle(0x1e293b, 1); g.fillRoundedRect(0, 0, 56, 80, 8);
    g.fillStyle(0x0f172a, 1); g.fillRoundedRect(6, 6, 44, 68, 5);
    g.fillStyle(0x334155, 1); g.fillRect(10, 10, 36, 28); g.fillRect(10, 42, 36, 28);
    g.fillStyle(0xfca5a5, 1); g.fillCircle(28, 40, 7);
    g.fillStyle(0xef4444, 1); g.fillCircle(28, 40, 5);
    g.generateTexture('door_closed', 56, 80);
    g.clear();

    // --- porta aberta ---
    g.fillStyle(0x064e3b, 1); g.fillRoundedRect(0, 0, 56, 80, 8);
    g.fillStyle(0x10b981, 1); g.fillRoundedRect(6, 6, 44, 68, 5);
    g.fillStyle(0x6ee7b7, 1); g.fillRoundedRect(12, 12, 32, 56, 16);
    g.fillStyle(0xffffff, 1); g.fillRoundedRect(20, 20, 16, 40, 8);
    g.generateTexture('door_open', 56, 80);
    g.clear();

    // --- alavanca ---
    const makeLever = (key, on) => {
        g.fillStyle(0x475569, 1); g.fillRoundedRect(4, 38, 36, 10, 3);
        g.fillStyle(0x0f172a, 1); g.fillRect(12, 40, 20, 4);
        g.lineStyle(6, 0x94a3b8, 1);
        g.lineBetween(22, 40, on ? 34 : 10, 14);
        g.fillStyle(on ? 0x22c55e : 0xef4444, 1);
        g.fillCircle(on ? 34 : 10, 12, 8);
        g.generateTexture(key, 44, 48);
        g.clear();
    };
    makeLever('lever_off', false);
    makeLever('lever_on', true);

    // --- robô Byte (dois módulos) ---
    const makeByte = (key, accent, accentDark, eye) => {
        g.fillStyle(0x94a3b8, 1); g.fillRect(21, 3, 2, 9);
        g.fillStyle(accent, 1); g.fillCircle(22, 4, 4);
        g.fillStyle(0xcbd5e1, 1); g.fillRoundedRect(5, 11, 34, 22, 8);
        g.fillStyle(0xe2e8f0, 1); g.fillRoundedRect(7, 12, 30, 6, 4);
        g.fillStyle(accentDark, 1); g.fillRoundedRect(1, 17, 5, 11, 2); g.fillRoundedRect(38, 17, 5, 11, 2);
        g.fillStyle(0x0f172a, 1); g.fillRoundedRect(9, 16, 26, 14, 6);
        g.fillStyle(eye, 1); g.fillRoundedRect(14, 20, 6, 6, 2); g.fillRoundedRect(25, 20, 6, 6, 2);
        g.fillStyle(accent, 1); g.fillRoundedRect(8, 34, 28, 18, 6);
        g.fillStyle(accentDark, 1); g.fillRect(8, 47, 28, 3);
        g.fillStyle(0x0f172a, 1); g.fillRoundedRect(14, 38, 16, 9, 3);
        g.fillStyle(eye, 1); g.fillCircle(22, 42, 3);
        g.fillStyle(0x94a3b8, 1); g.fillRoundedRect(2, 36, 6, 13, 3); g.fillRoundedRect(36, 36, 6, 13, 3);
        g.fillStyle(0x475569, 1); g.fillRoundedRect(9, 51, 13, 9, 3); g.fillRoundedRect(22, 51, 13, 9, 3);
        g.generateTexture(key, 44, 60);
        g.clear();
    };
    makeByte('byte_water', 0x2563eb, 0x1d4ed8, 0x7dd3fc);
    makeByte('byte_fire', 0xea580c, 0xc2410c, 0xfde047);
}

// ==========================================================
// CREATE
// ==========================================================
function create() {
    const scene = this;

    // ----- fundo em camadas (parallax) -----
    bgSky = this.add.image(0, 0, 'bg_sky')
        .setOrigin(0, 0)
        .setDisplaySize(GAME_W, GAME_H)
        .setScrollFactor(0)
        .setDepth(-20); bgStars = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg_stars').setOrigin(0, 0).setScrollFactor(0).setDepth(-19);
    bgGrid = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg_grid').setOrigin(0, 0).setScrollFactor(0).setDepth(-18);
    bgCity = this.add.tileSprite(0, GAME_H - 256, GAME_W, 256, 'bg_city').setOrigin(0, 0).setScrollFactor(0).setDepth(-17);
    bgCity.setVisible(false);

    // ----- controles -----
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys('W,A,S,D', false);    //this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    createMobileControls(this);
    // ----- física -----
    platforms = this.physics.add.staticGroup();
    items = this.physics.add.group({ allowGravity: false, immovable: true });

    door = this.physics.add.sprite(0, 0, 'door_closed').setDepth(5);
    door.body.setAllowGravity(false);
    door.setImmovable(true);
    door.body.setSize(40, 76);

    doorGlow = this.add.image(0, 0, 'glow').setTint(0x34d399).setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(4).setScale(2.6).setAlpha(0);

    doorLabel = this.add.text(0, 0, 'SAÍDA', {
        fontFamily: FONT, fontSize: '14px', color: '#e2e8f0', fontStyle: 'bold'
    }).setOrigin(0.5, 1).setDepth(6);

    player = this.physics.add.sprite(90, 600, 'byte_water').setDepth(10);
    player.setBounce(0.05);
    player.setCollideWorldBounds(true);
    player.body.setSize(26, 52);
    player.body.setOffset(9, 8);

    aura = this.add.circle(0, 0, 36, 0x38bdf8, 0.22).setDepth(9);
    this.tweens.add({ targets: aura, scale: 1.18, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.physics.add.collider(player, platforms);
    this.physics.add.overlap(player, items, collectItem, null, this);
    this.physics.add.overlap(player, door, enterDoor, null, this);

    // ----- HUD -----
    this.add.rectangle(0, 0, GAME_W, 56, 0x020617, 0.85)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(90);

    this.add.rectangle(0, 56, GAME_W, 3, 0x2dd4bf, 0.8)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(90);

    levelText = this.add.text(20, 14, '', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#34d399',
        fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(91);

    scoreText = this.add.text(600, 14, 'Pontos: 0', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#38bdf8',
        fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(91);

    chipsText = this.add.text(780, 14, 'Chips: 0/0', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#fbbf24',
        fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(91);

    // Indicador do módulo
    modeText = this.add.text(1260, 14, 'MÓDULO ÁGUA', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#7dd3fc',
        fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(91);

    modeDot = this.add.circle(1050, 29, 10, 0x38bdf8, 1)
        .setScrollFactor(0)
        .setDepth(91);

    // ----- BOTÃO SAIR -----
    const exitButton = this.add.rectangle(
        975, 29, 100, 34, 0xdc2626
    )
        .setScrollFactor(0)
        .setDepth(92)
        .setInteractive({ useHandCursor: true });

    const exitLabel = this.add.text(975, 29, '🚪 SAIR', {
        fontFamily: FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
    })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(93);

    exitButton.on('pointerdown', () => {
        exitGame(scene);
    });
    // ----- câmera -----
    this.cameras.main.startFollow(player, true, 0.12, 0.12);

    loadLevel.call(this, currentLevel);

    // ----- tela inicial -----
    this.physics.pause();
    buildIntro(scene);
}
function createMobileControls(scene) {
    // Evita criar os controles mais de uma vez
    if (mobileControlsElement) {
        mobileControlsElement.remove();
    }

    const isTouchDevice =
        window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth <= 1024;

    if (!isTouchDevice) return;

    const container = document.createElement('div');
    container.id = 'mobile-controls';

    container.innerHTML = `
        <div class="mobile-control-group mobile-movement">
            <button type="button" class="mobile-btn" data-control="left"
                aria-label="Andar para a esquerda">◀</button>

            <button type="button" class="mobile-btn" data-control="right"
                aria-label="Andar para a direita">▶</button>
        </div>

        <div class="mobile-control-group mobile-actions">
            <button type="button" class="mobile-btn mobile-jump"
                data-control="jump" aria-label="Pular">⬆</button>

            <button type="button" class="mobile-btn mobile-switch"
                data-control="switch" aria-label="Trocar módulo">🔄</button>
        </div>
    `;

    document.body.appendChild(container);
    mobileControlsElement = container;

    const buttons = container.querySelectorAll('[data-control]');

    buttons.forEach((button) => {
        const control = button.dataset.control;

        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            event.stopPropagation();

            button.setPointerCapture(event.pointerId);

            if (control === 'switch') {
                touchControls.switchPressed = true;
            } else {
                touchControls[control] = true;
            }

            button.classList.add('pressed');
        });

        const release = (event) => {
            event.preventDefault();

            if (control !== 'switch') {
                touchControls[control] = false;
            }

            button.classList.remove('pressed');
        };

        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('lostpointercapture', release);
    });

    // Os controles aparecem somente quando a partida começa.
    container.style.display = 'none';

    // Guarda a referência para a função de início da partida.
    scene.mobileControlsElement = container;
}
// ==========================================================
// TELA INICIAL
// ==========================================================
function buildIntro(scene) {
    const cx = GAME_W / 2;
    const add = (o) => { o.setScrollFactor(0).setDepth(200); introEls.push(o); return o; };
    const txt = (x, y, s, size, color, bold) => add(scene.add.text(x, y, s, {
        fontFamily: FONT, fontSize: size + 'px', color: color, fontStyle: bold ? 'bold' : 'normal', align: 'center'
    }).setOrigin(0.5));

    add(scene.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x020617, 0.93));
    txt(cx, 90, 'AVENTURA MATEMÁTICA 2D', 52, '#2dd4bf', true);
    txt(cx, 148, 'A Missão de Byte', 30, '#e2e8f0', true);

    add(scene.add.image(cx - 150, 270, 'byte_water').setScale(2.4));
    add(scene.add.image(cx + 150, 270, 'byte_fire').setScale(2.4));
    txt(cx - 150, 360, 'Módulo ÁGUA', 20, '#7dd3fc', true);
    txt(cx + 150, 360, 'Módulo FOGO', 20, '#fb923c', true);
    txt(cx, 270, '↓', 46, '#fbbf24', true);

    txt(cx, 440, '←  →  andar        ↑  pular        ↓  trocar o módulo do Byte', 24, '#ffffff', true);
    txt(cx, 490, 'Módulo FOGO atravessa a lava.   Módulo ÁGUA atravessa a água.', 22, '#cbd5e1', false);
    txt(cx, 525, 'O ácido verde é perigoso para os dois: pule por cima!', 22, '#bef264', false);
    txt(cx, 560, 'Colete todos os chips, vença os desafios de matemática e chegue à porta.', 22, '#cbd5e1', false);

    const prompt = txt(cx, 636, 'Clique ou pressione ESPAÇO para começar', 28, '#fbbf24', true);
    scene.tweens.add({ targets: prompt, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    let started = false;
    const start = () => {
        if (started) return;
        started = true;
        scene.input.off('pointerdown', start);
        scene.input.keyboard.off('keydown-SPACE', start);
        scene.input.keyboard.off('keydown-ENTER', start);
        introEls.forEach(o => { scene.tweens.killTweensOf(o); o.destroy(); });
        introEls = [];
        gameStarted = true;

        if (scene.mobileControlsElement) {
            scene.mobileControlsElement.style.display = 'flex';
        }

        scene.physics.resume();
    };
    window.startAventuraGame = start;
    scene.input.on('pointerdown', start);
    scene.input.keyboard.on('keydown-SPACE', start);
    scene.input.keyboard.on('keydown-ENTER', start);
}

// ==========================================================
// UPDATE
// ==========================================================
function update() {
    const cam = this.cameras.main;
    bgStars.tilePositionX = cam.scrollX * 0.05;
    bgGrid.tilePositionX = cam.scrollX * 0.15;
    bgCity.tilePositionX = cam.scrollX * 0.3;

    hazardVisuals.forEach(h => { h.tile.tilePositionX += h.speed; });
    if (gate && !gate.open) gate.visual.tilePositionY -= 1.2;

    aura.setPosition(player.x, player.y + 4);

    if (!gameStarted || quizActive || levelTransitioning || respawning) {
        player.setVelocityX(0);
        return;
    }
    // ----- trocar módulo (seta para baixo / S / botão de toque) -----
    const trocarModulo =
        Phaser.Input.Keyboard.JustDown(cursors.down) ||
        Phaser.Input.Keyboard.JustDown(keys.S) ||
        touchControls.switchPressed;

    if (trocarModulo) {
        setMode(this, playerMode === 'water' ? 'fire' : 'water', false);
        touchControls.switchPressed = false;
    }

    // ----- movimento -----
    const left =
        cursors.left.isDown ||
        keys.A.isDown ||
        touchControls.left;

    const right =
        cursors.right.isDown ||
        keys.D.isDown ||
        touchControls.right;

    const jump =
        cursors.up.isDown ||
        keys.W.isDown ||
        touchControls.jump;

    if (left) {
        player.setVelocityX(-PLAYER_SPEED);
        player.setFlipX(true);
    } else if (right) {
        player.setVelocityX(PLAYER_SPEED);
        player.setFlipX(false);
    } else {
        player.setVelocityX(0);
    }

    if (jump && player.body.touching.down) {
        player.setVelocityY(JUMP_FORCE);
        burst(this, player.x, player.y + 28, 0x94a3b8, 6);
    }

    checkHazards(this);
    checkLever(this);
}
// ==========================================================
// MÓDULO ÁGUA / FOGO
// ==========================================================
function setMode(scene, mode, silent) {
    playerMode = mode;
    const fire = mode === 'fire';
    player.setTexture(fire ? 'byte_fire' : 'byte_water');
    aura.setFillStyle(fire ? 0xf97316 : 0x38bdf8, 0.22);
    modeText.setText(fire ? 'MÓDULO FOGO' : 'MÓDULO ÁGUA');
    modeText.setColor(fire ? '#fb923c' : '#7dd3fc');
    modeDot.setFillStyle(fire ? 0xf97316 : 0x38bdf8, 1);
    if (!silent) burst(scene, player.x, player.y, fire ? 0xf97316 : 0x38bdf8, 18);
}

// ==========================================================
// PERIGOS
// ==========================================================
function checkHazards(scene) {
    const b = player.body;
    for (let i = 0; i < hazards.length; i++) {
        const h = hazards[i];
        const touching = b.right > h.x + 10 && b.left < h.x + h.w - 10 &&
            b.bottom > h.y + 5 && b.top < h.y + h.h;
        if (!touching) continue;

        const safe = (h.type === 'fire' && playerMode === 'fire') ||
            (h.type === 'water' && playerMode === 'water');
        if (!safe) {
            killPlayer(scene, h);
            return;
        }
    }
}

function killPlayer(scene, h) {
    respawning = true;
    burst(scene, player.x, player.y, HZ_COLOR[h.type], 26);
    player.setVelocity(0, 0);
    player.setVisible(false);
    aura.setVisible(false);

    const msgs = {
        fire: 'Ops! Vamos tentar de novo. Troque para o Módulo FOGO antes de passar pela lava.',
        water: 'Quase lá! Troque para o Módulo ÁGUA antes de atravessar a água.',
        acid: 'Tudo bem! Pule sobre o obstáculo e tente novamente.'
    };
    showMessage(scene, msgs[h.type], '#fbbf24', 2400);

    scene.time.delayedCall(650, () => {
        player.setPosition(Math.max(spawnPoint.x, h.x - 100), 590);
        player.setVelocity(0, 0);
        player.setVisible(true);
        aura.setVisible(true);
        respawning = false;
    });
}

// ==========================================================
// ALAVANCA E BARREIRA
// ==========================================================
function checkLever(scene) {
    if (!lever || lever.on) return;
    const b = player.body;
    if (b.right > lever.x - 22 && b.left < lever.x + 22 &&
        b.bottom > lever.y - 46 && b.top < lever.y + 4) {
        activateLever(scene);
    }
}

function activateLever(scene) {
    lever.on = true;
    lever.sprite.setTexture('lever_on');
    burst(scene, lever.x, lever.y - 30, 0x22c55e, 18);

    if (gate) {
        gate.open = true;
        gate.body.body.enable = false;
        scene.tweens.add({
            targets: [gate.visual, gate.halo],
            alpha: 0,
            duration: 700,
            onComplete: () => { gate.visual.setVisible(false); gate.halo.setVisible(false); }
        });
        showMessage(scene, 'Alavanca ativada! A barreira de energia foi desligada!', '#22d3ee', 2600);
    }
}


function buildLevelScenery(scene, level) {
    const g = scene.add.graphics();
    g.setDepth(-16);
    g.setScrollFactor(0.35);

    sceneryObjects.push(g);

    // Cores diferentes para cada fase
    const themes = {
        1: { sky: 0xffffff, grid: 0x5eead4 }, // Escola
        2: { sky: 0xc7e9ff, grid: 0x38bdf8 }, // Laboratório
        3: { sky: 0xffdfb5, grid: 0xf97316 }, // Usina
        4: { sky: 0xc7f9cc, grid: 0x22c55e }, // Cidade sustentável
        5: { sky: 0xd8c8ff, grid: 0xa78bfa }  // Espaço
    };

    bgSky.setTint(themes[level].sky);
    bgGrid.setTint(themes[level].grid);

    if (level === 1) {
        // PÁTIO DA ESCOLA
        g.fillStyle(0xfacc15, 0.9);
        g.fillCircle(1800, 130, 65);

        // Prédios da escola
        [150, 650, 1250, 1800].forEach((x, i) => {
            g.fillStyle(0x2563eb, 0.85);
            g.fillRect(x, 310, 220, 350);

            g.fillStyle(0xfef3c7, 1);
            for (let wx = x + 25; wx < x + 200; wx += 55) {
                for (let wy = 350; wy < 590; wy += 65) {
                    g.fillRect(wx, wy, 25, 30);
                }
            }
        });

        // Árvores
        [450, 1000, 1550].forEach(x => {
            g.fillStyle(0x854d0e, 1);
            g.fillRect(x, 470, 25, 190);
            g.fillStyle(0x16a34a, 1);
            g.fillCircle(x + 12, 440, 65);
        });

    } else if (level === 2) {
        // LABORATÓRIO ECOLÓGICO
        [150, 650, 1200, 1750].forEach((x, i) => {
            g.fillStyle(0x334155, 0.95);
            g.fillRoundedRect(x, 250, 250, 410, 18);

            g.fillStyle(i % 2 ? 0x38bdf8 : 0x2dd4bf, 0.5);
            g.fillRoundedRect(x + 25, 290, 200, 140, 12);

            g.fillStyle(0x94a3b8, 1);
            g.fillRect(x + 35, 470, 180, 12);

            g.fillStyle(0x0ea5e9, 0.7);
            g.fillCircle(x + 125, 350, 35);
        });

        // Tubulações
        g.lineStyle(16, 0x64748b, 1);
        g.lineBetween(0, 220, 2200, 220);
        g.lineBetween(500, 220, 500, 480);
        g.lineBetween(1500, 220, 1500, 480);

    } else if (level === 3) {
        // USINA DE RECICLAGEM
        [150, 750, 1400, 1900].forEach(x => {
            g.fillStyle(0x475569, 1);
            g.fillRect(x, 300, 260, 360);

            g.fillStyle(0xf97316, 1);
            g.fillRect(x + 30, 340, 200, 18);

            g.fillStyle(0x94a3b8, 1);
            g.fillRect(x + 45, 390, 170, 110);

            g.fillStyle(0x1e293b, 1);
            g.fillRect(x + 65, 415, 130, 60);
        });

        // Chaminés
        [350, 1000, 1650].forEach(x => {
            g.fillStyle(0x64748b, 1);
            g.fillRect(x, 100, 65, 250);

            g.fillStyle(0x94a3b8, 1);
            g.fillCircle(x + 32, 90, 40);
        });

        // Esteira
        g.fillStyle(0x1e293b, 1);
        g.fillRect(0, 580, 2200, 25);

    } else if (level === 4) {
        // CIDADE SUSTENTÁVEL
        [100, 550, 1050, 1600].forEach((x, i) => {
            const h = [280, 380, 320, 420][i];

            g.fillStyle(0x0f766e, 0.9);
            g.fillRect(x, 660 - h, 230, h);

            g.fillStyle(0xa7f3d0, 1);
            for (let wx = x + 25; wx < x + 210; wx += 45) {
                for (let wy = 660 - h + 30; wy < 630; wy += 55) {
                    g.fillRect(wx, wy, 20, 25);
                }
            }

            // Painéis solares
            g.fillStyle(0x1d4ed8, 1);
            g.fillRect(x + 25, 660 - h - 35, 180, 25);
        });

        // Árvores
        [400, 900, 1450, 2050].forEach(x => {
            g.fillStyle(0x854d0e, 1);
            g.fillRect(x, 530, 20, 130);

            g.fillStyle(0x22c55e, 1);
            g.fillCircle(x + 10, 500, 55);
        });

        // Turbinas eólicas
        [800, 1300, 1950].forEach(x => {
            g.lineStyle(8, 0xe2e8f0, 1);
            g.lineBetween(x, 150, x, 520);

            g.lineStyle(7, 0xffffff, 1);
            g.lineBetween(x, 150, x - 65, 80);
            g.lineBetween(x, 150, x + 65, 80);
            g.lineBetween(x, 150, x, 235);
        });

    } else if (level === 5) {
        // PLANETA DOS DESAFIOS
        g.fillStyle(0x7c3aed, 0.8);
        g.fillCircle(1750, 240, 150);

        g.lineStyle(20, 0xc4b5fd, 0.9);
        g.strokeEllipse(1750, 240, 390, 100);

        // Planetas menores
        g.fillStyle(0xf472b6, 0.9);
        g.fillCircle(350, 250, 75);

        g.fillStyle(0x38bdf8, 0.9);
        g.fillCircle(1050, 180, 100);

        g.fillStyle(0xfbbf24, 1);
        [150, 650, 900, 1350, 2050].forEach((x, i) => {
            g.fillStar(x, 120 + (i % 2) * 100, 5, 12, 28);
        });

        // Ilhas espaciais
        [250, 800, 1350, 1850].forEach(x => {
            g.fillStyle(0x6d28d9, 0.9);
            g.fillEllipse(x, 570, 190, 55);

            g.fillStyle(0xa78bfa, 1);
            g.fillEllipse(x, 550, 190, 30);
        });
    }
}

// CARREGAR FASE
function loadLevel(level) {
    const scene = this;
    const data = levels[level];

    // ----- limpeza da fase anterior -----
    levelObjects.forEach(o => { scene.tweens.killTweensOf(o); o.destroy(); });
    levelObjects = [];
    levelEvents.forEach(e => e.remove(false));
    levelEvents = [];
    items.getChildren().forEach(i => scene.tweens.killTweensOf(i));
    items.clear(true, true);
    platforms.clear(true, true);
    scene.tweens.killTweensOf(doorGlow);
    doorGlow.setAlpha(0);

    hazards = [];
    hazardVisuals = [];
    gate = null;
    lever = null;
    doorOpen = false;
    quizActive = false;
    respawning = false;
    collectedChips = 0;
    totalChips = data.chips.length;

    // Remove o cenário anterior
    sceneryObjects.forEach(o => o.destroy());
    sceneryObjects = [];

    prepareQuestions(level);

    // ----- mundo e câmera -----
    scene.physics.world.setBounds(0, 0, data.width, GAME_H);
    scene.cameras.main.setBounds(0, 0, data.width, GAME_H);
    scene.cameras.main.scrollX = 0;
    buildLevelScenery(scene, level);

    // ----- plataformas (inclui túneis gerados pelas poças) -----
    const plats = data.platforms.slice();
    data.hazards.forEach(h => {
        if (h.tunnel) plats.push({ x: h.x, y: 0, w: h.w, h: PIPE_BOTTOM, kind: 'pipe', glow: HZ_COLOR[h.type] });
    });
    plats.forEach(p => buildPlatform(scene, p));

    // ----- poças -----
    data.hazards.forEach(h => {
        const y = FLOOR_Y - HAZ_H;
        const rect = { type: h.type, x: h.x, y: y, w: h.w, h: HAZ_H };
        hazards.push(rect);

        const tile = scene.add.tileSprite(h.x, y, h.w, HAZ_H, 'hz_' + h.type).setOrigin(0, 0).setDepth(7);
        const halo = scene.add.rectangle(h.x, y - 10, h.w, 10, HZ_COLOR[h.type], 0.22).setOrigin(0, 0)
            .setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
        levelObjects.push(tile, halo);
        hazardVisuals.push({ tile: tile, speed: h.type === 'acid' ? 0.35 : 0.7 });

        levelEvents.push(scene.time.addEvent({
            delay: 280,
            loop: true,
            callback: () => spawnBubble(scene, rect)
        }));
    });

    // ----- barreira + alavanca -----
    if (data.gate) {
        const gd = data.gate;
        const gBody = platforms.create(gd.x + gd.w / 2, gd.y + gd.h / 2, 'solid');
        gBody.setDisplaySize(gd.w, gd.h).refreshBody();
        gBody.setVisible(false);
        const gVisual = scene.add.tileSprite(gd.x, gd.y, gd.w, gd.h, 'energy').setOrigin(0, 0).setDepth(7).setAlpha(0.9);
        const gHalo = scene.add.rectangle(gd.x - 8, gd.y, gd.w + 16, gd.h, 0x22d3ee, 0.16).setOrigin(0, 0)
            .setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
        levelObjects.push(gVisual, gHalo);
        gate = { body: gBody, visual: gVisual, halo: gHalo, open: false };
    }
    if (data.lever) {
        const spr = scene.add.image(data.lever.x, data.lever.y, 'lever_off').setOrigin(0.5, 1).setDepth(8);
        levelObjects.push(spr);
        lever = { x: data.lever.x, y: data.lever.y, on: false, sprite: spr };
    }

    // ----- placas de dica -----
    data.signs.forEach(s => {
        const t = scene.add.text(s.x, s.y, s.text, {
            fontFamily: FONT, fontSize: '16px', color: '#e2e8f0', align: 'center',
            backgroundColor: '#0f172a', padding: { x: 8, y: 5 }
        }).setOrigin(0.5, 1).setDepth(8).setAlpha(0.95);
        levelObjects.push(t);
    });

    // ----- chips -----
    data.chips.forEach((c, i) => {
        const glow = scene.add.image(c.x, c.y, 'glow').setTint(0xfde047).setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(8).setAlpha(0.8).setScale(1.1);
        const chip = items.create(c.x, c.y, 'chip').setDepth(9);
        chip.glow = glow;
        levelObjects.push(glow);
        scene.tweens.add({
            targets: [chip, glow],
            y: '-=9',
            duration: 900,
            delay: i * 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    });

    // ----- porta -----
    door.setTexture('door_closed');
    door.setPosition(data.door.x, data.door.y);
    door.body.updateFromGameObject();
    doorGlow.setPosition(data.door.x, data.door.y);
    doorLabel.setPosition(data.door.x, data.door.y - 46);

    // ----- jogador -----
    spawnPoint = { x: data.spawn.x, y: data.spawn.y };
    player.setPosition(spawnPoint.x, spawnPoint.y);
    player.setVelocity(0, 0);
    player.setVisible(true);
    aura.setVisible(true);
    setMode(scene, 'water', true);

    updateHud();
}

function buildPlatform(scene, p) {
    const body = platforms.create(p.x + p.w / 2, p.y + p.h / 2, 'solid');
    body.setDisplaySize(p.w, p.h).refreshBody();
    body.setVisible(false);

    if (p.kind === 'pipe') {
        const ts = scene.add.tileSprite(p.x, p.y, p.w, p.h, 'pipe').setOrigin(0, 0).setDepth(5);
        const rim = scene.add.rectangle(p.x, p.y + p.h - 8, p.w, 8, 0x1e293b, 1).setOrigin(0, 0).setDepth(6);
        const light = scene.add.rectangle(p.x + 10, p.y + p.h - 14, p.w - 20, 4, p.glow || 0xffffff, 0.95)
            .setOrigin(0, 0).setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
        levelObjects.push(ts, rim, light);
    } else {
        const ts = scene.add.tileSprite(p.x, p.y, p.w, p.h, 'dirt').setOrigin(0, 0).setDepth(5);
        const grass = scene.add.tileSprite(p.x, p.y - 2, p.w, 10, 'grass').setOrigin(0, 0).setDepth(6);
        levelObjects.push(ts, grass);
    }
}

function spawnBubble(scene, h) {
    const c = scene.add.circle(
        h.x + Phaser.Math.Between(8, h.w - 8), h.y + h.h - 4,
        Phaser.Math.Between(2, 4), HZ_COLOR[h.type], 0.8
    ).setDepth(8);
    scene.tweens.add({
        targets: c,
        y: h.y - Phaser.Math.Between(14, 36),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1100),
        onComplete: () => c.destroy()
    });
}

// ==========================================================
// CHIPS, PORTA E TRANSIÇÕES
// ==========================================================
function prepareQuestions(level) {
    // Cada fase possui oito perguntas; a ordem muda a cada partida.
    questionDeck = Phaser.Utils.Array.Shuffle([...questionsByLevel[level]]);
}

function collectItem(playerObj, item) {
    if (quizActive || levelTransitioning || respawning || !gameStarted) return;

    burst(this, item.x, item.y, 0xfde047, 14);
    this.tweens.killTweensOf(item);
    if (item.glow) item.glow.destroy();
    item.disableBody(true, true);

    quizActive = true;
    player.setVelocityX(0);

    if (questionDeck.length === 0) prepareQuestions(currentLevel);
    showQuizModal.call(this, questionDeck.pop());
}

function enterDoor() {
    if (!doorOpen || quizActive || levelTransitioning || respawning) return;

    levelTransitioning = true;
    const scene = this;
    const cam = scene.cameras.main;

    markLevelComplete(currentLevel);
    if (currentLevel < maxLevels) {
        showMessage(scene, `Muito bem! Fase ${currentLevel} concluída!`, '#34d399', 1600);
        scene.time.delayedCall(1300, () => cam.fadeOut(400, 11, 18, 32));
        scene.time.delayedCall(1750, () => {
            currentLevel++;
            loadLevel.call(scene, currentLevel);
            cam.fadeIn(400, 11, 18, 32);
            announceLevel(scene);
            levelTransitioning = false;
        });
    } else if (currentLevel === maxLevels) {
        showMessage(scene, 'Você concluiu as 4 fases! A fase bônus foi liberada!', '#fbbf24', 3000);
        scene.time.delayedCall(2400, () => cam.fadeOut(400, 11, 18, 32));
        scene.time.delayedCall(2850, () => {
            currentLevel = 5;
            loadLevel.call(scene, currentLevel);
            cam.fadeIn(400, 11, 18, 32);
            announceLevel(scene);
            levelTransitioning = false;
        });
    } else {
        saveProgress();

        scene.time.delayedCall(800, () => {
            showEndScreen(scene);
        });
    }
}

function showEndScreen(scene) {
    levelTransitioning = true;

    // Fundo da tela final
    const overlayItems = [];

    const fundo = scene.add.rectangle(
        640, 360, 1280, 720, 0x06152e, 0.97
    )
        .setScrollFactor(0)
        .setDepth(1000)
        .setInteractive();

    overlayItems.push(fundo);

    // Título
    overlayItems.push(
        scene.add.text(640, 65, 'MISSÃO CONCLUÍDA!', {
            fontFamily: FONT,
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#fbbf24',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
    );

    overlayItems.push(
        scene.add.text(640, 125, 'Parabéns, explorador! Você completou todas as fases!', {
            fontFamily: FONT,
            fontSize: '22px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
    );

    // Pontuação final
    overlayItems.push(
        scene.add.text(640, 195, `PONTUAÇÃO FINAL: ${score}`, {
            fontFamily: FONT,
            fontSize: '30px',
            fontStyle: 'bold',
            color: '#38bdf8',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
    );

    // Créditos
    overlayItems.push(
        scene.add.text(640, 270, 'CRÉDITOS', {
            fontFamily: FONT,
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#fbbf24',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
    );

    // Alunos - coluna esquerda
    overlayItems.push(
        scene.add.text(420, 340,
            'Luana Andrade\nFernanda Ribeiro Rios\nGabrielle Santos Silva\nIzabela Silva Santos',
            {
                fontFamily: FONT,
                fontSize: '19px',
                color: '#ffffff',
                align: 'center',
                lineSpacing: 12
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
    );

    // Alunos - coluna direita
    overlayItems.push(
        scene.add.text(860, 340,
            'Wellington Carmo\nLucas de Paula Claudino\nGabriel Torquato Silva',
            {
                fontFamily: FONT,
                fontSize: '19px',
                color: '#ffffff',
                align: 'center',
                lineSpacing: 12
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
    );

    // Disciplina e professor
    overlayItems.push(
        scene.add.text(640, 485, 'Itinerário Extensionista 2', {
            fontFamily: FONT,
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#7dd3fc',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
    );

    overlayItems.push(
        scene.add.text(640, 520, 'Professor: João Roberto Ursino', {
            fontFamily: FONT,
            fontSize: '19px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
    );

    overlayItems.push(
        scene.add.text(640, 555, 'Grupo Wall Tech • 2026', {
            fontFamily: FONT,
            fontSize: '17px',
            color: '#94a3b8',
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001)
    );

    // Botão jogar novamente
    const botaoVisual = scene.add.graphics()
        .fillStyle(0xf97316, 1)
        .fillRoundedRect(520, 615, 240, 55, 14)
        .setScrollFactor(0)
        .setDepth(1002);

    overlayItems.push(botaoVisual);

    const botaoClique = scene.add.rectangle(
        640, 642, 240, 55, 0xffffff, 0
    )
        .setScrollFactor(0)
        .setDepth(1003)
        .setInteractive({ useHandCursor: true });

    overlayItems.push(botaoClique);

    overlayItems.push(
        scene.add.text(640, 642, 'JOGAR NOVAMENTE', {
            fontFamily: FONT,
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1004)
    );

    // Reiniciar o jogo ao clicar
    botaoClique.on('pointerdown', () => {
        overlayItems.forEach(item => item.destroy());

        currentLevel = 1;
        score = 0;
        collectedChips = 0;
        doorOpen = false;
        quizActive = false;
        gameStarted = true;
        levelTransitioning = false;

        loadLevel.call(scene, currentLevel);
        announceLevel(scene);
    });
}

function announceLevel(scene) {
    showMessage(scene, `Fase ${currentLevel}: ${levels[currentLevel].name}`, '#38bdf8', 2400);
}

function updateHud() {
    scoreText.setText('Pontos: ' + score);
    chipsText.setText(`Chips: ${collectedChips}/${totalChips}`);
    levelText.setText(currentLevel <= maxLevels ? `FASE ${currentLevel}/${maxLevels} · ${levels[currentLevel].name}` : `BÔNUS · ${levels[currentLevel].name}`);
}

// ==========================================================
// MENSAGENS E EFEITOS
// ==========================================================
function showMessage(scene, text, color, duration) {
    if (messageBox) {
        messageBox.destroy();
        messageBox = null;
    }
    const box = scene.add.text(GAME_W / 2, 110, text, {
        fontFamily: FONT,
        fontSize: '22px',
        color: color || '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#0f172a',
        padding: { x: 18, y: 12 },
        wordWrap: { width: 900 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(180);

    messageBox = box;
    scene.time.delayedCall(duration || 2200, () => {
        if (messageBox === box) messageBox = null;
        box.destroy();
    });
}

function burst(scene, x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const c = scene.add.circle(x, y, Phaser.Math.Between(3, 6), color, 1).setDepth(80);
        const ang = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(30, 90);
        scene.tweens.add({
            targets: c,
            x: x + Math.cos(ang) * dist,
            y: y + Math.sin(ang) * dist,
            alpha: 0,
            scale: 0.2,
            duration: Phaser.Math.Between(350, 650),
            ease: 'Cubic.easeOut',
            onComplete: () => c.destroy()
        });
    }
}

// ==========================================================
// QUIZ (com relógio analógico quando a pergunta pede)
// ==========================================================
function showQuizModal(questionData) {
    const scene = this;
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;
    const options = Phaser.Utils.Array.Shuffle([...questionData.options]);

    const els = [];
    const add = (o) => { o.setScrollFactor(0); els.push(o); return o; };

    add(scene.add.rectangle(cx, cy, GAME_W, GAME_H, 0x020617, 0.6)).setDepth(150);
    add(scene.add.rectangle(cx, cy, 860, 450, 0x0f172a, 0.97)).setStrokeStyle(4, 0x2dd4bf).setDepth(151);
    add(scene.add.text(cx, cy - 195, 'DESAFIO MATEMÁTICO & AMBIENTAL', {
        fontFamily: FONT, fontSize: '22px', color: '#38bdf8', fontStyle: 'bold'
    }).setOrigin(0.5)).setDepth(152);

    if (questionData.clock) {
        drawClock(scene, cx - 290, cy - 30, 88, questionData.clock[0], questionData.clock[1], add);
        add(scene.add.text(cx + 120, cy - 30, questionData.q, {
            fontFamily: FONT, fontSize: '25px', color: '#ffffff', align: 'center',
            wordWrap: { width: 440 }
        }).setOrigin(0.5)).setDepth(152);
    } else {
        add(scene.add.text(cx, cy - 55, questionData.q, {
            fontFamily: FONT, fontSize: '27px', color: '#ffffff', align: 'center',
            wordWrap: { width: 780 }
        }).setOrigin(0.5)).setDepth(152);
    }

    // Botão para ouvir novamente a pergunta
    const audioButton = add(
        scene.add.rectangle(cx, cy + 28, 270, 42, 0x1d4ed8)
    )
        .setStrokeStyle(2, 0x93c5fd)
        .setDepth(152)
        .setInteractive({ useHandCursor: true });

    add(scene.add.text(cx, cy + 28, '🔊 Ouvir pergunta', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5)).setDepth(153);

    // Monta o texto que será narrado
    const quizSpeech = `Vamos ouvir o desafio. ${questionData.q} ` +
        options.map((option, index) =>
            `Opção ${index + 1}: ${option}.`
        ).join(' ');

    // Função para reproduzir a narração
    const readQuestion = () => {
        speakText(quizSpeech);
    };

    // Efeito visual do botão
    audioButton.on('pointerover', () =>
        audioButton.setFillStyle(0x2563eb)
    );

    audioButton.on('pointerout', () =>
        audioButton.setFillStyle(0x1d4ed8)
    );

    // Ao clicar, repete a pergunta
    audioButton.on('pointerdown', readQuestion);

    // Narração automática ao abrir a pergunta
    readQuestion();
    add(scene.add.text(cx, cy + 185, 'Clique na opção ou pressione as teclas 1, 2 ou 3', {
        fontFamily: FONT, fontSize: '16px', color: '#94a3b8'
    }).setOrigin(0.5)).setDepth(152);

    let answered = false;

    const handlers = [
        () => checkAnswer(options[0]),
        () => checkAnswer(options[1]),
        () => checkAnswer(options[2])
    ];

    const checkAnswer = (selected) => {
        console.log('Resposta selecionada:', selected);
        console.log('Dados da pergunta:', questionData);
        if (answered) return;
        answered = true;

        els.forEach(e => e.destroy());
        scene.input.keyboard.off('keydown-ONE', handlers[0]);
        scene.input.keyboard.off('keydown-TWO', handlers[1]);
        scene.input.keyboard.off('keydown-THREE', handlers[2]);

        if (selected === questionData.answer) {
            score += 10;
            saveProgress();
            showMessage(scene, 'Muito bem! +10 pontos. Você está aprendendo!', '#34d399', 2200);
            speakText('Muito bem! Você acertou e ganhou 10 pontos.');
        } else {
            showMessage(scene, `Vamos aprender juntos! A resposta é: ${questionData.answer}. Tente novamente no próximo desafio.`, '#fbbf24', 3000);
            speakText(`Vamos aprender juntos. A resposta é ${questionData.answer}. Tente novamente no próximo desafio.`);
        }

        collectedChips++;
        updateHud();
        quizActive = false;

        if (collectedChips >= totalChips) {
            doorOpen = true;
            door.setTexture('door_open');
            doorGlow.setAlpha(0.8);
            scene.tweens.add({
                targets: doorGlow,
                alpha: { from: 0.45, to: 0.95 },
                scale: { from: 2.3, to: 2.9 },
                duration: 800,
                yoyo: true,
                repeat: -1
            });
            scene.time.delayedCall(3100, () => {
                if (!levelTransitioning) {
                    showMessage(scene, 'A PORTA SE ABRIU! Vá até ela para avançar de fase!', '#fbbf24', 2600);
                }
            });
        }
    };

    scene.input.keyboard.on('keydown-ONE', handlers[0]);
    scene.input.keyboard.on('keydown-TWO', handlers[1]);
    scene.input.keyboard.on('keydown-THREE', handlers[2]);

    options.forEach((opt, i) => {
        const x = cx + (i - 1) * 270;
        const y = cy + 110;
        const btn = add(scene.add.rectangle(x, y, 245, 66, 0x0d9488))
            .setStrokeStyle(3, 0x5eead4).setDepth(152).setInteractive({ useHandCursor: true });
        add(scene.add.text(x, y, `${i + 1})  ${opt}`, {
            fontFamily: FONT, fontSize: '26px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5)).setDepth(153);

        btn.on('pointerover', () => btn.setFillStyle(0x14b8a6));
        btn.on('pointerout', () => btn.setFillStyle(0x0d9488));
        btn.on('pointerdown', () => checkAnswer(opt));
    });
}

function drawClock(scene, x, y, r, hours, minutes, add) {
    const g = add(scene.add.graphics()).setDepth(153);
    const pt = (angleDeg, rad) => {
        const a = Phaser.Math.DegToRad(angleDeg);
        return { x: x + Math.sin(a) * rad, y: y - Math.cos(a) * rad };
    };

    g.fillStyle(0xf8fafc, 1);
    g.fillCircle(x, y, r);
    g.lineStyle(6, 0x0d9488, 1);
    g.strokeCircle(x, y, r);

    for (let i = 0; i < 60; i++) {
        const long = i % 5 === 0;
        const p1 = pt(i * 6, r - (long ? 12 : 6));
        const p2 = pt(i * 6, r - 3);
        g.lineStyle(long ? 3 : 1, 0x334155, 1);
        g.lineBetween(p1.x, p1.y, p2.x, p2.y);
    }

    for (let n = 1; n <= 12; n++) {
        const p = pt(n * 30, r - 26);
        add(scene.add.text(p.x, p.y, String(n), {
            fontFamily: FONT, fontSize: '17px', color: '#0f172a', fontStyle: 'bold'
        }).setOrigin(0.5)).setDepth(154);
    }

    const hourAngle = ((hours % 12) + minutes / 60) * 30;
    const minAngle = minutes * 6;

    const hp = pt(hourAngle, r * 0.5);
    g.lineStyle(7, 0x0f172a, 1);
    g.lineBetween(x, y, hp.x, hp.y);

    const mp = pt(minAngle, r * 0.78);
    g.lineStyle(4, 0x2563eb, 1);
    g.lineBetween(x, y, mp.x, mp.y);

    g.fillStyle(0xdc2626, 1);
    g.fillCircle(x, y, 5);
}

// Inicializa o jogo Phaser
const game = new Phaser.Game(config);
