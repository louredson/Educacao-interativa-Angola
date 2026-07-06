-- Migration 011: Anexo de ficheiro em mensagens das salas de discussão
ALTER TABLE mensagem_sala
  ADD COLUMN ficheiro_url  VARCHAR(500) DEFAULT NULL AFTER mensagem,
  ADD COLUMN ficheiro_nome VARCHAR(255) DEFAULT NULL AFTER ficheiro_url;
