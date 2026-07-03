-- Migração 002: suporte a denúncias de tópicos do fórum
-- Torna resposta_forum_id opcional e adiciona topico_forum_id

ALTER TABLE denuncia
  DROP FOREIGN KEY denuncia_ibfk_1;          -- FK de resposta_forum_id (nome pode variar)

ALTER TABLE denuncia
  MODIFY COLUMN resposta_forum_id INT NULL DEFAULT NULL,
  ADD COLUMN   topico_forum_id    INT NULL DEFAULT NULL
    AFTER resposta_forum_id,
  ADD CONSTRAINT fk_denuncia_resposta
    FOREIGN KEY (resposta_forum_id) REFERENCES resposta_forum(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_denuncia_topico
    FOREIGN KEY (topico_forum_id)   REFERENCES topico_forum(id)   ON DELETE CASCADE,
  DROP INDEX unique_denuncia,
  ADD UNIQUE KEY unique_denuncia_resposta (resposta_forum_id, denunciado_por),
  ADD UNIQUE KEY unique_denuncia_topico   (topico_forum_id,   denunciado_por);
