-- Migration 012: corrige o ENUM de `notificacao.tipo`, que estava incompleto
-- e fazia falhar (erro SQL) sempre que:
--   - alguém solicitava acesso a um "Texto com Jindungo" ('pedido_acesso_jindungo')
--   - um pedido de Jindungo era rejeitado ('acesso_jindungo_rejeitado')
--   - alguém comentava um conteúdo ('novo_comentario_conteudo')
-- Também adiciona os tipos novos usados para convites de salas/tópicos
-- enviados como notificação (com aceitar/recusar directamente na notificação).
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
    'convite_topico'
  ) NOT NULL;
