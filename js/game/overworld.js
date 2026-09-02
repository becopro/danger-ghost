// ============================================================================
// Danger Ghost — Overworld isométrico de Niterói (Rua Doutor Beltrão / Santa
// Rosa). Renderer novo, autocontido, para o mapa-mundo que leva à torre de
// entrada do Episódio 1.
//
// Leia primeiro: danger ghost/.claude/skills/isometric-canvas-rendering/SKILL.md
// (projeção 2:1, depth-sort, e o problema do g_canvas fechado do engine.js).
//
// DECISÃO DE ARQUITETURA — canvas separado (não a mesma <canvas id="myCanvas">):
// engine.js declara `g_canvas`/`g_ctx` como `var` locais dentro do seu próprio
// closure (confirmado lendo o arquivo, linhas ~145-146) — não estão em
// `window`, então este módulo não tem como pegar essa referência mesmo se
// quisesse. A skill documenta 2 opções: (a) pegar referência própria ao MESMO
// <canvas id="myCanvas">, ou (b) um canvas separado empilhado via CSS.
// Escolhi (b) por 3 motivos:
//   1. Isolamento de verdade: engine.js já desenha em myCanvas via
//      `g_ctx.drawImage(..., 24, 24)` num loop raster simples, sem qualquer
//      noção de depth-sort. Se este módulo desenhasse no mesmo contexto,
//      qualquer `clearRect`/`drawImage` de um sistema vazaria visualmente
//      pro outro no frame em que os dois estivessem de alguma forma ativos
//      (ex.: um bug no agente de Transição que esqueça de parar um loop).
//      Com canvas separado, isso é fisicamente impossível — cada sistema só
//      enxerga (e limpa) o próprio buffer de pixels.
//   2. Zero edição em engine.js E zero edição em index.html: o canvas do
//      overworld é criado em runtime por este próprio arquivo (via
//      `document.createElement('canvas')`) e inserido dentro do
//      `.canvas-container` já existente (que já é `position: relative` no
//      CSS, feito sob medida pra empilhar elementos absolutos por cima do
//      myCanvas — usado hoje pelo próprio cutsceneGif/vídeo de abertura). A
//      única coisa que falta em outro arquivo é a tag
//      `<script src="js/game/overworld.js">` pra carregar este módulo — isso
//      fica para o agente de Transição, que vai costurar os dois sistemas.
//   3. O contrato pedido (`ActivateOverworld`/`DeactivateOverworld`) já
//      pressupõe um handoff explícito entre dois loops — com canvas separado
//      esse handoff também controla visibilidade (display:none/block), então
//      um bug de "esqueceram de parar o rAF" pelo menos não pinta por cima
//      do outro sistema enquanto isso não é corrigido.
//
// O único requisito da skill que isso não resolve sozinho: os DOIS loops
// (Game_Step do engine.js e o loop daqui) não podem ficar rodando ao mesmo
// tempo. Este módulo cumpre a metade que lhe cabe — `DeactivateOverworld()`
// faz `cancelAnimationFrame` de verdade no PRÓPRIO loop, não só para de
// desenhar — mas cabe ao agente de Transição garantir que `Game_Step` também
// pare antes de chamar `ActivateOverworld()` de volta.
// ============================================================================

(function () {
    'use strict';

    // ---- Constantes de projeção (2:1 dimétrico, conforme a skill) ----------
    var TILE_W = 64;
    var TILE_H = 32;
    var HALF_W = TILE_W / 2;
    var HALF_H = TILE_H / 2;

    var GRID_URL = 'data/niteroi_overworld_grid.json';

    // ---- Estado interno (fechado neste módulo — nada aqui vaza pra window
    // além dos 4 pontos de contrato pedidos) --------------------------------
    var S = {
        rows: null,          // array de strings, rows[row][col]
        dim: 0,              // 85
        landmark: null,      // {minRow,maxRow,minCol,maxCol,centerRow,centerCol}
        loaded: false,
        pendingActivate: null, // {x,y} se ActivateOverworld foi chamado antes do fetch terminar

        playerCol: 0,
        playerRow: 0,
        insideLandmark: false, // borda de entrada (dispara EnterEpisode1 só na transição fora->dentro)
        lastDir: { dc: 0, dr: 1 }, // pra desenhar o marcador do jogador virado pra algum lado

        isActive: false,
        rafId: null,

        canvas: null,
        ctx: null,

        keys: {},          // teclas pressionadas agora
        lastStepAt: 0,
        stepIntervalMs: 150, // movimento por "tile" — não contínuo em pixel

        avatarImgCache: {}, // url -> HTMLImageElement

        resizeHandler: null,
        keydownHandler: null,
        keyupHandler: null
    };

    // ---- Paleta: reaproveitada de css/style.css, nunca inventada aqui ------
    // Lidas via getComputedStyle em runtime (ficam em sincronia com o CSS de
    // verdade); fallback hardcoded só se a stylesheet ainda não tiver
    // aplicado (ex.: script rodando antes do <link> resolver).
    var PALETTE_FALLBACK = {
        cyan: 'hsl(180, 100%, 50%)',
        magenta: 'hsl(300, 100%, 50%)',
        purple: 'hsl(275, 100%, 60%)',
        yellow: 'hsl(50, 100%, 50%)',
        green: 'hsl(120, 100%, 45%)',
        red: 'hsl(0, 100%, 50%)',
        bgDark: '#070708',
        surfaceDark: '#0d0d10'
    };

    function readPalette() {
        var cs = getComputedStyle(document.documentElement);
        function v(name, fallback) {
            var val = cs.getPropertyValue(name);
            return (val && val.trim()) ? val.trim() : fallback;
        }
        return {
            cyan: v('--cyan-neon', PALETTE_FALLBACK.cyan),
            magenta: v('--magenta-neon', PALETTE_FALLBACK.magenta),
            purple: v('--purple-neon', PALETTE_FALLBACK.purple),
            yellow: v('--yellow-neon', PALETTE_FALLBACK.yellow),
            green: v('--green-neon', PALETTE_FALLBACK.green),
            red: v('--red-neon', PALETTE_FALLBACK.red),
            bgDark: v('--bg-dark', PALETTE_FALLBACK.bgDark),
            surfaceDark: v('--surface-dark', PALETTE_FALLBACK.surfaceDark)
        };
    }

    // Paleta de matizes (H em graus) usada só pra derivar variação de
    // prédios a partir das MESMAS cores neon — não são "cores novas", são os
    // mesmos hues do :root em outra lightness/saturation (sombra/luz do
    // prédio), do jeito que qualquer paleta de jogo isométrico varia
    // material sem sair da identidade visual.
    var BUILDING_HUES = [180, 300, 275, 50, 120, 0]; // cyan, magenta, purple, yellow, green, red

    // ---- PRNG determinístico por posição — MESMO princípio usado hoje nos
    // ícones dos 333 emblemas (HashStringToInt + xorshift32 em
    // js/web2/badges.js: HashStringToInt/MakeSeededRandom). Replicado aqui
    // localmente (não importado) pra manter este arquivo autocontido, como
    // pedido — mesmo algoritmo, mesma ideia: uma seed textual determinística
    // baseada na posição do tile faz cada quarteirão parecer diferente sem
    // guardar estado nenhum, e sem nunca mudar de frame pra frame. -----------
    function hashStringToInt(str) {
        var h = 2166136261;
        for (var i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = (h * 16777619) >>> 0;
        }
        return h >>> 0;
    }
    function makeSeededRandom(seed) {
        var s = (seed >>> 0) || 1;
        return function () {
            s ^= (s << 13); s >>>= 0;
            s ^= (s >>> 17);
            s ^= (s << 5); s >>>= 0;
            return (s >>> 0) / 4294967296;
        };
    }
    function rngForTile(col, row) {
        return makeSeededRandom(hashStringToInt('overworld_tile_' + col + '_' + row));
    }

    // ---- Contrato público (preenchido incrementalmente abaixo) -------------
    window.OverworldState = { playerGridX: 0, playerGridY: 0, isActive: false };
    window.OverworldTowerGridPos = null;

    // ======================= Carregamento dos dados ==========================
    function loadGrid() {
        fetch(GRID_URL)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status + ' ao buscar ' + GRID_URL);
                return r.json();
            })
            .then(function (data) {
                // Nota: `dimensions`/`legend`/`encoding` descritivos vivem em `data._meta.grid`
                // (metadados sobre o arquivo); os dados de jogo de verdade são `data.grid.rows`
                // (array de strings) — os dois `grid` são objetos irmãos diferentes, não aninhados
                // um dentro do outro. Deriva `dim` do array real em vez de reler o número do
                // _meta, pra nunca dessincronizar se o grid for regenerado em outro tamanho.
                S.rows = data.grid.rows;
                S.dim = S.rows.length;
                computeLandmarkBounds();
                S.loaded = true;
                console.log('[Overworld] grid carregado (' + S.dim + 'x' + S.dim + '). Torre em', window.OverworldTowerGridPos);
                if (S.pendingActivate) {
                    var p = S.pendingActivate;
                    S.pendingActivate = null;
                    activateNow(p.x, p.y);
                }
            })
            .catch(function (err) {
                console.error('[Overworld] falha ao carregar ' + GRID_URL + ':', err);
            });
    }

    // Varre o grid de verdade em busca de 'L' em vez de confiar em números
    // fixos do _meta — robusto a uma regeneração futura do arquivo (skill
    // osm-to-game-grid pode rodar de novo com outro raio/rua).
    function computeLandmarkBounds() {
        var minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
        for (var r = 0; r < S.rows.length; r++) {
            var row = S.rows[r];
            for (var c = 0; c < row.length; c++) {
                if (row[c] === 'L') {
                    if (r < minRow) minRow = r;
                    if (r > maxRow) maxRow = r;
                    if (c < minCol) minCol = c;
                    if (c > maxCol) maxCol = c;
                }
            }
        }
        if (minRow === Infinity) {
            console.warn('[Overworld] nenhuma célula "L" encontrada no grid — landmark ausente.');
            S.landmark = null;
            window.OverworldTowerGridPos = null;
            return;
        }
        var centerRow = Math.round((minRow + maxRow) / 2);
        var centerCol = Math.round((minCol + maxCol) / 2);
        S.landmark = {
            minRow: minRow, maxRow: maxRow, minCol: minCol, maxCol: maxCol,
            centerRow: centerRow, centerCol: centerCol,
            // âncora de profundidade = canto mais "perto da câmera" do footprint
            // (maior col+row), conforme a regra de sort da skill (§2: sprite alto
            // ancora no footprint, não no topo do sprite).
            anchorRow: maxRow, anchorCol: maxCol
        };
        window.OverworldTowerGridPos = { gridX: centerCol, gridY: centerRow };
    }

    function isWalkable(col, row) {
        if (!S.rows) return false;
        if (row < 0 || row >= S.dim || col < 0 || col >= S.dim) return false;
        return S.rows[row][col] !== '#';
    }

    function isInsideLandmark(col, row) {
        if (!S.landmark) return false;
        return row >= S.landmark.minRow && row <= S.landmark.maxRow &&
               col >= S.landmark.minCol && col <= S.landmark.maxCol;
    }

    // ============================ Projeção ====================================
    function gridToScreen(col, row) {
        return {
            x: (col - row) * HALF_W,
            y: (col + row) * HALF_H
        };
    }

    // ============================ Canvas / DOM =================================
    function ensureCanvas() {
        if (S.canvas) return S.canvas;
        var container = document.querySelector('.canvas-container');
        var refCanvas = document.getElementById('myCanvas');
        if (!container) {
            console.error('[Overworld] .canvas-container não encontrado no DOM — não é possível montar o canvas do overworld.');
            return null;
        }
        var canvas = document.createElement('canvas');
        canvas.id = 'overworldCanvas';
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '50'; // acima do myCanvas, abaixo de modais/HUD
        canvas.style.display = 'none';
        canvas.style.background = '#000';
        container.appendChild(canvas);
        S.canvas = canvas;
        S.ctx = canvas.getContext('2d');
        resizeCanvasToContainer();
        return canvas;
    }

    // Alinha o canvas do overworld exatamente sobre o retângulo de #myCanvas — NÃO usa
    // width/height:100% do .canvas-container, porque esse container também contém
    // #mobileControlsContainer em fluxo normal (position:static) abaixo de ~1300px de
    // largura (ver css/style.css), o que deixa o container mais alto que o próprio
    // myCanvas; 100% esticaria/desalinharia o desenho. Em vez disso, mede o
    // getBoundingClientRect de ambos e posiciona em pixels absolutos relativos ao
    // container, tanto para o tamanho de exibição (CSS) quanto para a resolução
    // interna (canvas.width/height) — refeito a cada resize/activate.
    function resizeCanvasToContainer() {
        if (!S.canvas) return;
        var refCanvas = document.getElementById('myCanvas');
        var container = S.canvas.parentElement;
        if (!refCanvas || !container) return;
        var refRect = refCanvas.getBoundingClientRect();
        var containerRect = container.getBoundingClientRect();
        var leftPx = Math.round(refRect.left - containerRect.left);
        var topPx = Math.round(refRect.top - containerRect.top);
        var w = Math.max(1, Math.round(refRect.width || 640));
        var h = Math.max(1, Math.round(refRect.height || 300));

        S.canvas.style.left = leftPx + 'px';
        S.canvas.style.top = topPx + 'px';
        S.canvas.style.width = w + 'px';
        S.canvas.style.height = h + 'px';
        if (S.canvas.width !== w) S.canvas.width = w;
        if (S.canvas.height !== h) S.canvas.height = h;
    }

    // ============================ Desenho de tiles ==============================
    // Desenha um "prisma" isométrico (base em diamante + duas paredes visíveis +
    // teto), usado tanto pros prédios genéricos (1 tile) quanto pra torre
    // (footprint 3x3, halfW/halfH maiores). cx,cy = centro da base do prisma
    // (pé, no nível do chão) já em coordenadas de tela, com a câmera aplicada.
    function drawExtrudedDiamond(ctx, cx, cy, hw, hh, height, colors) {
        var T = { x: cx, y: cy - hh };
        var R = { x: cx + hw, y: cy };
        var B = { x: cx, y: cy + hh };
        var L = { x: cx - hw, y: cy };
        var Tt = { x: T.x, y: T.y - height };
        var Rt = { x: R.x, y: R.y - height };
        var Bt = { x: B.x, y: B.y - height };
        var Lt = { x: L.x, y: L.y - height };

        // parede esquerda (face L-B)
        ctx.fillStyle = colors.leftFace;
        ctx.beginPath();
        ctx.moveTo(L.x, L.y); ctx.lineTo(B.x, B.y); ctx.lineTo(Bt.x, Bt.y); ctx.lineTo(Lt.x, Lt.y);
        ctx.closePath(); ctx.fill();

        // parede direita (face B-R)
        ctx.fillStyle = colors.rightFace;
        ctx.beginPath();
        ctx.moveTo(B.x, B.y); ctx.lineTo(R.x, R.y); ctx.lineTo(Rt.x, Rt.y); ctx.lineTo(Bt.x, Bt.y);
        ctx.closePath(); ctx.fill();

        // teto (topo)
        ctx.fillStyle = colors.roof;
        ctx.beginPath();
        ctx.moveTo(Tt.x, Tt.y); ctx.lineTo(Rt.x, Rt.y); ctx.lineTo(Bt.x, Bt.y); ctx.lineTo(Lt.x, Lt.y);
        ctx.closePath(); ctx.fill();
        if (colors.roofStroke) {
            ctx.strokeStyle = colors.roofStroke;
            ctx.lineWidth = colors.roofStrokeWidth || 1;
            ctx.stroke();
        }
    }

    function drawFlatDiamond(ctx, cx, cy, hw, hh, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - hh);
        ctx.lineTo(cx + hw, cy);
        ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx - hw, cy);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    function hslShade(hue, sat, light) {
        return 'hsl(' + hue + ', ' + sat + '%, ' + light + '%)';
    }

    function drawStreetTile(ctx, cx, cy, pal) {
        // asfalto acinzentado com contorno neon sutil (tom ciano baixa opacidade),
        // reaproveitando --surface-dark como base — sem cor nova.
        drawFlatDiamond(ctx, cx, cy, HALF_W, HALF_H, pal.surfaceDark, 'rgba(0, 255, 255, 0.18)');
        // leve linha central sugerindo guia de meio-fio, só decorativa
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - HALF_W * 0.5, cy - HALF_H * 0.5);
        ctx.lineTo(cx + HALF_W * 0.5, cy + HALF_H * 0.5);
        ctx.stroke();
    }

    function drawBlockTile(ctx, cx, cy, col, row) {
        var rng = rngForTile(col, row);
        var hue = BUILDING_HUES[Math.floor(rng() * BUILDING_HUES.length)];
        var stories = 1 + Math.floor(rng() * 4); // 1..4
        var height = stories * 16 + Math.floor(rng() * 8); // 16..72px de variação
        var sat = 70 + Math.floor(rng() * 20); // 70..90
        drawExtrudedDiamond(ctx, cx, cy, HALF_W * 0.86, HALF_H * 0.86, height, {
            roof: hslShade(hue, sat, 42),
            leftFace: hslShade(hue, sat, 20),
            rightFace: hslShade(hue, sat, 13),
            roofStroke: hslShade(hue, 100, 60),
            roofStrokeWidth: 0.75
        });
    }

    function drawLandmarkGroundMarker(ctx, cx, cy, pal) {
        // marcação de piso pra cada uma das 9 células do footprint (glow sutil),
        // além do prisma da torre desenhado só na célula-âncora.
        drawFlatDiamond(ctx, cx, cy, HALF_W, HALF_H, 'rgba(191, 0, 255, 0.10)', pal.purple);
    }

    function drawTower(ctx, cx, cy, pal, tSec) {
        var hw = HALF_W * 3, hh = HALF_H * 3; // footprint 3x3
        var height = 170;
        ctx.save();
        ctx.shadowColor = pal.cyan;
        ctx.shadowBlur = 22;
        drawExtrudedDiamond(ctx, cx, cy, hw, hh, height, {
            roof: pal.purple,
            leftFace: hslShade(275, 70, 22),
            rightFace: hslShade(275, 70, 14),
            roofStroke: pal.cyan,
            roofStrokeWidth: 2
        });
        ctx.restore();

        // farol pulsante no topo — deixa a torre óbvia de longe, conforme pedido.
        var pulse = 0.55 + 0.45 * Math.sin(tSec * 2.4);
        var beaconY = cy - height - hh - 14;
        ctx.save();
        ctx.shadowColor = pal.cyan;
        ctx.shadowBlur = 16 + pulse * 14;
        ctx.fillStyle = pal.cyan;
        ctx.globalAlpha = 0.55 + pulse * 0.45;
        ctx.beginPath();
        ctx.arc(cx, beaconY, 6 + pulse * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawPlayerToken(ctx, cx, cy, pal, label, color, isSelf) {
        var footY = cy;
        var bodyH = 20;
        ctx.save();
        if (isSelf) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, footY - bodyH, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // "sombra" no chão, achatada como o tile
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(cx, footY, HALF_W * 0.28, HALF_H * 0.28, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();

        if (label) {
            ctx.save();
            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
            ctx.fillText(label, cx, footY - bodyH - 16);
            ctx.restore();
        }
    }

    // ============================== Frame de render =============================
    function render(tsMs) {
        var ctx = S.ctx, canvas = S.canvas;
        if (!ctx || !S.rows) return;
        var pal = readPalette();
        var tSec = tsMs / 1000;

        ctx.fillStyle = pal.bgDark;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var camCenter = gridToScreen(S.playerCol, S.playerRow);
        var camOffsetX = canvas.width / 2 - camCenter.x;
        var camOffsetY = canvas.height / 2 - camCenter.y;

        // culling: janela quadrada em espaço de grid ao redor do jogador, generosa
        // o bastante pra cobrir o viewport (não desenha os 85x85 fora de tela).
        var colSpan = Math.ceil((canvas.width / 2) / HALF_W) + 3;
        var rowSpan = Math.ceil((canvas.height / 2) / HALF_H) + 3;
        var R = colSpan + rowSpan;

        var minRow = Math.max(0, S.playerRow - R);
        var maxRow = Math.min(S.dim - 1, S.playerRow + R);
        var minCol = Math.max(0, S.playerCol - R);
        var maxCol = Math.min(S.dim - 1, S.playerCol + R);

        var drawables = [];
        for (var r = minRow; r <= maxRow; r++) {
            var rowStr = S.rows[r];
            for (var c = minCol; c <= maxCol; c++) {
                drawables.push({ key: r + c, type: 'tile', row: r, col: c, ch: rowStr[c] });
            }
        }

        var others = window.OverworldOtherPlayers;
        if (Array.isArray(others)) {
            for (var i = 0; i < others.length; i++) {
                var p = others[i];
                if (!p || typeof p.gridX !== 'number' || typeof p.gridY !== 'number') continue;
                drawables.push({ key: p.gridY + p.gridX, type: 'other', data: p });
            }
        }

        drawables.push({ key: S.playerRow + S.playerCol, type: 'player' });

        // depth-sort único (tiles + entidades juntos) — regra §2 da skill.
        drawables.sort(function (a, b) { return a.key - b.key; });

        for (var d = 0; d < drawables.length; d++) {
            var item = drawables[d];
            if (item.type === 'tile') {
                var s = gridToScreen(item.col, item.row);
                var sx = s.x + camOffsetX, sy = s.y + camOffsetY;
                if (item.ch === '#') {
                    drawBlockTile(ctx, sx, sy, item.col, item.row);
                } else if (item.ch === 'L') {
                    drawLandmarkGroundMarker(ctx, sx, sy, pal);
                    if (S.landmark && item.row === S.landmark.anchorRow && item.col === S.landmark.anchorCol) {
                        var center = gridToScreen(S.landmark.centerCol, S.landmark.centerRow);
                        drawTower(ctx, center.x + camOffsetX, center.y + camOffsetY, pal, tSec);
                    }
                } else {
                    drawStreetTile(ctx, sx, sy, pal);
                }
            } else if (item.type === 'other') {
                var s2 = gridToScreen(item.data.gridX, item.data.gridY);
                var name = item.data.name || item.data.email || '???';
                if (item.data.avatarUrl) loadAvatar(item.data.avatarUrl);
                drawPlayerToken(ctx, s2.x + camOffsetX, s2.y + camOffsetY, pal, name, pal.magenta, false);
            } else if (item.type === 'player') {
                var s3 = gridToScreen(S.playerCol, S.playerRow);
                drawPlayerToken(ctx, s3.x + camOffsetX, s3.y + camOffsetY, pal, 'você', pal.cyan, true);
            }
        }

        // HUD mínimo de depuração — posição do jogador no grid.
        ctx.save();
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = 'rgba(0,255,255,0.85)';
        ctx.fillText('Overworld  col=' + S.playerCol + ' row=' + S.playerRow, 8, 14);
        ctx.restore();
    }

    function loadAvatar(url) {
        if (S.avatarImgCache[url]) return S.avatarImgCache[url];
        var img = new Image();
        img.src = url;
        S.avatarImgCache[url] = img;
        return img;
    }

    // ============================== Input / movimento ============================
    var KEY_TO_DELTA = {
        ArrowUp: { dc: 0, dr: -1 }, w: { dc: 0, dr: -1 }, W: { dc: 0, dr: -1 },
        ArrowDown: { dc: 0, dr: 1 }, s: { dc: 0, dr: 1 }, S: { dc: 0, dr: 1 },
        ArrowLeft: { dc: -1, dr: 0 }, a: { dc: -1, dr: 0 }, A: { dc: -1, dr: 0 },
        ArrowRight: { dc: 1, dr: 0 }, d: { dc: 1, dr: 0 }, D: { dc: 1, dr: 0 }
    };

    function attachInput() {
        S.keydownHandler = function (e) {
            if (KEY_TO_DELTA[e.key]) {
                S.keys[e.key] = true;
                if (e.key.indexOf('Arrow') === 0) e.preventDefault();
            }
        };
        S.keyupHandler = function (e) {
            if (KEY_TO_DELTA[e.key]) S.keys[e.key] = false;
        };
        window.addEventListener('keydown', S.keydownHandler);
        window.addEventListener('keyup', S.keyupHandler);
    }

    function detachInput() {
        if (S.keydownHandler) window.removeEventListener('keydown', S.keydownHandler);
        if (S.keyupHandler) window.removeEventListener('keyup', S.keyupHandler);
        S.keydownHandler = null; S.keyupHandler = null;
        S.keys = {};
    }

    function currentInputDelta() {
        for (var key in KEY_TO_DELTA) {
            if (S.keys[key]) return KEY_TO_DELTA[key];
        }
        return null;
    }

    function tryMove(dc, dr) {
        var nc = S.playerCol + dc, nr = S.playerRow + dr;
        if (!isWalkable(nc, nr)) return false; // bloqueia contra 'block', permite 'street'/'landmark'
        S.playerCol = nc; S.playerRow = nr;
        S.lastDir = { dc: dc, dr: dr };
        syncPublicState();
        checkLandmarkEnter();
        return true;
    }

    function checkLandmarkEnter() {
        var inside = isInsideLandmark(S.playerCol, S.playerRow);
        if (inside && !S.insideLandmark) {
            // borda de entrada — dispara uma vez só, não a cada frame parado lá dentro.
            if (typeof window.EnterEpisode1FromOverworld === 'function') {
                window.EnterEpisode1FromOverworld();
            } else {
                console.log('[Overworld] jogador entrou no landmark, mas window.EnterEpisode1FromOverworld ainda não existe (ok em teste isolado).');
            }
        }
        S.insideLandmark = inside;
    }

    function syncPublicState() {
        window.OverworldState.playerGridX = S.playerCol;
        window.OverworldState.playerGridY = S.playerRow;
        window.OverworldState.isActive = S.isActive;
    }

    // ============================== Loop principal ==============================
    function loop(ts) {
        if (!S.isActive) return; // guarda contra o loop continuar após um Deactivate tardio
        var now = ts || performance.now();
        if (now - S.lastStepAt >= S.stepIntervalMs) {
            var delta = currentInputDelta();
            if (delta) {
                tryMove(delta.dc, delta.dr);
                S.lastStepAt = now;
            }
        }
        render(now);
        S.rafId = requestAnimationFrame(loop);
    }

    // ============================== Contrato público ==============================
    function activateNow(spawnGridX, spawnGridY) {
        ensureCanvas();
        if (!S.canvas) return;
        resizeCanvasToContainer();

        if (typeof spawnGridX === 'number' && typeof spawnGridY === 'number') {
            S.playerCol = spawnGridX;
            S.playerRow = spawnGridY;
        } else if (window.OverworldTowerGridPos) {
            // sem spawn explícito: usa a célula andável mais próxima da torre.
            S.playerCol = window.OverworldTowerGridPos.gridX;
            S.playerRow = window.OverworldTowerGridPos.gridY + 2;
        }
        S.insideLandmark = isInsideLandmark(S.playerCol, S.playerRow);
        syncPublicState();

        S.canvas.style.display = 'block';

        if (S.rafId) cancelAnimationFrame(S.rafId); // nunca dois loops vivos ao mesmo tempo (skill §4)
        detachInput();
        attachInput();

        if (!S.resizeHandler) {
            S.resizeHandler = function () { resizeCanvasToContainer(); };
            window.addEventListener('resize', S.resizeHandler);
        }

        S.isActive = true;
        window.OverworldState.isActive = true;
        S.lastStepAt = 0;
        S.rafId = requestAnimationFrame(loop);
    }

    window.ActivateOverworld = function (spawnGridX, spawnGridY) {
        if (!S.loaded) {
            // grid ainda não terminou de carregar — guarda o pedido e ativa
            // assim que o fetch resolver, em vez de falhar silenciosamente.
            S.pendingActivate = { x: spawnGridX, y: spawnGridY };
            console.log('[Overworld] ActivateOverworld chamado antes do grid carregar — ativação adiada.');
            return;
        }
        activateNow(spawnGridX, spawnGridY);
    };

    window.DeactivateOverworld = function () {
        S.isActive = false;
        window.OverworldState.isActive = false;
        if (S.rafId) {
            cancelAnimationFrame(S.rafId);
            S.rafId = null;
        }
        detachInput();
        if (S.resizeHandler) {
            window.removeEventListener('resize', S.resizeHandler);
            S.resizeHandler = null;
        }
        if (S.canvas) S.canvas.style.display = 'none';
    };

    // ============================== Boot ==============================
    function init() {
        ensureCanvas();
        loadGrid();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
