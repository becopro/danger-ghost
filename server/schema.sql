-- ============================================================================
-- DANGER GHOST - SCHEMA MYSQL / MARIADB PARA NUVEM (DESO HOSTING)
-- Tabela: players_cloud_save
-- Descrição: Armazenamento em nuvem do progresso dos jogadores de Danger Ghost.
--            Projetado para hospedagem web cPanel / MySQL (Deso Hosting).
-- ============================================================================

-- Configuração de charset para suporte a caracteres Unicode (acento, emojis)
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- TABELA: players_cloud_save
-- ----------------------------------------------------------------------------
-- Comentários explicativos sobre cada coluna (em português):
-- 
-- 1. google_id (VARCHAR(255) NOT NULL PRIMARY KEY):
--    Identificador único universal (SUB/ID) fornecido pela autenticação do 
--    Google Auth. Garante que cada conta do Google possua um único registro.
--
-- 2. email (VARCHAR(255) NOT NULL UNIQUE):
--    Endereço de e-mail do jogador, obtido do perfil autenticado. A chave 
--    única (UNIQUE) impede duplicidade de contas com o mesmo endereço.
--
-- 3. player_name (VARCHAR(100) DEFAULT 'Ghost'):
--    Nome de exibição do jogador no jogo e nos placares/ranking. Caso não seja 
--    informado ou seja o primeiro login, adota o valor padrão 'Ghost'.
--
-- 4. game_data (JSON NOT NULL):
--    Dicionário completo do jogo em formato JSON. Armazena o progresso total:
--      - ghostdex: Registro de fantasmas avistados e capturados.
--      - unlockedGhosts: Lista de IDs dos fantasmas desbloqueados.
--      - stats: Atributos do jogador (nível, XP acumulado, HP atual/máximo).
--      - evolutions: Estado das evoluções de cada fantasma.
--
-- 5. last_saved_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP):
--    Carimbo de data/hora da última sincronização na nuvem. Atualizado 
--    automaticamente pelo MySQL sempre que o registro é modificado.
--
-- 6. created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP):
--    Carimbo de data/hora registrando o momento exato em que o jogador criou
--    seu primeiro save na nuvem.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `players_cloud_save` (
  `google_id` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `player_name` VARCHAR(100) DEFAULT 'Ghost',
  `game_data` JSON NOT NULL COMMENT 'Dicionário completo do jogo: Ghostdex, atributos e evolução dos fantasmas',
  `last_saved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`google_id`),
  UNIQUE KEY `uk_players_email` (`email`),
  INDEX `idx_last_saved_at` (`last_saved_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Save na nuvem do Danger Ghost - Deso Hosting';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- EXEMPLO DE CARGA ÚTIL (PAYLOAD JSON) PARA A COLUNA `game_data`:
-- ============================================================================
-- {
--   "ghostdex": {
--     "001": { "caught": true, "seen": true },
--     "002": { "caught": false, "seen": true }
--   },
--   "unlockedGhosts": ["001"],
--   "stats": {
--     "level": 1,
--     "xp": 0,
--     "hp": 100
--   },
--   "evolutions": {}
-- }
-- ============================================================================
