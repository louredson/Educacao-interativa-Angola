-- Migration 005: Adicionar papel 'professor' ao tipo de utilizador
-- O papel professor tem permissões intermédias entre subscrito e admin:
--   - Pode criar e gerir Salas de Discussão
--   - Pode aprovar/rejeitar membros em salas que criou
--   - Pode criar tópicos privados sem necessidade de aprovação de admin
--   - NÃO tem acesso ao painel de administração geral

ALTER TABLE utilizador
  MODIFY COLUMN tipo ENUM('visitante','subscrito','professor','admin','superadmin')
    NOT NULL DEFAULT 'subscrito';
