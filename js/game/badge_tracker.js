// js/game/badge_tracker.js (01/09/2026, gameplay-engineer)
//
// Rastreamento client-side das 123 conquistas das categorias Exploração em 8-bits,
// Acrobacias e Movimento, e Segredos e Easter Eggs — ver server/seed_badges.js pra a
// lista completa (id, requirement_type, requirement_value) e o relatório do
// gameplay-engineer pra qual badge tem hook real testado vs. hook real não testado
// vs. lacuna documentada (mecânica que não existe no jogo hoje).
//
// Arquitetura: contadores/melhores-valores ficam em localStorage (por conta, chave
// dg_badge_progress_<email>) pra sobreviver a refresh sem depender só do servidor.
// Cada mudança relevante é empurrada pro servidor via socket 'badge_progress'
// ({requirement_type, value}) — server/db.js (submitBadgeProgress) decide se aquilo
// desbloqueia algum emblema (é a fonte de verdade real; o localStorage é só cache
// otimista local, nunca "desbloqueia" nada sozinho). 'badges_unlocked' (o MESMO
// evento que increment_stat/save_game_state do backend-architect já usam) dispara o
// toast — a UI não sabe nem precisa saber qual dos dois sistemas gerou o desbloqueio.
//
// A maioria dos hooks fica em js/game/engine.js (pontos que precisam de precisão de
// frame — pouso de salto, colisão de parede, morte por armadilha). Título ocioso e
// exploração de mapa são rastreados AQUI, de fora, lendo window.DeSoGhost/window.map/
// window.g_currentLevel/window.g_gameState (já expostos por engine.js via
// Object.defineProperty no fim do arquivo) — não precisam de precisão de frame, e
// isolar isso aqui evita mexer ainda mais no arquivo de 4400 linhas do motor.
(function () {
    'use strict';

    var SOLID_TILES = { 1: true, 2: true, 13: true, 14: true, 15: true, 19: true };
    var TOTAL_TRACKED_LEVELS = 34; // 33 fases numeradas + CAVE1

    function isLowerBetter(requirementType) {
        return requirementType.indexOf('level_time_') === 0 || requirementType === 'full_game_time';
    }

    function currentEmail() {
        try {
            return (localStorage.getItem('dg_cloud_email') || '').trim().toLowerCase() || null;
        } catch (e) { return null; }
    }

    // ---------------------------------------------------------------------------
    // Persistência local (best-effort — se localStorage falhar/estiver cheio, o
    // tracker vira "só empurra pro servidor sem cache", nunca quebra o jogo por isso).
    // ---------------------------------------------------------------------------
    var _cache = null;
    var _cacheEmail = null;

    function loadCache() {
        var email = currentEmail();
        if (_cache && _cacheEmail === email) return _cache;
        _cacheEmail = email;
        _cache = {};
        if (!email) return _cache;
        try {
            var raw = localStorage.getItem('dg_badge_progress_' + email);
            if (raw) _cache = JSON.parse(raw) || {};
        } catch (e) { _cache = {}; }
        return _cache;
    }

    function saveCache() {
        var email = currentEmail();
        if (!email) return;
        try {
            localStorage.setItem('dg_badge_progress_' + email, JSON.stringify(_cache || {}));
        } catch (e) { /* quota cheia ou storage indisponível — segue sem cache local */ }
    }

    // ---------------------------------------------------------------------------
    // Envio pro servidor. Reconecta o listener de 'badges_unlocked' sempre que
    // window.NetworkState.socket trocar de instância (network.js cria um socket NOVO
    // a cada ConnectToServer(), inclusive em cada reconexão) — comparar a referência
    // evita duplicar listeners acumulados a cada reconexão.
    // ---------------------------------------------------------------------------
    var _lastBoundSocket = null;
    function ensureSocketBound() {
        var socket = window.NetworkState && window.NetworkState.socket;
        if (!socket || socket === _lastBoundSocket) return socket;
        _lastBoundSocket = socket;
        socket.on('badges_unlocked', function (data) {
            if (data && Array.isArray(data.badges)) {
                data.badges.forEach(showBadgeToast);
            }
        });
        socket.on('badge_progress_error', function (data) {
            console.warn('[Badges] badge_progress rejeitado pelo servidor:', data && data.message);
        });
        return socket;
    }

    function sendProgress(requirementType, value) {
        var socket = ensureSocketBound();
        if (socket && window.NetworkState.connected) {
            socket.emit('badge_progress', { requirement_type: requirementType, value: value });
        }
        // Se não tiver conexão agora, tudo bem — o valor já está no cache local e é
        // reenviado (com o valor mais atual) na próxima mudança depois de reconectar.
        // Não há fila de retry dedicada: dado o "melhor valor" ser sempre monotônico
        // (MAX/MIN, nunca piora), reenviar depois cobre o caso comum sem complexidade extra.
    }

    // ---------------------------------------------------------------------------
    // API pública
    // ---------------------------------------------------------------------------
    var BadgeTracker = {};

    // Contador que só cresce (quantas vezes já bateu na borda do mapa, quantas
    // "phases" seguidas, etc.) — amount pode ser omitido (default 1).
    BadgeTracker.bump = function (requirementType, amount) {
        var cache = loadCache();
        var next = (cache[requirementType] || 0) + (amount || 1);
        cache[requirementType] = next;
        saveCache();
        sendProgress(requirementType, next);
        return next;
    };

    // "Melhor valor já visto" — usa a mesma convenção MIN/MAX do servidor
    // (isLowerBetter). Só persiste/envia se for de fato uma melhora, pra não gastar
    // socket em cada frame de um valor que não muda o resultado final.
    BadgeTracker.setBest = function (requirementType, value) {
        var cache = loadCache();
        var lower = isLowerBetter(requirementType);
        var prev = cache[requirementType];
        var improved = (prev === undefined) || (lower ? value < prev : value > prev);
        if (!improved) return prev;
        cache[requirementType] = value;
        saveCache();
        sendProgress(requirementType, value);
        return value;
    };

    // Emblemas de "aconteceu uma vez" (value sempre 1) — só manda uma vez por conta
    // pra não spammar o socket a cada sessão; reenviar seria inofensivo no servidor
    // (>= 1 já desbloqueia de novo é idempotente via ON CONFLICT), só desnecessário.
    BadgeTracker.unlockOnce = function (requirementType) {
        var cache = loadCache();
        if (cache[requirementType]) return;
        cache[requirementType] = 1;
        saveCache();
        sendProgress(requirementType, 1);
    };

    BadgeTracker.getProgress = function (requirementType) {
        var cache = loadCache();
        return cache[requirementType] || 0;
    };

    // -------- Orquestração de eventos compostos (chamadas por engine.js) --------

    BadgeTracker.onLevelCompleted = function (level, elapsedSeconds, opts) {
        opts = opts || {};
        var key = (level === 'cave1' || level === 'CAVE1')
            ? 'level_time_cave1'
            : 'level_time_L' + String(level).padStart(2, '0');
        BadgeTracker.setBest(key, elapsedSeconds);
        if (opts.noDamage) BadgeTracker.bump('no_damage_level_clear_count');
        if (opts.airborne) BadgeTracker.bump('airborne_level_clear_count');
    };

    BadgeTracker.onGameCompleted = function (totalSeconds) {
        BadgeTracker.setBest('full_game_time', totalSeconds);
        if (!window.g_hasUsedPassword) {
            BadgeTracker.unlockOnce('purista_sem_atalhos');
        }
    };

    BadgeTracker.onPasswordPromptOpened = function () {
        BadgeTracker.unlockOnce('password_prompt_opened');
    };

    BadgeTracker.onPasswordResult = function (codeLower, matched) {
        if (!matched) {
            BadgeTracker.bump('password_wrong_attempt_count');
            return;
        }
        if (codeLower === 'matrix') BadgeTracker.unlockOnce('password_used_matrix');
        else if (codeLower === 'becopro') BadgeTracker.unlockOnce('password_used_becopro');
        else if (codeLower === 'maximo') BadgeTracker.unlockOnce('password_used_maximo');

        var cache = loadCache();
        if (cache.password_used_matrix && cache.password_used_becopro && cache.password_used_maximo) {
            BadgeTracker.unlockOnce('password_used_all3');
        }
    };

    // Fireballs secretas (tile 24, perto das portas de saída das fases 3/6/9/13/32).
    // secret_fireball_all_in_run exige as 5 DE NÍVEIS DIFERENTES numa mesma partida
    // (não só 5 coletas) — sem isso, ping-pongar pra fora e voltar na mesma fase via
    // porta "back" faria a fireball reaparecer (loadLevel recria o bitmap do zero a
    // cada entrada), farmando o mesmo emblema com uma fireball só. Reseta a cada
    // ResetGame() real (chamada abaixo).
    var _fireballLevelsThisRun = {};
    BadgeTracker.onFireballCollected = function (level) {
        BadgeTracker.bump('fireball_secret_collected_count');
        _fireballLevelsThisRun[level] = true;
        var got = Object.keys(_fireballLevelsThisRun).length;
        if (got >= 5) BadgeTracker.unlockOnce('secret_fireball_all_in_run');
    };
    BadgeTracker.onRunReset = function () {
        _fireballLevelsThisRun = {};
    };

    BadgeTracker.onRareCollected = function (kind) {
        // kind: 'reddiamond' | 'cup' | 'crown' | 'ring'
        BadgeTracker.unlockOnce('rare_first_' + kind);
        BadgeTracker.bump('rare_collectible_lifetime_count');
    };

    window.BadgeTracker = BadgeTracker;

    // ---------------------------------------------------------------------------
    // Toast simples de "emblema desbloqueado" — este projeto não tem um sistema de
    // notificação genérico reaproveitável (só ShowTutorialFeedback, exclusivo do modo
    // tutorial), então este é intencionalmente pequeno e autocontido, no mesmo
    // espírito neon/vaporwave do resto da UI (css/style.css).
    // ---------------------------------------------------------------------------
    var _toastQueue = [];
    var _toastShowing = false;
    function showBadgeToast(badge) {
        _toastQueue.push(badge);
        if (!_toastShowing) drainToastQueue();
    }
    function drainToastQueue() {
        var badge = _toastQueue.shift();
        if (!badge) { _toastShowing = false; return; }
        _toastShowing = true;

        var el = document.createElement('div');
        el.style.cssText = [
            'position:fixed', 'top:16px', 'right:16px', 'z-index:99999',
            'background:rgba(5,8,12,0.92)', 'border:1px solid #00FFCC',
            'box-shadow:0 0 16px rgba(0,255,204,0.5)', 'border-radius:6px',
            'padding:10px 14px', 'color:#00FFCC', 'font-family:\'Courier New\',monospace',
            'font-size:12px', 'max-width:280px', 'opacity:0', 'transition:opacity .3s ease',
            'pointer-events:none'
        ].join(';');
        el.innerHTML =
            '<div style="color:#FFFF00;font-weight:bold;letter-spacing:.5px;">EMBLEMA DESBLOQUEADO</div>' +
            '<div style="margin-top:4px;font-weight:bold;">' + escapeHtml(badge.name || badge.id) + '</div>' +
            (badge.description ? '<div style="margin-top:2px;color:#88FFEE;font-size:11px;">' + escapeHtml(badge.description) + '</div>' : '');
        document.body.appendChild(el);
        requestAnimationFrame(function () { el.style.opacity = '1'; });
        setTimeout(function () {
            el.style.opacity = '0';
            setTimeout(function () {
                if (el.parentNode) el.parentNode.removeChild(el);
                drainToastQueue();
            }, 350);
        }, 4200);
    }
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // ---------------------------------------------------------------------------
    // Laço independente (não usa Game_Step_Logic de propósito — não precisa de
    // precisão de frame): idle na tela de título + exploração de mapa. ~5 checagens
    // por segundo é de sobra pra um timer de minutos e pra marcar tiles visitados
    // (o jogador fica MUITOS frames em cada tile de 24px, impossível "pular" um tile
    // inteiro num intervalo de 200ms andando a 3-4.8px/frame).
    // ---------------------------------------------------------------------------
    var _lastTitleInputAt = Date.now();
    var _titleIdleSentTiers = {};
    ['keydown', 'mousedown', 'touchstart'].forEach(function (evt) {
        window.addEventListener(evt, function () { _lastTitleInputAt = Date.now(); }, { capture: true, passive: true });
    });

    var _exploredByLevel = {}; // { levelKey: Set-like {row_col: true} }
    var _levelsAt100 = {};     // levelKey -> true, uma vez que bateu 100%
    var _lastExplorationLevelKey = null;

    function levelKeyOf(level) {
        return (level === 'cave1' || level === 'CAVE1') ? 'cave1' : String(level);
    }

    function totalWalkableTiles(bitmap) {
        var total = 0;
        for (var r = 0; r < bitmap.length; r++) {
            var row = bitmap[r];
            for (var c = 0; c < row.length; c++) {
                if (!SOLID_TILES[row[c]]) total++;
            }
        }
        return total;
    }

    function pollExploration() {
        var ghost = window.DeSoGhost;
        var map = window.map;
        var level = window.g_currentLevel;
        if (!ghost || !ghost.alive || !map || !map.bitmap || level === undefined) return;

        var key = levelKeyOf(level);
        if (key !== _lastExplorationLevelKey) {
            _lastExplorationLevelKey = key;
        }
        if (!_exploredByLevel[key]) {
            _exploredByLevel[key] = { set: {}, count: 0, total: totalWalkableTiles(map.bitmap) };
        }
        var entry = _exploredByLevel[key];
        var col = Math.floor((ghost.xPos + 12) / 24);
        var row = Math.floor((ghost.yPos + 12) / 24);
        var tileKey = row + '_' + col;
        if (entry.total > 0 && !entry.set[tileKey]) {
            entry.set[tileKey] = true;
            entry.count++;
            var pct = Math.floor((entry.count / entry.total) * 100);
            if (pct >= 100 && !_levelsAt100[key]) {
                _levelsAt100[key] = true;
                // map_explored_single é "qualquer 1 fase" (evento único, requirement_type
                // compartilhado entre todas as fases não-cave1) — unlockOnce garante que só
                // desbloqueia na primeira vez, não uma vez por fase.
                var reqType = (key === 'cave1') ? 'map_explored_single_cave1' : 'map_explored_single';
                BadgeTracker.unlockOnce(reqType);
                var levelsCount = Object.keys(_levelsAt100).length;
                BadgeTracker.setBest('map_explored_level_count', levelsCount);
                var lifetimePct = Math.floor((levelsCount / TOTAL_TRACKED_LEVELS) * 100);
                BadgeTracker.setBest('lifetime_map_explored_pct', lifetimePct);
            }
        }
    }

    function pollTitleIdle() {
        if (window.g_gameState !== window.G_START) {
            _lastTitleInputAt = Date.now(); // fora da tela de título, não conta ociosidade
            return;
        }
        var idleSeconds = Math.floor((Date.now() - _lastTitleInputAt) / 1000);
        [300, 900, 1800].forEach(function (threshold) {
            if (idleSeconds >= threshold && !_titleIdleSentTiers[threshold]) {
                _titleIdleSentTiers[threshold] = true;
                BadgeTracker.setBest('title_idle_seconds', idleSeconds);
            }
        });
    }

    setInterval(function () {
        try {
            pollExploration();
            pollTitleIdle();
            ensureSocketBound();
        } catch (e) {
            console.error('[BadgeTracker] Erro no laço de polling:', e);
        }
    }, 200);
})();
