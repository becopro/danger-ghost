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
//
// ATUALIZAÇÃO 02/09/2026 (tarde) — simplificação visual + fantasma jogável real,
// pedido do usuário com referência de estilo (mapa AR escuro, ruas brancas sobre
// fundo preto, nome de rua flutuando). Três decisões de arquitetura tomadas aqui,
// documentadas porque mudam o contrato visual/de dados deste módulo:
//
// 1) PRÉDIOS DESATIVADOS, NÃO REMOVIDOS: `drawBlockTile()` continua existindo
//    (o PRNG determinístico por tile pode servir pra outra coisa depois — cor de
//    piso, densidade de encontro aleatório etc.), mas o laço de render() não a
//    chama mais e as células '#' nem entram no array `drawables` (ver loop de
//    varredura em render()). Só 'street' e 'L' (landmark) desenham algo agora.
//
// 2) NOME DE RUA POR CÉLULA — INVESTIGADO, NÃO EXISTE NO DADO ATUAL: conferido
//    `data/niteroi_overworld_grid.json` inteiro via script Node antes de escrever
//    qualquer código aqui. `_meta.extraction_stats.named_streets_found` é só uma
//    lista AGREGADA (nome → lista de osm_ids), sem NENHUM vínculo célula→nome no
//    `grid.rows` em si (cada célula só carrega '.', '#' ou 'L', nada de nome).
//    Também procurei por um cache da resposta bruta do Overpass (`tools/`,
//    `scripts/`, qualquer `*cache*`/`*overpass*` no repo) pra reabrir e associar
//    cada `way` nomeado às células que ele cobre, como a skill `osm-to-game-grid`
//    documenta — NÃO existe nenhum cache em disco; `_meta.data_source` só grava as
//    STRINGS das queries Overpass já executadas (reproduzíveis, mas exigiriam
//    rodar a API ao vivo de novo e escrever um script de rasterização de nome por
//    célula, um trabalho de pipeline de dados, não de renderer — fora do escopo
//    desta passada). Dado isso, a decisão foi pelo caminho honesto mínimo: mostrar
//    só o nome da rua da própria torre ("Rua Doutor Beltrão", fixo, perto dela —
//    ver `drawTowerStreetLabel()`). Os outros ~38 nomes de `named_streets_found`
//    ficam como PENDÊNCIA DOCUMENTADA: precisam de um novo passo de build (fora
//    deste arquivo) que re-consulte Overpass preservando os `way` geometrando cada
//    rua e rasterize um `streetName` por célula, do mesmo jeito que a
//    classificação walkable/blocked já faz hoje pro campo `street`/`block`.
//
// 3) SPRITE DO FANTASMA ATIVO REAPROVEITADO, NÃO É MARCADOR GENÉRICO: o próprio
//    jogador agora desenha `window.g_customPlayerGhostRight` — a MESMA referência
//    de imagem que `js/game/engine.js` usa pra desenhar o jogador no Episódio 1
//    (confirmado lendo engine.js ~linha 1186-1190: `isRightReady`/`curRight` usam
//    exatamente essa variável). Ela é populada por
//    `window.PlayAsGhost()`/`safeLoadGhostSprite()` em js/game/ghostdex_ui.js. Como
//    nem todo caminho de entrada passa por ali antes de chegar no overworld (login
//    automático/retomada de sessão em js/web2/auth.js seta só
//    `window.g_currentPlayerGhost`, sem carregar a imagem), este módulo tem um
//    fallback PRÓPRIO que carrega o mesmo arquivo pelo mesmo ID e com o mesmo
//    esquema de caminhos (`Ghosts/#<id>.png` etc.) — nunca inventa outro sprite,
//    só cobre a lacuna de carregamento. Ver `getSelfGhostImg()`/`loadGhostSpriteById()`.
//    PRA OUTROS JOGADORES (`window.OverworldOtherPlayers`): o payload de hoje
//    (evento `overworld_players_update`, `server/index.js`) é
//    `{email, name, avatarUrl, gridX, gridY}` — SEM nenhum campo dedicado de "qual
//    fantasma esse jogador está jogando" (conferido lendo o handler no servidor
//    linha a linha). O ID do fantasma ativo VAZA dentro do próprio `name` como
//    sufixo `(#ID)` — `js/game/ghostdex_ui.js:PlayAsGhost()` monta
//    `taggedName = baseName + ' (#' + ghostId + ')'` antes de emitir `join_game`,
//    e o servidor ecoa esse `name` de volta sem alterar. Este módulo usa esse
//    sufixo como heurística (`getOtherPlayerGhostImg()`) porque é dado real já
//    trafegando na rede, não um palpite — mas é um acoplamento frágil (nome de
//    exibição virando transporte de dado). LIMITAÇÃO DOCUMENTADA: se o backend
//    adicionar um campo `ghostId` de verdade ao payload, trocar pra ele e apagar o
//    regex. Quando o sufixo não existe/não bate (nome legado, jogador anônimo),
//    cai no marcador genérico antigo (`drawPlayerToken`) só pra esse jogador — não
//    inventa um sprite definitivo sem dado real.
// ============================================================================
//
// ATUALIZAÇÃO 02/09/2026 (Estágio 2 do plano de overworld expansível, arquivo
// crystalline-launching-goose.md) — POI orientado a dados. Substitui a antiga
// varredura de 'L' no grid (computeLandmarkBounds/isInsideLandmark/
// checkLandmarkEnter) por um novo arquivo `data/overworld/pois.json`, carregado
// em paralelo ao grid no boot (loadPois(), converge com loadGrid() em
// finalizeLoadIfReady()). Duas decisões que valem documentar:
//
// 1) window.OverworldTowerGridPos SEM MUDANÇA DE CONTRATO: continua sendo
//    {gridX, gridY} da torre, só que agora vem do POI cujo interaction.kind é
//    "episode_entry" (computePoiBounds()), em vez de escanear o grid procurando
//    'L'. Confirmado que os números batem exatamente com o que já existia
//    (globalCol=42/globalRow=42, footprint 3x3 -> mesmo minRow/maxRow/minCol/
//    maxCol que a varredura antiga encontrava) — quando este bloco foi escrito o
//    módulo ainda rodava em grid local 0-84; a migração pra coordenadas globais
//    de cidade é o Estágio 3, concluído depois (ver bloco de atualização mais
//    abaixo — S.playerCol/Row, isWalkable() e o loop de render() já leem/geram
//    coordenada global hoje). Consumido por
//    js/web2/game_core.js:549, js/game/ghostdex_ui.js:515 e js/game/engine.js
//    (spawn padrão e retorno do Episódio 1 na morte/vitória/porta manual) —
//    nenhum desses três arquivos precisou mudar.
//
// 2) DISPATCHER GENÉRICO POR interaction.kind: checkLandmarkEnter() (só sabia
//    checar a torre) virou checkPoiInteractions(), que avalia TODO POI com
//    triggerOn:"enter" a cada passo lógico e despacha pra
//    POI_INTERACTION_HANDLERS[interaction.kind]. Handler ausente pra um kind
//    não registrado = console.warn + no-op (testado ao vivo com um POI de
//    depuração temporário, tipo inexistente no registry — nunca lança erro,
//    forward-compat pra POIs futuros cujo handler ainda não foi escrito nesta
//    versão do cliente). footprint.widthTiles/heightTiles do POI substitui as
//    antigas constantes hardcoded TOWER_HW/TOWER_HH (removidas) em
//    drawTower()/drawTowerStreetLabel(); o texto flutuante da rua agora vem de
//    poi.visual.streetLabel (data-driven) em vez do literal 'Rua Doutor
//    Beltrão' — mesmo conteúdo, fonte diferente. TOWER_HEIGHT (extrusão em Z,
//    puramente visual) e o restante do item 2 da nota acima (nomes de rua por
//    CÉLULA ainda não existem no dado) continuam válidos, sem mudança.
// ============================================================================
//
// ATUALIZAÇÃO 03/09/2026 (Estágio 3 do plano crystalline-launching-goose.md) —
// migração pra coordenadas globais, ainda um chunk só. Deliberadamente invisível
// pro jogador (mesmo spawn, mesma torre, mesma câmera) — é realinhamento de
// contrato interno, não uma feature nova. Três decisões documentadas aqui:
//
// 1) GRID_URL trocado de 'data/niteroi_overworld_grid.json' (legado, Estágio 1)
//    pra 'data/overworld/chunks/0_0.json' (gerado no Estágio 4). Confirmado
//    byte-a-byte que `grid.rows` dos dois arquivos é idêntico — a única diferença
//    real é que o chunk carrega `_meta.grid.chunkOriginGlobalCol/Row` (0,0), que é
//    o dado que faltava pra este módulo saber onde o chunk carregado fica na
//    cidade inteira. O arquivo legado não foi apagado (fora de escopo deste
//    estágio; pode ficar como histórico/fallback de outro consumidor não
//    rastreado), só parou de ser lido por este módulo.
//
// 2) S.playerCol/playerRow (e toda variável derivada: playerDrawCol/Row,
//    playerPrevCol/Row) DEIXAM DE SER LOCAIS (0-84) e passam a representar
//    coordenada GLOBAL de tile na cidade inteira — mesmo espaço que pois.json já
//    usava desde o Estágio 2. Duas funções novas fazem a ponte entre esse espaço
//    global e o array local `S.rows` que continua sendo o único jeito de ler o
//    conteúdo de um chunk: globalToLocalCol/Row (global -> índice em S.rows) e
//    localToGlobalCol/Row (o inverso), ambas logo acima de isWalkable() — ver ali
//    pra detalhe. `isWalkable()` passou a receber coordenada GLOBAL e converter
//    internamente antes de indexar S.rows; o loop de culling em render() itera em
//    local (pra bater com os índices de S.rows) mas empurra pra `drawables` a
//    coordenada GLOBAL de cada tile (via localToGlobalCol/Row), pra ficar no MESMO
//    espaço que o jogador (S.playerDrawCol/Row) e os POIs (poi.globalCol/globalRow)
//    já usam em gridToScreen()/isInsidePoiFootprint() — sem essa unificação, a
//    projeção de tela e a checagem de footprint de POI ficariam comparando
//    coordenadas de dois sistemas diferentes assim que um segundo chunk (offset
//    != 0,0) entrasse em jogo no Estágio 5.
//
// 3) POR QUE ISSO NÃO MUDA NADA NA TELA: com um único chunk carregado, o chunk
//    (0,0), `chunkOriginGlobalCol/Row = 0,0` (ver manifest.json) — então
//    global = local + 0 em todo lugar, numericamente idêntico ao comportamento de
//    antes. O ganho deste estágio é só arquitetural: preparação pro Estágio 5
//    (streaming de múltiplos chunks, cada um com seu próprio offset != 0,0), que
//    depende de todo o pipeline col/row já tratar posição como global em vez de
//    reintroduzir a mesma migração sob pressão depois. `server/index.js` também
//    mudou (`OVERWORLD_GRID_MIN/MAX`, ver comentário lá) — bound provisório mais
//    largo, não a validação real por chunk (isso é Estágio 6, via manifest.json).
// ============================================================================
//
// ATUALIZAÇÃO 03/09/2026 (Estágio 5 do plano crystalline-launching-goose.md) —
// streaming de chunks sob demanda. Troca o único GRID_URL fixo por um sistema de
// cache de chunks carregados (S.loadedChunks, chave "chunkX_chunkY"), alimentado
// por data/overworld/manifest.json (novo MANIFEST_URL, primeiro fetch do boot).
// Quatro decisões documentadas aqui:
//
// 1) MANIFEST SUBSTITUI GRID_URL COMO FONTE DE "O QUE EXISTE": loadGrid()/GRID_URL
//    (Estágio 3, um chunk fixo) saem; loadManifest() lê manifest.json uma vez no
//    boot e monta S.manifestChunksByKey ("cx_cy" -> {file, originGlobalCol/Row,
//    ...}), o único lugar que sabe "quais chunks existem e onde buscar cada um".
//    S.loaded (gate de ActivateOverworld) agora depende de manifest+pois, NÃO mais
//    do grid em si — os chunks de tile passam a carregar sob demanda depois que o
//    overworld já está "pronto" (metadado pequeno primeiro, conteúdo pesado
//    depois, sob demanda — mesma filosofia de qualquer streaming de mundo aberto).
//
// 2) JANELA 3x3 SEMPRE MANTIDA = PREFETCH DIRECIONAL DE GRAÇA: updateChunkWindow()
//    roda a cada passo lógico bem-sucedido (tryMove()), não só quando o chunk atual
//    muda — recalcula chunkX/chunkY do jogador (Math.floor(globalCol/chunkDimTiles)),
//    garante que os 9 chunks da vizinhança (Chebyshev <=1) estejam carregados
//    (ensureChunkLoaded, no-op se já carregado/carregando) e descarrega da memória
//    tudo que caiu fora dessa janela. Isso já cobre o pedido explícito do plano de
//    "prefetch por direção" sem nenhuma lógica extra de "olhar pra frente": como o
//    jogador só anda 1 tile por passo (150ms) e a janela inclui TODOS os 8 vizinhos
//    do chunk atual o tempo todo (não só o vizinho na direção do movimento), o
//    chunk pro qual o jogador está indo já foi disparado pra carregar assim que ele
//    entrou no chunk ATUAL — ~85 passos (12,75s) de antecedência antes de cruzar a
//    próxima borda, tempo de sobra pra um fetch de ~23KB terminar. Mais robusto que
//    só pré-carregar na direção do movimento: também cobre mudança de direção ou
//    andar para trás, sem precisar re-disparar nada.
//
// 3) BURACO NO MAPA = BLOQUEADO, NUNCA UNDEFINED: isWalkable(globalCol, globalRow)
//    resolve (chunkX, chunkY) a partir da coordenada global, procura em
//    S.loadedChunks — chunk ausente (fora do manifesto OU ainda no meio do fetch OU
//    descartado por sair da janela) retorna false (bloqueado). Mesmo princípio já
//    valia no Estágio 3 (fora do único chunk = bloqueado); a diferença é que agora
//    "fora" pode significar tanto "fora da cidade gerada" quanto "dentro da cidade
//    mas ainda buscando os bytes" — o jogador nunca percebe a diferença, só não
//    consegue andar pra lá até o chunk resolver (ou nunca, se for um buraco real).
//
// 4) render() ITERA EM ESPAÇO GLOBAL DIRETO, SEM CLAMP A UM S.dim ÚNICO: o laço de
//    culling (antes limitado a [0, S.dim-1] de um único S.rows) agora varre o
//    retângulo de tiles GLOBAIS ao redor do jogador e, pra cada célula, resolve o
//    chunk dono via chunkXYForGlobal + S.loadedChunks, pulando silenciosamente
//    células cujo chunk não está carregado (mesmo "buraco" do item 3 — só não
//    desenha nada ali, sem erro). S.rows/S.dim/globalToLocalCol/Row/
//    localToGlobalCol/Row (Estágio 3) saem por completo — cada chunk carrega seu
//    próprio originGlobalCol/Row dentro do objeto guardado em S.loadedChunks, então
//    a conversão local<->global agora é por-chunk, não mais um único par global pro
//    módulo inteiro.
// ============================================================================

(function () {
    'use strict';

    // ---- Constantes de projeção (2:1 dimétrico, conforme a skill) ----------
    var TILE_W = 64;
    var TILE_H = 32;
    var HALF_W = TILE_W / 2;
    var HALF_H = TILE_H / 2;

    // ---- Estágio 1 (plano crystalline-launching-goose.md, seção 3) --------
    // Meia-vida do lerp exponencial da câmera, em segundos — não um fator fixo
    // por frame (senão o comportamento muda entre monitor 60Hz e 144Hz, ver
    // render()). 100ms escolhido por ser bem mais curto que o passo lógico
    // (S.stepIntervalMs = 150ms): câmera "pega" o jogador rápido o bastante pra
    // não parecer atrasada, mas ainda absorve qualquer aresta de velocidade.
    var CAMERA_HALF_LIFE_S = 0.1;
    var CAMERA_LERP_K = Math.pow(0.5, 1 / CAMERA_HALF_LIFE_S); // k tal que k^CAMERA_HALF_LIFE_S = 0.5

    // Estágio 5 do plano (streaming de chunks) — substitui o GRID_URL fixo do Estágio 3
    // ('data/overworld/chunks/0_0.json', um chunk só) por um fetch de metadado primeiro:
    // manifest.json lista todo chunk que existe hoje (0_0, 1_0, 0_1 — ver
    // data/overworld/manifest.json) + a dimensão compartilhada (chunk_dim_tiles). Os
    // arquivos de chunk em si (data/overworld/chunks/{chunkX}_{chunkY}.json) só são
    // buscados sob demanda depois, via ensureChunkLoaded() — ver bloco de atualização
    // 03/09/2026 (Estágio 5) no topo do arquivo.
    var MANIFEST_URL = 'data/overworld/manifest.json';
    // Estágio 2 do plano de overworld expansível (POI data-driven) — ver
    // C:\Users\Klara\.claude\plans\crystalline-launching-goose.md §4. Carregado em
    // paralelo ao manifesto no boot (loadPois(), abaixo de loadManifest()); os dois
    // precisam terminar antes do overworld ser considerado "pronto" — ver
    // finalizeLoadIfReady(). pois.json continua um arquivo ÚNICO (não por chunk, item 5
    // do pedido do Estágio 5) — não muda neste estágio.
    var POI_URL = 'data/overworld/pois.json';

    // ---- Estado interno (fechado neste módulo — nada aqui vaza pra window
    // além dos 4 pontos de contrato pedidos) --------------------------------
    var S = {
        // ---- Estágio 5 (streaming de chunks) -------------------------------
        manifest: null,           // data/overworld/manifest.json cru (loadManifest)
        manifestLoaded: false,
        chunkDimTiles: 85,        // manifest.chunk_dim_tiles — default defensivo, sempre
                                   // sobrescrito por loadManifest() com o valor real do arquivo
        manifestChunksByKey: {},  // "chunkX_chunkY" -> entrada do manifesto {file,
                                   // originGlobalCol, originGlobalRow, ...} — a ÚNICA fonte
                                   // de "quais chunks existem e onde buscar cada um" (ver
                                   // ensureChunkLoaded). Chave ausente = buraco esperado no
                                   // mapa da cidade (bairro ainda não gerado), não um erro.
        loadedChunks: {},         // "chunkX_chunkY" -> {rows, dim, originGlobalCol,
                                   // originGlobalRow, chunkX, chunkY} — cache dos chunks
                                   // atualmente em memória (janela 3x3, ver updateChunkWindow).
                                   // isWalkable()/render() SÓ leem daqui, nunca de S.manifest.
        loadingChunks: {},        // "chunkX_chunkY" -> true enquanto o fetch está em voo —
                                   // guarda contra disparar o mesmo fetch duas vezes por causa
                                   // de dois updateChunkWindow() consecutivos antes do 1º resolver.
        currentChunkX: null,      // chunk (chunkX,chunkY) que contém S.playerCol/Row agora —
        currentChunkY: null,      // null até a 1ª chamada de updateChunkWindow() (no activateNow).

        pois: null,             // array de POIs de data/overworld/pois.json (loadPois) — cada
                                 // item ganha um `_bounds` calculado em computePoiBounds()
        poisLoaded: false,
        entryPoi: null,         // POI com interaction.kind === 'episode_entry' — fonte de
                                 // window.OverworldTowerGridPos (Estágio 2, substitui o antigo
                                 // S.landmark calculado varrendo 'L' no grid)
        loaded: false,          // true quando manifest E pois terminaram de carregar
                                 // (finalizeLoadIfReady) — Estágio 5: NÃO espera mais nenhum
                                 // chunk de tile em si, só o metadado (manifest) + POIs. Os
                                 // chunks de tile carregam sob demanda depois disso (ver
                                 // activateNow -> updateChunkWindow).
        pendingActivate: null, // {x,y} se ActivateOverworld foi chamado antes do fetch terminar

        // GLOBAIS desde o Estágio 3 — toda a cidade compartilha o mesmo sistema de
        // coordenadas. Fonte LÓGICA/autoritativa (inteiros) pra isWalkable()/
        // checkPoiInteractions() (ver tryMove()) — NUNCA leia playerDrawCol/Row pra isso.
        // Estágio 5: cada chunk carrega seu PRÓPRIO originGlobalCol/Row (dentro do objeto
        // guardado em S.loadedChunks) — não existe mais um único par global pro módulo
        // inteiro (S.chunkOriginGlobalCol/Row do Estágio 3 saiu; ver chunkXYForGlobal).
        playerCol: 0,
        playerRow: 0,

        // ---- Estágio 1 (câmera lerp + movimento interpolado) — só visual -------
        // playerPrevCol/Row = tile de onde o passo lógico atual partiu; junto com
        // S.moveStartAt (t0 do passo) e S.stepIntervalMs (duração) dão os 3 dados
        // do lerp em render(): t = (agora - moveStartAt) / stepIntervalMs,
        // draw = prev + (atual - prev) * clamp(t, 0, 1). playerDrawCol/Row é
        // recalculado todo frame em render() — nunca escrito fora dali.
        playerPrevCol: 0,
        playerPrevRow: 0,
        playerDrawCol: 0,
        playerDrawRow: 0,
        moveStartAt: 0,       // ts (performance.now()) do início do passo lógico atual — só avança em tryMove() quando o passo REALMENTE muda de tile (nunca em tentativa bloqueada, senão o visual "salta pra trás" a cada tecla batendo na parede).
        camX: null,           // offset de câmera suavizado (screen-space). null = ainda não inicializado, força snap no próximo render — nunca desliza da posição da sessão/spawn anterior.
        camY: null,
        lastRenderAt: 0,      // ts do frame anterior — só pra dt real da câmera (lerp independente de framerate).
        otherPlayersDraw: {}, // key (email||name) -> {prevCol,prevRow,targetCol,targetRow,drawCol,drawRow,moveStartAt} — mesmo tratamento de interpolação aplicado aos jogadores remotos. Duração aproximada por stepIntervalMs: o cliente não conhece o tick exato do broadcast do servidor (OVERWORLD_TICK_RATE vive em server/index.js) — formalizar isso é trabalho do Estágio 6 do plano, fora de escopo aqui.

        insidePoiIds: {},    // poi.id -> bool, borda de entrada por POI (Estágio 2, generaliza o
                              // antigo insideLandmark: dispara a interação só na transição fora->dentro)
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
    // playerGridX/Y são GLOBAIS desde o Estágio 3 (mesmo valor de S.playerCol/Row,
    // espelhado em syncPublicState()) — contrato de campo/nome não mudou pros
    // consumidores (js/game/network.js manda isso pro servidor via overworld_move
    // sem interpretar o número; server/index.js só valida faixa, ver
    // OVERWORLD_GRID_MIN/MAX), só o SIGNIFICADO do valor.
    window.OverworldState = { playerGridX: 0, playerGridY: 0, isActive: false };
    window.OverworldTowerGridPos = null;

    // Estágio 5 — hook de depuração READ-ONLY (não é um dos 4 pontos de contrato
    // originais, é só o único jeito de inspecionar S.loadedChunks/currentChunk de fora
    // do closure sem expor o estado inteiro em `window`). Usado pra verificar de verdade
    // a janela 3x3/descarga de chunks (heap, chunks carregados) em vez de só "parecer"
    // funcionar. Seguro de manter: não muta nada, só lê.
    window.OverworldDebug = {
        getLoadedChunkKeys: function () { return Object.keys(S.loadedChunks); },
        getCurrentChunk: function () { return { chunkX: S.currentChunkX, chunkY: S.currentChunkY }; }
    };

    // ======================= Carregamento dos dados ==========================
    // Estágio 5 — substitui o antigo loadGrid() (fetch fixo de um único chunk).
    // manifest.json é o novo primeiro fetch do boot: metadado pequeno (quais chunks
    // existem, onde buscar cada um, dimensão em tiles) — os chunks de tile em si
    // carregam sob demanda depois, via ensureChunkLoaded()/updateChunkWindow(), não
    // mais aqui.
    function loadManifest() {
        fetch(MANIFEST_URL)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status + ' ao buscar ' + MANIFEST_URL);
                return r.json();
            })
            .then(function (data) {
                S.manifest = data;
                S.chunkDimTiles = (data && typeof data.chunk_dim_tiles === 'number') ? data.chunk_dim_tiles : 85;
                S.manifestChunksByKey = {};
                var chunks = (data && Array.isArray(data.chunks)) ? data.chunks : [];
                for (var i = 0; i < chunks.length; i++) {
                    var c = chunks[i];
                    if (!c || typeof c.chunkX !== 'number' || typeof c.chunkY !== 'number' || !c.file) {
                        console.warn('[Overworld] entrada inválida no manifesto, ignorada:', c);
                        continue;
                    }
                    S.manifestChunksByKey[chunkKey(c.chunkX, c.chunkY)] = c;
                }
                S.manifestLoaded = true;
                finalizeLoadIfReady();
            })
            .catch(function (err) {
                console.error('[Overworld] falha ao carregar ' + MANIFEST_URL + ':', err);
            });
    }

    // Estágio 2 (POI data-driven) — data/overworld/pois.json substitui a antiga
    // varredura de 'L' no grid como fonte da torre/landmarks. Carregado em paralelo
    // a loadManifest() (Estágio 5, antes era loadGrid()); os dois convergem em
    // finalizeLoadIfReady().
    function loadPois() {
        fetch(POI_URL)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status + ' ao buscar ' + POI_URL);
                return r.json();
            })
            .then(function (data) {
                S.pois = (data && Array.isArray(data.pois)) ? data.pois : [];
                S.poisLoaded = true;
                finalizeLoadIfReady();
            })
            .catch(function (err) {
                // Mesma filosofia defensiva de antes ("nenhuma célula L encontrada" já era
                // só um warn + landmark null, nunca travava o boot): sem pois.json, degrada
                // pra lista vazia — sem POI "episode_entry" a torre fica ausente (ver
                // computePoiBounds), mas o overworld continua carregando e jogável.
                console.error('[Overworld] falha ao carregar ' + POI_URL + ':', err);
                S.pois = [];
                S.poisLoaded = true;
                finalizeLoadIfReady();
            });
    }

    // Converge os dois fetches paralelos (grid + pois). Só considera o overworld
    // "carregado" (S.loaded, gate de ActivateOverworld) quando os dois terminaram —
    // computePoiBounds() precisa só dos POIs, mas render()/isWalkable() precisam do
    // grid, então nenhum dos dois pode faltar.
    function finalizeLoadIfReady() {
        if (!S.manifestLoaded || !S.poisLoaded) return;
        computePoiBounds();
        S.loaded = true;
        var chunkCount = Object.keys(S.manifestChunksByKey).length;
        console.log('[Overworld] manifesto carregado (' + chunkCount + ' chunk(s) no mapa, ' + S.chunkDimTiles + 'x' + S.chunkDimTiles + ' tiles cada), ' + S.pois.length + ' POI(s). Torre em', window.OverworldTowerGridPos);
        if (S.pendingActivate) {
            var p = S.pendingActivate;
            S.pendingActivate = null;
            activateNow(p.x, p.y);
        }
    }

    // Estágio 2 — substitui a antiga computeLandmarkBounds() (que varria o grid
    // procurando 'L'). Leitura direta do POI carregado: cada POI ganha um retângulo
    // de footprint em coordenadas GLOBAIS (poi.globalCol/globalRow, tratados como já
    // estando no espaço certo desde que pois.json foi escrito no Estágio 2 — ver plano
    // §4). Estágio 3 (concluído) migrou S.playerCol/Row e o grid pra esse mesmo espaço
    // global (ver globalToLocalCol/Row/localToGlobalCol/Row acima de isWalkable()), então
    // esta função em si não precisou mudar — já lia poi.globalCol/globalRow direto, sem
    // nenhuma conversão local no meio. Numericamente idêntico a antes enquanto só existir
    // o chunk (0,0) (origem global 0,0). window.OverworldTowerGridPos continua
    // vindo do POI cujo interaction.kind é "episode_entry" — mesmo contrato de antes,
    // consumido por js/web2/game_core.js:549, js/game/ghostdex_ui.js:515 e
    // js/game/engine.js (spawn/retorno do Episódio 1).
    function computePoiBounds() {
        S.entryPoi = null;
        var entryCandidates = [];
        for (var i = 0; i < S.pois.length; i++) {
            var poi = S.pois[i];
            if (!poi || typeof poi.globalCol !== 'number' || typeof poi.globalRow !== 'number') {
                console.warn('[Overworld] POI inválido (sem globalCol/globalRow numéricos), ignorado:', poi);
                continue;
            }
            var fp = poi.footprint || { widthTiles: 1, heightTiles: 1 };
            var halfWTiles = (fp.widthTiles - 1) / 2;
            var halfHTiles = (fp.heightTiles - 1) / 2;
            var bounds = {
                minCol: poi.globalCol - Math.floor(halfWTiles),
                maxCol: poi.globalCol + Math.ceil(halfWTiles),
                minRow: poi.globalRow - Math.floor(halfHTiles),
                maxRow: poi.globalRow + Math.ceil(halfHTiles),
                centerCol: poi.globalCol,
                centerRow: poi.globalRow
            };
            // âncora de profundidade = canto mais "perto da câmera" do footprint
            // (maior col+row), mesma regra de sort da skill isometric-canvas-rendering
            // §2 (sprite/volume alto ancora no footprint, não no topo do desenho).
            bounds.anchorRow = bounds.maxRow;
            bounds.anchorCol = bounds.maxCol;
            poi._bounds = bounds;

            if (poi.interaction && poi.interaction.kind === 'episode_entry') {
                entryCandidates.push(poi);
            }
        }

        if (entryCandidates.length === 0) {
            console.warn('[Overworld] nenhum POI com interaction.kind="episode_entry" encontrado — torre ausente.');
            window.OverworldTowerGridPos = null;
            return;
        }
        if (entryCandidates.length > 1) {
            console.warn('[Overworld] mais de um POI "episode_entry" encontrado — usando o primeiro (' + entryCandidates[0].id + ').');
        }
        S.entryPoi = entryCandidates[0];
        window.OverworldTowerGridPos = { gridX: S.entryPoi._bounds.centerCol, gridY: S.entryPoi._bounds.centerRow };
    }

    // Estágio 5 — chave de S.loadedChunks/S.manifestChunksByKey/S.loadingChunks, sempre
    // "chunkX_chunkY" (inteiros com sinal, ver plano §1 — bairros a noroeste/sudoeste da
    // origem exigem chunkX/chunkY negativos; '-1_0' nunca colide com outra combinação
    // porque '-' só aparece como prefixo de sinal, formato inequívoco).
    function chunkKey(chunkX, chunkY) { return chunkX + '_' + chunkY; }

    // Resolve em qual chunk uma coordenada GLOBAL cai. Math.floor (não |0 nem truncamento)
    // é obrigatório aqui: precisa arredondar pra -infinito em coordenadas negativas (ex.:
    // globalCol=-1 tem que cair no chunkX=-1, não no chunkX=0) — Math.floor já faz isso
    // certo por definição em JS.
    function chunkXYForGlobal(globalCol, globalRow) {
        return {
            chunkX: Math.floor(globalCol / S.chunkDimTiles),
            chunkY: Math.floor(globalRow / S.chunkDimTiles)
        };
    }

    // Garante que o chunk (chunkX,chunkY) esteja em S.loadedChunks, disparando o fetch se
    // ainda não estiver carregado nem em voo. No-op silencioso (nem loga) se o chunk não
    // existe no manifesto — isso é um BURACO ESPERADO no mapa da cidade (bairro ainda não
    // gerado pelo Estágio 4), não um erro; ver isWalkable()/render() pra como o resto do
    // módulo trata um chunk ausente (bloqueado / não desenhado, nunca undefined vazando
    // pra lógica de colisão).
    function ensureChunkLoaded(chunkX, chunkY) {
        var key = chunkKey(chunkX, chunkY);
        if (S.loadedChunks[key] || S.loadingChunks[key]) return;
        var manifestEntry = S.manifestChunksByKey[key];
        if (!manifestEntry) return; // buraco esperado — nada pra buscar ainda

        S.loadingChunks[key] = true;
        fetch(manifestEntry.file)
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status + ' ao buscar ' + manifestEntry.file);
                return r.json();
            })
            .then(function (data) {
                delete S.loadingChunks[key];
                // O jogador pode ter saído da janela 3x3 deste chunk enquanto o fetch
                // estava em voo (ex.: mudou de direção perto de uma costura mais rápido
                // que a latência do fetch) — descarta em vez de guardar, senão
                // S.loadedChunks cresceria sem limite a cada oscilação de borda (o
                // próprio teste de heap do plano existe pra pegar exatamente isso).
                if (!isChunkInCurrentWindow(chunkX, chunkY)) return;
                var rows = data.grid.rows;
                var meta = data._meta && data._meta.grid;
                var originCol = (meta && typeof meta.chunkOriginGlobalCol === 'number') ? meta.chunkOriginGlobalCol : (manifestEntry.originGlobalCol || 0);
                var originRow = (meta && typeof meta.chunkOriginGlobalRow === 'number') ? meta.chunkOriginGlobalRow : (manifestEntry.originGlobalRow || 0);
                S.loadedChunks[key] = {
                    rows: rows,
                    dim: rows.length,
                    originGlobalCol: originCol,
                    originGlobalRow: originRow,
                    chunkX: chunkX,
                    chunkY: chunkY
                };
            })
            .catch(function (err) {
                delete S.loadingChunks[key];
                console.error('[Overworld] falha ao carregar chunk ' + key + ' (' + manifestEntry.file + '):', err);
                // sem retry explícito aqui: a próxima updateChunkWindow() (próximo passo
                // lógico) tenta de novo sozinha, porque nem loadingChunks nem loadedChunks
                // ficaram marcados — auto-recuperação de um blip de rede transitório.
            });
    }

    function isChunkInCurrentWindow(chunkX, chunkY) {
        if (S.currentChunkX === null || S.currentChunkY === null) return false;
        return Math.abs(chunkX - S.currentChunkX) <= 1 && Math.abs(chunkY - S.currentChunkY) <= 1;
    }

    // Janela 3x3 (plano §2) + prefetch direcional (plano §3) NUM SÓ MECANISMO — ver nota de
    // arquitetura no topo do arquivo (Estágio 5, item 2) pra por que manter os 9 vizinhos do
    // chunk atual SEMPRE carregados já cobre "antecipar na direção do movimento" sem lógica
    // extra: o jogador só anda 1 tile por passo, e o vizinho na direção que ele for andar
    // sempre já é um dos 8 vizinhos do chunk ATUAL (carregado desde que ele entrou nele).
    // Chamada a cada passo lógico bem-sucedido (tryMove()) — barata mesmo assim (~9
    // lookups em hashtable) quando o chunk não mudou, porque ensureChunkLoaded() já
    // retorna cedo pra tudo que já está carregado/em voo.
    function updateChunkWindow() {
        var cxy = chunkXYForGlobal(S.playerCol, S.playerRow);
        S.currentChunkX = cxy.chunkX;
        S.currentChunkY = cxy.chunkY;

        var neededKeys = {};
        for (var dx = -1; dx <= 1; dx++) {
            for (var dy = -1; dy <= 1; dy++) {
                var ncx = cxy.chunkX + dx, ncy = cxy.chunkY + dy;
                neededKeys[chunkKey(ncx, ncy)] = true;
                ensureChunkLoaded(ncx, ncy);
            }
        }
        // descarrega da memória tudo que saiu da janela 3x3 (plano §2) — o teste de heap
        // do plano (ida-e-volta entre chunks várias vezes, checando performance.memory)
        // é exatamente pra confirmar que isto de fato acontece, não só "parece" acontecer.
        for (var k in S.loadedChunks) {
            if (!neededKeys[k]) delete S.loadedChunks[k];
        }
    }

    // col/row aqui são GLOBAIS. Resolve (chunkX,chunkY) a partir da coordenada global,
    // procura o chunk em S.loadedChunks (nunca em S.manifest — só chunk REALMENTE em
    // memória conta) e indexa dentro dele. Chunk ausente (fora do manifesto = buraco real
    // no mapa da cidade, OU dentro do manifesto mas ainda buscando os bytes, OU descartado
    // por estar fora da janela 3x3) = bloqueado por padrão, nos três casos — o jogador
    // nunca anda pra uma célula cujo dado ele não tem, mesmo que essa célula "exista" no
    // manifesto mas ainda não tenha chegado.
    function isWalkable(globalCol, globalRow) {
        var cxy = chunkXYForGlobal(globalCol, globalRow);
        var chunk = S.loadedChunks[chunkKey(cxy.chunkX, cxy.chunkY)];
        if (!chunk) return false;
        var localCol = globalCol - chunk.originGlobalCol;
        var localRow = globalRow - chunk.originGlobalRow;
        if (localRow < 0 || localRow >= chunk.dim || localCol < 0 || localCol >= chunk.dim) return false;
        return chunk.rows[localRow][localCol] !== '#';
    }

    // Substitui a antiga isInsideLandmark(col,row) (que só conhecia a torre). Agora
    // genérica por POI — footprint.widthTiles/heightTiles substitui as constantes
    // hardcoded TOWER_HW/TOWER_HH de antes (ver drawTower/drawTowerStreetLabel).
    function isInsidePoiFootprint(poi, col, row) {
        if (!poi || !poi._bounds) return false;
        var b = poi._bounds;
        return row >= b.minRow && row <= b.maxRow && col >= b.minCol && col <= b.maxCol;
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

    function diamondPath(ctx, cx, cy, hw, hh) {
        ctx.beginPath();
        ctx.moveTo(cx, cy - hh);
        ctx.lineTo(cx + hw, cy);
        ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx - hw, cy);
        ctx.closePath();
    }

    function drawFlatDiamond(ctx, cx, cy, hw, hh, fill, stroke) {
        diamondPath(ctx, cx, cy, hw, hh);
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
        // Paleta 02/09/2026 — referência de estilo pedida: mapa AR escuro, fundo preto,
        // ruas claras/brancas com brilho neon sutil (não os ícones do app de referência,
        // só a estética). Fundo já vem quase preto do clear do frame (pal.bgDark); aqui
        // só a rua em si, num cinza bem claro quase branco com halo ciano.
        //
        // Não usa ctx.shadowBlur por tile: isso roda em centenas de tiles/frame (ver
        // culling em render()) e shadowBlur é caro o bastante no Canvas 2D pra derrubar
        // o frame rate nessa escala. O "glow" é simulado sem blur de verdade: um contorno
        // externo largo e fraco (halo) desenhado ANTES do preenchimento da rua, seguido
        // do preenchimento claro com um contorno interno fino e mais forte por cima —
        // ambos são só stroke/fill normais, sem custo de blur.
        diamondPath(ctx, cx, cy, HALF_W * 1.08, HALF_H * 1.08);
        ctx.strokeStyle = 'rgba(120, 245, 255, 0.16)';
        ctx.lineWidth = 4;
        ctx.stroke();

        drawFlatDiamond(ctx, cx, cy, HALF_W, HALF_H, 'hsla(195, 25%, 86%, 0.92)', 'rgba(180, 250, 255, 0.55)');
    }

    // DESATIVADO 02/09/2026 a pedido do usuário — ver nota de arquitetura no topo do
    // arquivo (item 1). Função mantida (não apagada) porque o PRNG determinístico por
    // tile pode servir pra outra coisa no futuro; render() não chama mais isto e
    // células '#' nem entram no array `drawables` (ver loop de varredura em render()).
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

    // Estágio 2 — TOWER_HW/TOWER_HH hardcoded (footprint 3x3 fixo) removidos: a
    // largura/altura em tiles agora vêm do footprint do POI carregado
    // (poi.footprint.widthTiles/heightTiles), lido em cada chamada. TOWER_HEIGHT
    // continua fixo — é a extrusão em Z (px), puramente visual, não faz parte do
    // schema de footprint (que só descreve o retângulo em tiles no chão).
    var TOWER_HEIGHT = 170;

    function drawTower(ctx, cx, cy, pal, tSec, poi) {
        var fp = (poi && poi.footprint) || { widthTiles: 3, heightTiles: 3 };
        var hw = HALF_W * fp.widthTiles, hh = HALF_H * fp.heightTiles;
        var height = TOWER_HEIGHT;
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

        // farol pulsante no topo — deixa a torre óbvia de longe, conforme pedido. Só
        // desenha se o POI pedir (visual.beacon !== false — mesmo default "ligado" de
        // antes, quando essa opção nem existia).
        if (poi && poi.visual && poi.visual.beacon === false) return;
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

    // Nome de rua flutuando perto da torre — item 3 do pedido do usuário ("nome de
    // local flutuando" na referência de estilo). Só a rua da própria torre (Rua
    // Doutor Beltrão); ver nota de arquitetura no topo do arquivo (item 2) pra por
    // que as outras ruas do grid não têm rótulo ainda. Desenhada UMA VEZ por frame
    // (não por tile, diferente das ruas) — chamada direto de render(), depois do
    // laço de depth-sort, então sempre fica por cima de tudo, como uma etiqueta de
    // UI flutuante e não um objeto do mundo isométrico.
    function drawTowerStreetLabel(ctx, pal, camOffsetX, camOffsetY, tSec) {
        var poi = S.entryPoi;
        if (!poi || !poi._bounds) return;
        // Estágio 2 — texto vem de poi.visual.streetLabel (data-driven) em vez do
        // literal 'Rua Doutor Beltrão' hardcoded; cai pro poi.name se streetLabel não
        // vier no dado, e não desenha nada se nenhum dos dois existir.
        var label = (poi.visual && poi.visual.streetLabel) || poi.name;
        if (!label) return;
        var fp = poi.footprint || { widthTiles: 3, heightTiles: 3 };
        var hh = HALF_H * fp.heightTiles;
        var center = gridToScreen(poi._bounds.centerCol, poi._bounds.centerRow);
        var cx = center.x + camOffsetX;
        var cy = center.y + camOffsetY;
        // Âncora NO PÉ da torre (cy - a metade do footprint), não no farol do topo
        // (que fica a `TOWER_HEIGHT + hh + 14` px acima de cy — quase 250px). O
        // canvas de jogo de verdade (#myCanvas, e portanto este, ver
        // resizeCanvasToContainer) roda a 640x300px — testado ao vivo: com o rótulo
        // ancorado no farol, ele só cabia na tela com a câmera ~10 tiles longe da
        // torre; ancorado perto do pé (como uma placa na entrada, não uma bandeira
        // no topo) fica visível sempre que a própria torre está em quadro, que é
        // exatamente o "perto da torre" pedido.
        var bob = Math.sin(tSec * 1.6) * 3; // leve flutuação vertical, reforça a leitura "flutuando"
        var y = cy - hh - 45 + bob;

        ctx.save();
        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.textAlign = 'center';
        var w = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(5, 5, 8, 0.6)';
        ctx.fillRect(cx - w / 2 - 10, y - 15, w + 20, 21);
        ctx.shadowColor = pal.cyan;
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#eafffe';
        ctx.fillText(label, cx, y);
        ctx.restore();
    }

    // ============================ Sprite do fantasma ativo ======================
    // Ver item 3 da nota de arquitetura no topo do arquivo — resumo: reaproveita
    // window.g_customPlayerGhostRight (mesma referência que engine.js usa no
    // Episódio 1) para o próprio jogador; pra outros jogadores, tenta extrair o ID
    // do fantasma do sufixo "(#ID)" já embutido em `name` pelo servidor.
    var GHOST_SPRITE_TARGET_H = 46; // altura alvo do sprite reduzido no grid isométrico (px)

    function ghostSpritePaths(id) {
        // MESMO esquema de caminhos que js/game/ghostdex_ui.js:safeLoadGhostSprite usa
        // (não inventado aqui) — Ghosts/#<id>.png é o formato real dos assets (ver
        // pasta Ghosts/), os outros dois são fallback pro mesmo padrão usado lá.
        return [
            'Ghosts/%23' + id + '.png',
            'Ghosts/' + id + '.png',
            'assets/sprites/ghost_' + id + '_r.webp'
        ];
    }

    // Carrega (com cache local, chave 'ghost:<id>') o sprite de um fantasma pelo ID,
    // tentando os caminhos em ordem até um carregar. Retorna imediatamente um
    // <img> "placeholder" (ainda sem naturalWidth) na primeira chamada — quem chama
    // isso deve checar `.complete && .naturalWidth > 0` antes de desenhar (ver
    // drawGhostBillboard, que cai no marcador genérico enquanto isso não é true).
    function loadGhostSpriteById(id) {
        var key = 'ghost:' + id;
        var cached = S.avatarImgCache[key];
        if (cached) return cached;

        var placeholder = new Image();
        S.avatarImgCache[key] = placeholder;

        var paths = ghostSpritePaths(id);
        var idx = 0;
        function tryNext() {
            if (idx >= paths.length) return; // esgotou os 3 caminhos — fica no placeholder (fallback pro token genérico)
            var img = new Image();
            img.onload = function () {
                if (img.naturalWidth > 0) S.avatarImgCache[key] = img;
            };
            img.onerror = function () {
                idx++;
                tryNext();
            };
            img.src = paths[idx];
        }
        tryNext();
        return placeholder;
    }

    // Sprite do PRÓPRIO jogador — prioriza a referência já carregada pelo resto do
    // jogo (window.g_customPlayerGhostRight, populada por PlayAsGhost); só recorre
    // ao carregamento próprio se essa referência ainda não existir/não estiver
    // pronta (ex.: entrada via auto-login, ver nota de arquitetura item 3).
    function getSelfGhostImg() {
        var shared = window.g_customPlayerGhostRight;
        if (shared && shared.complete && shared.naturalWidth > 0) return shared;
        var id = window.g_currentPlayerGhost;
        if (id) return loadGhostSpriteById(id);
        return null;
    }

    // Sprite de OUTRO jogador — heurística documentada no topo do arquivo (item 3):
    // extrai o ID do sufixo "(#ID)" do `name` ecoado pelo servidor. Sem sufixo
    // reconhecível, retorna null (drawGhostBillboard cai no marcador genérico só
    // pra esse jogador, sem inventar sprite).
    var GHOST_ID_SUFFIX_RE = /\(#([^)]+)\)\s*$/;
    function getOtherPlayerGhostImg(p) {
        var m = p && p.name ? GHOST_ID_SUFFIX_RE.exec(p.name) : null;
        return m ? loadGhostSpriteById(m[1]) : null;
    }

    // Desenha o fantasma (imagem real, reduzida) ancorado nos "pés" (footY = cy, o
    // mesmo ponto usado pro depth-sort) — mesmo princípio de ancoragem de sprite
    // alto da skill isometric-canvas-rendering §2, só que aplicado a um bitmap em
    // vez de um prisma extrudado. Se a imagem ainda não carregou (ou não existe),
    // cai no marcador colorido antigo (drawPlayerToken) só como estado transitório
    // de carregamento — não é o resultado final pedido.
    function drawGhostBillboard(ctx, cx, cy, img, isSelf, label, pal) {
        var footY = cy;
        var ready = img && img.complete && img.naturalWidth > 0;
        if (!ready) {
            drawPlayerToken(ctx, cx, cy, pal, label, isSelf ? pal.cyan : pal.magenta, isSelf);
            return;
        }

        var scale = GHOST_SPRITE_TARGET_H / img.naturalHeight;
        var w = img.naturalWidth * scale;
        var h = GHOST_SPRITE_TARGET_H;

        ctx.save();
        // sombra achatada no chão, mesma lógica do token antigo (ancora visual no tile)
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(cx, footY, HALF_W * 0.28, HALF_H * 0.28, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.globalAlpha = 1;
        if (isSelf) {
            ctx.shadowColor = pal.cyan;
            ctx.shadowBlur = 12;
        }
        ctx.drawImage(img, cx - w / 2, footY - h, w, h);
        ctx.restore();

        if (label) {
            ctx.save();
            ctx.font = '10px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
            ctx.fillText(label, cx, footY - h - 6);
            ctx.restore();
        }
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

    // Estágio 1 — identidade estável de um jogador remoto pro mapa de interpolação
    // abaixo. Reaproveita o mesmo par email/name já usado pelo resto do arquivo
    // pra identificar jogadores (ver nota no topo do arquivo sobre o payload
    // `overworld_players_update`) — não inventa um id novo. Limitação conhecida:
    // se nem email nem name existirem, cai num '?' genérico (jogadores anônimos
    // colidiriam no mesmo slot de interpolação); não pior que o '???' já usado
    // hoje pro rótulo visual desses casos.
    function otherPlayerKey(p) {
        return p.email || p.name || '?';
    }

    // Estágio 1 — mesmo tratamento de interpolação visual do jogador local (ver
    // topo de render()), aplicado a cada jogador remoto de `window.OverworldOtherPlayers`.
    // Só efeito visual — jogadores remotos nunca participam de colisão local hoje,
    // então não há restrição de "vazamento pra lógica" a preservar aqui (diferente
    // do jogador local, onde isso é inegociável).
    //
    // Duração aproximada pelo mesmo S.stepIntervalMs (150ms) do passo local: este
    // arquivo não conhece o tick real do broadcast do servidor (OVERWORLD_TICK_RATE
    // vive em server/index.js, fora do escopo do Estágio 1) — formalizar a duração
    // real por tick de rede é trabalho do Estágio 6 do plano.
    function updateOtherPlayersDraw(now, others) {
        var seen = {};
        if (Array.isArray(others)) {
            for (var i = 0; i < others.length; i++) {
                var p = others[i];
                if (!p || typeof p.gridX !== 'number' || typeof p.gridY !== 'number') continue;
                var key = otherPlayerKey(p);
                seen[key] = true;
                var entry = S.otherPlayersDraw[key];
                if (!entry) {
                    // primeira vez que este jogador aparece pra este cliente — sem
                    // posição anterior real conhecida, desenha direto no lugar (nunca
                    // desliza vindo de (0,0) ou de qualquer valor arbitrário).
                    S.otherPlayersDraw[key] = {
                        prevCol: p.gridX, prevRow: p.gridY,
                        targetCol: p.gridX, targetRow: p.gridY,
                        drawCol: p.gridX, drawRow: p.gridY,
                        moveStartAt: now
                    };
                } else {
                    if (entry.targetCol !== p.gridX || entry.targetRow !== p.gridY) {
                        // novo update de posição chegou da rede: rebaseia o lerp a
                        // partir da posição VISUAL atual (drawCol/Row), não do alvo
                        // antigo — evita um salto se o update chegar no meio de uma
                        // interpolação ainda em andamento.
                        entry.prevCol = entry.drawCol;
                        entry.prevRow = entry.drawRow;
                        entry.targetCol = p.gridX;
                        entry.targetRow = p.gridY;
                        entry.moveStartAt = now;
                    }
                    var t = S.stepIntervalMs > 0
                        ? Math.min(1, Math.max(0, (now - entry.moveStartAt) / S.stepIntervalMs))
                        : 1;
                    entry.drawCol = entry.prevCol + (entry.targetCol - entry.prevCol) * t;
                    entry.drawRow = entry.prevRow + (entry.targetRow - entry.prevRow) * t;
                }
            }
        }
        // descarta jogadores que saíram de OverworldOtherPlayers (desconectaram ou
        // saíram da vizinhança) — sem isso o mapa cresce sem limite.
        for (var k in S.otherPlayersDraw) {
            if (!seen[k]) delete S.otherPlayersDraw[k];
        }
    }

    // ============================== Frame de render =============================
    function render(tsMs) {
        var ctx = S.ctx, canvas = S.canvas;
        if (!ctx) return;
        var pal = readPalette();
        var tSec = tsMs / 1000;

        ctx.fillStyle = pal.bgDark;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Estágio 1 — posição DESENHADA (visual) do jogador: interpola entre o
        // tile de origem do passo lógico atual (playerPrevCol/Row) e o destino
        // (playerCol/Row) ao longo de S.stepIntervalMs. RESTRIÇÃO INEGOCIÁVEL do
        // plano: isto é só visual — isWalkable()/checkPoiInteractions() (tryMove())
        // NUNCA leem playerDrawCol/Row, só a posição lógica inteira.
        var pt = S.stepIntervalMs > 0
            ? Math.min(1, Math.max(0, (tsMs - S.moveStartAt) / S.stepIntervalMs))
            : 1;
        S.playerDrawCol = S.playerPrevCol + (S.playerCol - S.playerPrevCol) * pt;
        S.playerDrawRow = S.playerPrevRow + (S.playerRow - S.playerPrevRow) * pt;

        // Câmera: lerp exponencial independente de framerate —
        // camera += (alvo-camera) * (1 - k^dt), NÃO um fator fixo por frame
        // (senão a convergência muda de velocidade entre 60Hz/144Hz). Alvo é a
        // posição de TELA da posição DESENHADA (não a lógica) — a câmera segue o
        // deslize suave do jogador, não o salto de tile. Primeiro frame após
        // activate (camX/camY null) faz snap direto, nunca desliza vindo da
        // posição da sessão/spawn anterior.
        var camTargetScreen = gridToScreen(S.playerDrawCol, S.playerDrawRow);
        var camTargetX = canvas.width / 2 - camTargetScreen.x;
        var camTargetY = canvas.height / 2 - camTargetScreen.y;
        var camDt = S.lastRenderAt ? Math.max(0, (tsMs - S.lastRenderAt) / 1000) : 0;
        S.lastRenderAt = tsMs;
        if (S.camX === null || S.camY === null) {
            S.camX = camTargetX;
            S.camY = camTargetY;
        } else {
            var camLerpF = 1 - Math.pow(CAMERA_LERP_K, camDt);
            S.camX += (camTargetX - S.camX) * camLerpF;
            S.camY += (camTargetY - S.camY) * camLerpF;
        }
        var camOffsetX = S.camX;
        var camOffsetY = S.camY;

        // culling: janela quadrada em espaço de grid ao redor do jogador, generosa
        // o bastante pra cobrir o viewport (não desenha os 85x85 fora de tela).
        var colSpan = Math.ceil((canvas.width / 2) / HALF_W) + 3;
        var rowSpan = Math.ceil((canvas.height / 2) / HALF_H) + 3;
        var R = colSpan + rowSpan;

        // Estágio 5 — o laço de culling varre RETÂNGULO GLOBAL diretamente ao redor do
        // jogador (não mais clampado a [0, S.dim-1] de um único S.rows, que só existia
        // enquanto havia exatamente 1 chunk). Pra cada célula GLOBAL, resolve o chunk dono
        // via chunkXYForGlobal + S.loadedChunks e indexa dentro dele; célula cujo chunk não
        // está carregado (buraco no mapa da cidade, ou chunk ainda buscando os bytes) é
        // simplesmente pulada — mesmo tratamento "bloqueado, nunca undefined" de
        // isWalkable(), aplicado aqui ao desenho: nada é desenhado ali, sem erro no
        // console. Cada célula usa o `dim`/origem do PRÓPRIO chunk (nunca um S.dim global,
        // que não existe mais), então chunks de tamanhos diferentes no futuro também
        // funcionariam sem mudança aqui.
        var minRowGlobal = S.playerRow - R;
        var maxRowGlobal = S.playerRow + R;
        var minColGlobal = S.playerCol - R;
        var maxColGlobal = S.playerCol + R;

        var drawables = [];
        for (var gRow = minRowGlobal; gRow <= maxRowGlobal; gRow++) {
            for (var gCol = minColGlobal; gCol <= maxColGlobal; gCol++) {
                var cellCxy = chunkXYForGlobal(gCol, gRow);
                var cellChunk = S.loadedChunks[chunkKey(cellCxy.chunkX, cellCxy.chunkY)];
                if (!cellChunk) continue; // buraco no mapa / chunk ainda não carregado — nada desenhado aqui
                var cellLocalRow = gRow - cellChunk.originGlobalRow;
                var cellLocalCol = gCol - cellChunk.originGlobalCol;
                if (cellLocalRow < 0 || cellLocalRow >= cellChunk.dim || cellLocalCol < 0 || cellLocalCol >= cellChunk.dim) continue;
                var ch = cellChunk.rows[cellLocalRow][cellLocalCol];
                // Prédios desativados (item 1 da nota de arquitetura no topo do arquivo) —
                // célula '#' nem entra no array de depth-sort, só 'street'/'landmark' desenham.
                if (ch === '#') continue;
                drawables.push({ key: gRow + gCol, type: 'tile', row: gRow, col: gCol, ch: ch });
            }
        }

        var others = window.OverworldOtherPlayers;
        updateOtherPlayersDraw(tsMs, others); // Estágio 1 — mesmo tratamento de interpolação visual do jogador local, ver comentário na função.
        if (Array.isArray(others)) {
            for (var i = 0; i < others.length; i++) {
                var p = others[i];
                if (!p || typeof p.gridX !== 'number' || typeof p.gridY !== 'number') continue;
                var otherDraw = S.otherPlayersDraw[otherPlayerKey(p)];
                var oDrawCol = otherDraw ? otherDraw.drawCol : p.gridX;
                var oDrawRow = otherDraw ? otherDraw.drawRow : p.gridY;
                drawables.push({ key: oDrawRow + oDrawCol, type: 'other', data: p, drawCol: oDrawCol, drawRow: oDrawRow });
            }
        }

        drawables.push({ key: S.playerDrawRow + S.playerDrawCol, type: 'player' });

        // depth-sort único (tiles + entidades juntos) — regra §2 da skill.
        drawables.sort(function (a, b) { return a.key - b.key; });

        for (var d = 0; d < drawables.length; d++) {
            var item = drawables[d];
            if (item.type === 'tile') {
                var s = gridToScreen(item.col, item.row);
                var sx = s.x + camOffsetX, sy = s.y + camOffsetY;
                // Estágio 2 — não decide mais pelo char 'L' do grid (a rasterização de
                // landmark no grid vira legado, ver plano §2/§4); decide por pertencer ao
                // footprint do POI de entrada carregado (leitura direta do POI, não do char).
                if (S.entryPoi && isInsidePoiFootprint(S.entryPoi, item.col, item.row)) {
                    drawLandmarkGroundMarker(ctx, sx, sy, pal);
                    var eb = S.entryPoi._bounds;
                    if (item.row === eb.anchorRow && item.col === eb.anchorCol) {
                        var center = gridToScreen(eb.centerCol, eb.centerRow);
                        drawTower(ctx, center.x + camOffsetX, center.y + camOffsetY, pal, tSec, S.entryPoi);
                    }
                } else {
                    // única alternativa possível aqui é 'street' — '#' (block) já foi filtrado
                    // antes de entrar em `drawables`, ver loop de varredura acima.
                    drawStreetTile(ctx, sx, sy, pal);
                }
            } else if (item.type === 'other') {
                var s2 = gridToScreen(item.drawCol, item.drawRow); // posição DESENHADA (interpolada) — só visual, ver updateOtherPlayersDraw().
                // esconde o sufixo técnico "(#id)" do rótulo visual — ele é lido à parte por
                // getOtherPlayerGhostImg(), não precisa aparecer no nome flutuante.
                var name = (item.data.name || item.data.email || '???').replace(GHOST_ID_SUFFIX_RE, '');
                if (item.data.avatarUrl) loadAvatar(item.data.avatarUrl);
                var otherImg = getOtherPlayerGhostImg(item.data);
                drawGhostBillboard(ctx, s2.x + camOffsetX, s2.y + camOffsetY, otherImg, false, name, pal);
            } else if (item.type === 'player') {
                var s3 = gridToScreen(S.playerDrawCol, S.playerDrawRow); // posição DESENHADA (interpolada) — nunca a lógica aqui, ver nota no topo de render().
                var selfImg = getSelfGhostImg();
                drawGhostBillboard(ctx, s3.x + camOffsetX, s3.y + camOffsetY, selfImg, true, 'você', pal);
            }
        }

        drawTowerStreetLabel(ctx, pal, camOffsetX, camOffsetY, tSec);

        // HUD mínimo de depuração — posição do jogador no grid + estado do streaming de
        // chunks (Estágio 5: chunk atual e quantos estão em memória agora — útil pra
        // conferir ao vivo que a janela 3x3 carrega/descarrega do jeito certo).
        ctx.save();
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = 'rgba(0,255,255,0.85)';
        ctx.fillText('Overworld  col=' + S.playerCol + ' row=' + S.playerRow +
            '  chunk=' + S.currentChunkX + ',' + S.currentChunkY +
            '  loaded=' + Object.keys(S.loadedChunks).length, 8, 14);
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

    function tryMove(dc, dr, now) {
        var nc = S.playerCol + dc, nr = S.playerRow + dr; // GLOBAL desde o Estágio 3 — isWalkable() converte pra local internamente.
        if (!isWalkable(nc, nr)) return false; // bloqueia contra 'block', permite 'street'/'landmark' — LÓGICO, decide antes de qualquer coisa visual existir pra este passo.
        // Estágio 1: guarda de onde o passo lógico partiu — origem do lerp visual
        // (playerDrawCol/Row, calculado em render()) até o novo playerCol/Row, ao
        // longo de S.stepIntervalMs. moveStartAt só avança AQUI, num passo que
        // realmente mudou de tile — nunca numa tentativa bloqueada (isWalkable já
        // retornou acima nesse caso), senão o visual "salta pra trás" e re-desliza
        // a cada tecla batendo contra uma parede.
        S.playerPrevCol = S.playerCol;
        S.playerPrevRow = S.playerRow;
        S.playerCol = nc; S.playerRow = nr;
        S.moveStartAt = now;
        S.lastDir = { dc: dc, dr: dr };
        updateChunkWindow(); // Estágio 5 — janela 3x3 + prefetch direcional (ver nota no topo do arquivo); barato quando o chunk não mudou, ensureChunkLoaded() já retorna cedo.
        syncPublicState();
        checkPoiInteractions(); // lê S.playerCol/Row (lógico) — NUNCA playerDrawCol/Row. Restrição inegociável do plano.
        return true;
    }

    // Estágio 2 — dispatcher genérico de interação por POI, substitui a antiga
    // checkLandmarkEnter() (hardcoded só pra torre). Handler ausente pra um dado
    // interaction.kind = console.warn + no-op, NUNCA lança erro (forward-compat pra
    // POIs futuros cujo handler ainda não foi escrito nesta versão do cliente — ver
    // plano §4).
    var POI_INTERACTION_HANDLERS = {
        episode_entry: function (poi) {
            // Comportamento idêntico ao antigo checkLandmarkEnter(): dispara
            // window.EnterEpisode1FromOverworld() se existir (contrato de
            // js/game/engine.js), senão só loga (ok em teste isolado sem engine.js).
            if (typeof window.EnterEpisode1FromOverworld === 'function') {
                window.EnterEpisode1FromOverworld();
            } else {
                console.log('[Overworld] jogador entrou no POI "' + poi.id + '", mas window.EnterEpisode1FromOverworld ainda não existe (ok em teste isolado).');
            }
        }
    };

    function dispatchPoiInteraction(poi) {
        var kind = poi.interaction && poi.interaction.kind;
        var handler = kind && POI_INTERACTION_HANDLERS[kind];
        if (typeof handler === 'function') {
            handler(poi);
        } else {
            console.warn('[Overworld] nenhum handler registrado para interaction.kind="' + kind + '" (poi.id=' + poi.id + ') — ignorando.');
        }
    }

    // Avalia TODOS os POIs com triggerOn:'enter' a cada passo, dispara só na borda
    // de entrada (fora->dentro, uma vez só por POI) — mesmo princípio da antiga
    // checkLandmarkEnter(), generalizado pra N POIs via S.insidePoiIds.
    function checkPoiInteractions() {
        if (!S.pois) return;
        for (var i = 0; i < S.pois.length; i++) {
            var poi = S.pois[i];
            if (!poi || !poi.interaction || poi.interaction.triggerOn !== 'enter') continue;
            var inside = isInsidePoiFootprint(poi, S.playerCol, S.playerRow);
            var wasInside = !!S.insidePoiIds[poi.id];
            if (inside && !wasInside) {
                dispatchPoiInteraction(poi);
            }
            S.insidePoiIds[poi.id] = inside;
        }
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
                tryMove(delta.dc, delta.dr, now); // `now` = t0 do lerp visual deste passo, ver tryMove().
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
        // Estágio 5 — dispara o carregamento da janela 3x3 ao redor do spawn ANTES do
        // primeiro loop/render. Não é estritamente necessário (render()/isWalkable() já
        // tratam chunk ausente como buraco/bloqueado, não quebrariam sem isto), mas evita
        // 1-2 frames à toa com o chão vazio antes do chunk (0,0) chegar.
        updateChunkWindow();
        // Inicializa o estado "dentro do POI" pra posição de spawn SEM disparar (mesmo
        // espírito do antigo `S.insideLandmark = isInsideLandmark(...)` — só registra
        // onde o jogador já está; checkPoiInteractions() é quem dispara, só em
        // transições fora->dentro durante o movimento).
        S.insidePoiIds = {};
        if (S.pois) {
            for (var ai = 0; ai < S.pois.length; ai++) {
                var apoi = S.pois[ai];
                if (apoi && apoi.interaction && apoi.interaction.triggerOn === 'enter') {
                    S.insidePoiIds[apoi.id] = isInsidePoiFootprint(apoi, S.playerCol, S.playerRow);
                }
            }
        }
        syncPublicState();

        // Estágio 1: reseta todo estado visual/interpolado pro novo spawn — sem
        // isso a câmera e o fantasma deslizariam da posição da sessão/spawn
        // ANTERIOR até aqui no primeiro frame (feio ao entrar/reentrar no
        // overworld, ex.: voltando do Episódio 1 pra outro ponto do mapa).
        S.playerPrevCol = S.playerCol;
        S.playerPrevRow = S.playerRow;
        S.playerDrawCol = S.playerCol;
        S.playerDrawRow = S.playerRow;
        S.moveStartAt = 0;
        S.camX = null; S.camY = null; // força snap da câmera pro spawn no próximo render()
        S.lastRenderAt = 0;
        S.otherPlayersDraw = {}; // descarta interpolação de outros jogadores de uma sessão anterior

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
            // grid e/ou pois.json ainda não terminaram de carregar (S.loaded só vira
            // true em finalizeLoadIfReady(), quando os dois convergem) — guarda o
            // pedido e ativa assim que os fetches resolverem, em vez de falhar
            // silenciosamente.
            S.pendingActivate = { x: spawnGridX, y: spawnGridY };
            console.log('[Overworld] ActivateOverworld chamado antes do grid/pois carregarem — ativação adiada.');
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
        loadManifest();
        loadPois();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
