
import { supabase } from './supabase-client.js';

const $ = (id) => document.getElementById(id);

const read = (key, fallback) => {
    try {
        return JSON.parse(
            localStorage.getItem(key) || JSON.stringify(fallback)
        );
    } catch {
        return fallback;
    }
};

const write = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[c]);
}

function showDashboard() {
    $('login').classList.add('hidden');
    $('dashboard').classList.remove('hidden');
    $('login-error').textContent = '';
    render();
}

function showLogin() {
    $('dashboard').classList.add('hidden');
    $('login').classList.remove('hidden');
}

$('login-button').addEventListener('click', async () => {
    const email = $('email').value.trim();
    const password = $('password').value;

    $('login-error').textContent = '';

    if (!email || !password) {
        $('login-error').textContent =
            'Digite seu e-mail e sua senha.';
        return;
    }

    const button = $('login-button');
    button.disabled = true;
    button.textContent = 'Entrando...';

    try {
        const { data, error } =
            await supabase.auth.signInWithPassword({
                email,
                password
            });

        if (error) throw error;

        if (!data.session) {
            throw new Error('Não foi possível iniciar a sessão.');
        }

        showDashboard();
    } catch (error) {
        console.error('Erro no login:', error);

        $('login-error').textContent =
            error.message || 'Ocorreu um erro ao entrar.';
    } finally {
        button.disabled = false;
        button.textContent = 'Entrar';
    }
});

$('logout').addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Erro ao sair:', error);
        alert('Não foi possível encerrar a sessão. Tente novamente.');
        return;
    }

    $('password').value = '';
    showLogin();
});


$('save-class').addEventListener('click', async () => {
    const name = $('class-name').value.trim();
    const code = $('class-code').value.trim().toUpperCase();
    const button = $('save-class');

    console.log('Nome da turma:', name);
    console.log('Código da turma:', code);

    if (!name || !code) {
        alert('Preencha o nome da turma e o código.');
        return;
    }

    button.disabled = true;
    button.textContent = 'Salvando...';

    try {
        const { data: authData, error: authError } =
            await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
            throw new Error('Sua sessão expirou. Entre novamente.');
        }

        const { error } = await supabase
            .from('classes')
            .insert({
                teacher_id: user.id,
                name: name,
                room_code: code
            });

        if (error) throw error;

        $('class-name').value = '';
        $('class-code').value = '';

        await renderClasses();

        alert('Turma salva com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar turma:', error);

        if (error.code === '23505') {
            alert('Esse código de sala já está cadastrado.');
        } else {
            alert(
                'Não foi possível salvar a turma. Confira o Console (F12) para ver o erro.'
            );
        }
    } finally {
        button.disabled = false;
        button.textContent = 'Salvar turma';
    }
});




$('save-question').addEventListener('click', () => {
    const q = $('question-text').value.trim();
    const a = $('option-a').value.trim();
    const b = $('option-b').value.trim();
    const c = $('option-c').value.trim();

    if (!q || !a || !b || !c) {
        alert('Preencha a pergunta e as três alternativas.');
        return;
    }

    const key = $('correct-option').value;
    const question = {
        q,
        options: [a, b, c],
        answer: ({ a, b, c })[key],
        difficulty: $('difficulty').value
    };

    const all = read('aventuraTeacherQuestions', {});
    const level = $('question-level').value;

    all[level] = all[level] || [];
    all[level].push(question);

    write('aventuraTeacherQuestions', all);

    $('question-text').value = '';
    $('option-a').value = '';
    $('option-b').value = '';
    $('option-c').value = '';

    renderQuestions();
});

$('clear-questions').addEventListener('click', () => {
    if (confirm(
        'Apagar todos os desafios personalizados? O jogo voltará às perguntas padrão.'
    )) {
        localStorage.removeItem('aventuraTeacherQuestions');
        renderQuestions();
    }
});


async function renderClasses() {
    const list = $('class-list');

    list.textContent = 'Carregando turmas...';

    try {
        const { data: authData, error: authError } =
            await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
            list.textContent = 'Entre novamente para consultar suas turmas.';
            return;
        }

        const { data: classes, error } = await supabase
            .from('classes')
            .select('id, name, room_code, created_at')
            .eq('teacher_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!classes || classes.length === 0) {
            list.innerHTML =
                '<p class="muted">Nenhuma turma cadastrada ainda.</p>';
            return;
        }

        list.innerHTML = '<h3>Turmas cadastradas</h3>';

        classes.forEach((turma) => {
            const item = document.createElement('div');
            item.className = 'item';

            const nome = document.createElement('strong');
            nome.textContent = turma.name;

            const codigo = document.createElement('strong');
            codigo.textContent = turma.room_code;

            const data = document.createElement('span');
            data.className = 'muted';

            const textoData = turma.created_at
                ? new Date(turma.created_at).toLocaleDateString('pt-BR')
                : '';

            data.textContent = textoData ? ` (${textoData})` : '';

            item.append(
                nome,
                document.createTextNode(' — código '),
                codigo,
                data
            );

            list.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar turmas:', error);

        list.textContent =
            'Não foi possível carregar as turmas. Confira o Console (F12).';
    }
}


function renderQuestions() {
    const all = read('aventuraTeacherQuestions', {});
    let html = '';

    Object.keys(all).sort().forEach((level) => {
        (all[level] || []).forEach((q) => {
            html += `
        <div class="item">
          <strong>Fase ${escapeHtml(level)}:</strong>
          ${escapeHtml(q.q)}<br>
          <span class="muted">
            ${q.options.map(escapeHtml).join(' · ')}
            | correta: ${escapeHtml(q.answer)}
          </span>
        </div>
      `;
        });
    });

    $('question-list').innerHTML = html ||
        '<p class="muted">Nenhum desafio personalizado cadastrado.</p>';
}

async function render() {
    const p = read('aventuraMatematicaProgress', {
        completedLevels: [],
        score: 0,
        achievements: []
    });

    $('completed').textContent =
        (p.completedLevels || []).length;
    $('score').textContent = p.score || 0;
    $('achievements').textContent =
        (p.achievements || []).length;

    $('performance').innerHTML = `
    <div class="item">
      <strong>Progresso salvo neste navegador</strong>
      <p>Fases: ${escapeHtml(
        (p.completedLevels || []).join(', ') ||
        'Ainda não há fases concluídas'
    )
        }</p>
      <p>Pontuação: ${Number(p.score) || 0}</p>
      <p>Conquistas: ${escapeHtml(
            (p.achievements || []).join(', ') ||
            'Nenhuma registrada'
        )
        }</p>
    </div>
  `;

    await renderClasses();
    renderQuestions();
}

async function checkSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Erro ao verificar sessão:', error);
        showLogin();
        return;
    }

    if (data.session) {
        showDashboard();
    } else {
        showLogin();
    }
}

checkSession();
