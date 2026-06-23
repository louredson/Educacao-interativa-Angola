-- ═══════════════════════════════════════════════════════════════════════════════
-- Migração 004: Redesign do Fórum
--
-- Acrescenta ao fórum: votação (↑/↓) em tópicos e respostas, tópicos fixados,
-- marcação de resolvido com resposta aceite, tags e contador de visualizações.
--
-- Desenho:
--   • O score (`votos`) é denormalizado em topico_forum/resposta_forum para
--     listagens rápidas, mas a fonte de verdade é voto_topico/voto_resposta,
--     com UNIQUE(entidade, utilizador) — impede votos duplicados e permite toggle.
--   • Aditivo: as colunas `likes` existentes são mantidas (não usadas pela nova UI).
-- ═══════════════════════════════════════════════════════════════════════════════

USE economia_historia;

ALTER TABLE topico_forum
  ADD COLUMN tags               VARCHAR(255) NULL DEFAULT NULL AFTER categoria,
  ADD COLUMN fixado             TINYINT(1)   NOT NULL DEFAULT 0 AFTER requires_access,
  ADD COLUMN resolvido          TINYINT(1)   NOT NULL DEFAULT 0 AFTER fixado,
  ADD COLUMN resposta_aceite_id INT          NULL DEFAULT NULL AFTER resolvido,
  ADD COLUMN visualizacoes      INT          NOT NULL DEFAULT 0 AFTER respostas,
  ADD COLUMN votos              INT          NOT NULL DEFAULT 0 AFTER likes,
  ADD CONSTRAINT fk_topico_resposta_aceite
    FOREIGN KEY (resposta_aceite_id) REFERENCES resposta_forum(id) ON DELETE SET NULL;

ALTER TABLE resposta_forum
  ADD COLUMN votos INT NOT NULL DEFAULT 0 AFTER likes;

CREATE TABLE IF NOT EXISTS voto_topico (
    id            INT       AUTO_INCREMENT PRIMARY KEY,
    topico_id     INT       NOT NULL,
    utilizador_id INT       NOT NULL,
    valor         TINYINT   NOT NULL,  -- +1 (positivo) ou -1 (negativo)
    criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_voto_topico (topico_id, utilizador_id),
    FOREIGN KEY (topico_id)     REFERENCES topico_forum(id) ON DELETE CASCADE,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS voto_resposta (
    id            INT       AUTO_INCREMENT PRIMARY KEY,
    resposta_id   INT       NOT NULL,
    utilizador_id INT       NOT NULL,
    valor         TINYINT   NOT NULL,
    criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_voto_resposta (resposta_id, utilizador_id),
    FOREIGN KEY (resposta_id)   REFERENCES resposta_forum(id) ON DELETE CASCADE,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
