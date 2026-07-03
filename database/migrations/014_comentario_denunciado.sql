-- Migration 014: adiciona o tipo de notificação para comentários denunciados,
-- usado para avisar os administradores quando alguém denuncia um comentário
-- ofensivo, para que possam apagar ou ignorar a denúncia.
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
    'pedido_acesso_topico',
    'pedido_acesso_jindungo',
    'acesso_jindungo_rejeitado',
    'acesso_topico_rejeitado',
    'novo_comentario_conteudo',
    'convite_sala',
    'convite_topico',
    'comentario_denunciado'
  ) NOT NULL;
