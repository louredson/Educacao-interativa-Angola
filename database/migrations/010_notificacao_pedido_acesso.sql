-- Migration 010: Adicionar tipo de notificação para pedido de acesso a tópico privado
ALTER TABLE notificacao
  MODIFY COLUMN tipo ENUM(
    'novo_quiz',
    'novo_topico',
    'like_comentario',
    'resposta_comentario',
    'acesso_jindungo_aprovado',
    'acesso_topico_aprovado',
    'nova_resposta_forum',
    'email_confirmacao',
    'recuperacao_senha',
    'pedido_acesso_topico'
  ) NOT NULL;
