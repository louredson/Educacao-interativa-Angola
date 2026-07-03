-- ═══════════════════════════════════════════════════════════════════════════════
-- Migração 003: Províncias (para o mapa interativo da Home)
--
-- Fonte dos dados geográficos (capital, extensão, nº municípios, línguas, etnias):
--   API Províncias de Angola — https://angolaprovinciasapi.ggwp.com.br/api/v1/provincias
-- O campo `governador` NÃO existe nessa API e foi compilado à parte.
--
-- O endpoint GET /api/provincias serve esta tabela. O controller também
-- permite re-sincronizar os campos geográficos a partir da API (mantendo o
-- governador), via POST /api/provincias/sync.
-- ═══════════════════════════════════════════════════════════════════════════════

USE economia_historia;

CREATE TABLE IF NOT EXISTS provincia (
    id              INT           AUTO_INCREMENT PRIMARY KEY,
    slug            VARCHAR(40)   NOT NULL UNIQUE,
    nome            VARCHAR(60)   NOT NULL,
    capital         VARCHAR(60)   NULL DEFAULT NULL,
    governador      VARCHAR(120)  NULL DEFAULT NULL,
    extensao        VARCHAR(30)   NULL DEFAULT NULL,
    num_municipios  INT           NULL DEFAULT NULL,
    linguas         VARCHAR(160)  NULL DEFAULT NULL,
    etnias          VARCHAR(160)  NULL DEFAULT NULL,
    atualizado_em   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed das 21 províncias ────────────────────────────────────────────────────
-- INSERT idempotente: actualiza se o slug já existir.
INSERT INTO provincia (slug, nome, capital, governador, extensao, num_municipios, linguas, etnias) VALUES
  ('bengo',         'Bengo',         'Dande',        'Maria Antónia Nelumba',                      '31.371 km²',  12, 'Kimbundu, Kikongo, Português',     'Ambundu, Bakongo'),
  ('benguela',      'Benguela',      'Benguela',     'Manuel Nunes Júnior',                        '39.827 km²',  21, 'Umbundu, Ohvanyaneka, Português',  'Ovimbundu, Ohvanyaneka'),
  ('bie',           'Bié',           'Cuito',        'Celeste Elavoco David Adolfo',               '70.314 km²',  18, 'Umbundu, Português',               'Bailundo'),
  ('cabinda',       'Cabinda',       'Cabinda',      'Suzana Fernanda Pemba Massiala de Abreu',    '7.283 km²',   10, 'Kikongo, Fiote, Português',        'Bakongo'),
  ('cubango',       'Cubango',       'Menongue',     'José Martins',                               '199.049 km²', 11, 'Nganguela, Português',             'Ovanganguela'),
  ('cuanza-norte',  'Cuanza Norte',  'Cazengo',      'João Diogo Gaspar',                          '24.110 km²',  16, 'Kimbundu, Português',              'Ambundu'),
  ('cuanza-sul',    'Cuanza Sul',    'Sumbe',        'Narciso Damásio dos Santos Benedito',        '55.660 km²',  21, 'Kimbundu, Ubundu, Português',      'Ambundu, Ovimbundu'),
  ('cunene',        'Cunene',        'Cuanhama',     'Gerdina Ulipamue Didalewa',                  '78.342 km²',  13, 'Oshiwambo, Português',             'Ovambu'),
  ('huambo',        'Huambo',        'Huambo',       'Pereira Alfredo',                            '2.609 km²',   17, 'Umbundu, Português',               'Ovimbundu'),
  ('huila',         'Huíla',         'Lubango',      'Nuno Bernabé Mahapi Dala',                   '79.022 km²',  23, 'Umbundu, Olunhaneka, Português',   'Ovambu'),
  ('luanda',        'Luanda',        'Ingombota',    'Luís Manuel da Fonseca Nunes',               '18.826 km²',  16, 'Kimbundu, Português',              'Ambundu'),
  ('lunda-norte',   'Lunda Norte',   'Dundo',        'Filomena Elizabete Chitula Miza Aires',      '103.760 km²', 19, 'Cokwe, Português',                 'Cokwe'),
  ('lunda-sul',     'Lunda Sul',     'Saurimo',      'Gildo Matias José',                          '77.636 km²',  14, 'Cokwe, Português',                 'Cokwe'),
  ('malanje',       'Malanje',       'Malanje',      'Marcos Alexandre Nhunga',                    '2.422 km²',   26, 'Kimbundu, Português',              'Ambundu'),
  ('moxico',        'Moxico',        'Luena',        'Ernesto Muangala',                           '223.023 km²', 10, 'Cokwe, Nganguela, Português',      'Ovanga'),
  ('namibe',        'Namibe',        'Moçâmedes',    'Augusto Archer de Sousa Mangueira',          '8.916 km²',    9, 'Oluherero, Português',             'Minoria Oluyaneka'),
  ('uige',          'Uíge',          'Uíge',         'José Carvalho da Rocha',                     '58.698 km²',  19, 'Kimbundu, Kikongo, Português',     'Ambundu, Bakongo'),
  ('zaire',         'Zaire',         'Mbanza Kongo', 'Adriano Mendes de Carvalho',                 '40.130 km²',  10, 'Kikongo, Português',               'Bakongo'),
  ('moxico-leste',  'Moxico Leste',  'Cazombo',      'Crispiniano Vivaldino Evaristo dos Santos',  NULL,           9, 'Cokwe, Português',                 NULL),
  ('cuando',        'Cuando',        'Mavinga',      'Lúcio Gonçalves Amaral',                     NULL,           9, 'Nganguela, Português',             'Ovanganguela'),
  ('icolo-e-bengo', 'Ícolo e Bengo', 'Catete',       'Auzílio De Oliveira Martins Jacob',          NULL,           7, 'Kimbundu, Português',              'Ambundu')
ON DUPLICATE KEY UPDATE
  nome           = VALUES(nome),
  capital        = VALUES(capital),
  governador     = VALUES(governador),
  extensao       = VALUES(extensao),
  num_municipios = VALUES(num_municipios),
  linguas        = VALUES(linguas),
  etnias         = VALUES(etnias);
