// server/seed_badges.js
// Catálogo estático de emblemas/conquistas — populado uma vez em ensureTableReady()
// (server/db.js), igual ghostdex_data.js do cliente mas server-side. Nunca escrito
// por um jogador; só player_badges (o desbloqueio real por conta) muda em runtime.
//
// Este arquivo hoje só tem os 123 emblemas das 3 categorias mais difíceis de
// rastrear (Exploração em 8-bits 50, Acrobacias e Movimento 40, Segredos e Easter
// Eggs 33) — escopo do gameplay-engineer (engine.js/rpg_system.js), ids prefixados
// expl_/acro_/segr_, sort_order a partir de 1000. As outras 210 (numéricas —
// level/kills/itens/vidas/ghostdex) são do outro agente: exporte-as no MESMO array
// (concatene aqui, ids com outro prefixo, sort_order 0-999 pra não colidir) em vez
// de criar um seed file paralelo — db.js só varre module.exports deste arquivo.
//
// requirement_type usa duas convenções de "direção" (não existe coluna de direção
// no schema — ver isLowerBetter() em db.js, que decide por regra de nome):
//   - "quanto menor, melhor" (tempo): prefixo level_time_ ou == full_game_time
//     -> desbloqueia quando progresso <= requirement_value.
//   - "quanto maior, melhor" (contador/threshold): todo o resto (padrão)
//     -> desbloqueia quando progresso >= requirement_value.
// Se um requirement_type numérico novo (do outro agente) também for "quanto menor
// melhor", adicione o prefixo/nome dele em isLowerBetter() (db.js) — não invente
// uma segunda convenção.
//
// IMPORTANTE (01/09/2026): os emblemas do backend-architect (requirement_type
// 'level'/'kills'/'lives'/'episode_items_complete') NÃO passam por submitBadgeProgress
// nem por player_stat_progress — checkAndUnlockBadges(email), em db.js, relê esses 4
// direto de players/characters a cada save_game_state/increment_stat (pull-based). Só
// os requirement_type introduzidos pelos meus 123 (abaixo) usam o caminho push-based
// (submitBadgeProgress + player_stat_progress) — são dois mecanismos de checagem
// diferentes lendo do mesmo catálogo "badges", não um só.
//
// Ver relatório do gameplay-engineer (01/09/2026) pra qual dos 123 tem hook real
// testado ponta a ponta, qual tem hook real não testado, e qual é lacuna documentada
// (mecânica que não existe no jogo hoje — sala secreta extra, narrador, dash, etc.).

// =============================================================================================
// BACKEND-ARCHITECT: 197 emblemas numéricos (Evolução Assombrada / Combate Espiritual / Acumulador
// do Além) — 31/08-01/09/2026. Gerados por função (não digitados um a um), concatenados no MESMO
// array de module.exports mais abaixo, por instrução do comentário de cabeçalho deixado pelo
// gameplay-engineer (sort_order 0-999, prefixos evo_/combate_/acumulador_, sem colidir com
// expl_/acro_/segr_ 1000+ dele). Checagem de desbloqueio: checkAndUnlockBadges() em db.js (pull,
// relê level/kills/lives/ghostdex direto de players/characters) — NÃO usa submitBadgeProgress/
// player_stat_progress (esse caminho é só dos requirement_type do gameplay-engineer).
//
// 210 pedidos, 197 entregues — faltam 13 de requirement_type 'boss_basic_attack_only' (categoria
// Combate Espiritual). Investigação real (js/game/ghost_inventory.js, engine.js): existe um
// conceito de "boss" (c_Boss: crow/slime/demon_fly/skull/episode1_ghost) e os hits já chegam
// tageados por tipo (emitPlayerAttack({type:'jump'|'spell_ice'|'orb'|...})), mas isso é só
// broadcast de multiplayer (server/index.js, player_attack/kill_boss) — nada persiste nem agrega
// "quais tipos de dano esse boss específico já sofreu" pra saber, na morte, se foi só ataque
// básico. Sem esse hook novo (rastrear no cliente por instância de boss + mandar um flag limpo na
// morte), essas 13 badges não teriam como ser desbloqueadas nunca — preferi documentar a lacuna a
// semear linhas que ninguém jamais vai conseguir desbloquear. Ver relatório do backend-architect
// pro detalhe completo (inclui também o achado de NUMERIC_BOUNDS.level = [1,999] em db.js, que
// hoje rejeitaria qualquer level acima de 999 muito antes de chegar nos badges de bilhões).
function generateBackendArchitectBadges() {
    const usedNames = new Set();
    function uniqueName(c) {
        if (usedNames.has(c)) throw new Error('COLISÃO DE NOME NÃO ESPERADA: ' + c);
        usedNames.add(c);
        return c;
    }
    const FEMININE_OVERRIDES = { 'brincalhão': 'brincalhona', 'sorrateiro': 'sorrateira', 'rondador': 'rondadora' };
    function feminize(adj) {
        const lower = adj.toLowerCase();
        if (FEMININE_OVERRIDES[lower]) { const f = FEMININE_OVERRIDES[lower]; return adj[0] === adj[0].toUpperCase() ? f[0].toUpperCase() + f.slice(1) : f; }
        if (lower.endsWith('o')) return adj.slice(0, -1) + 'a';
        return adj;
    }
    const N = (word, gender) => ({ word, gender });
    function makeTierNamer(nouns, adjMasc) {
        let i = 0;
        return function next() {
            const noun = nouns[i % nouns.length];
            const adjM = adjMasc[i % adjMasc.length];
            const adj = noun.gender === 'f' ? feminize(adjM) : adjM;
            i++;
            return uniqueName(`${adj} ${noun.word}`);
        };
    }
    function fmt(n) { return n.toLocaleString('pt-BR'); }

    // --- EVOLUÇÃO ASSOMBRADA — 100 badges, requirement_type 'level' ---
    function generateLevelThresholds() {
        const out = [];
        for (let v = 5; v <= 100; v += 5) out.push(v);
        for (let v = 125; v <= 500; v += 25) out.push(v);
        for (let v = 550; v <= 1000; v += 50) out.push(v);
        for (let v = 1100; v <= 2000; v += 100) out.push(v);
        for (let v = 2500; v <= 5000; v += 500) out.push(v);
        for (let v = 6000; v <= 10000; v += 1000) out.push(v);
        [15000, 20000, 25000, 50000, 75000, 100000].forEach(v => out.push(v));
        [250000, 500000, 750000, 1000000].forEach(v => out.push(v));
        [2500000, 5000000, 7500000, 10000000].forEach(v => out.push(v));
        [25000000, 50000000, 75000000, 100000000].forEach(v => out.push(v));
        [250000000, 500000000, 750000000, 1000000000].forEach(v => out.push(v));
        // Faixa dos bilhões: spec original tinha 6 pontos (2.5B,5B,10B,25B,50B,100B) e a soma total
        // das faixas dava 95, não 100. AJUSTE (documentado no relatório): os 6 pontos originais
        // continuam todos aqui, intactos; inseri 5 pontos intermediários novos (7.5B, 15B, 35B,
        // 65B, 80B) só pra fechar em 11 nesta faixa = 100 no total. Termina exatamente em
        // 100.000.000.000 = "Entidade Máxima", como pedido.
        [
            2500000000, 5000000000, 7500000000, 10000000000, 15000000000,
            25000000000, 35000000000, 50000000000, 65000000000, 80000000000,
            100000000000
        ].forEach(v => out.push(v));
        return out;
    }
    const FIXED_LEVEL_NAMES = { 5: 'Espírito Jovem', 10: 'Assombração Local', 50: 'Poltergeist Respeitado', 100000000000: 'Entidade Máxima' };

    function generateEvolucaoAssombrada() {
        const thresholds = generateLevelThresholds();
        if (thresholds.length !== 100) throw new Error('Esperava 100 thresholds de level, veio ' + thresholds.length);
        Object.values(FIXED_LEVEL_NAMES).forEach(n => usedNames.add(n));

        const namers = [
            { max: 100, namer: makeTierNamer(
                [N('Sombra', 'f'), N('Vulto', 'm'), N('Presença', 'f'), N('Sussurro', 'm'), N('Assombração', 'f')],
                ['Inquieto', 'Errante', 'Tímido', 'Curioso', 'Pálido', 'Desperto', 'Vagante', 'Brincalhão', 'Travesso', 'Ansioso', 'Ligeiro', 'Fugaz', 'Discreto', 'Rondador', 'Iniciante', 'Noturno', 'Sorrateiro', 'Leve', 'Recente', 'Primeiro']
            ) },
            { max: 500, namer: makeTierNamer(
                [N('Fantasma', 'm'), N('Espectro', 'm'), N('Aparição', 'f'), N('Ente', 'm'), N('Alma Penada', 'f')],
                ['Persistente', 'Sagaz', 'Astuto', 'Determinado', 'Constante', 'Firme', 'Resiliente', 'Experiente', 'Hábil', 'Confiante', 'Ousado', 'Destemido', 'Fervoroso', 'Obstinado', 'Vigilante', 'Perspicaz']
            ) },
            { max: 1000, namer: makeTierNamer(
                [N('Poltergeist', 'm'), N('Espectro Maior', 'm'), N('Fantasma Veterano', 'm'), N('Assombração Antiga', 'f')],
                ['Reconhecido', 'Notório', 'Temido', 'Aclamado', 'Celebrado', 'Lendário', 'Consagrado', 'Distinto', 'Ilustre', 'Eminente']
            ) },
            { max: 2000, namer: makeTierNamer(
                [N('Entidade', 'f'), N('Manifestação', 'f'), N('Presença Maior', 'f'), N('Eco Espectral', 'm')],
                ['Crescente', 'Firme', 'Sólido', 'Constante', 'Ampliado', 'Fortalecido', 'Expandido', 'Intenso', 'Vívido', 'Pleno']
            ) },
            { max: 5000, namer: makeTierNamer(
                [N('Entidade Maior', 'f'), N('Fenômeno', 'm'), N('Sombra Eterna', 'f')],
                ['Formidável', 'Imponente', 'Robusto', 'Grandioso', 'Vigoroso', 'Poderoso']
            ) },
            { max: 10000, namer: makeTierNamer(
                [N('Presença Suprema', 'f'), N('Manifestação Densa', 'f')],
                ['Temível', 'Feroz', 'Selvagem', 'Brutal', 'Implacável']
            ) },
            { max: 100000, namer: makeTierNamer(
                [N('Lenda Assombrada', 'f'), N('Mito Espectral', 'm'), N('Fábula Sombria', 'f')],
                ['Emergente', 'Consolidado', 'Reverenciado', 'Venerado', 'Aclamado', 'Exaltado']
            ) },
            { max: 1000000, namer: makeTierNamer(
                [N('Mito Ancestral', 'm'), N('Relíquia Espectral', 'f'), N('Herança Sombria', 'f'), N('Memória Eterna', 'f')],
                ['Antigo', 'Primordial', 'Esquecido', 'Redescoberto']
            ) },
            { max: 10000000, namer: makeTierNamer(
                [N('Avatar da Névoa', 'm'), N('Arauto Sombrio', 'm'), N('Emissário do Além', 'm'), N('Guardião Espectral', 'm')],
                ['Consagrado', 'Iluminado', 'Transcendente', 'Ascendente']
            ) },
            { max: 100000000, namer: makeTierNamer(
                [N('Guardião do Além', 'm'), N('Sentinela Eterna', 'f'), N('Vigia Cósmico', 'm'), N('Custódio Sombrio', 'm')],
                ['Imemorial', 'Insondável', 'Inabalável', 'Incontestável']
            ) },
            { max: 1000000000, namer: makeTierNamer(
                [N('Soberano Espectral', 'm'), N('Imperador Fantasma', 'm'), N('Monarca do Além', 'm'), N('Regente Sombrio', 'm')],
                ['Coroado', 'Absoluto', 'Supremo', 'Onipotente']
            ) },
            { max: 100000000000, namer: makeTierNamer(
                [N('Divindade Sombria', 'f'), N('Deus do Além', 'm'), N('Titã Espectral', 'm'), N('Colosso Cósmico', 'm'), N('Avatar Absoluto', 'm'), N('Ser Primordial', 'm'), N('Entidade Cósmica', 'f'), N('Presença Infinita', 'f'), N('Força Absoluta', 'f'), N('Singularidade Espectral', 'f')],
                ['Ascendente', 'Transcendente', 'Eterno', 'Imortal', 'Infinito', 'Absoluto']
            ) }
        ];

        return thresholds.map((value, idx) => {
            let name = FIXED_LEVEL_NAMES[value];
            if (!name) {
                const tier = namers.find(t => value <= t.max);
                name = tier.namer();
            }
            return {
                id: `evo_lvl_${value}`,
                category: 'evolucao_assombrada',
                name,
                description: `Alcance o nível ${fmt(value)} (o maior nível já atingido por qualquer personagem da conta).`,
                requirement_type: 'level',
                requirement_value: value,
                sort_order: idx
            };
        });
    }

    // --- COMBATE ESPIRITUAL — 47 badges, requirement_type 'kills' (13 boss_basic_attack_only NÃO
    // geradas — ver comentário grande acima) ---
    function generateKillsThresholds() {
        const out = [];
        for (let v = 5000; v <= 50000; v += 5000) out.push(v); // 10 lineares
        const geoCount = 35, geoEnd = 10000000; // 35 multiplicativos até 10.000.000
        const ratio = Math.pow(geoEnd / 50000, 1 / geoCount);
        let cur = 50000;
        function roundNice(n) {
            if (n < 1000) return Math.round(n / 10) * 10;
            if (n < 10000) return Math.round(n / 100) * 100;
            if (n < 100000) return Math.round(n / 1000) * 1000;
            if (n < 1000000) return Math.round(n / 10000) * 10000;
            if (n < 10000000) return Math.round(n / 100000) * 100000;
            return Math.round(n / 1000000) * 1000000;
        }
        function nudgeStep(n) {
            if (n < 1000) return 10;
            if (n < 10000) return 100;
            if (n < 100000) return 1000;
            if (n < 1000000) return 10000;
            if (n < 10000000) return 100000;
            return 1000000;
        }
        for (let i = 0; i < geoCount; i++) {
            cur = cur * ratio;
            let rounded = roundNice(cur);
            if (rounded <= out[out.length - 1]) rounded = out[out.length - 1] + nudgeStep(out[out.length - 1]);
            out.push(rounded);
        }
        out[out.length - 1] = geoEnd;
        if (out.length !== 45) throw new Error('Esperava 45 thresholds de kills, veio ' + out.length);
        return out;
    }
    const FIXED_KILLS_NAMES = { 100: 'Susto Básico', 1000: 'Terror Noturno' };

    function generateCombateEspiritual() {
        Object.values(FIXED_KILLS_NAMES).forEach(n => usedNames.add(n));
        const generated = generateKillsThresholds();
        const combatTiers = [
            { max: 50000, namer: makeTierNamer(
                [N('Caçador de Assombrações', 'm'), N('Perseguidor de Fantasmas', 'm'), N('Combatente do Além', 'm')],
                ['Novato', 'Determinado', 'Corajoso', 'Persistente', 'Afiado', 'Vigilante', 'Ousado', 'Disciplinado', 'Firme', 'Confiante']
            ) },
            { max: 890000, namer: makeTierNamer(
                [N('Exterminador Espectral', 'm'), N('Guerreiro Fantasma', 'm'), N('Duelista do Além', 'm'), N('Vingador Espectral', 'm')],
                ['Feroz', 'Implacável', 'Brutal', 'Selvagem', 'Imparável', 'Impiedoso', 'Voraz', 'Letal', 'Temível', 'Devastador']
            ) },
            { max: 10000000, namer: makeTierNamer(
                [N('Lenda do Combate Espiritual', 'f'), N('Flagelo do Além', 'm'), N('Extirpador de Espectros', 'm'), N('Terror dos Fantasmas', 'm')],
                ['Lendário', 'Mítico', 'Supremo', 'Absoluto', 'Inigualável', 'Imortal', 'Eterno']
            ) }
        ];
        function nameFor(value) { return combatTiers.find(t => value <= t.max).namer(); }

        const named = Object.entries(FIXED_KILLS_NAMES).map(([value, name]) => ({
            id: `combate_kills_${value}`,
            category: 'combate_espiritual',
            name,
            description: `Derrote ${fmt(Number(value))} inimigos, somados ao longo de toda a conta.`,
            requirement_type: 'kills',
            requirement_value: Number(value),
            sort_order: 0
        }));
        const rest = generated.map((value) => ({
            id: `combate_kills_${value}`,
            category: 'combate_espiritual',
            name: nameFor(value),
            description: `Derrote ${fmt(value)} inimigos, somados ao longo de toda a conta.`,
            requirement_type: 'kills',
            requirement_value: value,
            sort_order: 0
        }));
        const all = named.concat(rest).sort((a, b) => a.requirement_value - b.requirement_value);
        all.forEach((b, idx) => { b.sort_order = 100 + idx; }); // 100-146, depois de evolucao (0-99)
        if (all.length !== 47) throw new Error('Esperava 47 badges de combate, veio ' + all.length);
        return all;
    }

    // --- ACUMULADOR DO ALÉM — 50 badges (lives + 1 episode_items_complete) ---
    function generateLivesThresholds() {
        const out = [];
        for (let v = 5000; v <= 50000; v += 5000) out.push(v); // 10 lineares
        const geoCount = 38, geoEnd = 1000000;
        const ratio = Math.pow(geoEnd / 50000, 1 / geoCount);
        let cur = 50000;
        function roundNice(n) {
            if (n < 1000) return Math.round(n / 10) * 10;
            if (n < 10000) return Math.round(n / 100) * 100;
            if (n < 100000) return Math.round(n / 1000) * 1000;
            if (n < 1000000) return Math.round(n / 10000) * 10000;
            return Math.round(n / 100000) * 100000;
        }
        function nudgeStep(n) {
            if (n < 1000) return 10;
            if (n < 10000) return 100;
            if (n < 100000) return 1000;
            if (n < 1000000) return 10000;
            return 100000;
        }
        for (let i = 0; i < geoCount; i++) {
            cur = cur * ratio;
            let rounded = roundNice(cur);
            if (rounded <= out[out.length - 1]) rounded = out[out.length - 1] + nudgeStep(out[out.length - 1]);
            out.push(rounded);
        }
        out[out.length - 1] = geoEnd;
        if (out.length !== 48) throw new Error('Esperava 48 thresholds de vidas, veio ' + out.length);
        return out;
    }

    function generateAcumuladorDoAlem() {
        usedNames.add('Bolso Furado');
        usedNames.add('Caçador de Relíquias');
        const generated = generateLivesThresholds();
        const hoardTiers = [
            { max: 50000, namer: makeTierNamer(
                [N('Colecionador de Vidas', 'm'), N('Guardador de Almas', 'm'), N('Poupador Espectral', 'm')],
                ['Cuidadoso', 'Metódico', 'Dedicado', 'Atento', 'Organizado', 'Prudente', 'Econômico', 'Aplicado', 'Zeloso', 'Disciplinado']
            ) },
            { max: 920000, namer: makeTierNamer(
                [N('Acumulador Espectral', 'm'), N('Cofre de Vidas', 'm'), N('Depósito do Além', 'm'), N('Reservatório Espiritual', 'm'), N('Baú Fantasma', 'm'), N('Arsenal de Vidas', 'm'), N('Estoque Espectral', 'm'), N('Celeiro do Além', 'm')],
                ['Ganancioso', 'Incansável', 'Obsessivo', 'Compulsivo', 'Voraz', 'Insaciável', 'Meticuloso', 'Sistemático', 'Persistente']
            ) },
            { max: 1000000, namer: makeTierNamer(
                [N('Tesouro Vivo do Além', 'm'), N('Celeiro Eterno de Vidas', 'm'), N('Fortuna Espectral Completa', 'f')],
                ['Lendário', 'Supremo', 'Absoluto', 'Inesgotável']
            ) }
        ];
        function nameFor(value) { return hoardTiers.find(t => value <= t.max).namer(); }

        const rows = [];
        rows.push({
            id: 'acumulador_lives_1000',
            category: 'acumulador_do_alem',
            name: 'Bolso Furado',
            description: 'Colete 1.000 vidas, somadas ao longo de toda a conta.',
            requirement_type: 'lives',
            requirement_value: 1000,
            sort_order: 0
        });
        rows.push({
            id: 'acumulador_episode1_complete',
            category: 'acumulador_do_alem',
            name: 'Caçador de Relíquias',
            // 101 = window.g_ghostdexDB.length (js/game/ghostdex_data.js) — todo o conteúdo jogável
            // hoje (33 fases + cave1) é "Episódio 1"; não existe episódio 2+ implementado.
            description: 'Capture todos os 101 fantasmas do Episódio 1 na Ghostdex.',
            requirement_type: 'episode_items_complete',
            requirement_value: 1,
            sort_order: 0
        });
        generated.forEach((value) => {
            rows.push({
                id: `acumulador_lives_${value}`,
                category: 'acumulador_do_alem',
                name: nameFor(value),
                description: `Colete ${fmt(value)} vidas, somadas ao longo de toda a conta.`,
                requirement_type: 'lives',
                requirement_value: value,
                sort_order: 0
            });
        });
        rows.sort((a, b) => {
            if (a.requirement_type === b.requirement_type) return a.requirement_value - b.requirement_value;
            return a.id === 'acumulador_episode1_complete' ? -1 : (b.id === 'acumulador_episode1_complete' ? 1 : 0);
        });
        rows.forEach((b, idx) => { b.sort_order = 147 + idx; }); // 147-196, depois de combate (100-146)
        if (rows.length !== 50) throw new Error('Esperava 50 badges de acumulador, veio ' + rows.length);
        return rows;
    }

    const evolucao = generateEvolucaoAssombrada();
    const combate = generateCombateEspiritual();
    const acumulador = generateAcumuladorDoAlem();
    return evolucao.concat(combate, acumulador);
}
const backendArchitectBadges = generateBackendArchitectBadges();

module.exports = [
    {
        "id": "expl_time_l01",
        "category": "exploracao",
        "name": "Vento Frio — Fase 1",
        "description": "Termine a fase 1 em menos de 45 segundos.",
        "requirement_type": "level_time_L01",
        "requirement_value": 45,
        "sort_order": 1000
    },
    {
        "id": "expl_time_l02",
        "category": "exploracao",
        "name": "Vento Frio — Fase 2",
        "description": "Termine a fase 2 em menos de 48 segundos.",
        "requirement_type": "level_time_L02",
        "requirement_value": 48,
        "sort_order": 1001
    },
    {
        "id": "expl_time_l03",
        "category": "exploracao",
        "name": "Vento Frio — Fase 3",
        "description": "Termine a fase 3 em menos de 50 segundos.",
        "requirement_type": "level_time_L03",
        "requirement_value": 50,
        "sort_order": 1002
    },
    {
        "id": "expl_time_l04",
        "category": "exploracao",
        "name": "Vento Frio — Fase 4",
        "description": "Termine a fase 4 em menos de 73 segundos.",
        "requirement_type": "level_time_L04",
        "requirement_value": 73,
        "sort_order": 1003
    },
    {
        "id": "expl_time_l05",
        "category": "exploracao",
        "name": "Vento Frio — Fase 5",
        "description": "Termine a fase 5 em menos de 75 segundos.",
        "requirement_type": "level_time_L05",
        "requirement_value": 75,
        "sort_order": 1004
    },
    {
        "id": "expl_time_l06",
        "category": "exploracao",
        "name": "Vento Frio — Fase 6",
        "description": "Termine a fase 6 em menos de 78 segundos.",
        "requirement_type": "level_time_L06",
        "requirement_value": 78,
        "sort_order": 1005
    },
    {
        "id": "expl_time_l07",
        "category": "exploracao",
        "name": "Vento Frio — Fase 7",
        "description": "Termine a fase 7 em menos de 60 segundos.",
        "requirement_type": "level_time_L07",
        "requirement_value": 60,
        "sort_order": 1006
    },
    {
        "id": "expl_time_l08",
        "category": "exploracao",
        "name": "Vento Frio — Fase 8",
        "description": "Termine a fase 8 em menos de 63 segundos.",
        "requirement_type": "level_time_L08",
        "requirement_value": 63,
        "sort_order": 1007
    },
    {
        "id": "expl_time_l09",
        "category": "exploracao",
        "name": "Vento Frio — Fase 9",
        "description": "Termine a fase 9 em menos de 65 segundos.",
        "requirement_type": "level_time_L09",
        "requirement_value": 65,
        "sort_order": 1008
    },
    {
        "id": "expl_time_l10",
        "category": "exploracao",
        "name": "Vento Frio — Fase 10",
        "description": "Termine a fase 10 em menos de 88 segundos.",
        "requirement_type": "level_time_L10",
        "requirement_value": 88,
        "sort_order": 1009
    },
    {
        "id": "expl_time_l11",
        "category": "exploracao",
        "name": "Vento Frio — Fase 11",
        "description": "Termine a fase 11 em menos de 90 segundos.",
        "requirement_type": "level_time_L11",
        "requirement_value": 90,
        "sort_order": 1010
    },
    {
        "id": "expl_time_l12",
        "category": "exploracao",
        "name": "Vento Frio — Fase 12",
        "description": "Termine a fase 12 em menos de 73 segundos.",
        "requirement_type": "level_time_L12",
        "requirement_value": 73,
        "sort_order": 1011
    },
    {
        "id": "expl_time_l13",
        "category": "exploracao",
        "name": "Vento Frio — Fase 13",
        "description": "Termine a fase 13 em menos de 75 segundos.",
        "requirement_type": "level_time_L13",
        "requirement_value": 75,
        "sort_order": 1012
    },
    {
        "id": "expl_time_l14",
        "category": "exploracao",
        "name": "Vento Frio — Fase 14",
        "description": "Termine a fase 14 em menos de 78 segundos.",
        "requirement_type": "level_time_L14",
        "requirement_value": 78,
        "sort_order": 1013
    },
    {
        "id": "expl_time_l15",
        "category": "exploracao",
        "name": "Vento Frio — Fase 15",
        "description": "Termine a fase 15 em menos de 80 segundos.",
        "requirement_type": "level_time_L15",
        "requirement_value": 80,
        "sort_order": 1014
    },
    {
        "id": "expl_time_l16",
        "category": "exploracao",
        "name": "Vento Frio — Fase 16",
        "description": "Termine a fase 16 em menos de 103 segundos.",
        "requirement_type": "level_time_L16",
        "requirement_value": 103,
        "sort_order": 1015
    },
    {
        "id": "expl_time_l17",
        "category": "exploracao",
        "name": "Vento Frio — Fase 17",
        "description": "Termine a fase 17 em menos de 105 segundos.",
        "requirement_type": "level_time_L17",
        "requirement_value": 105,
        "sort_order": 1016
    },
    {
        "id": "expl_time_l18",
        "category": "exploracao",
        "name": "Vento Frio — Fase 18",
        "description": "Termine a fase 18 em menos de 108 segundos.",
        "requirement_type": "level_time_L18",
        "requirement_value": 108,
        "sort_order": 1017
    },
    {
        "id": "expl_time_l19",
        "category": "exploracao",
        "name": "Vento Frio — Fase 19",
        "description": "Termine a fase 19 em menos de 90 segundos.",
        "requirement_type": "level_time_L19",
        "requirement_value": 90,
        "sort_order": 1018
    },
    {
        "id": "expl_time_l20",
        "category": "exploracao",
        "name": "Vento Frio — Fase 20",
        "description": "Termine a fase 20 em menos de 113 segundos.",
        "requirement_type": "level_time_L20",
        "requirement_value": 113,
        "sort_order": 1019
    },
    {
        "id": "expl_time_l21",
        "category": "exploracao",
        "name": "Vento Frio — Fase 21",
        "description": "Termine a fase 21 em menos de 115 segundos.",
        "requirement_type": "level_time_L21",
        "requirement_value": 115,
        "sort_order": 1020
    },
    {
        "id": "expl_time_l22",
        "category": "exploracao",
        "name": "Vento Frio — Fase 22",
        "description": "Termine a fase 22 em menos de 118 segundos.",
        "requirement_type": "level_time_L22",
        "requirement_value": 118,
        "sort_order": 1021
    },
    {
        "id": "expl_time_l23",
        "category": "exploracao",
        "name": "Vento Frio — Fase 23",
        "description": "Termine a fase 23 em menos de 100 segundos.",
        "requirement_type": "level_time_L23",
        "requirement_value": 100,
        "sort_order": 1022
    },
    {
        "id": "expl_time_l24",
        "category": "exploracao",
        "name": "Vento Frio — Fase 24",
        "description": "Termine a fase 24 em menos de 103 segundos.",
        "requirement_type": "level_time_L24",
        "requirement_value": 103,
        "sort_order": 1023
    },
    {
        "id": "expl_time_l25",
        "category": "exploracao",
        "name": "Vento Frio — Fase 25",
        "description": "Termine a fase 25 em menos de 105 segundos.",
        "requirement_type": "level_time_L25",
        "requirement_value": 105,
        "sort_order": 1024
    },
    {
        "id": "expl_time_l26",
        "category": "exploracao",
        "name": "Vento Frio — Fase 26",
        "description": "Termine a fase 26 em menos de 108 segundos.",
        "requirement_type": "level_time_L26",
        "requirement_value": 108,
        "sort_order": 1025
    },
    {
        "id": "expl_time_l27",
        "category": "exploracao",
        "name": "Vento Frio — Fase 27",
        "description": "Termine a fase 27 em menos de 110 segundos.",
        "requirement_type": "level_time_L27",
        "requirement_value": 110,
        "sort_order": 1026
    },
    {
        "id": "expl_time_l28",
        "category": "exploracao",
        "name": "Vento Frio — Fase 28",
        "description": "Termine a fase 28 em menos de 113 segundos.",
        "requirement_type": "level_time_L28",
        "requirement_value": 113,
        "sort_order": 1027
    },
    {
        "id": "expl_time_l29",
        "category": "exploracao",
        "name": "Vento Frio — Fase 29",
        "description": "Termine a fase 29 em menos de 115 segundos.",
        "requirement_type": "level_time_L29",
        "requirement_value": 115,
        "sort_order": 1028
    },
    {
        "id": "expl_time_l30",
        "category": "exploracao",
        "name": "Vento Frio — Fase 30",
        "description": "Termine a fase 30 em menos de 118 segundos.",
        "requirement_type": "level_time_L30",
        "requirement_value": 118,
        "sort_order": 1029
    },
    {
        "id": "expl_time_l31",
        "category": "exploracao",
        "name": "Vento Frio — Fase 31",
        "description": "Termine a fase 31 em menos de 120 segundos.",
        "requirement_type": "level_time_L31",
        "requirement_value": 120,
        "sort_order": 1030
    },
    {
        "id": "expl_time_l32",
        "category": "exploracao",
        "name": "Vento Frio — Fase 32",
        "description": "Termine a fase 32 em menos de 123 segundos.",
        "requirement_type": "level_time_L32",
        "requirement_value": 123,
        "sort_order": 1031
    },
    {
        "id": "expl_time_l33",
        "category": "exploracao",
        "name": "Vento Frio — Fase 33",
        "description": "Termine a fase 33 em menos de 145 segundos.",
        "requirement_type": "level_time_L33",
        "requirement_value": 145,
        "sort_order": 1032
    },
    {
        "id": "expl_time_cave1",
        "category": "exploracao",
        "name": "Vento Frio — Cave1",
        "description": "Termine a sala secreta CAVE1 (derrote o guardião) em menos de 90 segundos.",
        "requirement_type": "level_time_cave1",
        "requirement_value": 90,
        "sort_order": 1033
    },
    {
        "id": "expl_secret_room_found",
        "category": "exploracao",
        "name": "Curiosidade Mórbida",
        "description": "Encontre e entre pela primeira vez na sala secreta (porta cyan \"cave1\" da fase 3, precisa da Blue Key da fase 6).",
        "requirement_type": "secret_room_found",
        "requirement_value": 1,
        "sort_order": 1034
    },
    {
        "id": "expl_map_100_single",
        "category": "exploracao",
        "name": "Cartógrafo Fantasma",
        "description": "Explore 100% dos tiles pisáveis de uma fase em uma única sessão.",
        "requirement_type": "map_explored_single",
        "requirement_value": 100,
        "sort_order": 1035
    },
    {
        "id": "expl_map_100_cave1",
        "category": "exploracao",
        "name": "Cartógrafo da Cave1",
        "description": "Explore 100% dos tiles pisáveis da sala secreta CAVE1.",
        "requirement_type": "map_explored_single_cave1",
        "requirement_value": 100,
        "sort_order": 1036
    },
    {
        "id": "expl_map_100_x5",
        "category": "exploracao",
        "name": "Cartógrafo Fantasma II",
        "description": "Explore 100% de 5 fases diferentes (ao longo de várias sessões).",
        "requirement_type": "map_explored_level_count",
        "requirement_value": 5,
        "sort_order": 1037
    },
    {
        "id": "expl_map_100_x10",
        "category": "exploracao",
        "name": "Cartógrafo Fantasma III",
        "description": "Explore 100% de 10 fases diferentes.",
        "requirement_type": "map_explored_level_count",
        "requirement_value": 10,
        "sort_order": 1038
    },
    {
        "id": "expl_map_100_all",
        "category": "exploracao",
        "name": "Cartógrafo Fantasma IV",
        "description": "Explore 100% das 33 fases + CAVE1 (34 mapas).",
        "requirement_type": "map_explored_level_count",
        "requirement_value": 34,
        "sort_order": 1039
    },
    {
        "id": "expl_fullgame_60min",
        "category": "exploracao",
        "name": "Jornada Completa",
        "description": "Termine as 33 fases (porta legítima, sem senha VIP) em até 60 minutos de tempo total de jogo.",
        "requirement_type": "full_game_time",
        "requirement_value": 3600,
        "sort_order": 1040
    },
    {
        "id": "expl_fullgame_30min",
        "category": "exploracao",
        "name": "Jornada Relâmpago",
        "description": "Termine as 33 fases (porta legítima, sem senha VIP) em até 30 minutos de tempo total de jogo.",
        "requirement_type": "full_game_time",
        "requirement_value": 1800,
        "sort_order": 1041
    },
    {
        "id": "expl_revisit_x5",
        "category": "exploracao",
        "name": "Fantasma Nostálgico I",
        "description": "Use a porta \"back\" pra voltar a uma fase já visitada, 5 vezes.",
        "requirement_type": "levels_revisited_count",
        "requirement_value": 5,
        "sort_order": 1042
    },
    {
        "id": "expl_revisit_x10",
        "category": "exploracao",
        "name": "Fantasma Nostálgico II",
        "description": "Use a porta \"back\" 10 vezes.",
        "requirement_type": "levels_revisited_count",
        "requirement_value": 10,
        "sort_order": 1043
    },
    {
        "id": "expl_revisit_x20",
        "category": "exploracao",
        "name": "Fantasma Nostálgico III",
        "description": "Use a porta \"back\" 20 vezes.",
        "requirement_type": "levels_revisited_count",
        "requirement_value": 20,
        "sort_order": 1044
    },
    {
        "id": "expl_lifetime_pct_25",
        "category": "exploracao",
        "name": "Explorador Fantasma I",
        "description": "25% do mapa total do jogo (todas as fases somadas) explorado ao longo da sua conta.",
        "requirement_type": "lifetime_map_explored_pct",
        "requirement_value": 25,
        "sort_order": 1045
    },
    {
        "id": "expl_lifetime_pct_50",
        "category": "exploracao",
        "name": "Explorador Fantasma II",
        "description": "50% do mapa total do jogo explorado.",
        "requirement_type": "lifetime_map_explored_pct",
        "requirement_value": 50,
        "sort_order": 1046
    },
    {
        "id": "expl_lifetime_pct_75",
        "category": "exploracao",
        "name": "Explorador Fantasma III",
        "description": "75% do mapa total do jogo explorado.",
        "requirement_type": "lifetime_map_explored_pct",
        "requirement_value": 75,
        "sort_order": 1047
    },
    {
        "id": "expl_lifetime_pct_100",
        "category": "exploracao",
        "name": "Explorador Fantasma IV",
        "description": "100% do mapa total do jogo explorado.",
        "requirement_type": "lifetime_map_explored_pct",
        "requirement_value": 100,
        "sort_order": 1048
    },
    {
        "id": "expl_bluekey_collected",
        "category": "exploracao",
        "name": "Chave Azul",
        "description": "Colete a Blue Key (fase 6).",
        "requirement_type": "item_collected_bluekey",
        "requirement_value": 1,
        "sort_order": 1049
    },
    {
        "id": "acro_ghostphase_3",
        "category": "acrobacias",
        "name": "Deslizamento Sombrio I",
        "description": "Atravesse 3 obstáculos sólidos usando Ghost Mode (F).",
        "requirement_type": "ghost_mode_phase_count",
        "requirement_value": 3,
        "sort_order": 1050
    },
    {
        "id": "acro_ghostphase_10",
        "category": "acrobacias",
        "name": "Deslizamento Sombrio II",
        "description": "Atravesse 10 obstáculos sólidos usando Ghost Mode (F).",
        "requirement_type": "ghost_mode_phase_count",
        "requirement_value": 10,
        "sort_order": 1051
    },
    {
        "id": "acro_ghostphase_25",
        "category": "acrobacias",
        "name": "Deslizamento Sombrio III",
        "description": "Atravesse 25 obstáculos sólidos usando Ghost Mode (F).",
        "requirement_type": "ghost_mode_phase_count",
        "requirement_value": 25,
        "sort_order": 1052
    },
    {
        "id": "acro_ghostphase_50",
        "category": "acrobacias",
        "name": "Deslizamento Sombrio IV",
        "description": "Atravesse 50 obstáculos sólidos usando Ghost Mode (F).",
        "requirement_type": "ghost_mode_phase_count",
        "requirement_value": 50,
        "sort_order": 1053
    },
    {
        "id": "acro_phantomdodge_10",
        "category": "acrobacias",
        "name": "Reflexos do Além I",
        "description": "Sobreviva a 10 contatos com fogo/água ou inimigos graças à invulnerabilidade do Phantom Form (R). Reinterpretação honesta: o jogo não tem \"dash\", esse é o mecanismo real mais próximo de uma esquiva.",
        "requirement_type": "phantom_hazard_survive_count",
        "requirement_value": 10,
        "sort_order": 1054
    },
    {
        "id": "acro_phantomdodge_25",
        "category": "acrobacias",
        "name": "Reflexos do Além II",
        "description": "Sobreviva a 25 contatos com fogo/água ou inimigos graças à invulnerabilidade do Phantom Form (R). Reinterpretação honesta: o jogo não tem \"dash\", esse é o mecanismo real mais próximo de uma esquiva.",
        "requirement_type": "phantom_hazard_survive_count",
        "requirement_value": 25,
        "sort_order": 1055
    },
    {
        "id": "acro_phantomdodge_50",
        "category": "acrobacias",
        "name": "Reflexos do Além III",
        "description": "Sobreviva a 50 contatos com fogo/água ou inimigos graças à invulnerabilidade do Phantom Form (R). Reinterpretação honesta: o jogo não tem \"dash\", esse é o mecanismo real mais próximo de uma esquiva.",
        "requirement_type": "phantom_hazard_survive_count",
        "requirement_value": 50,
        "sort_order": 1056
    },
    {
        "id": "acro_phantomdodge_100",
        "category": "acrobacias",
        "name": "Reflexos do Além IV",
        "description": "Sobreviva a 100 contatos com fogo/água ou inimigos graças à invulnerabilidade do Phantom Form (R). Reinterpretação honesta: o jogo não tem \"dash\", esse é o mecanismo real mais próximo de uma esquiva.",
        "requirement_type": "phantom_hazard_survive_count",
        "requirement_value": 100,
        "sort_order": 1057
    },
    {
        "id": "acro_triplejump_10",
        "category": "acrobacias",
        "name": "Salto Triplo I",
        "description": "Execute o salto triplo completo (W três vezes) 10 vezes.",
        "requirement_type": "triple_jump_count",
        "requirement_value": 10,
        "sort_order": 1058
    },
    {
        "id": "acro_triplejump_50",
        "category": "acrobacias",
        "name": "Salto Triplo II",
        "description": "Execute o salto triplo completo (W três vezes) 50 vezes.",
        "requirement_type": "triple_jump_count",
        "requirement_value": 50,
        "sort_order": 1059
    },
    {
        "id": "acro_triplejump_100",
        "category": "acrobacias",
        "name": "Salto Triplo III",
        "description": "Execute o salto triplo completo (W três vezes) 100 vezes.",
        "requirement_type": "triple_jump_count",
        "requirement_value": 100,
        "sort_order": 1060
    },
    {
        "id": "acro_triplejump_250",
        "category": "acrobacias",
        "name": "Salto Triplo IV",
        "description": "Execute o salto triplo completo (W três vezes) 250 vezes.",
        "requirement_type": "triple_jump_count",
        "requirement_value": 250,
        "sort_order": 1061
    },
    {
        "id": "acro_narrowland_5",
        "category": "acrobacias",
        "name": "Pouso de Precisão I",
        "description": "Pouse um salto triplo completo numa plataforma isolada de 1 bloco, 5 vezes.",
        "requirement_type": "triple_jump_narrow_platform_count",
        "requirement_value": 5,
        "sort_order": 1062
    },
    {
        "id": "acro_narrowland_20",
        "category": "acrobacias",
        "name": "Pouso de Precisão II",
        "description": "Pouse um salto triplo completo numa plataforma isolada de 1 bloco, 20 vezes.",
        "requirement_type": "triple_jump_narrow_platform_count",
        "requirement_value": 20,
        "sort_order": 1063
    },
    {
        "id": "acro_narrowland_50",
        "category": "acrobacias",
        "name": "Pouso de Precisão III",
        "description": "Pouse um salto triplo completo numa plataforma isolada de 1 bloco, 50 vezes.",
        "requirement_type": "triple_jump_narrow_platform_count",
        "requirement_value": 50,
        "sort_order": 1064
    },
    {
        "id": "acro_bossstomp_5",
        "category": "acrobacias",
        "name": "Pisão Fantasma I",
        "description": "Acerte 5 ataques de pisão (pulo sobre a cabeça de um chefe).",
        "requirement_type": "boss_stomp_count",
        "requirement_value": 5,
        "sort_order": 1065
    },
    {
        "id": "acro_bossstomp_20",
        "category": "acrobacias",
        "name": "Pisão Fantasma II",
        "description": "Acerte 20 ataques de pisão (pulo sobre a cabeça de um chefe).",
        "requirement_type": "boss_stomp_count",
        "requirement_value": 20,
        "sort_order": 1066
    },
    {
        "id": "acro_bossstomp_50",
        "category": "acrobacias",
        "name": "Pisão Fantasma III",
        "description": "Acerte 50 ataques de pisão (pulo sobre a cabeça de um chefe).",
        "requirement_type": "boss_stomp_count",
        "requirement_value": 50,
        "sort_order": 1067
    },
    {
        "id": "acro_phantomsustain_5",
        "category": "acrobacias",
        "name": "Velocidade Máxima Sustentada I",
        "description": "Mantenha o Phantom Form (R) ativo em movimento contínuo pelos 5s inteiros de duração, 5 vezes.",
        "requirement_type": "phantom_form_sustained_count",
        "requirement_value": 5,
        "sort_order": 1068
    },
    {
        "id": "acro_phantomsustain_20",
        "category": "acrobacias",
        "name": "Velocidade Máxima Sustentada II",
        "description": "Mantenha o Phantom Form (R) ativo em movimento contínuo pelos 5s inteiros de duração, 20 vezes.",
        "requirement_type": "phantom_form_sustained_count",
        "requirement_value": 20,
        "sort_order": 1069
    },
    {
        "id": "acro_phantomsustain_50",
        "category": "acrobacias",
        "name": "Velocidade Máxima Sustentada III",
        "description": "Mantenha o Phantom Form (R) ativo em movimento contínuo pelos 5s inteiros de duração, 50 vezes.",
        "requirement_type": "phantom_form_sustained_count",
        "requirement_value": 50,
        "sort_order": 1070
    },
    {
        "id": "acro_fastforward_5000",
        "category": "acrobacias",
        "name": "Acelerador Fantasma I",
        "description": "Percorra 5000px segurando T (Fast Forward 2x).",
        "requirement_type": "fast_forward_distance",
        "requirement_value": 5000,
        "sort_order": 1071
    },
    {
        "id": "acro_fastforward_20000",
        "category": "acrobacias",
        "name": "Acelerador Fantasma II",
        "description": "Percorra 20000px segurando T (Fast Forward 2x).",
        "requirement_type": "fast_forward_distance",
        "requirement_value": 20000,
        "sort_order": 1072
    },
    {
        "id": "acro_fastforward_50000",
        "category": "acrobacias",
        "name": "Acelerador Fantasma III",
        "description": "Percorra 50000px segurando T (Fast Forward 2x).",
        "requirement_type": "fast_forward_distance",
        "requirement_value": 50000,
        "sort_order": 1073
    },
    {
        "id": "acro_nodamage_1",
        "category": "acrobacias",
        "name": "Sem um Arranhão I",
        "description": "Termine 1 fase(s) sem tomar nenhum dano.",
        "requirement_type": "no_damage_level_clear_count",
        "requirement_value": 1,
        "sort_order": 1074
    },
    {
        "id": "acro_nodamage_5",
        "category": "acrobacias",
        "name": "Sem um Arranhão II",
        "description": "Termine 5 fase(s) sem tomar nenhum dano.",
        "requirement_type": "no_damage_level_clear_count",
        "requirement_value": 5,
        "sort_order": 1075
    },
    {
        "id": "acro_nodamage_15",
        "category": "acrobacias",
        "name": "Sem um Arranhão III",
        "description": "Termine 15 fase(s) sem tomar nenhum dano.",
        "requirement_type": "no_damage_level_clear_count",
        "requirement_value": 15,
        "sort_order": 1076
    },
    {
        "id": "acro_nodamage_34",
        "category": "acrobacias",
        "name": "Sem um Arranhão IV",
        "description": "Termine 34 fase(s) sem tomar nenhum dano.",
        "requirement_type": "no_damage_level_clear_count",
        "requirement_value": 34,
        "sort_order": 1077
    },
    {
        "id": "acro_backtracksafe_5",
        "category": "acrobacias",
        "name": "Ida e Volta I",
        "description": "Volte por uma porta \"back\" e retorne à fase seguinte sem morrer, 5 vezes.",
        "requirement_type": "backtrack_no_death_count",
        "requirement_value": 5,
        "sort_order": 1078
    },
    {
        "id": "acro_backtracksafe_15",
        "category": "acrobacias",
        "name": "Ida e Volta II",
        "description": "Volte por uma porta \"back\" e retorne à fase seguinte sem morrer, 15 vezes.",
        "requirement_type": "backtrack_no_death_count",
        "requirement_value": 15,
        "sort_order": 1079
    },
    {
        "id": "acro_airborne_1",
        "category": "acrobacias",
        "name": "Voo Fantasma I",
        "description": "Termine 1 fase(s) sem nunca tocar as duas fileiras de chão mais baixas (linhas 9 e 10).",
        "requirement_type": "airborne_level_clear_count",
        "requirement_value": 1,
        "sort_order": 1080
    },
    {
        "id": "acro_airborne_5",
        "category": "acrobacias",
        "name": "Voo Fantasma II",
        "description": "Termine 5 fase(s) sem nunca tocar as duas fileiras de chão mais baixas (linhas 9 e 10).",
        "requirement_type": "airborne_level_clear_count",
        "requirement_value": 5,
        "sort_order": 1081
    },
    {
        "id": "acro_airborne_15",
        "category": "acrobacias",
        "name": "Voo Fantasma III",
        "description": "Termine 15 fase(s) sem nunca tocar as duas fileiras de chão mais baixas (linhas 9 e 10).",
        "requirement_type": "airborne_level_clear_count",
        "requirement_value": 15,
        "sort_order": 1082
    },
    {
        "id": "acro_midairphase_10",
        "category": "acrobacias",
        "name": "Passagem Aérea I",
        "description": "Use Ghost Mode (F) enquanto está no ar, 10 vezes.",
        "requirement_type": "ghost_mode_midair_count",
        "requirement_value": 10,
        "sort_order": 1083
    },
    {
        "id": "acro_midairphase_50",
        "category": "acrobacias",
        "name": "Passagem Aérea II",
        "description": "Use Ghost Mode (F) enquanto está no ar, 50 vezes.",
        "requirement_type": "ghost_mode_midair_count",
        "requirement_value": 50,
        "sort_order": 1084
    },
    {
        "id": "acro_sparkmove_25",
        "category": "acrobacias",
        "name": "Faísca em Movimento I",
        "description": "Conjure Spectral Spark (V) enquanto se move, 25 vezes.",
        "requirement_type": "spark_while_moving_count",
        "requirement_value": 25,
        "sort_order": 1085
    },
    {
        "id": "acro_sparkmove_100",
        "category": "acrobacias",
        "name": "Faísca em Movimento II",
        "description": "Conjure Spectral Spark (V) enquanto se move, 100 vezes.",
        "requirement_type": "spark_while_moving_count",
        "requirement_value": 100,
        "sort_order": 1086
    },
    {
        "id": "acro_distance_10000",
        "category": "acrobacias",
        "name": "Andarilho Fantasma I",
        "description": "Percorra 10000px de distância acumulada.",
        "requirement_type": "distance_traveled_px",
        "requirement_value": 10000,
        "sort_order": 1087
    },
    {
        "id": "acro_distance_50000",
        "category": "acrobacias",
        "name": "Andarilho Fantasma II",
        "description": "Percorra 50000px de distância acumulada.",
        "requirement_type": "distance_traveled_px",
        "requirement_value": 50000,
        "sort_order": 1088
    },
    {
        "id": "acro_distance_250000",
        "category": "acrobacias",
        "name": "Andarilho Fantasma III",
        "description": "Percorra 250000px de distância acumulada.",
        "requirement_type": "distance_traveled_px",
        "requirement_value": 250000,
        "sort_order": 1089
    },
    {
        "id": "segr_boundary_10",
        "category": "segredos",
        "name": "Quebrando as Regras I",
        "description": "Tente sair dos limites do mapa 10 vezes.",
        "requirement_type": "boundary_hit_count",
        "requirement_value": 10,
        "sort_order": 1090
    },
    {
        "id": "segr_boundary_30",
        "category": "segredos",
        "name": "Quebrando as Regras II",
        "description": "Tente sair dos limites do mapa 30 vezes.",
        "requirement_type": "boundary_hit_count",
        "requirement_value": 30,
        "sort_order": 1091
    },
    {
        "id": "segr_boundary_100",
        "category": "segredos",
        "name": "Quebrando as Regras III",
        "description": "Tente sair dos limites do mapa 100 vezes.",
        "requirement_type": "boundary_hit_count",
        "requirement_value": 100,
        "sort_order": 1092
    },
    {
        "id": "segr_prevlevel1_5",
        "category": "segredos",
        "name": "Teimoso I",
        "description": "Tente voltar da fase 1 (bloqueado pelo jogo) 5 vezes.",
        "requirement_type": "prevlevel_blocked_count",
        "requirement_value": 5,
        "sort_order": 1093
    },
    {
        "id": "segr_prevlevel1_20",
        "category": "segredos",
        "name": "Teimoso II",
        "description": "Tente voltar da fase 1 (bloqueado pelo jogo) 20 vezes.",
        "requirement_type": "prevlevel_blocked_count",
        "requirement_value": 20,
        "sort_order": 1094
    },
    {
        "id": "segr_cave1locked_3",
        "category": "segredos",
        "name": "Bati na Porta Errada I",
        "description": "Tente abrir a porta da CAVE1 sem a Blue Key, 3 vezes.",
        "requirement_type": "cave1_door_locked_count",
        "requirement_value": 3,
        "sort_order": 1095
    },
    {
        "id": "segr_cave1locked_10",
        "category": "segredos",
        "name": "Bati na Porta Errada II",
        "description": "Tente abrir a porta da CAVE1 sem a Blue Key, 10 vezes.",
        "requirement_type": "cave1_door_locked_count",
        "requirement_value": 10,
        "sort_order": 1096
    },
    {
        "id": "segr_titleidle_300",
        "category": "segredos",
        "name": "O Retorno I",
        "description": "Fique parado na tela inicial sem apertar Start por 5 minutos.",
        "requirement_type": "title_idle_seconds",
        "requirement_value": 300,
        "sort_order": 1097
    },
    {
        "id": "segr_titleidle_900",
        "category": "segredos",
        "name": "O Retorno II",
        "description": "Fique parado na tela inicial sem apertar Start por 15 minutos.",
        "requirement_type": "title_idle_seconds",
        "requirement_value": 900,
        "sort_order": 1098
    },
    {
        "id": "segr_titleidle_1800",
        "category": "segredos",
        "name": "O Retorno III",
        "description": "Fique parado na tela inicial sem apertar Start por 30 minutos.",
        "requirement_type": "title_idle_seconds",
        "requirement_value": 1800,
        "sort_order": 1099
    },
    {
        "id": "segr_password_prompt",
        "category": "segredos",
        "name": "Sussurros do Sistema",
        "description": "Descubra e abra o prompt de senha VIP (tecla P).",
        "requirement_type": "password_prompt_opened",
        "requirement_value": 1,
        "sort_order": 1100
    },
    {
        "id": "segr_password_matrix",
        "category": "segredos",
        "name": "Pílula Vermelha",
        "description": "Use a senha VIP \"matrix\" (pula pra fase 26).",
        "requirement_type": "password_used_matrix",
        "requirement_value": 1,
        "sort_order": 1101
    },
    {
        "id": "segr_password_becopro",
        "category": "segredos",
        "name": "Nome do Desenvolvedor",
        "description": "Use a senha VIP \"becopro\" (pula pra fase 29).",
        "requirement_type": "password_used_becopro",
        "requirement_value": 1,
        "sort_order": 1102
    },
    {
        "id": "segr_password_maximo",
        "category": "segredos",
        "name": "Poder Máximo",
        "description": "Use a senha VIP \"maximo\" (pula pra fase 33).",
        "requirement_type": "password_used_maximo",
        "requirement_value": 1,
        "sort_order": 1103
    },
    {
        "id": "segr_password_all3",
        "category": "segredos",
        "name": "Mestre dos Códigos",
        "description": "Use as 3 senhas VIP diferentes (matrix, becopro, maximo).",
        "requirement_type": "password_used_all3",
        "requirement_value": 1,
        "sort_order": 1104
    },
    {
        "id": "segr_passwordwrong_5",
        "category": "segredos",
        "name": "Chute no Escuro I",
        "description": "Digite uma senha VIP errada 5 vezes.",
        "requirement_type": "password_wrong_attempt_count",
        "requirement_value": 5,
        "sort_order": 1105
    },
    {
        "id": "segr_passwordwrong_15",
        "category": "segredos",
        "name": "Chute no Escuro II",
        "description": "Digite uma senha VIP errada 15 vezes.",
        "requirement_type": "password_wrong_attempt_count",
        "requirement_value": 15,
        "sort_order": 1106
    },
    {
        "id": "segr_level26_binary",
        "category": "segredos",
        "name": "Bem-vindo à Matrix",
        "description": "Chegue na fase 26 e veja o fundo de código binário caindo.",
        "requirement_type": "level26_binary_seen",
        "requirement_value": 1,
        "sort_order": 1107
    },
    {
        "id": "segr_cave1_boss",
        "category": "segredos",
        "name": "Guardião da Caverna",
        "description": "Derrote o chefe caveira original dentro da CAVE1.",
        "requirement_type": "cave1_boss_defeated",
        "requirement_value": 1,
        "sort_order": 1108
    },
    {
        "id": "segr_cave1_diamonds",
        "category": "segredos",
        "name": "Tesouro Escondido",
        "description": "Ative a revelação de diamantes bônus da CAVE1.",
        "requirement_type": "cave1_diamonds_collected",
        "requirement_value": 1,
        "sort_order": 1109
    },
    {
        "id": "segr_cave1_revisit_3",
        "category": "segredos",
        "name": "Frequentador da Cave1 I",
        "description": "Volte a entrar na CAVE1 3 vezes (em sessões/visitas diferentes).",
        "requirement_type": "cave1_revisited_count",
        "requirement_value": 3,
        "sort_order": 1110
    },
    {
        "id": "segr_cave1_revisit_10",
        "category": "segredos",
        "name": "Frequentador da Cave1 II",
        "description": "Volte a entrar na CAVE1 10 vezes (em sessões/visitas diferentes).",
        "requirement_type": "cave1_revisited_count",
        "requirement_value": 10,
        "sort_order": 1111
    },
    {
        "id": "segr_fireball_1",
        "category": "segredos",
        "name": "Bola de Fogo Escondida I",
        "description": "Colete 1 bola(s) de fogo secreta(s) perto de portas de saída (fases 3, 6, 9, 13 e 32 têm uma cada).",
        "requirement_type": "fireball_secret_collected_count",
        "requirement_value": 1,
        "sort_order": 1112
    },
    {
        "id": "segr_fireball_3",
        "category": "segredos",
        "name": "Bola de Fogo Escondida II",
        "description": "Colete 3 bola(s) de fogo secreta(s) perto de portas de saída (fases 3, 6, 9, 13 e 32 têm uma cada).",
        "requirement_type": "fireball_secret_collected_count",
        "requirement_value": 3,
        "sort_order": 1113
    },
    {
        "id": "segr_fireball_5",
        "category": "segredos",
        "name": "Bola de Fogo Escondida III",
        "description": "Colete 5 bola(s) de fogo secreta(s) perto de portas de saída (fases 3, 6, 9, 13 e 32 têm uma cada).",
        "requirement_type": "fireball_secret_collected_count",
        "requirement_value": 5,
        "sort_order": 1114
    },
    {
        "id": "segr_rare_reddiamond",
        "category": "segredos",
        "name": "Diamante Vermelho Raro",
        "description": "Colete um Diamante Vermelho (item raro, só 12 no jogo inteiro).",
        "requirement_type": "rare_first_reddiamond",
        "requirement_value": 1,
        "sort_order": 1115
    },
    {
        "id": "segr_rare_cup",
        "category": "segredos",
        "name": "Taça Rara",
        "description": "Colete uma Taça (item raro, só 11 no jogo inteiro).",
        "requirement_type": "rare_first_cup",
        "requirement_value": 1,
        "sort_order": 1116
    },
    {
        "id": "segr_rare_crown",
        "category": "segredos",
        "name": "Coroa Rara",
        "description": "Colete uma Coroa (item raro, só 14 no jogo inteiro).",
        "requirement_type": "rare_first_crown",
        "requirement_value": 1,
        "sort_order": 1117
    },
    {
        "id": "segr_rare_ring",
        "category": "segredos",
        "name": "Anel Raro",
        "description": "Colete um Anel (item raro, só 13 no jogo inteiro).",
        "requirement_type": "rare_first_ring",
        "requirement_value": 1,
        "sort_order": 1118
    },
    {
        "id": "segr_rare_lifetime_25",
        "category": "segredos",
        "name": "Colecionador de Raridades I",
        "description": "Colete 25 itens raros (diamante vermelho/taça/coroa/anel) somados ao longo da conta.",
        "requirement_type": "rare_collectible_lifetime_count",
        "requirement_value": 25,
        "sort_order": 1119
    },
    {
        "id": "segr_rare_lifetime_50",
        "category": "segredos",
        "name": "Colecionador de Raridades II",
        "description": "Colete 50 itens raros (diamante vermelho/taça/coroa/anel) somados ao longo da conta.",
        "requirement_type": "rare_collectible_lifetime_count",
        "requirement_value": 50,
        "sort_order": 1120
    },
    {
        "id": "segr_fireball_all_run",
        "category": "segredos",
        "name": "Caçador de Segredos",
        "description": "Colete as 5 bolas de fogo secretas numa única partida (sem reiniciar).",
        "requirement_type": "secret_fireball_all_in_run",
        "requirement_value": 1,
        "sort_order": 1121
    },
    {
        "id": "segr_purista",
        "category": "segredos",
        "name": "Sem Atalhos",
        "description": "Termine o jogo (33 fases) sem usar nenhuma senha VIP e sem pular fases.",
        "requirement_type": "purista_sem_atalhos",
        "requirement_value": 1,
        "sort_order": 1122
    },
    // 197 emblemas numéricos do backend-architect (Evolução Assombrada/Combate Espiritual/
    // Acumulador do Além) — gerados no topo deste arquivo, concatenados aqui em vez de um seed
    // file separado (db.js/seedBadgeCatalog só varre module.exports DESTE arquivo).
    ...backendArchitectBadges
];
