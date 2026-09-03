// tools/build-overworld-grid.js
//
// Regeneracao do pipeline OSM -> grid do overworld isometrico (Niteroi), pedida em
// 03/09/2026 depois que o Estagio 5 documentou (commit 73e0bf4) que a malha viaria
// real tinha 151 componentes 4-conectados desconectados no chunk 0_0, deixando so um
// bolsao de ~19 celulas andaveis perto da torre - por isso o mapa parecia "quase em
// branco" ao redor do spawn (nao era bug de fetch, ver diagnostico no relatorio).
//
// Ferramenta de BUILD TIME apenas (roda em Node, uma vez, fora do runtime do jogo -
// ver danger ghost/.claude/skills/osm-to-game-grid/SKILL.md). Nao tem dependencia de
// npm nenhuma (usa fetch nativo do Node >=18); nada daqui e importado por js/game/.
//
// Uso: node tools/build-overworld-grid.js
//   OW_CACHE_DIR=<dir>   opcional, onde cachear a resposta crua do Overpass entre
//                         iteracoes (default: tools/_overpass_cache, git-ignorado).
//
// ============================ CAUSA RAIZ DA FRAGMENTACAO ============================
// O pipeline original (ver _meta.classification_method em cada chunk) classificava
// cada celula como 'street' se seu CENTRO estivesse a <= halfwidth_by_highway_type
// metros de algum way. Com tile=10m e halfwidth residencial=5m (buffer = 1 tile de
// diametro), uma rua correndo em diagonal pelo grid produz uma "escada" onde celulas
// consecutivas da mesma rua so se tocam por uma QUINA (8-conectividade), nunca por uma
// ARESTA (4-conectividade) - e o jogo So anda em 4 direcoes (ver tryMove() em
// overworld.js, sem diagonal). Confirmado experimentalmente antes de mexer em
// qualquer parametro: recalculando os componentes do grid ATUAL com adjacencia 8
// (diagonal permitida) o maior componente do chunk 0_0 salta de 233 para 794 celulas
// (de 954 andaveis totais) e o numero de componentes cai de 151 para 24 - ou seja,
// a fragmentacao real e overwhelmingly esse efeito de "toque so pela quina", nao ruas
// genuinamente desconectadas no mundo real.
//
// A correcao tem DUAS partes, nenhuma delas inventa dado geografico:
//   1) Halfwidths ligeiramente maiores (fator ~1.3x, hierarquia preservada) - reduz
//      a frequencia de gaps reais entre ways que deveriam se tocar mas o
//      digitalizador do OSM nao snapou exatamente no mesmo no.
//   2) "Fechamento de diagonal" (closeDiagonalGaps): pos-processamento deterministico
//      e padrao em rasterizacao de rede viaria (o equivalente rook-vs-queen
//      connectivity closing usado em GIS) - para todo par de celulas 'street'
//      diagonalmente adjacentes cujas DUAS celulas-ponte ortogonais sejam 'block',
//      promove a celula-ponte GEOMETRICAMENTE MAIS PROXIMA de algum way real (nao
//      uma escolha arbitraria) para 'street'. Roda em ponto-fixo (repete ate nao
//      sobrar nenhum par so-diagonal) para fechar cadeias tambem.
//
// Isto e "ajustar a classificacao de rua" no sentido pedido pelo usuario - nenhuma
// coordenada de way e inventada, so a regra de qual CELULA DE GRID vira 'street'
// muda, e sempre em celulas geometricamente proximas de uma rua real.
//
// ============================ GEOMETRIA PRESERVADA ============================
// Alem do grid raster (fill de colisao/chunking, inalterado em formato), cada chunk
// agora tambem grava `streetWays`: um array com a polilinha ORIGINAL de cada OSM way
// (em col/row FRACIONARIO do grid local, sem arredondar para tile inteiro), seu nome
// (tags.name) e tipo de via. E o dado que a query Overpass sempre devolveu via
// `out geom` mas o pipeline antigo descartava depois de rasterizar - so sobrava uma
// lista solta de nomes em _meta.extraction_stats.named_streets_found, sem geometria
// nem associacao por segmento. Ver js/game/overworld.js (buildStreetPathsForChunk)
// para como isso vira curvas desenhadas de verdade.

const fs = require('fs');
const path = require('path');

const CACHE_DIR = process.env.OW_CACHE_DIR || path.join(__dirname, '_overpass_cache');
fs.mkdirSync(CACHE_DIR, { recursive: true });

const OUT_DIR = path.join(__dirname, '..', 'data', 'overworld', 'chunks');

// ---------------------------------------------------------------------------------
// Mesma origem/escala documentada em cada chunk hoje (data/overworld/chunks/*.json,
// _meta.projection e _meta.real_world_reference) - REUTILIZADA tal e qual, nao
// reinventada, para que pois.json e o manifest existentes continuem validos.
const TILE_SIZE_M = 10;
const HALF_EXTENT_TILES = 42;
const DIM = 85;
const REF_LAT_FOR_SCALE = -22.90478355;
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LON = 102542.7425;

const CHUNKS = [
    {
        chunkX: 0, chunkY: 0, file: '0_0.json',
        originGlobalCol: 0, originGlobalRow: 0,
        neighbourhood: 'Santa Rosa',
        queryLat: -22.904479806248524, queryLon: -43.088103756280866,
        isCityOrigin: true,
    },
    {
        chunkX: 1, chunkY: 0, file: '1_0.json',
        originGlobalCol: 85, originGlobalRow: 0,
        neighbourhood: 'Viradouro',
        queryLat: -22.904479806248524, queryLon: -43.07981452996141,
    },
    {
        chunkX: 0, chunkY: 1, file: '0_1.json',
        originGlobalCol: 0, originGlobalRow: 85,
        neighbourhood: 'São Francisco',
        queryLat: -22.912115451235948, queryLon: -43.088103756280866,
    },
];

// Halfwidths (metros) - ~1.3x os valores originais (motorway9->11, residential5->6.5,
// etc.), hierarquia relativa preservada. Ver nota de causa-raiz acima: isto sozinho
// NAO garante 4-conectividade (exigiria >=7.07m = 10*sqrt(2)/2 ate para a via mais
// fina, o que infla footway/service de forma irreal); e o closeDiagonalGaps() que
// garante a conectividade, isto aqui so reduz gaps reais entre ways mal-encostados.
const HALFWIDTH_M = {
    motorway: 11, trunk: 10, primary: 9, secondary: 8, tertiary: 7.5,
    unclassified: 6.5, residential: 6.5, living_street: 6, service: 5,
    pedestrian: 5.5, footway: 4, path: 3.5, steps: 3, track: 4, cycleway: 4,
};
const EXCLUDED_HIGHWAY = new Set([
    'abandoned', 'bus_guideway', 'construction', 'escape', 'platform', 'proposed', 'raceway', 'razed',
]);

const USER_AGENT = 'DangerGhost-OverworldGridBuilder/1.1 (contact: becotlgd@gmail.com)';

function log(...args) { console.log('[build-overworld-grid]', ...args); }

async function fetchOverpass(chunk) {
    const key = chunk.chunkX + '_' + chunk.chunkY;
    const cacheFile = path.join(CACHE_DIR, key + '.raw.json');
    if (fs.existsSync(cacheFile)) {
        log(key, '- usando resposta Overpass cacheada em', cacheFile);
        return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    }
    const query = '[out:json][timeout:90][maxsize:50000000];way["highway"](around:600,' +
        chunk.queryLat + ',' + chunk.queryLon + ');out geom;';
    log(key, '- consultando Overpass API ao vivo (600m em torno de', chunk.queryLat + ',' + chunk.queryLon, ')');
    // Fair-use: API publica compartilhada (ver skill osm-to-game-grid §1) - espaca
    // requisicoes e faz backoff real em 429 (respeitando Retry-After quando presente)
    // em vez de martelar o servidor.
    const MAX_ATTEMPTS = 5;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const resp = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'User-Agent': USER_AGENT,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'data=' + encodeURIComponent(query),
        });
        if (resp.ok) {
            const json = await resp.json();
            fs.writeFileSync(cacheFile, JSON.stringify(json));
            log(key, '- resposta cacheada em', cacheFile, '(' + (json.elements || []).length + ' elementos)');
            return json;
        }
        if (resp.status === 429 || resp.status === 504) {
            const retryAfterHeader = resp.headers.get('retry-after');
            const waitS = retryAfterHeader ? parseInt(retryAfterHeader, 10) : (15 * attempt);
            log(key, '- Overpass respondeu ' + resp.status + ', tentativa ' + attempt + '/' + MAX_ATTEMPTS + ', esperando ' + waitS + 's...');
            await new Promise(function (r) { setTimeout(r, waitS * 1000); });
            continue;
        }
        throw new Error('Overpass fetch falhou (' + resp.status + ') para chunk ' + key);
    }
    throw new Error('Overpass fetch falhou apos ' + MAX_ATTEMPTS + ' tentativas (429/504 repetido) para chunk ' + key);
}

function project(lat, lon, originLat, originLon) {
    return {
        x: (lon - originLon) * M_PER_DEG_LON,
        y: (originLat - lat) * M_PER_DEG_LAT,
    };
}

function metersToGrid(x, y) {
    return {
        col: x / TILE_SIZE_M + HALF_EXTENT_TILES,
        row: y / TILE_SIZE_M + HALF_EXTENT_TILES,
    };
}

function ptSegDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    const cx = ax + t * dx, cy = ay + t * dy;
    return Math.hypot(px - cx, py - cy);
}

function extractWays(raw, chunk) {
    const ways = [];
    let skipped = 0;
    for (const el of raw.elements || []) {
        if (el.type !== 'way' || !el.tags || !el.tags.highway) continue;
        const hw = el.tags.highway;
        if (EXCLUDED_HIGHWAY.has(hw)) { skipped++; continue; }
        const halfwidthM = HALFWIDTH_M[hw];
        if (halfwidthM == null) { skipped++; continue; } // tipo de via desconhecido, nao classificado antes tambem
        if (!el.geometry || el.geometry.length < 2) { skipped++; continue; }
        const localPts = el.geometry.map(function (pt) { return project(pt.lat, pt.lon, chunk.queryLat, chunk.queryLon); });
        const gridPts = localPts.map(function (p) { return metersToGrid(p.x, p.y); });
        ways.push({
            osmId: el.id,
            name: el.tags.name || null,
            highway: hw,
            halfwidthM: halfwidthM,
            localPts: localPts,
            gridPts: gridPts,
        });
    }
    return { ways: ways, skipped: skipped, totalReturned: (raw.elements || []).length };
}

function rasterize(ways) {
    const rows = [];
    const dist = [];
    for (let r = 0; r < DIM; r++) {
        rows.push(new Array(DIM).fill('#'));
        dist.push(new Array(DIM).fill(Infinity));
    }
    for (let r = 0; r < DIM; r++) {
        const cy = (r - HALF_EXTENT_TILES) * TILE_SIZE_M;
        for (let c = 0; c < DIM; c++) {
            const cx = (c - HALF_EXTENT_TILES) * TILE_SIZE_M;
            let best = Infinity;
            let within = false;
            for (const w of ways) {
                const pts = w.localPts;
                for (let i = 0; i < pts.length - 1; i++) {
                    const a = pts[i], b = pts[i + 1];
                    const d = ptSegDist(cx, cy, a.x, a.y, b.x, b.y);
                    if (d < best) best = d;
                    if (d <= w.halfwidthM) within = true;
                }
            }
            dist[r][c] = best;
            if (within) rows[r][c] = '.';
        }
    }
    return { rows: rows, dist: dist };
}

// Fechamento de diagonal (ver nota de causa-raiz no topo do arquivo). Roda em
// ponto-fixo: uma promocao pode criar um novo par so-diagonal adjacente a ela, entao
// repete ate estabilizar. Retorna quantas celulas foram promovidas (so para log/QA).
function closeDiagonalGaps(rows, dist) {
    let totalPromoted = 0;
    let changed = true;
    let iterations = 0;
    while (changed) {
        changed = false;
        iterations++;
        for (let r = 0; r < DIM - 1; r++) {
            for (let c = 0; c < DIM - 1; c++) {
                // diagonal \ : (r,c) e (r+1,c+1) sao rua; pontes ortogonais = (r,c+1) e (r+1,c)
                if (rows[r][c] === '.' && rows[r + 1][c + 1] === '.') {
                    if (rows[r][c + 1] === '#' && rows[r + 1][c] === '#') {
                        promoteCloser([r, c + 1], [r + 1, c]);
                    }
                }
                // diagonal / : (r,c+1) e (r+1,c) sao rua; pontes ortogonais = (r,c) e (r+1,c+1)
                if (rows[r][c + 1] === '.' && rows[r + 1][c] === '.') {
                    if (rows[r][c] === '#' && rows[r + 1][c + 1] === '#') {
                        promoteCloser([r, c], [r + 1, c + 1]);
                    }
                }
            }
        }
        if (iterations > 50) { throw new Error('closeDiagonalGaps nao convergiu em 50 iteracoes - algo errado'); }
    }
    function promoteCloser(a, b) {
        const da = dist[a[0]][a[1]];
        const db = dist[b[0]][b[1]];
        const winner = da <= db ? a : b;
        if (rows[winner[0]][winner[1]] !== '.') {
            rows[winner[0]][winner[1]] = '.';
            totalPromoted++;
            changed = true;
        }
    }
    return { promoted: totalPromoted, iterations: iterations };
}

// Componentes 4-conectados - so para QA/relatorio (nunca escrito no chunk final).
function components4(rows) {
    const visited = [];
    for (let r = 0; r < DIM; r++) visited.push(new Array(DIM).fill(false));
    const comps = [];
    for (let r = 0; r < DIM; r++) {
        for (let c = 0; c < DIM; c++) {
            if (rows[r][c] === '#' || visited[r][c]) continue;
            let size = 0;
            const cells = [];
            const queue = [[r, c]];
            visited[r][c] = true;
            while (queue.length) {
                const [rr, cc] = queue.pop();
                size++;
                cells.push([rr, cc]);
                const neigh = [[rr - 1, cc], [rr + 1, cc], [rr, cc - 1], [rr, cc + 1]];
                for (const [nr, nc] of neigh) {
                    if (nr < 0 || nr >= DIM || nc < 0 || nc >= DIM) continue;
                    if (visited[nr][nc] || rows[nr][nc] === '#') continue;
                    visited[nr][nc] = true;
                    queue.push([nr, nc]);
                }
            }
            comps.push({ size: size, cells: cells });
        }
    }
    comps.sort(function (a, b) { return b.size - a.size; });
    return comps;
}

// Procura, perto do centro original da torre, um footprint 3x3 totalmente fora de
// rua (todas as 9 celulas 'block' no grid ANTES do carve do landmark) com pelo menos
// 1 celula de borda encostando (4-adjacencia) numa celula 'street' que pertence ao
// maior componente conectado (a "porta"). Busca em anéis crescentes a partir do
// centro original, prefere o mais proximo.
function findTowerSpot(rows, origCenterRow, origCenterCol, bigComponentSet) {
    function isBlock(r, c) { return r >= 0 && r < DIM && c >= 0 && c < DIM && rows[r][c] === '#'; }
    function isBigStreet(r, c) {
        return r >= 0 && r < DIM && c >= 0 && c < DIM && rows[r][c] === '.' && bigComponentSet.has(r + '_' + c);
    }
    for (let radius = 0; radius <= 30; radius++) {
        const candidates = [];
        for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
                if (Math.max(Math.abs(dr), Math.abs(dc)) !== radius) continue; // so o anel deste raio
                candidates.push([origCenterRow + dr, origCenterCol + dc]);
            }
        }
        for (const [cr, cc] of candidates) {
            let allBlock = true;
            for (let r = cr - 1; r <= cr + 1 && allBlock; r++) {
                for (let c = cc - 1; c <= cc + 1 && allBlock; c++) {
                    if (!isBlock(r, c)) allBlock = false;
                }
            }
            if (!allBlock) continue;
            // procura porta: celula de borda do footprint com vizinho 4-direcional
            // fora do footprint que seja rua do componente grande.
            let door = null;
            for (let r = cr - 1; r <= cr + 1 && !door; r++) {
                for (let c = cc - 1; c <= cc + 1 && !door; c++) {
                    const neigh = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]];
                    for (const [nr, nc] of neigh) {
                        const insideFootprint = nr >= cr - 1 && nr <= cr + 1 && nc >= cc - 1 && nc <= cc + 1;
                        if (insideFootprint) continue;
                        if (isBigStreet(nr, nc)) { door = { footprintCell: [r, c], streetCell: [nr, nc] }; break; }
                    }
                    if (door) break;
                }
            }
            if (door) {
                return { centerRow: cr, centerCol: cc, radius: radius, door: door };
            }
        }
    }
    return null;
}

async function buildChunk(chunk) {
    const raw = await fetchOverpass(chunk);
    const extracted = extractWays(raw, chunk);
    const raster = rasterize(extracted.ways);
    log(chunk.file, '- ways=' + extracted.ways.length, 'skipped=' + extracted.skipped,
        '(fechamento de diagonal e conectividade rodam depois da reconciliacao de costura)');
    return {
        chunk: chunk,
        ways: extracted.ways,
        extraction: extracted,
        rows: raster.rows,
        dist: raster.dist,
    };
}

// ============================ Reconciliacao de costura ============================
// Cada chunk foi rasterizado isoladamente, contra so as ways da SUA PROPRIA consulta
// Overpass (raio 600m em torno do centro daquele chunk). Dois chunks vizinhos tem
// centros de consulta a 850m de distancia (85 tiles * 10m); com raio 600m cada, os
// dois circulos SE SOBREPOEM perto da borda compartilhada (600+600=1200m > 850m), entao
// uma rua real que cruza a fronteira normalmente aparece nas DUAS consultas - mas cada
// rasterizacao independente pode classificar as celulas bem na borda de forma um pouco
// diferente (arredondamento, ways que uma consulta capturou com folga e a outra so
// tangenciou), o que fragmenta o componente grande de um chunk do componente grande do
// vizinho mesmo depois do fechamento de diagonal (cada fechamento roda dentro de UM
// array 85x85 so, nunca atravessando pra outro).
//
// Correcao: pra cada par de chunks vizinhos, converte as ways de AMBOS pro mesmo
// espaco de coordenadas GLOBAL (mesma escala/origem, so um deslocamento em metros —
// ver chunkOriginGlobalCol/Row) e re-rasteriza uma faixa estreita de celulas dos DOIS
// lados da fronteira usando a UNIAO das ways dos dois chunks. Isto so pode ACRESCENTAR
// celulas 'street' (nunca remove uma classificacao existente), entao nao ha risco de
// piorar algo que ja estava correto - so preenche exatamente a lacuna que a
// rasterizacao isolada deixava. gridToScreen/isWalkable do jogo ja tratam col/row
// GLOBAL de forma uniforme entre chunks (ver overworld.js) - uma vez que as celulas
// adjacentes dos dois lados da fronteira sejam 'street', a travessia funciona sem
// nenhuma mudanca no runtime.
const SEAM_MARGIN_CELLS = 6;

function metersOffsetBetweenChunks(fromChunk, toChunk) {
    return {
        dx: (toChunk.originGlobalCol - fromChunk.originGlobalCol) * TILE_SIZE_M,
        dy: (toChunk.originGlobalRow - fromChunk.originGlobalRow) * TILE_SIZE_M,
    };
}

// Reclassifica uma unica celula (localRow,localCol) de `target` contra a uniao das
// ways de `target` (ja em metros locais de target) + ways de `other` (convertidas pra
// metros locais de target via offset fixo). So promove pra 'street' (nunca rebaixa).
function reclassifyCellWithUnion(targetRows, targetDist, localRow, localCol, targetWays, otherWays, offsetToTarget) {
    if (targetRows[localRow][localCol] === '.') return false; // ja e rua, nada a fazer
    const cx = (localCol - HALF_EXTENT_TILES) * TILE_SIZE_M;
    const cy = (localRow - HALF_EXTENT_TILES) * TILE_SIZE_M;
    let best = targetDist[localRow][localCol];
    let within = false;
    for (const w of otherWays) {
        const pts = w.localPts;
        for (let i = 0; i < pts.length - 1; i++) {
            const a = { x: pts[i].x + offsetToTarget.dx, y: pts[i].y + offsetToTarget.dy };
            const b = { x: pts[i + 1].x + offsetToTarget.dx, y: pts[i + 1].y + offsetToTarget.dy };
            const d = ptSegDist(cx, cy, a.x, a.y, b.x, b.y);
            if (d < best) best = d;
            if (d <= w.halfwidthM) within = true;
        }
    }
    targetDist[localRow][localCol] = best;
    if (within) { targetRows[localRow][localCol] = '.'; return true; }
    return false;
}

function reconcileSeam(resA, resB, axis) {
    // axis 'col': A e B compartilham a fronteira leste(A)/oeste(B) - A.col84 <-> B.col0
    // axis 'row': A e B compartilham a fronteira sul(A)/norte(B)  - A.row84 <-> B.row0
    const offsetAtoB = metersOffsetBetweenChunks(resA.chunk, resB.chunk);
    const offsetBtoA = metersOffsetBetweenChunks(resB.chunk, resA.chunk);
    let promotedA = 0, promotedB = 0;
    const span = axis === 'col' ? DIM : DIM; // ambos eixos varrem as 85 linhas/colunas da fronteira
    for (let i = 0; i < span; i++) {
        for (let m = 0; m < SEAM_MARGIN_CELLS; m++) {
            let rA, cA, rB, cB;
            if (axis === 'col') { rA = i; cA = DIM - 1 - m; rB = i; cB = m; }
            else { rA = DIM - 1 - m; cA = i; rB = m; cB = i; }
            if (reclassifyCellWithUnion(resA.rows, resA.dist, rA, cA, resA.ways, resB.ways, offsetBtoA)) promotedA++;
            if (reclassifyCellWithUnion(resB.rows, resB.dist, rB, cB, resB.ways, resA.ways, offsetAtoB)) promotedB++;
        }
    }
    log('reconcileSeam', resA.chunk.file, '<->', resB.chunk.file, '(' + axis + ')',
        '- promovidas:', resA.chunk.file, '+' + promotedA, '|', resB.chunk.file, '+' + promotedB);
    return { promotedA: promotedA, promotedB: promotedB };
}

function finalizeChunk(res) {
    const closeStats = closeDiagonalGaps(res.rows, res.dist);
    const comps = components4(res.rows);
    const streetCells = comps.reduce(function (sum, c) { return sum + c.size; }, 0);
    res.closeStats = closeStats;
    res.components = comps;
    log(res.chunk.file, '- FINAL street_cells=' + streetCells, 'components=' + comps.length,
        'maior_componente=' + (comps[0] ? comps[0].size : 0),
        'promovidas_por_fechamento=' + closeStats.promoted, '(' + closeStats.iterations + ' iteracoes)');
}

function buildStreetWaysOutput(ways) {
    // Round para 3 casas decimais de tile (~3cm de precisao em 10m/tile) - geometria
    // de verdade preservada, so sem casas decimais inuteis inflando o arquivo.
    return ways.map(function (w) {
        return {
            osmId: w.osmId,
            name: w.name,
            highway: w.highway,
            points: w.gridPts.map(function (p) { return [round3(p.col), round3(p.row)]; }),
        };
    });
}
function round3(n) { return Math.round(n * 1000) / 1000; }

async function main() {
    const results = {};
    for (const chunk of CHUNKS) {
        results[chunk.chunkX + '_' + chunk.chunkY] = await buildChunk(chunk);
        await new Promise(function (r) { setTimeout(r, 5000); }); // espaça requisições mesmo com cache parcial
    }

    // ---- reconcilia as 2 costuras (0_0<->1_0 leste-oeste, 0_0<->0_1 norte-sul) ----
    // ANTES do fechamento de diagonal final, pra qualquer celula de fronteira nova
    // (promovida pela uniao de ways) tambem participar do fechamento dentro do seu
    // proprio chunk.
    reconcileSeam(results['0_0'], results['1_0'], 'col');
    reconcileSeam(results['0_0'], results['0_1'], 'row');

    // ---- fechamento de diagonal + componentes, agora que a costura foi reconciliada ----
    for (const chunk of CHUNKS) {
        finalizeChunk(results[chunk.chunkX + '_' + chunk.chunkY]);
    }

    // ---- reposiciona a torre (so existe em chunk 0_0) ----
    const r00 = results['0_0'];
    const bigComp = r00.components[0];
    const bigSet = new Set(bigComp.cells.map(function (rc) { return rc[0] + '_' + rc[1]; }));
    const ORIG_TOWER_ROW = 42, ORIG_TOWER_COL = 42; // globalRow/globalCol atuais em pois.json (chunk 0_0 origin = 0,0)
    const spot = findTowerSpot(r00.rows, ORIG_TOWER_ROW, ORIG_TOWER_COL, bigSet);
    if (!spot) throw new Error('Nao achei posicao valida pra torre em ate 30 aneis do centro original - aumentar busca.');
    log('Nova posicao da torre: row=' + spot.centerRow + ' col=' + spot.centerCol +
        ' (raio ' + spot.radius + ' celulas do centro original), porta em',
        JSON.stringify(spot.door));

    // Carve do footprint 3x3 da torre como 'L' (so agora, DEPOIS do fechamento de
    // diagonal e da escolha de posicao - mesma ordem semantica do pipeline antigo:
    // landmark sobrescreve street/block por cima da classificacao final).
    for (let r = spot.centerRow - 1; r <= spot.centerRow + 1; r++) {
        for (let c = spot.centerCol - 1; c <= spot.centerCol + 1; c++) {
            r00.rows[r][c] = 'L';
        }
    }

    // ---- grava os 3 chunks ----
    const nowIso = new Date().toISOString();
    for (const chunk of CHUNKS) {
        const key = chunk.chunkX + '_' + chunk.chunkY;
        const res = results[key];
        const outPath = path.join(OUT_DIR, chunk.file);
        const existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
        const meta = existing._meta;

        meta.generated_at_utc = nowIso;
        meta.classification_method.street = 'A cell is \'street\' if its center lies within halfwidth_by_highway_type meters of some OSM way tagged highway=*, measured as point-to-segment distance on the projected polyline (halfwidths per tools/build-overworld-grid.js HALFWIDTH_M, ~1.3x the original pass), THEN a deterministic diagonal-gap-closing pass (closeDiagonalGaps) promotes the orthogonal bridge cell closer to a real way wherever two street cells only touched corner-to-corner - see the root-cause note at the top of tools/build-overworld-grid.js. Regenerated ' + nowIso + ' after the Estagio 5 finding of 151 disconnected 4-connected components (only 19 walkable cells near the tower).';
        meta.classification_method.connectivity_closing_pass = {
            note: 'Diagonal-only-adjacent street cells (8-connected but not 4-connected, the only movement the game allows) get bridged by promoting whichever orthogonal neighbor cell is geometrically closest to a real OSM way. Runs to a fixed point (no more corner-only touches remain).',
            cells_promoted: res.closeStats.promoted,
            iterations_to_converge: res.closeStats.iterations,
        };
        meta.extraction_stats.overpass_elements_returned = res.extraction.totalReturned;
        meta.extraction_stats.highway_ways_rasterized = res.ways.length;
        meta.extraction_stats.highway_ways_skipped = res.extraction.skipped;
        const cellCounts = { street: 0, block: 0, landmark: 0 };
        for (const row of res.rows) for (const ch of row) cellCounts[ch === '.' ? 'street' : (ch === 'L' ? 'landmark' : 'block')]++;
        meta.extraction_stats.grid_cell_counts = cellCounts;
        meta.extraction_stats.connectivity_after_regen = {
            components_4_connected: res.components.length,
            largest_component_cells: res.components[0] ? res.components[0].size : 0,
            largest_component_share_of_street_cells: res.components[0]
                ? Math.round((res.components[0].size / Math.max(1, cellCounts.street + cellCounts.landmark)) * 1000) / 1000
                : 0,
        };
        meta.caveats = (meta.caveats || []).concat([
            'Regenerado em ' + nowIso + ': halfwidths aumentados (~1.3x) + fechamento de gap diagonal (ver tools/build-overworld-grid.js) para eliminar fragmentacao 4-conectada. Isto muda QUAIS celulas sao rua vs quarteirao perto de bordas antes ambiguas; nenhuma coordenada OSM foi inventada, so a regra de rasterizacao.',
        ]);
        if (key === '0_0') {
            meta.caveats.push('Torre (POI tower_rua_beltrao) recentrada em row=' + spot.centerRow + ' col=' + spot.centerCol +
                ' (era row=42 col=42) para ficar fora da malha viaria com uma porta adjacente a uma celula de rua do componente principal - ver docs/HANDOVER.md ou o relatorio da sessao de 03/09/2026 para o raciocinio completo.');
        }

        const out = {
            _meta: meta,
            grid: existing.grid,
            streetWays: buildStreetWaysOutput(res.ways),
        };
        out.grid.rows = res.rows.map(function (r) { return r.join(''); });
        fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
        log('Gravado', outPath);
    }

    fs.writeFileSync(path.join(CACHE_DIR, 'tower_spot.json'), JSON.stringify(spot, null, 2));
    log('Concluido. Nova posicao da torre salva em', path.join(CACHE_DIR, 'tower_spot.json'), '- atualizar data/overworld/pois.json manualmente.');
}

main().catch(function (err) { console.error(err); process.exit(1); });
