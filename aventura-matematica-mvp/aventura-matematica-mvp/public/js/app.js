const app = document.querySelector('#app');

const state = {
    avatar: '👨‍🚀',
    username: '',
    token: '',
    jogadorId: null,
    vidas: 3,
    moedas: 0,
    pontos: 0,
    question: null
};

//api
const api = async (url, opt = {}) => {
    try {
        const r = await fetch('/api' + url, {
            headers: {
                'Content-Type': 'application/json',

                ...(opt.token
                    ? { Authorization: 'Bearer ' + opt.token }
                    : {})
            },

            ...opt,

            body: opt.body
                ? JSON.stringify(opt.body)
                : undefined
        });

        return await r.json();

    } catch {
        return {
            offline: true
        };
    }
};

//tela inicial
function home() {

    app.innerHTML = `
        <section class="screen" >
            <img class="fundo-logo"
                src="/img/logo.png"
                alt="Aventura Matemática"
                class="logo"
            >
            <div class="moon">
                <img src="/img/astronauta-lua.png" alt="Lua" class="moon">
            </div>
            
            <div class="jogar-fundo">
                <button
                    class="btn"
                    onclick="entry()"
                >
                    JOGAR
                </button>
            </div>
            <button
                class="btn dark "
                onclick="teacherLogin()"
            >
                ÁREA DO PROFESSOR
            </button>
        </section>
    `;
}

//modo de jogo
function entry() {

    app.innerHTML = `
        <section class="screen">
            <div class="card">
                <h1>
                    🚀 Como você quer jogar?
                </h1>
                <p>
                    Você pode jogar livremente ou usar o
                    código temporário fornecido pelo professor.
                </p>
                <button
                    class="btn"
                    onclick="profile(false)"
                >
                    JOGAR LIVRE
                </button>

                <button
                    class="btn secondary"
                    onclick="profile(true)"
                >
                    TENHO UM CÓDIGO
                </button>
                <br>
                <button
                    class="btn dark"
                    onclick="home()"
                >
                    VOLTAR
                </button>
            </div> 
        </section>
    `;
}

//perfil do jogador
function profile(withToken) {

    app.innerHTML = `
        <section class="screen">

            <div class="card">

                <h1>
                    Escolha seu astronauta
                </h1>

                <div class="avatars">

                    <button
                        class="selected"
                        onclick="pickAvatar(this, '👨‍🚀')"
                    >
                        👨‍🚀
                    </button>

                    <button
                        onclick="pickAvatar(this, '👩‍🚀')"
                    >
                        👩‍🚀
                    </button>

                    <button
                        onclick="pickAvatar(this, '🤖')"
                    >
                        🤖
                    </button>

                    <button
                        onclick="pickAvatar(this, '🛸')"
                    >
                        🛸
                    </button>

                </div>

                <label class="field">

                    Username

                    <input
                        id="username"
                        maxlength="20"
                        placeholder="Ex.: Estrela27"
                    >

                </label>

                ${withToken
            ? `
                            <label class="field">

                                Código da turma

                                <input
                                    id="classToken"
                                    maxlength="20"
                                    placeholder="Ex.: A1B2C3"
                                >

                            </label>
                        `
            : ''
        }

                <small>
                    Use um apelido. Não coloque seu nome completo.
                </small>

                <br>

                <button
                    class="btn"
                    onclick="startPlayer(${withToken})"
                >
                    CONTINUAR
                </button>

            </div>

        </section>
    `;
}


// ======================================================
// SELEÇÃO DO AVATAR
// ======================================================

function pickAvatar(el, avatar) {

    state.avatar = avatar;

    document
        .querySelectorAll('.avatars button')
        .forEach(button => {
            button.classList.remove('selected');
        });

    el.classList.add('selected');
}


// ======================================================
// INICIAR JOGADOR
// ======================================================

async function startPlayer(withToken) {

    state.username = document
        .querySelector('#username')
        .value
        .trim();

    state.token = withToken
        ? document
            .querySelector('#classToken')
            .value
            .trim()
            .toUpperCase()
        : '';

    if (state.username.length < 3) {
        return alert(
            'Crie um username com pelo menos 3 caracteres.'
        );
    }

    const r = await api('/jogadores', {
        method: 'POST',

        body: {
            username: state.username,
            avatar: state.avatar,
            token: state.token || null
        }
    });

    if (r.erro) {
        return alert(r.erro);
    }

    state.jogadorId = r.id || null;

    instructions();
}


// ======================================================
// INSTRUÇÕES
// ======================================================

function instructions() {

    app.innerHTML = `
        <section class="screen">

            <div class="card">

                <h1>
                    📘 Instruções
                </h1>

                <p>
                    Use os botões para mover o astronauta.
                    Ao chegar à porta bloqueada, resolva o
                    desafio matemático para continuar.
                </p>

                <p>
                    ❤️ Você começa com 3 vidas.
                    &nbsp;
                    🪙 Acertos dão moedas e pontos.
                </p>

                <button
                    class="btn secondary"
                    onclick="speak(
                        'Use os botões para mover o astronauta. Ao chegar à porta, resolva o desafio matemático para continuar.'
                    )"
                >
                    🔊 OUVIR
                </button>

                <button
                    class="btn"
                    onclick="game()"
                >
                    INICIAR FASE 1
                </button>

            </div>

        </section>
    `;
}


// ======================================================
// FASE 1
// ======================================================

async function game() {

    state.question = await api('/questoes/fase/1');

    app.innerHTML = `
        <section class="screen">

            <!-- HUD -->

            <div class="hud">

                <span>
                    ❤️
                    <b id="lives">
                        ${state.vidas}
                    </b>
                </span>

                <span>
                    🪙
                    <b id="coins">
                        ${state.moedas}
                    </b>
                </span>

                <span>
                    ⭐
                    <b id="points">
                        ${state.pontos}
                    </b>
                </span>

            </div>


            <!-- ÁREA DO JOGO -->

            <div class="game">

                <div class="coin">
                    🪙
                </div>

                <div
                    id="player"
                    class="player"
                >
                    ${state.avatar}
                </div>

                <div class="door">
                    🚪🔒
                </div>

                <div class="ground"></div>

            </div>


            <!-- CONTROLES -->

            <div class="move">

                <button
                    class="btn secondary"
                    onclick="move(-1)"
                >
                    ←
                </button>

                <button
                    class="btn"
                    onclick="move(1)"
                >
                    →
                </button>

            </div>

            <p>
                Chegue até a porta para liberar o desafio.
            </p>

        </section>
    `;

    state.pos = 8;
}


// ======================================================
// MOVIMENTAÇÃO
// ======================================================

function move(dir) {

    state.pos = Math.max(
        4,
        Math.min(
            80,
            state.pos + dir * 18
        )
    );

    document.querySelector('#player').style.left =
        state.pos + '%';

    if (state.pos >= 72) {
        setTimeout(challenge, 300);
    }
}


// ======================================================
// DESAFIO MATEMÁTICO
// ======================================================

function challenge() {

    const q = state.question || {
        enunciado: '8 + 7 = ?',
        alternativa_a: '13',
        alternativa_b: '15',
        alternativa_c: '17'
    };

    app.innerHTML = `
        <section class="screen">

            <div class="card">

                <h1>
                    🚪 Desafio Matemático
                </h1>

                <h2>
                    ${q.enunciado}
                </h2>

                <button
                    class="btn secondary"
                    onclick="answer('A')"
                >
                    ${q.alternativa_a}
                </button>

                <button
                    class="btn secondary"
                    onclick="answer('B')"
                >
                    ${q.alternativa_b}
                </button>

                <button
                    class="btn secondary"
                    onclick="answer('C')"
                >
                    ${q.alternativa_c}
                </button>

                <p
                    id="fb"
                    class="feedback"
                ></p>

                <button
                    class="btn dark"
                    onclick="speak(
                        '${q.enunciado.replaceAll("'", '')}'
                    )"
                >
                    🔊 OUVIR QUESTÃO
                </button>

            </div>

        </section>
    `;

    if (document.querySelector('#narration').checked) {
        speak(q.enunciado);
    }
}


// ======================================================
// VERIFICAR RESPOSTA
// ======================================================

async function answer(letter) {

    const r = await api('/respostas', {

        method: 'POST',

        body: {
            jogadorId: state.jogadorId,
            questaoId: state.question?.id || null,
            fase: 1,
            resposta: letter
        }
    });

    const ok =
        r.acertou ?? letter === 'B';

    const fb =
        document.querySelector('#fb');


    // RESPOSTA CORRETA

    if (ok) {

        state.pontos += 100;
        state.moedas += 10;

        fb.className = 'feedback good';

        fb.textContent =
            '✓ RESPOSTA CORRETA! +100 pontos e +10 moedas';

        speak('Resposta correta!');

        setTimeout(
            finish,
            1200
        );

    }

    // RESPOSTA INCORRETA

    else {

        state.vidas--;

        fb.className = 'feedback bad';

        fb.textContent =
            '✕ RESPOSTA INCORRETA. Tente novamente.';

        speak(
            'Resposta incorreta. Tente novamente.'
        );

        if (state.vidas <= 0) {

            setTimeout(() => {

                state.vidas = 3;

                game();

            }, 1200);
        }
    }
}


// ======================================================
// FINAL DA FASE
// ======================================================

function finish() {

    localStorage.setItem(
        'aventura_progresso',

        JSON.stringify({
            username: state.username,
            fase: 1,
            pontos: state.pontos,
            moedas: state.moedas
        })
    );

    app.innerHTML = `
        <section class="screen">

            <div class="card">

                <h1>
                    🚀 MISSÃO CONCLUÍDA!
                </h1>

                <div style="font-size: 3rem">
                    ⭐⭐⭐
                </div>

                <h2>
                    ${state.avatar}
                    ${state.username}
                </h2>

                <p>
                    ⭐ Pontuação:
                    <b>${state.pontos}</b>
                </p>

                <p>
                    🪙 Moedas:
                    <b>${state.moedas}</b>
                </p>

                <p>
                    Fase 1 concluída e progresso salvo.
                </p>

                <button
                    class="btn"
                    onclick="home()"
                >
                    FINALIZAR MVP
                </button>

            </div>

        </section>
    `;
}


// ======================================================
// ÁREA DO PROFESSOR
// ======================================================

function teacherLogin() {

    app.innerHTML = `
        <section class="screen">

            <div class="card">

                <h1>
                    👩‍🏫 Área do Professor
                </h1>

                <label class="field">

                    Usuário

                    <input id="tu">

                </label>

                <label class="field">

                    Senha

                    <input
                        id="tp"
                        type="password"
                    >

                </label>

                <button
                    class="btn"
                    onclick="doLogin()"
                >
                    ENTRAR
                </button>

                <p>
                    <small>
                        Com o banco configurado, use o professor
                        criado pelo endpoint /api/setup.
                    </small>
                </p>

                <button
                    class="btn dark"
                    onclick="teacherDemo()"
                >
                    VER PAINEL DEMONSTRATIVO
                </button>

            </div>

        </section>
    `;
}


// ======================================================
// LOGIN DO PROFESSOR
// ======================================================

async function doLogin() {

    const r = await api('/login', {

        method: 'POST',

        body: {
            usuario: tu.value,
            senha: tp.value
        }
    });

    if (r.token) {

        localStorage.setItem(
            'profToken',
            r.token
        );

        teacherPanel(r.token);

    } else {

        alert(
            r.erro ||
            'Não foi possível entrar'
        );
    }
}


// ======================================================
// PAINEL DEMONSTRATIVO
// ======================================================

function teacherDemo() {
    teacherPanel(null, true);
}


// ======================================================
// PAINEL DO PROFESSOR
// ======================================================

async function teacherPanel(token, demo = false) {

    let data;

    if (demo) {

        data = [
            {
                turma: '3º Ano A',
                username: 'Estrela27',
                avatar: '👨‍🚀',
                respostas: 5,
                acertos: 4,
                pontos: 400
            },

            {
                turma: '3º Ano A',
                username: 'Lua82',
                avatar: '👩‍🚀',
                respostas: 5,
                acertos: 5,
                pontos: 500
            }
        ];

    } else {

        data = await api(
            '/desempenho',
            { token }
        );
    }

    if (!Array.isArray(data)) {
        data = [];
    }


    const totalAcertos = data.reduce(
        (total, jogador) =>
            total + (+jogador.acertos || 0),
        0
    );


    const linhasTabela = data
        .map(jogador => `
            <tr>

                <td>
                    ${jogador.turma}
                </td>

                <td>
                    ${jogador.avatar}
                    ${jogador.username}
                </td>

                <td>
                    ${jogador.respostas}
                </td>

                <td>
                    ${jogador.acertos}
                </td>

                <td>
                    ${jogador.pontos}
                </td>

            </tr>
        `)
        .join('');


    app.innerHTML = `
        <section class="screen">

            <div class="teacher">

                <!-- MENU LATERAL -->

                <aside class="side">

                    <h2>
                        🚀 Professor
                    </h2>

                    <button
                        onclick="teacherPanel(
                            '${token || ''}',
                            ${demo}
                        )"
                    >
                        📊 Visão geral
                    </button>

                    <button
                        onclick="teacherClasses(
                            '${token || ''}',
                            ${demo}
                        )"
                    >
                        👥 Turmas
                    </button>

                    <button
                        onclick="teacherQuestion(
                            '${token || ''}',
                            ${demo}
                        )"
                    >
                        ❓ Questões
                    </button>

                    <button
                        onclick="home()"
                    >
                        🚪 Sair
                    </button>

                </aside>


                <!-- CONTEÚDO -->

                <div class="content">

                    <h1>
                        Visão geral
                    </h1>

                    <div class="stat">

                        👨‍🎓 ${data.length}

                        <br>

                        <small>
                            jogadores
                        </small>

                    </div>

                    <div class="stat">

                        🎯 ${totalAcertos}

                        <br>

                        <small>
                            acertos
                        </small>

                    </div>


                    <h2>
                        Desempenho
                    </h2>


                    <table class="table">

                        <tr>
                            <th>Turma</th>
                            <th>Jogador</th>
                            <th>Respostas</th>
                            <th>Acertos</th>
                            <th>Pontos</th>
                        </tr>

                        ${linhasTabela ||
        `
                                <tr>
                                    <td colspan="5">
                                        Ainda não há resultados.
                                    </td>
                                </tr>
                            `
        }

                    </table>

                </div>

            </div>

        </section>
    `;
}


// ======================================================
// TURMAS
// ======================================================

function teacherClasses(token, demo) {

    app.innerHTML = `
        <section class="screen">

            <div class="card">

                <h1>
                    👥 Turmas
                </h1>

                <p>
                    No MVP real, o professor cria uma turma
                    e gera um token temporário de 24 horas.
                </p>

                <label class="field">

                    Nome da turma

                    <input
                        id="className"
                        value="3º Ano A"
                    >

                </label>

                <button
                    class="btn"
                    onclick="createClass(
                        '${token}',
                        ${demo}
                    )"
                >
                    CRIAR TURMA / GERAR TOKEN
                </button>

                <p id="classResult"></p>

                <button
                    class="btn dark"
                    onclick="teacherPanel(
                        '${token}',
                        ${demo}
                    )"
                >
                    VOLTAR
                </button>

            </div>

        </section>
    `;
}


// ======================================================
// CRIAR TURMA
// ======================================================

async function createClass(token, demo) {

    if (demo) {

        classResult.textContent =
            'Token demonstrativo: MATH24 (expira em 24h)';

        return;
    }


    const turma = await api('/turmas', {

        method: 'POST',

        token,

        body: {
            nome: className.value
        }
    });


    if (turma.id) {

        const sessao = await api(
            '/turmas/' + turma.id + '/token',
            {
                method: 'POST',
                token,
                body: {}
            }
        );

        classResult.textContent =
            'Token: ' +
            sessao.token +
            ' | expira: ' +
            new Date(
                sessao.expira_em
            ).toLocaleString('pt-BR');

    } else {

        classResult.textContent =
            turma.erro || 'Erro';
    }
}


// ======================================================
// CADASTRO DE QUESTÕES
// ======================================================

function teacherQuestion(token, demo) {

    app.innerHTML = `
        <section class="screen">

            <div class="card">

                <h1>
                    ❓ Cadastrar questão
                </h1>

                <label class="field">

                    Enunciado

                    <input
                        id="qe"
                        value="8 + 7 = ?"
                    >

                </label>


                <div class="row">

                    <label class="field">

                        A

                        <input
                            id="qa"
                            value="13"
                        >

                    </label>

                    <label class="field">

                        B

                        <input
                            id="qb"
                            value="15"
                        >

                    </label>

                    <label class="field">

                        C

                        <input
                            id="qc"
                            value="17"
                        >

                    </label>

                </div>


                <label class="field">

                    Correta

                    <select id="correct">
                        <option>B</option>
                        <option>A</option>
                        <option>C</option>
                    </select>

                </label>


                <label class="field">

                    Dificuldade

                    <select id="difficulty">
                        <option>facil</option>
                        <option>media</option>
                        <option>dificil</option>
                    </select>

                </label>


                <button
                    class="btn"
                    onclick="saveQuestion(
                        '${token}',
                        ${demo}
                    )"
                >
                    SALVAR QUESTÃO
                </button>


                <p id="qResult"></p>


                <button
                    class="btn dark"
                    onclick="teacherPanel(
                        '${token}',
                        ${demo}
                    )"
                >
                    VOLTAR
                </button>

            </div>

        </section>
    `;
}


// ======================================================
// SALVAR QUESTÃO
// ======================================================

async function saveQuestion(token, demo) {

    if (demo) {

        qResult.textContent =
            '✓ Questão salva no modo demonstrativo.';

        return;
    }


    const r = await api('/questoes', {

        method: 'POST',

        token,

        body: {
            enunciado: qe.value,
            a: qa.value,
            b: qb.value,
            c: qc.value,
            correta: correct.value,
            dificuldade: difficulty.value,
            fase: 1
        }
    });


    qResult.textContent = r.id
        ? '✓ Questão cadastrada.'
        : (r.erro || 'Erro');
}


// ======================================================
// ACESSIBILIDADE
// ======================================================

function openAccess() {

    document
        .querySelector('#accessModal')
        .classList
        .toggle('hidden');
}


function toggleContrast() {

    document.body.classList.toggle(
        'contrast',
        contrast.checked
    );
}


function fontSize(d) {

    const tamanhoAtual = parseFloat(
        getComputedStyle(
            document.documentElement
        ).fontSize
    );

    document.documentElement.style.fontSize =
        Math.max(
            14,
            Math.min(
                22,
                tamanhoAtual + d
            )
        ) + 'px';
}


function speak(texto) {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const fala =
            new SpeechSynthesisUtterance(texto);
        fala.lang = 'pt-BR';
        speechSynthesis.speak(fala);
    }
}

home();