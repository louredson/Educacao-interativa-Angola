-- Migration 009: Anexo de ficheiro em respostas do fórum
ALTER TABLE resposta_forum
  ADD COLUMN ficheiro_url  VARCHAR(500) DEFAULT NULL AFTER conteudo,
  ADD COLUMN ficheiro_nome VARCHAR(255) DEFAULT NULL AFTER ficheiro_url;
