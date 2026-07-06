-- Migration 016: adiciona o tipo de notificação 'denuncia_topico'
-- para avisar admins quando um tópico do fórum é denunciado.
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
    'comentario_denunciado',
    'denuncia_topico'
  ) NOT NULL;
