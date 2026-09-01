// web2/badges.js
// ============================================================================
// Sistema de 333 emblemas/conquistas (01/09/2026). Modal em index.html
// (#badgesModal + #badgeDetailOverlay), estilos em css/style.css (seção
// "BADGES MODAL"). Botão de acesso ("🏅 BADGES") dentro de #myProfileModal,
// perto do contador de amigos. Depende de profile.js já ter carregado antes
// (reaproveita emitProfileRequest(), o mesmo helper request/response via
// socket.io que friends.js já usa — mesmo scope global clássico <script>,
// sem import). Comentários em português, UI em inglês — mesmo padrão do
// resto do projeto (profile.js/friends.js).
//
// CONTRATO COM O BACKEND — CONFIRMADO em 01/09/2026 lendo server/db.js e
// server/index.js linha a linha depois do backend-architect terminar (a UI foi
// construída antes disso, contra dado mock — ver seção TESTE abaixo; os pontos
// que só existiam como suposição foram checados e corrigidos aqui):
//   socket.emit('get_badges', { email? })
//     -> 'badges_loaded' ({ badges: [{id, category, name, description,
//        requirementType, requirementValue, sortOrder}], unlocked: [badgeId, ...],
//        email })
//     -> 'badges_error' ({ message }) — nome do evento CONFIRMADO batendo com o
//        chute original (padrão de 'player_profile_error'/'friend_request_error').
//        Servidor emite isso, por exemplo, se o socket não estiver autenticado
//        (ver server/index.js linha ~554: exige playerSession.email).
//   `email` no payload (01/09/2026, pedido do usuário: "ver medalhas de OUTRO
//   jogador a partir do perfil dele"): OPCIONAL. Omitido = "unlocked" da conta
//   autenticada (comportamento de sempre). Presente = "unlocked" público daquele
//   outro jogador (mesmo espírito de get_diary_entries/get_player_profile — só
//   exige socket autenticado, nunca amizade com o alvo). O catálogo (`badges`)
//   nunca muda por jogador, só "unlocked". Ver GetBadgesTargetEmail()/LoadBadges()
//   abaixo: manda o email automaticamente quando #myProfileModal está aberto em
//   modo 'other' (g_myProfileState, profile.js). `email` que volta em
//   'badges_loaded' é o MESMO que foi pedido (eco do servidor) — usado só como
//   dado informativo, a proteção real contra resposta atrasada é client-side
//   (GetBadgesTargetEmail() lido de novo no callback, ver LoadBadges()).
// ARMADILHA REAL ENCONTRADA (categoria com nome em português, não inglês):
//   'category' NÃO é 'evolution'/'combat'/etc — são os slugs em português que o
//   gameplay-engineer/backend-architect escolheram em server/seed_badges.js:
//   'evolucao_assombrada', 'combate_espiritual', 'acumulador_do_alem',
//   'exploracao', 'acrobacias', 'segredos'. BADGE_CATEGORY_CONFIG abaixo usa
//   EXATAMENTE essas chaves (não os nomes em inglês da tarefa, que eram só a
//   descrição do conceito, não o valor real gravado no banco) — se um badge
//   chegar com uma 'category' fora desse conjunto, cai no fallback 'segredos'
//   (mesmo comportamento de robustez de sempre, só a chave de fallback mudou).
// 'unlocked' é confirmado como SÓ uma lista de badge_id (string), sem data de
// desbloqueio nenhuma (ver getUnlockedBadgeIds() em db.js — só faz SELECT
// badge_id, nunca unlocked_at, embora a coluna exista na tabela player_badges).
// A tarefa pede pra mostrar "data de desbloqueio" no detalhe — este arquivo
// aceita os dois formatos (['id', ...] OU [{badgeId, unlockedAt}, ...]) sem
// quebrar pra já funcionar se isso for estendido no futuro, mas com o contrato
// real de hoje o painel de detalhe mostra só o selo "UNLOCKED", sem data —
// nunca inventa uma data que o servidor não mandou.
// 'requirementType' real (server/seed_badges.js) é um conjunto de ~85 valores
// bem específicos de gameplay (contadores nomeados tipo
// 'triple_jump_narrow_platform_count', 'password_used_matrix',
// 'rare_first_crown', mais 'level_time_L01'..'L33'/'full_game_time' pro grupo
// "quanto menor melhor", mais os 4 numéricos genéricos level/kills/lives/
// episode_items_complete). FormatBadgeRequirement() cobre os 4 genéricos com
// frase própria + o padrão level_time_*/full_game_time (frase "finish X in Yy
// or less"); os ~80 restantes, específicos de uma mecânica batizada por quem
// implementou aquele gancho no jogo, caem no fallback genérico — escrever uma
// frase natural pra cada um é trabalho de conteúdo/copy de quem nomeou aquele
// requisito (gameplay-engineer/narrative-designer), não uma inferência segura
// pra este arquivo de UI adivinhar a partir do nome da constante.
//
// TESTE: a UI foi construída e validada primeiro com dado MOCK local
// (BuildMockBadgeData() abaixo, 333 emblemas fake, ~30% desbloqueados por
// categoria) enquanto o backend ainda não existia — LoadBadges() cai
// automaticamente no mock se não houver socket conectado, se 'get_badges'
// nunca responder (timeout curto de 8s) ou se o servidor responder com uma
// lista vazia; #badgesErrorState sempre mostra um aviso visível quando isso
// acontece, nunca escondido do jogador. DEPOIS, com o backend real já no ar
// (servidor local rodando, 320 badges reais no catálogo — 333 é a contagem
// final planejada, ainda não 100% seedada), a UI foi testada de novo contra
// 'get_badges' de verdade — ver relatório desta sessão pro resultado
// específico (categoria batendo, ícones corretos, contagem real de
// desbloqueados de uma conta de teste descartável).
// ============================================================================

var g_badgesState = {
    badgesById: {},      // String(id) -> badge (com _tier/_rankIndex/_categorySize anotados)
    unlockedMap: {},      // String(id) -> { unlockedAt: string|null }
    iconCache: {}          // String(id) -> string SVG já gerada (evita regenerar ao rolar)
};

// ----------------------------------------------------------------------------
// Categorias: paleta base = as MESMAS --*-neon já estabelecidas em
// css/style.css (nada de cor nova fora da identidade visual do jogo). "light"
// e "dark" são só tons claros/escuros calculados à mão a partir de cada
// --*-neon (não dá pra clarear/escurecer var() em runtime sem JS extra), usados
// só pra sombreamento pseudo-3D do ícone — a cor de identidade real de cada
// categoria continua sendo a var(--*-neon) em "base".
// ----------------------------------------------------------------------------
// Chaves = 'category' EXATO que vem do servidor (ver ARMADILHA no topo do
// arquivo) — slugs em português escolhidos por quem implementou o catálogo em
// server/seed_badges.js, não os nomes em inglês do conceito de design.
var BADGE_CATEGORY_ORDER = ['evolucao_assombrada', 'combate_espiritual', 'exploracao', 'acumulador_do_alem', 'acrobacias', 'segredos'];

var BADGE_CATEGORY_CONFIG = {
    evolucao_assombrada: {
        label: 'EVOLUTION', shapeFamily: 'ghost',
        colors: { base: 'var(--purple-neon)', light: '#E7D9FF', dark: '#241238' },
        mythicGradient: ['var(--purple-neon)', '#8FD9FF', '#FFFFFF']
    },
    combate_espiritual: {
        label: 'COMBAT', shapeFamily: 'blade',
        colors: { base: 'var(--red-neon)', light: '#FFC199', dark: '#3A0A00' },
        mythicGradient: ['var(--red-neon)', '#FF8A00', '#FFE08A']
    },
    exploracao: {
        label: 'EXPLORATION', shapeFamily: 'compass',
        colors: { base: 'var(--green-neon)', light: '#EFE3A8', dark: '#0C2B12' },
        mythicGradient: ['var(--green-neon)', '#D4AF37', '#FFF6D2']
    },
    acumulador_do_alem: {
        label: 'COLLECTION', shapeFamily: 'gem',
        colors: { base: 'var(--yellow-neon)', light: '#FFF6D2', dark: '#4A3600' },
        mythicGradient: ['var(--yellow-neon)', '#FFD700', '#FFFFFF']
    },
    acrobacias: {
        label: 'ACROBATICS', shapeFamily: 'bolt',
        colors: { base: 'var(--cyan-neon)', light: '#D8FBFF', dark: '#00232B' },
        mythicGradient: ['var(--cyan-neon)', '#0080FF', '#FFFFFF']
    },
    segredos: {
        label: 'SECRETS', shapeFamily: 'eye',
        colors: { base: 'var(--magenta-neon)', light: '#FFD9F7', dark: '#12000E' },
        mythicGradient: ['var(--magenta-neon)', '#4B004B', '#000000']
    }
};

// ----------------------------------------------------------------------------
// Progressão de tier DENTRO de cada categoria (regra documentada, ver tarefa):
//   - Os badges são ordenados por sortOrder (fallback requirementValue, depois
//     id) dentro da própria categoria — não misturado entre categorias.
//   - O ÚLTIMO da categoria (maior sortOrder) é SEMPRE tier 'mythic',
//     incondicionalmente — é o "algo especial pro emblema final de cada
//     categoria" pedido na tarefa.
//   - Os demais se dividem em 4 baldes iguais ao longo do rank:
//     bronze -> silver -> gold -> platinum (rank baixo = bronze = fácil/comum,
//     rank alto = platinum = quase o topo).
//   - Categoria com um badge só: esse único badge já É o final, então também
//     vira 'mythic' (não faria sentido chamá-lo de "bronze" sozinho).
// Cada tier muda o ícone gerado em 3 eixos, todos crescentes com o tier (ver
// GenerateBadgeIconSVG): (1) cor da borda/moldura (bronze/prata/ouro/platina/
// gradiente prismático da própria paleta da categoria no mythic), (2) número
// de "sparkles" decorativos nos cantos (0/1/2/3/4), (3) quantidade de jitter
// (pixels de borda alterados pela semente) aplicada à silhueta — mais jitter
// tende a deixar o contorno mais "recortado"/complexo visualmente, a forma de
// "mais pontas" pedida na tarefa sem precisar de uma geometria por tier.
// ----------------------------------------------------------------------------
var BADGE_TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum']; // 'mythic' é à parte, sempre o último da categoria
var BADGE_TIER_FRAME = {
    bronze:   { color: '#A9662B', width: 1.1 },
    silver:   { color: '#C7CDD4', width: 1.1 },
    gold:     { color: '#E8B93D', width: 1.5 },
    platinum: { color: '#DCEFEF', width: 1.5 },
    mythic:   { color: null, width: 2.1 } // null = usa o gradiente da própria categoria (mythicGradient)
};
var BADGE_TIER_SPARKLES = { bronze: 0, silver: 1, gold: 2, platinum: 3, mythic: 4 };
var BADGE_TIER_JITTER = { bronze: 2, silver: 3, gold: 4, platinum: 5, mythic: 6 };
var BADGE_TIER_LABEL = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum', mythic: 'Mythic' };

function ComputeBadgeTiers(badges) {
    var byCategory = {};
    badges.forEach(function (b) {
        var cat = b.category || 'segredos';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(b);
    });
    Object.keys(byCategory).forEach(function (cat) {
        var list = byCategory[cat].slice().sort(function (a, b) {
            var av = (typeof a.sortOrder === 'number') ? a.sortOrder : (a.requirementValue || 0);
            var bv = (typeof b.sortOrder === 'number') ? b.sortOrder : (b.requirementValue || 0);
            if (av !== bv) return av - bv;
            return String(a.id).localeCompare(String(b.id));
        });
        var n = list.length;
        list.forEach(function (badge, i) {
            var tier;
            if (n === 1 || i === n - 1) {
                tier = 'mythic';
            } else {
                var bucket = Math.floor((i / (n - 1)) * BADGE_TIER_ORDER.length);
                if (bucket >= BADGE_TIER_ORDER.length) bucket = BADGE_TIER_ORDER.length - 1;
                tier = BADGE_TIER_ORDER[bucket];
            }
            badge._tier = tier;
            badge._rankIndex = i;
            badge._categorySize = n;
        });
    });
}

// ----------------------------------------------------------------------------
// PRNG determinístico (xorshift32) semeado a partir do id do badge — mesmo id
// sempre gera o mesmo ícone, sem precisar guardar nada no servidor além do id.
// ----------------------------------------------------------------------------
function HashStringToInt(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h * 16777619) >>> 0;
    }
    return h >>> 0;
}
function MakeSeededRandom(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
        s ^= (s << 13); s >>>= 0;
        s ^= (s >>> 17);
        s ^= (s << 5); s >>>= 0;
        return (s >>> 0) / 4294967296;
    };
}

// ----------------------------------------------------------------------------
// Silhuetas 8-bit: cada família de forma é uma função isFilled(x,y) sobre uma
// grade 12x12 (0..11) — geometria simples (elipse, distância de Manhattan/
// Chebyshev, distância a um segmento de reta), não curvas suaves. Isso é o que
// torna o ícone "gerado", não desenhado: a MESMA função roda pros ~55 badges
// de cada categoria, e o jitter semeado (ver ApplySeededJitter) que faz cada
// um dos 333 parecer distinto o bastante pra reconhecer de relance.
// ----------------------------------------------------------------------------
var BADGE_GRID_SIZE = 12;
var BADGE_ICON_VIEWBOX = 24; // 24x24 unidades de viewBox, 2 unidades por célula

function DistPointToSegment(px, py, x1, y1, x2, y2) {
    var A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    var lenSq = C * C + D * D;
    var t = lenSq !== 0 ? (A * C + B * D) / lenSq : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var xx = x1 + t * C, yy = y1 + t * D;
    var dx = px - xx, dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Evolução: fantasma pixelado — cabeça arredondada (elipse) + corpo reto +
// base recortada em "ondas" (a cauda clássica de fantasma) + 2 olhos vazados.
function GhostFilled(x, y) {
    var cx = 5.5;
    if (y <= 7) {
        var dx = (x - cx) / 5.3, dy = (y - 4.6) / 5.5;
        if ((dx * dx + dy * dy) > 1.05) return false;
    } else if (y === 8 || y === 9) {
        if (Math.abs(x - cx) > 5.3) return false;
    } else if (y === 10) {
        if ((x % 3) === 2 || Math.abs(x - cx) > 5.3) return false;
    } else {
        if ((x % 3) !== 0 || Math.abs(x - cx) > 5) return false;
    }
    // olhos vazados
    if ((y === 4 || y === 5) && (x === 3 || x === 4 || x === 7 || x === 8)) return false;
    return true;
}

// Combate: espada — lâmina afunilada (mais larga perto da guarda, estreita na
// ponta), guarda transversal, cabo.
function BladeFilled(x, y) {
    if (y <= 7) {
        var half = 0.5 + (y / 7) * 1.1;
        return Math.abs(x - 5.5) <= half;
    }
    if (y === 8 || y === 9) return x >= 2 && x <= 9;
    return Math.abs(x - 5.5) <= 0.7; // y 10-11: cabo
}

// Exploração: rosa dos ventos — losango central (distância de Manhattan) +
// hastes retas até a borda nos 4 eixos cardeais.
function CompassFilled(x, y) {
    var dx = Math.abs(x - 5.5), dy = Math.abs(y - 5.5);
    var onSpoke = (x === 5 || x === 6) || (y === 5 || y === 6);
    return (dx + dy) <= 4.3 || onSpoke;
}

// Coleta: gema facetada — quadrado com cantos cortados (interseção de
// Chebyshev com Manhattan = octógono, corte clássico de pedra preciosa).
function GemFilled(x, y) {
    var dx = Math.abs(x - 5.5), dy = Math.abs(y - 5.5);
    var cheby = Math.max(dx, dy);
    return cheby <= 4.6 && (dx + dy) <= 7.6;
}

// Acrobacias: raio — dois traços diagonais grossos formando um Z, distância
// até segmento de reta (reaproveita DistPointToSegment).
function BoltFilled(x, y) {
    var d1 = DistPointToSegment(x, y, 8, 0, 3, 6.5);
    var d2 = DistPointToSegment(x, y, 8.5, 5.5, 3.5, 12);
    return d1 <= 1.35 || d2 <= 1.35;
}

// Segredos: olho amendoado (elipse achatada) — a pupila é desenhada depois,
// por cima, num tom escuro separado (ver EyePupilFilled), não é um vazado.
function EyeFilled(x, y) {
    var dx = (x - 5.5) / 5.4, dy = (y - 5.5) / 2.6;
    return (dx * dx + dy * dy) <= 1.05;
}
function EyePupilFilled(x, y) {
    var dx = x - 5.5, dy = y - 5.5;
    return (dx * dx + dy * dy) <= 2.1;
}

var BADGE_SHAPE_FN = {
    ghost: GhostFilled,
    blade: BladeFilled,
    compass: CompassFilled,
    gem: GemFilled,
    bolt: BoltFilled,
    eye: EyeFilled
};

// Sombreamento pseudo-3D genérico (luz vindo do canto superior-esquerdo) —
// funciona igual pra qualquer uma das 6 famílias de forma, sem caso especial
// por shape: só olha x+y (diagonal) e escolhe entre os 3 tons da categoria.
function ShadeToneForCell(x, y, colors) {
    var v = x + y; // 0..22 numa grade 12x12
    if (v <= 7) return colors.light;
    if (v >= 15) return colors.dark;
    return colors.base;
}

// Jitter semeado: alterna algumas células de BORDA (filled com vizinho vazio,
// ou vazio com vizinho filled) — mantém a silhueta reconhecível (nunca mexe no
// "miolo" da forma) mas dá a cada badge uma pequena variação única de contorno.
// Quantidade escala com o tier (ver BADGE_TIER_JITTER) — mais alterações =
// contorno mais "recortado"/complexo, a leitura de "mais raro" pedida na tarefa.
function ApplySeededJitter(cellsFlat, rng, jitterCount) {
    var size = BADGE_GRID_SIZE;
    var candidates = [];
    for (var y = 1; y < size - 1; y++) {
        for (var x = 1; x < size - 1; x++) {
            var idx = y * size + x;
            var here = cellsFlat[idx];
            var left = cellsFlat[idx - 1], right = cellsFlat[idx + 1];
            var up = cellsFlat[idx - size], down = cellsFlat[idx + size];
            if (here !== left || here !== right || here !== up || here !== down) {
                candidates.push(idx);
            }
        }
    }
    for (var i = 0; i < jitterCount && candidates.length > 0; i++) {
        var pick = Math.floor(rng() * candidates.length);
        var cellIdx = candidates.splice(pick, 1)[0];
        cellsFlat[cellIdx] = !cellsFlat[cellIdx];
    }
}

// Funde células adjacentes na MESMA linha com o MESMO tom num único <rect>
// (em vez de 1 rect por célula) — com 333 ícones na tela ao mesmo tempo isso
// corta a contagem de elementos SVG por um fator de ~3-5x, o que importa de
// verdade no grid inteiro carregado (mesmo com lazy-mount via
// IntersectionObserver, ver GetBadgeIconObserver abaixo).
function BuildFilledRunsMarkup(cellsFlat, colors) {
    var size = BADGE_GRID_SIZE;
    var unit = BADGE_ICON_VIEWBOX / size;
    var markup = '';
    for (var y = 0; y < size; y++) {
        var runStartX = -1, runTone = null;
        for (var x = 0; x <= size; x++) {
            var filled = x < size && cellsFlat[y * size + x];
            var tone = filled ? ShadeToneForCell(x, y, colors) : null;
            if (filled && runStartX === -1) { runStartX = x; runTone = tone; }
            else if (filled && tone !== runTone) {
                markup += BadgeIconRect(runStartX * unit, y * unit, (x - runStartX) * unit, unit, runTone);
                runStartX = x; runTone = tone;
            } else if (!filled && runStartX !== -1) {
                markup += BadgeIconRect(runStartX * unit, y * unit, (x - runStartX) * unit, unit, runTone);
                runStartX = -1; runTone = null;
            }
        }
    }
    return markup;
}
function BadgeIconRect(x, y, w, h, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>';
}

function BuildSparkleMarkup(count, color) {
    if (!count) return '';
    var size = BADGE_ICON_VIEWBOX;
    var positions = [
        { x: 2.2, y: 2.2 }, { x: size - 3.6, y: 2.2 },
        { x: 2.2, y: size - 3.6 }, { x: size - 3.6, y: size - 3.6 }
    ];
    var markup = '';
    for (var i = 0; i < count && i < positions.length; i++) {
        var p = positions[i];
        var cx = p.x + 0.7, cy = p.y + 0.7;
        markup += '<rect x="' + p.x + '" y="' + p.y + '" width="1.4" height="1.4" fill="' + color + '" transform="rotate(45 ' + cx + ' ' + cy + ')"/>';
    }
    return markup;
}

// ----------------------------------------------------------------------------
// GERADOR PRINCIPAL — recebe SÓ o badge (categoria + tier já anotados nele por
// ComputeBadgeTiers(), chamado por RenderBadgeGrid antes de qualquer ícone ser
// desenhado) e devolve uma string <svg>...</svg>. Determinístico: mesmo badge
// -> mesmo SVG sempre (semente = badge.id), então dá pra cachear com segurança
// (ver g_badgesState.iconCache).
// ----------------------------------------------------------------------------
function GenerateBadgeIconSVG(badge) {
    var catCfg = BADGE_CATEGORY_CONFIG[badge.category] || BADGE_CATEGORY_CONFIG.segredos;
    var tier = badge._tier || 'bronze';
    var shapeFn = BADGE_SHAPE_FN[catCfg.shapeFamily] || GhostFilled;
    var seed = HashStringToInt(String(badge.id != null ? badge.id : (badge.category + '_' + (badge.sortOrder || 0))));
    var rng = MakeSeededRandom(seed);
    var size = BADGE_GRID_SIZE;

    var cellsFlat = new Array(size * size);
    for (var y = 0; y < size; y++) {
        for (var x = 0; x < size; x++) {
            cellsFlat[y * size + x] = shapeFn(x, y);
        }
    }
    ApplySeededJitter(cellsFlat, rng, BADGE_TIER_JITTER[tier] || 2);

    var shapeMarkup = BuildFilledRunsMarkup(cellsFlat, catCfg.colors);

    // Pupila do olho (Segredos) é desenhada por cima, sempre no mesmo lugar —
    // não participa do jitter (perderia a leitura de "olho" se virasse ruído).
    if (catCfg.shapeFamily === 'eye') {
        for (var ey = 0; ey < size; ey++) {
            for (var ex = 0; ex < size; ex++) {
                if (EyePupilFilled(ex, ey)) {
                    var u = BADGE_ICON_VIEWBOX / size;
                    shapeMarkup += BadgeIconRect(ex * u, ey * u, u, u, catCfg.colors.dark);
                }
            }
        }
    }

    var frameCfg = BADGE_TIER_FRAME[tier];
    var frameStroke = frameCfg.color;
    var gradDef = '';
    if (tier === 'mythic') {
        var gradId = 'badgeGrad_' + seed;
        var g = catCfg.mythicGradient;
        frameStroke = 'url(#' + gradId + ')';
        gradDef = '<defs><linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="100%" y2="100%">'
            + '<stop offset="0%" stop-color="' + g[0] + '"/>'
            + '<stop offset="50%" stop-color="' + g[1] + '"/>'
            + '<stop offset="100%" stop-color="' + g[2] + '"/>'
            + '</linearGradient></defs>';
    }
    var fw = frameCfg.width;
    var frameMarkup = '<rect x="' + (fw / 2) + '" y="' + (fw / 2) + '" width="' + (BADGE_ICON_VIEWBOX - fw) + '" height="' + (BADGE_ICON_VIEWBOX - fw) + '" fill="none" stroke="' + frameStroke + '" stroke-width="' + fw + '"/>';

    var sparkleMarkup = BuildSparkleMarkup(BADGE_TIER_SPARKLES[tier] || 0, frameCfg.color || catCfg.mythicGradient[2]);

    return '<svg class="badge-icon-svg" viewBox="0 0 ' + BADGE_ICON_VIEWBOX + ' ' + BADGE_ICON_VIEWBOX + '" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">'
        + gradDef + shapeMarkup + frameMarkup + sparkleMarkup
        + '</svg>';
}
window.GenerateBadgeIconSVG = GenerateBadgeIconSVG;

// ----------------------------------------------------------------------------
// Lazy-mount dos ícones (IntersectionObserver): com até 333 emblemas na
// mesma tela rolável, gerar e inserir todos os SVGs de uma vez ao abrir o
// modal seria trabalho desperdiçado pro que nunca chega a rolar até a tela —
// sensível principalmente em celular. Cada .badge-slot-icon-wrap só ganha seu
// <svg> quando entra (ou está perto de entrar, rootMargin 200px) na área
// visível; o resultado fica em cache por id, então rolar pra cima e pra baixo
// de novo não regenera nada.
// ----------------------------------------------------------------------------
var g_badgeIconObserver = null;
function GetBadgeIconObserver() {
    if (g_badgeIconObserver) return g_badgeIconObserver;
    if (typeof IntersectionObserver === 'undefined') return null;
    g_badgeIconObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            g_badgeIconObserver.unobserve(entry.target);
            MountBadgeIconInto(entry.target);
        });
    }, { root: null, rootMargin: '200px 0px', threshold: 0.01 });
    return g_badgeIconObserver;
}
function MountBadgeIconInto(iconWrapEl) {
    var badgeId = iconWrapEl.getAttribute('data-badge-id');
    var badge = g_badgesState.badgesById[badgeId];
    if (!badge) return;
    var svgMarkup = g_badgesState.iconCache[badgeId];
    if (!svgMarkup) {
        svgMarkup = GenerateBadgeIconSVG(badge);
        g_badgesState.iconCache[badgeId] = svgMarkup;
    }
    iconWrapEl.innerHTML = svgMarkup;
}

// ----------------------------------------------------------------------------
// Texto do requisito (emblema bloqueado) — decisão deliberada da tarefa:
// MOSTRAR o requisito ("Reach level 50") em vez de escondê-lo, porque motiva
// progressão em vez de só frustrar com um "?" — diferente do NOME, que já
// aparece na grade mesmo bloqueado (ver BuildBadgeSlotElement) porque os
// nomes temáticos fazem parte da graça de descobrir o emblema.
// ----------------------------------------------------------------------------
// Aceita number OU string numérica: colunas BIGINT do Postgres (ex.: o badge
// real "level 100 bilhão" citado na tarefa) voltam do driver pg como STRING,
// não number, pra não arriscar perder precisão em silêncio — confirmado
// testando contra o servidor real (ver TESTE no topo do arquivo). Sem esse
// parseFloat, "100000000000" (string) caía direto no fallback String(v) e
// aparecia cru na tela em vez de virar "100B".
function FormatBadgeRequirementValue(v) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    if (typeof v !== 'number' && (v == null || isNaN(n))) return String(v);
    if (n >= 1e9) return (n % 1e9 === 0 ? (n / 1e9) : (n / 1e9).toFixed(1)) + 'B';
    if (n >= 1e6) return (n % 1e6 === 0 ? (n / 1e6) : (n / 1e6).toFixed(1)) + 'M';
    if (n >= 1e3) return (n % 1e3 === 0 ? (n / 1e3) : (n / 1e3).toFixed(1)) + 'k';
    return String(n);
}
// Cobre os 4 requirementType numéricos genéricos (backend-architect) com frase
// própria, e o padrão level_time_*/full_game_time (gameplay-engineer, "quanto
// menor melhor" — ver isLowerBetter() em db.js) com uma frase paramétrica só
// baseada no nome do level, sem inventar texto. Os ~80 requirementType
// restantes (contadores nomeados de mecânicas específicas, tipo
// 'triple_jump_narrow_platform_count' ou 'rare_first_crown' — ver
// server/seed_badges.js) caem no fallback genérico DE PROPÓSITO: adivinhar uma
// frase natural pra cada nome de constante é trabalho de conteúdo de quem
// batizou aquele requisito, não uma inferência segura que este arquivo de UI
// deveria fazer sozinho.
function FormatBadgeRequirement(badge) {
    var vStr = FormatBadgeRequirementValue(badge.requirementValue);
    var reqType = badge.requirementType || '';
    switch (reqType) {
        case 'level': return 'Reach level ' + vStr + '.';
        case 'kills': return 'Defeat ' + vStr + ' enemies.';
        case 'lives': return 'Reach ' + vStr + ' lives.';
        case 'episode_items_complete': return 'Complete ' + vStr + (badge.requirementValue == 1 ? ' episode item.' : ' episode items.');
        case 'full_game_time': return 'Finish the full game in ' + vStr + ' seconds or less.';
        default:
            if (reqType.indexOf('level_time_') === 0) {
                var levelTag = reqType.replace('level_time_', '').toUpperCase();
                return 'Finish ' + levelTag + ' in ' + vStr + ' seconds or less.';
            }
            if (badge.requirementDescription) return badge.requirementDescription;
            return 'Reach the requirement (' + vStr + ') to unlock this badge.';
    }
}
window.FormatBadgeRequirement = FormatBadgeRequirement;

function FormatBadgeUnlockDate(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    try {
        return 'Unlocked ' + d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return 'Unlocked ' + d.getFullYear();
    }
}

// ----------------------------------------------------------------------------
// DADO MOCK — só pra testar a UI localmente enquanto 'get_badges' não existe
// de verdade no servidor (ver contrato no topo do arquivo). Nomes/descrições
// são placeholders inventados aqui SÓ pra exercitar a UI (mostrar nome
// temático + descrição + requisito de verdade na tela) — o conteúdo final dos
// 333 emblemas é responsabilidade de quem definir o conteúdo real, não desta
// função. requirementValue escala de 5 até 100 bilhões dentro de cada
// categoria só pra exercitar FormatBadgeRequirementValue() nos dois extremos
// (o mesmo par de exemplo citado na tarefa).
// ----------------------------------------------------------------------------
var MOCK_BADGE_NAME_PARTS = {
    evolucao_assombrada: { first: 'First Flicker', last: 'Apex Wraith', mid: ['Faint Glow', 'Restless Shade', 'Spectral Bloom', 'Echoing Form', 'Wandering Mist', 'Hollow Ascent', 'Veil Walker', 'Ethereal Shift', 'Ghostlight', 'Nebulous Rise', 'Second Skin', 'Fading Boundary'] },
    combate_espiritual: { first: 'First Blood', last: 'Reaper’s Verdict', mid: ['Bruiser', 'Blade Initiate', 'Riposte', 'Iron Will', 'Berserker Streak', 'Last Stand', 'Executioner', 'Warpath', 'Bloodletter', 'Merciless', 'Juggernaut', 'Death Toll'] },
    exploracao: { first: 'Wandering Footsteps', last: 'World’s Edge', mid: ['Trailblazer', 'Map Scribbler', 'Horizon Chaser', 'Uncharted', 'Deep Wilds', 'Old Roads', 'Compass Bearer', 'Far Reaches', 'Lost & Found', 'Windswept', 'Beyond the Fog', 'Cartographer'] },
    acumulador_do_alem: { first: 'Pocket Change', last: 'Hoarder’s Vault', mid: ['Trinket Hunter', 'Shiny Things', 'Pack Rat', 'Loot Goblin', 'Treasury', 'Full Coffers', 'Rare Find', 'Collector’s Eye', 'Gilded Stash', 'Vault Keeper', 'Ledger of Gold', 'Overflowing Bag'] },
    acrobacias: { first: 'First Hop', last: 'Gravity’s Fool', mid: ['Wall Runner', 'Chain Jumper', 'Air Time', 'No Ground Rule', 'Momentum', 'Featherfall', 'Rebound', 'Flip Streak', 'Dash Master', 'Zero-G Habit', 'Perfect Landing', 'Freefall Fanatic'] },
    segredos: { first: 'Whispers', last: 'The Unseen Truth', mid: ['Hidden Door', 'Between the Lines', 'Odd Symbol', 'Quiet Room', 'False Wall', 'Off the Map', 'Second Look', 'Buried Note', 'Backwards Clock', 'Unmarked Grave', 'Static in the Dark', 'Almost Nothing'] }
};
// requirementType usa o mesmo conjunto REAL confirmado em server/seed_badges.js
// pros 4 tipos genéricos (não os nomes fictícios que eu tinha chutado antes de
// ler o backend) — só pra exercitar FormatBadgeRequirement() com dado plausível.
var MOCK_REQ_TYPE_BY_CATEGORY = {
    evolucao_assombrada: 'level', combate_espiritual: 'kills', exploracao: 'lives',
    acumulador_do_alem: 'episode_items_complete', acrobacias: 'level', segredos: 'kills'
};
function MockRequirementValueForRank(i, n) {
    var t = n > 1 ? i / (n - 1) : 1;
    return Math.round(5 * Math.pow(100000000000 / 5, t));
}
function MockUnlockedDate(i) {
    return new Date(2026, 5, 1 + ((i * 3) % 90)).toISOString();
}
function BuildMockBadgeData() {
    var counts = { evolucao_assombrada: 56, combate_espiritual: 56, exploracao: 56, acumulador_do_alem: 55, acrobacias: 55, segredos: 55 }; // soma = 333
    var badges = [];
    var unlocked = [];
    var idCounter = 1;
    BADGE_CATEGORY_ORDER.forEach(function (catKey) {
        var n = counts[catKey];
        var names = MOCK_BADGE_NAME_PARTS[catKey];
        for (var i = 0; i < n; i++) {
            var name;
            if (i === 0) name = names.first;
            else if (i === n - 1) name = names.last;
            else {
                var base = names.mid[i % names.mid.length];
                var lap = Math.floor(i / names.mid.length);
                name = lap > 0 ? (base + ' ' + (lap + 1)) : base;
            }
            var badge = {
                id: catKey + '_' + idCounter,
                category: catKey,
                name: name,
                description: 'Mock description for local UI testing — ' + name + '.',
                requirementType: MOCK_REQ_TYPE_BY_CATEGORY[catKey],
                requirementValue: MockRequirementValueForRank(i, n),
                sortOrder: i
            };
            badges.push(badge);
            idCounter++;
            if (i < Math.round(n * 0.3)) {
                unlocked.push({ badgeId: badge.id, unlockedAt: MockUnlockedDate(i) });
            }
        }
    });
    return { badges: badges, unlocked: unlocked };
}

// ----------------------------------------------------------------------------
// Carregamento — tenta o servidor real primeiro, cai pro mock em qualquer
// caminho que não devolva dado de verdade (sem socket, timeout, erro, ou
// lista vazia). O timeout aqui é bem mais curto (8s) que o padrão de
// emitProfileRequest (15s) de propósito: se 'get_badges' ainda não existe no
// servidor, o socket.io nunca vai emitir nem sucesso nem erro — o único jeito
// de sair desse estado é o timeout, então não faz sentido fazer o jogador
// esperar 15s pra ver o aviso "mostrando dado de exemplo".
//
// Perfil de OUTRO jogador (01/09/2026, pedido do usuário: "ver as medalhas de
// outro jogador a partir do perfil dele"): se #myProfileModal estiver aberto
// em g_myProfileState.viewMode === 'other' (ver profile.js/
// OpenPlayerProfileModal), manda o email daquele jogador no payload
// ({ email: viewingEmail }) — o servidor então devolve o "unlocked" DAQUELE
// jogador (ver server/index.js get_badges, 01/09/2026: aceita email opcional,
// mesmo padrão de get_diary_entries). Sem g_myProfileState em modo 'other'
// (ou o objeto nem existindo — badges.js não depende de profile.js pra
// carregar), o payload fica {} como sempre, e o servidor resolve pra própria
// sessão — retrocompatível.
//
// Proteção contra resposta atrasada "grudando" no jogador errado (mesma
// classe de bug já achada e corrigida hoje na busca de amigos/perfil-de-
// outro-jogador, ver OpenPlayerProfileModal()/LoadDiaryEntries() em
// profile.js): captura QUEM foi pedido (requestedEmail) antes do emit: se o
// jogador fechar o modal de emblemas e reabrir no PRÓPRIO perfil (ou navegar
// pra outro perfil) antes da resposta chegar, g_myProfileState já mudou por
// baixo — a resposta velha é descartada em vez de pisar no grid do perfil
// atual.
// ----------------------------------------------------------------------------
function GetBadgesTargetEmail() {
    if (window.g_myProfileState && window.g_myProfileState.viewMode === 'other' && window.g_myProfileState.viewingEmail) {
        return window.g_myProfileState.viewingEmail;
    }
    return null;
}

function LoadBadges() {
    var loadingEl = document.getElementById('badgesLoadingState');
    var errorEl = document.getElementById('badgesErrorState');
    var gridContainer = document.getElementById('badgesGridContainer');
    if (loadingEl) loadingEl.style.display = 'flex';
    if (errorEl) errorEl.style.display = 'none';
    if (gridContainer) gridContainer.innerHTML = '';

    var socket = window.NetworkState && window.NetworkState.socket;
    if (!socket) {
        RenderBadgesFromMock('No connection to the server — showing preview data.');
        return;
    }

    var requestedEmail = GetBadgesTargetEmail();
    var payload = requestedEmail ? { email: requestedEmail } : {};

    emitProfileRequest('get_badges', payload, 'badges_loaded', 'badges_error',
        function (data) {
            // Se o alvo mudou (modal fechado/reaberto noutro perfil, ou voltou pro
            // próprio via "← BACK TO MY PROFILE") desde que este request saiu, esta
            // resposta é de um jogador que não é mais o que está na tela — descarta.
            if (GetBadgesTargetEmail() !== requestedEmail) return;

            var badges = (data && Array.isArray(data.badges)) ? data.badges : [];
            var unlocked = (data && Array.isArray(data.unlocked)) ? data.unlocked : [];
            if (badges.length === 0) {
                RenderBadgesFromMock('Badge data not available yet from the server — showing preview data.');
                return;
            }
            if (loadingEl) loadingEl.style.display = 'none';
            if (errorEl) errorEl.style.display = 'none';
            RenderBadgeGrid(badges, unlocked);
        },
        function (err) {
            if (GetBadgesTargetEmail() !== requestedEmail) return;
            RenderBadgesFromMock((err && err.message ? (err.message + ' — ') : '') + 'Showing local preview data instead.');
        },
        8000
    );
}
window.LoadBadges = LoadBadges;

function RenderBadgesFromMock(noticeMsg) {
    var loadingEl = document.getElementById('badgesLoadingState');
    var errorEl = document.getElementById('badgesErrorState');
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
        errorEl.textContent = '⚠️ ' + noticeMsg;
        errorEl.style.display = 'block';
    }
    var mock = BuildMockBadgeData();
    RenderBadgeGrid(mock.badges, mock.unlocked);
}

// ----------------------------------------------------------------------------
// Render — agrupado por categoria (6 seções com cabeçalho, todas dentro do
// MESMO grid rolável, sem abas). Escolhido em vez de abas porque: (1) mesmo
// padrão já usado no resto de #myProfileModal (GALLERY/TIME CAPSULE/FRIENDS
// empilhados, sem aba nenhuma) — consistência de interação em vez de
// introduzir um mecanismo novo só pra badges; (2) rolar e ver o progresso das
// 6 categorias de uma vez é mais informativo que trocar de aba uma por uma;
// (3) 6 abas de largura variável (nomes em inglês diferentes) é mais frágil
// em 375px de largura do que uma lista vertical de seções, que empilha sem
// nenhum cálculo de layout especial.
// ----------------------------------------------------------------------------
function RenderBadgeGrid(badges, unlocked) {
    var container = document.getElementById('badgesGridContainer');
    if (!container) return;
    container.innerHTML = '';

    g_badgesState.badgesById = {};
    badges.forEach(function (b) { g_badgesState.badgesById[String(b.id)] = b; });

    var unlockedMap = {};
    (unlocked || []).forEach(function (u) {
        if (u && typeof u === 'object' && u.badgeId != null) {
            unlockedMap[String(u.badgeId)] = { unlockedAt: u.unlockedAt || null };
        } else if (u != null) {
            unlockedMap[String(u)] = { unlockedAt: null };
        }
    });
    g_badgesState.unlockedMap = unlockedMap;

    ComputeBadgeTiers(badges);

    var byCategory = {};
    badges.forEach(function (b) {
        var cat = b.category || 'segredos';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(b);
    });

    var totalUnlocked = 0;
    BADGE_CATEGORY_ORDER.forEach(function (catKey) {
        var list = byCategory[catKey];
        if (!list || !list.length) return;
        list.sort(function (a, b) { return a._rankIndex - b._rankIndex; });

        var catCfg = BADGE_CATEGORY_CONFIG[catKey];
        var unlockedInCat = 0;

        var section = document.createElement('div');
        section.className = 'badges-category-section';

        var header = document.createElement('div');
        header.className = 'badges-category-header badges-cat-' + catKey;
        var nameSpan = document.createElement('span');
        nameSpan.className = 'badges-category-name';
        nameSpan.textContent = catCfg.label;
        var progressSpan = document.createElement('span');
        progressSpan.className = 'badges-category-progress';
        header.appendChild(nameSpan);
        header.appendChild(progressSpan);
        section.appendChild(header);

        var grid = document.createElement('div');
        grid.className = 'badges-grid';
        list.forEach(function (badge) {
            var unlockedInfo = unlockedMap[String(badge.id)];
            var isUnlocked = !!unlockedInfo;
            if (isUnlocked) { unlockedInCat++; totalUnlocked++; }
            grid.appendChild(BuildBadgeSlotElement(badge, isUnlocked, unlockedInfo));
        });
        section.appendChild(grid);
        progressSpan.textContent = unlockedInCat + ' / ' + list.length;

        container.appendChild(section);
    });

    var progressEl = document.getElementById('badgesOverallProgress');
    if (progressEl) progressEl.textContent = totalUnlocked + ' / ' + badges.length + ' UNLOCKED';
}
window.RenderBadgeGrid = RenderBadgeGrid;

// Emblema bloqueado: filter (grayscale+brightness+opacity, aplicado via CSS
// em .badge-slot.locked .badge-icon-svg) em vez de esconder o SVG inteiro por
// trás de um "?" genérico — decisão documentada em css/style.css junto da
// regra. O NOME continua visível mesmo bloqueado (pedido explícito da
// tarefa: os nomes temáticos fazem parte da graça); descrição e data de
// desbloqueio só aparecem depois de desbloqueado, e o requisito (não a
// descrição) é o que aparece no detalhe de um bloqueado, pra motivar.
function BuildBadgeSlotElement(badge, isUnlocked, unlockedInfo) {
    var slot = document.createElement('div');
    slot.className = 'badge-slot ' + (isUnlocked ? 'unlocked' : 'locked');
    slot.setAttribute('data-badge-id', String(badge.id));
    slot.setAttribute('role', 'button');
    slot.setAttribute('tabindex', '0');

    var iconWrap = document.createElement('div');
    iconWrap.className = 'badge-slot-icon-wrap';
    iconWrap.setAttribute('data-badge-id', String(badge.id));
    slot.appendChild(iconWrap);

    var nameEl = document.createElement('div');
    nameEl.className = 'badge-slot-name';
    nameEl.textContent = badge.name || '???';
    slot.appendChild(nameEl);

    function openDetail() { ShowBadgeDetail(badge, isUnlocked ? unlockedInfo : null); }
    // click cobre mouse E toque (não depende de :hover — roda idêntico no
    // mobile 100% touch, mesma lição já documentada em friends.js/profile.js
    // pros botões ADICIONAR/AMPLIAR). Enter/Espaço cobrem teclado (role="button").
    slot.addEventListener('click', openDetail);
    slot.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(); }
    });

    var observer = GetBadgeIconObserver();
    if (observer) observer.observe(iconWrap); else MountBadgeIconInto(iconWrap);

    return slot;
}

// ----------------------------------------------------------------------------
// Detalhe do emblema — overlay próprio (mesmo padrão de #galleryLightbox em
// profile.js), z-index acima até de #badgesModal. Nunca interpola
// nome/descrição de badge em innerHTML: sempre via textContent, mesmo esses
// campos vindo do banco (não input direto de jogador) — só disciplina
// defensiva, sem custo real.
// ----------------------------------------------------------------------------
function ShowBadgeDetail(badge, unlockedInfo) {
    if (!badge) return;
    var isUnlocked = !!unlockedInfo;
    var overlay = document.getElementById('badgeDetailOverlay');
    var iconWrap = document.getElementById('badgeDetailIconWrap');
    var nameEl = document.getElementById('badgeDetailName');
    var catEl = document.getElementById('badgeDetailCategory');
    var textEl = document.getElementById('badgeDetailText');
    var metaEl = document.getElementById('badgeDetailMeta');
    if (!overlay || !iconWrap || !nameEl || !catEl || !textEl || !metaEl) return;

    var svgMarkup = g_badgesState.iconCache[String(badge.id)] || GenerateBadgeIconSVG(badge);
    iconWrap.innerHTML = svgMarkup;
    iconWrap.className = 'badge-detail-icon-wrap' + (isUnlocked ? ' unlocked' : ' locked');

    nameEl.textContent = badge.name || '???';
    var catCfg = BADGE_CATEGORY_CONFIG[badge.category] || BADGE_CATEGORY_CONFIG.segredos;
    catEl.textContent = catCfg.label + ' • ' + (BADGE_TIER_LABEL[badge._tier] || 'Bronze');
    catEl.className = 'badge-detail-category badges-cat-' + (badge.category || 'segredos');

    metaEl.innerHTML = '';
    if (isUnlocked) {
        textEl.textContent = badge.description || 'No description available.';
        var tag = document.createElement('span');
        tag.className = 'badge-detail-tag unlocked';
        tag.textContent = '✓ UNLOCKED';
        metaEl.appendChild(tag);
        if (unlockedInfo && unlockedInfo.unlockedAt) {
            var dateEl = document.createElement('span');
            dateEl.className = 'badge-detail-date';
            dateEl.textContent = FormatBadgeUnlockDate(unlockedInfo.unlockedAt);
            metaEl.appendChild(dateEl);
        }
    } else {
        textEl.textContent = FormatBadgeRequirement(badge);
        var lockTag = document.createElement('span');
        lockTag.className = 'badge-detail-tag locked';
        lockTag.textContent = '🔒 LOCKED';
        metaEl.appendChild(lockTag);
    }

    overlay.style.display = 'flex';
}
window.ShowBadgeDetail = ShowBadgeDetail;

function CloseBadgeDetail() {
    var overlay = document.getElementById('badgeDetailOverlay');
    if (overlay) overlay.style.display = 'none';
}
window.CloseBadgeDetail = CloseBadgeDetail;

// ----------------------------------------------------------------------------
// Abrir / Fechar o modal principal
// ----------------------------------------------------------------------------
function OpenBadgesModal() {
    var modal = document.getElementById('badgesModal');
    if (!modal) return;
    modal.style.display = 'flex';
    LoadBadges();
}
window.OpenBadgesModal = OpenBadgesModal;

function CloseBadgesModal() {
    var modal = document.getElementById('badgesModal');
    if (modal) modal.style.display = 'none';
    CloseBadgeDetail();
}
window.CloseBadgesModal = CloseBadgesModal;

document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    var detailOverlay = document.getElementById('badgeDetailOverlay');
    if (detailOverlay && detailOverlay.style.display !== 'none') { CloseBadgeDetail(); return; }
    var modal = document.getElementById('badgesModal');
    if (modal && modal.style.display !== 'none') CloseBadgesModal();
});
