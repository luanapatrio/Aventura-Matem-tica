CREATE TABLE
  IF NOT EXISTS professores (
    id BIGSERIAL PRIMARY KEY,
    usuario VARCHAR(40) UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW ()
  );

CREATE TABLE
  IF NOT EXISTS turmas (
    id BIGSERIAL PRIMARY KEY,
    professor_id BIGINT NOT NULL REFERENCES professores (id) ON DELETE CASCADE,
    nome VARCHAR(80) NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW ()
  );

CREATE TABLE
  IF NOT EXISTS sessoes_turma (
    id BIGSERIAL PRIMARY KEY,
    turma_id BIGINT NOT NULL REFERENCES turmas (id) ON DELETE CASCADE,
    token VARCHAR(20) UNIQUE NOT NULL,
    expira_em TIMESTAMPTZ NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
  );

CREATE TABLE
  IF NOT EXISTS jogadores (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    avatar VARCHAR(30) NOT NULL,
    turma_id BIGINT REFERENCES turmas (id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ DEFAULT NOW ()
  );

CREATE TABLE
  IF NOT EXISTS questoes (
    id BIGSERIAL PRIMARY KEY,
    professor_id BIGINT NOT NULL REFERENCES professores (id) ON DELETE CASCADE,
    enunciado VARCHAR(180) NOT NULL,
    alternativa_a VARCHAR(60) NOT NULL,
    alternativa_b VARCHAR(60) NOT NULL,
    alternativa_c VARCHAR(60) NOT NULL,
    correta CHAR(1) NOT NULL CHECK (correta IN ('A', 'B', 'C')),
    dificuldade VARCHAR(20) DEFAULT 'facil',
    fase INT DEFAULT 1 CHECK (fase BETWEEN 1 AND 5),
    ativa BOOLEAN DEFAULT TRUE
  );

CREATE TABLE
  IF NOT EXISTS resultados (
    id BIGSERIAL PRIMARY KEY,
    jogador_id BIGINT NOT NULL REFERENCES jogadores (id) ON DELETE CASCADE,
    questao_id BIGINT REFERENCES questoes (id) ON DELETE SET NULL,
    fase INT NOT NULL,
    acertou BOOLEAN NOT NULL,
    pontuacao INT DEFAULT 0,
    moedas INT DEFAULT 0,
    respondido_em TIMESTAMPTZ DEFAULT NOW ()
  );

CREATE INDEX IF NOT EXISTS idx_jogadores_turma ON jogadores (turma_id);

CREATE INDEX IF NOT EXISTS idx_resultados_jogador ON resultados (jogador_id);