-- Migration 007: Sistema de Convites para Salas de Discussão e Tópicos Privados

CREATE TABLE IF NOT EXISTS convite (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- A quê se refere o convite
  tipo            ENUM('sala','topico') NOT NULL,
  entidade_id     INT UNSIGNED NOT NULL,        -- sala_discussao.id ou topico_forum.id
  -- Quem convida
  criador_id      INT(11) NOT NULL,
  -- Código único de acesso (8 chars alfanumérico)
  codigo          VARCHAR(12) NOT NULL UNIQUE,
  -- Opcionalmente enviado para um email específico
  email_destino   VARCHAR(255) DEFAULT NULL,
  -- Limite de usos (NULL = ilimitado)
  max_usos        SMALLINT UNSIGNED DEFAULT 1,
  usos            SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  -- Validade
  expira_em       DATETIME DEFAULT NULL,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_convite_criador FOREIGN KEY (criador_id) REFERENCES utilizador(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_convite_codigo ON convite(codigo);
