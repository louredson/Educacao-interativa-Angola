-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: economia_historia
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

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

--
-- Table structure for table `artigo`
--

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

--
-- Dumping data for table `artigo`
--

LOCK TABLES `artigo` WRITE;
/*!40000 ALTER TABLE `artigo` DISABLE KEYS */;
INSERT INTO `artigo` VALUES (1,'A Independência de Angola e os seus Impactos Económicos','Uma análise dos desafios económicos enfrentados por Angola após 1975','independencia-angola-impactos-economicos','Este artigo analisa os principais desafios económicos que Angola enfrentou nos anos que se seguiram à proclamação da independência em 1975, com especial destaque para a hiperinflação, a dependência do petróleo e os esforços de reconstrução pós-guerra.',NULL,'História',NULL,'publicado',1,1,4,8,'2026-06-09 09:56:19','2026-06-13 23:40:46','2026-06-09 09:56:19');
/*!40000 ALTER TABLE `artigo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `artigo_autor_permitido`
--

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

--
-- Dumping data for table `artigo_autor_permitido`
--

LOCK TABLES `artigo_autor_permitido` WRITE;
/*!40000 ALTER TABLE `artigo_autor_permitido` DISABLE KEYS */;
/*!40000 ALTER TABLE `artigo_autor_permitido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `artigo_bloco`
--

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

--
-- Dumping data for table `artigo_bloco`
--

LOCK TABLES `artigo_bloco` WRITE;
/*!40000 ALTER TABLE `artigo_bloco` DISABLE KEYS */;
INSERT INTO `artigo_bloco` VALUES (1,1,'paragrafo','A 11 de Novembro de 1975, Angola proclamava a sua independência de Portugal após séculos de colonialismo. Este marco histórico trouxe consigo não apenas a liberdade política, mas também desafios económicos imensos que moldaram o desenvolvimento do país nas décadas seguintes.',NULL,NULL,NULL,NULL,'esquerda','normal',1,NULL,'2026-06-09 09:56:19'),(2,1,'titulo_secao','O Legado Colonial e a Herança Económica',NULL,NULL,NULL,NULL,'esquerda','normal',2,NULL,'2026-06-09 09:56:19'),(3,1,'paragrafo','A economia herdada do período colonial era profundamente assimétrica. As estruturas produtivas foram desenhadas para servir os interesses metropolitanos, deixando Angola com uma base industrial frágil e uma dependência excessiva de matérias-primas — sobretudo petróleo, diamantes e café.',NULL,NULL,NULL,NULL,'esquerda','normal',3,NULL,'2026-06-09 09:56:19'),(4,1,'destaque','O petróleo representava, em meados da década de 1980, mais de 90% das receitas de exportação angolanas.',NULL,NULL,NULL,NULL,'esquerda','normal',4,NULL,'2026-06-09 09:56:19'),(5,1,'titulo_secao','Guerra Civil e Impacto Económico',NULL,NULL,NULL,NULL,'esquerda','normal',5,NULL,'2026-06-09 09:56:19'),(6,1,'paragrafo','A guerra civil que se seguiu à independência devastou a infraestrutura económica do país. Estradas, pontes, sistemas de irrigação e unidades produtivas foram destruídos. A hiperinflação atingiu valores superiores a 4000% ao ano na década de 1990, corroendo as poupanças e o poder de compra da população.',NULL,NULL,NULL,NULL,'esquerda','normal',6,NULL,'2026-06-09 09:56:19');
/*!40000 ALTER TABLE `artigo_bloco` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `artigo_comentario`
--

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

--
-- Dumping data for table `artigo_comentario`
--

LOCK TABLES `artigo_comentario` WRITE;
/*!40000 ALTER TABLE `artigo_comentario` DISABLE KEYS */;
/*!40000 ALTER TABLE `artigo_comentario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `artigo_usuario`
--

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

--
-- Dumping data for table `artigo_usuario`
--

LOCK TABLES `artigo_usuario` WRITE;
/*!40000 ALTER TABLE `artigo_usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `artigo_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentario_conteudo`
--

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

--
-- Dumping data for table `comentario_conteudo`
--

LOCK TABLES `comentario_conteudo` WRITE;
/*!40000 ALTER TABLE `comentario_conteudo` DISABLE KEYS */;
/*!40000 ALTER TABLE `comentario_conteudo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentario_conteudo_like`
--

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

--
-- Dumping data for table `comentario_conteudo_like`
--

LOCK TABLES `comentario_conteudo_like` WRITE;
/*!40000 ALTER TABLE `comentario_conteudo_like` DISABLE KEYS */;
/*!40000 ALTER TABLE `comentario_conteudo_like` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conteudo`
--

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

--
-- Dumping data for table `conteudo`
--

LOCK TABLES `conteudo` WRITE;
/*!40000 ALTER TABLE `conteudo` DISABLE KEYS */;
INSERT INTO `conteudo` VALUES (16,'Teste de Artigo Publicação','Descrição de teste para verificar que a publicação funciona correctamente.','Descrição de teste para verificar que a publicação funciona correctamente.','texto_normal','economia',NULL,NULL,NULL,NULL,'content/1782735016600-w0iwpphpkr.jpeg',NULL,NULL,NULL,0,15,1,'2026-06-29 12:10:16'),(17,'Teste','Teste','Teste','video','economia',NULL,NULL,'https://www.youtube.com/watch?v=Zs7_b8Vr4As',NULL,'https://img.youtube.com/vi/Zs7_b8Vr4As/maxresdefault.jpg',NULL,NULL,NULL,0,13,1,'2026-06-29 12:45:55'),(19,'Teste Jindungo','Desc jindungo','Corpo jindungo.','texto_jindungo','cultura',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,1,'2026-06-29 14:00:38'),(20,'Teste video youtube','Desc video',NULL,'video','historia',NULL,NULL,'https://www.youtube.com/watch?v=dQw4w9WgXcQ',NULL,NULL,NULL,NULL,NULL,0,1,1,'2026-06-29 14:00:38');
/*!40000 ALTER TABLE `conteudo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conteudo_reacao`
--

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

--
-- Dumping data for table `conteudo_reacao`
--

LOCK TABLES `conteudo_reacao` WRITE;
/*!40000 ALTER TABLE `conteudo_reacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `conteudo_reacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conteudo_salvo`
--

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

--
-- Dumping data for table `conteudo_salvo`
--

LOCK TABLES `conteudo_salvo` WRITE;
/*!40000 ALTER TABLE `conteudo_salvo` DISABLE KEYS */;
/*!40000 ALTER TABLE `conteudo_salvo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conteudo_visualizacao_unica`
--

DROP TABLE IF EXISTS `conteudo_visualizacao_unica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conteudo_visualizacao_unica` (
  `conteudo_id` int(11) NOT NULL,
  `utilizador_id` int(11) NOT NULL,
  `visto_em` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`conteudo_id`,`utilizador_id`),
  KEY `utilizador_id` (`utilizador_id`),
  CONSTRAINT `conteudo_visualizacao_unica_ibfk_1` FOREIGN KEY (`conteudo_id`) REFERENCES `conteudo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conteudo_visualizacao_unica_ibfk_2` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conteudo_visualizacao_unica`
--

LOCK TABLES `conteudo_visualizacao_unica` WRITE;
/*!40000 ALTER TABLE `conteudo_visualizacao_unica` DISABLE KEYS */;
/*!40000 ALTER TABLE `conteudo_visualizacao_unica` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `convite`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `convite`
--

LOCK TABLES `convite` WRITE;
/*!40000 ALTER TABLE `convite` DISABLE KEYS */;
INSERT INTO `convite` VALUES (1,'sala',1,1,'LQAY2676',NULL,10,0,'2026-06-29 23:27:35','2026-06-29 00:27:35'),(2,'sala',2,1,'X8U4SZF7',NULL,20,0,'2026-07-01 11:50:25','2026-06-30 12:50:25');
/*!40000 ALTER TABLE `convite` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `denuncia`
--

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
  `status` enum('pendente','ignorada','removida','banido') DEFAULT 'pendente',
  `admin_acao` int(11) DEFAULT NULL,
  `resolvido_em` timestamp NULL DEFAULT NULL,
  `observacoes_moderacao` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_denuncia_resposta` (`resposta_forum_id`,`denunciado_por`),
  UNIQUE KEY `unique_denuncia_topico` (`topico_forum_id`,`denunciado_por`),
  KEY `denunciado_por` (`denunciado_por`),
  KEY `admin_acao` (`admin_acao`),
  CONSTRAINT `denuncia_ibfk_2` FOREIGN KEY (`topico_forum_id`) REFERENCES `topico_forum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `denuncia_ibfk_3` FOREIGN KEY (`denunciado_por`) REFERENCES `utilizador` (`id`) ON DELETE CASCADE,
  CONSTRAINT `denuncia_ibfk_4` FOREIGN KEY (`admin_acao`) REFERENCES `utilizador` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `denuncia`
--

LOCK TABLES `denuncia` WRITE;
/*!40000 ALTER TABLE `denuncia` DISABLE KEYS */;
/*!40000 ALTER TABLE `denuncia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `denuncia_conteudo`
--

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

--
-- Dumping data for table `denuncia_conteudo`
--

LOCK TABLES `denuncia_conteudo` WRITE;
/*!40000 ALTER TABLE `denuncia_conteudo` DISABLE KEYS */;
/*!40000 ALTER TABLE `denuncia_conteudo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `episodio_podcast`
--

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

--
-- Dumping data for table `episodio_podcast`
--

LOCK TABLES `episodio_podcast` WRITE;
/*!40000 ALTER TABLE `episodio_podcast` DISABLE KEYS */;
/*!40000 ALTER TABLE `episodio_podcast` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forum_enquete`
--

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

--
-- Dumping data for table `forum_enquete`
--

LOCK TABLES `forum_enquete` WRITE;
/*!40000 ALTER TABLE `forum_enquete` DISABLE KEYS */;
/*!40000 ALTER TABLE `forum_enquete` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forum_enquete_opcao`
--

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

--
-- Dumping data for table `forum_enquete_opcao`
--

LOCK TABLES `forum_enquete_opcao` WRITE;
/*!40000 ALTER TABLE `forum_enquete_opcao` DISABLE KEYS */;
/*!40000 ALTER TABLE `forum_enquete_opcao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forum_enquete_voto`
--

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

--
-- Dumping data for table `forum_enquete_voto`
--

LOCK TABLES `forum_enquete_voto` WRITE;
/*!40000 ALTER TABLE `forum_enquete_voto` DISABLE KEYS */;
/*!40000 ALTER TABLE `forum_enquete_voto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `like_resposta_forum`
--

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

--
-- Dumping data for table `like_resposta_forum`
--

LOCK TABLES `like_resposta_forum` WRITE;
/*!40000 ALTER TABLE `like_resposta_forum` DISABLE KEYS */;
/*!40000 ALTER TABLE `like_resposta_forum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `livro_do_dia`
--

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

--
-- Dumping data for table `livro_do_dia`
--

LOCK TABLES `livro_do_dia` WRITE;
/*!40000 ALTER TABLE `livro_do_dia` DISABLE KEYS */;
INSERT INTO `livro_do_dia` VALUES (1,'Angola: Uma Economia em Transição','Alves da Rocha','2010','Edições Mayamba','Economia',NULL,'Alves da Rocha é economista e professor universitário angolano, reconhecido pelos seus estudos sobre desenvolvimento económico em África.','A economia angolana carrega o peso da dependência petrolífera e a esperança de uma diversificação que tarda em chegar mas que é inevitável para a soberania real do país.','O petróleo financiou a paz, mas só a educação pode financiar o futuro.',0,0,'2026-06-09 09:56:19');
/*!40000 ALTER TABLE `livro_do_dia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mensagem_sala`
--

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

--
-- Dumping data for table `mensagem_sala`
--

LOCK TABLES `mensagem_sala` WRITE;
/*!40000 ALTER TABLE `mensagem_sala` DISABLE KEYS */;
INSERT INTO `mensagem_sala` VALUES (1,1,1,NULL,'','/uploads/forum/1782691281411-ft6zeqqbhy.mp4','Download.mp4','2026-06-29 01:01:21'),(2,1,1,1,'Teste',NULL,NULL,'2026-06-29 15:38:04'),(3,1,1,2,'Calma',NULL,NULL,'2026-06-29 15:38:19'),(4,1,1,1,'Teste',NULL,NULL,'2026-06-29 15:42:37');
/*!40000 ALTER TABLE `mensagem_sala` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacao`
--

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

--
-- Dumping data for table `notificacao`
--

LOCK TABLES `notificacao` WRITE;
/*!40000 ALTER TABLE `notificacao` DISABLE KEYS */;
INSERT INTO `notificacao` VALUES (1,2,'novo_quiz',NULL,'Novo Quiz Disponível','Um novo quiz sobre Economia Angolana foi publicado. Teste os seus conhecimentos!','/resources',0,NULL,'2026-06-09 09:56:19'),(2,2,'novo_topico',NULL,'Novo Tópico no Fórum','Maria Fernanda criou um novo tópico: \"Inflação e o custo de vida em Luanda\"','/forum',0,NULL,'2026-06-09 09:56:19'),(3,3,'novo_quiz',NULL,'Novo Quiz Disponível','Um novo quiz sobre História de Angola foi publicado.','/resources',0,NULL,'2026-06-09 09:56:19'),(4,4,'novo_topico',NULL,'Novo Tópico no Fórum','Carlos Mendonça iniciou um debate sobre diversificação económica.','/forum',0,NULL,'2026-06-09 09:56:19'),(5,6,'novo_quiz',NULL,'Permissão Atribuída','O administrador autorizou-te a criar quizzes no Explorar.','/resources',0,NULL,'2026-06-09 09:56:19'),(6,1,'pedido_acesso_topico',16,'Pedido de acesso ao teu tópico','Faustino Miguel pediu acesso ao tópico \"CR7 no Mundial\"','/forum',1,'2026-06-29 00:02:53','2026-06-29 00:02:44'),(7,1,'pedido_acesso_topico',16,'Pedido de acesso ao teu tópico','Faustino Miguel pediu acesso ao tópico \"CR7 no Mundial\"','/forum',1,'2026-06-29 00:09:27','2026-06-29 00:08:56'),(8,1,'nova_resposta_forum',15,'Nova resposta no teu tópico','Alguém respondeu ao teu tópico no fórum.','/forum/15',1,'2026-06-29 00:20:39','2026-06-29 00:16:51'),(9,20,'acesso_topico_aprovado',16,'Acesso aprovado!','O teu pedido de acesso ao tópico \"CR7 no Mundial\" foi aprovado.','/forum',0,NULL,'2026-06-29 00:25:26'),(10,1,'nova_resposta_forum',11,'Nova resposta no teu tópico','Alguém respondeu ao teu tópico no fórum.','/forum?topico=11',1,'2026-06-29 00:28:55','2026-06-29 00:28:47');
/*!40000 ALTER TABLE `notificacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

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

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
INSERT INTO `password_resets` VALUES (1,20,'adfa1edc4f73c5cf12aa07caf59ff31570c71441a513a9b2305e0d2c32ace89a','2026-06-28 23:50:38',0,'2026-06-28 21:50:38');
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `playlist_item`
--

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

--
-- Dumping data for table `playlist_item`
--

LOCK TABLES `playlist_item` WRITE;
/*!40000 ALTER TABLE `playlist_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `playlist_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `progresso_utilizador`
--

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

--
-- Dumping data for table `progresso_utilizador`
--

LOCK TABLES `progresso_utilizador` WRITE;
/*!40000 ALTER TABLE `progresso_utilizador` DISABLE KEYS */;
/*!40000 ALTER TABLE `progresso_utilizador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provincia`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provincia`
--

LOCK TABLES `provincia` WRITE;
/*!40000 ALTER TABLE `provincia` DISABLE KEYS */;
INSERT INTO `provincia` VALUES (1,'bengo','Bengo','Dande','Maria Ant?nia Nelumba','31.371 km?',12,'Kimbundu, Kikongo, Portugu?s','Ambundu, Bakongo','2026-07-05 21:31:55'),(2,'benguela','Benguela','Benguela','Manuel Nunes J?nior','39.827 km?',21,'Umbundu, Ohvanyaneka, Portugu?s','Ovimbundu, Ohvanyaneka','2026-07-05 21:31:55'),(3,'bie','Bi?','Cuito','Celeste Elavoco David Adolfo','70.314 km?',18,'Umbundu, Portugu?s','Bailundo','2026-07-05 21:31:55'),(4,'cabinda','Cabinda','Cabinda','Suzana Fernanda Pemba Massiala de Abreu','7.283 km?',10,'Kikongo, Fiote, Portugu?s','Bakongo','2026-07-05 21:31:55'),(5,'cubango','Cubango','Menongue','Jos? Martins','199.049 km?',11,'Nganguela, Portugu?s','Ovanganguela','2026-07-05 21:31:55'),(6,'cuanza-norte','Cuanza Norte','Cazengo','Jo?o Diogo Gaspar','24.110 km?',16,'Kimbundu, Portugu?s','Ambundu','2026-07-05 21:31:55'),(7,'cuanza-sul','Cuanza Sul','Sumbe','Narciso Dam?sio dos Santos Benedito','55.660 km?',21,'Kimbundu, Ubundu, Portugu?s','Ambundu, Ovimbundu','2026-07-05 21:31:55'),(8,'cunene','Cunene','Cuanhama','Gerdina Ulipamue Didalewa','78.342 km?',13,'Oshiwambo, Portugu?s','Ovambu','2026-07-05 21:31:55'),(9,'huambo','Huambo','Huambo','Pereira Alfredo','2.609 km?',17,'Umbundu, Portugu?s','Ovimbundu','2026-07-05 21:31:55'),(10,'huila','Hu?la','Lubango','Nuno Bernab? Mahapi Dala','79.022 km?',23,'Umbundu, Olunhaneka, Portugu?s','Ovambu','2026-07-05 21:31:55'),(11,'luanda','Luanda','Ingombota','Lu?s Manuel da Fonseca Nunes','18.826 km?',16,'Kimbundu, Portugu?s','Ambundu','2026-07-05 21:31:55'),(12,'lunda-norte','Lunda Norte','Dundo','Filomena Elizabete Chitula Miza Aires','103.760 km?',19,'Cokwe, Portugu?s','Cokwe','2026-07-05 21:31:55'),(13,'lunda-sul','Lunda Sul','Saurimo','Gildo Matias Jos?','77.636 km?',14,'Cokwe, Portugu?s','Cokwe','2026-07-05 21:31:55'),(14,'malanje','Malanje','Malanje','Marcos Alexandre Nhunga','2.422 km?',26,'Kimbundu, Portugu?s','Ambundu','2026-07-05 21:31:55'),(15,'moxico','Moxico','Luena','Ernesto Muangala','223.023 km?',10,'Cokwe, Nganguela, Portugu?s','Ovanga','2026-07-05 21:31:55'),(16,'namibe','Namibe','Mo??medes','Augusto Archer de Sousa Mangueira','8.916 km?',9,'Oluherero, Portugu?s','Minoria Oluyaneka','2026-07-05 21:31:55'),(17,'uige','U?ge','U?ge','Jos? Carvalho da Rocha','58.698 km?',19,'Kimbundu, Kikongo, Portugu?s','Ambundu, Bakongo','2026-07-05 21:31:55'),(18,'zaire','Zaire','Mbanza Kongo','Adriano Mendes de Carvalho','40.130 km?',10,'Kikongo, Portugu?s','Bakongo','2026-07-05 21:31:55'),(19,'moxico-leste','Moxico Leste','Cazombo','Crispiniano Vivaldino Evaristo dos Santos',NULL,9,'Cokwe, Portugu?s',NULL,'2026-07-05 21:31:55'),(20,'cuando','Cuando','Mavinga','L?cio Gon?alves Amaral',NULL,9,'Nganguela, Portugu?s','Ovanganguela','2026-07-05 21:31:55'),(21,'icolo-e-bengo','?colo e Bengo','Catete','Auz?lio De Oliveira Martins Jacob',NULL,7,'Kimbundu, Portugu?s','Ambundu','2026-07-05 21:31:55');
/*!40000 ALTER TABLE `provincia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz`
--

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

--
-- Dumping data for table `quiz`
--

LOCK TABLES `quiz` WRITE;
/*!40000 ALTER TABLE `quiz` DISABLE KEYS */;
INSERT INTO `quiz` VALUES (1,'Economia Angolana: Básico','Teste os seus conhecimentos sobre os fundamentos da economia angolana.','Economia',NULL,NULL,1,1,'2026-06-09 09:56:18'),(2,'História de Angola','Questões sobre os principais períodos da história angolana.','História',NULL,NULL,1,1,'2026-06-09 09:56:18'),(3,'Moeda e Inflação','Quiz criado por utilizador autorizado sobre moeda e inflação em Angola.','Economia',NULL,NULL,1,6,'2026-06-09 09:56:18'),(5,'Economia de Angola','Este quiz aborda aspectos económicos de Angola, incluindo produção, comércio, finanças e desenvolvimento. É destinado a estudantes angolanos do ensino secundário.','Angola',NULL,'https://images.pexels.com/photos/17440929/pexels-photo-17440929.png?auto=compress&cs=tinysrgb&h=650&w=940',1,1,'2026-06-28 23:10:19');
/*!40000 ALTER TABLE `quiz` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_pergunta`
--

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

--
-- Dumping data for table `quiz_pergunta`
--

LOCK TABLES `quiz_pergunta` WRITE;
/*!40000 ALTER TABLE `quiz_pergunta` DISABLE KEYS */;
INSERT INTO `quiz_pergunta` VALUES (1,1,'Qual foi o impacto da reforma monetária de 1999 em Angola?','Redução da inflação','Substituição do Kwanza antigo por uma nova moeda','Aumento do salário mínimo','Criação do Banco Central Africano',2,'A reforma monetária de 1999 substituiu o Kwanza antigo (AOK) pelo novo Kwanza (AOA), eliminando zeros da moeda.',1,'2026-06-09 09:56:18'),(2,1,'Qual sector liderou o crescimento económico angolano entre 2005 e 2014?','Agricultura','Petróleo e gás','Turismo','Tecnologia',2,'O sector petrolífero foi o principal motor do crescimento económico angolano neste período, representando mais de 40% do PIB.',2,'2026-06-09 09:56:18'),(3,1,'Qual é a moeda oficial de Angola?','Escudo','Real','Kwanza','Libra',3,'O Kwanza (AOA) é a moeda oficial de Angola desde 1977, com várias reformas ao longo dos anos.',3,'2026-06-09 09:56:18'),(4,1,'Qual organismo regula o sistema financeiro angolano?','Ministério das Finanças','Banco Nacional de Angola','Fundo Monetário Internacional','Banco Mundial',2,'O Banco Nacional de Angola (BNA) é o banco central e regulador do sistema financeiro angolano.',4,'2026-06-09 09:56:18'),(5,1,'O que significa a sigla PIB?','Produto Interno Bruto','Produto Internacional de Balança','Plano de Investimento Base','Programa de Iniciativa Bancária',1,'PIB — Produto Interno Bruto — é o valor total de bens e serviços produzidos num país num determinado período.',5,'2026-06-09 09:56:18'),(6,2,'Em que ano Angola proclamou a sua independência?','1961','1975','1980','1990',2,'Angola proclamou a independência de Portugal a 11 de Novembro de 1975.',1,'2026-06-09 09:56:18'),(7,2,'Qual foi o primeiro presidente de Angola?','José Eduardo dos Santos','Jonas Savimbi','Agostinho Neto','João Lourenço',3,'António Agostinho Neto foi o primeiro presidente da República Popular de Angola, de 1975 até à sua morte em 1979.',2,'2026-06-09 09:56:18'),(8,2,'Em que cidade foi assinado o Acordo de Paz de 2002?','Luanda','Namibe','Luena','Huambo',3,'O Memorando de Entendimento de Luena foi assinado a 4 de Abril de 2002, pondo fim à guerra civil angolana.',3,'2026-06-09 09:56:18'),(9,2,'Qual movimento proclamou a independência de Angola em 1975?','FNLA','UNITA','MPLA','FLEC',3,'O MPLA (Movimento Popular de Libertação de Angola) proclamou a independência em Luanda a 11 de Novembro de 1975.',4,'2026-06-09 09:56:18'),(10,2,'Qual é a capital de Angola?','Benguela','Huambo','Lubango','Luanda',4,'Luanda é a capital e maior cidade de Angola, situada na costa atlântica.',5,'2026-06-09 09:56:18'),(11,3,'O que é inflação?','Aumento generalizado e sustentado do nível de preços','Redução da taxa de juro pelo banco central','Aumento das exportações de petróleo','Depreciação das reservas de ouro',1,'Inflação é o aumento generalizado e sustentado do nível de preços de bens e serviços numa economia.',1,'2026-06-09 09:56:18'),(12,3,'Qual foi a taxa de inflação anual mais elevada registada em Angola na década de 1990?','Cerca de 50%','Cerca de 500%','Mais de 4000%','Cerca de 200%',3,'Angola registou taxas de hiperinflação superiores a 4000% ao ano durante os anos mais graves da guerra civil na década de 1990.',2,'2026-06-09 09:56:18'),(13,3,'Qual instrumento usa o BNA para controlar a inflação?','Taxa de câmbio fixa','Taxa de juro de referência (taxa BNA)','Congelamento de preços','Emissão ilimitada de moeda',2,'O Banco Nacional de Angola usa a taxa de juro de referência como principal instrumento de política monetária para controlar a inflação.',3,'2026-06-09 09:56:18'),(14,3,'O que significa \"kwanza\" como unidade monetária?','Nome de um chefe guerreiro histórico','Nome de um rio angolano','Palavra quimbundo que significa \"primeiro\"','Sigla de um tratado económico',2,'Kwanza é o nome de um rio angolano que serviu de inspiração para o nome da moeda nacional introduzida em 1977.',4,'2026-06-09 09:56:18'),(15,3,'Qual das seguintes é uma consequência da hiperinflação?','Aumento do poder de compra da população','Erosão das poupanças e instabilidade económica','Redução da dívida pública','Aumento das exportações',2,'A hiperinflação destrói o valor das poupanças, gera incerteza económica e dificulta o planeamento de longo prazo.',5,'2026-06-09 09:56:18'),(21,5,'Qual é o principal produto de exportação de Angola?','Petróleo','Diamantes','Café','Cotton',1,'O petróleo é o principal produto de exportação de Angola, responsável por uma grande parte das receitas do país.',1,'2026-06-28 23:10:19'),(22,5,'Qual é o nome da moeda oficial de Angola?','Kwanza','Dólar','Euro','Rand',1,'O Kwanza é a moeda oficial de Angola, utilizada em transações comerciais e financeiras no país.',2,'2026-06-28 23:10:19'),(23,5,'Qual é o setor que mais contribui para o PIB de Angola?','Agricultura','Indústria','Serviços','Mineração',2,'O setor industrial, especialmente a indústria petrolífera, é o que mais contribui para o PIB de Angola.',3,'2026-06-28 23:10:19'),(24,5,'Qual é o principal parceiro comercial de Angola?','China','Portugal','Brasil','Estados Unidos',1,'A China é o principal parceiro comercial de Angola, com um grande volume de trocas comerciais, especialmente de petróleo.',4,'2026-06-28 23:10:19'),(25,5,'Qual é o objetivo principal do plano de desenvolvimento económico de Angola?','Diversificar a economia','Aumentar a produção petrolífera','Reducir a pobreza','Aumentar a inflação',1,'O objetivo principal do plano de desenvolvimento económico de Angola é diversificar a economia, reduzindo a dependência do petróleo e promovendo outros setores.',5,'2026-06-28 23:10:19'),(26,5,'Qual é o principal desafio económico enfrentado por Angola?','Inflação','Desemprego','Corrupção','Dívida externa',3,'A corrupção é um dos principais desafios económicos enfrentados por Angola, afetando a eficiência e a transparência das instituições e do setor privado.',6,'2026-06-28 23:10:19'),(27,5,'Qual é o papel da Sonangol, a empresa estatal de petróleo de Angola?','Regular o mercado de petróleo','Produzir e exportar petróleo','Construir infraestruturas','Financiar projetos de desenvolvimento',2,'A Sonangol é responsável por produzir e exportar petróleo, além de gerir as reservas petrolíferas do país.',7,'2026-06-28 23:10:19'),(28,5,'Qual é o impacto da dependência do petróleo na economia de Angola?','Diversificação da economia','Aumento da inflação','Redução da pobreza','Vulnerabilidade a flutuações do mercado',4,'A dependência do petróleo torna a economia de Angola vulnerável a flutuações do mercado internacional, o que pode afetar a estabilidade económica do país.',8,'2026-06-28 23:10:19');
/*!40000 ALTER TABLE `quiz_pergunta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resposta_forum`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resposta_forum`
--

LOCK TABLES `resposta_forum` WRITE;
/*!40000 ALTER TABLE `resposta_forum` DISABLE KEYS */;
INSERT INTO `resposta_forum` VALUES (10,16,1,NULL,'Aqui tá vázio.',NULL,NULL,0,0,0,'2026-06-28 21:57:33'),(11,16,1,NULL,'A melhor.',NULL,NULL,0,0,0,'2026-06-28 23:40:15'),(12,16,1,NULL,'','/uploads/forum/1782690556413-sxmtnv29i89.jpg','98b63dc7-5ccc-4c38-bca1-8a4fbdbc9914.jpg',0,0,0,'2026-06-28 23:49:16'),(13,15,20,NULL,'Teste',NULL,NULL,0,0,0,'2026-06-29 00:16:51'),(14,11,20,NULL,'Teste',NULL,NULL,0,0,0,'2026-06-29 00:28:47'),(15,16,1,10,'Vendo',NULL,NULL,0,0,0,'2026-06-29 14:43:01'),(16,16,1,12,'Darder',NULL,NULL,0,0,0,'2026-06-29 14:49:53'),(17,16,1,12,'teste@Administrador',NULL,NULL,0,0,0,'2026-06-29 14:52:15'),(18,17,1,NULL,'Messi.',NULL,NULL,0,0,0,'2026-06-30 11:48:46'),(19,17,1,18,'CR7',NULL,NULL,0,0,0,'2026-06-30 11:48:53');
/*!40000 ALTER TABLE `resposta_forum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resposta_quiz`
--

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

--
-- Dumping data for table `resposta_quiz`
--

LOCK TABLES `resposta_quiz` WRITE;
/*!40000 ALTER TABLE `resposta_quiz` DISABLE KEYS */;
INSERT INTO `resposta_quiz` VALUES (1,1,2,10,'4',1,NULL,'2026-06-17 12:31:59'),(2,1,2,8,'3',1,NULL,'2026-06-17 12:31:59'),(3,1,2,6,'2',1,NULL,'2026-06-17 12:31:59'),(4,1,2,9,'3',1,NULL,'2026-06-17 12:31:59'),(5,1,2,7,'3',1,NULL,'2026-06-17 12:31:59');
/*!40000 ALTER TABLE `resposta_quiz` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resposta_quiz_usuario`
--

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

--
-- Dumping data for table `resposta_quiz_usuario`
--

LOCK TABLES `resposta_quiz_usuario` WRITE;
/*!40000 ALTER TABLE `resposta_quiz_usuario` DISABLE KEYS */;
INSERT INTO `resposta_quiz_usuario` VALUES (1,1,2,5,5,100,'2026-06-17 12:31:59');
/*!40000 ALTER TABLE `resposta_quiz_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sala_discussao`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sala_discussao`
--

LOCK TABLES `sala_discussao` WRITE;
/*!40000 ALTER TABLE `sala_discussao` DISABLE KEYS */;
INSERT INTO `sala_discussao` VALUES (1,'EINF-M3','',1,NULL,NULL,1,'2026-06-29 00:26:52'),(2,'Teste','MMMM',1,NULL,NULL,1,'2026-06-30 12:50:04');
/*!40000 ALTER TABLE `sala_discussao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sala_membro`
--

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

--
-- Dumping data for table `sala_membro`
--

LOCK TABLES `sala_membro` WRITE;
/*!40000 ALTER TABLE `sala_membro` DISABLE KEYS */;
INSERT INTO `sala_membro` VALUES (1,1,1,1,'2026-06-29 00:26:52'),(2,1,1,1,'2026-06-30 12:50:04');
/*!40000 ALTER TABLE `sala_membro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitacao_acesso_jindungo`
--

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

--
-- Dumping data for table `solicitacao_acesso_jindungo`
--

LOCK TABLES `solicitacao_acesso_jindungo` WRITE;
/*!40000 ALTER TABLE `solicitacao_acesso_jindungo` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitacao_acesso_jindungo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topico_forum`
--

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

--
-- Dumping data for table `topico_forum`
--

LOCK TABLES `topico_forum` WRITE;
/*!40000 ALTER TABLE `topico_forum` DISABLE KEYS */;
INSERT INTO `topico_forum` VALUES (1,'Exportação de petróleo: dependência económica','Angola continua altamente dependente das exportações de petróleo, que representam cerca de 95% das receitas de exportação e mais de 70% das receitas fiscais do governo. Esta dependência torna a economia angolana extremamente vulnerável às flutuações dos preços internacionais do petróleo. Quando os preços caem, como aconteceu em 2014-2016 e mais recentemente em 2020, o país enfrenta graves crises económicas, com desvalorização da moeda, aumento da dívida pública e cortes nos gastos sociais. A diversificação económica é apontada como solução, mas requer investimentos significativos em infraestrutura, educação e políticas públicas consistentes para desenvolver setores como agricultura, indústria transformadora e turismo.',1,'publico','Economia Actual',NULL,0,0,0,0,NULL,0,0,0,0,'2026-06-22 10:43:42','2026-06-24 10:59:28'),(2,'O Caminho do Ferro de Benguela e a Carreação do Lobito','O Caminho de Ferro de Benguela (CFB) foi uma das infraestruturas mais importantes da África Austral, ligando o porto do Lobito, em Angola, à província mineralógica do Katanga, na atual República Democrática do Congo. Construído entre 1902 e 1929, o CFB desempenhou um papel crucial no comércio regional, escoando cobre, cobalto e outros minerais. Durante a guerra civil angolana (1975-2002), o caminho de ferro foi severamente danificado e ficou inoperante. Após a guerra, iniciou-se um processo de reabilitação que culminou com a reabertura em 2015. O Corredor do Lobito, que inclui o CFB, é agora uma das principais prioridades de investimento internacional, incluindo parcerias com os Estados Unidos e a União Europeia.',1,'publico','Sociedade',NULL,0,0,0,0,NULL,0,0,0,0,'2026-06-22 10:43:42','2026-06-22 10:43:42'),(3,'O Ciclo do Café: Do auge à diversificação','Entre as décadas de 1960 e 1970, Angola era o quarto maior produtor de café do mundo e o maior exportador de café robusta. O café angolano era reconhecido internacionalmente pela sua qualidade. No entanto, a independência em 1975 e a subsequente guerra civil devastaram a produção cafeeira. Muitas fazendas foram abandonadas, a infraestrutura foi destruída e o conhecimento técnico foi perdido. Hoje, Angola produz apenas uma fração do que produzia antes da independência. Existem esforços para revitalizar o setor, com programas de apoio aos pequenos agricultores e investimentos em processamento local, mas o caminho para recuperar a posição de destaque é longo.',1,'publico','História Económica',NULL,0,0,0,0,NULL,0,0,0,0,'2026-06-22 10:43:42','2026-06-22 10:43:42'),(4,'Agricultura: o futuro da economia angolana?','Angola possui cerca de 58 milhões de hectares de terras aráveis, clima favorável e recursos hídricos abundantes. Apesar disso, o país ainda importa grande parte dos alimentos que consome. As razões incluem a falta de investimento no setor, a dependência histórica do petróleo, a destruição das infraestruturas durante a guerra civil e a dificuldade de acesso ao crédito para os agricultores. Para reverter este quadro, é necessário um plano integrado que inclua: recuperação de estradas rurais, linhas de crédito específicas, programas de extensão agrícola, investimento em irrigação e incentivos à agroindústria.',1,'publico','Economia',NULL,0,0,0,0,NULL,0,0,0,0,'2026-06-22 10:43:42','2026-06-22 10:43:42'),(5,'Comparação: Angola vs Nigéria - Gestão de recursos petrolíferos','Nigéria e Angola são os dois maiores produtores de petróleo da África Subsaariana. Enquanto a Nigéria tem uma população muito maior e uma economia mais diversificada, Angola tem uma dependência ainda maior do petróleo. A Nigéria aprendeu, através de crises sucessivas, a necessidade de diversificar e desenvolveu setores como telecomunicações, serviços financeiros e entretenimento (Nollywood). Angola pode aprender com a experiência nigeriana a importância de: criar um fundo soberano robusto, investir em infraestrutura, promover políticas de conteúdo local e desenvolver cadeias de valor em setores não petrolíferos.',1,'publico','Análise Comparativa',NULL,0,0,0,0,NULL,0,0,0,1,'2026-06-22 10:43:42','2026-06-26 18:28:49'),(6,'Reforma Fiscal em Angola: Desafios e Oportunidades','A reforma fiscal é essencial para reduzir a dependência do petróleo e aumentar a arrecadação interna. Angola precisa diversificar suas fontes de receita através de uma tributação mais eficiente e justa. Isso inclui melhorar a administração tributária, ampliar a base de contribuintes, reduzir a evasão fiscal e criar incentivos para setores não petrolíferos. Experiências internacionais mostram que países que implementaram reformas fiscais abrangentes conseguiram aumentar significativamente sua resiliência económica.',1,'publico','Economia',NULL,0,0,0,0,NULL,0,0,0,0,'2026-06-22 10:43:42','2026-06-24 11:20:19'),(7,'Impacto da Zona de Livre Comércio Continental Africana (ZLECA) em Angola','A Zona de Livre Comércio Continental Africana (ZLECA) é um dos maiores acordos comerciais do mundo em termos de número de países participantes. Para Angola, que historicamente tem dependido do petróleo e importado grande parte dos bens de consumo, este acordo representa tanto desafios quanto oportunidades. Os desafios incluem a necessidade de melhorar a competitividade da indústria local, reduzir custos de produção e eliminar barreiras burocráticas. As oportunidades incluem acesso a um mercado de 1,3 bilhão de consumidores, possibilidade de exportar produtos agrícolas e manufaturados, e atração de investimentos para zonas de processamento de exportação.',1,'publico','Economia',NULL,0,0,0,0,NULL,0,0,0,1,'2026-06-22 10:43:42','2026-06-24 11:20:55'),(8,'A Importância do Porto do Lobito para o Desenvolvimento Regional','O Porto do Lobito tem uma localização estratégica no litoral atlântico de Angola, servindo como porta de entrada e saída para produtos de Angola e dos países vizinhos como Zâmbia e RDC. Com investimentos recentes em modernização e expansão, o porto tem capacidade para movimentar cargas contentorizadas, granéis sólidos e líquidos, e carga geral. Para maximizar seu potencial, é necessário investir em conectividade ferroviária (Caminho de Ferro de Benguela), reduzir custos portuários, melhorar a eficiência alfandegária e desenvolver zonas de processamento de exportação nas proximidades.',1,'publico','Infraestrutura',NULL,0,0,0,0,NULL,0,1,0,0,'2026-06-22 10:43:42','2026-06-24 11:20:14'),(9,'O Futuro da Indústria de Telecomunicações em Angola','Angola tem feito progressos significativos no setor de telecomunicações nos últimos anos, com a expansão da rede de fibra ótica e o lançamento de serviços 5G em algumas áreas urbanas. No entanto, ainda existem desafios como a cobertura em áreas rurais, o custo dos serviços para a população, e a necessidade de desenvolver competências digitais. Para aproveitar plenamente o potencial da transformação digital, Angola precisa investir em infraestrutura de conectividade, promover a literacia digital, incentivar a inovação e o empreendedorismo tecnológico, e criar um ambiente regulatório favorável ao investimento privado.',1,'publico','Tecnologia',NULL,0,0,0,0,NULL,0,0,0,0,'2026-06-22 10:43:42','2026-06-24 11:20:47'),(10,'Estratégias para o Turismo Sustentável em Angola','Angola possui paisagens deslumbrantes, desde as praias do Namibe até as quedas da Kalandula e a biodiversidade da Kissama. O turismo sustentável pode ser uma fonte importante de diversificação económica, criando empregos e gerando divisas. Para desenvolver o setor, Angola precisa investir em infraestrutura turística, capacitar recursos humanos, promover o país internacionalmente, simplificar o processo de vistos e garantir a proteção ambiental e a valorização do patrimônio cultural.',1,'publico','Turismo',NULL,0,0,0,0,NULL,0,0,0,1,'2026-06-22 10:43:42','2026-06-25 23:37:43'),(11,'O Papel da Sociedade Civil na Consolidação da Democracia em Angola','A sociedade civil desempenha um papel fundamental na consolidação da democracia, na promoção dos direitos humanos e no combate à corrupção. Em Angola, apesar dos desafios, existem organizações que trabalham em áreas como transparência, participação cidadã, proteção ambiental e direitos das mulheres. Para fortalecer o papel da sociedade civil, é necessário criar um ambiente legal que garanta a liberdade de associação e expressão, promover o diálogo entre o governo e a sociedade civil, e capacitar as organizações para que possam desempenhar eficazmente as suas funções.',1,'publico','Sociedade',NULL,0,0,0,0,NULL,0,1,1,7,'2026-06-22 10:43:42','2026-06-29 00:28:55'),(15,'Cristiano Ronaldo na Seleção','Acho que Cristiano Ronaldo deveria ser titular pelo seu Pais.',1,'publico','Sociedade',NULL,0,0,0,0,NULL,0,0,1,3,'2026-06-28 21:56:17','2026-06-30 11:47:51'),(16,'CR7 no Mundial','Acho que Cristiano Ronaldo deveria ser titular pelo seu Pais.',1,'privado','Sociedade',NULL,0,0,0,0,NULL,0,0,6,22,'2026-06-28 21:56:55','2026-06-30 12:49:22'),(17,'Test','Aqui só passa os do Real Madrid',1,'publico','Economia','bolsa,casa',0,0,0,0,NULL,0,0,2,4,'2026-06-29 15:00:54','2026-06-30 12:49:12');
/*!40000 ALTER TABLE `topico_forum` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topico_privado_acesso`
--

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

--
-- Dumping data for table `topico_privado_acesso`
--

LOCK TABLES `topico_privado_acesso` WRITE;
/*!40000 ALTER TABLE `topico_privado_acesso` DISABLE KEYS */;
INSERT INTO `topico_privado_acesso` VALUES (2,16,20,'aprovado',NULL,'2026-06-29 00:08:56',NULL,1);
/*!40000 ALTER TABLE `topico_privado_acesso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topico_usuario`
--

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

--
-- Dumping data for table `topico_usuario`
--

LOCK TABLES `topico_usuario` WRITE;
/*!40000 ALTER TABLE `topico_usuario` DISABLE KEYS */;
/*!40000 ALTER TABLE `topico_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `utilizador`
--

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
  `tipo` enum('visitante','subscrito','professor','admin') DEFAULT 'subscrito',
  `pode_criar_quiz` tinyint(1) NOT NULL DEFAULT 0,
  `avatar_url` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultimo_acesso` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `utilizador`
--

LOCK TABLES `utilizador` WRITE;
/*!40000 ALTER TABLE `utilizador` DISABLE KEYS */;
INSERT INTO `utilizador` VALUES (1,'Administrador','admin@economiahistoria.ao','$2b$10$yiWpM4lSoAJLal6rmHZkA.kCcxHx0vgRIsCGB1a2pzvO7yK.ZNMCG','+244923000001','Luanda','Economia com História','Administração','admin',0,NULL,1,'2026-06-09 09:56:18','2026-06-30 12:48:17'),(2,'Carlos Mendonça','carlos@email.com','$2b$10$HIAsU/VTAg9XrCQzMGySluvKzafqUaAf4VgvepptTVD76jXmzIfQS','+244923000002','Luanda','Universidade Agostinho Neto','Economia','subscrito',0,NULL,1,'2026-06-09 09:56:18',NULL),(3,'Maria Fernanda','maria@email.com','$2b$10$CsMhaavDbOxDq5CdDfWJRuK5rp2Uve9kbO19WQ5VpMjKiAs7O2lw.','+244923000003','Benguela','Universidade Católica de Angola','História','subscrito',0,NULL,1,'2026-06-09 09:56:18',NULL),(4,'João Baptista','joao@email.com','$2b$10$qajOvzAveDPxEcJ5FP07vOEWKHiLBo/Sxg5Dc9iMfWJIlgALLjZA2','+244923000004','Huambo','Instituto Superior Politécnico do Huambo','Gestão','subscrito',0,NULL,1,'2026-06-09 09:56:18',NULL),(5,'Super Administrador','superadmin@economiahistoria.ao','$2b$10$/se7k.ii0kYjoT0QmaWqz.F7LYvCXc7bPGfndlfmWsrbkNbj5d3he','+244923000005','Luanda','Economia com História','Administração','admin',0,NULL,1,'2026-06-09 09:56:18',NULL),(6,'Ana Lúcia Cardoso','ana@email.com','$2b$10$1odRzd8QqwcHgM/CdlbUXe4E9f4OFedNHDDGG1nHAPY7Qu.LSe0b6','+244923000006','Luanda','Universidade Jean Piaget','Economia','subscrito',1,NULL,1,'2026-06-09 09:56:18',NULL),(20,'Faustino Miguel','fausmi1288@gmail.com','$2b$10$eEH2A.6PkR26KsVozovoTO3CJK9nYJLycEz4akLhtpLDV.D7PAzCK',NULL,'Luanda','ISPTEC - Instituto Superior Politécnico de Tecnologias e Ciências','Engenharia Industrial','subscrito',0,NULL,1,'2026-06-28 21:41:00','2026-06-29 00:02:39');
/*!40000 ALTER TABLE `utilizador` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voto_resposta`
--

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

--
-- Dumping data for table `voto_resposta`
--

LOCK TABLES `voto_resposta` WRITE;
/*!40000 ALTER TABLE `voto_resposta` DISABLE KEYS */;
/*!40000 ALTER TABLE `voto_resposta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voto_topico`
--

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

--
-- Dumping data for table `voto_topico`
--

LOCK TABLES `voto_topico` WRITE;
/*!40000 ALTER TABLE `voto_topico` DISABLE KEYS */;
INSERT INTO `voto_topico` VALUES (16,8,1,1,'2026-06-24 11:20:14'),(27,11,1,1,'2026-06-25 23:37:10');
/*!40000 ALTER TABLE `voto_topico` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-05 23:40:32
