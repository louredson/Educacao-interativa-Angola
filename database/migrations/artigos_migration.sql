-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Sistema de Artigos com Blocos de Conteúdo Rico
-- Adicionar ao schema.sql da base de dados economia_historia
-- ═══════════════════════════════════════════════════════════════════════════

USE economia_historia;

-- ── Tabela principal de artigos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artigo (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    titulo          VARCHAR(250)  NOT NULL,
    subtitulo       VARCHAR(350)  NULL DEFAULT NULL,
    slug            VARCHAR(280)  NOT NULL UNIQUE,
    resumo          TEXT          NULL DEFAULT NULL,
    capa_url        VARCHAR(500)  NULL DEFAULT NULL,
    categoria       VARCHAR(80)   NULL DEFAULT NULL,
    tags            JSON          NULL DEFAULT NULL,          -- array de strings
    status          ENUM('rascunho', 'publicado', 'arquivado') DEFAULT 'rascunho',
    destaque        BOOLEAN       DEFAULT FALSE,
    autor_id        INT           NOT NULL,
    visualizacoes   INT           DEFAULT 0,
    tempo_leitura   INT           DEFAULT 0,                  -- minutos estimados
    criado_em       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    publicado_em    TIMESTAMP     NULL DEFAULT NULL,
    FOREIGN KEY (autor_id) REFERENCES utilizador(id) ON DELETE CASCADE,
    FULLTEXT KEY ft_artigo (titulo, subtitulo, resumo)
);

-- ── Blocos de conteúdo do artigo (texto, imagem, vídeo, citação, etc.) ───────
CREATE TABLE IF NOT EXISTS artigo_bloco (
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
    conteudo    LONGTEXT      NULL DEFAULT NULL,   -- texto, HTML, JSON
    url         VARCHAR(500)  NULL DEFAULT NULL,   -- para imagem/vídeo externos
    filename    VARCHAR(255)  NULL DEFAULT NULL,   -- para uploads locais
    legenda     VARCHAR(350)  NULL DEFAULT NULL,   -- caption de imagem/vídeo
    alt_text    VARCHAR(255)  NULL DEFAULT NULL,   -- acessibilidade
    alinhamento ENUM('esquerda','centro','direita','largura_total') DEFAULT 'esquerda',
    largura     ENUM('normal','medio','amplo','total') DEFAULT 'normal',
    ordem       INT           NOT NULL DEFAULT 0,
    meta        JSON          NULL DEFAULT NULL,   -- dados extras por tipo de bloco
    criado_em   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artigo_id) REFERENCES artigo(id) ON DELETE CASCADE,
    INDEX idx_artigo_ordem (artigo_id, ordem)
);

-- ── Permissões de autores (contas que podem criar artigos, além do admin) ────
CREATE TABLE IF NOT EXISTS artigo_autor_permitido (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    utilizador_id        INT  NOT NULL,
    permitido_por        INT  NOT NULL,    -- admin que concedeu a permissão
    ativo                BOOLEAN DEFAULT TRUE,
    pode_publicar        BOOLEAN DEFAULT FALSE,  -- ou só rascunho
    observacoes          TEXT NULL DEFAULT NULL,
    concedido_em         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revogado_em          TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (utilizador_id) REFERENCES utilizador(id) ON DELETE CASCADE,
    FOREIGN KEY (permitido_por) REFERENCES utilizador(id) ON DELETE CASCADE,
    UNIQUE KEY unique_autor (utilizador_id)
);

-- ── Comentários nos artigos ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artigo_comentario (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    artigo_id            INT   NOT NULL,
    autor_id             INT   NOT NULL,
    comentario_pai_id    INT   NULL DEFAULT NULL,
    conteudo             TEXT  NOT NULL,
    likes                INT   DEFAULT 0,
    publicado_em         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artigo_id)          REFERENCES artigo(id)             ON DELETE CASCADE,
    FOREIGN KEY (autor_id)           REFERENCES utilizador(id)         ON DELETE CASCADE,
    FOREIGN KEY (comentario_pai_id)  REFERENCES artigo_comentario(id)  ON DELETE CASCADE
);

-- ── Índices adicionais ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_artigo_status      ON artigo(status);
CREATE INDEX IF NOT EXISTS idx_artigo_autor       ON artigo(autor_id);
CREATE INDEX IF NOT EXISTS idx_artigo_categoria   ON artigo(categoria);
CREATE INDEX IF NOT EXISTS idx_artigo_destaque    ON artigo(destaque);
CREATE INDEX IF NOT EXISTS idx_artigo_publicado   ON artigo(publicado_em);
