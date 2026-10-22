
const GAME_W = 1280;
const GAME_H = 720;
const FLOOR_Y = 660;      // topo do chão
const HAZ_H = 24;         // altura das poças
const PIPE_BOTTOM = 570;  // base dos túneis (corredor de 90px até o chão)
const PLAYER_SPEED = 230;
const JUMP_FORCE = -640;
let FONT = 'Trebuchet MS, Verdana, Arial, sans-serif';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#0b1220',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_W,
        height: GAME_H
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
let score = 0;
let currentLevel = 1;
const maxLevels = 4;
let scoreText, levelText, chipsText, modeText, modeDot;
let bgStars, bgCity, bgGrid;

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
// PERGUNTAS (crianças de 7 a 10 anos) - 6 por fase, 4 sorteadas
// ==========================================================
const questionsByLevel = {
    1: [
        { q: "Byte recolheu 48 garrafas de manhã e 37 à tarde. Quantas garrafas recolheu no total?", options: ["75", "85", "95"], answer: "85" },
        { q: "A escola tinha 120 latinhas para reciclar. Já entregaram 45. Quantas ainda faltam entregar?", options: ["65", "75", "85"], answer: "75" },
        { q: "Cada turma plantou 6 mudas. Com 7 turmas, quantas mudas foram plantadas?", options: ["36", "42", "48"], answer: "42" },
        { q: "Que horas o relógio está marcando?\n(ponteiro curto = horas, ponteiro longo = minutos)", clock: [4, 30], options: ["4h30", "5h30", "6h20"], answer: "4h30" },
        { q: "O mutirão começou às 8h e durou 3 horas. A que horas terminou?", options: ["10h", "11h", "12h"], answer: "11h" },
        { q: "Byte tem 36 tampinhas e quer dividir igualmente em 4 caixas. Quantas tampinhas vão em cada caixa?", options: ["8", "9", "12"], answer: "9" }
    ],
    2: [
        { q: "Em um mutirão contra a dengue, 4 turmas eliminaram 28 focos cada uma. Quantos focos foram eliminados no total?", options: ["102", "112", "122"], answer: "112" },
        { q: "Byte tinha 300 mudas e já plantou 138. Quantas mudas ainda restam?", options: ["162", "172", "238"], answer: "162" },
        { q: "96 alunos formaram grupos de 8 pessoas. Quantos grupos foram formados?", options: ["10", "12", "14"], answer: "12" },
        { q: "Que horas o relógio está marcando?\n(ponteiro curto = horas, ponteiro longo = minutos)", clock: [7, 45], options: ["7h45", "8h45", "9h35"], answer: "7h45" },
        { q: "A oficina de reciclagem começou às 14h e terminou às 16h30. Quanto tempo ela durou?", options: ["2h", "2h30min", "3h30min"], answer: "2h30min" },
        { q: "Uma hora tem 60 minutos. Quantos minutos existem em 2 horas e meia?", options: ["120", "150", "180"], answer: "150" }
    ],
    3: [
        { q: "Byte coletou 5 caixas com 24 garrafas cada e usou 35 garrafas em uma oficina. Quantas garrafas sobraram?", options: ["85", "95", "155"], answer: "85" },
        { q: "Um canteiro tem 9 fileiras com 15 mudas em cada uma. Quantas mudas há no canteiro?", options: ["125", "135", "145"], answer: "135" },
        { q: "Para reciclar 144 kg de papel, 6 turmas ajudaram igualmente. Quantos kg cada turma juntou?", options: ["22 kg", "24 kg", "26 kg"], answer: "24 kg" },
        { q: "Que horas o relógio está marcando?\n(ponteiro curto = horas, ponteiro longo = minutos)", clock: [10, 10], options: ["10h10", "2h50", "10h02"], answer: "10h10" },
        { q: "O ônibus da excursão ecológica saiu às 9h40 e a viagem durou 1h35min. A que horas ele chegou?", options: ["11h05", "11h15", "11h25"], answer: "11h15" },
        { q: "Byte começou a carregar a bateria às 15h50 e ela levou 25 minutos. A que horas terminou?", options: ["15h75", "16h15", "16h25"], answer: "16h15" }
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
            { type: 'fire', x: 520, w: 160, tunnel: true },
            { type: 'water', x: 1180, w: 160, tunnel: true }
        ],
        chips: [
            { x: 250, y: 504 }, { x: 840, y: 504 }, { x: 1060, y: 394 }, { x: 1515, y: 284 }
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
            { type: 'acid', x: 380, w: 140 },
            { type: 'fire', x: 800, w: 160, tunnel: true },
            { type: 'water', x: 1400, w: 160, tunnel: true }
        ],
        chips: [
            { x: 215, y: 504 }, { x: 660, y: 484 }, { x: 1305, y: 394 }, { x: 1685, y: 504 }
        ],
        lever: { x: 1115, y: 320 },
        gate: { x: 1790, y: 0, w: 30, h: 660 },
        door: { x: 1900, y: 620 },
        signs: [
            { x: 320, y: 640, text: 'Ácido verde!\nPule por cima!' },
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
            { type: 'fire', x: 380, w: 160, tunnel: true },
            { type: 'acid', x: 700, w: 130 },
            { type: 'water', x: 1000, w: 160, tunnel: true },
            { type: 'acid', x: 1560, w: 120 },
            { type: 'fire', x: 1840, w: 160, tunnel: true }
        ],
        chips: [
            { x: 175, y: 504 }, { x: 655, y: 494 }, { x: 910, y: 394 }, { x: 1495, y: 394 }
        ],
        lever: { x: 1305, y: 320 },
        gate: { x: 1740, y: 0, w: 30, h: 660 },
        door: { x: 2100, y: 620 },
        signs: [
            { x: 290, y: 640, text: 'Lava!\n↓ Módulo FOGO' },
            { x: 635, y: 640, text: 'Ácido!\nPule!' },
            { x: 925, y: 640, text: 'Água!\n↓ Módulo ÁGUA' },
            { x: 1305, y: 262, text: 'Alavanca!' },
            { x: 1650, y: 500, text: 'Barreira de energia!\nUse a alavanca' },
            { x: 1803, y: 640, text: 'Lava!\n↓ FOGO' }
        ]
    }
};

// Fase 4 e fase bônus reutilizam a estrutura visual da fase 3, com nomes e desafios próprios.
// A arquitetura pode receber mapas exclusivos depois sem alterar a progressão.
levels[4] = { ...levels[3], name: 'Desafio Final da Escola', width: 2200,
    door: { x: 2100, y: 620 }, spawn: { x: 80, y: 600 } };
levels[5] = { ...levels[3], name: 'Fase Bônus: Mestre da Matemática', width: 2200,
    door: { x: 2100, y: 620 }, spawn: { x: 80, y: 600 } };

questionsByLevel[4] = [
    { q: 'Uma turma arrecadou 8 caixas com 24 livros cada. Quantos livros arrecadou?', options: ['182', '192', '202'], answer: '192' },
    { q: 'A escola tinha 450 folhas para reciclar e usou 175. Quantas sobraram?', options: ['265', '275', '285'], answer: '275' },
    { q: '72 sementes foram divididas igualmente entre 9 canteiros. Quantas por canteiro?', options: ['7', '8', '9'], answer: '8' },
    { q: 'A atividade começou às 13h25 e durou 1h40. Quando terminou?', options: ['14h55', '15h05', '15h15'], answer: '15h05' },
    { q: 'Há 12 equipes com 15 alunos em cada. Quantos alunos participam?', options: ['160', '170', '180'], answer: '180' },
    { q: 'Uma coleta tinha 360 latinhas. Foram separadas em 6 grupos iguais. Quantas por grupo?', options: ['50', '60', '70'], answer: '60' }
];
questionsByLevel[5] = [
    { q: 'Desafio bônus: 3 turmas recolheram 125 tampinhas cada. Quantas tampinhas no total?', options: ['275', '375', '425'], answer: '375' },
    { q: 'Byte tem 240 sementes e planta 4/6 delas. Quantas sementes plantou?', options: ['120', '160', '180'], answer: '160' },
    { q: 'Uma trilha tem 1.250 metros. A equipe percorreu 875 metros. Quantos faltam?', options: ['325 m', '375 m', '425 m'], answer: '375 m' },
    { q: 'Uma oficina durou 2h15min e começou às 9h30. Quando terminou?', options: ['11h15', '11h45', '12h15'], answer: '11h45' },
    { q: 'Cinco equipes recolheram 48 kg de papel cada. Qual foi o total?', options: ['220 kg', '240 kg', '260 kg'], answer: '240 kg' },
    { q: 'Desafio criativo: 96 mudas serão divididas em 8 fileiras iguais. Quantas por fileira?', options: ['10', '12', '14'], answer: '12' }
];

function getSavedProgress() {
    try { return JSON.parse(localStorage.getItem('aventuraMatematicaProgress') || '{"completedLevels":[],"score":0,"achievements":[]}'); }
    catch (_) { return { completedLevels: [], score: 0, achievements: [] }; }
}
function saveProgress() {
    const data = getSavedProgress();
    data.score = Math.max(Number(data.score) || 0, score);
    data.currentLevel = currentLevel;
    localStorage.setItem('aventuraMatematicaProgress', JSON.stringify(data));
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
    utterance.lang = 'pt-BR'; utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

// ==========================================================
// PRELOAD - todos os gráficos são desenhados por código
// ==========================================================
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
    this.add.image(0, 0, 'bg_sky').setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H).setScrollFactor(0).setDepth(-20);
    bgStars = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg_stars').setOrigin(0, 0).setScrollFactor(0).setDepth(-19);
    bgGrid = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg_grid').setOrigin(0, 0).setScrollFactor(0).setDepth(-18);
    bgCity = this.add.tileSprite(0, GAME_H - 256, GAME_W, 256, 'bg_city').setOrigin(0, 0).setScrollFactor(0).setDepth(-17);

    // ----- controles -----
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys('W,A,S,D');
    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');

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
    this.add.rectangle(0, 0, GAME_W, 56, 0x020617, 0.85).setOrigin(0, 0).setScrollFactor(0).setDepth(90);
    this.add.rectangle(0, 56, GAME_W, 3, 0x2dd4bf, 0.8).setOrigin(0, 0).setScrollFactor(0).setDepth(90);

    levelText = this.add.text(20, 14, '', { fontFamily: FONT, fontSize: '22px', color: '#34d399', fontStyle: 'bold' })
        .setScrollFactor(0).setDepth(91);
    scoreText = this.add.text(600, 14, 'Pontos: 0', { fontFamily: FONT, fontSize: '22px', color: '#38bdf8', fontStyle: 'bold' })
        .setScrollFactor(0).setDepth(91);
    chipsText = this.add.text(780, 14, 'Chips: 0/0', { fontFamily: FONT, fontSize: '22px', color: '#fbbf24', fontStyle: 'bold' })
        .setScrollFactor(0).setDepth(91);
    modeText = this.add.text(1260, 14, 'MÓDULO ÁGUA', { fontFamily: FONT, fontSize: '22px', color: '#7dd3fc', fontStyle: 'bold' })
        .setOrigin(1, 0).setScrollFactor(0).setDepth(91);
    modeDot = this.add.circle(1050, 29, 10, 0x38bdf8, 1).setScrollFactor(0).setDepth(91);

    // ----- câmera -----
    this.cameras.main.startFollow(player, true, 0.12, 0.12);

    loadLevel.call(this, currentLevel);

    // ----- tela inicial -----
    this.physics.pause();
    buildIntro(scene);
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
        scene.physics.resume();
        announceLevel(scene);
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

    // ----- trocar módulo (seta para baixo / S) -----
    if (Phaser.Input.Keyboard.JustDown(cursors.down) || Phaser.Input.Keyboard.JustDown(keys.S)) {
        setMode(this, playerMode === 'water' ? 'fire' : 'water', false);
    }

    // ----- movimento -----
    const left = cursors.left.isDown || keys.A.isDown;
    const right = cursors.right.isDown || keys.D.isDown;
    const jump = cursors.up.isDown || keys.W.isDown;

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
        const touching = b.right > h.x + 4 && b.left < h.x + h.w - 4 &&
                         b.bottom > h.y + 2 && b.top < h.y + h.h;
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
        fire: 'Superaquecimento! A lava só é segura no Módulo FOGO.\nPressione ↓ para trocar de módulo.',
        water: 'Curto-circuito! A água só é segura no Módulo ÁGUA.\nPressione ↓ para trocar de módulo.',
        acid: 'Ácido! O líquido verde é perigoso para os dois módulos.\nPule por cima dele!'
    };
    showMessage(scene, msgs[h.type], '#f87171', 3200);

    scene.time.delayedCall(800, () => {
        player.setPosition(Math.max(50, h.x - 55), 590);
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

// ==========================================================
// CARREGAR FASE
// ==========================================================
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

    prepareQuestions(level);

    // ----- mundo e câmera -----
    scene.physics.world.setBounds(0, 0, data.width, GAME_H);
    scene.cameras.main.setBounds(0, 0, data.width, GAME_H);
    scene.cameras.main.scrollX = 0;

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
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem('aventuraTeacherQuestions') || '{}')[level] || []; } catch (_) {}
    const bank = custom.length ? custom : questionsByLevel[level];
    questionDeck = Phaser.Utils.Array.Shuffle([...bank]);
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
        showMessage(scene, `Parabéns! Você concluiu as 4 fases e a fase bônus!\nPontuação: ${score}`, '#fbbf24', 5000);
        scene.time.delayedCall(4600, () => cam.fadeOut(500, 11, 18, 32));
        scene.time.delayedCall(5200, () => {
            currentLevel = 1; score = 0;
            loadLevel.call(scene, currentLevel);
            cam.fadeIn(500, 11, 18, 32);
            announceLevel(scene);
            levelTransitioning = false;
        });
    }
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
