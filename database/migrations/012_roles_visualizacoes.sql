-- Migration 012: Roles cleanup + unique view tracking
-- 1. Add 'professor' to utilizador.tipo ENUM (if not already)
-- 2. Remove 'superadmin' — migrate existing superadmin users to 'admin'
-- 3. Add visualizacoes column to conteudo (if not already)
-- 4. Add conteudo_visualizacao_unica table for unique-per-user view tracking

-- Step 1: Update existing superadmin users → admin
UPDATE utilizador SET tipo = 'admin' WHERE tipo = 'superadmin';

-- Step 2: Alter ENUM (adds professor, removes superadmin)
ALTER TABLE utilizador
  MODIFY COLUMN tipo ENUM('visitante','subscrito','professor','admin') DEFAULT 'subscrito';

-- Step 3: Add visualizacoes to conteudo if missing
ALTER TABLE conteudo ADD COLUMN IF NOT EXISTS visualizacoes INT NOT NULL DEFAULT 0;

-- Step 4: Unique view tracking table
CREATE TABLE IF NOT EXISTS conteudo_visualizacao_unica (
    conteudo_id   INT NOT NULL,
    utilizador_id INT NOT NULL,
    visto_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conteudo_id, utilizador_id),
    FOREIGN KEY (conteudo_id)   REFERENCES conteudo(id)   ON DELETE CASCADE,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id) ON DELETE CASCADE
);
