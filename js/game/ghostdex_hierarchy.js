// ============================================================================
// HIERARQUIA DE CATEGORIA — Ghostdex (17/09/2026)
// ============================================================================
//
// O QUE É ISTO
// ------------
// Cada uma das 101 espécies da Ghostdex já tem um campo "categoria" (9 valores
// distintos, ver ghostdex_data.js). Até hoje esse campo era puramente
// descritivo — aparecia no glossário e não influenciava nada. Este arquivo
// transforma "categoria" num EIXO DE COMBATE de verdade: um ciclo fechado de
// vantagem/desvantagem (pedra-papel-tesoura) entre as 9 categorias, pronto pra
// ser lido por um futuro sistema de batalha FANTASMA vs FANTASMA.
//
// >>> ESCOPO: este arquivo é SÓ A TABELA + os helpers de consulta. <<<
// O sistema de batalha fantasma-vs-fantasma NÃO existe ainda e NÃO é criado
// aqui. Hoje o único consumidor é a tela de detalhe da Ghostdex
// (ghostdex_ui.js), que mostra ao jogador contra quem a espécie é forte e
// contra quem é fraca. Quando as batalhas forem construídas, elas devem ler
// window.GetCategoriaMatchup() / window.CATEGORIA_MATCHUP daqui — não
// redefinir a tabela em outro lugar.
//
// ============================================================================
// RELAÇÃO COM O SISTEMA ELEMENTAL (engine.js) — LEIA ANTES DE MEXER EM QUALQUER UM DOS DOIS
// ============================================================================
// Já existe no projeto um segundo sistema de matchup, e ele é DIFERENTE deste
// de propósito. Os dois convivem porque medem coisas diferentes:
//
//   ELEMENTO (campo "elemento": fire/ice/lightning/poison/arcane)
//     - Vive em engine.js, na tabela ELEMENT_MATCHUP (~linha 2449).
//     - Reaproveita os nomes das 5 RUNAS que o jogador equipa.
//     - Eixo: "com que MAGIA o jogador está batendo" vs. o elemento do alvo.
//     - É OPT-IN por golpe: só entra na conta quando o jogador escolhe equipar
//       aquela runa / lançar aquela magia. Um golpe sem runa fica em 1.0.
//     - Multiplicadores 1.5 / 1.0 / 0.5 (oscilação de 3.0x entre o melhor e o
//       pior caso), porque o jogador paga por esse pico com uma escolha ativa.
//     - ESTÁ EM USO HOJE, em combate real (jogador vs. chefe).
//
//   CATEGORIA (campo "categoria": os 9 valores abaixo)  <-- ESTE ARQUIVO
//     - Eixo: "que TIPO DE COISA o fantasma É", a identidade inteira dele.
//     - É SEMPRE-ATIVO: não depende de escolha nenhuma no momento do golpe,
//       vale pra toda troca de dano enquanto aquele fantasma estiver em campo.
//     - Por isso os multiplicadores são de propósito MAIS SUAVES: 1.25 / 1.0 /
//       0.8 (oscilação de 1.5625x — cerca de METADE da oscilação do elemento).
//       Um modificador sempre-ativo de 1.5/0.5 faria a escolha de categoria
//       dominar stats, nível e equipamento numa futura batalha; 1.25/0.8 é um
//       peso real na balança sem anular todo o resto do jogo.
//     - AINDA NÃO ENTRA EM COMBATE. É trabalho de base pro futuro.
//
// Por que NÃO foi reaproveitado o "elemento" pra isto: "elemento" já significa
// uma coisa estabelecida e funcionando (a runa do jogador). Sobrecarregá-lo com
// um segundo significado quebraria o sistema que já roda hoje. E por que não os
// "tipos" (14 valores, multi-valorados por fantasma): um fantasma tem 1 ou 2
// tipos, o que geraria matchups ambíguos e sobrepostos — "categoria" é única
// por espécie, que é exatamente o que um ciclo limpo precisa.
//
// Se um dia os DOIS sistemas rodarem juntos na mesma conta de dano, o pior caso
// composto é 0.5 * 0.8 = 0.40x e o melhor é 1.5 * 1.25 = 1.875x. Foi conferido
// de propósito pra continuar dentro de uma faixa jogável.
//
// ============================================================================
// O DESENHO DA HIERARQUIA
// ============================================================================
// São 9 categorias. Um ciclo único de 9 posições (A vence B vence C ... vence
// A) foi DESCARTADO: nele cada categoria venceria só 1 e perderia só pra 1,
// deixando 6 das 8 comparações neutras — 75% dos confrontos não sentiriam nada,
// e nenhum jogador memoriza uma corrente de 9 elos.
//
// Em vez disso: as 9 categorias foram agrupadas em 3 DOMÍNIOS temáticos de 3,
// e o ciclo acontece ENTRE OS DOMÍNIOS. Assim cada fantasma é forte contra 3
// categorias, fraco contra 3, e neutro com as 3 do próprio domínio (incluindo
// a dele mesma). 6 dos 9 confrontos mexem no dano, e a regra cabe numa frase.
//
//   SINAL  >  CONCRETO  >  RESÍDUO  >  SINAL
//
//   "A corrente sobrescreve o concreto, o concreto soterra o que morreu,
//    o que morreu trava a corrente."
//
// DOMÍNIO SINAL — corrente viva, luz, transmissão. O que está ligado agora.
//   - Cybernetic Anomaly ... é o hardware por onde a corrente passa.
//   - Digital Poltergeist ... é dado vivo, travessura dentro de sistema rodando.
//   - Neon Entity ......... é transmissão que virou luz visível.
//
// DOMÍNIO CONCRETO — a cidade física e habitada. O que tem massa e endereço.
//   - Urban Haunt ......... assombra estrutura de pé: estação, prédio, laje.
//   - Street Specter ...... é a rua em si depois que a noite cai.
//   - Toxic Apparition .... é resíduo químico impregnado na matéria da cidade.
//
// DOMÍNIO RESÍDUO — o que ficou pra trás. Memória, margem, abandono.
//   - Echo of the Past .... é o rastro do que a cidade foi e não é mais.
//   - Fringe Spirit ....... é o que cai fora da borda do mapa.
//   - DeSo Primordial Entity . é a massa de dado abandonada mais velha de todas.
//
// POR QUE O CICLO GIRA NESSA DIREÇÃO (justificativa, não sorteio):
//
//   SINAL vence CONCRETO — corrente e luz reescrevem o que a matéria apenas
//     sustenta. Uma fachada de neon reescreve a rua em que está plantada; uma
//     anomalia cibernética reprograma o prédio por dentro. Concreto não tem como
//     recusar o sinal que atravessa ele.
//
//   CONCRETO vence RESÍDUO — cidade em uso soterra o próprio sobejo. Obra nova,
//     trânsito e gente ocupando o espaço enterram o eco e empurram o que é de
//     margem pra ainda mais longe da borda. Lugar que ainda serve pra alguma
//     coisa não tem vaga pro que foi abandonado.
//
//   RESÍDUO vence SINAL — dado morto é justamente o que sistema vivo não
//     consegue interpretar. Eco corrompido embaralha transmissão limpa;
//     protocolo abandonado engasga o que está ativo. Não dá pra transmitir por
//     cima de uma coisa que não está escutando: o resíduo absorve o broadcast e
//     não devolve nada.
//
// DECISÃO DE DESIGN — "DeSo Primordial Entity" NÃO é um tier de imunidade.
//   Só 3 espécies têm essa categoria (#099 Vultowraith, #100 Aerovoid,
//   #101 Becoshade) e são as de stat mais alto do jogo (583-605 de total,
//   contra ~256-310 de um fantasma médio). Foi considerado deixá-las FORA do
//   ciclo, neutras nos dois sentidos (como o arcane é no sistema elemental), e
//   isso foi recusado de propósito: elas já carregam ~2x o poder bruto de um
//   fantasma comum, e dar imunidade ao contra-sistema por cima disso seria
//   acumular duas vantagens na mesma espécie.
//   A regra que rege este arquivo é: A HIERARQUIA É ORTOGONAL AO PODER BRUTO.
//   É exatamente isso que faz pedra-papel-tesoura valer a pena — um Polterstalk
//   de 256 de total com vantagem de domínio tem chance real de incomodar um
//   Vultowraith de 605. Tirar isso mataria a zebra, que é a graça do sistema.
//   (Lore: a entidade primordial cai em RESÍDUO por direito — a linha de lore
//   da espécie #001 já diz, literalmente, "a mass of blockchain data that
//   escaped the DeSo network": abandonada, sobra, vinda de uma rede morta.)
//
// Distribuição de espécies por domínio (ficou quase equilibrada sozinha):
//   SINAL 36 (14+10+12) · CONCRETO 35 (11+9+15) · RESÍDUO 30 (15+12+3)
// ============================================================================

(function () {
    'use strict';

    // Multiplicadores de dano. Ver justificativa no cabeçalho: são mais suaves
    // que os de ELEMENT_MATCHUP (1.5/1.0/0.5) porque este eixo é sempre-ativo.
    var CATEGORIA_MULT = {
        ADVANTAGE: 1.25,
        NEUTRAL:   1.0,
        DISADVANTAGE: 0.8
    };

    // Os 3 domínios e quem vence quem. Esta é a ÚNICA fonte da verdade do
    // ciclo — a tabela 9x9 lá embaixo é derivada daqui no load, pra não existir
    // a chance de uma das 81 células ser digitada errada.
    var DOMAINS = {
        SIGNAL: {
            id: 'SIGNAL',
            label: 'Signal',
            color: '#00FFFF',
            blurb: 'Live current, light and transmission — whatever is switched on right now.',
            beats: 'CONCRETE'
        },
        CONCRETE: {
            id: 'CONCRETE',
            label: 'Concrete',
            color: '#FF9F1C',
            blurb: 'The physical, inhabited city — whatever has mass and an address.',
            beats: 'RESIDUE'
        },
        RESIDUE: {
            id: 'RESIDUE',
            label: 'Residue',
            color: '#B14EFF',
            blurb: 'What got left behind — memory, margin and abandonment.',
            beats: 'SIGNAL'
        }
    };

    // Por que cada domínio vence o próximo (texto curto, usável em UI/tooltip).
    var DOMAIN_REASON = {
        SIGNAL:   'Current and light rewrite what matter only holds up.',
        CONCRETE: 'A city still in use buries its own leftovers.',
        RESIDUE:  'Dead data is exactly what a live system cannot parse.'
    };

    // As 9 categorias reais de ghostdex_data.js -> domínio + a razão de estar
    // nele. Os nomes têm de bater EXATAMENTE com o campo "categoria" das
    // entradas, letra por letra.
    var CATEGORIA_HIERARCHY = {
        'Cybernetic Anomaly': {
            domain: 'SIGNAL',
            why: 'The hardware the current actually runs through.'
        },
        'Digital Poltergeist': {
            domain: 'SIGNAL',
            why: 'Live data making mischief inside a system that is still running.'
        },
        'Neon Entity': {
            domain: 'SIGNAL',
            why: 'Transmission that turned into visible light.'
        },
        'Urban Haunt': {
            domain: 'CONCRETE',
            why: 'Haunts structures that are still standing: stations, buildings, slabs.'
        },
        'Street Specter': {
            domain: 'CONCRETE',
            why: 'The street itself, once the night sets in.'
        },
        'Toxic Apparition': {
            domain: 'CONCRETE',
            why: 'Chemical residue soaked into the city’s own matter.'
        },
        'Echo of the Past': {
            domain: 'RESIDUE',
            why: 'The trace of what the city used to be and is not anymore.'
        },
        'Fringe Spirit': {
            domain: 'RESIDUE',
            why: 'Whatever falls off the edge of the map.'
        },
        'DeSo Primordial Entity': {
            domain: 'RESIDUE',
            why: 'The oldest abandoned mass of data of them all.'
        }
    };

    var ALL_CATEGORIAS = Object.keys(CATEGORIA_HIERARCHY);

    // ---- Derivação da tabela 9x9 -------------------------------------------
    // CATEGORIA_MATCHUP[atacante][defensor] = multiplicador de dano.
    // Gerada do ciclo de domínios acima; um futuro sistema de batalha pode ler
    // esta tabela direto, sem precisar saber o que é um "domínio".
    var CATEGORIA_MATCHUP = {};
    ALL_CATEGORIAS.forEach(function (atk) {
        var atkDomain = CATEGORIA_HIERARCHY[atk].domain;
        CATEGORIA_MATCHUP[atk] = {};
        ALL_CATEGORIAS.forEach(function (def) {
            var defDomain = CATEGORIA_HIERARCHY[def].domain;
            var mult;
            if (atkDomain === defDomain) {
                mult = CATEGORIA_MULT.NEUTRAL;            // mesmo domínio: empate
            } else if (DOMAINS[atkDomain].beats === defDomain) {
                mult = CATEGORIA_MULT.ADVANTAGE;          // atacante domina
            } else {
                mult = CATEGORIA_MULT.DISADVANTAGE;       // defensor domina
            }
            CATEGORIA_MATCHUP[atk][def] = mult;
        });
    });

    // ---- API de consulta ---------------------------------------------------

    /**
     * Multiplicador de dano de uma categoria atacando outra.
     * Categoria desconhecida/ausente -> 1.0 (nunca quebra o combate).
     * @returns {number} 1.25, 1.0 ou 0.8
     */
    function GetCategoriaMatchup(atkCategoria, defCategoria) {
        if (!atkCategoria || !defCategoria) return CATEGORIA_MULT.NEUTRAL;
        var row = CATEGORIA_MATCHUP[atkCategoria];
        if (!row) return CATEGORIA_MULT.NEUTRAL;
        var m = row[defCategoria];
        return (typeof m === 'number') ? m : CATEGORIA_MULT.NEUTRAL;
    }

    /**
     * Perfil completo de uma categoria, pronto pra UI.
     * @returns {object|null} { categoria, domain, domainLabel, domainColor,
     *                          domainBlurb, why, reason,
     *                          strongAgainst[], weakAgainst[], evenWith[] }
     */
    function GetCategoriaProfile(categoria) {
        var entry = CATEGORIA_HIERARCHY[categoria];
        if (!entry) return null;
        var domain = DOMAINS[entry.domain];
        var strong = [], weak = [], even = [];
        ALL_CATEGORIAS.forEach(function (other) {
            var m = GetCategoriaMatchup(categoria, other);
            if (m > 1) strong.push(other);
            else if (m < 1) weak.push(other);
            else if (other !== categoria) even.push(other);
        });
        return {
            categoria: categoria,
            domain: domain.id,
            domainLabel: domain.label,
            domainColor: domain.color,
            domainBlurb: domain.blurb,
            why: entry.why,
            reason: DOMAIN_REASON[domain.id],
            strongAgainst: strong,
            weakAgainst: weak,
            evenWith: even
        };
    }

    /**
     * Atalho: perfil a partir de uma ENTRADA da Ghostdex (ou de um id "007").
     */
    function GetGhostCategoriaProfile(ghostOrId) {
        var ghost = ghostOrId;
        if (typeof ghostOrId === 'string') {
            if (typeof window.GetGhostdexEntry === 'function') {
                ghost = window.GetGhostdexEntry(ghostOrId);
            } else if (window.g_ghostdexDB) {
                ghost = window.g_ghostdexDB.filter(function (g) {
                    return g.id === ghostOrId;
                })[0];
            }
        }
        if (!ghost || !ghost.categoria) return null;
        return GetCategoriaProfile(ghost.categoria);
    }

    // ---- Exports -----------------------------------------------------------
    window.CATEGORIA_MULT = CATEGORIA_MULT;
    window.CATEGORIA_DOMAINS = DOMAINS;
    window.CATEGORIA_DOMAIN_REASON = DOMAIN_REASON;
    window.CATEGORIA_HIERARCHY = CATEGORIA_HIERARCHY;
    window.CATEGORIA_MATCHUP = CATEGORIA_MATCHUP;
    window.GetCategoriaMatchup = GetCategoriaMatchup;
    window.GetCategoriaProfile = GetCategoriaProfile;
    window.GetGhostCategoriaProfile = GetGhostCategoriaProfile;
})();
