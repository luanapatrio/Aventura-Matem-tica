require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
app.use(cors()); app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;
const secret = process.env.JWT_SECRET || 'dev-only-change-me';
const db = async (text, params = []) => { if (!pool) throw new Error('Banco não configurado'); return pool.query(text, params); };
const auth = (req, res, next) => { try { const t = (req.headers.authorization || '').replace('Bearer ', ''); req.user = jwt.verify(t, secret); next(); } catch { res.status(401).json({ erro: 'Não autorizado' }); } };

app.get('/api/health', (_, res) => res.json({ ok: true, banco: !!pool }));
app.post('/api/setup', async (req, res) => {
  if (req.body.setupKey !== process.env.SETUP_KEY) return res.status(403).json({ erro: 'Chave inválida' });
  try {
    const c = await db('SELECT COUNT(*)::int n FROM professores'); if (c.rows[0].n) return res.status(409).json({ erro: 'Professor já configurado' });
    const hash = await bcrypt.hash(req.body.senha, 12); const r = await db('INSERT INTO professores(usuario,senha_hash) VALUES($1,$2) RETURNING id,usuario', [req.body.usuario, hash]); res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});
app.post('/api/login', async (req, res) => { try { const r = await db('SELECT * FROM professores WHERE usuario=$1', [req.body.usuario]); if (!r.rowCount || !(await bcrypt.compare(req.body.senha, r.rows[0].senha_hash))) return res.status(401).json({ erro: 'Credenciais inválidas' }); const p = r.rows[0]; res.json({ token: jwt.sign({ id: p.id, role: 'professor' }, secret, { expiresIn: '8h' }), usuario: p.usuario }); } catch (e) { res.status(500).json({ erro: e.message }); } });
app.get('/api/turmas', auth, async (req, res) => { try { res.json((await db('SELECT * FROM turmas WHERE professor_id=$1 ORDER BY id DESC', [req.user.id])).rows) } catch (e) { res.status(500).json({ erro: e.message }) } });
app.post('/api/turmas', auth, async (req, res) => { try { res.json((await db('INSERT INTO turmas(professor_id,nome) VALUES($1,$2) RETURNING *', [req.user.id, req.body.nome])).rows[0]) } catch (e) { res.status(500).json({ erro: e.message }) } });
app.post('/api/turmas/:id/token', auth, async (req, res) => { try { const own = await db('SELECT id FROM turmas WHERE id=$1 AND professor_id=$2', [req.params.id, req.user.id]); if (!own.rowCount) return res.status(404).json({ erro: 'Turma não encontrada' }); const token = crypto.randomBytes(3).toString('hex').toUpperCase(); const r = await db("INSERT INTO sessoes_turma(turma_id,token,expira_em) VALUES($1,$2,NOW()+INTERVAL '24 hours') RETURNING token,expira_em", [req.params.id, token]); res.json(r.rows[0]); } catch (e) { res.status(500).json({ erro: e.message }) } });
app.post('/api/jogadores', async (req, res) => { try { let turma = null; if (req.body.token) { const t = await db('SELECT turma_id FROM sessoes_turma WHERE token=$1 AND ativo=TRUE AND expira_em>NOW()', [req.body.token]); if (!t.rowCount) return res.status(400).json({ erro: 'Token inválido ou expirado' }); turma = t.rows[0].turma_id; } const r = await db('INSERT INTO jogadores(username,avatar,turma_id) VALUES($1,$2,$3) RETURNING id,username,avatar,turma_id', [req.body.username, req.body.avatar, turma]); res.json(r.rows[0]); } catch (e) { res.status(500).json({ erro: e.message }) } });
app.get('/api/questoes/fase/:fase', async (req, res) => { try { const r = await db('SELECT id,enunciado,alternativa_a,alternativa_b,alternativa_c FROM questoes WHERE fase=$1 AND ativa=TRUE ORDER BY random() LIMIT 1', [req.params.fase]); res.json(r.rows[0] || { id: null, enunciado: '8 + 7 = ?', alternativa_a: '13', alternativa_b: '15', alternativa_c: '17' }); } catch { res.json({ id: null, enunciado: '8 + 7 = ?', alternativa_a: '13', alternativa_b: '15', alternativa_c: '17' }) } });
app.post('/api/questoes', auth, async (req, res) => { try { const q = req.body; const r = await db('INSERT INTO questoes(professor_id,enunciado,alternativa_a,alternativa_b,alternativa_c,correta,dificuldade,fase) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [req.user.id, q.enunciado, q.a, q.b, q.c, q.correta, q.dificuldade, q.fase]); res.json(r.rows[0]) } catch (e) { res.status(500).json({ erro: e.message }) } });
app.post('/api/respostas', async (req, res) => { try { let acertou = req.body.resposta === 'B'; if (req.body.questaoId) { const q = await db('SELECT correta FROM questoes WHERE id=$1', [req.body.questaoId]); if (q.rowCount) acertou = q.rows[0].correta === req.body.resposta; } const pts = acertou ? 100 : 0, moedas = acertou ? 10 : 0; if (req.body.jogadorId) await db('INSERT INTO resultados(jogador_id,questao_id,fase,acertou,pontuacao,moedas) VALUES($1,$2,$3,$4,$5,$6)', [req.body.jogadorId, req.body.questaoId || null, req.body.fase || 1, acertou, pts, moedas]); res.json({ acertou, pontos: pts, moedas }); } catch (e) { res.status(500).json({ erro: e.message }) } });
app.get('/api/desempenho', auth, async (req, res) => { try { const r = await db(`SELECT t.nome turma,j.username,j.avatar,COUNT(r.id)::int respostas,COALESCE(SUM(CASE WHEN r.acertou THEN 1 ELSE 0 END),0)::int acertos,COALESCE(SUM(r.pontuacao),0)::int pontos FROM turmas t JOIN jogadores j ON j.turma_id=t.id LEFT JOIN resultados r ON r.jogador_id=j.id WHERE t.professor_id=$1 GROUP BY t.nome,j.id ORDER BY t.nome,j.username`, [req.user.id]); res.json(r.rows) } catch (e) { res.status(500).json({ erro: e.message }) } });
app.get('*', (_, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.listen(process.env.PORT || 3000, () => console.log('Aventura Matemática em http://localhost:' + (process.env.PORT || 3000)));
