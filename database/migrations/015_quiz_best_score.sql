-- 015_quiz_best_score.sql
-- Garante que cada (usuario_id, quiz_id) tem apenas uma linha — a melhor pontuação.
-- Permite INSERT ... ON DUPLICATE KEY UPDATE no controller para manter sempre o melhor.

-- 1. Remover linhas duplicadas mantendo apenas a de maior pontuacao por (usuario_id, quiz_id)
DELETE r1 FROM resposta_quiz_usuario r1
INNER JOIN resposta_quiz_usuario r2
  ON r1.usuario_id = r2.usuario_id
 AND r1.quiz_id    = r2.quiz_id
 AND r1.pontuacao  < r2.pontuacao;

-- Caso de empate de pontuacao: manter a mais recente
DELETE r1 FROM resposta_quiz_usuario r1
INNER JOIN resposta_quiz_usuario r2
  ON r1.usuario_id      = r2.usuario_id
 AND r1.quiz_id         = r2.quiz_id
 AND r1.pontuacao       = r2.pontuacao
 AND r1.data_realizacao < r2.data_realizacao;

-- 2. Adicionar constraint UNIQUE (idempotente)
ALTER TABLE resposta_quiz_usuario
  ADD UNIQUE KEY uq_rqu_usuario_quiz (usuario_id, quiz_id);
