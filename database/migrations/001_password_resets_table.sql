-- Migração 001: Tabela dedicada para tokens de reset de senha
-- Executar APÓS o schema.sql inicial.
-- Remove as colunas token_reset / token_reset_expira da tabela utilizador
-- e cria a tabela password_resets independente.

USE economia_historia;

-- 1. Cria a tabela dedicada (idempotente)
CREATE TABLE IF NOT EXISTS password_resets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME     NOT NULL,
    used       TINYINT(1)   DEFAULT 0,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES utilizador(id) ON DELETE CASCADE,
    INDEX idx_token   (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
);

-- 2. Remove colunas antigas da tabela utilizador (se existirem)
ALTER TABLE utilizador
    DROP COLUMN IF EXISTS token_reset,
    DROP COLUMN IF EXISTS token_reset_expira;
