
import { supabase } from './supabase-client.js';
function showToast(message, type = 'success') {
    const toastElement = $('successToast');
    const toastMessage = $('toastMessage');

    toastMessage.textContent = message;

    toastElement.className =
        `toast align-items-center text-bg-${type} border-0`;

    const toast = bootstrap.Toast.getOrCreateInstance(
        toastElement,
        { delay: 3500 }
    );

    toast.show();
}
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
        await loadStudentClasses();


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





$('save-question').addEventListener('click', async () => {
    const q = $('question-text').value.trim();
    const a = $('option-a').value.trim();
    const b = $('option-b').value.trim();
    const c = $('option-c').value.trim();

    const key = $('correct-option').value;
    const level = Number($('question-level').value);
    const difficulty = $('difficulty').value;

    if (!q || !a || !b || !c) {
        alert('Preencha a pergunta e as três alternativas.');
        return;
    }

    if (!['a', 'b', 'c'].includes(key)) {
        alert('Selecione a alternativa correta.');
        return;
    }

    const button = $('save-question');
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

        const { data, error } = await supabase
            .from('questions')
            .insert({
                teacher_id: user.id,
                level: level,
                difficulty: difficulty,
                prompt: q,
                option_a: a,
                option_b: b,
                option_c: c,
                correct_option: key
            })
            .select('id')
            .single();

        if (error) throw error;

        console.log('Pergunta cadastrada. ID:', data.id);

        $('question-text').value = '';
        $('option-a').value = '';
        $('option-b').value = '';
        $('option-c').value = '';

        await renderQuestions();

        showToast('Pergunta cadastrada com sucesso!');

    } catch (error) {
        console.error('Erro ao salvar pergunta:', error);

        alert(
            'Não foi possível salvar a pergunta. Confira o Console (F12).'
        );

    } finally {
        button.disabled = false;
        button.textContent = 'Salvar pergunta';
    }
});


$('clear-questions').addEventListener('click', async () => {
    const confirmar = confirm(
        'Deseja apagar todas as suas perguntas personalizadas? Essa ação não pode ser desfeita.'
    );

    if (!confirmar) return;

    try {
        const { data: authData, error: authError } =
            await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
            throw new Error('Entre novamente para continuar.');
        }

        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('teacher_id', user.id);

        if (error) throw error;

        await renderQuestions();

        alert('Suas perguntas personalizadas foram apagadas!');

    } catch (error) {
        console.error('Erro ao apagar perguntas:', error);

        alert('Não foi possível apagar as perguntas. Confira o Console (F12).');
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



async function renderQuestions() {
    const list = $('question-list');

    list.textContent = 'Carregando perguntas...';

    try {
        const { data: authData, error: authError } =
            await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
            list.textContent = 'Entre novamente para consultar as perguntas.';
            return;
        }

        const { data: questions, error } = await supabase
            .from('questions')
            .select('id, level, difficulty, prompt, option_a, option_b, option_c, correct_option')
            .eq('teacher_id', user.id);

        if (error) throw error;

        if (!questions || questions.length === 0) {
            list.innerHTML =
                '<p class="muted">Nenhum desafio personalizado cadastrado.</p>';
            return;
        }

        list.innerHTML = '<h3>Desafios cadastrados</h3>';

        questions.forEach((q) => {
            const item = document.createElement('div');
            item.className = 'item';

            const title = document.createElement('strong');
            title.textContent = `Fase ${q.level}: ${q.prompt}`;

            const details = document.createElement('p');
            details.className = 'muted';

            details.textContent =
                `A: ${q.option_a} · B: ${q.option_b} · C: ${q.option_c} | ` +
                `Correta: ${String(q.correct_option).toUpperCase()} | ` +
                `Dificuldade: ${q.difficulty}`;

            item.append(title, details);
            list.appendChild(item);
        });

    } catch (error) {
        console.error('Erro ao carregar perguntas:', error);

        list.textContent =
            'Não foi possível carregar as perguntas. Confira o Console (F12).';
    }
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
    await renderQuestions();
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

let studentClasses = [];

async function loadStudentClasses() {
    const select = $('student-class');

    const { data: authData, error: authError } =
        await supabase.auth.getUser();

    if (authError) throw authError;

    const user = authData.user;

    if (!user) {
        throw new Error('Faça login novamente.');
    }

    const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', user.id)
        .order('name');

    if (error) throw error;

    studentClasses = data || [];

    select.innerHTML = '';

    if (studentClasses.length === 0) {
        select.innerHTML =
            '<option value="">Cadastre uma turma primeiro</option>';
        return;
    }

    select.innerHTML =
        '<option value="">Selecione uma turma</option>';

    studentClasses.forEach((turma) => {
        const option = document.createElement('option');
        option.value = turma.id;
        option.textContent = turma.name;
        select.appendChild(option);
    });
}

function generateStudentCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomValues = new Uint8Array(8);

    crypto.getRandomValues(randomValues);

    return Array.from(randomValues)
        .map(value => alphabet[value % alphabet.length])
        .join('');
}

$('generate-student-codes').addEventListener('click', async () => {
    const classId = $('student-class').value;
    const quantity = Number($('student-quantity').value);
    const button = $('generate-student-codes');
    const output = $('student-code-list');

    if (!classId) {
        showToast('Selecione uma turma.', 'warning');
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 40) {
        showToast('Escolha uma quantidade entre 1 e 40.', 'warning');
        return;
    }

    button.disabled = true;
    button.textContent = 'Gerando códigos...';
    output.textContent = 'Gerando códigos...';

    const generatedCodes = [];

    try {
        const { data: authData, error: authError } =
            await supabase.auth.getUser();

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error('Sua sessão expirou. Entre novamente.');
        }

        for (let i = 0; i < quantity; i++) {
            let saved = false;

            for (let attempt = 0; attempt < 5 && !saved; attempt++) {
                const code = generateStudentCode();

                const { error } = await supabase
                    .from('students')
                    .insert({
                        class_id: classId,
                        student_code: code,
                        nickname: null,
                        nickname_status: 'pending'
                    });

                if (!error) {
                    generatedCodes.push(code);
                    saved = true;
                } else if (error.code !== '23505') {
                    throw error;
                }
            }

            if (!saved) {
                throw new Error(
                    'Não foi possível gerar um código único. Tente novamente.'
                );
            }
        }

        output.innerHTML = '<h4>Códigos gerados</h4>';

        generatedCodes.forEach(code => {
            const item = document.createElement('div');
            item.className = 'item';

            const strong = document.createElement('strong');
            strong.textContent = code;

            const copyButton = document.createElement('button');
            copyButton.textContent = 'Copiar';

            copyButton.addEventListener('click', async () => {
                await navigator.clipboard.writeText(code);
                showToast('Código copiado!');
            });

            item.append(strong, copyButton);
            output.appendChild(item);
        });

        showToast(
            `${generatedCodes.length} códigos gerados com sucesso!`
        );

        await renderStudents();

    } catch (error) {
        console.error('Erro ao gerar códigos:', error);

        showToast(
            error.message || 'Não foi possível gerar os códigos.',
            'danger'
        );

        await renderStudents();

    } finally {
        button.disabled = false;
        button.textContent = 'Gerar códigos individuais';
    }
});


async function renderStudents() {
    const classId = $('student-class').value;
    const list = $('student-list');

    if (!classId) {
        list.textContent = 'Selecione uma turma.';
        return;
    }

    list.textContent = 'Carregando alunos...';

    try {
        const { data, error } = await supabase
            .from('students')
            .select('id, nickname, student_code, nickname_status')
            .eq('class_id', classId)
            .order('student_code');

        if (error) throw error;

        if (!data || data.length === 0) {
            list.textContent = 'Nenhum aluno cadastrado nesta turma.';
            return;
        }

        list.innerHTML = '';

        data.forEach(student => {
            const item = document.createElement('div');
            item.className = 'item';

            const nickname = document.createElement('strong');
            nickname.textContent =
                student.nickname || 'Aguardando apelido';

            const code = document.createElement('p');
            code.textContent = `Código: ${student.student_code}`;

            const status = document.createElement('p');
            status.textContent =
                `Situação: ${student.nickname_status}`;

            item.append(nickname, code, status);

            if (student.nickname) {
                const approveButton = document.createElement('button');
                approveButton.textContent = 'Aprovar';
                approveButton.addEventListener('click', () =>
                    updateNicknameStatus(student.id, 'approved')
                );

                const editButton = document.createElement('button');
                editButton.textContent = 'Editar';
                editButton.addEventListener('click', () =>
                    editStudentNickname(student)
                );

                const blockButton = document.createElement('button');
                blockButton.textContent = 'Bloquear';
                blockButton.addEventListener('click', () =>
                    updateNicknameStatus(student.id, 'blocked')
                );

                item.append(approveButton, editButton, blockButton);
            }

            list.appendChild(item);
        });

    } catch (error) {
        console.error('Erro ao consultar alunos:', error);
        list.textContent = 'Não foi possível carregar os alunos.';
    }
}
async function renderStudentPerformance() {
    const container = $('student-performance');
    <th>Histórico</th>
    container.textContent = 'Carregando desempenho...';

    try {
        // Identifica o professor conectado
        const { data: authData, error: authError } =
            await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;

        if (!user) {
            throw new Error('Sessão não encontrada.');
        }

        // Busca somente as turmas do professor
        const { data: classes, error: classesError } =
            await supabase
                .from('classes')
                .select('id, name')
                .eq('teacher_id', user.id);

        if (classesError) throw classesError;

        if (!classes || classes.length === 0) {
            container.textContent = 'Nenhuma turma cadastrada.';
            return;
        }

        const classIds = classes.map(turma => turma.id);

        const classNames = {};
        classes.forEach(turma => {
            classNames[turma.id] = turma.name;
        });

        // Busca os alunos dessas turmas
        const { data: students, error: studentsError } =
            await supabase
                .from('students')
                .select('id, nickname, student_code, class_id')
                .in('class_id', classIds)
                .order('student_code');

        if (studentsError) throw studentsError;

        if (!students || students.length === 0) {
            container.textContent = 'Nenhum aluno cadastrado nas suas turmas.';
            return;
        }

        const studentIds = students.map(student => student.id);

        // Busca as tentativas registradas desses alunos
        const { data: attempts, error: attemptsError } =
            await supabase
                .from('attempts')
                .select('student_id, is_correct, points')
                .in('student_id', studentIds);

        if (attemptsError) throw attemptsError;

        const attemptsByStudent = {};

        students.forEach(student => {
            attemptsByStudent[student.id] = {
                total: 0,
                correct: 0,
                incorrect: 0,
                points: 0
            };
        });

        (attempts || []).forEach(attempt => {
            const result = attemptsByStudent[attempt.student_id];

            if (!result) return;

            result.total++;

            if (attempt.is_correct) {
                result.correct++;
            } else {
                result.incorrect++;
            }

            result.points += Number(attempt.points) || 0;
        });

        // Monta a tabela de desempenho
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Turma</th>
                            <th>Tentativas</th>
                            <th>Acertos</th>
                            <th>Erros</th>
                            <th>Pontos</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(student => {
            const result = attemptsByStudent[student.id];

            return `
                                <tr>
                                    <td>${escapeHtml(
                student.nickname || 'Aguardando apelido'
            )}</td>
                                    <td>${escapeHtml(
                classNames[student.class_id] || '-'
            )}</td>
                                    <td>${result.total}</td>
                                    <td>${result.correct}</td>
                                    <td>${result.incorrect}</td>
                                    <td>${result.points}</td>
                                </tr>
                                <td>
    <button
        class="btn btn-primary btn-sm view-history"
        data-student-id="${student.id}"
        data-student-name="${escapeHtml(
                student.nickname || 'Aluno'
            )}">
        Ver histórico
    </button>
</td>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.querySelectorAll('.view-history').forEach(button => {
            button.addEventListener('click', () => {
                renderStudentHistory(
                    button.dataset.studentId,
                    button.dataset.studentName
                );
            });
        });
    } catch (error) {
        console.error('Erro ao carregar desempenho:', error);

        container.textContent =
            'Não foi possível carregar o desempenho dos alunos.';
    }
}

async function renderStudentHistory(studentId, studentName) {
    const container = $('student-history');

    container.textContent = 'Carregando histórico...';

    try {
        const { data, error } = await supabase
            .from('attempts')
            .select(`
                question_text,
                level,
                is_correct,
                points,
                answered_at
            `)
            .eq('student_id', studentId)
            .order('answered_at', { ascending: false });

        if (error) throw error;

        container.innerHTML = '';

        const title = document.createElement('h3');
        title.textContent = `Histórico de ${studentName}`;
        container.appendChild(title);

        if (!data || data.length === 0) {
            container.appendChild(
                document.createTextNode(
                    'Este aluno ainda não respondeu perguntas.'
                )
            );
            return;
        }

        data.forEach(attempt => {
            const item = document.createElement('div');
            item.className = 'item mb-3';

            const question = document.createElement('strong');
            question.textContent =
                attempt.question_text || 'Pergunta sem enunciado';

            const result = document.createElement('p');
            result.textContent = attempt.is_correct
                ? 'Resultado: Acertou'
                : 'Resultado: Errou';

            result.className = attempt.is_correct
                ? 'text-success'
                : 'text-danger';

            const details = document.createElement('p');
            details.className = 'muted';

            const date = attempt.answered_at
                ? new Date(attempt.answered_at).toLocaleString('pt-BR')
                : 'Data não disponível';

            details.textContent =
                `Fase: ${attempt.level} · ` +
                `Pontos: ${attempt.points} · ` +
                `Data: ${date}`;

            item.append(question, result, details);
            container.appendChild(item);
        });

    } catch (error) {
        console.error('Erro ao carregar histórico:', error);

        container.textContent =
            'Não foi possível carregar o histórico do aluno.';
    }
}

async function updateNicknameStatus(studentId, status) {
    try {
        const { error } = await supabase
            .from('students')
            .update({ nickname_status: status })
            .eq('id', studentId);

        if (error) throw error;

        showToast(
            status === 'approved'
                ? 'Apelido aprovado!'
                : 'Apelido bloqueado!'
        );

        await renderStudents();

    } catch (error) {
        console.error(error);
        showToast('Não foi possível atualizar o apelido.', 'danger');
    }
}

async function editStudentNickname(student) {
    const newNickname = prompt(
        'Digite o novo apelido:',
        student.nickname
    );

    if (newNickname === null) return;

    if (!newNickname.trim()) {
        showToast('O apelido não pode ficar vazio.', 'warning');
        return;
    }

    try {
        const { error } = await supabase
            .from('students')
            .update({
                nickname: newNickname.trim(),
                nickname_status: 'pending'
            })
            .eq('id', student.id);

        if (error) throw error;

        showToast('Apelido atualizado! Ele precisa ser aprovado novamente.');

        await renderStudents();

    } catch (error) {
        console.error(error);
        showToast('Não foi possível editar o apelido.', 'danger');
    }
}


$('student-class').addEventListener('change', renderStudents);

async function initializeStudentManagement() {
    try {
        await loadStudentClasses();
    } catch (error) {
        console.error('Erro ao carregar turmas dos alunos:', error);
        showToast('Não foi possível carregar as turmas.', 'danger');
    }
}
function showDashboard() {
    $('login').classList.add('hidden');
    $('dashboard').classList.remove('hidden');
    $('login-error').textContent = '';

    render();
    initializeStudentManagement();
    renderStudentPerformance();
}
checkSession();
