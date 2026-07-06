
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `artigo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artigo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(250) NOT NULL,
  `subtitulo` varchar(350) DEFAULT NULL,
  `slug` varchar(280) NOT NULL,
  `resumo` text DEFAULT NULL,
  `capa_url` varchar(500) DEFAULT NULL,
  `categoria` varchar(80) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `status` enum('rascunho','publicado','arquivado') DEFAULT 'rascunho',
  `destaque` tinyint(1) DEFAULT 0,
  `autor_id` int(11) NOT NULL,
  `visualizacoes` int(11) DEFAULT 0,
  `tempo_leitura` int(11) DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `publicado_em` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_artigo_status` (`status`),
  KEY `idx_artigo_autor` (`autor_id`),
  KEY `idx_artigo_categoria` (`categoria`),
  KEY `idx_artigo_destaque` (`destaque`),
  KEY `idx_artigo_publicado` (`publicado_em`),
  FULLTEXT KEY `ft_artigo` (`titulo`,`subtitulo`,`resumo`),
  CONSTRAINT `artigo_ibfk_1` FOREIGN KEY (`autor_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artigo_autor_permitido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artigo_autor_permitido` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `utilizador_id` int(11) NOT NULL,
  `permitido_por` int(11) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `pode_publicar` tinyint(1) DEFAULT 0,
  `observacoes` text DEFAULT NULL,
  `concedido_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `revogado_em` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_autor` (`utilizador_id`),
  KEY `permitido_por` (`permitido_por`),
  CONSTRAINT `artigo_autor_permitido_ibfk_1` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `artigo_autor_permitido_ibfk_2` FOREIGN KEY (`permitido_por`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artigo_bloco`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artigo_bloco` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `artigo_id` int(11) NOT NULL,
  `tipo` enum('paragrafo','titulo_secao','subtitulo_secao','imagem','video_url','video_upload','citacao','destaque','separador','lista','codigo') NOT NULL,
  `conteudo` longtext DEFAULT NULL,
  `url` varchar(500) DEFAULT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `legenda` varchar(350) DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `alinhamento` enum('esquerda','centro','direita','largura_total') DEFAULT 'esquerda',
  `largura` enum('normal','medio','amplo','total') DEFAULT 'normal',
  `ordem` int(11) NOT NULL DEFAULT 0,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_artigo_ordem` (`artigo_id`,`ordem`),
  CONSTRAINT `artigo_bloco_ibfk_1` FOREIGN KEY (`artigo_id`) REFERENCES `artigo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artigo_comentario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artigo_comentario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `artigo_id` int(11) NOT NULL,
  `autor_id` int(11) NOT NULL,
  `comentario_pai_id` int(11) DEFAULT NULL,
  `conteudo` text NOT NULL,
  `likes` int(11) DEFAULT 0,
  `publicado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `artigo_id` (`artigo_id`),
  KEY `autor_id` (`autor_id`),
  KEY `comentario_pai_id` (`comentario_pai_id`),
  CONSTRAINT `artigo_comentario_ibfk_1` FOREIGN KEY (`artigo_id`) REFERENCES `artigo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `artigo_comentario_ibfk_2` FOREIGN KEY (`autor_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `artigo_comentario_ibfk_3` FOREIGN KEY (`comentario_pai_id`) REFERENCES `artigo_comentario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `artigo_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `artigo_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `conteudo` text NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `comentarios` int(11) DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `artigo_usuario_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `comentario_conteudo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comentario_conteudo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conteudo_id` int(11) NOT NULL,
  `autor_id` int(11) NOT NULL,
  `comentario_pai_id` int(11) DEFAULT NULL,
  `comentario` text NOT NULL,
  `likes` int(11) DEFAULT 0,
  `denunciado` tinyint(1) DEFAULT 0,
  `editado` tinyint(1) DEFAULT 0,
  `editado_em` timestamp NULL DEFAULT NULL,
  `publicado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `conteudo_id` (`conteudo_id`),
  KEY `autor_id` (`autor_id`),
  KEY `comentario_pai_id` (`comentario_pai_id`),
  CONSTRAINT `comentario_conteudo_ibfk_1` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentario_conteudo_ibfk_2` FOREIGN KEY (`autor_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentario_conteudo_ibfk_3` FOREIGN KEY (`comentario_pai_id`) REFERENCES `comentario_conteudo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `comentario_conteudo_like`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comentario_conteudo_like` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comentario_id` int(11) NOT NULL,
  `subscrito_id` int(11) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like_comentario` (`comentario_id`,`subscrito_id`),
  KEY `subscrito_id` (`subscrito_id`),
  CONSTRAINT `comentario_conteudo_like_ibfk_1` FOREIGN KEY (`comentario_id`) REFERENCES `comentario_conteudo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentario_conteudo_like_ibfk_2` FOREIGN KEY (`subscrito_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `conteudo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conteudo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `descricao` text DEFAULT NULL,
  `conteudo_completo` longtext DEFAULT NULL,
  `tipo` enum('video','texto_normal','texto_jindungo','podcast') NOT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `tema` varchar(100) DEFAULT NULL,
  `duracao` varchar(20) DEFAULT NULL,
  `url_recurso` varchar(255) DEFAULT NULL,
  `recurso_filename` varchar(255) DEFAULT NULL,
  `imagem_filename` varchar(255) DEFAULT NULL,
  `video_filename` varchar(255) DEFAULT NULL,
  `apresentador` varchar(100) DEFAULT NULL,
  `categoria_podcast` varchar(50) DEFAULT NULL,
  `cache_offline` tinyint(1) DEFAULT 0,
  `visualizacoes` int(11) DEFAULT 0,
  `publicado_por` int(11) DEFAULT NULL,
  `publicado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `publicado_por` (`publicado_por`),
  CONSTRAINT `conteudo_ibfk_1` FOREIGN KEY (`publicado_por`) REFERENCES `utilizador` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `conteudo_reacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conteudo_reacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conteudo_id` int(11) NOT NULL,
  `subscrito_id` int(11) NOT NULL,
  `tipo` enum('like','dislike') NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_reacao_conteudo` (`conteudo_id`,`subscrito_id`),
  KEY `subscrito_id` (`subscrito_id`),
  KEY `idx_reacao_conteudo_tipo` (`conteudo_id`,`tipo`),
  CONSTRAINT `conteudo_reacao_ibfk_1` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conteudo_reacao_ibfk_2` FOREIGN KEY (`subscrito_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `conteudo_salvo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conteudo_salvo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subscrito_id` int(11) NOT NULL,
  `conteudo_id` int(11) NOT NULL,
  `salvo_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_salvo` (`subscrito_id`,`conteudo_id`),
  KEY `conteudo_id` (`conteudo_id`),
  CONSTRAINT `conteudo_salvo_ibfk_1` FOREIGN KEY (`subscrito_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conteudo_salvo_ibfk_2` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `convite`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `convite` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tipo` enum('sala','topico') NOT NULL,
  `entidade_id` int(10) unsigned NOT NULL,
  `criador_id` int(11) NOT NULL,
  `codigo` varchar(12) NOT NULL,
  `email_destino` varchar(255) DEFAULT NULL,
  `max_usos` smallint(5) unsigned DEFAULT 1,
  `usos` smallint(5) unsigned NOT NULL DEFAULT 0,
  `expira_em` datetime DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `fk_convite_criador` (`criador_id`),
  KEY `idx_convite_codigo` (`codigo`),
  CONSTRAINT `fk_convite_criador` FOREIGN KEY (`criador_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `denuncia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `denuncia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resposta_forum_id` int(11) DEFAULT NULL,
  `topico_forum_id` int(11) DEFAULT NULL,
  `denunciado_por` int(11) NOT NULL,
  `motivo` varchar(100) DEFAULT NULL,
  `descricao_detalhada` text DEFAULT NULL,
  `status` enum('pendente','ignorada','removida','banido','oculto') DEFAULT 'pendente',
  `admin_acao` int(11) DEFAULT NULL,
  `resolvido_em` timestamp NULL DEFAULT NULL,
  `observacoes_moderacao` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_denuncia_resposta` (`resposta_forum_id`,`denunciado_por`),
  UNIQUE KEY `unique_denuncia_topico` (`topico_forum_id`,`denunciado_por`),
  KEY `denunciado_por` (`denunciado_por`),
  KEY `admin_acao` (`admin_acao`),
  CONSTRAINT `denuncia_ibfk_1` FOREIGN KEY (`resposta_forum_id`) REFERENCES `resposta_forum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `denuncia_ibfk_2` FOREIGN KEY (`topico_forum_id`) REFERENCES `topico_forum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `denuncia_ibfk_3` FOREIGN KEY (`denunciado_por`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `denuncia_ibfk_4` FOREIGN KEY (`admin_acao`) REFERENCES `utilizador` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `denuncia_conteudo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `denuncia_conteudo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conteudo_id` int(11) NOT NULL,
  `denunciado_por` int(11) NOT NULL,
  `motivo` varchar(100) NOT NULL,
  `descricao_detalhada` text DEFAULT NULL,
  `status` enum('pendente','ignorada','removida') DEFAULT 'pendente',
  `admin_acao` int(11) DEFAULT NULL,
  `resolvido_em` timestamp NULL DEFAULT NULL,
  `observacoes_moderacao` text DEFAULT NULL,
  `criada_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_denuncia_conteudo` (`conteudo_id`,`denunciado_por`),
  KEY `denunciado_por` (`denunciado_por`),
  KEY `admin_acao` (`admin_acao`),
  CONSTRAINT `denuncia_conteudo_ibfk_1` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `denuncia_conteudo_ibfk_2` FOREIGN KEY (`denunciado_por`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `denuncia_conteudo_ibfk_3` FOREIGN KEY (`admin_acao`) REFERENCES `utilizador` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `episodio_podcast`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `episodio_podcast` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `podcast_id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `duracao` varchar(20) NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_publicacao` date DEFAULT NULL,
  `audio_filename` varchar(255) DEFAULT NULL,
  `ordem` int(11) DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `podcast_id` (`podcast_id`),
  CONSTRAINT `episodio_podcast_ibfk_1` FOREIGN KEY (`podcast_id`) REFERENCES `conteudo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `forum_enquete`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forum_enquete` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `topico_id` int(11) NOT NULL,
  `pergunta` varchar(300) NOT NULL,
  `encerrada` tinyint(1) NOT NULL DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `encerra_em` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enquete_topico` (`topico_id`),
  CONSTRAINT `forum_enquete_ibfk_1` FOREIGN KEY (`topico_id`) REFERENCES `topico_forum` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `forum_enquete_opcao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forum_enquete_opcao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enquete_id` int(11) NOT NULL,
  `texto` varchar(200) NOT NULL,
  `ordem` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `enquete_id` (`enquete_id`),
  CONSTRAINT `forum_enquete_opcao_ibfk_1` FOREIGN KEY (`enquete_id`) REFERENCES `forum_enquete` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `forum_enquete_voto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `forum_enquete_voto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enquete_id` int(11) NOT NULL,
  `opcao_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `votado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_voto` (`enquete_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_voto_enquete` (`enquete_id`),
  KEY `idx_voto_opcao` (`opcao_id`),
  CONSTRAINT `forum_enquete_voto_ibfk_1` FOREIGN KEY (`enquete_id`) REFERENCES `forum_enquete` (`id`) ON DELETE CASCADE,
  CONSTRAINT `forum_enquete_voto_ibfk_2` FOREIGN KEY (`opcao_id`) REFERENCES `forum_enquete_opcao` (`id`) ON DELETE CASCADE,
  CONSTRAINT `forum_enquete_voto_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `like_resposta_forum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `like_resposta_forum` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resposta_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like_resposta` (`resposta_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `like_resposta_forum_ibfk_1` FOREIGN KEY (`resposta_id`) REFERENCES `resposta_forum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `like_resposta_forum_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `livro_do_dia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `livro_do_dia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `autor` varchar(100) DEFAULT NULL,
  `ano` varchar(10) DEFAULT NULL,
  `editora` varchar(100) DEFAULT NULL,
  `genero` varchar(50) DEFAULT NULL,
  `autor_image_filename` varchar(255) DEFAULT NULL,
  `sobre_autor` text DEFAULT NULL,
  `trecho` text DEFAULT NULL,
  `citacao_destaque` text DEFAULT NULL,
  `likes` int(11) DEFAULT 0,
  `comentarios` int(11) DEFAULT 0,
  `publicado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mensagem_sala`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mensagem_sala` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sala_id` int(11) NOT NULL,
  `autor_id` int(11) NOT NULL,
  `mensagem_pai_id` int(11) DEFAULT NULL,
  `mensagem` text NOT NULL,
  `ficheiro_url` varchar(500) DEFAULT NULL,
  `ficheiro_nome` varchar(255) DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_msg_autor` (`autor_id`),
  KEY `idx_mensagem_sala_sala_id` (`sala_id`,`criado_em`),
  KEY `fk_msg_pai` (`mensagem_pai_id`),
  CONSTRAINT `fk_msg_autor` FOREIGN KEY (`autor_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_pai` FOREIGN KEY (`mensagem_pai_id`) REFERENCES `mensagem_sala` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_sala` FOREIGN KEY (`sala_id`) REFERENCES `sala_discussao` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `tipo` enum('novo_quiz','novo_topico','like_comentario','resposta_comentario','acesso_jindungo_aprovado','acesso_topico_aprovado','nova_resposta_forum','email_confirmacao','recuperacao_senha','pedido_acesso_topico','pedido_acesso_jindungo','acesso_jindungo_rejeitado','acesso_topico_rejeitado','novo_comentario_conteudo','convite_sala','convite_topico','comentario_denunciado','denuncia_topico','membro_entrou_sala') NOT NULL,
  `entidade_id` int(11) DEFAULT NULL,
  `titulo` varchar(150) DEFAULT NULL,
  `mensagem` varchar(255) NOT NULL,
  `link_destino` varchar(255) DEFAULT NULL,
  `lida` tinyint(1) DEFAULT 0,
  `lida_em` timestamp NULL DEFAULT NULL,
  `criada_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `notificacao_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_token` (`token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `playlist_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `playlist_item` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subscrito_id` int(11) NOT NULL,
  `conteudo_id` int(11) NOT NULL,
  `episodio_id` varchar(80) NOT NULL,
  `episodio_titulo` varchar(150) NOT NULL,
  `podcast_titulo` varchar(200) NOT NULL,
  `duracao` varchar(20) DEFAULT NULL,
  `data_publicacao` varchar(30) DEFAULT NULL,
  `autor` varchar(100) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `audio_url` varchar(255) DEFAULT NULL,
  `adicionado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_playlist_item` (`subscrito_id`,`conteudo_id`,`episodio_id`),
  KEY `conteudo_id` (`conteudo_id`),
  CONSTRAINT `playlist_item_ibfk_1` FOREIGN KEY (`subscrito_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `playlist_item_ibfk_2` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `progresso_utilizador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `progresso_utilizador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subscrito_id` int(11) NOT NULL,
  `conteudo_id` int(11) NOT NULL,
  `concluido` tinyint(1) DEFAULT 0,
  `ultimo_ponto_parada` varchar(20) DEFAULT NULL,
  `percentual_conclusao` int(11) DEFAULT 0,
  `visualizacoes` int(11) DEFAULT 1,
  `primeira_visualizacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_visualizacao` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_progresso` (`subscrito_id`,`conteudo_id`),
  KEY `conteudo_id` (`conteudo_id`),
  CONSTRAINT `progresso_utilizador_ibfk_1` FOREIGN KEY (`subscrito_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `progresso_utilizador_ibfk_2` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `provincia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `provincia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(40) NOT NULL,
  `nome` varchar(60) NOT NULL,
  `capital` varchar(60) DEFAULT NULL,
  `governador` varchar(120) DEFAULT NULL,
  `extensao` varchar(30) DEFAULT NULL,
  `num_municipios` int(11) DEFAULT NULL,
  `linguas` varchar(160) DEFAULT NULL,
  `etnias` varchar(160) DEFAULT NULL,
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `categoria` varchar(50) DEFAULT NULL,
  `thumbnail_filename` varchar(255) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_por` int(11) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_quiz_criado_por` (`criado_por`),
  KEY `idx_quiz_ativo` (`ativo`),
  CONSTRAINT `quiz_ibfk_1` FOREIGN KEY (`criado_por`) REFERENCES `utilizador` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quiz_pergunta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quiz_pergunta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `pergunta` text NOT NULL,
  `opcao_a` varchar(255) NOT NULL,
  `opcao_b` varchar(255) NOT NULL,
  `opcao_c` varchar(255) NOT NULL,
  `opcao_d` varchar(255) NOT NULL,
  `resposta_correta` tinyint(4) NOT NULL,
  `explicacao` text DEFAULT NULL,
  `ordem` int(11) DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `quiz_pergunta_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quiz` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `resposta_forum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resposta_forum` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `topico_id` int(11) NOT NULL,
  `autor_id` int(11) NOT NULL,
  `resposta_pai_id` int(11) DEFAULT NULL,
  `conteudo` text NOT NULL,
  `ficheiro_url` varchar(500) DEFAULT NULL,
  `ficheiro_nome` varchar(255) DEFAULT NULL,
  `likes` int(11) DEFAULT 0,
  `votos` int(11) NOT NULL DEFAULT 0,
  `denunciado` tinyint(1) DEFAULT 0,
  `publicado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `topico_id` (`topico_id`),
  KEY `autor_id` (`autor_id`),
  KEY `resposta_pai_id` (`resposta_pai_id`),
  CONSTRAINT `resposta_forum_ibfk_1` FOREIGN KEY (`topico_id`) REFERENCES `topico_forum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resposta_forum_ibfk_2` FOREIGN KEY (`autor_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resposta_forum_ibfk_3` FOREIGN KEY (`resposta_pai_id`) REFERENCES `resposta_forum` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `resposta_quiz`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resposta_quiz` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subscrito_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `pergunta_id` int(11) NOT NULL,
  `resposta_escolhida` char(1) DEFAULT NULL,
  `correta` tinyint(1) DEFAULT NULL,
  `tempo_resposta_segundos` int(11) DEFAULT NULL,
  `respondido_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `subscrito_id` (`subscrito_id`),
  KEY `quiz_id` (`quiz_id`),
  KEY `pergunta_id` (`pergunta_id`),
  CONSTRAINT `resposta_quiz_ibfk_1` FOREIGN KEY (`subscrito_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resposta_quiz_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quiz` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resposta_quiz_ibfk_3` FOREIGN KEY (`pergunta_id`) REFERENCES `quiz_pergunta` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `resposta_quiz_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resposta_quiz_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `pontuacao` int(11) DEFAULT 0,
  `total_perguntas` int(11) DEFAULT 0,
  `percentual_acerto` int(11) DEFAULT 0,
  `data_realizacao` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rqu_usuario_quiz` (`usuario_id`,`quiz_id`),
  KEY `idx_rqu_quiz_usuario_data` (`quiz_id`,`usuario_id`,`data_realizacao`),
  CONSTRAINT `resposta_quiz_usuario_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `resposta_quiz_usuario_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quiz` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sala_discussao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sala_discussao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `descricao` text DEFAULT NULL,
  `criador_id` int(11) NOT NULL,
  `conteudo_id` int(11) DEFAULT NULL,
  `topico_id` int(11) DEFAULT NULL,
  `so_membros_comentam` tinyint(1) NOT NULL DEFAULT 1,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_sala_criador` (`criador_id`),
  KEY `fk_sala_conteudo` (`conteudo_id`),
  KEY `fk_sala_topico` (`topico_id`),
  CONSTRAINT `fk_sala_conteudo` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudo` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sala_criador` FOREIGN KEY (`criador_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sala_topico` FOREIGN KEY (`topico_id`) REFERENCES `topico_forum` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sala_membro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sala_membro` (
  `sala_id` int(11) NOT NULL,
  `utilizador_id` int(11) NOT NULL,
  `pode_comentar` tinyint(1) NOT NULL DEFAULT 1,
  `aprovado` tinyint(1) NOT NULL DEFAULT 0,
  `entrou_em` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`sala_id`,`utilizador_id`),
  KEY `idx_sala_membro_user` (`utilizador_id`),
  CONSTRAINT `fk_membro_sala` FOREIGN KEY (`sala_id`) REFERENCES `sala_discussao` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_membro_user` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `solicitacao_acesso_jindungo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `solicitacao_acesso_jindungo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subscrito_id` int(11) NOT NULL,
  `conteudo_id` int(11) NOT NULL,
  `motivo` text DEFAULT NULL,
  `status` enum('pendente','aprovado','rejeitado') DEFAULT 'pendente',
  `solicitado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `respondido_em` timestamp NULL DEFAULT NULL,
  `admin_responsavel` int(11) DEFAULT NULL,
  `observacoes_resposta` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_solicitacao_jindungo` (`subscrito_id`,`conteudo_id`),
  KEY `conteudo_id` (`conteudo_id`),
  KEY `admin_responsavel` (`admin_responsavel`),
  CONSTRAINT `solicitacao_acesso_jindungo_ibfk_1` FOREIGN KEY (`subscrito_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `solicitacao_acesso_jindungo_ibfk_2` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `solicitacao_acesso_jindungo_ibfk_3` FOREIGN KEY (`admin_responsavel`) REFERENCES `utilizador` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `topico_forum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `topico_forum` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(150) NOT NULL,
  `descricao` text NOT NULL,
  `criado_por` int(11) NOT NULL,
  `tipo_privacidade` enum('publico','privado') DEFAULT 'publico',
  `categoria` varchar(50) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `requires_access` tinyint(1) DEFAULT 0,
  `fixado` tinyint(1) NOT NULL DEFAULT 0,
  `resolvido` tinyint(1) NOT NULL DEFAULT 0,
  `fechado` tinyint(1) NOT NULL DEFAULT 0,
  `oculto` tinyint(1) NOT NULL DEFAULT 0,
  `resposta_aceite_id` int(11) DEFAULT NULL,
  `likes` int(11) DEFAULT 0,
  `votos` int(11) NOT NULL DEFAULT 0,
  `respostas` int(11) DEFAULT 0,
  `visualizacoes` int(11) NOT NULL DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_atividade` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `criado_por` (`criado_por`),
  KEY `fk_topico_resposta_aceite` (`resposta_aceite_id`),
  FULLTEXT KEY `ft_topico` (`titulo`,`descricao`),
  CONSTRAINT `fk_topico_resposta_aceite` FOREIGN KEY (`resposta_aceite_id`) REFERENCES `resposta_forum` (`id`) ON DELETE SET NULL,
  CONSTRAINT `topico_forum_ibfk_1` FOREIGN KEY (`criado_por`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `topico_privado_acesso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `topico_privado_acesso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `topico_id` int(11) NOT NULL,
  `subscrito_id` int(11) NOT NULL,
  `status` enum('pendente','aprovado','rejeitado') DEFAULT 'pendente',
  `motivo` text DEFAULT NULL,
  `solicitado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `respondido_em` timestamp NULL DEFAULT NULL,
  `admin_responsavel` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_solicitacao_topico` (`topico_id`,`subscrito_id`),
  KEY `subscrito_id` (`subscrito_id`),
  KEY `admin_responsavel` (`admin_responsavel`),
  CONSTRAINT `topico_privado_acesso_ibfk_1` FOREIGN KEY (`topico_id`) REFERENCES `topico_forum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `topico_privado_acesso_ibfk_2` FOREIGN KEY (`subscrito_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `topico_privado_acesso_ibfk_3` FOREIGN KEY (`admin_responsavel`) REFERENCES `utilizador` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `topico_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `topico_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `conteudo` text NOT NULL,
  `respostas` int(11) DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `topico_usuario_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `utilizador`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `utilizador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha_hash` varchar(255) NOT NULL,
  `telemovel` varchar(20) DEFAULT NULL,
  `provincia` varchar(50) DEFAULT 'Luanda',
  `instituicao` varchar(150) DEFAULT NULL,
  `curso` varchar(100) DEFAULT NULL,
  `tipo` enum('visitante','subscrito','professor','admin','superadmin') DEFAULT 'subscrito',
  `pode_criar_quiz` tinyint(1) NOT NULL DEFAULT 0,
  `avatar_url` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_acesso` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `voto_resposta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `voto_resposta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `resposta_id` int(11) NOT NULL,
  `utilizador_id` int(11) NOT NULL,
  `valor` tinyint(4) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_voto_resposta` (`resposta_id`,`utilizador_id`),
  KEY `utilizador_id` (`utilizador_id`),
  CONSTRAINT `voto_resposta_ibfk_1` FOREIGN KEY (`resposta_id`) REFERENCES `resposta_forum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `voto_resposta_ibfk_2` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `voto_topico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `voto_topico` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `topico_id` int(11) NOT NULL,
  `utilizador_id` int(11) NOT NULL,
  `valor` tinyint(4) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_voto_topico` (`topico_id`,`utilizador_id`),
  KEY `utilizador_id` (`utilizador_id`),
  CONSTRAINT `voto_topico_ibfk_1` FOREIGN KEY (`topico_id`) REFERENCES `topico_forum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `voto_topico_ibfk_2` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

