# Aventura Matemática — MVP

MVP funcional do jogo educacional com área do aluno e painel do professor.

## O que já existe
- Jogar livremente ou com token temporário de turma.
- Username sem nome completo + avatar fornecido pelo jogo.
- Instruções com narração por voz do navegador.
- Acessibilidade: alto contraste, tamanho do texto e narração.
- Fase 1 demonstrativa com exploração simples, porta bloqueada e desafio matemático.
- Vidas, moedas, pontuação e conclusão de fase.
- Painel do professor com autenticação JWT quando o banco está configurado.
- Cadastro de turma, geração de token de 24h, cadastro de questão e visão de desempenho.
- Modo demonstrativo do painel para apresentação sem banco.
- PostgreSQL pronto para Supabase.

## 1. Rodar apenas a demonstração visual
O projeto precisa ser servido por HTTP. Com Node instalado:

```bash
npm install
npm start
```

Abra http://localhost:3000 e use **VER PAINEL DEMONSTRATIVO** se ainda não configurou o banco.

## 2. Configurar PostgreSQL/Supabase
1. Crie um projeto gratuito no Supabase.
2. Abra o SQL Editor e execute `sql/schema.sql`.
3. Copie `.env.example` para `.env`.
4. Coloque a connection string PostgreSQL em `DATABASE_URL`.
5. Defina `JWT_SECRET` e `SETUP_KEY` com valores fortes.
6. Reinicie `npm start`.

## 3. Criar o primeiro professor
Faça uma requisição POST para `/api/setup` uma única vez:

```json
{
  "setupKey": "SUA_SETUP_KEY",
  "usuario": "professor01",
  "senha": "uma-senha-forte"
}
```

Depois entre pela Área do Professor.

## Privacidade/LGPD no MVP
- Não solicita nome completo, e-mail, telefone, foto ou data de nascimento do aluno.
- Recomenda explicitamente username não identificável.
- Avatares são fornecidos pelo próprio jogo.
- Token de turma é temporário e expira em 24 horas.
- A área administrativa exige autenticação no backend.
- Senhas de professores são armazenadas com hash bcrypt.
- O projeto evita armazenar o token de turma no registro do jogador; apenas a relação com a turma é persistida.

> Antes de uso real com crianças em escolas, a instituição responsável deve validar base legal, transparência, retenção/exclusão, responsabilidades e demais obrigações aplicáveis da LGPD. Este repositório é um MVP acadêmico, não uma certificação de conformidade.

## Próximos passos depois do MVP
- Phaser.js para plataforma 2D completa.
- Fases 2–4 + bônus.
- Conquistas/medalhas.
- CRUD completo (editar/excluir questões e turmas).
- Políticas RLS no Supabase e testes de autorização.
- Relatórios por operação/dificuldade.
- Testes de acessibilidade com teclado/leitor de tela.
