-- ═══════════════════════════════════════════════════════════════════════════════
-- Base de Dados: economia_historia
-- Schema completo — todas as tabelas em ordem de dependência
-- Inclui: schema base + artigos + suporte a denúncias de tópicos (fix 10)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS economia_historia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE economia_historia;

-- ─────────────────────────────────────────────────────────────────────────────
-- UTILIZADORES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE utilizador (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nome          VARCHAR(100)  NOT NULL,
    email         VARCHAR(100)  NOT NULL UNIQUE,
    senha_hash    VARCHAR(255)  NOT NULL,
    telemovel     VARCHAR(20)   NULL DEFAULT NULL,
    provincia     VARCHAR(50)   DEFAULT 'Luanda',
    instituicao   VARCHAR(150)  NULL DEFAULT NULL,
    curso         VARCHAR(100)  NULL DEFAULT NULL,
    tipo          ENUM('visitante', 'subscrito', 'admin') DEFAULT 'subscrito',
    avatar_url    VARCHAR(255)  NULL DEFAULT NULL,
    ativo         BOOLEAN       DEFAULT TRUE,
    criado_em     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    ultimo_acesso TIMESTAMP     NULL DEFAULT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RECUPERAÇÃO DE SENHA
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE password_resets (
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

-- ─────────────────────────────────────────────────────────────────────────────
-- CONTEÚDOS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE conteudo (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    titulo            VARCHAR(200)  NOT NULL,
    descricao         TEXT          NULL DEFAULT NULL,
    conteudo_completo LONGTEXT      NULL DEFAULT NULL,
    tipo              ENUM('video', 'texto_normal', 'texto_jindungo', 'podcast') NOT NULL,
    categoria         VARCHAR(50)   NULL DEFAULT NULL,
    tema              VARCHAR(100)  NULL DEFAULT NULL,
    duracao           VARCHAR(20)   NULL DEFAULT NULL,
    url_recurso       VARCHAR(255)  NULL DEFAULT NULL,
    recurso_filename  VARCHAR(255)  NULL DEFAULT NULL,
    imagem_filename   VARCHAR(255)  NULL DEFAULT NULL,
    video_filename    VARCHAR(255)  NULL DEFAULT NULL,
    apresentador      VARCHAR(100)  NULL DEFAULT NULL,
    categoria_podcast VARCHAR(50)   NULL DEFAULT NULL,
    cache_offline     BOOLEAN       DEFAULT FALSE,
    publicado_por     INT           NULL DEFAULT NULL,
    publicado_em      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publicado_por) REFERENCES utilizador(id) ON DELETE SET NULL
);

CREATE TABLE episodio_podcast (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    podcast_id      INT          NOT NULL,
    titulo          VARCHAR(150) NOT NULL,
    duracao         VARCHAR(20)  NOT NULL,
    descricao       TEXT         NULL DEFAULT NULL,
    data_publicacao DATE         NULL DEFAULT NULL,
    audio_filename  VARCHAR(255) NULL DEFAULT NULL,
    ordem           INT          DEFAULT 0,
    criado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (podcast_id) REFERENCES conteudo(id) ON DELETE CASCADE
);

CREATE TABLE conteudo_salvo (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    subscrito_id INT       NOT NULL,
    conteudo_id  INT       NOT NULL,
    salvo_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscrito_id) REFERENCES utilizador(id) ON DELETE CASCADE,
    FOREIGN KEY (conteudo_id)  REFERENCES conteudo(id)   ON DELETE CASCADE,
    UNIQUE KEY unique_salvo (subscrito_id, conteudo_id)
);

CREATE TABLE progresso_utilizador (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    subscrito_id          INT         NOT NULL,
    conteudo_id           INT         NOT NULL,
    concluido             BOOLEAN     DEFAULT FALSE,
    ultimo_ponto_parada   VARCHAR(20) NULL DEFAULT NULL,
    percentual_conclusao  INT         DEFAULT 0,
    visualizacoes         INT         DEFAULT 1,
    primeira_visualizacao TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    ultima_visualizacao   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subscrito_id) REFERENCES utilizador(id) ON DELETE CASCADE,
    FOREIGN KEY (conteudo_id)  REFERENCES conteudo(id)   ON DELETE CASCADE,
    UNIQUE KEY unique_progresso (subscrito_id, conteudo_id)
);

CREATE TABLE solicitacao_acesso_jindungo (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    subscrito_id         INT  NOT NULL,
    conteudo_id          INT  NOT NULL,
    motivo               TEXT NULL DEFAULT NULL,
    status               ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
    solicitado_em        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    respondido_em        TIMESTAMP NULL DEFAULT NULL,
    admin_responsavel    INT       NULL DEFAULT NULL,
    observacoes_resposta TEXT      NULL DEFAULT NULL,
    FOREIGN KEY (subscrito_id)      REFERENCES utilizador(id) ON DELETE CASCADE,
    FOREIGN KEY (conteudo_id)       REFERENCES conteudo(id)   ON DELETE CASCADE,
    FOREIGN KEY (admin_responsavel) REFERENCES utilizador(id) ON DELETE SET NULL,
    UNIQUE KEY unique_solicitacao_jindungo (subscrito_id, conteudo_id)
);

CREATE TABLE comentario_conteudo (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    conteudo_id       INT   NOT NULL,
    autor_id          INT   NOT NULL,
    comentario_pai_id INT   NULL DEFAULT NULL,
    comentario        TEXT  NOT NULL,
    likes             INT   DEFAULT 0,
    denunciado        BOOLEAN DEFAULT FALSE,
    editado           BOOLEAN DEFAULT FALSE,
    editado_em        TIMESTAMP NULL DEFAULT NULL,
    publicado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conteudo_id)       REFERENCES conteudo(id)            ON DELETE CASCADE,
    FOREIGN KEY (autor_id)          REFERENCES utilizador(id)          ON DELETE CASCADE,
    FOREIGN KEY (comentario_pai_id) REFERENCES comentario_conteudo(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- QUIZZES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE quiz (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    titulo             VARCHAR(100)  NOT NULL,
    descricao          TEXT          NULL DEFAULT NULL,
    categoria          VARCHAR(50)   NULL DEFAULT NULL,
    thumbnail_filename VARCHAR(255)  NULL DEFAULT NULL,
    ativo              BOOLEAN       DEFAULT TRUE,
    criado_por         INT           NULL DEFAULT NULL,
    criado_em          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (criado_por) REFERENCES utilizador(id) ON DELETE SET NULL
);

CREATE TABLE quiz_pergunta (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id          INT           NOT NULL,
    pergunta         TEXT          NOT NULL,
    opcao_a          VARCHAR(255)  NOT NULL,
    opcao_b          VARCHAR(255)  NOT NULL,
    opcao_c          VARCHAR(255)  NOT NULL,
    opcao_d          VARCHAR(255)  NOT NULL,
    resposta_correta TINYINT       NOT NULL,
    explicacao       TEXT          NULL DEFAULT NULL,
    ordem            INT           DEFAULT 0,
    criado_em        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE
);

CREATE TABLE resposta_quiz (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    subscrito_id            INT     NOT NULL,
    quiz_id                 INT     NOT NULL,
    pergunta_id             INT     NOT NULL,
    resposta_escolhida      CHAR(1) NULL DEFAULT NULL,
    correta                 BOOLEAN NULL DEFAULT NULL,
    tempo_resposta_segundos INT     NULL DEFAULT NULL,
    respondido_em           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscrito_id) REFERENCES utilizador(id)    ON DELETE CASCADE,
    FOREIGN KEY (quiz_id)      REFERENCES quiz(id)          ON DELETE CASCADE,
    FOREIGN KEY (pergunta_id)  REFERENCES quiz_pergunta(id) ON DELETE CASCADE
);

CREATE TABLE resposta_quiz_usuario (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id        INT  NOT NULL,
    quiz_id           INT  NOT NULL,
    pontuacao         INT  DEFAULT 0,
    total_perguntas   INT  DEFAULT 0,
    percentual_acerto INT  DEFAULT 0,
    data_realizacao   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES utilizador(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id)    REFERENCES quiz(id)       ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- FÓRUM
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE topico_forum (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    titulo           VARCHAR(150)  NOT NULL,
    descricao        TEXT          NOT NULL,
    criado_por       INT           NOT NULL,
    tipo_privacidade ENUM('publico', 'privado') DEFAULT 'publico',
    categoria        VARCHAR(50)   NULL DEFAULT NULL,
    requires_access  BOOLEAN       DEFAULT FALSE,
    likes            INT           DEFAULT 0,
    respostas        INT           DEFAULT 0,
    criado_em        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    ultima_atividade TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (criado_por) REFERENCES utilizador(id) ON DELETE CASCADE,
    FULLTEXT KEY ft_topico (titulo, descricao)
);

CREATE TABLE resposta_forum (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    topico_id       INT   NOT NULL,
    autor_id        INT   NOT NULL,
    resposta_pai_id INT   NULL DEFAULT NULL,
    conteudo        TEXT  NOT NULL,
    likes           INT   DEFAULT 0,
    denunciado      BOOLEAN DEFAULT FALSE,
    publicado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topico_id)       REFERENCES topico_forum(id)   ON DELETE CASCADE,
    FOREIGN KEY (autor_id)        REFERENCES utilizador(id)     ON DELETE CASCADE,
    FOREIGN KEY (resposta_pai_id) REFERENCES resposta_forum(id) ON DELETE CASCADE
);

CREATE TABLE like_resposta_forum (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    resposta_id INT NOT NULL,
    usuario_id  INT NOT NULL,
    FOREIGN KEY (resposta_id) REFERENCES resposta_forum(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)  REFERENCES utilizador(id)     ON DELETE CASCADE,
    UNIQUE KEY unique_like_resposta (resposta_id, usuario_id)
);

CREATE TABLE topico_privado_acesso (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    topico_id         INT  NOT NULL,
    subscrito_id      INT  NOT NULL,
    status            ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
    motivo            TEXT NULL DEFAULT NULL,
    solicitado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    respondido_em     TIMESTAMP NULL DEFAULT NULL,
    admin_responsavel INT       NULL DEFAULT NULL,
    FOREIGN KEY (topico_id)         REFERENCES topico_forum(id) ON DELETE CASCADE,
    FOREIGN KEY (subscrito_id)      REFERENCES utilizador(id)   ON DELETE CASCADE,
    FOREIGN KEY (admin_responsavel) REFERENCES utilizador(id)   ON DELETE SET NULL,
    UNIQUE KEY unique_solicitacao_topico (topico_id, subscrito_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DENÚNCIAS
-- Suporta denúncias de respostas do fórum (resposta_forum_id)
-- e denúncias de tópicos inteiros (topico_forum_id).
-- Exactamente um dos dois campos deve ser preenchido por registo.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE denuncia (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    resposta_forum_id     INT          NULL DEFAULT NULL,
    topico_forum_id       INT          NULL DEFAULT NULL,
    denunciado_por        INT          NOT NULL,
    motivo                VARCHAR(100) NULL DEFAULT NULL,
    descricao_detalhada   TEXT         NULL DEFAULT NULL,
    status                ENUM('pendente', 'ignorada', 'removida', 'banido') DEFAULT 'pendente',
    admin_acao            INT          NULL DEFAULT NULL,
    resolvido_em          TIMESTAMP    NULL DEFAULT NULL,
    observacoes_moderacao TEXT         NULL DEFAULT NULL,
    FOREIGN KEY (resposta_forum_id) REFERENCES resposta_forum(id) ON DELETE CASCADE,
    FOREIGN KEY (topico_forum_id)   REFERENCES topico_forum(id)   ON DELETE CASCADE,
    FOREIGN KEY (denunciado_por)    REFERENCES utilizador(id)      ON DELETE CASCADE,
    FOREIGN KEY (admin_acao)        REFERENCES utilizador(id)      ON DELETE SET NULL,
    UNIQUE KEY unique_denuncia_resposta (resposta_forum_id, denunciado_por),
    UNIQUE KEY unique_denuncia_topico   (topico_forum_id,   denunciado_por)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ARTIGOS (sistema de publicação com blocos de conteúdo rico)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE artigo (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    titulo        VARCHAR(250)  NOT NULL,
    subtitulo     VARCHAR(350)  NULL DEFAULT NULL,
    slug          VARCHAR(280)  NOT NULL UNIQUE,
    resumo        TEXT          NULL DEFAULT NULL,
    capa_url      VARCHAR(500)  NULL DEFAULT NULL,
    categoria     VARCHAR(80)   NULL DEFAULT NULL,
    tags          JSON          NULL DEFAULT NULL,
    status        ENUM('rascunho', 'publicado', 'arquivado') DEFAULT 'rascunho',
    destaque      BOOLEAN       DEFAULT FALSE,
    autor_id      INT           NOT NULL,
    visualizacoes INT           DEFAULT 0,
    tempo_leitura INT           DEFAULT 0,
    criado_em     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    publicado_em  TIMESTAMP     NULL DEFAULT NULL,
    FOREIGN KEY (autor_id) REFERENCES utilizador(id) ON DELETE CASCADE,
    FULLTEXT KEY ft_artigo (titulo, subtitulo, resumo),
    INDEX idx_artigo_status    (status),
    INDEX idx_artigo_autor     (autor_id),
    INDEX idx_artigo_categoria (categoria),
    INDEX idx_artigo_destaque  (destaque),
    INDEX idx_artigo_publicado (publicado_em)
);

CREATE TABLE artigo_bloco (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    artigo_id   INT           NOT NULL,
    tipo        ENUM(
                    'paragrafo',
                    'titulo_secao',
                    'subtitulo_secao',
                    'imagem',
                    'video_url',
                    'video_upload',
                    'citacao',
                    'destaque',
                    'separador',
                    'lista',
                    'codigo'
                ) NOT NULL,
    conteudo    LONGTEXT      NULL DEFAULT NULL,
    url         VARCHAR(500)  NULL DEFAULT NULL,
    filename    VARCHAR(255)  NULL DEFAULT NULL,
    legenda     VARCHAR(350)  NULL DEFAULT NULL,
    alt_text    VARCHAR(255)  NULL DEFAULT NULL,
    alinhamento ENUM('esquerda','centro','direita','largura_total') DEFAULT 'esquerda',
    largura     ENUM('normal','medio','amplo','total') DEFAULT 'normal',
    ordem       INT           NOT NULL DEFAULT 0,
    meta        JSON          NULL DEFAULT NULL,
    criado_em   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artigo_id) REFERENCES artigo(id) ON DELETE CASCADE,
    INDEX idx_artigo_ordem (artigo_id, ordem)
);

CREATE TABLE artigo_autor_permitido (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id INT  NOT NULL,
    permitido_por INT  NOT NULL,
    ativo         BOOLEAN DEFAULT TRUE,
    pode_publicar BOOLEAN DEFAULT FALSE,
    observacoes   TEXT NULL DEFAULT NULL,
    concedido_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revogado_em   TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id) ON DELETE CASCADE,
    FOREIGN KEY (permitido_por) REFERENCES utilizador(id) ON DELETE CASCADE,
    UNIQUE KEY unique_autor (utilizador_id)
);

CREATE TABLE artigo_comentario (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    artigo_id         INT   NOT NULL,
    autor_id          INT   NOT NULL,
    comentario_pai_id INT   NULL DEFAULT NULL,
    conteudo          TEXT  NOT NULL,
    likes             INT   DEFAULT 0,
    publicado_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artigo_id)         REFERENCES artigo(id)            ON DELETE CASCADE,
    FOREIGN KEY (autor_id)          REFERENCES utilizador(id)        ON DELETE CASCADE,
    FOREIGN KEY (comentario_pai_id) REFERENCES artigo_comentario(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICAÇÕES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE notificacao (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id   INT          NOT NULL,
    tipo         ENUM(
                    'novo_quiz',
                    'novo_topico',
                    'like_comentario',
                    'resposta_comentario',
                    'acesso_jindungo_aprovado',
                    'acesso_topico_aprovado',
                    'nova_resposta_forum',
                    'email_confirmacao',
                    'recuperacao_senha'
                 ) NOT NULL,
    entidade_id  INT          NULL DEFAULT NULL,
    titulo       VARCHAR(150) NULL DEFAULT NULL,
    mensagem     VARCHAR(255) NOT NULL,
    link_destino VARCHAR(255) NULL DEFAULT NULL,
    lida         BOOLEAN      DEFAULT FALSE,
    lida_em      TIMESTAMP    NULL DEFAULT NULL,
    criada_em    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES utilizador(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- OUTROS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE livro_do_dia (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    titulo               VARCHAR(150) NOT NULL,
    autor                VARCHAR(100) NULL DEFAULT NULL,
    ano                  VARCHAR(10)  NULL DEFAULT NULL,
    editora              VARCHAR(100) NULL DEFAULT NULL,
    genero               VARCHAR(50)  NULL DEFAULT NULL,
    autor_image_filename VARCHAR(255) NULL DEFAULT NULL,
    sobre_autor          TEXT         NULL DEFAULT NULL,
    trecho               TEXT         NULL DEFAULT NULL,
    citacao_destaque     TEXT         NULL DEFAULT NULL,
    likes                INT          DEFAULT 0,
    comentarios          INT          DEFAULT 0,
    publicado_em         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artigo_usuario (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT          NOT NULL,
    titulo      VARCHAR(150) NOT NULL,
    conteudo    TEXT         NOT NULL,
    categoria   VARCHAR(50)  NULL DEFAULT NULL,
    comentarios INT          DEFAULT 0,
    criado_em   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES utilizador(id) ON DELETE CASCADE
);

CREATE TABLE topico_usuario (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT          NOT NULL,
    titulo     VARCHAR(150) NOT NULL,
    conteudo   TEXT         NOT NULL,
    respostas  INT          DEFAULT 0,
    criado_em  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES utilizador(id) ON DELETE CASCADE
);
