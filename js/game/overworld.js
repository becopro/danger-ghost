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
//
// ATUALIZAÇÃO 2026-09-03 (sessão de correção pós-Estágio 6) — diagnóstico da tela
// "quase em branco" reportada pelo usuário + reescrita da camada visual de ruas.
// Cinco decisões documentadas aqui:
//
// 1) A TELA EM BRANCO NÃO ERA BUG DE CARREGAMENTO: testado ao vivo (servidor local,
//    ActivateOverworld() real) antes de mexer em qualquer coisa — manifest.json e os
//    3 chunks respondem 200 OK, window.OverworldDebug.getLoadedChunkKeys() mostrava
//    os 3 chunks carregados, zero erro de console. A causa real era a fragmentação
//    documentada no commit 73e0bf4 (151 componentes 4-conectados no chunk 0_0, só 19
//    células andáveis perto da torre): quase toda a tela ao redor do spawn era
//    'block' (não desenhado, ver item 1 da nota de 02/09), então o canvas parecia
//    vazio mesmo com os dados carregados corretamente. Ver tools/build-overworld-grid.js
//    pra causa raiz completa e correção (halfwidths + fechamento de gap diagonal +
//    reconciliação de costura entre chunks). Depois da regeneração, o chunk 0_0 tem
//    89% das células andáveis num componente só (1137-1146/1287) — o pequeno bolsão
//    isolado virou a norma inversa.
//
// 2) GEOMETRIA REAL DE RUA PRESERVADA (streetWays): cada chunk agora grava, além do
//    `grid` raster de sempre (inalterado em formato — colisão/chunking continuam
//    lendo só isso, ver item 1 da nota de 02/09, ainda válido), um array
//    `streetWays`: um item por OSM way (não por nome agregado), com `name`,
//    `highway` e `points` = a polilinha ORIGINAL em col/row FRACIONÁRIO (não
//    arredondado pra tile inteiro) no espaço local do chunk. É o dado que a query
//    Overpass sempre devolveu via `out geom` mas o pipeline antigo descartava depois
//    de rasterizar (ver item 2 da nota de 02/09 — aquele "NÃO EXISTE NO DADO ATUAL"
//    ficou obsoleto: agora existe, de propósito). `buildStreetPathsForChunk()`
//    converte pra coordenada GLOBAL (soma chunkOriginGlobalCol/Row, mesma convenção
//    do grid) e pré-calcula tela (gridToScreen) uma vez no carregamento do chunk,
//    não a cada frame.
//
// 3) RUAS DESENHADAS COMO CURVA, NÃO MAIS TILE QUADRADO: drawStreetCurves() traça
//    cada `streetWay` como uma curva suave (quadraticCurveTo ponto-a-ponto, técnica
//    padrão de "linha suave por pontos" sem precisar de spline completa) por cima de
//    um preenchimento BEM fraco por célula (drawStreetPavementFill, substituiu o
//    antigo drawStreetTile brilhante) que continua vindo do grid raster — garante
//    que não sobra nenhum buraco visual onde o grid diz "andável" mas nenhuma curva
//    passa exatamente por cima (ex.: células promovidas pelo fechamento de diagonal,
//    que ficam a 1 passo da geometria real, não sobre ela). Isto é literalmente "o
//    grid discreto por baixo pra colisão/lógica, geometria real por cima pro
//    visual", como pedido — nada no isWalkable()/tryMove() mudou.
//
// 4) ESTÉTICA "BARRA DE ROLAGEM" — INTERPRETAÇÃO EXPLÍCITA: o usuário referenciou "a
//    estética da barra de rolagem". A regra real (css/style.css, ::-webkit-scrollbar)
//    é: track quase preto (`rgba(7,7,8,0.95)`) com borda `--border-light`, thumb em
//    `linear-gradient(180deg, --cyan-neon, --purple-neon)` — um gradiente de DUAS
//    cores, direção FIXA (180deg = topo→base da tela, não ao longo do conteúdo).
//    Apliquei o mesmo MECANISMO (gradiente linear de direção fixa no canvas, não
//    relativo a cada curva) às ruas: `buildStreetGradient()` cria UM
//    `ctx.createLinearGradient` por frame, do topo ao fundo do canvas, e reusa pra
//    TODAS as curvas (barato: 1 gradiente, não 1 por rua). Estendi de 2 pra 3 paradas
//    de cor (cyan→magenta→purple) porque o usuário nomeou as três cores de próprio
//    punho ("ciano/magenta/roxo") — mesmas 3 variáveis neon já usadas em outros
//    elementos deste projeto (css/style.css --cyan-neon/--magenta-neon/--purple-neon
//    = hsl(180,100%,50%)/hsl(300,100%,50%)/hsl(275,100%,60%)), não uma cor inventada.
//    Por baixo do traço gradiente, uma "casing" (contorno) na cor do track
//    (rgba(7,7,8,0.9)) replica a moldura escura da barra de rolagem. Brilho neon
//    simulado sem `shadowBlur` por curva (mesma razão de performance já documentada
//    em drawStreetTile original: roda em ~100 ways/chunk visíveis por frame) — um
//    halo largo e fraco desenhado antes do traço principal, técnica idêntica à que
//    já existia.
//
// 5) NOME DE RUA POR SEGMENTO, NÃO SÓ A TORRE: cada `streetWay` já carrega seu
//    próprio `name` (tag OSM real, por way — não mais só a lista agregada em
//    `_meta.extraction_stats.named_streets_found`). `render()` agrupa as ways
//    visíveis por nome e desenha UM rótulo por nome único (o segmento mais longo
//    entre os visíveis, pra não empilhar o mesmo nome várias vezes numa rua com
//    múltiplos `way`) próximo do meio-arco da curva, mesmo tratamento visual de
//    `drawTowerStreetLabel` (pílula escura + glow ciano + Courier New) só que menor
//    e sem flutuação — é rótulo de mapa, não uma placa 3D como a da torre.
//
// 6) TORRE REPOSICIONADA (era globalCol/globalRow 42/42): a malha regenerada mudou
//    quais células são rua perto da torre, então a posição antiga ficou em cima de
//    asfalto. Nova posição (40/40) e a lógica de busca (footprint 3x3 inteiro fora
//    de rua + pelo menos 1 célula de borda encostando numa célula de rua do
//    componente grande = "porta") ficam em
//    tools/build-overworld-grid.js:findTowerSpot() — mesma decisão registrada em
//    data/overworld/pois.json (`_position_note`) e nos `_meta.caveats` do chunk
//    0_0. Nada em overworld.js precisou mudar pra isso (computePoiBounds() já lê
//    globalCol/globalRow do POI, não um valor hardcoded).
// ============================================================================
//
// ATUALIZAÇÃO 2026-09-03 (input de movimento + orientação do avatar) — pedido do
// usuário: vetor de movimento a partir do input, sprite sempre virado pro eixo
// real do movimento (incl. diagonal), pose idle mantém a última orientação ao
// parar. Investigação honesta ANTES de escrever qualquer coisa, porque o pedido
// falava em "animações diagonais" e isso só é implementável de verdade se o
// asset permitir:
//
// 1) QUANTAS DIREÇÕES DE SPRITE EXISTEM DE VERDADE HOJE: NENHUMA (nem
//    esquerda/direita como dois arquivos). Confirmado lendo
//    js/game/ghostdex_ui.js:PlayAsGhost() → safeLoadGhostSprite() carrega UMA
//    única imagem e faz `window.g_customPlayerGhostRight = loadedImg;
//    window.g_customPlayerGhostLeft = loadedImg;` — a MESMA referência de objeto
//    Image nos dois. Não existe um segundo arquivo "olhando pra esquerda" em
//    Ghosts/. O jeito real de "virar" o fantasma pra esquerda, usado hoje em
//    js/game/engine.js (linhas ~1205-1229 e ~3765-3796, Episódio 1), é espelhar a
//    MESMA imagem em runtime via `ctx.scale(-1, 1)` (canvas transform), nunca um
//    frame de arte separado. Não existe QUALQUER frame de cima/baixo/diagonal —
//    a hipótese do pedido (motor vem de um platformer 2D lateral, só
//    direita/esquerda por flip) bateu exatamente com o código real. Isto
//    descarta de vez a opção de "mapear 8 direções de verdade": não tem com o
//    que mapear.
//
// 2) DECISÃO TOMADA — opção (a) do pedido (aproximação com o que existe), NÃO a
//    (b) (indicador visual auxiliar tipo seta/partícula): flip horizontal
//    esquerda/direita (mesma técnica translate+scale(-1,1) de engine.js,
//    replicada em drawGhostBillboard()) combinado com a posição REAL no grid
//    isométrico (que já é 2 eixos, col/row) — SEM inventar rotação/inclinação
//    do sprite nem elemento visual novo. "Animação diagonal" nesta
//    implementação significa isto: o sprite mostra o flip esquerda/direita que
//    o movimento produziu, a posição no grid é exata (sem sprite dedicado por
//    direção), nada além disso. Por quê (a) e não (b): (b) adicionaria um
//    elemento visual novo (seta/partícula/inclinação) que o usuário não pediu
//    explicitamente e que competiria com a estética "mapa AR" já elogiada pelo
//    usuário nesta sessão (ver ATUALIZAÇÃO 02/09/2026 item 4) — reaproveitar a
//    ÚNICA técnica de orientação que o resto do jogo já usa (flip) é mais
//    honesto e mais consistente visualmente do que inventar uma linguagem
//    visual nova só pro overworld.
//
// 3) POR QUE FLIP ESQUERDA/DIREITA (não cima/baixo) BASTA PRA TODAS AS 4
//    DIREÇÕES DE TECLA, mesmo sem sprite vertical: nesta projeção 2:1
//    (gridToScreen: x=(col-row)*HALF_W, y=(col+row)*HALF_H), um passo puro num
//    ÚNICO eixo do grid (dc=±1,dr=0 OU dc=0,dr=±1— as 4 teclas de sempre) NUNCA
//    produz um vetor de TELA puramente vertical: screenDx=(dc-dr)*HALF_W é
//    sempre ±HALF_W (nunca 0) nesses 4 casos, então o sinal de screenDx já
//    resolve o flip sozinho pras 4 direções de tecla que sempre existiram aqui.
//    O caso screenDx==0 (tela puramente vertical) SÓ aparece com um passo
//    diagonal de verdade no grid (dc=dr=+1 ou dc=dr=-1, ver item 4) — regra (a)
//    do pedido do usuário ("dx==0 com dy≠0 → mantém a última orientação
//    horizontal") resolve exatamente esse caso, implementada em tryMove().
//
// 4) VETOR DE MOVIMENTO (dx,dy do pedido = dc,dr neste módulo, espaço de GRID —
//    x/y já é usado pra espaço de TELA em gridToScreen, então manter o nome
//    dc/dr evita ambiguidade): currentInputDelta() (antigo) só devolvia a
//    PRIMEIRA tecla de direção encontrada num `for...in` — segurar duas teclas
//    de eixos diferentes ao mesmo tempo (ex.: ArrowUp+ArrowRight) NUNCA produzia
//    diagonal, só a primeira. Substituído por currentInputVector(): soma cada
//    eixo (dc de A/D/setas, dr de W/S/setas) independentemente, então segurar
//    duas teclas de eixos diferentes agora produz dc E dr não-nulos no mesmo
//    passo — diagonal de grid de verdade, não simulada. Teclas opostas do MESMO
//    eixo seguradas juntas (ex. Up+Down) cancelam pro próprio eixo (v=0),
//    comportamento padrão de input 8-direcional. TOQUE: confirmado via busca
//    (nenhum handler touch/pointer neste arquivo) que o overworld não tem
//    controle de toque hoje — só teclado existe pra refatorar; adicionar toque
//    não foi pedido explicitamente aqui e fica fora de escopo desta passada.
//
// 5) S.facingDir/S.facingRight (substituem S.lastDir, que já existia mas nunca
//    era lido em lugar nenhum — dead code puro, o comentário original dizia
//    "pra desenhar o marcador virado pra algum lado" mas nada consumia isso;
//    drawGhostBillboard() desenhava sem NENHUM flip, direção nenhuma, sempre a
//    mesma pose). Atualizados SÓ dentro de tryMove(), SÓ quando o passo
//    realmente muda de tile (isWalkable já retornou true) — não no input cru.
//    Isto é a peça central do critério "nunca desliza": se a orientação
//    mudasse no keydown (intenção) em vez de no passo lógico bem-sucedido
//    (resultado real), um jogador segurando direção contra uma parede veria o
//    sprite virar sem o pé sair do lugar — dessincronia entre posição e rosto,
//    exatamente o "deslizar" que o critério de aceite proíbe. Nunca resetado
//    em nenhum outro lugar do módulo (nem em activateNow/spawn) — parar de
//    andar simplesmente para de chamar tryMove(), então facingDir/facingRight
//    retêm o último valor real, cumprindo o item 3 do pedido (pose idle mantém
//    a última orientação, não uma direção padrão) de graça, sem lógica extra.
//
// 6) ESCOPO: só o jogador LOCAL ganha flip nesta passada (drawGhostBillboard()
//    ganhou um parâmetro `facingRight` novo, mas o call site de OUTROS
//    jogadores passa `undefined` de propósito, preservando o desenho sem flip
//    de antes) — o payload de rede `overworld_players_update` não carrega
//    nenhum dado de orientação (mesma limitação já documentada no item 3 da
//    nota de arquitetura de 02/09/2026 sobre o sufixo "(#ID)"), e o pedido do
//    usuário fala em "controlador de input" e "o sprite do personagem", que é
//    o avatar controlado por este cliente. Dar a mesma orientação a jogadores
//    remotos exigiria inferir de deltas de posição de rede (dado que ATÉ
//    existe em S.otherPlayersDraw) ou mudar o payload do servidor — deixado
//    como possível trabalho futuro, não implementado aqui pra não expandir o
//    escopo pedido nem arriscar tocar em código de render compartilhado com o
//    agente que está mexendo em zoom/câmera no mesmo arquivo nesta sessão.
// ============================================================================
//
// ATUALIZAÇÃO 2026-09-03 (zoom + camadas de render, LOD) — pedido do usuário:
// zoom in/out escalando a matriz do canvas, camadas separadas (chão/POI/
// construções), regra de macro-visão (zoom out) e micro-visão (zoom in).
// Também corrigido um bug pré-existente que impedia qualquer teste (ver item 0).
//
// 0) BUG PRÉ-EXISTENTE CORRIGIDO, NÃO INTRODUZIDO NESTA PASSADA: loop() chamava
//    currentInputDelta(), função que não existe mais neste arquivo desde a
//    refatoração de vetor de movimento (bloco "input de movimento" acima, item
//    4) — foi renomeada pra currentInputVector() mas o call site em loop() não
//    foi atualizado junto. Efeito real: toda ativação do overworld lançava
//    ReferenceError dentro do callback de requestAnimationFrame já no 1º frame
//    (sem try/catch em volta, isso mata o loop inteiro — a linha final
//    `S.rafId = requestAnimationFrame(loop)` nunca era alcançada), ou seja: ZERO
//    frames desenhados depois de ActivateOverworld(). Confirmado com grep antes
//    de mexer (só existia definição de currentInputVector, nenhuma de
//    currentInputDelta). Corrigido só trocando o nome da chamada — ver comentário
//    inline em loop().
//
// 1) SEMÂNTICA DE S.zoomLevel — fator multiplicador (maior = zoom in, tiles
//    maiores; menor = zoom out, tiles menores), zoomLevel=1 idêntico ao
//    tamanho de sempre (TILE_W=64/TILE_H=32, zero regressão visual pra quem
//    não mexe no zoom). AMBIGUIDADE REAL com o texto do pedido, documentada em
//    detalhe junto às constantes ZOOM_* (perto de TILE_W/HALF_W, topo do
//    arquivo): o pedido descreve a regra de zoom-out como "ACIMA de um
//    S.zoomLevel limiar" e zoom-in como "ABAIXO" — o oposto da relação natural
//    de um FATOR MULTIPLICADOR da projeção (que é o que o próprio pedido pede
//    literalmente na frase anterior). Resolvido a favor da convenção universal
//    (Google Maps, Leaflet, câmera de qualquer engine: valor maior = mais
//    perto) — ver relatório desta sessão pro usuário confirmar se a intenção
//    original era a inversa.
//
// 2) INPUT: scroll do mouse (roda, `wheel` no canvas do overworld, não em
//    `window` — não captura scroll da página quando o overworld não está em
//    foco) + teclas '+'/'=' e '-'/'_' (mesmo padrão de robustez de layout que
//    AXIS_KEYS já usa pro WASD). As duas formas de input coexistem, sem
//    conflito (nenhuma tecla de zoom sobrepõe ALL_MOVE_KEYS). Ver
//    attachInput()/detachInput() — anexado/removido junto com o teclado de
//    movimento, mesmo ciclo de vida.
//
// 3) MATEMÁTICA MANTIDA CONSISTENTE, NÃO ctx.scale() GLOBAL: gridToScreen()
//    continua PURO (sem zoom embutido) de propósito — buildStreetPathsForChunk()
//    pré-calcula screenPts UMA VEZ por chunk (não por frame, otimização já
//    documentada antes desta mudança); se gridToScreen() multiplicasse por
//    S.zoomLevel, esses pontos ficariam presos ao zoom do momento do fetch e
//    nunca atualizariam depois. O zoom entra só em worldToScreen() (novo, logo
//    abaixo de gridToScreen), no último passo antes de desenhar — mesmo lugar
//    onde o offset de câmera (camOffsetX/Y) já era aplicado, só um fator a
//    mais. screenToGrid() (inverso) foi adicionado pro "critério de aceite
//    crítico" do pedido — investigado ANTES de escrever qualquer coisa: este
//    módulo não tem nenhuma interação de clique/toque hoje (grep confirmou
//    zero listener de mouse/pointer/touch antes desta passada), então não há
//    nenhuma conversão tela→grid existente que pudesse quebrar. A função existe
//    pronta pra quando um clique-em-POI for implementado, exposta read-only em
//    window.OverworldDebug.screenToGrid pra validação via console (ver
//    relatório).
//
// 4) TRÊS CAMADAS EXPLÍCITAS (item 2 do pedido): "chão" (drawStreetPavementFill
//    + drawStreetCurves, dentro do bloco marcado "CAMADA DE CHÃO" em render()),
//    "POI" (drawLandmarkGroundMarker + drawTower + drawTowerStreetLabel — fica
//    DENTRO do laço de depth-sort único, não uma passada isolada, porque a
//    torre é alta de verdade e precisa competir no sort com jogadores, skill
//    isometric-canvas-rendering §2) e "construções" (drawBuildingsLayer(), no-op
//    hoje — zero dado de prédio existe no projeto, ver comentário da própria
//    função). Cada uma só roda condicionalmente conforme isMacroZoom() — ver
//    item 5.
//
// 5) REGRA DE ZOOM OUT/IN (itens 3-4 do pedido): threshold ZOOM_MACRO_THRESHOLD
//    = 0.75 (raciocínio completo junto à constante). Em visão macro
//    (zoomLevel < threshold): para de desenhar preenchimento de pavimento
//    por-célula e a camada de construções (vazia hoje, mas o gate já existe);
//    a curva de rua fica visível mas SIMPLIFICADA (drawStreetCurves(...,
//    simplified=true) — 1 traço fino sem casing/halo/gradiente, ver função);
//    nome de rua individual desaparece, dá lugar a NOME DE BAIRRO por chunk
//    carregado (drawNeighbourhoodLabels(), lido de
//    manifest.json:chunks[].neighbourhood via S.manifestChunksByKey — dado que
//    já existia, só não era consumido em lugar nenhum antes); o beacon da
//    torre ganha um raio/blur fixo em px de tela em vez de escalar com o zoom
//    (fica relativamente MAIOR conforme o mundo encolhe ao redor — item 4b do
//    pedido, "considere aumentar tamanho/brilho relativo no zoom out"). Em
//    visão micro (zoomLevel >= threshold): comportamento de sempre, cada
//    elemento de mundo (rua, torre, sprite do fantasma) escala normalmente com
//    S.zoomLevel; rótulos de UI (nome de rua, nome da torre, HUD de debug)
//    continuam com fonte em px FIXO de tela em qualquer zoom (não encolhem/
//    crescem com o mundo) — decisão de legibilidade, documentada em cada
//    função de rótulo.
//
// 6) NÃO MEXI NO CONTROLADOR DE ORIENTAÇÃO DO JOGADOR: S.facingDir/
//    S.facingRight/tryMove() (bloco anterior a este) continuam exatamente como
//    estavam — a única mudança em código que os TOCA é a fórmula de POSIÇÃO de
//    desenho do jogador em render() (screenS3 em vez de s3.x+camOffsetX), que
//    LÊ S.facingRight sem alterá-lo, só passa o mesmo valor adiante pra
//    drawGhostBillboard(). Testado ao vivo movendo o fantasma em várias
//    direções em zoom in/out/intermediário — ver relatório desta sessão.
// ============================================================================
//
// ATUALIZAÇÃO 2026-09-03 (correção de flip + movimento contínuo em rua) — dois
// bugs/pedidos reais do usuário testados ao vivo. Documentado aqui porque os
// dois mexem exatamente no bloco que a nota anterior (item 6, acima) disse que
// NÃO seria tocado — mudou porque agora é este agente, com escopo explícito do
// usuário pra corrigir o flip e reescrever o controlador de movimento.
//
// 1) FLIP INVERTIDO — CAUSA RAIZ ENCONTRADA EM engine.js, NÃO NESTE ARQUIVO:
//    a suposição do bloco anterior (item 1, nota de 02/09) de que a pose CRUA
//    (sem espelhar) do sprite já é "direita" estava errada. Lido
//    js/game/engine.js:c_DeSoGhost.draw() linha a linha (~1214-1230): quando
//    this.face==1 (setado por moveRight, ~linha 1469 = jogador indo pra
//    DIREITA) e o sprite custom está pronto, o código ESPELHA (translate +
//    scale(-1,1)) antes de desenhar; quando face==2 (moveLeft = ESQUERDA),
//    desenha sem espelhar. Ou seja, pra este sprite específico (arquivo único
//    Ghosts/#id.png, sem uma segunda arte "olhando pro outro lado" — mesma
//    conclusão já registrada no item 1 da nota de 02/09), a pose crua já
//    OLHA PRA ESQUERDA; espelhar é que produz "direita". tryMove() setava
//    S.facingRight=true (sem espelhar) pro passo que anda pra DIREITA na tela
//    — exatamente o oposto do que engine.js já faz pro mesmo sprite. Corrigido
//    invertendo qual sinal produz true/false (função nova
//    updateFacingFromMoveVector(), ver comentário ali pro raciocínio completo)
//    — a técnica de desenho em si (drawGhostBillboard, translate+scale(-1,1))
//    já replicava certo o mesmo mecanismo de engine.js e não mudou.
//
// 2) MOVIMENTO CONTÍNUO EM RUA, RESTRITO A 2 DIREÇÕES — pedido do usuário:
//    numa rua (qualquer ângulo real, não só horizontal/vertical), o input
//    relevante colapsa pro par frente/trás ao longo do caminho local, e o
//    personagem desliza fluido (sem saltar de tile em tile) nessa direção.
//    Fora de rua, mantém o tryMove() discreto de sempre (150ms/tile) — sem
//    mudança nenhuma nesse caminho, só deixou de ser chamado incondicionalmente
//    a cada tick e passou a ser chamado pela nova updateMovement() só quando o
//    jogador NÃO está perto de nenhuma streetWay.
//
//    a) DADO: buildStreetPathsForChunk() ganhou dois campos novos por way —
//       `gridPts` (os mesmos pontos de `screenPts`, mas em espaço col/row
//       GLOBAL fracionário, não em pixel de tela) e `gridBbox` (bounding box
//       nesse mesmo espaço, pra descartar rápido ways longe do jogador antes
//       do loop caro ponto-a-ponto). `screenPts`/`bbox`/`name`/`highway`/
//       `lengthPx` (consumidos pela camada de render/rótulo) não mudaram nem
//       de valor nem de posição no objeto — adição pura, sem risco pro código
//       de desenho de rua/zoom que já lê essas ways.
//
//    b) "SOBRE UMA RUA" = a projeção ortogonal da posição atual do jogador
//       (S.playerDrawCol/Row, a posição VISUAL — não a lógica arredondada,
//       pra não haver um degrau de tolerância na fronteira de tile) sobre o
//       segmento mais próximo de QUALQUER streetWay carregada fica a
//       <= STREET_SNAP_RADIUS_TILES tiles de distância (findNearestStreetPoint()).
//       Valor escolhido: 1.1 tiles. Raciocínio: a nota de 03/09 (item 3, acima)
//       já documenta que o raster andável/bloqueado sofreu fechamento de gap
//       diagonal — algumas células ficam "1 passo da geometria real, não
//       sobre ela". Um raio menor que ~1 deixaria essas células promovidas
//       fora do modo contínuo (o jogador "cairia" pro modo discreto bem no
//       meio de uma rua real); 1.1 cobre esse caso com uma margem pequena sem
//       ficar tão largo a ponto de duas ruas paralelas próximas (ou uma rua e
//       uma calçada) colidirem no mesmo raio de captura.
//
//    c) TANGENTE E PROJEÇÃO: findNearestStreetPoint() devolve a tangente
//       UNITÁRIA (dCol,dRow normalizado) do segmento mais próximo. A cada
//       frame com input ativo, o vetor de input (currentInputVector(), já
//       existia) é NORMALIZADO (unitário mesmo na diagonal, dc/dr divididos
//       por hypot(dc,dr)) e projetado nessa tangente via produto escalar — o
//       resultado é o COSSENO do ângulo entre os dois, em [-1,1]. CORRIGIDO
//       EM TESTE AO VIVO (2026-09-03): a primeira versão usava só o SINAL
//       desse produto (velocidade PLENA sempre que não-zero) — bug real,
//       porque ruas de dado OSM real quase nunca são perfeitamente
//       horizontais/verticais (ex.: "Rua Waldir Cabral" é 176°, só 4° fora do
//       horizontal), então ATÉ UM INPUT ORTOGONAL (ArrowUp numa rua
//       quase-horizontal) tinha um produto escalar pequeno mas não-zero, e
//       disparava velocidade PLENA — o oposto de "cima/baixo não fazem nada
//       útil" pedido pelo usuário. Corrigido escalando a velocidade pelo
//       PRÓPRIO valor do cosseno (updateMovement(), não só pelo sinal): input
//       alinhado com a rua anda a velocidade plena (cosseno~1), input
//       perpendicular anda a ~0 (resíduo do desalinhamento real da rua,
//       imperceptível), ângulos intermediários andam proporcionalmente mais
//       devagar — |produto| <= STREET_INPUT_EPS ainda é o corte de "parado
//       de vez" (evita ruído de ponto-flutuante exatamente na ortogonalidade
//       matemática). Continua sendo o mecanismo inteiro de "só 2 direções"
//       sem nenhum código que "saiba" se a rua é horizontal/vertical/
//       diagonal — o mesmo cálculo funciona idêntico em qualquer ângulo real.
//
//    d) AVANÇO CONTÍNUO: S.playerContCol/Row (novo, float) é a posição
//       "verdadeira" enquanto S.onStreet===true, avançada por
//       tangente * (cosseno de alinhamento) * velocidade * dt a cada frame
//       (não mais em saltos de S.stepIntervalMs). Velocidade DE PICO (quando
//       o input está perfeitamente alinhado com a rua):
//       STREET_SPEED_TILES_PER_SEC = 1000/S.stepIntervalMs (~6.67 tiles/s) —
//       deliberadamente a MESMA velocidade média do sistema antigo (1
//       tile/150ms), só contínua em vez de discreta; documentado aqui em vez
//       de inventar um número novo porque preserva a sensação de ritmo já
//       testada/aprovada nesta sessão sem introduzir uma segunda constante de
//       velocidade pra manter em sincronia com a primeira. A cada avanço,
//       arredonda pra célula de grid
//       mais próxima e chama isWalkable() ANTES de commitar o passo — recusa
//       o avanço (posição contínua não muda) se a célula arredondada for
//       bloqueada, preservando colisão contra bloco mesmo em movimento
//       fracionário. S.playerCol/Row (a posição LÓGICA/autoritativa, mandada
//       pro servidor) só é reescrita quando o arredondamento da posição
//       contínua realmente MUDA de célula — nesse instante, dispara
//       updateChunkWindow()/syncPublicState()/checkPoiInteractions(), MESMO
//       trio que tryMove() já disparava, então streaming de chunk, POI/torre
//       e o payload de rede continuam funcionando sem nenhuma mudança nesses
//       três sistemas (só um novo call site chamando as mesmas funções).
//
//    e) TRANSIÇÃO SEM SALTO ENTRE OS DOIS MODOS: entrando no modo contínuo,
//       S.playerContCol/Row é ancorado na posição VISUAL atual (não numa
//       projeção exata sobre a linha, que puxaria o jogador lateralmente de
//       forma perceptível); saindo do modo contínuo, o sistema de lerp antigo
//       (S.playerPrevCol/Row + S.moveStartAt, consumido em render()) é
//       resetado pra origem==destino==posição atual, então o próximo passo
//       discreto começa sem nenhum salto visual. render() só executa o lerp
//       antigo quando !S.onStreet — quando S.onStreet, a posição desenhada já
//       foi escrita direto por updateMovement(), render() não sobrescreve.
//
//    f) ORIENTAÇÃO DO SPRITE TAMBÉM NO MODO CONTÍNUO: tryMove() nunca é
//       chamado enquanto o jogador segue uma rua, então a lógica de flip
//       (item 1 acima) precisava ser acessível dali também — extraída pra
//       updateFacingFromMoveVector(dc,dr), chamada tanto por tryMove() (passo
//       de grid inteiro) quanto por updateMovement() (direção contínua da
//       tangente * sinal do avanço), mesma regra "só atualiza quando o passo
//       realmente aconteceu" nos dois casos.
//
//    g) NÃO MUDOU: isWalkable(), checkPoiInteractions(), updateChunkWindow(),
//       syncPublicState(), o payload de rede (window.OverworldState, lido por
//       js/game/network.js), zoom/câmera/HUD/rótulos, e o tryMove() discreto
//       em si (só ganhou uma chamada a updateFacingFromMoveVector() no lugar
//       do cálculo inline de antes — mesmo resultado, só compartilhado com o
//       modo contínuo). Ver relatório desta sessão pra resultado de cada teste
//       ao vivo (a-f pedidos pelo usuário).
//
// ATUALIZAÇÃO 2026-09-03 "movimento livre contínuo" (senior-game-dev, pedido do
// usuário: "o deslizar do ghost pelas ruas tem que ser 100% fluido sem travas
// [...] analise a movimentação do personagem jogável e deixe 100% fluido") —
// eliminada a "trava" residual identificada na análise: FORA de rua, o
// movimento ainda usava o sistema antigo discreto (tryMove(), removido — 1
// tile inteiro a cada S.stepIntervalMs=150ms, gated por S.lastStepAt, com
// input só reavaliado na fronteira do tick; só a posição DESENHADA
// interpolava visualmente, a posição LÓGICA saltava). tryMove() foi removido;
// updateMovement() agora tem UM único controlador contínuo por-dt para os
// dois modos (rua e livre) — S.playerContCol/Row (float) é sempre a posição
// autoritativa, avançada a cada frame por PLAYER_SPEED_TILES_PER_SEC*dtSec,
// nunca mais em saltos de timer fixo. Ver bloco de constantes logo acima de
// findNearestStreetPoint() (mais abaixo neste arquivo) pro detalhe de cada
// decisão; resumo:
//   1) MESMA velocidade de pico (PLAYER_SPEED_TILES_PER_SEC=1000/stepIntervalMs)
//      nos dois modos — elimina o salto de velocidade na transição rua<->livre
//      (item 2 do pedido: verificado que o modo livre discreto ERA ~41% mais
//      rápido na diagonal que o modo rua, por somar dc/dr inteiros sem
//      normalizar — clássico "diagonal speed bug"; agora os dois normalizam o
//      vetor de input antes de multiplicar pela velocidade).
//   2) MAX_DT_SEC=0.1 clampa o dt processado por frame (aplicado em loop()) —
//      previne tunneling através de parede fina numa queda severa de FPS e a
//      "espiral da morte" de física por-dt sem teto.
//   3) "Wall slide" no modo livre: diagonal bloqueada numa quina desliza pelo
//      eixo isolado ainda livre, em vez de travar seco.
// Pesquisa aplicada (fontes completas no relatório desta sessão): Glenn
// Fiedler, "Fix Your Timestep!" (gafferongames.com) — integração por dt real e
// clamp de dt máximo; skills/physics_dt.md deste projeto ("Skill: Física
// Delta-Time, Sub-stepping e Colisão Swept AABB") §2 (acumulador/clamp) e §5
// (normalização de input 8-direções, o mesmo "diagonal 41% mais rápido"
// citado acima) — princípios de física por sub-step/dt real adaptados aqui
// pra movimento em GRADE 2D (sem gravidade nem AABB contínua, que seriam
// overkill pro overworld isométrico: colisão já é por-tile andável/bloqueado).
// render() não muda seu custo por frame (a posição desenhada já era escrita
// direto no modo rua; agora o modo livre também escreve direto, mesmo custo,
// sem lerp extra) — fps medido antes/depois no relatório desta sessão.
// ============================================================================

(function () {
    'use strict';

    // ---- Constantes de projeção (2:1 dimétrico, conforme a skill) ----------
    var TILE_W = 64;
    var TILE_H = 32;
    var HALF_W = TILE_W / 2;
    var HALF_H = TILE_H / 2;

    // ---- Ruas como curva (ver ATUALIZAÇÃO 2026-09-03 no topo do arquivo) --------
    // TILE_SIZE_M precisa bater com data/overworld/manifest.json:tile_size_m (10) —
    // é a mesma constante que tools/build-overworld-grid.js usa do lado do dado;
    // aqui só converte metro->pixel de tela pra largura de traço. Usa TILE_H (a
    // dimensão "vertical" da projeção 2:1, menos distorcida que TILE_W) como
    // referência de escala: PX_PER_METER = TILE_H / TILE_SIZE_M.
    // MOVIDO PRA CIMA DO BLOCO DE ZOOM (2026-09-03, Problema 3) — o novo cálculo de
    // ZOOM_MIN (abaixo) precisa de STREET_TILE_SIZE_M pra converter a extensão real
    // da cidade (metros, IBGE) em tiles; JS não faz hoisting de VALOR (só de
    // declaração), então a constante precisa existir ANTES de ser lida, não só
    // declarada antes — daí a troca de ordem dos dois blocos.
    var STREET_TILE_SIZE_M = 10;
    var STREET_PX_PER_METER = TILE_H / STREET_TILE_SIZE_M;
    var STREET_MIN_WIDTH_PX = 5; // piso visual pra vias finas (footway/steps) não sumirem
    // Mesmos halfwidths de tools/build-overworld-grid.js:HALFWIDTH_M (a classificação
    // walkable/blocked já usa esses números) — reaproveitados aqui só pra largura
    // VISUAL do traço, não pra reclassificar nada. Não redigitar sem revisar os dois
    // arquivos juntos se um mudar.
    var STREET_HALFWIDTH_M = {
        motorway: 11, trunk: 10, primary: 9, secondary: 8, tertiary: 7.5,
        unclassified: 6.5, residential: 6.5, living_street: 6, service: 5,
        pedestrian: 5.5, footway: 4, path: 3.5, steps: 3, track: 4, cycleway: 4
    };
    function streetWidthPx(highway) {
        var halfwidthM = STREET_HALFWIDTH_M[highway] || STREET_HALFWIDTH_M.residential;
        return Math.max(STREET_MIN_WIDTH_PX, halfwidthM * 2 * STREET_PX_PER_METER);
    }

    // ---- Zoom (adicionado 2026-09-03) ---------------------------------------
    // DECISÃO DE SEMÂNTICA — S.zoomLevel é um FATOR MULTIPLICADOR da projeção
    // (não um "nível de afastamento"), porque é isso que o pedido pede
    // literalmente ("multiplicando a projeção isométrica por um fator
    // S.zoomLevel"). Consequência direta e inevitável dessa escolha: quanto
    // MAIOR o valor, MAIOR cada tile fica na tela = mais perto/zoom IN; quanto
    // MENOR o valor, menor cada tile = mais longe/zoom OUT. zoomLevel=1 é o
    // tamanho "de sempre" (64x32px por tile, TILE_W/TILE_H acima, sem nenhuma
    // mudança visual pra quem nunca tocar no zoom) — importante pra não haver
    // regressão visual silenciosa em nenhuma sessão existente.
    //
    // AMBIGUIDADE REAL COM O TEXTO DO PEDIDO, DOCUMENTADA AQUI (ver relatório
    // final): o pedido descreve a regra de zoom-out como "ACIMA de um
    // S.zoomLevel limiar" e a de zoom-in como "ABAIXO do limiar" — o oposto da
    // semântica de fator multiplicador acima (nela, zoom-out = valor MENOR,
    // não maior). Interpretar "acima/abaixo" ao pé da letra exigiria inverter
    // a relação entre o número e o tamanho visual (dividir pela projeção em
    // vez de multiplicar), o que contradiz a MESMA frase do pedido logo antes
    // ("multiplicando a projeção... por um fator S.zoomLevel"). Resolvi a
    // contradição a favor da semântica matemática consistente (multiplicar
    // sempre; valor maior = zoom in), que é também a convenção universal de
    // qualquer motor/mapa (Google Maps, Leaflet, Phaser câmera.zoom etc.) —
    // documentado para o usuário revisar se a intenção original era a
    // inversa.
    //
    // ATUALIZAÇÃO 2026-09-03 (Problema 3 — "zoom out até ver Neo Nit inteira") —
    // ZOOM_MIN recalculado a partir da EXTENSÃO REAL de Niterói, não mais um
    // número redondo escolhido a dedo. Matemática completa (ver relatório desta
    // sessão pro raciocínio por extenso):
    //   1) Área real: 133,757 km² (IBGE 2025,
    //      https://www.ibge.gov.br/cidades-e-estados/rj/niteroi.html — mesmo
    //      número que o pedido do usuário já citava, ~134km²).
    //   2) SEM polígono de contorno real da cidade neste repo (não é escopo desta
    //      passada buscar/gerar um — ver "Não faça" do pedido, "não gere novos
    //      chunks de dado"), a única estimativa HONESTA possível é de ORDEM DE
    //      GRANDEZA: aproxima a área por um QUADRADO de mesma área (Niterói não é
    //      quadrada de verdade — litoral irregular, baía, maciço de Pendotiba —
    //      isto é só uma referência de ESCALA, documentado como tal, nunca uma
    //      geometria real). CITY_SIDE_M = sqrt(133.757e6) ≈ 11565m.
    //   3) Em tiles (manifest.json:tile_size_m = 10 = STREET_TILE_SIZE_M acima):
    //      CITY_EXTENT_TILES = 11565/10 ≈ 1156.5 tiles de lado.
    //   4) Bounding box de TELA (zoom=1) de uma área NxN nesta projeção 2:1 é
    //      N*TILE_W de largura por N*TILE_H de altura (ver gridToScreen: x vai de
    //      -N*HALF_W a +N*HALF_W, y de 0 a N*TILE_H) — então a cidade inteira
    //      ocuparia ≈1156.5*64=74016px de largura por ≈1156.5*32=37008px de
    //      altura, a zoom=1.
    //   5) Canvas de resolução TÍPICA deste jogo: 640x300 (atributo width/height
    //      real de #myCanvas, index.html:127 — resizeCanvasToContainer() espelha
    //      esse tamanho pro canvas do overworld). zoom necessário em CADA eixo pra
    //      a bounding box inteira caber: zoomX=640/74016≈0.00865,
    //      zoomY=300/37008≈0.00811 — usa o MENOR dos dois (mais restritivo, senão
    //      um dos eixos vaza pra fora do canvas) com 15% de margem (a cidade não
    //      deve encostar exatamente na borda da tela): 0.00811*0.85≈0.0069.
    // Resultado: ZOOM_MIN≈0.007 (calculado abaixo via CITY_FIT_ZOOM, não
    // hardcoded, pra ficar auditável/reprodutível caso a área do IBGE mude numa
    // futura revisão censitária). Isto é ~70x mais zoom-out que o ZOOM_MIN antigo
    // (0.5) — ver drawCityBackdrop()/isCityZoom() (perto de render()) pra como o
    // fato de só 3 chunks (~2,1km² de ~134km²) existirem hoje é tratado
    // VISUALMENTE nessa faixa extrema, em vez de fingir que o resto da cidade já
    // foi gerado.
    var CITY_AREA_KM2 = 133.757;
    var CITY_SIDE_M = Math.sqrt(CITY_AREA_KM2 * 1e6);
    var CITY_EXTENT_TILES = CITY_SIDE_M / STREET_TILE_SIZE_M;
    var CITY_CANVAS_W_TYPICAL = 640, CITY_CANVAS_H_TYPICAL = 300; // ver index.html:127 (#myCanvas width/height reais)
    var CITY_FIT_ZOOM_X = CITY_CANVAS_W_TYPICAL / (CITY_EXTENT_TILES * TILE_W);
    var CITY_FIT_ZOOM_Y = CITY_CANVAS_H_TYPICAL / (CITY_EXTENT_TILES * TILE_H);
    var CITY_FIT_ZOOM = Math.min(CITY_FIT_ZOOM_X, CITY_FIT_ZOOM_Y) * 0.85; // 15% de margem — ver item 5 acima

    var ZOOM_MIN = CITY_FIT_ZOOM;  // ≈0.007 — ver bloco de comentário acima pra matemática completa
    var ZOOM_MAX = 2.0;      // mais zoom in possível (tiles a 200%) — inalterado, fora de escopo do Problema 3
    var ZOOM_DEFAULT = 1.0;  // idêntico ao comportamento anterior a esta mudança
    // Limiar entre visão macro (zoom-out, §3 do pedido) e micro (zoom-in, §4).
    // Escolhido em 0.75 (não o meio exato 1.25 do intervalo [0.5,2.0], nem o
    // meio 1.0): o intervalo de zoom OUT útil é bem mais estreito que o de
    // zoom IN (de 1.0 a 0.5 é só uma oitava; de 1.0 a 2.0 também é uma oitava,
    // mas visualmente "zoom in" tem mais margem de leitura antes de precisar
    // trocar de estratégia de desenho). 0.75 fica bem no meio do MEIO-CAMINHO
    // logarítmico entre 0.5 e 1.0 (sqrt(0.5*1.0)≈0.707, arredondado pra 0.75
    // por simplicidade), ou seja: metade do range de zoom-out já mostra a
    // visão macro, dando espaço de sobra pra testar os dois modos com o
    // scroll. Ajustável sem quebrar nada — só este número. NÃO mudou com o
    // Problema 3 (continua fração do range [0.5,2.0] antigo, não do novo
    // [ZOOM_MIN,2.0] — ver ZOOM_CITY_THRESHOLD abaixo pro limiar novo, dentro
    // da faixa estendida, que controla a camada "Neo Nit" de cidade inteira).
    var ZOOM_MACRO_THRESHOLD = 0.75;
    // Limiar NOVO (Problema 3) dentro do range estendido de zoom-out — abaixo
    // dele, render() desenha a camada extra de "cidade inteira" (contorno +
    // rótulo "Neo Nit" + indicador de área não-explorada, ver
    // drawCityBackdrop()). Escolhido bem acima do novo ZOOM_MIN (não igual a
    // ele) pra dar uma faixa de transição visível ao usuário dando scroll —
    // 0.05 é ~7x o ZOOM_MIN novo (≈0.007) e ~15x menor que ZOOM_MACRO_THRESHOLD
    // (0.75), ou seja: bem dentro do território "macro" de sempre, mas só na
    // parte mais extrema dele.
    var ZOOM_CITY_THRESHOLD = 0.05;
    var ZOOM_WHEEL_FACTOR = 0.0016; // fator multiplicativo por unidade de deltaY da roda do mouse
    var ZOOM_KEY_STEP = 0.15;       // incremento por toque de tecla +/-

    function clampZoom(z) {
        return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    }
    // "Visão macro" = zoom out além do limiar (ver ZOOM_MACRO_THRESHOLD acima).
    function isMacroZoom() {
        return S.zoomLevel < ZOOM_MACRO_THRESHOLD;
    }
    // "Visão de cidade" (Problema 3) = zoom out além do novo limiar extremo — só
    // possível dentro do range estendido de ZOOM_MIN. Sempre implica isMacroZoom()
    // também verdadeiro (ZOOM_CITY_THRESHOLD < ZOOM_MACRO_THRESHOLD), então
    // render() pode continuar chamando as duas camadas juntas (bairro + cidade)
    // sem conflito — ver render().
    function isCityZoom() {
        return S.zoomLevel < ZOOM_CITY_THRESHOLD;
    }

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
    // DATA_VERSION (2026-09-03): os arquivos data/overworld/*.json não têm hash no
    // nome nem passam pelo bundler que cache-busta js/*.js (ver `?v=N` no <script> de
    // index.html) — sem query string própria, um servidor estático típico (inclusive
    // o http-server -c-1 usado em dev) pode aplicar cache HEURÍSTICO baseado só em
    // Last-Modified mesmo sem header Cache-Control explícito (RFC 7234), servindo uma
    // resposta antiga do disco do navegador sem nem revalidar com o servidor —
    // confirmado ao vivo nesta sessão: depois de regenerar os chunks/pois.json
    // (tools/build-overworld-grid.js), o navegador continuou servindo o `pois.json`
    // ANTIGO (torre em 42/42) por vários reloads, mesmo com o arquivo já correto no
    // disco/servidor. Mesma lógica de version-bump manual que overworld.js?v=N já
    // usa — sobe este número sempre que os dados de data/overworld/ mudarem de
    // verdade (regeração de chunk, reposição de POI etc.).
    var OVERWORLD_DATA_VERSION = 5; // bump 2026-09-03 (sessão "torre 2 linhas / rua rotacionada / zoom cidade"): pois.json ganhou visual.towerLabel ({main,sub} — torre em 2 linhas) — mesma prática documentada acima (cache heurístico do http-server sem query string própria já mordeu uma sessão anterior).
    var MANIFEST_URL = 'data/overworld/manifest.json?v=' + OVERWORLD_DATA_VERSION;
    // Estágio 2 do plano de overworld expansível (POI data-driven) — ver
    // C:\Users\Klara\.claude\plans\crystalline-launching-goose.md §4. Carregado em
    // paralelo ao manifesto no boot (loadPois(), abaixo de loadManifest()); os dois
    // precisam terminar antes do overworld ser considerado "pronto" — ver
    // finalizeLoadIfReady(). pois.json continua um arquivo ÚNICO (não por chunk, item 5
    // do pedido do Estágio 5) — não muda neste estágio.
    var POI_URL = 'data/overworld/pois.json?v=' + OVERWORLD_DATA_VERSION;

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
        // checkPoiInteractions() (ver updateMovement()) — NUNCA leia playerDrawCol/Row pra isso.
        // Estágio 5: cada chunk carrega seu PRÓPRIO originGlobalCol/Row (dentro do objeto
        // guardado em S.loadedChunks) — não existe mais um único par global pro módulo
        // inteiro (S.chunkOriginGlobalCol/Row do Estágio 3 saiu; ver chunkXYForGlobal).
        playerCol: 0,
        playerRow: 0,

        // ---- Posição DESENHADA (visual) do jogador local -----------------------
        // 2026-09-03 (unificação do movimento livre contínuo — ver ATUALIZAÇÃO
        // "movimento livre contínuo" no topo do arquivo): playerDrawCol/Row deixou
        // de ser um lerp discreto tile-a-tile (o antigo par playerPrevCol/Row +
        // moveStartAt + stepIntervalMs, removido) e passou a ser escrito DIRETO,
        // todo frame, a partir de S.playerContCol/Row (abaixo) em updateMovement()
        // — o mesmo mecanismo que já valia só pro modo "seguindo rua" agora vale
        // também fora de rua. render() só LÊ playerDrawCol/Row (pra câmera e
        // desenho), nunca mais escreve nele.
        playerDrawCol: 0,
        playerDrawRow: 0,
        camX: null,           // offset de câmera suavizado (screen-space). null = ainda não inicializado, força snap no próximo render — nunca desliza da posição da sessão/spawn anterior.
        camY: null,
        zoomLevel: ZOOM_DEFAULT, // fator multiplicador da projeção (ver bloco ZOOM_* acima) — 1 = tamanho de sempre, sem regressão visual até o usuário mexer no scroll/tecla.
        wheelHandler: null,      // referência pro listener de 'wheel' no canvas — anexado/removido junto com o teclado (attachInput/detachInput).
        lastRenderAt: 0,      // ts do frame anterior — só pra dt real da câmera (lerp independente de framerate).
        otherPlayersDraw: {}, // key (email||name) -> {prevCol,prevRow,targetCol,targetRow,drawCol,drawRow,moveStartAt} — mesmo tratamento de interpolação aplicado aos jogadores remotos. Duração aproximada por stepIntervalMs: o cliente não conhece o tick exato do broadcast do servidor (OVERWORLD_TICK_RATE vive em server/index.js) — formalizar isso é trabalho do Estágio 6 do plano, fora de escopo aqui.

        insidePoiIds: {},    // poi.id -> bool, borda de entrada por POI (Estágio 2, generaliza o
                              // antigo insideLandmark: dispara a interação só na transição fora->dentro)

        // ---- Orientação do avatar (ver ATUALIZAÇÃO 2026-09-03 item 5 no topo do
        // arquivo) — substitui o antigo S.lastDir (nunca lido por render()). Só
        // escrito em tryMove(), num passo que REALMENTE mudou de tile.
        facingDir: { dc: 0, dr: 1 },  // último vetor de GRID (dc,dr) que causou um passo bem-sucedido — guardado bruto, hoje só pra debug/futuro (render só consome facingRight).
        facingRight: true,            // flip esquerda/direita — ver updateFacingFromMoveVector() pro sentido real (CORRIGIDO 2026-09-03: true = SEM espelhar, que pra este sprite é a pose "olhando pra esquerda"; false = espelhado = "direita". Ver ATUALIZAÇÃO 2026-09-03 "correção de flip" no topo do arquivo). Default true = idêntico ao comportamento visual de antes de QUALQUER flip existir (sempre sem espelhar) até o primeiro passo real acontecer — não muda o que aparece na tela no instante do spawn, só o que passa a acontecer a partir do primeiro passo.

        // ---- Movimento contínuo (rua E livre — unificado 2026-09-03, ver
        // ATUALIZAÇÃO "movimento livre contínuo" no topo do arquivo) ------------
        onStreet: false,        // true enquanto o jogador está a <= STREET_SNAP_RADIUS_TILES de alguma streetWay — só decide COMO o vetor de avanço é calculado em updateMovement() (projetado na tangente da rua vs. direção livre normalizada); os dois modos são igualmente contínuos/por-dt desde a unificação. Nunca lido por isWalkable/rede/POI — só pelo controlador de movimento e pelo hook de debug (getMovementMode).
        playerContCol: 0,       // posição contínua (float) AUTORITATIVA da posição visual, SEMPRE (rua ou livre) — avançada por dt real em updateMovement(), nunca em saltos de tile. playerCol/Row (inteiro) é derivado dela via Math.round() só quando muda de célula (ver commitLogicalStepIfChanged()).
        playerContRow: 0,
        lastMoveAt: 0,          // ts (performance.now()) do loop() anterior — só pra dt real do avanço contínuo (independente de framerate, mesmo raciocínio de CAMERA_LERP_K/lastRenderAt, mas um relógio PRÓPRIO do controlador de movimento, não compartilhado com a câmera).

        isActive: false,
        rafId: null,

        canvas: null,
        ctx: null,
        zoomInBtn: null,   // Problema 3 (2026-09-03) — controles de zoom clicáveis, ver ensureZoomControls().
        zoomOutBtn: null,

        keys: {},          // teclas pressionadas agora
        // stepIntervalMs NÃO governa mais nenhum gate de passo do jogador local
        // desde a unificação 2026-09-03 (ver ATUALIZAÇÃO no topo do arquivo) — o
        // jogador local avança por dt real em todo frame, sem timer fixo. Mantido
        // só como a UNIDADE que define PLAYER_SPEED_TILES_PER_SEC (=1000/stepIntervalMs,
        // ~6.67 tiles/s — mesmo ritmo já testado/aprovado antes da unificação) e
        // que updateOtherPlayersDraw() ainda usa pra aproximar a duração do lerp
        // visual de jogadores REMOTOS (esses continuam discretos, tick de rede —
        // fora de escopo desta unificação, que é só o jogador local).
        stepIntervalMs: 150,

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
        // 2026-09-03 (dicas de tecla em interseção) — inspeção read-only dos nós de
        // interseção precomputados por chunk (buildIntersectionsForChunk), pra
        // confirmar via console contagem/branches sem precisar navegar até lá
        // visualmente pra achar um de verdade. Mesmo espírito de getMovementMode/
        // getFacing acima (só leitura, não muta nada).
        getIntersections: function (chunkKeyArg) {
            var chunk = S.loadedChunks[chunkKeyArg];
            return chunk ? chunk.intersections : null;
        },
        getCurrentChunk: function () { return { chunkX: S.currentChunkX, chunkY: S.currentChunkY }; },
        // 2026-09-03 — inspeção read-only da orientação do avatar (ver ATUALIZAÇÃO
        // 2026-09-03 no topo do arquivo), pra confirmar via console em teste ao vivo
        // que facingRight muda junto do vetor de movimento real, sem depender de
        // "parece certo" visualmente.
        getFacing: function () {
            return { dc: S.facingDir.dc, dr: S.facingDir.dr, facingRight: S.facingRight, playerCol: S.playerCol, playerRow: S.playerRow };
        },
        // 2026-09-03 (movimento contínuo em rua) — inspeção read-only do modo de
        // movimento atual, pra confirmar via console em teste ao vivo que
        // S.onStreet/posição contínua mudam do jeito certo ao entrar/sair de uma
        // rua, sem depender só de "parece certo" visualmente. Mesmo espírito de
        // getFacing/getZoom acima (só leitura, não muta nada).
        getMovementMode: function () {
            var nearest = findNearestStreetPoint(S.playerDrawCol, S.playerDrawRow);
            return {
                onStreet: S.onStreet,
                playerContCol: S.playerContCol,
                playerContRow: S.playerContRow,
                playerCol: S.playerCol,
                playerRow: S.playerRow,
                nearestStreetDist: nearest ? nearest.dist : null,
                snapRadiusTiles: STREET_SNAP_RADIUS_TILES
            };
        },
        // 2026-09-03 (zoom) — inspeção/teste read-only do zoom atual e da conversão
        // tela->grid (screenToGrid não é consumida por nenhum handler de clique hoje,
        // ver nota acima da função; exposta aqui pra poder validar via console que o
        // round-trip gridToScreen->tela->screenToGrid bate em qualquer nível de zoom).
        getZoom: function () {
            return { zoomLevel: S.zoomLevel, isMacro: isMacroZoom(), threshold: ZOOM_MACRO_THRESHOLD, min: ZOOM_MIN, max: ZOOM_MAX };
        },
        screenToGrid: function (screenX, screenY) { return screenToGrid(screenX, screenY); },
        setZoom: function (z) { S.zoomLevel = clampZoom(z); }
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

    // Converte `streetWays` (col/row FRACIONÁRIO, local ao chunk — ver
    // tools/build-overworld-grid.js) pra coordenada GLOBAL + tela, uma única vez no
    // carregamento do chunk (não a cada frame, ver ATUALIZAÇÃO 2026-09-03 item 2).
    // Cada way vira {name, highway, screenPts: [{x,y}...], bbox: {...}, lengthPx}.
    // `lengthPx` (soma das distâncias entre pontos consecutivos em tela) só serve pra
    // escolher, entre vários segmentos do MESMO nome visíveis num frame, qual deles
    // ganha o rótulo (o mais longo) — ver render()/drawStreetCurves().
    //
    // CAMPOS NOVOS 2026-09-03 (movimento contínuo em rua, ver ATUALIZAÇÃO no topo do
    // arquivo): `gridPts` (mesmos pontos de `screenPts`, mas em espaço col/row GLOBAL
    // fracionário — o espaço que findNearestStreetPoint()/updateMovement() precisam
    // pra achar tangente local, não pixel de tela) e `gridBbox` (bbox nesse mesmo
    // espaço, pra descartar rápido ways longe do jogador). Adição pura — nenhum campo
    // consumido pelo desenho de rua/zoom (screenPts/bbox/name/highway/lengthPx) mudou
    // de forma ou de valor.
    function buildStreetPathsForChunk(streetWays, originGlobalCol, originGlobalRow) {
        if (!Array.isArray(streetWays)) return [];
        var out = [];
        for (var i = 0; i < streetWays.length; i++) {
            var w = streetWays[i];
            if (!w || !Array.isArray(w.points) || w.points.length < 2) continue;
            var screenPts = new Array(w.points.length);
            var gridPts = new Array(w.points.length);
            var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            var minCol = Infinity, maxCol = -Infinity, minRow = Infinity, maxRow = -Infinity;
            var lengthPx = 0;
            for (var p = 0; p < w.points.length; p++) {
                var globalCol = originGlobalCol + w.points[p][0];
                var globalRow = originGlobalRow + w.points[p][1];
                gridPts[p] = { col: globalCol, row: globalRow };
                if (globalCol < minCol) minCol = globalCol; if (globalCol > maxCol) maxCol = globalCol;
                if (globalRow < minRow) minRow = globalRow; if (globalRow > maxRow) maxRow = globalRow;
                var s = gridToScreen(globalCol, globalRow);
                screenPts[p] = s;
                if (s.x < minX) minX = s.x; if (s.x > maxX) maxX = s.x;
                if (s.y < minY) minY = s.y; if (s.y > maxY) maxY = s.y;
                if (p > 0) lengthPx += Math.hypot(s.x - screenPts[p - 1].x, s.y - screenPts[p - 1].y);
            }
            out.push({
                name: w.name || null,
                highway: w.highway,
                screenPts: screenPts,
                gridPts: gridPts,
                gridBbox: { minCol: minCol, maxCol: maxCol, minRow: minRow, maxRow: maxRow },
                bbox: { minX: minX, maxX: maxX, minY: minY, maxY: maxY },
                lengthPx: lengthPx
            });
        }
        return out;
    }

    // ==================== Interseções de rua (dicas de tecla) ====================
    // Pedido do usuário 2026-09-03: "sempre que o ghost chegar a uma interseção de
    // ruas deve aparecer... as teclas que deve clicar para cada caminho". Não existe
    // grafo de interseções pré-computado no dado (streetWays é só a polilinha bruta
    // do OSM, por way, sem noção de onde vias se tocam) — construído aqui, UMA VEZ
    // por chunk carregado (mesmo padrão de performance de buildStreetPathsForChunk
    // acima: nunca refeito por frame, só quando um chunk novo entra em
    // S.loadedChunks via ensureChunkLoaded).
    //
    // PREMISSA (documentada, não redescoberta a cada leitura do arquivo): dado OSM
    // real corta cada via em ways separadas exatamente em CADA nó real de junção —
    // ou seja, um cruzamento real quase sempre coincide com uma EXTREMIDADE de way
    // no dado bruto (primeiro ou último gridPt), não com o meio de um segmento.
    // Por isso a detecção abaixo cobre dois formatos:
    //   1) Duas (ou mais) extremidades de ways DIFERENTES caindo (quase) no mesmo
    //      ponto global — cruzamento em X/+/T onde todas as vias terminam ali.
    //   2) Uma extremidade de via A caindo no INTERIOR de um segmento de via B, que
    //      só está "passando por cima" sem cortar ali — cruzamento em T clássico
    //      (via B contribui DOIS ramos, um em cada sentido ao longo dela).
    // Cruzamento em X onde NENHUMA das duas vias termina ali (duas ways cruzando
    // sem nó OSM comum) não é tratado — não observado nos 3 chunks reais existentes
    // hoje (conferido nos dados), fora de escopo desta passada.
    //
    // LIMITAÇÃO DE FRONTEIRA (aceita pra esta passada, documentada em vez de
    // resolvida): só enxerga ways do PRÓPRIO chunk. Um nó de interseção bem na
    // costura entre dois chunks fica com ramos incompletos (só os do chunk local,
    // o outro chunk nem é consultado aqui) — mesclar grafos entre chunks vizinhos
    // fica fora de escopo agora (só 3 chunks existem hoje, nenhuma interseção real
    // cai exatamente na costura entre eles nos dados atuais).
    var INTERSECTION_NODE_SNAP_TILES = 1.0; // tolerância pra considerar 2 extremidades de ways diferentes "o mesmo nó" — mesma ordem de grandeza de STREET_SNAP_RADIUS_TILES (ver bloco de constantes de movimento, mais abaixo no arquivo)
    var INTERSECTION_COLINEAR_DOT = -0.9; // 2 ramos com produto escalar abaixo disto (quase exatamente opostos) = via reta cortada em 2 osmIds — não é uma escolha real de caminho, não conta como cruzamento navegável (regra pedida explicitamente)
    var INTERSECTION_HINT_RADIUS_TILES = 7; // raio de proximidade (tiles) em que os rótulos de tecla começam a aparecer
    var INTERSECTION_HINT_FADE_TILES = 2.5; // faixa (tiles), medida de dentro pra fora do raio acima, em que o alpha vai de 1 a 0 — "fade in/out, não popup abrupto" (pedido explícito)
    var INTERSECTION_BRANCH_LABEL_OFFSET_TILES = 1.6; // distância do nó, ao longo do ramo, onde o rótulo é ancorado — perto do INÍCIO do ramo, não no meio da rua (pedido explícito)

    // Acha, na polilinha `gp`, um ponto cuja projeção caia no INTERIOR real de algum
    // segmento (t estritamente entre os dois extremos, com uma margem de 1% pra não
    // recontar a própria extremidade do segmento — essa já é coberta pelo
    // clustering de extremidades em buildIntersectionsForChunk) e esteja a `tol` ou
    // menos de (col,row). Mesma matemática ponto-segmento de findNearestStreetPoint
    // (mais abaixo no arquivo), só que aqui devolve a TANGENTE local em vez da
    // distância — usado só pra achar o "ramo que passa por cima" de um T-junction.
    function segmentInteriorHit(gp, col, row, tol) {
        if (!gp || gp.length < 2) return null;
        var tolSq = tol * tol;
        for (var s = 0; s < gp.length - 1; s++) {
            var ax = gp[s].col, ay = gp[s].row, bx = gp[s + 1].col, by = gp[s + 1].row;
            var vx = bx - ax, vy = by - ay;
            var lenSq = vx * vx + vy * vy;
            if (lenSq < 1e-9) continue;
            var t = ((col - ax) * vx + (row - ay) * vy) / lenSq;
            if (t <= 0.01 || t >= 0.99) continue; // perto de uma extremidade do segmento — não é "interior", pula (evita duplicar ramo já coberto pelo clustering de extremidades)
            var px = ax + vx * t, py = ay + vy * t;
            var dx = col - px, dy = row - py;
            if (dx * dx + dy * dy <= tolSq) {
                var len = Math.sqrt(lenSq);
                return { dirCol: vx / len, dirRow: vy / len };
            }
        }
        return null;
    }

    // Constrói a lista de nós de interseção NAVEGÁVEL de um chunk, a partir do
    // `streetPaths` já convertido (buildStreetPathsForChunk). Devolve
    // [{col,row,branches:[{dirCol,dirRow}, ...]}] em coordenada GLOBAL fracionária
    // (mesmo espaço de gridPts) — cada branch já é um vetor unitário em espaço de
    // GRID (não de tela), pronto pra virar rótulo de tecla via keyLabelForDirection.
    function buildIntersectionsForChunk(streetPaths) {
        var tol = INTERSECTION_NODE_SNAP_TILES;
        var tolSq = tol * tol;

        // 1) extremidades de cada way, com a tangente que sai delas PRA DENTRO da
        // via (mesma convenção de sinal que já não importa em updateMovement: só a
        // direção física do ramo, usada aqui só pra rotular tecla).
        var endpoints = [];
        for (var i = 0; i < streetPaths.length; i++) {
            var gp = streetPaths[i].gridPts;
            if (!gp || gp.length < 2) continue;
            endpoints.push(makeEndpointTangent(i, gp[0], gp[1]));
            var n = gp.length;
            endpoints.push(makeEndpointTangent(i, gp[n - 1], gp[n - 2]));
        }
        function makeEndpointTangent(wayIdx, at, towards) {
            var dc = towards.col - at.col, dr = towards.row - at.row;
            var len = Math.hypot(dc, dr) || 1;
            return { wayIdx: wayIdx, col: at.col, row: at.row, dirCol: dc / len, dirRow: dr / len };
        }

        // 2) clusteriza extremidades próximas entre si (cada extremidade entra no
        // primeiro cluster cujo centroide atual esteja a `tol` ou menos, senão abre
        // cluster novo). O(n²) mas n é pequeno (~100-300 extremidades por chunk),
        // rodado só 1x por chunk carregado — mesmo raciocínio de custo aceito que
        // findNearestStreetPoint já documenta pro laço por-frame dele, só que este
        // aqui roda MUITO menos vezes ainda.
        var clusters = [];
        for (var e = 0; e < endpoints.length; e++) {
            var ep = endpoints[e];
            var found = null;
            for (var c = 0; c < clusters.length; c++) {
                var cl = clusters[c];
                var ddc = ep.col - cl.col, ddr = ep.row - cl.row;
                if (ddc * ddc + ddr * ddr <= tolSq) { found = cl; break; }
            }
            if (found) {
                found.endpoints.push(ep);
                var n2 = found.endpoints.length; // recentraliza pela média — deixa o cluster "andar" pro centro real da junção conforme mais extremidades entram
                found.col = (found.col * (n2 - 1) + ep.col) / n2;
                found.row = (found.row * (n2 - 1) + ep.row) / n2;
            } else {
                clusters.push({ col: ep.col, row: ep.row, endpoints: [ep] });
            }
        }

        // 3) monta os ramos de cada cluster: 1 por extremidade agrupada, + 2 por
        // via que só "passa por cima" (T-junction, via segmentInteriorHit) sem ter
        // a própria extremidade neste cluster. Culling por gridBbox antes do
        // check ponto-segmento caro — mesmo padrão de findNearestStreetPoint.
        var result = [];
        for (var ci = 0; ci < clusters.length; ci++) {
            var cluster = clusters[ci];
            var branches = [];
            var waysAtNode = {};
            for (var b = 0; b < cluster.endpoints.length; b++) {
                branches.push({ dirCol: cluster.endpoints[b].dirCol, dirRow: cluster.endpoints[b].dirRow });
                waysAtNode[cluster.endpoints[b].wayIdx] = true;
            }
            for (var w = 0; w < streetPaths.length; w++) {
                if (waysAtNode[w]) continue;
                var way = streetPaths[w];
                var gb = way.gridBbox;
                if (gb && (cluster.col < gb.minCol - tol || cluster.col > gb.maxCol + tol ||
                    cluster.row < gb.minRow - tol || cluster.row > gb.maxRow + tol)) continue;
                var hit = segmentInteriorHit(way.gridPts, cluster.col, cluster.row, tol);
                if (hit) {
                    branches.push({ dirCol: hit.dirCol, dirRow: hit.dirRow });
                    branches.push({ dirCol: -hit.dirCol, dirRow: -hit.dirRow });
                }
            }
            // Filtro (regra pedida explicitamente): <2 ramos = ponta solta, não é
            // cruzamento. Exatamente 2 ramos quase opostos (produto escalar bem
            // negativo) = via reta só cortada em 2 osmIds — não é escolha real de
            // caminho, o jogador nem percebe que trocou de way ali.
            if (branches.length < 2) continue;
            if (branches.length === 2) {
                var dot = branches[0].dirCol * branches[1].dirCol + branches[0].dirRow * branches[1].dirRow;
                if (dot < INTERSECTION_COLINEAR_DOT) continue;
            }
            result.push({ col: cluster.col, row: cluster.row, branches: branches });
        }
        return result;
    }

    // Rotula uma direção (dc,dr) em espaço de GRID com a tecla (ou combinação de 2
    // teclas) mais próxima, arredondando pro OCTANTE mais próximo (4 cardeais + 4
    // diagonais) em vez de tentar mapear QUALQUER ângulo pra uma combinação
    // genérica — decisão de simplicidade explicitamente permitida pelo pedido:
    // ramos de rua real (dado OSM bruto) raramente são cardinais/diagonais
    // perfeitos, então "a tecla mais parecida" já comunica a intenção sem exigir
    // do jogador um input em ângulo exato que nem a própria projeção de rua em
    // updateMovement() exige (ali o cosseno tolera desalinhamento, aqui a UI só
    // mostra a melhor aproximação discreta). MESMA convenção de eixos de
    // AXIS_KEYS (mais abaixo no arquivo): dr negativo=Norte(Up/W), dr
    // positivo=Sul(Down/S), dc negativo=Oeste(Left/A), dc positivo=Leste(Right/D).
    var KEY_OCTANTS = [
        { dc: 0, dr: -1, label: '↑' },          // N  (ArrowUp / W)
        { dc: 1, dr: -1, label: '↑+→' },   // NE (ArrowUp+ArrowRight)
        { dc: 1, dr: 0, label: '→' },           // E  (ArrowRight / D)
        { dc: 1, dr: 1, label: '↓+→' },    // SE (ArrowDown+ArrowRight)
        { dc: 0, dr: 1, label: '↓' },           // S  (ArrowDown / S)
        { dc: -1, dr: 1, label: '↓+←' },   // SW (ArrowDown+ArrowLeft)
        { dc: -1, dr: 0, label: '←' },          // W  (ArrowLeft / A)
        { dc: -1, dr: -1, label: '↑+←' }   // NW (ArrowUp+ArrowLeft)
    ];
    (function normalizeKeyOctants() { // pré-normaliza uma vez — evita sqrt(2) repetido no hot path de render
        for (var i = 0; i < KEY_OCTANTS.length; i++) {
            var o = KEY_OCTANTS[i];
            var len = Math.hypot(o.dc, o.dr);
            o.ndc = o.dc / len; o.ndr = o.dr / len;
        }
    })();
    function keyLabelForDirection(dc, dr) {
        var len = Math.hypot(dc, dr);
        if (len < 1e-9) return null;
        var ndc = dc / len, ndr = dr / len;
        var best = null, bestDot = -Infinity;
        for (var i = 0; i < KEY_OCTANTS.length; i++) {
            var o = KEY_OCTANTS[i];
            var dot = ndc * o.ndc + ndr * o.ndr;
            if (dot > bestDot) { bestDot = dot; best = o; }
        }
        return best.label;
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
        fetch(manifestEntry.file + '?v=' + OVERWORLD_DATA_VERSION) // ver nota de OVERWORLD_DATA_VERSION acima
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
                // ver ATUALIZAÇÃO 2026-09-03 item 2 no topo do arquivo — geometria real
                // de rua preservada por way, convertida uma única vez aqui (não a cada
                // frame) pra coordenada global + tela.
                var streetPaths = buildStreetPathsForChunk(data.streetWays, originCol, originRow);
                S.loadedChunks[key] = {
                    rows: rows,
                    dim: rows.length,
                    originGlobalCol: originCol,
                    originGlobalRow: originRow,
                    chunkX: chunkX,
                    chunkY: chunkY,
                    streetPaths: streetPaths,
                    // dicas de tecla em interseção (pedido 2026-09-03) — precomputado
                    // aqui junto com streetPaths, mesmo ciclo de vida (1x por chunk
                    // carregado), ver buildIntersectionsForChunk acima.
                    intersections: buildIntersectionsForChunk(streetPaths)
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

    // CORREÇÃO 2026-09-03 (achada em teste ao vivo, ver ATUALIZAÇÃO "movimento
    // contínuo em rua" no topo do arquivo) — distância (0 se já dentro) do ponto
    // (col,row) até o footprint de POI mais próximo, usada por updateMovement()
    // pra decidir se a restrição "só 2 direções" da rua deve ser IGNORADA perto de
    // um POI. Achado real: pois.json:defaultSpawn (42,41, ao lado da porta da
    // torre) fica a nearestStreetDist=0.34 tiles da própria rua — bem DENTRO do
    // raio de captura (STREET_SNAP_RADIUS_TILES=1.1) — mas a 1 tile exato da borda
    // do footprint da torre (col42, footprint até col41). Testado ao vivo: um
    // jogador parado no spawn, seguindo só a tangente da rua (quase N-S ali),
    // NUNCA consegue dar o passo puramente lateral (oeste) que a porta exige —
    // trava, sem conseguir entrar na torre. Sem isto, "os últimos passos até a
    // porta... mantenha o movimento livre" (pedido explícito do usuário) fica
    // quebrado bem no ÚNICO lugar em que isso importa de verdade.
    function nearestPoiFootprintDist(col, row) {
        if (!S.pois) return Infinity;
        var best = Infinity;
        for (var i = 0; i < S.pois.length; i++) {
            var poi = S.pois[i];
            var b = poi && poi._bounds;
            if (!b) continue;
            var dc = Math.max(b.minCol - col, 0, col - b.maxCol);
            var dr = Math.max(b.minRow - row, 0, row - b.maxRow);
            var d = Math.sqrt(dc * dc + dr * dr); // 0 se (col,row) já está dentro do footprint
            if (d < best) best = d;
        }
        return best;
    }

    // ============================ Projeção ====================================
    // gridToScreen() continua DE PROPÓSITO sem nenhum fator de zoom embutido —
    // é "espaço de mundo" (pixels na escala base TILE_W/TILE_H), não "espaço de
    // tela". Motivo: buildStreetPathsForChunk() usa gridToScreen() pra
    // pré-calcular screenPts UMA VEZ no carregamento de cada chunk (comentário
    // original acima daquela função, "não a cada frame" — otimização real,
    // ~100 ways/chunk). Se gridToScreen() multiplicasse por S.zoomLevel, esses
    // pontos pré-calculados ficariam PRESOS ao zoom vigente no momento do
    // fetch e nunca se atualizariam quando o jogador desse scroll depois —
    // bug sutil, só apareceria ao testar zoom com um chunk já carregado antes
    // de mexer no scroll. Por isso o zoom entra só em worldToScreen() (abaixo),
    // no ÚLTIMO passo antes de desenhar, igual a câmera (camOffsetX/Y) já
    // fazia — mesmo padrão, um fator a mais.
    function gridToScreen(col, row) {
        return {
            x: (col - row) * HALF_W,
            y: (col + row) * HALF_H
        };
    }

    // Converte um ponto em "espaço de mundo" (saída de gridToScreen, ou
    // qualquer pixel na escala base) pra "espaço de tela" (o que realmente vai
    // pro canvas): aplica o zoom e DEPOIS o offset de câmera (câmera é sempre
    // em pixels de tela já pós-zoom — ver render(), camTargetX/Y calculados
    // com o mesmo fator). Ordem importa: zoom primeiro, offset depois, senão a
    // câmera "deslizaria" de posição toda vez que o zoom mudasse.
    function worldToScreen(worldX, worldY, camOffsetX, camOffsetY) {
        return {
            x: worldX * S.zoomLevel + camOffsetX,
            y: worldY * S.zoomLevel + camOffsetY
        };
    }

    // Inverso de worldToScreen()+gridToScreen() juntos: de um ponto em pixels
    // de TELA (ex.: e.offsetX/offsetY de um clique, relativo ao canvas do
    // overworld) devolve a célula de GRID (col,row) mais próxima, considerando
    // o zoom e a câmera atuais. Ver ATUALIZAÇÃO no topo do arquivo e o
    // relatório desta sessão: investigado e confirmado que este módulo NÃO TEM
    // nenhuma interação de clique/toque hoje (nenhum listener de
    // mouse/pointer/touch existia antes desta passada, nem foi adicionado
    // aqui — fora de escopo). Esta função existe só como o "critério de
    // aceite crítico" pedido (conversão tela<->grid tem que continuar correta
    // em qualquer zoom) — pronta pra quando alguém implementar clique-em-POI
    // no futuro, sem precisar redescobrir a matemática. Testada via
    // window.OverworldDebug.screenToGrid em pelo menos 2 zooms diferentes
    // fazendo round-trip com gridToScreen (ver relatório).
    function screenToGrid(screenX, screenY) {
        var camOffsetX = (S.camX !== null) ? S.camX : 0;
        var camOffsetY = (S.camY !== null) ? S.camY : 0;
        var worldX = (screenX - camOffsetX) / S.zoomLevel;
        var worldY = (screenY - camOffsetY) / S.zoomLevel;
        // inverso de gridToScreen: x=(col-row)*HALF_W, y=(col+row)*HALF_H
        var col = (worldX / HALF_W + worldY / HALF_H) / 2;
        var row = (worldY / HALF_H - worldX / HALF_W) / 2;
        return { col: Math.round(col), row: Math.round(row) };
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
        ensureZoomControls();
        return canvas;
    }

    // ============================ Controles de Zoom (UI) ========================
    // Problema 3 (2026-09-03) — a LÓGICA de zoom já existia inteira (S.zoomLevel,
    // clampZoom(), ZOOM_KEY_STEP, scroll do mouse e teclas +/-/- em attachInput(), ver
    // bloco de constantes ZOOM_* no topo do arquivo) — o que faltava era um controle
    // CLICÁVEL de verdade na tela: nem todo dispositivo de entrada tem scroll de mouse
    // confortável, e o overworld não tem NENHUM handler de toque hoje (confirmado por
    // grep antes desta passada, mesma lacuna já documentada no bloco "input de
    // movimento" no topo do arquivo) — um botão físico também é o único caminho de
    // zoom que já funciona pronto se/quando suporte a toque for adicionado depois. Os
    // dois handlers abaixo só CHAMAM clampZoom(S.zoomLevel ± ZOOM_KEY_STEP) — o MESMO
    // incremento e os MESMOS limites [ZOOM_MIN,ZOOM_MAX] que as teclas +/- já usam
    // (ver attachInput()) — nenhuma lógica de zoom nova foi escrita aqui.
    //
    // Criados em runtime (mesmo padrão do próprio canvas do overworld — ver
    // ensureCanvas() acima e a nota de arquitetura no topo do arquivo, item 2: "zero
    // edição em index.html/engine.js") — inseridos dentro do MESMO .canvas-container
    // (que já é position:relative, empilha outros elementos absolutos por cima do
    // myCanvas: cutsceneGif, gameScreenModeBtn, muteBtn). Escondidos por padrão
    // (display:none, mesmo estado inicial do próprio canvas do overworld) e só
    // aparecem/funcionam junto com ele — activateNow()/DeactivateOverworld() alternam
    // os três (canvas + 2 botões) juntos, porque zoom só faz sentido dentro do
    // overworld (o Episódio 1 usa g_ctx/myCanvas direto, sem noção de zoom).
    //
    // POSIÇÃO: canto SUPERIOR ESQUERDO do canvas (top:10px/left:10px, empilhados) —
    // deliberadamente do lado OPOSTO de #gameScreenModeBtn/#muteBtn (ambos top-right,
    // ver index.html) pra não competir com eles, e longe do D-pad
    // (#mobileControlsContainer só ocupa espaço quando visível — abaixo de 768px de
    // largura, ver css/style.css — e nesse ponto vira position:static ABAIXO do
    // canvas inteiro, nunca sobrepondo o canto superior). z-index 60: acima do canvas
    // do overworld (zIndex '50', ver ensureCanvas) pra ser clicável, abaixo de
    // modais/HUD reais (.overlay-panel=100, #gameScreenModeBtn=1000) pra nunca tampar
    // um painel aberto por cima.
    var ZOOM_BTN_CSS_BASE = 'position:absolute; width:32px; height:32px; z-index:60; ' +
        'background: rgba(13, 13, 16, 0.85); border: 1.5px solid var(--cyan-neon); ' +
        'color: var(--cyan-neon); cursor: pointer; border-radius: 4px; ' +
        'box-shadow: 0 0 10px rgba(0, 255, 255, 0.25); font-family: "Courier New", monospace; ' +
        'font-size: 18px; font-weight: bold; line-height: 1; padding: 0; ' +
        'align-items: center; justify-content: center; transition: all 0.15s ease-in-out;';

    // Mesmo padrão hover que gameScreenModeBtn/muteBtn já usam em index.html (inline
    // onmouseover/onmouseout) — replicado via addEventListener aqui porque este botão
    // é criado em JS, não HTML, mas o resultado visual é idêntico (mesma paleta
    // neon/glassmorphism do resto do HUD).
    function styleZoomBtnHover(btn) {
        btn.addEventListener('mouseover', function () {
            btn.style.background = 'var(--cyan-neon)';
            btn.style.color = '#000';
            btn.style.boxShadow = '0 0 15px var(--cyan-neon)';
        });
        btn.addEventListener('mouseout', function () {
            btn.style.background = 'rgba(13, 13, 16, 0.85)';
            btn.style.color = 'var(--cyan-neon)';
            btn.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.25)';
        });
    }

    function ensureZoomControls() {
        if (S.zoomInBtn && S.zoomOutBtn) return;
        var container = S.canvas && S.canvas.parentElement;
        if (!container) return;

        var inBtn = document.createElement('button');
        inBtn.id = 'overworldZoomInBtn';
        inBtn.type = 'button';
        inBtn.title = 'Zoom in (tecla +)';
        inBtn.textContent = '+';
        inBtn.style.cssText = ZOOM_BTN_CSS_BASE + ' top:10px; left:10px; display:none;';
        styleZoomBtnHover(inBtn);
        inBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // MESMA lógica de attachInput() pra tecla '+'/'=' — só reusada aqui via clique.
            S.zoomLevel = clampZoom(S.zoomLevel + ZOOM_KEY_STEP);
        });

        var outBtn = document.createElement('button');
        outBtn.id = 'overworldZoomOutBtn';
        outBtn.type = 'button';
        outBtn.title = 'Zoom out (tecla -)';
        outBtn.textContent = String.fromCharCode(8722); // '−' (minus sign) — mais legível que hífen no tamanho do botão
        outBtn.style.cssText = ZOOM_BTN_CSS_BASE + ' top:48px; left:10px; display:none;';
        styleZoomBtnHover(outBtn);
        outBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // MESMA lógica de attachInput() pra tecla '-'/'_' — só reusada aqui via clique.
            S.zoomLevel = clampZoom(S.zoomLevel - ZOOM_KEY_STEP);
        });

        container.appendChild(inBtn);
        container.appendChild(outBtn);
        S.zoomInBtn = inBtn;
        S.zoomOutBtn = outBtn;
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
    // Estágio "torre paralela à rua" (Problema 2, 2026-09-03) — generalização: o desenho
    // de fato (as 2 paredes + teto) agora vive aqui, recebendo os 4 CANTOS da base já em
    // coordenadas de tela (T=canto mais longe da câmera, R/L=cantos laterais, B=canto mais
    // perto da câmera — mesma convenção/ordem que o antigo cálculo T/R/B/L de
    // drawExtrudedDiamond usava, só que agora aceita cantos arbitrários em vez de só um
    // diamante eixo-alinhado a partir de cx,cy,hw,hh). drawExtrudedDiamond (abaixo) vira um
    // wrapper fino que calcula os 4 cantos do jeito ANTIGO (eixo-alinhado) e delega pra cá —
    // drawBlockTile (prédio genérico, hoje desativado) continua chamando-a sem saber da
    // mudança, comportamento idêntico a antes. drawTower (mais abaixo) passa cantos
    // ROTACIONADOS quando o POI tem visual.orientationDeg (ver computeFootprintCornersScreen).
    function drawExtrudedFootprint(ctx, corners, height, colors) {
        var T = corners.T, R = corners.R, B = corners.B, L = corners.L;
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

    // Desenha um "prisma" isométrico eixo-alinhado (base em diamante + duas paredes
    // visíveis + teto), usado pros prédios genéricos (1 tile, drawBlockTile — hoje
    // desativado). cx,cy = centro da base do prisma (pé, no nível do chão) já em
    // coordenadas de tela, com a câmera aplicada. Wrapper fino sobre
    // drawExtrudedFootprint (ver acima) — calcula os 4 cantos do diamante do jeito
    // eixo-alinhado de sempre, comportamento 100% idêntico a antes desta refatoração.
    function drawExtrudedDiamond(ctx, cx, cy, hw, hh, height, colors) {
        var corners = {
            T: { x: cx, y: cy - hh },
            R: { x: cx + hw, y: cy },
            B: { x: cx, y: cy + hh },
            L: { x: cx - hw, y: cy }
        };
        drawExtrudedFootprint(ctx, corners, height, colors);
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

    // SUBSTITUI o antigo drawStreetTile brilhante (era o preenchimento PRINCIPAL da
    // rua, ver ATUALIZAÇÃO 2026-09-03 item 3) — agora é só o "chão" fraco por baixo
    // da curva neon (drawStreetCurves, mais abaixo). Existe pra garantir que toda
    // célula 'street'/'landmark' do grid tenha ALGUM piso visível mesmo onde
    // nenhuma curva passa exatamente por cima (ex.: célula promovida pelo
    // fechamento de gap diagonal do pipeline, ver tools/build-overworld-grid.js —
    // fica a 1 passo da geometria real, não sobre ela). Bem mais discreto que
    // antes de propósito: se competisse visualmente com o gradiente neon da curva,
    // o "mapa digital" pedido viraria ruído.
    function drawStreetPavementFill(ctx, cx, cy) {
        drawFlatDiamond(ctx, cx, cy, HALF_W * 1.02 * S.zoomLevel, HALF_H * 1.02 * S.zoomLevel, 'rgba(10, 22, 28, 0.55)', null);
    }

    // Gradiente neon fixo (mesmo mecanismo do ::-webkit-scrollbar-thumb de
    // css/style.css: 1 gradiente linear de direção FIXA reusado pra tudo, não um
    // gradiente por objeto — ver ATUALIZAÇÃO 2026-09-03 item 4). UM objeto por
    // frame (cache em S._streetGradientCache, invalidado só quando o canvas muda de
    // tamanho), reusado pelo traço de TODAS as ruas visíveis.
    function buildStreetGradient(ctx, canvas, pal) {
        var cache = S._streetGradientCache;
        if (cache && cache.w === canvas.width && cache.h === canvas.height) return cache.gradient;
        var g = ctx.createLinearGradient(0, 0, 0, canvas.height); // 180deg: topo -> base, igual --webkit-scrollbar-thumb
        g.addColorStop(0, pal.cyan);
        g.addColorStop(0.5, pal.magenta);
        g.addColorStop(1, pal.purple);
        S._streetGradientCache = { w: canvas.width, h: canvas.height, gradient: g };
        return g;
    }

    // Traça uma streetWay já convertida (ver buildStreetPathsForChunk) como curva
    // suave: quadraticCurveTo ponto-a-ponto usando cada ponto real como controle e o
    // PONTO MÉDIO entre pontos consecutivos como o destino de fato da curva — técnica
    // padrão de "linha suave por N pontos" sem precisar resolver uma spline completa
    // (cada segmento fica C1-contínuo com o vizinho porque compartilha a tangente no
    // ponto médio). Cai de volta pra reta simples se a via tiver só 2 pontos (não há
    // o que suavizar).
    function tracePathSmooth(ctx, pts, camOffsetX, camOffsetY) {
        if (pts.length < 2) return;
        // pts[i].x/y são coordenadas de MUNDO (saída de gridToScreen, pré-calculadas
        // uma vez por chunk — ver nota em buildStreetPathsForChunk/gridToScreen). O
        // zoom é aplicado aqui, no momento do desenho, junto com o offset de câmera —
        // mesmo padrão de worldToScreen(), inline por performance (evita alocar um
        // objeto {x,y} por ponto em curvas com dezenas de pontos, por chunk, por frame).
        var z = S.zoomLevel;
        ctx.beginPath();
        ctx.moveTo(pts[0].x * z + camOffsetX, pts[0].y * z + camOffsetY);
        if (pts.length === 2) {
            ctx.lineTo(pts[1].x * z + camOffsetX, pts[1].y * z + camOffsetY);
            return;
        }
        for (var i = 1; i < pts.length - 1; i++) {
            var cur = pts[i], next = pts[i + 1];
            var midX = (cur.x + next.x) / 2 * z + camOffsetX;
            var midY = (cur.y + next.y) / 2 * z + camOffsetY;
            ctx.quadraticCurveTo(cur.x * z + camOffsetX, cur.y * z + camOffsetY, midX, midY);
        }
        var last = pts[pts.length - 1];
        ctx.lineTo(last.x * z + camOffsetX, last.y * z + camOffsetY);
    }

    // Desenha todas as streetWays visíveis (bbox cruza a janela de tela) de todos os
    // chunks carregados: 1ª passada = "casing" escura (moldura, mesma cor do track
    // da barra de rolagem) em todas, 2ª passada = traço gradiente neon por cima
    // (mesmo objeto de gradiente pra todas, ver buildStreetGradient). Devolve os
    // candidatos a rótulo (agrupados por nome, guarda só o mais longo de cada) pra
    // render() desenhar depois, por cima de tudo — mesmo espírito de
    // drawTowerStreetLabel (rótulo de UI flutuante, não objeto do mundo).
    // `simplified` (novo, zoom) — true em visão macro (ver ATUALIZAÇÃO 2026-09-03
    // "zoom" e render()): mantém a CURVA (silhueta da rua, pro mapa não virar um
    // vazio com só texto boiando quando o preenchimento por-célula some, ver item
    // 3 do pedido) mas larga a casing escura + halo + gradiente de 3 cores por um
    // traço único, fino, semi-transparente — menos ruído visual competindo com os
    // rótulos de bairro (maiores, ver drawNeighbourhoodLabels) e mais barato (1
    // passada de stroke por via em vez de 3) numa visão que tipicamente tem muito
    // mais vias em quadro ao mesmo tempo. Não gera candidatos a rótulo de rua
    // nesse modo — em zoom macro os nomes que aparecem são os de BAIRRO, não de
    // rua individual (ver item 4 do pedido: nome de rua é comportamento "abaixo
    // do limiar").
    function drawStreetCurves(ctx, pal, camOffsetX, camOffsetY, canvas, simplified) {
        var z = S.zoomLevel;
        var invZ = 1 / z;
        // Culling em ESPAÇO DE MUNDO (way.bbox também é mundo, não-zoomado — ver
        // buildStreetPathsForChunk/gridToScreen): converte os 4 cantos do viewport
        // de tela pra mundo invertendo worldToScreen (worldX=(screenX-camOffsetX)/z)
        // antes de comparar com o bbox. Antes desta mudança este cálculo comparava
        // canvas.width (espaço de tela) direto contra bbox (espaço de mundo) sem
        // passar pelo zoom — funcionava por acidente só porque zoom sempre valia 1;
        // com zoom variável, sem essa conversão o culling ficaria errado (cortaria
        // ruas visíveis no zoom-out, ou deixaria de cortar no zoom-in).
        var viewMinX = (-camOffsetX) * invZ - HALF_W * 2, viewMaxX = (canvas.width - camOffsetX) * invZ + HALF_W * 2;
        var viewMinY = (-camOffsetY) * invZ - HALF_H * 2, viewMaxY = (canvas.height - camOffsetY) * invZ + HALF_H * 2;
        var visible = [];
        for (var key in S.loadedChunks) {
            var chunk = S.loadedChunks[key];
            var paths = chunk.streetPaths;
            if (!paths) continue;
            for (var i = 0; i < paths.length; i++) {
                var way = paths[i];
                var b = way.bbox;
                if (b.maxX < viewMinX || b.minX > viewMaxX || b.maxY < viewMinY || b.minY > viewMaxY) continue;
                visible.push(way);
            }
        }
        if (!visible.length) return {};

        if (simplified) {
            // visão macro: 1 traço só, sem casing/halo/gradiente — largura fixa em
            // px de TELA (não escalada por z) porque em zoom bem baixo uma largura
            // proporcional ao tile ficaria fina demais pra enxergar; 2px de tela dá
            // uma linha "de mapa" legível em qualquer zoom out.
            ctx.save();
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = pal.cyan;
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = 2;
            for (var s = 0; s < visible.length; s++) {
                tracePathSmooth(ctx, visible[s].screenPts, camOffsetX, camOffsetY);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            ctx.restore();
            return {};
        }

        // passada 1: casing escura (embaixo), largura um pouco maior que o traço final
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(7, 7, 8, 0.9)';
        for (var c = 0; c < visible.length; c++) {
            var w1 = visible[c];
            ctx.lineWidth = (streetWidthPx(w1.highway) + 3) * z;
            tracePathSmooth(ctx, w1.screenPts, camOffsetX, camOffsetY);
            ctx.stroke();
        }
        ctx.restore();

        // passada 2: halo fraco (glow sem shadowBlur, mesma técnica de performance já
        // usada no antigo drawStreetTile — ver nota ali) + traço gradiente por cima.
        var gradient = buildStreetGradient(ctx, canvas, pal);
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = gradient;
        ctx.globalAlpha = 0.25;
        for (var h = 0; h < visible.length; h++) {
            var wHalo = visible[h];
            ctx.lineWidth = (streetWidthPx(wHalo.highway) + 8) * z;
            tracePathSmooth(ctx, wHalo.screenPts, camOffsetX, camOffsetY);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        for (var g2 = 0; g2 < visible.length; g2++) {
            var w2 = visible[g2];
            ctx.lineWidth = streetWidthPx(w2.highway) * z;
            tracePathSmooth(ctx, w2.screenPts, camOffsetX, camOffsetY);
            ctx.stroke();
        }
        ctx.restore();

        // candidatos a rótulo: 1 por nome único, fica o de maior lengthPx entre os visíveis
        var byName = {};
        for (var n = 0; n < visible.length; n++) {
            var wn = visible[n];
            if (!wn.name) continue;
            var existing = byName[wn.name];
            if (!existing || wn.lengthPx > existing.lengthPx) byName[wn.name] = wn;
        }
        return byName;
    }

    // Ângulo LOCAL da rua no ponto onde o rótulo é desenhado (Problema 2,
    // 2026-09-03 — pedido do usuário: "texto do nome de rua rotacionado pra
    // acompanhar o ângulo local da rua", igual apps de mapa reais fazem).
    // MESMO PRINCÍPIO de tangente já usado em dois lugares deste arquivo — não
    // reinventado aqui:
    //   1) findNearestStreetPoint() (perto de updateMovement()) calcula
    //      tangentCol/tangentRow = (vx,vy)/segLen de um segmento de
    //      way.gridPts (espaço de GRID col/row) pro controlador de movimento
    //      contínuo em rua.
    //   2) O comentário acima de computeFootprintCornersScreen() (Problema 2
    //      anterior, "torre paralela à rua") calcula o ângulo do MESMO jeito
    //      (atan2 de um delta de segmento) em espaço de GRID, porque ali a
    //      rotação precisa acontecer ANTES da projeção isométrica (rotacionar
    //      um retângulo em espaço de MUNDO, já que a projeção 2:1 não é uma
    //      rotação pura entre os eixos col/row e os eixos de tela).
    // Aqui é DIFERENTE de propósito: isto é rotação de TEXTO DE TELA
    // (ctx.rotate em torno do ponto onde o rótulo é desenhado), não geometria
    // de mundo — então o ângulo certo é o de TELA, não o de grid. Calculado
    // direto em cima de way.screenPts (saída de gridToScreen, espaço de
    // mundo já com a proporção 2:1 da projeção embutida): gridToScreen() é
    // LINEAR e worldToScreen() só acrescenta escala UNIFORME (S.zoomLevel) +
    // translação (câmera) — nenhuma das duas muda ângulo — então o ângulo
    // calculado em screenPts já é idêntico ao ângulo final em tela, sem
    // precisar passar cada ponto por worldToScreen só pra achar o ângulo.
    function streetLabelAngle(pts, midIdx) {
        var a, b;
        if (midIdx + 1 < pts.length) { a = pts[midIdx]; b = pts[midIdx + 1]; }
        else if (midIdx - 1 >= 0) { a = pts[midIdx - 1]; b = pts[midIdx]; }
        else return 0; // way com 1 ponto só (não deveria acontecer, buildStreetPathsForChunk exige >=2) — sem ângulo, sem rotação.
        var angle = Math.atan2(b.y - a.y, b.x - a.x);
        // LEGIBILIDADE (pedido explícito do usuário): nunca de cabeça pra baixo.
        // atan2 devolve (-180°,180°]; um ângulo fora de [-90°,90°] equivale
        // exatamente ao "entre 90° e 270°" descrito no pedido (mesma faixa,
        // só que espelhada pro lado negativo em vez de ir até 360°) — inverte
        // 180° pra sempre cair no meio-círculo que lê da esquerda pra
        // direita/de cima pra baixo, como qualquer app de mapa real.
        var deg = angle * 180 / Math.PI;
        if (deg > 90 || deg < -90) angle += Math.PI;
        return angle;
    }

    // Rótulo de nome de rua ao longo do meio-arco de uma streetWay — mesmo
    // tratamento visual de drawTowerStreetLabel (pílula escura + glow ciano +
    // Courier New), só que menor e sem flutuação (é rótulo de mapa, não placa 3D).
    // Problema 2 (2026-09-03): agora ROTACIONADO pra acompanhar o ângulo local da
    // rua (streetLabelAngle() acima) via ctx.save()/ctx.rotate()/ctx.restore() ao
    // redor do desenho — pílula de fundo e texto desenhados em coordenadas
    // RELATIVAS ao ponto de rotação (0,0 = cx,cy, já transladado), não mais em
    // cx,cy absolutos, porque ctx.rotate() gira em torno da origem corrente do
    // canvas (por isso o ctx.translate(cx,cy) antes do rotate).
    function drawStreetNameLabel(ctx, pal, way, camOffsetX, camOffsetY) {
        var pts = way.screenPts;
        var midIdx = Math.floor(pts.length / 2);
        var mid = pts[midIdx];
        // posição segue mundo+zoom+câmera (worldToScreen); tamanho da fonte fica
        // FIXO em px de tela (não multiplicado por zoom) de propósito — é rótulo de
        // UI/mapa, não geometria do mundo (mesmo raciocínio já documentado antes
        // desta mudança em drawTowerStreetLabel). Se escalasse com o zoom, ficaria
        // ilegível no zoom-out bem antes do texto precisar sumir de propósito.
        var s = worldToScreen(mid.x, mid.y, camOffsetX, camOffsetY);
        var cx = s.x, cy = s.y;
        var angle = streetLabelAngle(pts, midIdx);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        var w = ctx.measureText(way.name).width;
        ctx.fillStyle = 'rgba(5, 5, 8, 0.62)';
        ctx.fillRect(-w / 2 - 6, -13, w + 12, 15);
        ctx.shadowColor = pal.cyan;
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#eafffe';
        ctx.fillText(way.name, 0, -2);
        ctx.restore();
    }

    // ============================ Camada de bairro (zoom macro) =================
    // Item 4a do pedido: em visão macro (zoom-out além de ZOOM_MACRO_THRESHOLD),
    // mostrar o NOME DE BAIRRO de cada chunk carregado, centralizado sobre a área
    // aproximada do chunk, com destaque visual MAIOR que os rótulos de rua
    // (drawStreetNameLabel, acima — fonte 10px). O dado vem de
    // manifest.json:chunks[].neighbourhood (S.manifestChunksByKey), não do chunk em
    // si (data/overworld/chunks/*.json não carrega esse campo — só o manifesto
    // sabe "qual bairro é qual chunk", ver loadManifest()).
    //
    // DECISÃO DE UX (nomes de bairro x nomes de rua coexistindo): não coexistem no
    // MESMO frame — são mutuamente exclusivos por zoom (macro mostra só bairro,
    // micro mostra só rua, ver render()/drawStreetCurves(simplified)). Motivo:
    // testado ao vivo que os dois juntos (rótulo grande de bairro + vários rótulos
    // pequenos de rua) competem visualmente no mesmo espaço de tela sem ganho real
    // de informação — em zoom macro o jogador não está lendo nome de rua individual
    // mesmo (as ruas em si já ficam simplificadas/finas), então esconder esse nível
    // de detalhe junto com o preenchimento é a mesma decisão de "o que importa
    // nesta escala", só aplicada a texto também.
    function drawNeighbourhoodLabel(ctx, pal, text, worldX, worldY, camOffsetX, camOffsetY) {
        var s = worldToScreen(worldX, worldY, camOffsetX, camOffsetY);
        var cx = s.x, cy = s.y;
        ctx.save();
        // Fonte bem maior que drawStreetNameLabel (10px) e drawTowerStreetLabel
        // (13px) — "destaque visual maior" pedido explicitamente (item 4a). FIXA em
        // px de tela (mesmo raciocínio de todo rótulo de UI neste arquivo): não
        // multiplicada por S.zoomLevel, senão encolheria exatamente na faixa de zoom
        // em que mais precisa se destacar.
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'center';
        var w = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(5, 5, 10, 0.7)';
        ctx.fillRect(cx - w / 2 - 14, cy - 16, w + 28, 30);
        ctx.strokeStyle = pal.purple;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - w / 2 - 14, cy - 16, w + 28, 30);
        ctx.shadowColor = pal.purple;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#f3eaff';
        ctx.fillText(text, cx, cy + 6);
        ctx.restore();
    }

    // Itera os chunks REALMENTE carregados (S.loadedChunks — nunca S.manifest
    // direto, mesmo princípio de "só desenha o que está de fato em memória" que o
    // resto do arquivo já segue) e desenha 1 rótulo por chunk, centralizado no
    // meio do seu retângulo (originGlobalCol/Row + metade da dimensão). O nome em
    // si vem de S.manifestChunksByKey (só o manifesto carrega esse campo, ver
    // comentário da função acima) — chunk carregado sem entrada correspondente no
    // manifesto (não deveria acontecer, mas defensivo) ou sem `neighbourhood`
    // simplesmente não ganha rótulo, sem erro.
    function drawNeighbourhoodLabels(ctx, pal, camOffsetX, camOffsetY) {
        for (var key in S.loadedChunks) {
            var chunk = S.loadedChunks[key];
            var manifestEntry = S.manifestChunksByKey[key];
            if (!manifestEntry || !manifestEntry.neighbourhood) continue;
            var centerCol = chunk.originGlobalCol + chunk.dim / 2;
            var centerRow = chunk.originGlobalRow + chunk.dim / 2;
            var worldPos = gridToScreen(centerCol, centerRow);
            drawNeighbourhoodLabel(ctx, pal, manifestEntry.neighbourhood, worldPos.x, worldPos.y, camOffsetX, camOffsetY);
        }
    }

    // ==================== Dicas de tecla em interseção (renderização) ============
    // Camada de HUD PURA (pedido explícito: não participa de updateMovement(),
    // colisão ou disparo de POI — só lê S.loadedChunks[*].intersections,
    // precomputado em ensureChunkLoaded/buildIntersectionsForChunk acima, e
    // S.playerDrawCol/Row pra distância/fade). Chamada 1x por frame direto de
    // render(), só em zoom micro (mesma regra de drawStreetNameLabel — em macro
    // o jogador não está mirando um cruzamento específico, e os próprios
    // rótulos de rua já somem nesse zoom pelo mesmo motivo).
    function drawIntersectionKeyHints(ctx, pal, camOffsetX, camOffsetY) {
        var pc = S.playerDrawCol, pr = S.playerDrawRow;
        var fadeStart = INTERSECTION_HINT_RADIUS_TILES - INTERSECTION_HINT_FADE_TILES;
        for (var key in S.loadedChunks) {
            var nodes = S.loadedChunks[key].intersections;
            if (!nodes) continue;
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                var ddc = node.col - pc, ddr = node.row - pr;
                var dist = Math.hypot(ddc, ddr);
                if (dist > INTERSECTION_HINT_RADIUS_TILES) continue; // culling barato antes de qualquer desenho — mesmo padrão de bbox culling já usado no resto do arquivo
                // fade in/out (pedido explícito, "não popup abrupto") — 1 dentro do
                // raio "cheio", cai linear até 0 na borda externa.
                var alpha = dist <= fadeStart ? 1 : Math.max(0, 1 - (dist - fadeStart) / INTERSECTION_HINT_FADE_TILES);
                if (alpha <= 0.01) continue;
                for (var b = 0; b < node.branches.length; b++) {
                    var branch = node.branches[b];
                    var label = keyLabelForDirection(branch.dirCol, branch.dirRow);
                    if (!label) continue;
                    // ancorado perto do INÍCIO do ramo (pedido explícito), não no nó
                    // em si nem no meio da rua — desloca o rótulo ao longo da própria
                    // direção do ramo antes de projetar pra tela.
                    var labelCol = node.col + branch.dirCol * INTERSECTION_BRANCH_LABEL_OFFSET_TILES;
                    var labelRow = node.row + branch.dirRow * INTERSECTION_BRANCH_LABEL_OFFSET_TILES;
                    var world = gridToScreen(labelCol, labelRow);
                    var s = worldToScreen(world.x, world.y, camOffsetX, camOffsetY);
                    drawKeyHintLabel(ctx, pal, s.x, s.y, label, alpha);
                }
            }
        }
    }

    // Pílula neon com o rótulo de tecla — mesma estética/tratamento visual de
    // drawStreetNameLabel (pílula escura translúcida + glow ciano + Courier New
    // 10px) já estabelecida no arquivo pra rótulo de mundo pequeno, com borda
    // magenta pra diferenciar visualmente de nome-de-rua à primeira vista.
    // Fonte em px FIXO de tela (não multiplicada por S.zoomLevel) de propósito —
    // MESMA decisão já tomada por todo rótulo de texto deste arquivo
    // (drawStreetNameLabel/drawTowerStreetLabel/drawNeighbourhoodLabel): champion
    // de legibilidade sobre "escalar com o resto do mundo" — só a ANCORAGEM
    // (posição, via gridToScreen+worldToScreen) escala com zoom/câmera como o
    // resto do HUD de mundo, o texto em si ficaria ilegível cedo demais no
    // zoom-out se encolhesse junto.
    function drawKeyHintLabel(ctx, pal, cx, cy, label, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        var w = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(5, 5, 8, 0.68)';
        ctx.fillRect(cx - w / 2 - 5, cy - 12, w + 10, 15);
        ctx.strokeStyle = pal.magenta;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - w / 2 - 5, cy - 12, w + 10, 15);
        ctx.shadowColor = pal.cyan;
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#eafffe';
        ctx.fillText(label, cx, cy - 1);
        ctx.restore();
    }

    // ============================ Camada de construções (vazia hoje) ============
    // Item 2 do pedido: "prepare a estrutura de dados/código pra que, quando
    // alguém adicionar prédios no futuro, baste popular essa camada e ela já
    // responda ao toggle de zoom". Hoje não existe NENHUM dado de prédio no
    // projeto — nem em data/overworld/chunks/*.json (schema atual só tem
    // `grid`/`streetWays`, confirmado lendo o arquivo real, sem campo `buildings`
    // em lugar nenhum), nem em nenhum outro lugar do repo (não é escopo desta
    // passada criar esse dado, ver instrução "Não faça" do pedido). drawBlockTile()
    // (acima, DESATIVADO 02/09/2026) já é o candidato natural a função de desenho
    // por prédio quando esse dado existir — reaproveitaria o mesmo PRNG
    // determinístico por tile.
    //
    // O TOGGLE DE ZOOM JÁ FUNCIONA: render() só chama esta função quando
    // !isMacroZoom() (ver item 3 do pedido — construções somem em zoom-out junto
    // com o preenchimento detalhado de rua). Quando alguém popular uma fonte de
    // dados de prédio (ex.: chunk.buildings, análogo a chunk.streetPaths), o passo
    // é: 1) empurrar cada prédio pro array `drawables` do laço de depth-sort em
    // render() (NÃO desenhar direto aqui, fora do sort — ver skill
    // isometric-canvas-rendering §2: objeto ALTO precisa competir no mesmo sort
    // que jogadores, senão um jogador na frente de um prédio desenha atrás dele em
    // alguns frames); 2) dar um `key: gRow+gCol` igual a qualquer outra entidade;
    // 3) tratar o novo `item.type === 'building'` no switch do laço de desenho,
    // chamando uma função tipo drawBlockTile (já existe, só desativada) com
    // hw/hh/height multiplicados por S.zoomLevel, mesmo padrão de drawTower acima.
    function drawBuildingsLayer(ctx, pal, camOffsetX, camOffsetY, canvas) {
        // Sem dado de prédio hoje — no-op intencional. Ver comentário acima.
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
        // além do prisma da torre desenhado só na célula-âncora. Camada de POI —
        // fica visível em qualquer zoom (item 4a do pedido), por isso escala com
        // S.zoomLevel como qualquer outro elemento de mundo, sem gate de macro/micro.
        drawFlatDiamond(ctx, cx, cy, HALF_W * S.zoomLevel, HALF_H * S.zoomLevel, 'rgba(191, 0, 255, 0.10)', pal.purple);
    }

    // Estágio 2 — TOWER_HW/TOWER_HH hardcoded (footprint 3x3 fixo) removidos: a
    // largura/altura em tiles agora vêm do footprint do POI carregado
    // (poi.footprint.widthTiles/heightTiles), lido em cada chamada. TOWER_HEIGHT
    // continua fixo — é a extrusão em Z (px), puramente visual, não faz parte do
    // schema de footprint (que só descreve o retângulo em tiles no chão).
    var TOWER_HEIGHT = 170;

    // Problema 2 (2026-09-03) — "torre deve ficar paralela à rua". Investigado ao vivo
    // ANTES de escrever qualquer rotação: qual rua de verdade fica mais perto da torre?
    // tools/build-overworld-grid.js:findTowerSpot() carve a "porta" da torre encostando
    // na célula de rua globalRow=41/globalCol=42 (ver pois.json:_position_note); rodando
    // um script Node contra data/overworld/chunks/0_0.json:streetWays (nearest-segment,
    // point-to-segment distance — a MESMA função ptSegDist que o build script já usa pra
    // rasterizar) contra os 3 `way` de "Rua Doutor Beltrão", o segmento
    // osmId=182630122 pontos[0]->[1] (col,row FRACIONÁRIO local do chunk 0_0 = global,
    // origem 0,0) — de [46.138,30.71] a [41.273,43.985] — é o mais próximo tanto do
    // centro da torre (dist=2.566 tiles) quanto da célula-porta 42/41 (dist=0.345 tiles,
    // praticamente em cima). Nenhum outro segmento de nenhuma rua chega perto disso.
    // Ângulo do segmento em espaço de GRID: atan2(dRow,dCol) = atan2(13.275,-4.865) =
    // 110.13°. Como o footprint é um QUADRADO (3x3), rotacionar por 110.13° produz o
    // MESMO retângulo desenhado que rotacionar por 110.13-90=20.13° (só troca qual lado
    // do quadrado é "largura" vs "profundidade" — visualmente idêntico) — normalizado
    // pra [-45°,45°] por clareza (menor rotação visual equivalente). Resultado:
    // orientationDeg=20.13, GRAVADO EM data/overworld/pois.json (visual.orientationDeg),
    // não um número mágico só aqui no código — decisão de DADO, como pedido. Ver
    // computeFootprintCornersScreen() abaixo pra como esse ângulo vira geometria de tela.
    var DEG2RAD = Math.PI / 180;

    // Gira o retângulo do footprint (widthTiles x heightTiles, em espaço de GRID) por
    // angleDeg ao redor do centro (centerCol,centerRow) e projeta os 4 cantos já
    // rotacionados pra tela (gridToScreen + worldToScreen, mesma pipeline de qualquer
    // outro ponto do mundo — nada de atalho em espaço de tela aqui, PORQUE a projeção
    // isométrica 2:1 não é uma rotação pura: os eixos col/row mapeiam pra direções NÃO
    // perpendiculares em tela, então "girar em tela" e "girar em grid" dão resultados
    // diferentes — o pedido é a torre ficar paralela à rua no MUNDO, então a rotação
    // acontece em espaço de GRID, antes da projeção, nunca depois). angleDeg=0 reduz
    // EXATAMENTE ao retângulo eixo-alinhado de sempre (cosT=1,sinT=0 -> dCol=u,dRow=v),
    // então qualquer POI futuro sem visual.orientationDeg (default 0 em drawTower)
    // continua com o comportamento visual de antes, sem regressão.
    // Os 4 cantos voltam ORDENADOS por profundidade (T=mais longe da câmera, B=mais
    // perto, L/R=os dois do meio ordenados por X de tela) — mesma convenção de
    // T/R/B/L que drawExtrudedFootprint já espera, generalizada pra um retângulo
    // rotacionado em vez de só o diamante eixo-alinhado.
    function computeFootprintCornersScreen(centerCol, centerRow, widthTiles, heightTiles, angleDeg, camOffsetX, camOffsetY) {
        var halfW = widthTiles / 2, halfH = heightTiles / 2;
        var theta = (angleDeg || 0) * DEG2RAD;
        var cosT = Math.cos(theta), sinT = Math.sin(theta);
        var localCorners = [
            { u: -halfW, v: -halfH },
            { u: halfW, v: -halfH },
            { u: halfW, v: halfH },
            { u: -halfW, v: halfH }
        ];
        var pts = [];
        for (var i = 0; i < localCorners.length; i++) {
            var lc = localCorners[i];
            var dCol = lc.u * cosT - lc.v * sinT;
            var dRow = lc.u * sinT + lc.v * cosT;
            var gCol = centerCol + dCol, gRow = centerRow + dRow;
            var g = gridToScreen(gCol, gRow);
            var s = worldToScreen(g.x, g.y, camOffsetX, camOffsetY);
            s.depthKey = gCol + gRow; // mesma regra de profundidade da skill isometric-canvas-rendering §2
            pts.push(s);
        }
        pts.sort(function (a, b) { return a.depthKey - b.depthKey; });
        var T = pts[0], B = pts[3];
        var mid = [pts[1], pts[2]].sort(function (a, b) { return a.x - b.x; });
        return { T: T, R: mid[1], B: B, L: mid[0] };
    }

    function drawTower(ctx, cx, cy, pal, tSec, poi, camOffsetX, camOffsetY) {
        var z = S.zoomLevel;
        var fp = (poi && poi.footprint) || { widthTiles: 3, heightTiles: 3 };
        var angleDeg = (poi && poi.visual && typeof poi.visual.orientationDeg === 'number') ? poi.visual.orientationDeg : 0;
        var height = TOWER_HEIGHT * z;
        // Camada de POI — visível em qualquer zoom (item 4a/4b do pedido de zoom), então o
        // prisma da torre escala normalmente com S.zoomLevel como qualquer objeto de
        // mundo (fica menor no zoom-out, maior no zoom-in, como esperado). hh (usado pro
        // farol logo abaixo) vem da metade vertical de tela real dos cantos calculados —
        // no caso eixo-alinhado (angleDeg=0) isso é numericamente idêntico ao antigo
        // HALF_H*fp.heightTiles*z (mesmo valor, só derivado dos cantos em vez de
        // hardcoded), então zero regressão pra qualquer POI sem orientationDeg.
        var corners;
        if (angleDeg !== 0 && poi && poi._bounds) {
            corners = computeFootprintCornersScreen(poi._bounds.centerCol, poi._bounds.centerRow, fp.widthTiles, fp.heightTiles, angleDeg, camOffsetX, camOffsetY);
        } else {
            var hw = HALF_W * fp.widthTiles * z, hhAxis = HALF_H * fp.heightTiles * z;
            corners = {
                T: { x: cx, y: cy - hhAxis },
                R: { x: cx + hw, y: cy },
                B: { x: cx, y: cy + hhAxis },
                L: { x: cx - hw, y: cy }
            };
        }
        var hh = Math.abs(corners.B.y - corners.T.y) / 2; // meia-altura de TELA real do prisma, rotacionado ou não — ver farol abaixo.
        cx = (corners.T.x + corners.R.x + corners.B.x + corners.L.x) / 4; // recentraliza cx pro farol a partir dos cantos reais (bate com o cx recebido no caso eixo-alinhado; some qualquer arredondamento no caso rotacionado).
        ctx.save();
        ctx.shadowColor = pal.cyan;
        ctx.shadowBlur = 22 * z;
        drawExtrudedFootprint(ctx, corners, height, {
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
        var beaconY = cy - height - hh - 14 * z;
        // Item 4b do pedido: em zoom-out o beacon precisa continuar legível "à
        // distância" — se o raio/blur só acompanhassem S.zoomLevel como o resto da
        // torre, eles encolheriam junto com tudo e ficariam pontinhos ilegíveis
        // exatamente no modo em que mais precisam se destacar. Em vez de escalar
        // linear com z, uso um raio de BASE fixo em px de tela (não multiplicado por
        // z) no modo macro — maior, relativamente, que o resto do prisma que já
        // encolheu — e só escala normal com z no modo micro (comportamento "de
        // sempre"). Resultado: o beacon cresce (relativo ao resto) conforme o
        // usuário dá zoom out, até o piso de ZOOM_MIN.
        var baseRadius = 6 + pulse * 3;
        var baseBlur = 16 + pulse * 14;
        var beaconRadius = isMacroZoom() ? baseRadius * 1.7 : baseRadius * z;
        var beaconBlur = isMacroZoom() ? baseBlur * 1.7 : baseBlur * z;
        ctx.save();
        ctx.shadowColor = pal.cyan;
        ctx.shadowBlur = beaconBlur;
        ctx.fillStyle = pal.cyan;
        ctx.globalAlpha = 0.55 + pulse * 0.45;
        ctx.beginPath();
        ctx.arc(cx, beaconY, beaconRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Nome flutuando perto da torre — item 3 do pedido original ("nome de local
    // flutuando" na referência de estilo). Desenhada UMA VEZ por frame (não por
    // tile, diferente das ruas) — chamada direto de render(), depois do laço de
    // depth-sort, então sempre fica por cima de tudo, como uma etiqueta de UI
    // flutuante e não um objeto do mundo isométrico.
    //
    // PROBLEMA 1 (2026-09-03) — pedido do usuário: a torre deve exibir "Danger
    // Ghost" (nome do jogo, linha PRINCIPAL, em destaque) com "Episódio 1" (nome
    // da fase, linha ABAIXO, menor) — duas linhas, hierarquia visual clara. Fonte:
    // poi.visual.towerLabel = {main, sub} (campo NOVO em pois.json). Cai pro
    // rótulo de 1 linha de antes (poi.visual.streetLabel || poi.name) se um POI
    // futuro não tiver towerLabel — mesma defensividade de sempre, sem regressão
    // pra POI de entrada que ainda não tenha esse campo.
    //
    // streetLabel ("Rua Doutor Beltrão") NÃO foi removido do dado — continua em
    // pois.json, real e correto — só deixou de ser desenhado AQUI: a mesma string
    // já é o `name` de um streetWay real em data/overworld/chunks/0_0.json
    // (osmId=182630122, ver nota de Problema 2 acima de
    // computeFootprintCornersScreen), então drawStreetNameLabel() (camada
    // genérica de nome de rua, ATUALIZAÇÃO 2026-09-03 item 5 no topo do arquivo)
    // já desenha "Rua Doutor Beltrão" sozinha, direto sobre a curva da rua —
    // repetir aqui também seria redundante (duas etiquetas com o mesmo texto
    // empilhadas uma em cima da outra).
    function drawTowerStreetLabel(ctx, pal, camOffsetX, camOffsetY, tSec) {
        var poi = S.entryPoi;
        if (!poi || !poi._bounds) return;
        var tl = poi.visual && poi.visual.towerLabel;
        var mainText = tl && tl.main;
        var subText = tl && tl.sub;
        if (!mainText) {
            // fallback pra POI futuro sem towerLabel — mesmo comportamento de 1
            // linha de antes desta mudança.
            mainText = (poi.visual && poi.visual.streetLabel) || poi.name;
            subText = null;
        }
        if (!mainText) return;

        var fp = poi.footprint || { widthTiles: 3, heightTiles: 3 };
        var hh = HALF_H * fp.heightTiles * S.zoomLevel; // escala com o zoom pra acompanhar o tamanho real da torre desenhada (ver drawTower)
        var center = gridToScreen(poi._bounds.centerCol, poi._bounds.centerRow);
        var screenCenter = worldToScreen(center.x, center.y, camOffsetX, camOffsetY);
        var cx = screenCenter.x;
        var cy = screenCenter.y;
        // Âncora NO PÉ da torre (cy - a metade do footprint), não no farol do topo
        // (que fica a `TOWER_HEIGHT + hh + 14` px acima de cy — quase 250px). O
        // canvas de jogo de verdade (#myCanvas, e portanto este, ver
        // resizeCanvasToContainer) roda a 640x300px — testado ao vivo: com o rótulo
        // ancorado no farol, ele só cabia na tela com a câmera ~10 tiles longe da
        // torre; ancorado perto do pé (como uma placa na entrada, não uma bandeira
        // no topo) fica visível sempre que a própria torre está em quadro, que é
        // exatamente o "perto da torre" pedido. `anchorY` é a linha de base da
        // linha mais PRÓXIMA da torre ("Episódio 1", quando existe) — a mesma
        // âncora vertical que a única linha de antes usava, pra não mudar onde a
        // etiqueta "aponta" pra torre.
        var bob = Math.sin(tSec * 1.6) * 3; // leve flutuação vertical, reforça a leitura "flutuando"
        var anchorY = cy - hh - 45 + bob;

        var MAIN_FONT_PX = 16, SUB_FONT_PX = 10; // hierarquia pedida: nome do jogo bem maior, nome da fase menor
        var mainFont = 'bold ' + MAIN_FONT_PX + 'px "Courier New", monospace';
        var subFont = SUB_FONT_PX + 'px "Courier New", monospace';

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = mainFont;
        var mainW = ctx.measureText(mainText).width;
        var subW = 0;
        if (subText) {
            ctx.font = subFont;
            subW = ctx.measureText(subText).width;
        }
        var boxW = Math.max(mainW, subW) + 22;

        // subY = linha mais próxima da torre (Episódio 1, se existir); mainY fica
        // ACIMA dela (mais longe da torre, topo da etiqueta) — "Danger Ghost" em
        // cima, "Episódio 1" embaixo, exatamente a hierarquia pedida (linha
        // principal em cima, linha da fase abaixo).
        var subY = anchorY;
        var mainY = subText ? (subY - SUB_FONT_PX - 8) : subY;
        var boxTop = mainY - MAIN_FONT_PX - 2;
        var boxBottom = subText ? (subY + 7) : (mainY + 6);

        ctx.fillStyle = 'rgba(5, 5, 8, 0.65)';
        ctx.fillRect(cx - boxW / 2, boxTop, boxW, boxBottom - boxTop);

        ctx.font = mainFont;
        ctx.shadowColor = pal.cyan;
        ctx.shadowBlur = 9;
        ctx.fillStyle = '#eafffe';
        ctx.fillText(mainText, cx, mainY);

        if (subText) {
            ctx.font = subFont;
            ctx.shadowColor = pal.purple;
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#dcc9ff';
            ctx.fillText(subText, cx, subY);
        }
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
        // Sem g_currentPlayerGhost (jogador ainda não passou pelo Ghostdex/PlayAsGhost
        // — ver ghostdex_ui.js:330), cai pro Ghost #001 como padrão. O overworld é
        // ponto de ENTRADA pro Episódio 1 (o jogador anda aqui ANTES de escolher
        // personagem), então sem esse fallback ele nunca vê o sprite real, só o
        // marcador genérico (drawPlayerToken) — diferente do Episódio 1, que sempre
        // mostra um fantasma de verdade. 2026-09-03.
        var id = window.g_currentPlayerGhost || '001';
        return loadGhostSpriteById(id);
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
    // facingRight (novo, 2026-09-03 — ver ATUALIZAÇÃO no topo do arquivo, itens
    // 1-3): true/undefined = desenha a imagem como carregada (convenção "direita"
    // já usada por js/game/engine.js pro mesmo sprite); false = espelha
    // horizontalmente via translate+scale(-1,1) — MESMA técnica de
    // engine.js:~1216-1220/3769-3773, não uma reinvenção. Não existe sprite
    // dedicado de esquerda (ver item 1: g_customPlayerGhostLeft é a MESMA
    // referência de imagem que g_customPlayerGhostRight), então espelhar a única
    // imagem que existe é o único jeito real de "virar" o fantasma — não uma
    // aproximação escondida, é como o resto do jogo já faz isso.
    function drawGhostBillboard(ctx, cx, cy, img, isSelf, label, pal, facingRight) {
        var footY = cy;
        var ready = img && img.complete && img.naturalWidth > 0;
        if (!ready) {
            drawPlayerToken(ctx, cx, cy, pal, label, isSelf ? pal.cyan : pal.magenta, isSelf);
            return;
        }

        var z = S.zoomLevel;
        var targetH = GHOST_SPRITE_TARGET_H * z; // entidade de mundo — escala com o zoom, igual à torre/POI.
        var scale = targetH / img.naturalHeight;
        var w = img.naturalWidth * scale;
        var h = targetH;

        ctx.save();
        // sombra achatada no chão, mesma lógica do token antigo (ancora visual no
        // tile) — desenhada SEM flip de propósito: é uma elipse simétrica, espelhar
        // não mudaria nada e só gastaria um save/restore extra à toa.
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(cx, footY, HALF_W * 0.28 * z, HALF_H * 0.28 * z, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.globalAlpha = 1;
        if (isSelf) {
            ctx.shadowColor = pal.cyan;
            ctx.shadowBlur = 12 * z;
        }
        if (facingRight === false) {
            // espelha só o drawImage, em torno do MESMO retângulo (cx-w/2..cx+w/2,
            // footY-h..footY) que o caminho sem flip usa — pé (footY) e centro
            // horizontal (cx) não se movem, só a imagem inverte dentro do retângulo.
            ctx.save();
            ctx.translate(cx + w / 2, footY - h);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0, w, h);
            ctx.restore();
        } else {
            ctx.drawImage(img, cx - w / 2, footY - h, w, h);
        }
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
        var z = S.zoomLevel;
        var footY = cy;
        var bodyH = 20 * z;
        ctx.save();
        if (isSelf) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 10 * z;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(cx, footY - bodyH, 8 * z, 10 * z, 0, 0, Math.PI * 2);
        ctx.fill();
        // "sombra" no chão, achatada como o tile
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(cx, footY, HALF_W * 0.28 * z, HALF_H * 0.28 * z, 0, 0, Math.PI * 2);
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

        // Posição DESENHADA (visual) do jogador local: NÃO é mais calculada aqui.
        // 2026-09-03 (unificação do movimento livre contínuo, ver ATUALIZAÇÃO no
        // topo do arquivo) — updateMovement() (chamada em loop(), ANTES de
        // render()) já escreveu S.playerDrawCol/Row direto a partir da posição
        // contínua por-dt (S.playerContCol/Row), em QUALQUER modo (rua ou livre).
        // Antes da unificação, o modo livre usava aqui um lerp discreto
        // tile-a-tile (playerPrevCol/Row + moveStartAt ao longo de
        // S.stepIntervalMs) — removido junto com tryMove(): recalcular/sobrescrever
        // playerDrawCol/Row aqui produziria de novo o movimento "step-y" que a
        // unificação existe pra eliminar. RESTRIÇÃO INEGOCIÁVEL preservada:
        // isWalkable()/checkPoiInteractions() nunca leem playerDrawCol/Row, só a
        // posição lógica inteira (S.playerCol/Row).

        // Câmera: lerp exponencial independente de framerate —
        // camera += (alvo-camera) * (1 - k^dt), NÃO um fator fixo por frame
        // (senão a convergência muda de velocidade entre 60Hz/144Hz). Alvo é a
        // posição de TELA da posição DESENHADA (não a lógica) — a câmera segue o
        // deslize suave do jogador, não o salto de tile. Primeiro frame após
        // activate (camX/camY null) faz snap direto, nunca desliza vindo da
        // posição da sessão/spawn anterior.
        // ZOOM (2026-09-03): camTargetScreen é espaço de MUNDO (gridToScreen puro,
        // sem zoom — ver nota da função). O alvo de câmera (camTargetX/Y) é o offset
        // de TELA que, somado a (mundo*zoom), centraliza o jogador — por isso
        // multiplica camTargetScreen.x/y por S.zoomLevel aqui: sem isso, dar zoom
        // deslocaria o jogador pra fora do centro da tela (o offset continuaria
        // calibrado pro tamanho de tile antigo). S.camX/S.camY (o valor SUAVIZADO,
        // pós-lerp) é o mesmo "camOffsetX/Y" que worldToScreen() espera receber.
        var camTargetScreen = gridToScreen(S.playerDrawCol, S.playerDrawRow);
        var camTargetX = canvas.width / 2 - camTargetScreen.x * S.zoomLevel;
        var camTargetY = canvas.height / 2 - camTargetScreen.y * S.zoomLevel;
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
        var macroZoom = isMacroZoom();

        // culling: janela quadrada em espaço de grid ao redor do jogador, generosa
        // o bastante pra cobrir o viewport (não desenha os 85x85 fora de tela). Dividido
        // por S.zoomLevel: no zoom-out cada tile ocupa menos pixels de tela, então é
        // preciso varrer uma janela de GRID maior pra cobrir o mesmo viewport em px
        // (sem isso, dar zoom-out revelaria uma borda cortada de mapa não desenhado
        // bem antes da borda real da tela).
        var colSpan = Math.ceil((canvas.width / 2) / (HALF_W * S.zoomLevel)) + 3;
        var rowSpan = Math.ceil((canvas.height / 2) / (HALF_H * S.zoomLevel)) + 3;
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

        // ver ATUALIZAÇÃO 2026-09-03 item 3 — chão (ruas/pavimento) virou uma passada
        // própria, desenhada AQUI, antes do laço de depth-sort. É seguro separar do
        // depth-sort porque toda célula 'street' é PLANA (altura zero): nunca precisa
        // "ficar na frente" de nada (quem tem altura de verdade — a torre — extrude
        // pra CIMA a partir da própria base, nunca alcança a área de tela de um tile
        // mais perto da câmera; ver skill isometric-canvas-rendering §2, o caso que
        // ela avisa pra tomar cuidado é objeto ALTO vs entidade, não chão raso vs
        // objeto alto). Só a célula 'landmark' (footprint do POI) continua indo pro
        // array `drawables` de baixo — o desenho DELA (drawLandmarkGroundMarker) e da
        // torre em cima precisa competir no mesmo sort que o jogador/outros, porque a
        // torre é alta de verdade.
        // ============ CAMADA DE CHÃO (item 2 do pedido de zoom) =================
        // Ruas curvas + preenchimento fraco de fundo. O laço abaixo ainda faz dupla
        // função (varre e classifica CADA célula global visível, igual sempre fez) —
        // mas agora o desenho do preenchimento de pavimento é CONDICIONAL ao zoom
        // (item 3 do pedido: em visão macro, para de desenhar o piso detalhado
        // por-célula). Células do footprint do POI de entrada continuam indo pro
        // array `drawables` incondicionalmente — a camada de POI (torre) fica
        // visível em QUALQUER zoom (item 4a/4b), nunca é pulada aqui.
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
                // célula '#' não desenha nada.
                if (ch === '#') continue;
                if (S.entryPoi && isInsidePoiFootprint(S.entryPoi, gCol, gRow)) {
                    drawables.push({ key: gRow + gCol, type: 'tile', row: gRow, col: gCol, ch: ch });
                } else if (!macroZoom) {
                    // preenchimento detalhado por-célula — só em visão micro (item 3: some
                    // no zoom-out, a curva sozinha já basta pra orientação nessa escala).
                    var groundS = gridToScreen(gCol, gRow);
                    var groundScreen = worldToScreen(groundS.x, groundS.y, camOffsetX, camOffsetY);
                    drawStreetPavementFill(ctx, groundScreen.x, groundScreen.y);
                }
            }
        }

        // curvas de rua reais por cima do pavimento fraco, ainda antes das entidades —
        // devolve os candidatos a rótulo (1 por nome único, o segmento visível mais
        // longo) pra desenhar depois de tudo, como rótulo de UI flutuante. Em visão
        // macro desenha a versão `simplified` (ver drawStreetCurves) e não gera
        // candidato nenhum — rótulo de rua individual é comportamento só de zoom-in
        // (item 4), zoom-out mostra nome de BAIRRO em vez disso (ver
        // drawNeighbourhoodLabels, chamado mais abaixo).
        var streetLabelCandidates = drawStreetCurves(ctx, pal, camOffsetX, camOffsetY, canvas, macroZoom);

        // ============ CAMADA DE CONSTRUÇÕES (item 2/3 do pedido de zoom) =========
        // Vazia hoje (ver drawBuildingsLayer) — chamada condicionalmente, só em
        // visão micro, exatamente como o preenchimento de rua acima. Quando popular
        // um dia, já respeita o toggle de zoom sem precisar mexer aqui de novo.
        if (!macroZoom) drawBuildingsLayer(ctx, pal, camOffsetX, camOffsetY, canvas);

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

        // ============ CAMADA DE POI + entidades dinâmicas (depth-sort único) ======
        // Continua tudo num só laço ordenado (tiles do footprint do POI + torre +
        // jogadores), como a skill isometric-canvas-rendering §2 exige — a torre é
        // "alta" de verdade (extrude em Z) e precisa competir no mesmo sort que
        // jogador/outros, nunca uma passada separada de antemão (ver comentário
        // original acima do laço de chão). Camada de POI fica visível em QUALQUER
        // zoom (item 4a/4b) — nada aqui é pulado por causa de macroZoom.
        for (var d = 0; d < drawables.length; d++) {
            var item = drawables[d];
            if (item.type === 'tile') {
                // única coisa que ainda chega aqui como 'tile' é célula do footprint do
                // POI de entrada (ver loop de varredura acima) — rua comum já foi
                // desenhada na passada de chão, antes deste laço.
                var s = gridToScreen(item.col, item.row);
                var screenS = worldToScreen(s.x, s.y, camOffsetX, camOffsetY);
                drawLandmarkGroundMarker(ctx, screenS.x, screenS.y, pal);
                var eb = S.entryPoi._bounds;
                if (item.row === eb.anchorRow && item.col === eb.anchorCol) {
                    var center = gridToScreen(eb.centerCol, eb.centerRow);
                    var screenCenter = worldToScreen(center.x, center.y, camOffsetX, camOffsetY);
                    drawTower(ctx, screenCenter.x, screenCenter.y, pal, tSec, S.entryPoi, camOffsetX, camOffsetY);
                }
            } else if (item.type === 'other') {
                var s2 = gridToScreen(item.drawCol, item.drawRow); // posição DESENHADA (interpolada) — só visual, ver updateOtherPlayersDraw().
                var screenS2 = worldToScreen(s2.x, s2.y, camOffsetX, camOffsetY);
                // esconde o sufixo técnico "(#id)" do rótulo visual — ele é lido à parte por
                // getOtherPlayerGhostImg(), não precisa aparecer no nome flutuante.
                var name = (item.data.name || item.data.email || '???').replace(GHOST_ID_SUFFIX_RE, '');
                if (item.data.avatarUrl) loadAvatar(item.data.avatarUrl);
                var otherImg = getOtherPlayerGhostImg(item.data);
                drawGhostBillboard(ctx, screenS2.x, screenS2.y, otherImg, false, name, pal);
            } else if (item.type === 'player') {
                var s3 = gridToScreen(S.playerDrawCol, S.playerDrawRow); // posição DESENHADA (interpolada) — nunca a lógica aqui, ver nota no topo de render().
                var screenS3 = worldToScreen(s3.x, s3.y, camOffsetX, camOffsetY);
                var selfImg = getSelfGhostImg();
                // S.facingRight: ver ATUALIZAÇÃO 2026-09-03 no topo do arquivo — só o
                // jogador local ganha flip nesta passada (item 6), atualizado em
                // tryMove() a cada passo lógico real, nunca aqui em render(). ZOOM não
                // muda nada nessa leitura — S.facingRight é lido, nunca escrito, por
                // qualquer código deste bloco (ver "Não quebre o que já existe" no
                // pedido) — só a POSIÇÃO de desenho (screenS3) mudou de fórmula.
                drawGhostBillboard(ctx, screenS3.x, screenS3.y, selfImg, true, 'você', pal, S.facingRight);
            }
        }

        drawTowerStreetLabel(ctx, pal, camOffsetX, camOffsetY, tSec);

        if (macroZoom) {
            // ============ CAMADA DE BAIRRO (item 4a do pedido de zoom) ============
            // Visão macro: nome de bairro por chunk carregado, no lugar dos nomes de
            // rua individuais (ver decisão de UX no comentário de
            // drawNeighbourhoodLabels).
            drawNeighbourhoodLabels(ctx, pal, camOffsetX, camOffsetY);
        } else {
            // Rótulos de nome de rua (ver ATUALIZAÇÃO 2026-09-03 item 5) — 1 por nome
            // único visível neste frame, já escolhido (segmento mais longo) por
            // drawStreetCurves(). Teto de 6 rótulos simultâneos só por sanidade visual
            // em trechos muito densos de vias nomeadas — não observado na prática com o
            // tamanho de janela de culling atual (tipicamente 2-4 nomes por vez). Só em
            // visão micro (item 4 do pedido de zoom) — em macro, streetLabelCandidates
            // já vem {} de drawStreetCurves(simplified=true), então este bloco nem
            // precisaria do `if`, mas deixá-lo explícito documenta a regra de zoom no
            // próprio ponto de decisão, não só implicitamente via objeto vazio.
            var labelNames = Object.keys(streetLabelCandidates);
            for (var ln = 0; ln < labelNames.length && ln < 6; ln++) {
                drawStreetNameLabel(ctx, pal, streetLabelCandidates[labelNames[ln]], camOffsetX, camOffsetY);
            }
            // Dicas de tecla em interseção (pedido 2026-09-03) — mesma regra de zoom
            // que os nomes de rua acima (só faz sentido mirar um cruzamento
            // específico em visão micro; o próprio raio de proximidade
            // (INTERSECTION_HINT_RADIUS_TILES) já torna isto redundante em macro,
            // mas o `if` explícito documenta a regra no ponto de decisão, mesmo
            // princípio do comentário logo acima sobre streetLabelCandidates.
            drawIntersectionKeyHints(ctx, pal, camOffsetX, camOffsetY);
        }

        // HUD mínimo de depuração — posição do jogador no grid + estado do streaming de
        // chunks (Estágio 5: chunk atual e quantos estão em memória agora — útil pra
        // conferir ao vivo que a janela 3x3 carrega/descarrega do jeito certo) + zoom
        // atual e modo macro/micro (novo, pra confirmar visualmente o threshold em
        // teste ao vivo sem precisar abrir o console).
        ctx.save();
        ctx.font = '11px "Courier New", monospace';
        ctx.fillStyle = 'rgba(0,255,255,0.85)';
        ctx.fillText('Overworld  col=' + S.playerCol + ' row=' + S.playerRow +
            '  chunk=' + S.currentChunkX + ',' + S.currentChunkY +
            '  loaded=' + Object.keys(S.loadedChunks).length +
            '  zoom=' + S.zoomLevel.toFixed(2) + (macroZoom ? ' [macro]' : ' [micro]'), 8, 14);
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
    // Refatorado 2026-09-03 (ver ATUALIZAÇÃO no topo do arquivo, item 4) — teclas
    // organizadas por EIXO (dc = horizontal do grid, dr = vertical do grid), não
    // mais por "direção única". O antigo KEY_TO_DELTA + currentInputDelta()
    // devolvia só a PRIMEIRA tecla de direção encontrada num for...in — segurar
    // duas teclas de eixos diferentes ao mesmo tempo nunca produzia diagonal.
    // AXIS_KEYS é a nova fonte única de verdade de "quais teclas existem":
    // attachInput() deriva o set de teclas reconhecidas dele (ALL_MOVE_KEYS),
    // currentInputVector() soma os dois eixos independentemente.
    var AXIS_KEYS = {
        dr: { neg: ['ArrowUp', 'w', 'W'], pos: ['ArrowDown', 's', 'S'] },   // dr negativo = norte do grid, positivo = sul
        dc: { neg: ['ArrowLeft', 'a', 'A'], pos: ['ArrowRight', 'd', 'D'] } // dc negativo = oeste do grid, positivo = leste
    };
    var ALL_MOVE_KEYS = {};
    (function collectMoveKeys() {
        for (var axis in AXIS_KEYS) {
            var spec = AXIS_KEYS[axis];
            var keys = spec.neg.concat(spec.pos);
            for (var i = 0; i < keys.length; i++) ALL_MOVE_KEYS[keys[i]] = true;
        }
    })();

    // Teclas de zoom — '+'/'=' aumenta (zoom in), '-'/'_' diminui (zoom out).
    // Ambos os símbolos de cada tecla física aceitos (e.key já reflete o símbolo
    // com/sem Shift: '+' normalmente exige Shift no teclado US, mas alguns layouts
    // ISO/BR têm '+' sem Shift — aceitar os dois evita depender de layout) — mesmo
    // padrão de robustez que AXIS_KEYS já usa pra WASD/setas (várias teclas físicas
    // mapeando pro mesmo eixo lógico).
    var ZOOM_IN_KEYS = { '+': true, '=': true };
    var ZOOM_OUT_KEYS = { '-': true, '_': true };

    function attachInput() {
        S.keydownHandler = function (e) {
            if (ALL_MOVE_KEYS[e.key]) {
                S.keys[e.key] = true;
                if (e.key.indexOf('Arrow') === 0) e.preventDefault();
                return;
            }
            // Zoom por teclado (item 1 do pedido: "tecla +/- ou scroll do mouse, sua
            // escolha de input" — implementei os dois). Independente do estado de
            // movimento (S.keys) porque zoom não é uma tecla "segurada" contínua como
            // as de movimento — cada toque dá um incremento discreto de
            // ZOOM_KEY_STEP, igual a qualquer atalho de zoom de app de mapa.
            if (ZOOM_IN_KEYS[e.key]) {
                S.zoomLevel = clampZoom(S.zoomLevel + ZOOM_KEY_STEP);
                e.preventDefault();
            } else if (ZOOM_OUT_KEYS[e.key]) {
                S.zoomLevel = clampZoom(S.zoomLevel - ZOOM_KEY_STEP);
                e.preventDefault();
            }
        };
        S.keyupHandler = function (e) {
            if (ALL_MOVE_KEYS[e.key]) S.keys[e.key] = false;
        };
        window.addEventListener('keydown', S.keydownHandler);
        window.addEventListener('keyup', S.keyupHandler);

        // Zoom pela roda do mouse — anexado no CANVAS do overworld (não em window),
        // pra não capturar scroll do usuário quando o overworld não está em primeiro
        // plano ou quando o mouse está sobre outro elemento da página (modal, HUD).
        // {passive:false} + preventDefault() porque senão o navegador rola a PÁGINA
        // (o canvas não tem overflow próprio, mas o body pode) junto com o zoom do
        // mapa — comportamento clássico de "mapa dentro de página" que precisa
        // capturar a roda pra si quando o cursor está em cima.
        S.wheelHandler = function (e) {
            e.preventDefault();
            // deltaY > 0 = rolou "pra baixo/longe" (convenção universal de mouse) =
            // zoom OUT (zoomLevel menor); deltaY < 0 = zoom IN. Multiplicativo (não
            // aditivo) pra sentir proporcional em qualquer zoom atual — mesmo
            // comportamento de Google Maps/Leaflet: um "clique de roda" perto do
            // ZOOM_MIN muda pouco em valor absoluto, perto do ZOOM_MAX muda mais,
            // mas a sensação de velocidade de zoom é constante.
            var factor = 1 - e.deltaY * ZOOM_WHEEL_FACTOR;
            S.zoomLevel = clampZoom(S.zoomLevel * factor);
        };
        if (S.canvas) S.canvas.addEventListener('wheel', S.wheelHandler, { passive: false });
    }

    function detachInput() {
        if (S.keydownHandler) window.removeEventListener('keydown', S.keydownHandler);
        if (S.keyupHandler) window.removeEventListener('keyup', S.keyupHandler);
        if (S.wheelHandler && S.canvas) S.canvas.removeEventListener('wheel', S.wheelHandler);
        S.keydownHandler = null; S.keyupHandler = null; S.wheelHandler = null;
        S.keys = {};
    }

    // Soma um eixo (-1/0/+1) a partir de QUALQUER tecla do lado neg/pos que
    // esteja pressionada agora — segurar duas teclas do MESMO lado (ex.
    // ArrowLeft + a) não soma duas vezes; segurar teclas de lados OPOSTOS do
    // MESMO eixo (ex. ArrowUp + ArrowDown) cancela pro próprio eixo (v=0),
    // comportamento padrão de input 8-direcional.
    function axisValue(spec) {
        var v = 0;
        for (var i = 0; i < spec.neg.length; i++) { if (S.keys[spec.neg[i]]) { v -= 1; break; } }
        for (var j = 0; j < spec.pos.length; j++) { if (S.keys[spec.pos[j]]) { v += 1; break; } }
        return v;
    }

    // Função de cálculo de vetor de movimento a partir do input atual (pedido
    // do usuário, item 1) — só teclado hoje, ver item 4 do bloco de
    // documentação no topo do arquivo pra por que toque fica fora de escopo
    // desta passada. Nome do par (dc,dr) = "dx,dy" do pedido em espaço de GRID
    // (não de tela — ver gridToScreen/nota do item 4). Combina os DOIS eixos
    // independentemente, então segurar ex. ArrowUp+ArrowRight ao mesmo tempo
    // agora produz {dc:1, dr:-1} (diagonal de grid de verdade), não só a
    // primeira tecla encontrada como no currentInputDelta() antigo (removido).
    function currentInputVector() {
        var dr = axisValue(AXIS_KEYS.dr);
        var dc = axisValue(AXIS_KEYS.dc);
        if (dc === 0 && dr === 0) return null;
        return { dc: dc, dr: dr };
    }

    // ==================== Movimento contínuo em rua (2026-09-03) ================
    // Ver ATUALIZAÇÃO 2026-09-03 "movimento contínuo em rua" no topo do arquivo pro
    // raciocínio completo de cada constante/decisão abaixo.
    var STREET_SNAP_RADIUS_TILES = 1.1; // tolerância pra considerar o jogador "sobre uma rua" — cobre células promovidas pelo fechamento de gap diagonal do pipeline (ficam ~1 tile da geometria real, ver nota de 03/09 sobre streetWays).
    var STREET_INPUT_EPS = 1e-6;        // zona-morta pro produto escalar input·tangente — evita ruído de ponto-flutuante decidir avançar/recuar quando o input é matematicamente ortogonal à rua (ex.: rua a 45°, input na outra diagonal).
    // CORREÇÃO 2026-09-03 (achada em teste ao vivo, não fazia parte do design original
    // — ver nearestPoiFootprintDist() acima e ATUALIZAÇÃO no topo do arquivo): raio de
    // override — perto de QUALQUER POI (footprint da torre incluído), a restrição "só
    // 2 direções" da rua é ignorada e o movimento cai pro modo livre contínuo de sempre,
    // MESMO que o jogador esteja geometricamente perto o bastante de uma streetWay pra
    // contar como "on-street" por distância. 1.5 tiles escolhido por cobrir com folga o
    // caso medido ao vivo (pois.json:defaultSpawn fica a exatamente 1.0 tile da borda
    // do footprint da torre) sem abrir uma zona de exclusão grande demais ao redor de
    // POIs menores no futuro.
    var POI_FOOTPRINT_OVERRIDE_TILES = 1.5;

    // ==================== Movimento livre contínuo (unificação 2026-09-03) =====
    // ATUALIZAÇÃO 2026-09-03 "movimento livre contínuo" (ver bloco no topo do
    // arquivo) — pedido do usuário: eliminar a "trava" residual que sobrava fora
    // de rua, onde o movimento ainda era o sistema antigo discreto (tryMove(),
    // 1 tile a cada S.stepIntervalMs, sem posição lógica fracionária real —
    // só a posição DESENHADA interpolava, a lógica saltava). tryMove() foi
    // removido; o modo livre agora usa o MESMO controlador contínuo por-dt que
    // o modo rua já usava (S.playerContCol/Row avançado em updateMovement()),
    // só trocando COMO o vetor de avanço é calculado (ver updateMovement()):
    //   - EM RUA: input projetado na tangente do segmento mais próximo (só 2
    //     direções, como já era).
    //   - LIVRE: input normalizado (unitário mesmo na diagonal) direto como
    //     direção de avanço — 8 direções, MESMA PLAYER_SPEED_TILES_PER_SEC de
    //     pico do modo rua (garante que não há salto de velocidade ao atravessar
    //     a fronteira "sobre rua" <-> "livre", item 2 do pedido).
    // Pesquisa aplicada aqui (ver relatório da sessão pra fontes completas):
    //   1) Integração de velocidade por dt real (não por tick fixo) é a técnica
    //      universal de "frame-rate independent movement" (Glenn Fiedler,
    //      "Fix Your Timestep!", gafferongames.com; Gamasutra/Game Developer,
    //      "The Physics/Rendering Split") — já valia pro modo rua, agora
    //      generalizado pro modo livre.
    //   2) Normalizar o vetor de input ANTES de multiplicar pela velocidade
    //      evita o "diagonal 41% mais rápido" clássico (soma ingênua de dc/dr
    //      inteiros) — mesma técnica documentada em skills/physics_dt.md §5
    //      deste projeto (Skill: Física Delta-Time, Sub-stepping e Colisão
    //      Swept AABB) e em qualquer engine AAA de referência (Unity
    //      CharacterController, Unreal CharacterMovementComponent).
    //   3) MAX_DT_SEC (abaixo, aplicado em loop()) — clamp do maior dt processado
    //      por frame, prevenindo tunneling através de paredes de 1 tile numa
    //      queda severa de FPS (aba em segundo plano, GC pause) E a "espiral da
    //      morte" descrita em skills/physics_dt.md §2.2. Sem isto, um frame de
    //      200ms+ (ex.: troca de aba) faria S.playerContCol/Row saltar mais de
    //      1 tile de uma vez, atravessando paredes finas sem detectar colisão.
    //   4) "Wall slide" em diagonal (ver ramo livre de updateMovement()): se o
    //      passo diagonal pleno esbarra numa quina bloqueada mas um dos dois
    //      eixos isolados continua livre, desliza só nesse eixo em vez de parar
    //      seco — técnica padrão de movimento em grade (o mesmo princípio da
    //      resposta de colisão com deslizamento do Swept AABB de
    //      skills/physics_dt.md §3, simplificado pra grid discreto em vez de
    //      AABB contínua, que seria overkill aqui: colisão já é por-tile
    //      andável/bloqueado, não caixas com dimensão arbitrária).
    var PLAYER_SPEED_TILES_PER_SEC = 1000 / S.stepIntervalMs; // ~6.67 tiles/s de pico — mesma constante usada nos dois modos (rua e livre), de propósito: é o que garante a transição sem salto de velocidade entre eles.
    var MAX_DT_SEC = 0.1; // clamp de segurança (ver item 3 acima) — a 100ms, um passo de PLAYER_SPEED_TILES_PER_SEC*MAX_DT_SEC ainda fica < 1 tile (~0.67), então mesmo o pior frame processado nunca atravessa uma parede de 1 tile de espessura.

    // Acha o ponto mais próximo, entre TODAS as streetWays de TODOS os chunks
    // carregados, da posição (col,row) dada (espaço GLOBAL fracionário — mesmo
    // espaço de way.gridPts). Devolve null se nenhum chunk carregado tem
    // streetPaths, ou {dist, tangentCol, tangentRow} (tangente já normalizada,
    // sinal = ordem dos pontos na polilinha original, só usada via produto
    // escalar em updateMovement() — o sinal absoluto não importa, só a
    // consistência local ponto-a-ponto, que a geometria real já garante).
    // Culling por gridBbox (expandido pela tolerância) antes do loop caro
    // ponto-a-ponto — barato mesmo rodando todo frame (~100 ways/chunk carregado,
    // a maioria descartada pelo bbox antes de entrar no laço de segmentos).
    function findNearestStreetPoint(col, row) {
        var tol = STREET_SNAP_RADIUS_TILES;
        var best = null;
        for (var key in S.loadedChunks) {
            var chunk = S.loadedChunks[key];
            var paths = chunk.streetPaths;
            if (!paths) continue;
            for (var i = 0; i < paths.length; i++) {
                var way = paths[i];
                var gp = way.gridPts;
                if (!gp || gp.length < 2) continue;
                var gb = way.gridBbox;
                if (gb && (col < gb.minCol - tol || col > gb.maxCol + tol ||
                    row < gb.minRow - tol || row > gb.maxRow + tol)) continue;
                for (var s = 0; s < gp.length - 1; s++) {
                    var ax = gp[s].col, ay = gp[s].row, bx = gp[s + 1].col, by = gp[s + 1].row;
                    var vx = bx - ax, vy = by - ay;
                    var lenSq = vx * vx + vy * vy;
                    if (lenSq < 1e-9) continue; // segmento degenerado (dois pontos iguais) — pula
                    var t = ((col - ax) * vx + (row - ay) * vy) / lenSq;
                    if (t < 0) t = 0; else if (t > 1) t = 1;
                    var px = ax + vx * t, py = ay + vy * t;
                    var dx = col - px, dy = row - py;
                    var distSq = dx * dx + dy * dy;
                    if (best === null || distSq < best.distSq) {
                        var segLen = Math.sqrt(lenSq);
                        best = {
                            distSq: distSq,
                            dist: Math.sqrt(distSq),
                            tangentCol: vx / segLen,
                            tangentRow: vy / segLen
                        };
                    }
                }
            }
        }
        return best;
    }

    // ============================ Orientação do avatar (flip) ===================
    // CORREÇÃO 2026-09-03 — o flip estava ESPELHADO NA DIREÇÃO ERRADA (pedido do
    // usuário: "o personagem fica virado pro lado errado quando anda, espelhe
    // isso"). Causa raiz encontrada em js/game/engine.js (NÃO neste arquivo) —
    // a única outra referência real de como window.g_customPlayerGhostRight (o
    // MESMO arquivo de imagem usado aqui e no Episódio 1) já é orientado no
    // jogo. Lido c_DeSoGhost.draw() linha a linha (~1214-1230 de engine.js):
    // `this.face` vale 1 quando o jogador anda pra DIREITA (moveRight ->
    // this.face=1, ~linha 1469) e 2 quando anda pra ESQUERDA (moveLeft ->
    // this.face=2, ~linha 1468). E o desenho faz exatamente o OPOSTO do que
    // este arquivo presumia antes: com face==1 (direita) e o sprite custom
    // pronto, engine.js ESPELHA (translate + scale(-1,1)) antes de desenhar
    // curRight; com face==2 (esquerda), desenha curRight SEM espelhar, como
    // veio do arquivo. Ou seja: pra este sprite (arte de fantasma num único
    // arquivo, sem uma segunda arte "olhando pro outro lado" — mesma conclusão
    // já registrada na nota de 02/09 sobre g_customPlayerGhostLeft ser a MESMA
    // referência), a pose CRUA (sem transform) já olha pra ESQUERDA — é preciso
    // espelhar pra fazer o fantasma olhar pra direita, não o contrário. Esta
    // função antes fazia o inverso disso (screenDx>0 = tela pra direita = SEM
    // espelhar); corrigido invertendo qual sinal produz true/false. A técnica
    // de espelhamento em si (drawGhostBillboard, translate+scale(-1,1) em torno
    // do mesmo retângulo) já replicava certo o mecanismo de engine.js e não
    // mudou.
    //
    // dc,dr = vetor de GRID do passo — um passo de grid inteiro (tryMove) ou a
    // direção de avanço contínuo numa rua (tangente*sinal, ver updateMovement()
    // abaixo). screenDx = (dc-dr)*HALF_W (gridToScreen) — só o SINAL importa,
    // então a mesma função serve pros dois casos (passo inteiro ou fração de
    // tile por frame). Chamada SÓ quando quem invocou já confirmou que o
    // personagem de fato avançou (isWalkable() já passou) — nunca a partir do
    // input cru, mesma regra de sempre ("nunca desliza": orientação só muda
    // quando o pé sai do lugar de verdade).
    function updateFacingFromMoveVector(dc, dr) {
        S.facingDir = { dc: dc, dr: dr };
        var screenDxSign = dc - dr;
        if (screenDxSign > STREET_INPUT_EPS) S.facingRight = false;      // tela pra DIREITA -> precisa espelhar (pose crua olha pra esquerda)
        else if (screenDxSign < -STREET_INPUT_EPS) S.facingRight = true; // tela pra ESQUERDA -> pose crua já serve, sem espelhar
        // |screenDxSign| ~ 0: passo diagonal de grid com projeção em tela
        // puramente vertical — não toca em S.facingRight, mantém a última
        // orientação horizontal conhecida (regra (a) do pedido original do
        // usuário, ver nota de 02/09 "input de movimento" item 3).
    }

    // Efeitos colaterais de um passo que muda de CÉLULA lógica inteira (não de
    // sub-tile) — mesmo trio que tryMove() disparava antes da unificação:
    // streaming de chunk, payload de rede (window.OverworldState) e interação
    // de POI. Chamado pelos dois modos de updateMovement() (rua e livre), já
    // que os dois avançam pela mesma S.playerContCol/Row e só diferem em como
    // calculam o vetor de avanço.
    function commitLogicalStepIfChanged(newCol, newRow) {
        if (newCol === S.playerCol && newRow === S.playerRow) return;
        S.playerCol = newCol;
        S.playerRow = newRow;
        updateChunkWindow(); // Estágio 5 — janela 3x3 + prefetch direcional; barato quando o chunk não mudou, ensureChunkLoaded() já retorna cedo.
        syncPublicState();
        checkPoiInteractions(); // lê S.playerCol/Row (lógico) — NUNCA playerDrawCol/Row. Restrição inegociável do plano.
    }

    // ============================ updateMovement() ===============================
    // Controlador de movimento por frame — chamado por loop(), ANTES de render().
    // ÚNICO controlador do jogador local desde a unificação 2026-09-03 (ver
    // ATUALIZAÇÃO "movimento livre contínuo" no topo do arquivo e o bloco de
    // constantes acima de findNearestStreetPoint() pro raciocínio completo/
    // pesquisa aplicada). S.playerContCol/Row (float) é SEMPRE a posição
    // autoritativa, avançada por dt real a cada frame — nunca mais em saltos de
    // S.stepIntervalMs. Decide a cada frame se o jogador está "sobre uma rua"
    // (findNearestStreetPoint() <= STREET_SNAP_RADIUS_TILES da posição VISUAL
    // atual) e alterna SÓ COMO o vetor de avanço é calculado:
    //   - SOBRE RUA: input projetado na tangente local do segmento mais próximo
    //     — só a componente ao longo do caminho importa (implementa "só 2
    //     direções").
    //   - LIVRE: input normalizado (unitário mesmo na diagonal, evita o
    //     clássico "diagonal 41% mais rápido") usado direto como direção — 8
    //     direções, MESMA PLAYER_SPEED_TILES_PER_SEC de pico do modo rua (sem
    //     isso haveria um salto de velocidade perceptível bem na fronteira
    //     entre os dois modos).
    // dtSec = delta de tempo real desde a última chamada (S.lastMoveAt, relógio
    // PRÓPRIO deste controlador — não o mesmo S.lastRenderAt que a câmera usa em
    // render(), pra não acoplar os dois sistemas), já clampado em MAX_DT_SEC por
    // loop() antes de chegar aqui (previne tunneling/espiral da morte).
    function updateMovement(now, dtSec) {
        var delta = currentInputVector();
        var testCol = (typeof S.playerDrawCol === 'number') ? S.playerDrawCol : S.playerCol;
        var testRow = (typeof S.playerDrawRow === 'number') ? S.playerDrawRow : S.playerRow;
        var nearest = findNearestStreetPoint(testCol, testRow);
        // CORREÇÃO 2026-09-03 (achada em teste ao vivo — ver nearestPoiFootprintDist()
        // e POI_FOOTPRINT_OVERRIDE_TILES acima): perto de um POI, o movimento livre de
        // sempre tem prioridade sobre o seguimento de rua, mesmo dentro do raio de
        // captura da rua — sem isto, o passo lateral pra dentro da porta da torre fica
        // geometricamente inatingível a partir do spawn padrão.
        var onStreetNow = !!nearest && nearest.dist <= STREET_SNAP_RADIUS_TILES &&
            nearestPoiFootprintDist(testCol, testRow) > POI_FOOTPRINT_OVERRIDE_TILES;

        if (onStreetNow) {
            if (!S.onStreet) {
                // Entrando no modo rua agora — ancora na posição VISUAL atual (não
                // numa projeção exata sobre a linha, que puxaria o jogador
                // lateralmente de forma perceptível no instante da transição).
                // Normalmente já é um no-op (testCol/testRow == playerContCol/Row,
                // porque o modo livre também mantém os dois em sincronia todo
                // frame desde a unificação) — mantido como guarda explícita pro
                // 1º frame após activateNow() e por clareza de intenção.
                S.playerContCol = testCol;
                S.playerContRow = testRow;
            }
            S.onStreet = true;

            if (delta) {
                // CORREÇÃO 2026-09-03 (achada em teste ao vivo — ver ATUALIZAÇÃO no topo
                // do arquivo item 2c/2d): a primeira versão disto usava só o SINAL do
                // produto escalar bruto (delta·tangente) pra decidir avançar/recuar, mas
                // aplicava velocidade MÁXIMA sempre que o sinal desse não-zero — e como
                // ruas reais (dado OSM) quase nunca são perfeitamente horizontais/
                // verticais (ex.: "Rua Waldir Cabral" é 176°, só 4° fora do horizontal,
                // não 180° exato), isso fazia ATÉ UM INPUT ORTOGONAL (ex.: ArrowUp numa
                // rua quase-horizontal) disparar velocidade PLENA na direção da rua —
                // exatamente o oposto de "cima/baixo não fazem nada útil" pedido pelo
                // usuário. Corrigido normalizando o vetor de input (unitário mesmo na
                // diagonal) ANTES do produto escalar — o resultado é o COSSENO do ângulo
                // entre input e tangente, em [-1,1] — e escalando a velocidade por esse
                // valor (não só pelo sinal). Efeito real: input alinhado com a rua anda
                // a velocidade PLENA (cosseno ~1); input perpendicular anda a ~0 (cosseno
                // ~0, só o resíduo do desalinhamento real da rua, imperceptível); ângulos
                // intermediários (ex. diagonal real vs input cardinal) andam
                // proporcionalmente mais devagar — é literalmente "projetar o vetor de
                // input na tangente" como pedido, não uma aproximação por sinal.
                var inLen = Math.hypot(delta.dc, delta.dr); // 1 pra input cardinal, sqrt(2) pra diagonal (2 teclas de eixos diferentes)
                var normDc = delta.dc / inLen, normDr = delta.dr / inLen;
                var dot = normDc * nearest.tangentCol + normDr * nearest.tangentRow; // cosseno do ângulo entre input normalizado e a tangente
                if (dot > STREET_INPUT_EPS || dot < -STREET_INPUT_EPS) {
                    var dir = dot > 0 ? 1 : -1; // só o sinal, pra orientação do sprite (ver updateFacingFromMoveVector abaixo) — a MAGNITUDE do avanço usa `dot` direto, não `dir`.
                    var stepTiles = dot * PLAYER_SPEED_TILES_PER_SEC * dtSec; // escalado pelo cosseno de alinhamento — velocidade plena só quando input e rua estão perfeitamente alinhados. MESMA constante de pico do modo livre (ver bloco de constantes acima) — garante continuidade de velocidade na transição entre os dois modos.
                    var candCol = S.playerContCol + nearest.tangentCol * stepTiles;
                    var candRow = S.playerContRow + nearest.tangentRow * stepTiles;
                    var roundedCol = Math.round(candCol), roundedRow = Math.round(candRow);
                    if (isWalkable(roundedCol, roundedRow)) {
                        S.playerContCol = candCol;
                        S.playerContRow = candRow;
                        // Orientação: direção CONTÍNUA (tangente*sinal, SEM escalar pela
                        // magnitude de `dot` — a pose do sprite não deve ficar "menos
                        // virada" só porque o input estava mal alinhado) — só atualiza
                        // quando o avanço foi de fato aceito (isWalkable acima),
                        // preservando "nunca desliza" também neste modo.
                        updateFacingFromMoveVector(nearest.tangentCol * dir, nearest.tangentRow * dir);
                    }
                    // isWalkable false: avanço recusado, posição contínua não muda
                    // (mesmo "bloqueia contra bloco" de sempre, sem sair do lugar).
                }
            }
        } else {
            S.onStreet = false;

            // 2026-09-03 (unificação do movimento livre contínuo) — substitui o
            // antigo tryMove() discreto (1 tile a cada S.stepIntervalMs, sem
            // posição lógica fracionária). Mesmo controlador contínuo do modo
            // rua acima, só que o vetor de avanço é o input NORMALIZADO direto
            // (8 direções livres), não uma projeção numa tangente de via.
            if (delta) {
                var inLenF = Math.hypot(delta.dc, delta.dr); // 1 cardinal, sqrt(2) diagonal
                var normDcF = delta.dc / inLenF, normDrF = delta.dr / inLenF; // normalizado ANTES de multiplicar pela velocidade — evita o "diagonal 41% mais rápido" (ver skills/physics_dt.md §5, citado no bloco de constantes acima).
                var stepTilesF = PLAYER_SPEED_TILES_PER_SEC * dtSec;
                var candColF = S.playerContCol + normDcF * stepTilesF;
                var candRowF = S.playerContRow + normDrF * stepTilesF;
                if (isWalkable(Math.round(candColF), Math.round(candRowF))) {
                    S.playerContCol = candColF;
                    S.playerContRow = candRowF;
                    updateFacingFromMoveVector(normDcF, normDrF);
                } else {
                    // "Wall slide": a diagonal plena esbarrou numa quina bloqueada,
                    // mas um dos dois eixos isolados pode continuar livre — desliza
                    // só nesse eixo em vez de travar seco contra o canto (técnica
                    // padrão de movimento em grade; ver bloco de constantes acima,
                    // item 4, pra raciocínio completo). Sem isto, andar na diagonal
                    // rente a uma parede oblíqua pararia de repente a cada leve
                    // irregularidade do contorno andável/bloqueado — uma "trava"
                    // perceptível que o pedido do usuário pede pra eliminar.
                    var slidCol = S.playerContCol + normDcF * stepTilesF;
                    var slidRow = S.playerContRow + normDrF * stepTilesF;
                    if (normDcF !== 0 && isWalkable(Math.round(slidCol), Math.round(S.playerContRow))) {
                        S.playerContCol = slidCol;
                        updateFacingFromMoveVector(normDcF, 0);
                    } else if (normDrF !== 0 && isWalkable(Math.round(S.playerContCol), Math.round(slidRow))) {
                        S.playerContRow = slidRow;
                        updateFacingFromMoveVector(0, normDrF);
                    }
                    // Os dois eixos travados: nenhum avanço, mesmo "bloqueia contra
                    // bloco" de sempre — sem sair do lugar.
                }
            }
        }

        // Comum aos dois modos desde a unificação — antes só o ramo "em rua" fazia
        // isto; agora S.playerContCol/Row é SEMPRE a posição autoritativa.
        commitLogicalStepIfChanged(Math.round(S.playerContCol), Math.round(S.playerContRow));
        S.playerDrawCol = S.playerContCol;
        S.playerDrawRow = S.playerContRow;
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
        // BUG PRÉ-EXISTENTE CORRIGIDO 2026-09-03 (agente de zoom/câmera, sessão
        // anterior): este loop chamava currentInputDelta(), função que não existe
        // mais neste arquivo (renomeada pra currentInputVector() numa refatoração
        // anterior sem atualizar este call site) — ReferenceError no 1º frame,
        // sem try/catch em volta, matava o rAF inteiro. Já corrigido antes desta
        // passada (nota completa preservada na ATUALIZAÇÃO 2026-09-03 "zoom" no
        // topo do arquivo, item 0) — só documentando que o call site mudou de
        // novo aqui, pra updateMovement(), que desde a unificação do movimento
        // livre contínuo (ver ATUALIZAÇÃO correspondente no topo do arquivo)
        // avança S.playerContCol/Row por dt real em QUALQUER modo (rua ou
        // livre), não mais delegando a um tryMove() discreto fora de rua.
        var dtSec = S.lastMoveAt ? Math.max(0, (now - S.lastMoveAt) / 1000) : 0;
        // Clamp de segurança (ver MAX_DT_SEC, bloco de constantes acima de
        // findNearestStreetPoint) — sem isto, um frame anormalmente longo (aba
        // em segundo plano, GC pause, DevTools pausado num breakpoint) faria
        // S.playerContCol/Row saltar tiles inteiros de uma vez (tunneling
        // através de paredes finas) na volta, e a câmera/movimento "explodiriam"
        // num salto visual grande — a "espiral da morte" clássica de física
        // por-dt sem teto (skills/physics_dt.md §2.2). Aplicado só ao dt que
        // ALIMENTA o movimento (S.lastMoveAt) — a câmera (S.lastRenderAt, em
        // render()) já lida bem com dt grande por natureza (seu lerp exponencial
        // só converge mais rápido/"gruda" no alvo, nunca ultrapassa ou soluça).
        dtSec = Math.min(dtSec, MAX_DT_SEC);
        S.lastMoveAt = now;
        updateMovement(now, dtSec);
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
        } else if (S.entryPoi && S.entryPoi.defaultSpawn &&
            typeof S.entryPoi.defaultSpawn.globalCol === 'number' && typeof S.entryPoi.defaultSpawn.globalRow === 'number') {
            // Preferido: célula andável real, orientada a dado (ver pois.json ->
            // defaultSpawn). Corrige um bug real encontrado em 2026-09-03: o
            // heurístico fixo abaixo ("centro da torre + 2 linhas ao sul")
            // pressupõe uma porta ao SUL da torre — só valia enquanto a torre
            // ficava em 42/42 com o único vizinho andável ao sul. Depois de
            // reposicionar a torre (ver ATUALIZAÇÃO 2026-09-03 item 6), a porta
            // passou a ficar a LESTE, e esse heurístico fixo fazia o jogador
            // nascer numa célula '#' bloqueada — testado ao vivo, confirmado o
            // bug, corrigido aqui.
            S.playerCol = S.entryPoi.defaultSpawn.globalCol;
            S.playerRow = S.entryPoi.defaultSpawn.globalRow;
        } else if (window.OverworldTowerGridPos) {
            // Fallback antigo, só usado se o POI não trouxer defaultSpawn — assume
            // porta ao sul (ver nota acima); não confiar nisto sem checar contra o
            // grid real se a torre for reposicionada de novo sem atualizar
            // pois.json:defaultSpawn.
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
        S.playerDrawCol = S.playerCol;
        S.playerDrawRow = S.playerRow;
        S.camX = null; S.camY = null; // força snap da câmera pro spawn no próximo render()
        S.lastRenderAt = 0;
        // CAUSA RAIZ REAL do "nome de rua não aparece" reportado 2026-09-03 (Problema 1) —
        // investigado ao vivo (window.OverworldDebug.setZoom + Deactivate/Activate real,
        // não suposição): S.zoomLevel NUNCA era resetado aqui. drawStreetNameLabel() (o
        // rótulo "junto da curva" que o usuário procurava) só é chamado quando
        // !isMacroZoom() (zoomLevel >= ZOOM_MACRO_THRESHOLD=0.75, ver render()) — o código
        // em si SEMPRE esteve correto e É chamado (confirmado com o overworld ativo de
        // verdade: em zoomLevel=1 os rótulos aparecem nítidos, cor #eafffe sobre pílula
        // escura, sem nenhum erro no console). O bug real é de ESTADO: um scroll-out do
        // mouse (bem natural ao testar/olhar o mapa, ou mesmo um "-" sem querer) deixa
        // zoomLevel abaixo do limiar; como nada resetava esse valor, ele PERSISTE em
        // qualquer reativação seguinte (voltar do Episódio 1 pela torre, morrer e
        // renascer, relogar) até um F5 na página inteira — e em zoom macro
        // drawStreetCurves() nem gera candidato de rótulo nenhum (retorna {} de
        // propósito, ver comentário na função), então os nomes desaparecem
        // silenciosamente e ficam sumidos pro resto da sessão. Reproduzido ao vivo: 1)
        // OverworldDebug.setZoom(0.5); 2) DeactivateOverworld()+ActivateOverworld(); 3)
        // getZoom() ainda voltava zoomLevel:0.5 — confirma que não era resetado. Fix:
        // toda entrada real no overworld (não só a primeira) volta pro zoom PADRÃO
        // documentado (ZOOM_DEFAULT=1.0, acima do limiar de 0.75) — mesmo princípio já
        // aplicado a câmera/posição/interpolação nas linhas acima, só que também pro zoom.
        S.zoomLevel = ZOOM_DEFAULT;
        S.otherPlayersDraw = {}; // descarta interpolação de outros jogadores de uma sessão anterior

        // 2026-09-03 (movimento contínuo unificado — rua e livre) — reseta o
        // controlador de movimento pro novo spawn, mesmo espírito do reset de
        // câmera/lerp acima: sem isto, S.onStreet/S.playerContCol/Row reteriam
        // estado de uma sessão ANTERIOR do overworld (ex.: reentrando depois do
        // Episódio 1 num ponto do mapa fora de rua enquanto ainda "achava" que
        // estava sobre uma rua).
        S.onStreet = false;
        S.playerContCol = S.playerCol;
        S.playerContRow = S.playerRow;
        S.lastMoveAt = 0;

        S.canvas.style.display = 'block';
        // Problema 3 (2026-09-03) — botões de zoom aparecem junto com o canvas do
        // overworld (mesmo ciclo de vida, ver ensureZoomControls()); 'flex' (não
        // 'block') porque align-items/justify-content do CSS deles só centralizam o
        // símbolo +/− com display flex.
        if (S.zoomInBtn) S.zoomInBtn.style.display = 'flex';
        if (S.zoomOutBtn) S.zoomOutBtn.style.display = 'flex';

        if (S.rafId) cancelAnimationFrame(S.rafId); // nunca dois loops vivos ao mesmo tempo (skill §4)
        detachInput();
        attachInput();

        if (!S.resizeHandler) {
            S.resizeHandler = function () { resizeCanvasToContainer(); };
            window.addEventListener('resize', S.resizeHandler);
        }

        S.isActive = true;
        window.OverworldState.isActive = true;
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
        // Problema 3 (2026-09-03) — some junto com o canvas (ver ativação simétrica em activateNow()).
        if (S.zoomInBtn) S.zoomInBtn.style.display = 'none';
        if (S.zoomOutBtn) S.zoomOutBtn.style.display = 'none';
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
