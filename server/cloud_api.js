/**
 * Danger Ghost - Cloud Save & Auth API
 * Designed for Deso Hosting (desohosting.com web hosting / cPanel Node.js app)
 *
 * Provides Google Authentication, JWT sessions, and MySQL cloud saving
 * for players_cloud_save table.
 */

try {
  require('dotenv').config();
} catch (err) {
  // dotenv is optional if environment variables are injected by cPanel / OS
}

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jsonwebtoken = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const app = express();

// ============================================================================
// CORS & Middleware Configuration
// ============================================================================
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// MySQL Connection Pool Configuration (Deso Hosting Defaults)
// ============================================================================
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'desohost_dangerghost',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'desohost_dangerghost',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

// ============================================================================
// Authentication Configuration & Defaults
// ============================================================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Nunca usar um segredo fixo aqui: esse valor ficaria público no histórico do repositório
// e permitiria forjar tokens válidos para /api/load e /api/save de qualquer conta.
// Se JWT_SECRET não estiver definido, gera um segredo aleatório só para esta execução —
// os tokens emitidos ficam inválidos ao reiniciar o processo, o que é intencional: preferimos
// deslogar todo mundo a rodar com um segredo previsível. Defina JWT_SECRET no .env em produção.
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('[SECURITY] JWT_SECRET não definido no ambiente — usando um segredo aleatório gerado nesta execução. Tokens emitidos agora serão invalidados no próximo restart. Defina JWT_SECRET em produção para sessões persistentes.');
}

const defaultGameData = {
  ghostdex: {},
  unlockedGhosts: ['001'],
  stats: { level: 1, xp: 0, hp: 100 },
  evolutions: {}
};

// ============================================================================
// Middleware: authenticateJWT
// ============================================================================
/**
 * Middleware to verify Bearer JWT token in Authorization header.
 * Sets req.user = { googleId, email } upon successful verification.
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. Missing or invalid Authorization header. Expected format: Bearer <token>'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jsonwebtoken.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired JWT token.'
    });
  }
}

// ============================================================================
// REST API Endpoints
// ============================================================================

/**
 * GET /api/health
 * Public healthcheck endpoint for monitoring (Deso Hosting cPanel).
 */
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      service: 'Danger Ghost Deso Hosting Cloud API',
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      service: 'Danger Ghost Deso Hosting Cloud API',
      database: 'disconnected',
      error: err.message
    });
  }
});

/**
 * POST /api/login
 * - Receives { idToken } from Google Auth (or fallback { googleId, email, name } for dev/testing).
 * - Validates credentials and checks players_cloud_save table in MySQL.
 * - If player does not exist, inserts a new record with default game_data.
 * - Generates a signed JWT token valid for 30 days.
 * - Returns { success: true, token: jwtToken, profile: { googleId, email, name }, gameData }.
 */
app.post('/api/login', async (req, res) => {
  try {
    const { idToken, googleId: devGoogleId, email: devEmail, name: devName } = req.body;
    let googleId, email, name;

    if (idToken) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        googleId = payload.sub || payload.id;
        email = payload.email;
        name = payload.name || payload.given_name || 'Ghost';
      } catch (verifyError) {
        // Fallback for dev/testing when a mock/test idToken is sent with dev fields
        if (devGoogleId && devEmail) {
          console.warn('[Auth] verifyIdToken failed, using dev/testing fallback credentials:', verifyError.message);
          googleId = devGoogleId;
          email = devEmail;
          name = devName || 'Ghost';
        } else if (process.env.NODE_ENV !== 'production') {
          // Attempt to decode unverified JWT token in non-production local/test environments
          const decoded = jsonwebtoken.decode(idToken);
          if (decoded && (decoded.sub || decoded.googleId) && decoded.email) {
            googleId = decoded.sub || decoded.googleId;
            email = decoded.email;
            name = decoded.name || devName || 'Ghost';
          } else {
            return res.status(401).json({
              success: false,
              error: 'Google authentication failed: Invalid idToken.'
            });
          }
        } else {
          return res.status(401).json({
            success: false,
            error: 'Google authentication failed: Invalid idToken.'
          });
        }
      }
    } else if (devGoogleId && devEmail) {
      // Direct dev/testing fallback credentials
      googleId = devGoogleId;
      email = devEmail;
      name = devName || 'Ghost';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials. Provide idToken or fallback { googleId, email, name }.'
      });
    }

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Invalid authentication payload: googleId and email are required.'
      });
    }

    // Check if player exists in MySQL
    const [rows] = await pool.query(
      'SELECT * FROM players_cloud_save WHERE google_id = ? OR email = ?',
      [googleId, email]
    );

    let gameData;
    let finalGoogleId = googleId;
    let finalEmail = email;
    let finalName = name || 'Ghost';

    if (rows.length === 0) {
      // Player does not exist: insert new record with default game_data
      const gameDataJson = JSON.stringify(defaultGameData);
      await pool.query(
        'INSERT INTO players_cloud_save (google_id, email, player_name, game_data, last_saved_at, created_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [googleId, email, finalName, gameDataJson]
      );
      gameData = defaultGameData;
    } else {
      // Player exists: parse existing game_data
      const existingPlayer = rows[0];
      finalGoogleId = existingPlayer.google_id || googleId;
      finalEmail = existingPlayer.email || email;
      finalName = name || existingPlayer.player_name || 'Ghost';

      if (typeof existingPlayer.game_data === 'string') {
        try {
          gameData = JSON.parse(existingPlayer.game_data);
        } catch (parseErr) {
          console.error('[Login] Error parsing game_data JSON from MySQL, using default:', parseErr);
          gameData = defaultGameData;
        }
      } else {
        gameData = existingPlayer.game_data || defaultGameData;
      }

      // Update player name if changed from 'Ghost'
      if (name && name !== 'Ghost' && existingPlayer.player_name === 'Ghost') {
        await pool.query(
          'UPDATE players_cloud_save SET player_name = ? WHERE google_id = ?',
          [name, finalGoogleId]
        );
      }
    }

    const jwtToken = jsonwebtoken.sign(
      { googleId: finalGoogleId, email: finalEmail },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      success: true,
      token: jwtToken,
      profile: {
        googleId: finalGoogleId,
        email: finalEmail,
        name: finalName
      },
      gameData
    });
  } catch (error) {
    console.error('[Login API Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process login request.'
    });
  }
});

/**
 * GET /api/load
 * - Protected by authenticateJWT.
 * - Queries MySQL for google_id = req.user.googleId.
 * - Returns { success: true, gameData: row.game_data }.
 */
app.get('/api/load', authenticateJWT, async (req, res) => {
  try {
    const googleId = req.user.googleId;
    const [rows] = await pool.query(
      'SELECT game_data FROM players_cloud_save WHERE google_id = ?',
      [googleId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player save not found in cloud storage.'
      });
    }

    const row = rows[0];
    const gameData = typeof row.game_data === 'string'
      ? JSON.parse(row.game_data)
      : row.game_data;

    return res.status(200).json({
      success: true,
      gameData
    });
  } catch (error) {
    console.error('[Load API Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load game data from cloud storage.'
    });
  }
});

/**
 * POST /api/save
 * - Protected by authenticateJWT.
 * - Receives { gameData } (dictionary containing Ghostdex, attributes, evolution, etc.).
 * - Executes MySQL query: INSERT INTO players_cloud_save ... ON DUPLICATE KEY UPDATE ...
 * - Returns { success: true, savedAt: new Date().toISOString() }.
 */
app.post('/api/save', authenticateJWT, async (req, res) => {
  try {
    const { googleId, email } = req.user;
    const { gameData } = req.body;

    if (!gameData || typeof gameData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing gameData payload. Expected a JSON object.'
      });
    }

    const gameDataPayload = typeof gameData === 'string'
      ? gameData
      : JSON.stringify(gameData);

    const query = `
      INSERT INTO players_cloud_save (google_id, email, game_data, last_saved_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE game_data = VALUES(game_data), last_saved_at = NOW()
    `;

    await pool.query(query, [googleId, email, gameDataPayload]);

    return res.status(200).json({
      success: true,
      savedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Save API Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save game data to cloud storage.'
    });
  }
});

// ============================================================================
// Global Error Handler
// ============================================================================
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// ============================================================================
// Server Initialization
// ============================================================================
const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Danger Ghost Deso Hosting Cloud API] Server running on port ${PORT}`);
  });
}

module.exports = {
  app,
  pool,
  authenticateJWT,
  defaultGameData
};
