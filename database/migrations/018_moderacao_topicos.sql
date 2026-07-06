-- Migration 018: moderação efetiva de denúncias
--  1. Novo status 'oculto' nas denúncias (tópico escondido sem ser eliminado)
--  2. Coluna `oculto` em topico_forum para esconder tópicos denunciados
ALTER TABLE denuncia
  MODIFY COLUMN status ENUM('pendente','ignorada','removida','banido','oculto') DEFAULT 'pendente';

ALTER TABLE topico_forum
  ADD COLUMN oculto TINYINT(1) NOT NULL DEFAULT 0 AFTER fechado;
