var GhostRPG = (function() {
    var BASE_XP = 100;
    // 16/09/2026 — redesenho numérico do nível 100.000.000.000 (100 bilhões, literal e alcançável).
    // Era 1.6 (curva desenhada quando o teto era simbólico/inalcançável); 1.45 é o expoente que
    // torna a subida de fato percorrível até o teto, já que a recompensa de XP (maxHp * 5 por kill,
    // engine.js) escala sozinha assim que a fórmula de HP abaixo (L^1.90) passa a valer.
    var XP_EXPONENT = 1.45;

    // Curva de dano de arma e custo de upgrade (16/09/2026). "tier" é um inteiro pequeno novo
    // (começa em 0, +1 por compra) que substituiu o modelo antigo de usar o próprio dano cru como
    // moeda de entrada (dano += 10 fixo, custo = dano * 100).
    var WEAPON_BASE_DAMAGE = 10;
    var WEAPON_LEVEL_EXPONENT = 1.85;
    var WEAPON_TIER_FACTOR = 1.12;
    var WEAPON_COST_BASE = 100;
    var WEAPON_COST_FACTOR = 1.15;

    // Crescimento passivo de atributo por espécie (16/09/2026): divisor da fórmula
    // growthRate(B) = B / GROWTH_DIVISOR, aplicada como floor(growthRate * (level-1) * GROWTH_PACE).
    var GROWTH_DIVISOR = 65;
    var GROWTH_PACE = 0.6;

    var ATTR_KEYS = ['vit', 'agi', 'int', 'pow', 'mag'];

    // Abreviação de número grande (16/09/2026). Com nível até 100 bilhões, HP de chefe e dano de
    // arma passam a ter 12+ dígitos — número cru no HUD fica ilegível. Sufixos padrão de idle game:
    // K/M/B/T/Qa/Qi. Uma casa decimal só quando ela agrega informação ("1.2B", não "1.0B").
    function formatBigNumber(n) {
        var num = Number(n);
        if (!isFinite(num)) return "0";
        var neg = num < 0;
        num = Math.abs(num);
        if (num < 1000) {
            // Abaixo de mil não abrevia: mostra inteiro (ou 1 casa se for fracionário de verdade).
            var small = (num % 1 === 0) ? String(num) : String(Math.round(num * 10) / 10);
            return (neg ? "-" : "") + small;
        }
        var units = [
            { v: 1e18, s: "Qi" },
            { v: 1e15, s: "Qa" },
            { v: 1e12, s: "T" },
            { v: 1e9, s: "B" },
            { v: 1e6, s: "M" },
            { v: 1e3, s: "K" }
        ];
        for (var i = 0; i < units.length; i++) {
            if (num >= units[i].v) {
                var scaled = num / units[i].v;
                var rounded = Math.floor(scaled * 10) / 10;
                var txt = (rounded % 1 === 0) ? String(Math.floor(rounded)) : rounded.toFixed(1);
                return (neg ? "-" : "") + txt + units[i].s;
            }
        }
        return (neg ? "-" : "") + String(Math.floor(num));
    }
    if (typeof window !== 'undefined' && typeof window.formatBigNumber !== 'function') {
        window.formatBigNumber = formatBigNumber;
    }

    var state = {
        level: 1, xp: 0, xpRequired: 100, pointsToDistribute: 0,
        vit: 1, agi: 1, int: 1, pow: 1, mag: 1, characterId: "",
        equippedSkills: [0, 1, 2, 3],
        equippedRunes: [0, 0, 0, 0],
        equippedPassives: [-1, -1],
        weapon: { name: 'Starter Dirk', damage: 10, tier: 0 },
        inventory: [],
        equipment: { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null }
    };

    var rpgAntiCheat = {
        salt: Math.random().toString(36).substring(2, 15),
        hash: ""
    };

    // ========================================================================
    // ITEMIZAÇÃO VIVA (16/09/2026) — os PREFIX_POOL/SUFFIX_POOL abaixo existiam
    // desde sempre mas NUNCA eram referenciados por ninguém: nenhum item rolava
    // affix e nenhum stat deles era lido em gameplay. Esta passada liga os dois
    // lados (geração de loot -> efeito mecânico real). Constantes concentradas
    // aqui pra o balanceamento ser um número num lugar só, não espalhado.
    //
    // Reframes assumidos (não são os nomes originais, e isso é deliberado):
    //   accuracyRating   -> DANO DE PRECISÃO (bônus plano somado ao dano de arma).
    //                       O combate é de projétil, não tem rolagem de acerto/erro,
    //                       então "chance de acerto" não teria onde existir.
    //   attackSpeedBonus -> REDUÇÃO DE COOLDOWN (%) das skills (DeSoGhost.skillCooldowns).
    //                       Também não há "velocidade de ataque" no modelo de projétil.
    var AFFIX_SCALABLE = ['defenseBonus', 'accuracyRating']; // únicos que escalam com iLvl
    var AFFIX_ILVL_SCALE = 0.05;      // mesma escada de scale usada pelos atributos
    var MAINHAND_DAMAGE_DIVISOR = 100; // finalWeaponDamage = curva * (1 + baseDamage/100)
    var PRECISION_CAP_RATIO = 0.25;    // dano de precisão nunca passa de 25% da curva
    var VITALITY_BONUS_PER_POINT = 5;  // 5 pontos de vitalityBonus = +1 barra de vitalidade
    var MANA_PER_RECOVERY_POINT = 2;   // manaRecoveryBonus também engorda o teto de mana
    var MANA_REGEN_PER_RECOVERY_POINT = 0.05; // por frame; INT dá 0.10/ponto (engine.js)
    var LEECH_THRESHOLD_FACTOR = 1.0;  // dano "sugado" equivalente a 1 golpe = +1 vitalidade
    var LEECH_MAX_PERCENT = 25;        // teto duro do life leech somado
    var MAX_COOLDOWN_REDUCTION = 0.40; // teto de attackSpeedBonus convertido em CDR
    var MAX_TIER_ELEMENTAL_BONUS = 0.60; // teto da aura de raridade somada entre os 7 slots
    var MAX_ELEMENTAL_MULTIPLIER = 3.0;  // teto absoluto do multiplicador elemental

    // #4 — specialEffect deixou de ser texto decorativo: a RARIDADE de cada peça
    // equipada concede uma aura passiva de dano elemental (soma entre slots, com teto).
    var TIER_ELEMENTAL_BONUS = { Common: 0, Rare: 0.03, Epic: 0.10, Legendary: 0.15 };
    // Lendário ainda dá 1% de life leech por peça, em cima da aura elemental.
    var TIER_LEECH_BONUS = { Common: 0, Rare: 0, Epic: 0, Legendary: 1 };
    // Raridade agora também pesa no baseDamage/baseDefense da peça (antes só o iLvl importava).
    var QUALITY_BASE_FACTOR = { Common: 1.0, Rare: 1.15, Epic: 1.35, Legendary: 1.6 };

    var EQUIP_SLOTS = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];

    // Elemento nativo de cada slot de anel — o anel 1 lança Gelo e o anel 2 lança Madeira
    // (engine.js, teclas 2 e 3). Usado por getRingBonus() pra decidir qual affix do PRÓPRIO
    // anel casa com a magia que ele destrava (#6).
    var RING_ELEMENT = { ring1: 'cold', ring2: 'wood' };

    var PREFIX_POOL = [
        { name: "Fiery", type: "Prefix", stat: "fireDamageBonus", minValue: 5, maxValue: 15 },
        { name: "Robust", type: "Prefix", stat: "defenseBonus", minValue: 10, maxValue: 30 },
        { name: "Glacial", type: "Prefix", stat: "coldDamageBonus", minValue: 4, maxValue: 12 },
        { name: "Gleaming", type: "Prefix", stat: "accuracyRating", minValue: 15, maxValue: 50 }
    ];

    var SUFFIX_POOL = [
        { name: "of the Falcon", type: "Suffix", stat: "attackSpeedBonus", minValue: 5, maxValue: 15 },
        { name: "of the Serpent", type: "Suffix", stat: "manaRecoveryBonus", minValue: 3, maxValue: 10 },
        { name: "of the Vampire", type: "Suffix", stat: "lifeLeechPercent", minValue: 1, maxValue: 5 },
        { name: "of the Titan", type: "Suffix", stat: "vitalityBonus", minValue: 5, maxValue: 20 }
    ];

    // #7 — cada slot ganha uma identidade própria via PESO de rolagem (não regra dura:
    // qualquer affix ainda pode cair em qualquer slot, só que com probabilidade diferente).
    // Peso omitido = 1. Peso 5 = cinco vezes mais provável que um affix neutro.
    var SLOT_AFFIX_WEIGHTS = {
        head:     { accuracyRating: 4, manaRecoveryBonus: 2 },
        chest:    { defenseBonus: 5, vitalityBonus: 5 },
        offhand:  { manaRecoveryBonus: 4, defenseBonus: 4 },
        mainhand: { accuracyRating: 3, lifeLeechPercent: 3, attackSpeedBonus: 3, fireDamageBonus: 2 },
        ring1:    { coldDamageBonus: 5, fireDamageBonus: 2 },
        ring2:    { manaRecoveryBonus: 3, coldDamageBonus: 2, fireDamageBonus: 2 },
        amulet:   { fireDamageBonus: 5, coldDamageBonus: 5 }
    };

    // Chance de a peça rolar um prefixo e/ou um sufixo, por raridade. Lendário é o único
    // tier com GARANTIA de pelo menos um affix (#3) — é o que o faz ser mais que uma cor.
    var AFFIX_CHANCE = {
        Common:    { prefix: 0.10, suffix: 0.10 },
        Rare:      { prefix: 0.35, suffix: 0.35 },
        Epic:      { prefix: 0.60, suffix: 0.60 },
        Legendary: { prefix: 0.75, suffix: 0.75 }
    };

    function pickAffixEntry(pool, slotLower) {
        var weights = SLOT_AFFIX_WEIGHTS[slotLower] || {};
        var total = 0, i;
        for (i = 0; i < pool.length; i++) total += (weights[pool[i].stat] || 1);
        if (total <= 0) return pool[Math.floor(Math.random() * pool.length)];
        var r = Math.random() * total;
        for (i = 0; i < pool.length; i++) {
            r -= (weights[pool[i].stat] || 1);
            if (r <= 0) return pool[i];
        }
        return pool[pool.length - 1];
    }

    // Só stat PLANO escala com o nível do item. fire/coldDamageBonus, lifeLeechPercent,
    // attackSpeedBonus e manaRecoveryBonus já são porcentagem/taxa — multiplicá-los pelo
    // iLvl daria 13% de life leech num item de caverna e quebraria a economia de dano.
    function rollAffixValue(entry, iLvl) {
        var raw = entry.minValue + Math.random() * (entry.maxValue - entry.minValue);
        if (AFFIX_SCALABLE.indexOf(entry.stat) !== -1) {
            raw *= (1 + ((parseInt(iLvl, 10) || 1) * AFFIX_ILVL_SCALE));
        }
        return Math.max(1, Math.round(raw));
    }

    function rollAffixes(quality, slotLower, iLvl) {
        var chance = AFFIX_CHANCE[quality] || AFFIX_CHANCE.Common;
        var affixes = [];
        var entry;
        if (Math.random() < chance.prefix) {
            entry = pickAffixEntry(PREFIX_POOL, slotLower);
            affixes.push({ name: entry.name, type: entry.type, stat: entry.stat, value: rollAffixValue(entry, iLvl) });
        }
        if (Math.random() < chance.suffix) {
            entry = pickAffixEntry(SUFFIX_POOL, slotLower);
            affixes.push({ name: entry.name, type: entry.type, stat: entry.stat, value: rollAffixValue(entry, iLvl) });
        }
        if (quality === 'Legendary' && affixes.length === 0) {
            var pool = (Math.random() < 0.5) ? PREFIX_POOL : SUFFIX_POOL;
            entry = pickAffixEntry(pool, slotLower);
            affixes.push({ name: entry.name, type: entry.type, stat: entry.stat, value: rollAffixValue(entry, iLvl) });
        }
        return affixes;
    }

    var LootGenerator = {
        generate: function(iLvl, slot, forceQuality) {
            var quality = forceQuality || this.determineQuality();
            var itemGuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 
                (Math.random().toString(36).substring(2, 15) + "-" + Date.now().toString(36));
            
            var baseName = this.getBaseNameBySlot(slot);
            var baseDamage = 0;
            var baseDefense = 0;
            var attributes = {};
            var scale = 1 + (iLvl * 0.05);

            var slotLower = (slot || "").toLowerCase();
            // Raridade agora pesa no dano/defesa base (QUALITY_BASE_FACTOR) — antes um "Divine
            // Infinite Blade" épico tinha exatamente o mesmo baseDamage de um "Worn Iron Blade"
            // do mesmo nível, o que fazia a cor do item não significar nada pro slot mainhand.
            var qFactor = QUALITY_BASE_FACTOR[quality] || 1.0;
            if (slotLower === 'mainhand') {
                baseDamage = Math.round(15 * scale * qFactor * (0.9 + Math.random() * 0.2));
            } else if (slotLower !== 'ring1' && slotLower !== 'ring2' && slotLower !== 'ring' && slotLower !== 'amulet') {
                baseDefense = Math.round(10 * scale * qFactor * (0.9 + Math.random() * 0.2));
            }

            var attrPool = ['vit', 'agi', 'int', 'pow', 'mag'];
            var numAttrs = 1;
            var attrRange = { min: 1, max: 3 };

            if (quality === 'Rare') {
                numAttrs = 2;
                attrRange = { min: 4, max: 8 };
            } else if (quality === 'Epic' || quality === 'Legendary') {
                // Lendário rola o MESMO teto de atributo do Épico (3 atributos, 10-20) — o que
                // o separa é a garantia de affix em rollAffixes() e a aura de raridade mais forte,
                // não um segundo salto de números (#3).
                numAttrs = 3;
                attrRange = { min: 10, max: 20 };
            }

            var selectedAttrs = [];
            var poolCopy = attrPool.slice();
            for (var a = 0; a < numAttrs; a++) {
                if (poolCopy.length === 0) break;
                var randIdx = Math.floor(Math.random() * poolCopy.length);
                selectedAttrs.push(poolCopy.splice(randIdx, 1)[0]);
            }

            selectedAttrs.forEach(function(attr) {
                var val = Math.round((attrRange.min + Math.random() * (attrRange.max - attrRange.min)) * scale);
                attributes[attr] = val;
            });

            var finalName = baseName;
            if (slotLower === 'ring1' || slotLower === 'ring') {
                if (quality === 'Common') {
                    finalName = "Bronze Cold Ring";
                } else if (quality === 'Rare') {
                    finalName = "Stellar Ice Enchanted Ring";
                } else if (quality === 'Legendary') {
                    finalName = "Absolute Zero Covenant";
                } else {
                    finalName = "Eternal Winter Alliance";
                }
            } else if (slotLower === 'ring2') {
                if (quality === 'Common') {
                    finalName = "Rustic Wooden Ring";
                } else if (quality === 'Rare') {
                    finalName = "Runic Wood Rooted Ring";
                } else if (quality === 'Legendary') {
                    finalName = "World Tree Dominion";
                } else {
                    finalName = "Forest Awakening Seal";
                }
            } else {
                var prefixes = [];
                var suffixes = [];
                if (quality === 'Common') {
                    prefixes = ["Basic", "Simple", "Worn", "Common"];
                    suffixes = ["Iron", "Leather", "Wood", "Bone"];
                } else if (quality === 'Rare') {
                    prefixes = ["Reinforced", "Sharp", "Special", "Powerful"];
                    suffixes = ["of Nowhere", "of the Deep", "of the Abyss", "of the Guardian"];
                } else if (quality === 'Legendary') {
                    prefixes = ["Mythic", "Primordial", "Ascendant", "Undying"];
                    suffixes = ["Cataclysm", "Eternity", "Oblivion", "Genesis"];
                } else {
                    prefixes = ["Grand", "Royal", "Supreme", "Divine"];
                    suffixes = ["Ghostly", "Shadowy", "Absolute", "Infinite"];
                }
                var prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                var suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
                
                var slotName = "";
                if (slotLower === 'head') slotName = "Helmet";
                else if (slotLower === 'chest') slotName = "Chestplate";
                else if (slotLower === 'mainhand') slotName = "Blade";
                else if (slotLower === 'offhand') slotName = "Shield";
                else if (slotLower === 'amulet') slotName = "Amulet";

                if (quality === 'Rare') {
                    finalName = prefix + " " + slotName + " " + suffix;
                } else {
                    finalName = prefix + " " + suffix + " " + slotName;
                }
            }

            // AFFIXES (#2) — o prefixo/sufixo rolado entra no NOME e vira stat de verdade
            // (ver os getters de gear no fim deste arquivo). Antes desta data nada aqui
            // tocava PREFIX_POOL/SUFFIX_POOL: os dois arrays eram literalmente código morto.
            var rolledAffixes = rollAffixes(quality, slotLower, iLvl);
            for (var af = 0; af < rolledAffixes.length; af++) {
                if (rolledAffixes[af].type === "Prefix") {
                    finalName = rolledAffixes[af].name + " " + finalName;
                } else {
                    finalName = finalName + " " + rolledAffixes[af].name;
                }
            }

            var reqStr = (slotLower === 'mainhand') ? Math.round(iLvl * 0.8) : Math.round(iLvl * 0.4);
            var reqInt = (slotLower === 'amulet' || slotLower === 'ring' || slotLower === 'ring1' || slotLower === 'ring2') ? Math.round(iLvl * 0.8) : 0;
            var reqAgi = (slotLower === 'head') ? Math.round(iLvl * 0.5) : 0;

            var icon = "assets/sprites/equip_amulet.webp";
            if (slotLower === 'mainhand') icon = "assets/sprites/equip_weapon.webp";
            else if (slotLower === 'offhand') icon = "assets/sprites/equip_shield.webp";
            else if (slotLower === 'head') icon = "assets/sprites/equip_head.webp";
            else if (slotLower === 'chest') icon = "assets/sprites/equip_chest.webp";
            else if (slotLower === 'ring1' || (slotLower === 'ring' && (finalName.toLowerCase().includes("ice") || finalName.toLowerCase().includes("cold") || finalName.toLowerCase().includes("winter")))) icon = "assets/sprites/equip_ring_ice.webp";
            else if (slotLower === 'ring2' || (slotLower === 'ring' && (finalName.toLowerCase().includes("wood") || finalName.toLowerCase().includes("forest")))) icon = "assets/sprites/equip_ring_wood.webp";

            var item = {
                id: itemGuid,
                name: finalName,
                quality: quality,
                slot: (slotLower === 'ring1' || slotLower === 'ring2') ? slotLower : slot,
                itemLevel: iLvl,
                icon: icon,
                attributes: attributes,
                requiredStats: { strength: reqStr, intelligence: reqInt, agility: reqAgi }
            };

            if (baseDamage > 0) item.baseDamage = baseDamage;
            if (baseDefense > 0) item.baseDefense = baseDefense;
            if (rolledAffixes.length > 0) item.affixes = rolledAffixes;

            // specialEffect deixou de ser texto de sabor (#4): o texto agora DESCREVE um bônus
            // que existe de verdade. O bônus em si é derivado de item.quality (ver
            // getTierElementalBonus/getLifeLeechPercent), não da string — então item antigo
            // salvo com "Epic Power of Nowhere!" também passa a conceder a aura épica.
            if (quality === 'Legendary') {
                item.specialEffect = "Legendary Aura: +15% elemental damage, +1% life leech.";
            } else if (quality === 'Epic') {
                item.specialEffect = "Epic Aura: +10% elemental damage.";
            } else if (quality === 'Rare') {
                item.specialEffect = "Rare Focus: +3% elemental damage.";
            }

            return item;
        },

        // 4 tiers (#3, 16/09/2026): Legendary 1.5% / Epic 5% / Rare 20% / Common 73.5%.
        // Era Epic 5% / Rare 20% / Common 75% — Epic e Rare ficaram intactos de propósito,
        // o tier novo saiu do Common pra não desvalorizar o que o jogador já tem.
        determineQuality: function() {
            var rand = Math.random();
            if (rand < 0.015) return 'Legendary';
            if (rand < 0.065) return 'Epic';
            if (rand < 0.265) return 'Rare';
            return 'Common';
        },

        getBaseNameBySlot: function(slot) {
            var slotLower = (slot || "").toLowerCase();
            switch(slotLower) {
                case 'mainhand': return 'Blade';
                case 'offhand': return 'Shield';
                case 'chest': return 'Armor';
                case 'head': return 'Helmet';
                case 'ring1': return 'Ice Ring';
                case 'ring2': return 'Wood Ring';
                case 'amulet': return 'Amulet';
                default: return 'Relic';
            }
        },

        rollEnemyDrop: function(levelNum) {
            var lvl = 1;
            if (levelNum === "cave1") {
                lvl = 34;
            } else {
                lvl = parseInt(levelNum, 10) || 1;
            }

            var randCount = Math.random();
            var count = 0;
            if (randCount < 0.50) {
                count = 0;
            } else if (randCount < 0.85) {
                count = 1;
            } else {
                count = 2;
            }

            var droppedItems = [];
            var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];

            for (var i = 0; i < count; i++) {
                var eligibleQualities = ['Common'];
                var isRareEligible = (lvl === 6 || (lvl >= 10 && lvl <= 33));
                var isEpicEligible = (levelNum === "cave1" || (lvl >= 30 && lvl <= 33));

                // Lendário (#3) só cai onde Épico já caía (CAVE1 e fases 30-33) e mesmo lá é
                // raro: ~1.5% da tabela combinada, ~2% da tabela só-épica. Não existe fase
                // "de farm de lendário" — é o topo da mesma curva, não uma curva nova.
                var isLegendaryEligible = isEpicEligible;

                var quality = 'Common';
                if (isRareEligible && isEpicEligible) {
                    var r = Math.random();
                    if (r < 0.75) quality = 'Common';
                    else if (r < 0.95) quality = 'Rare';
                    else if (r < 0.985) quality = 'Epic';
                    else quality = 'Legendary';
                } else if (isRareEligible) {
                    if (Math.random() < 0.15) quality = 'Rare';
                } else if (isEpicEligible) {
                    var re = Math.random();
                    if (re < 0.02) quality = 'Legendary';
                    else if (re < 0.22) quality = 'Epic';
                }
                if (quality === 'Legendary' && !isLegendaryEligible) quality = 'Epic';

                var slot = slots[Math.floor(Math.random() * slots.length)];
                var item = this.generate(lvl, slot, quality);
                droppedItems.push(item);
                
                GhostRPG.addItem(item);
            }

            return droppedItems;
        }
    };

    function updateIntegrityHash() {
        var invStr = (state.inventory || []).map(function(item) { return item.id + ":" + (item.count || 1); }).join(",");
        var eqStr = "";
        if (state.equipment) {
            var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
            eqStr = slots.map(function(s) {
                var item = state.equipment[s];
                return s + ":" + (item ? item.id : "");
            }).join(",");
        }
        var dataStr = [
            state.level, state.xp, state.vit, state.agi, state.int, state.pow, state.mag, state.pointsToDistribute, state.characterId,
            state.equippedSkills.join(","), state.equippedRunes.join(","), state.equippedPassives.join(","),
            state.weapon.name, state.weapon.damage, invStr, eqStr
        ].join("-");
        rpgAntiCheat.hash = btoa(dataStr + rpgAntiCheat.salt);
    }

    function verifyIntegrity() {
        var invStr = (state.inventory || []).map(function(item) { return item.id + ":" + (item.count || 1); }).join(",");
        var eqStr = "";
        if (state.equipment) {
            var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
            eqStr = slots.map(function(s) {
                var item = state.equipment[s];
                return s + ":" + (item ? item.id : "");
            }).join(",");
        }
        var dataStr = [
            state.level, state.xp, state.vit, state.agi, state.int, state.pow, state.mag, state.pointsToDistribute, state.characterId,
            state.equippedSkills.join(","), state.equippedRunes.join(","), state.equippedPassives.join(","),
            state.weapon.name, state.weapon.damage, invStr, eqStr
        ].join("-");
        return btoa(dataStr + rpgAntiCheat.salt) === rpgAntiCheat.hash;
    }

    function calculateXpRequired(lvl) {
        return Math.floor(BASE_XP * Math.pow(lvl, XP_EXPONENT));
    }

    // ========================================================================
    // FORMA FECHADA DA ESCADA DE XP (17/09/2026)
    // ------------------------------------------------------------------------
    // addXp() subia de nível num while-loop com trava de segurança em 50 iterações. A trava fazia
    // sentido quando o teto era simbólico; com o teto LITERAL de 100 bilhões (ver o comentário do
    // XP_EXPONENT no topo) ela virava uma contradição de design: independentemente de quanto XP uma
    // kill valesse, o personagem só podia subir 50 níveis por chamada — ou seja, chegar ao teto
    // exigiria no MÍNIMO 2 bilhões de kills, e todo o XP excedente ficava empoçado em state.xp sem
    // virar nível nenhum. O "alcançável" da decisão de 16/09/2026 não era verdade.
    //
    // A escada é sum_{k=1}^{L-1} XPRequired(k), com XPRequired(k) = floor(100 * k^1.45). Não dá pra
    // somar 100 bilhões de termos, mas dá pra aproximar a soma por Euler-Maclaurin e INVERTER:
    //     sum_{k=1}^{n} k^p  ~=  n^(p+1)/(p+1) + n^p/2 + p*n^(p-1)/12
    // ATENÇÃO: o que se inverte é a soma ACUMULADA, não XPRequired(L) sozinho — state.xp é
    // CONSUMIDO a cada nível (o loop fazia `state.xp -= state.xpRequired`), então "XP total até o
    // nível L" é a soma da escada inteira, não o degrau L. Inverter o degrau daria um nível ordens
    // de grandeza maior e quebraria a curva verificada contra o banco de produção.
    //
    // O erro da aproximação (truncamento + a perda do floor de cada degrau, no máximo 1 por degrau)
    // é irrelevante para n grande — que é exatamente onde ela é usada. Na faixa pequena, addXp()
    // continua percorrendo a escada EXATA degrau a degrau (ver EXACT_LEVEL_STEP_BUDGET), então o
    // jogo normal roda com a mesma aritmética de sempre, bit a bit.
    function cumulativeXpToLevel(lvl) {
        var n = Math.floor(lvl) - 1;
        if (!isFinite(n) || n <= 0) return 0;
        var p = XP_EXPONENT;
        return BASE_XP * (
            (Math.pow(n, p + 1) / (p + 1)) +
            (Math.pow(n, p) / 2) +
            ((p * Math.pow(n, p - 1)) / 12)
        );
    }

    // Inversa de cumulativeXpToLevel: maior nível cuja escada acumulada ainda cabe em totalXp.
    // Busca binária (~37 iterações até 1e11) em vez de fórmula fechada direta porque cumulativeXp
    // tem três termos — a busca é exata em relação à PRÓPRIA aproximação, o que é o que importa
    // pra ida e volta (cumulativeXpToLevel é usada nos dois lados da conta em addXp).
    function levelFromCumulativeXp(totalXp, maxLevel) {
        var total = Number(totalXp);
        if (!isFinite(total) || total <= 0) return 1;
        var lo = 1;
        var hi = Math.max(1, Math.floor(maxLevel));
        while (lo < hi) {
            var mid = Math.floor(lo + (hi - lo + 1) / 2);
            if (cumulativeXpToLevel(mid) <= total) { lo = mid; } else { hi = mid - 1; }
        }
        return lo;
    }

    // Quantos degraus exatos addXp() percorre antes de recorrer à forma fechada. Muito acima dos 50
    // antigos (que eram o bug) e muito acima do que uma kill rende em qualquer nível que um jogador
    // real alcance tão cedo — ou seja: no jogo normal a forma fechada nem chega a ser usada, e a
    // aritmética continua idêntica à verificada contra produção. É orçamento de PRECISÃO, não teto
    // de progressão: o que sobra não é descartado, é resolvido em UM salto logo abaixo.
    var EXACT_LEVEL_STEP_BUDGET = 1024;

    // Normaliza a fase atual pra um número antes dela virar state.worldLevel/statsCopy.worldLevel
    // (achado crítico #4, 27/08/2026): dentro da CAVE1, window.g_currentLevel vira a string
    // "cave1" em vez de um número — gravar isso cru na coluna world_level (INTEGER no Postgres)
    // derrubava a transação inteira, travando o save do personagem inteiro (silenciosamente)
    // enquanto o jogador estivesse nessa fase. window.normalizeLevelName (js/game/network.js) já
    // sabe converter qualquer nome de fase, incluindo "cave1", num número — reusa essa lógica em
    // vez de duplicar o mapeamento aqui. Se por algum motivo normalizeLevelName ainda não tiver
    // carregado, cai pro parseInt direto e, falhando isso também, pro fallback (valor já salvo,
    // ou 1) — nunca deixa passar algo que não seja um número de verdade.
    function normalizeWorldLevel(rawLevel, fallback) {
        if (typeof window !== 'undefined' && typeof window.normalizeLevelName === 'function') {
            var normalized = parseInt(window.normalizeLevelName(rawLevel), 10);
            if (!isNaN(normalized)) return normalized;
        }
        var parsed = parseInt(rawLevel, 10);
        if (!isNaN(parsed)) return parsed;
        return (typeof fallback === 'number' && !isNaN(fallback)) ? fallback : 1;
    }

    // Stats iniciais por espécie (achado médio, 27/08/2026 — porte do mobile, que já tinha essa
    // função; o site sempre voltava pro genérico {vit:1,agi:1,int:1,pow:1,mag:1} pra qualquer
    // fantasma, igual pra todos). window.g_ghostdexDB (mesma fonte de dados em ghostdex_data.js,
    // idêntica nas duas plataformas) tem os stats_base de cada espécie; convertidos pra atributo
    // de RPG com a mesma fórmula usada em UnlockGhostForPlayer (ghost_inventory.js): Math.ceil(x/10).
    // Lookup do verbete da Ghostdex a partir do characterId. Extraído de getGhostBaseStats em
    // 16/09/2026 porque o crescimento passivo por espécie (abaixo) e SpawnEpisode1Ghost precisam
    // exatamente da mesma resolução de id — id cru, sem re-derivar/reformatar (regra do projeto:
    // "ghost_" + N ou "dg_local_" + random; um fantasma forjado simplesmente não tem verbete).
    function getGhostdexEntry(charId) {
        if (!charId || charId === 0 || charId === "0") return null;
        if (typeof window === 'undefined' || !window.g_ghostdexDB) return null;
        var ghostNum = charId.toString().replace("ghost_", "").padStart(3, "0");
        return window.g_ghostdexDB.find(function(g) { return g.id === ghostNum; }) || null;
    }
    if (typeof window !== 'undefined') window.GetGhostdexEntry = getGhostdexEntry;

    function getGhostBaseStats(charId) {
        var res = { vit: 1, agi: 1, int: 1, pow: 1, mag: 1 };
        var dbGhost = getGhostdexEntry(charId);
        if (dbGhost && dbGhost.stats_base) {
            res.vit = Math.ceil(dbGhost.stats_base.hp / 10) || 1;
            res.pow = Math.ceil(dbGhost.stats_base.ataque / 10) || 1;
            res.agi = Math.ceil(dbGhost.stats_base.velocidade / 10) || 1;
            res.int = Math.ceil(dbGhost.stats_base.atq_especial / 10) || 1;
            res.mag = Math.ceil(dbGhost.stats_base.def_especial / 10) || 1;
        }
        return res;
    }

    // Crescimento passivo de atributo por espécie (16/09/2026) — completa a ponte que já estava
    // meio construída: getGhostBaseStats só semeava stats_base NO NÍVEL 1 e depois a espécie não
    // influenciava mais nada. Agora cada level-up também rende um ganho passivo proporcional ao
    // stats_base daquela espécie:
    //     growthRate(B) = B / 65 ;  A(level) = A_base_seed + floor(growthRate(B) * (level-1) * 0.6)
    // Mapeamento: hp→vit, ataque→pow, velocidade→agi, atq_especial→int, def_especial→mag.
    // "defesa" (o 6º stat base) continua SEM uso mapeado de propósito — é escopo separado, não
    // invente função pra ele aqui.
    // Isto é ADICIONAL aos 5 pontos discricionários por nível (que seguem FIXOS em 5, sem escalar).
    function getPassiveGrowth(charId, level) {
        var res = { vit: 0, agi: 0, int: 0, pow: 0, mag: 0 };
        var lvl = parseInt(level, 10);
        if (isNaN(lvl) || lvl <= 1) return res;
        var dbGhost = getGhostdexEntry(charId);
        if (!dbGhost || !dbGhost.stats_base) return res;
        var b = dbGhost.stats_base;
        var steps = (lvl - 1) * GROWTH_PACE;
        function grow(baseStat) {
            var B = Number(baseStat);
            if (!isFinite(B) || B <= 0) return 0;
            return Math.floor((B / GROWTH_DIVISOR) * steps);
        }
        res.vit = grow(b.hp);
        res.pow = grow(b.ataque);
        res.agi = grow(b.velocidade);
        res.int = grow(b.atq_especial);
        res.mag = grow(b.def_especial);
        return res;
    }

    // Piso esperado de cada atributo num dado nível = semente da espécie + crescimento passivo.
    // Tudo ACIMA disto é ponto discricionário gasto pelo jogador.
    function getExpectedBaseStats(charId, level) {
        var seed = getGhostBaseStats(charId);
        var growth = getPassiveGrowth(charId, level);
        return {
            vit: seed.vit + growth.vit,
            agi: seed.agi + growth.agi,
            int: seed.int + growth.int,
            pow: seed.pow + growth.pow,
            mag: seed.mag + growth.mag
        };
    }

    // Reconciliação anti-cheat dos pontos de atributo — ponto ÚNICO de verdade (16/09/2026).
    // Antes existiam QUATRO cópias quase idênticas deste cálculo (loadLocalStorage em dois ramos,
    // loadBlockchainState e loadServerState), duas delas ainda comparando contra a base fixa 1 em
    // vez da semente da espécie. Com o crescimento passivo entrando na conta, qualquer cópia que
    // ficasse pra trás ia devolver rightfulPoints errado e o anti-cheat ia tomar ou dar pontos
    // indevidamente pro jogador real no login seguinte — por isso as quatro agora chamam ISTO.
    // Também faz o backfill do crescimento passivo em saves antigos (personagem que subiu de nível
    // antes desta mudança existir): o atributo nunca pode estar abaixo do piso derivado do nível.
    function reconcileAttributePoints(charId) {
        var lvl = parseInt(state.level, 10);
        if (isNaN(lvl) || lvl < 1) lvl = 1;
        var expectedBase = getExpectedBaseStats(charId || state.characterId, lvl);

        var usedPoints = 0;
        for (var i = 0; i < ATTR_KEYS.length; i++) {
            var k = ATTR_KEYS[i];
            var current = parseInt(state[k], 10);
            if (isNaN(current)) current = expectedBase[k];
            if (current < expectedBase[k]) {
                // Save anterior ao crescimento passivo (ou stat adulterado pra baixo): sobe pro piso.
                current = expectedBase[k];
                state[k] = current;
            }
            usedPoints += (current - expectedBase[k]);
        }
        usedPoints = Math.max(0, usedPoints);

        var expectedPoints = (lvl - 1) * 5; // 5 por nível, FIXO — não escala com o nível (decisão 16/09/2026).
        var rightfulPoints = Math.max(0, expectedPoints - usedPoints);
        if (typeof state.pointsToDistribute === 'undefined' || state.pointsToDistribute < rightfulPoints) {
            state.pointsToDistribute = rightfulPoints;
        }
        return rightfulPoints;
    }

    // Dano da arma (16/09/2026): WeaponDamage(L, tier) = 10 * L^1.85 * 1.12^tier.
    // Substitui o "+10 fixo por upgrade". É ESTA escalada com o nível que conserta de verdade o bug
    // que o levelReduction (removido de engine.js na mesma passada) tentava compensar ao contrário:
    // antes, subir de nível deixava seu próprio golpe mais fraco.
    function getWeaponTier() {
        if (!state.weapon) return 0;
        if (typeof state.weapon.tier === 'number' && isFinite(state.weapon.tier)) {
            return Math.max(0, Math.floor(state.weapon.tier));
        }
        // Save legado sem "tier": deriva do dano cru pela fórmula antiga (dano = 10 + 10 * tier).
        var legacyDamage = Number(state.weapon.damage) || WEAPON_BASE_DAMAGE;
        return Math.max(0, Math.floor((legacyDamage - WEAPON_BASE_DAMAGE) / 10));
    }

    function calculateWeaponDamage(level, tier) {
        var lvl = parseInt(level, 10);
        if (isNaN(lvl) || lvl < 1) lvl = 1;
        var t = Math.max(0, Math.floor(tier || 0));
        var dmg = WEAPON_BASE_DAMAGE * Math.pow(lvl, WEAPON_LEVEL_EXPONENT) * Math.pow(WEAPON_TIER_FACTOR, t);
        if (!isFinite(dmg)) dmg = Number.MAX_SAFE_INTEGER;
        return Math.max(1, Math.floor(dmg));
    }

    function calculateWeaponUpgradeCost(tier) {
        var t = Math.max(0, Math.floor(tier || 0));
        var cost = WEAPON_COST_BASE * Math.pow(WEAPON_COST_FACTOR, t);
        if (!isFinite(cost)) cost = Number.MAX_SAFE_INTEGER;
        return Math.max(1, Math.floor(cost));
    }

    // Mantém state.weapon.damage coerente com (nível atual, tier atual). Chamado em todo level-up,
    // em todo upgrade e em todo carregamento de save — o dano não é mais um número acumulado à mão,
    // é sempre derivado.
    function refreshWeaponDamage() {
        if (!state.weapon) state.weapon = { name: 'Starter Dirk', damage: WEAPON_BASE_DAMAGE, tier: 0 };
        var tier = getWeaponTier();
        state.weapon.tier = tier;
        // #5 — os DOIS sistemas de arma agora conversam. state.weapon (curva de nível+tier,
        // comprada com score) continua sendo a BASE; o item equipado em `mainhand` (loot, com
        // baseDamage que nunca era lido por ninguém) entra como MULTIPLICADOR em cima dela, e o
        // affix de precisão entra como bônus plano. Antes disto, equipar uma espada lendária não
        // mudava absolutamente nada no dano do projétil — eram dois sistemas paralelos cegos um
        // pro outro. Como engine.js lê stats.weapon.damage direto (fireProjectile), embutir o
        // bônus AQUI faz o efeito chegar no jogo sem engine.js precisar saber de equipamento.
        var curve = calculateWeaponDamage(state.level, tier);
        // O dano de precisão é PLANO, mas nunca pode valer mais que 25% da curva: sem esse teto
        // um "Gleaming" de item nível 30 (60+ de precisão) daria 6x o dano base de um
        // personagem nível 1 — bônus plano em cima de curva exponencial ou domina o começo ou
        // some no fim. Com o teto ele é um upgrade real cedo e vira ruído tarde, que é o
        // comportamento honesto pra um affix comum.
        var precision = Math.min(getPrecisionDamage(), Math.floor(curve * PRECISION_CAP_RATIO));
        var dmg = (curve * getMainhandDamageMultiplier()) + precision;
        if (!isFinite(dmg)) dmg = Number.MAX_SAFE_INTEGER;
        state.weapon.damage = Math.max(1, Math.floor(dmg));
    }

    // ========================================================================
    // LEITURA DE STATS DE EQUIPAMENTO (16/09/2026)
    // Tudo abaixo lê state.equipment DIRETO, sem passar por getStats() — getStats() faz
    // deep-copy (JSON round-trip) do state inteiro e estas funções são chamadas por golpe
    // e/ou por frame pelo engine. Nenhuma delas escreve estado (exceto applyLifeLeech, que
    // mexe só no acumulador local de leech).
    // ========================================================================
    function itemAffixValue(item, stat) {
        if (!item || !item.affixes || !item.affixes.length) return 0;
        var total = 0;
        for (var i = 0; i < item.affixes.length; i++) {
            var a = item.affixes[i];
            if (a && a.stat === stat) total += (Number(a.value) || 0);
        }
        return total;
    }

    function sumEquippedAffix(stat) {
        if (!state.equipment) return 0;
        var total = 0;
        for (var i = 0; i < EQUIP_SLOTS.length; i++) {
            total += itemAffixValue(state.equipment[EQUIP_SLOTS[i]], stat);
        }
        return total;
    }

    // Aura de raridade somada entre as peças equipadas, com teto (senão 7 lendários = +105%).
    function getTierElementalBonus() {
        if (!state.equipment) return 0;
        var total = 0;
        for (var i = 0; i < EQUIP_SLOTS.length; i++) {
            var item = state.equipment[EQUIP_SLOTS[i]];
            if (item && item.quality) total += (TIER_ELEMENTAL_BONUS[item.quality] || 0);
        }
        return Math.min(MAX_TIER_ELEMENTAL_BONUS, total);
    }

    function getTierLeechBonus() {
        if (!state.equipment) return 0;
        var total = 0;
        for (var i = 0; i < EQUIP_SLOTS.length; i++) {
            var item = state.equipment[EQUIP_SLOTS[i]];
            if (item && item.quality) total += (TIER_LEECH_BONUS[item.quality] || 0);
        }
        return total;
    }

    // #1 — DEFESA REAL. baseDefense era gerado pelo loot desde sempre e lido por NINGUÉM.
    // Contrato combinado com o agente do combate elemental: GhostRPG.getTotalDefense('player').
    // Ordem de grandeza esperada hoje: ~0 sem gear, ~45-80 com as 3 peças de um set de fase
    // 10, ~150-260 com set de CAVE1 com affixes de defesa.
    function getTotalDefense(targetType) {
        if (targetType !== 'player') return 0; // só o jogador tem equipamento hoje
        if (!state.equipment) return 0;
        var defenseSlots = ['chest', 'offhand', 'amulet'];
        var total = 0;
        for (var i = 0; i < defenseSlots.length; i++) {
            var item = state.equipment[defenseSlots[i]];
            if (item && item.baseDefense) total += (Number(item.baseDefense) || 0);
        }
        total += sumEquippedAffix('defenseBonus'); // affix de defesa vale de QUALQUER slot
        if (!isFinite(total) || total < 0) total = 0;
        return Math.round(total);
    }

    // Conversão sugerida defesa -> mitigação, caso o lado do combate prefira não desenhar a
    // própria curva: def/(def+400), teto de 60%. 400 de defesa = 50% de redução.
    function getDamageReduction(targetType) {
        var def = getTotalDefense(targetType);
        if (def <= 0) return 0;
        return Math.min(0.60, def / (def + 400));
    }

    function normalizeElement(element) {
        var e = String(element || "").toLowerCase();
        if (e === 'fire' || e === 'fogo' || e === 'flame' || e === 'burn') return 'fire';
        if (e === 'ice' || e === 'cold' || e === 'frost' || e === 'gelo') return 'cold';
        if (e === 'neutral' || e === 'physical' || e === 'none' || e === '') return 'neutral';
        return e;
    }

    // #2 — "seu equipamento pende pra fogo". Devolve MULTIPLICADOR (1.0 = sem bônus) pra ser
    // aplicado por cima do dano elemental já calculado — ou seja, empilha com o multiplicador
    // de vantagem elemental do outro sistema em vez de substituí-lo.
    function getElementalDamageMultiplier(element) {
        var e = normalizeElement(element);
        // Dano NEUTRO/físico (spark, orb, pulo na cabeça do chefe) não é elemental e não recebe
        // nem affix nem aura de raridade — senão "aura de +15% de dano ELEMENTAL" viraria, na
        // prática, +15% de dano em tudo, e o sistema elemental do outro agente perderia o
        // sentido de escolha. O gear ganha dano neutro por outro caminho (mainhand/precisão).
        if (e === 'neutral') return 1;
        var pct = 0;
        if (e === 'fire') {
            pct += sumEquippedAffix('fireDamageBonus');
        } else if (e === 'cold') {
            pct += sumEquippedAffix('coldDamageBonus');
        } else if (e !== 'neutral') {
            // Elemento sem affix próprio (madeira, etc.): o gear elemental ainda ajuda, com
            // metade da eficiência — "infusão genérica". Dano neutro/físico não ganha nada.
            pct += (sumEquippedAffix('fireDamageBonus') + sumEquippedAffix('coldDamageBonus')) * 0.5;
        }
        pct += getTierElementalBonus() * 100;
        var mult = 1 + (pct / 100);
        if (!isFinite(mult) || mult < 1) return 1;
        return Math.min(MAX_ELEMENTAL_MULTIPLIER, mult);
    }

    // #6 — o anel deixa de ser "um slot que destrava uma magia" e passa a ser UM ITEM: os stats
    // rolados NELE mudam a magia que ELE destrava. Antes, qualquer anel no ring1 lançava Gelo
    // com exatamente o mesmo dano, lendário ou não.
    function getRingBonus(slot) {
        if (!state.equipment) return 1;
        var item = state.equipment[slot];
        if (!item) return 1;
        var element = RING_ELEMENT[slot] || 'neutral';
        var fire = itemAffixValue(item, 'fireDamageBonus');
        var cold = itemAffixValue(item, 'coldDamageBonus');
        var pct = 0;
        if (element === 'fire') pct = fire + (cold * 0.5);
        else if (element === 'cold') pct = cold + (fire * 0.5);
        else pct = (fire + cold) * 0.5; // madeira: nenhum affix casa 100%, vale metade
        pct += (TIER_ELEMENTAL_BONUS[item.quality] || 0) * 100;
        var mult = 1 + (pct / 100);
        if (!isFinite(mult) || mult < 1) return 1;
        return Math.min(MAX_ELEMENTAL_MULTIPLIER, mult);
    }

    // accuracyRating REFRAMEADO como dano de precisão (bônus plano) — ver nota no topo.
    function getPrecisionDamage() {
        var v = sumEquippedAffix('accuracyRating');
        return (isFinite(v) && v > 0) ? Math.round(v) : 0;
    }

    // attackSpeedBonus REFRAMEADO como redução de cooldown — ver nota no topo.
    // Devolve o MULTIPLICADOR a aplicar em DeSoGhost.skillCooldowns (0.60 = -40%).
    function getCooldownMultiplier() {
        var pct = sumEquippedAffix('attackSpeedBonus') / 100;
        if (!isFinite(pct) || pct <= 0) return 1;
        return 1 - Math.min(MAX_COOLDOWN_REDUCTION, pct);
    }

    function getManaRegenBonus() {
        var v = sumEquippedAffix('manaRecoveryBonus') * MANA_REGEN_PER_RECOVERY_POINT;
        return (isFinite(v) && v > 0) ? v : 0;
    }

    function getLifeLeechPercent() {
        var pct = sumEquippedAffix('lifeLeechPercent') + getTierLeechBonus();
        if (!isFinite(pct) || pct <= 0) return 0;
        return Math.min(LEECH_MAX_PERCENT, pct);
    }

    function getMainhandDamageMultiplier() {
        if (!state.equipment || !state.equipment.mainhand) return 1;
        var base = Number(state.equipment.mainhand.baseDamage) || 0;
        if (base <= 0) return 1;
        return 1 + (base / MAINHAND_DAMAGE_DIVISOR);
    }

    // Acumulador de life leech. A vitalidade do jogador é uma barra INTEIRA e pequena
    // (getMaxVitality() = 3 + vit), enquanto o dano tem 12+ dígitos no fim da curva — curar
    // "5% do dano" direto não tem como mapear. Então o dano sugado se acumula aqui e vira
    // +1 de vitalidade a cada "1 golpe de arma inteiro" de valor sugado.
    var leechPool = 0;
    function applyLifeLeech(damageDealt) {
        var dmg = Number(damageDealt);
        if (!isFinite(dmg) || dmg <= 0) return 0;
        var pct = getLifeLeechPercent();
        if (pct <= 0) return 0;
        leechPool += dmg * (pct / 100);
        var weaponDmg = (state.weapon && Number(state.weapon.damage)) || WEAPON_BASE_DAMAGE;
        var threshold = Math.max(1, weaponDmg * LEECH_THRESHOLD_FACTOR);
        var healed = Math.floor(leechPool / threshold);
        if (healed <= 0) return 0;
        leechPool -= healed * threshold;
        if (healed > 10) healed = 10; // um golpe absurdo não vira cura infinita
        // Ponte opcional: se engine.js expuser uma cura parcial, usa. Senão devolve o número
        // pro chamador aplicar (window.TryHealLiveVitality NÃO serve: ela cura a barra INTEIRA,
        // que é a semântica do elixir, não de leech).
        if (typeof window !== 'undefined' && typeof window.HealLiveVitality === 'function') {
            window.HealLiveVitality(healed);
        }
        return healed;
    }

    return {
        init: function() { 
            this.loadLocalStorage(); 
            updateIntegrityHash(); 
        },
        getStats: function() {
            if (!verifyIntegrity()) { this.resetStats(); }

            // Corrige o stat inicial pro certo por espécie (achado médio, 27/08/2026, porte do
            // mobile) se ainda estiver no nível 1 com o genérico {vit:1,...} — cobre o personagem
            // que já estava carregado em memória antes desse fix existir.
            var activeCharId = state.characterId || window.g_currentPlayerGhost;
            if (state.level === 1 && activeCharId && activeCharId !== 0 && activeCharId !== "0") {
                var base = getGhostBaseStats(activeCharId);
                if (state.vit !== base.vit || state.agi !== base.agi || state.int !== base.int || state.pow !== base.pow || state.mag !== base.mag) {
                    state.vit = base.vit;
                    state.agi = base.agi;
                    state.int = base.int;
                    state.pow = base.pow;
                    state.mag = base.mag;
                    updateIntegrityHash();
                }
            }

            var statsCopy = JSON.parse(JSON.stringify(state));
            
            var bonuses = { vit: 0, agi: 0, int: 0, pow: 0, mag: 0 };
            if (state.equipment) {
                var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
                slots.forEach(function(s) {
                    var item = state.equipment[s];
                    if (item && item.attributes) {
                        for (var attr in item.attributes) {
                            var attrLower = attr.toLowerCase();
                            if (bonuses.hasOwnProperty(attrLower)) {
                                bonuses[attrLower] += (item.attributes[attr] || 0);
                            }
                        }
                    }
                });
            }
            
            statsCopy.vit += bonuses.vit;
            statsCopy.agi += bonuses.agi;
            statsCopy.int += bonuses.int;
            statsCopy.pow += bonuses.pow;
            statsCopy.mag += bonuses.mag;
            
            statsCopy.baseVit = state.vit;
            statsCopy.baseAgi = state.agi;
            statsCopy.baseInt = state.int;
            statsCopy.basePow = state.pow;
            statsCopy.baseMag = state.mag;
            statsCopy.bonuses = bonuses;
            statsCopy.worldLevel = typeof window.g_currentLevel !== 'undefined' ? normalizeWorldLevel(window.g_currentLevel, state.worldLevel) : (state.worldLevel || 1);

            return statsCopy;
        },
        resetStats: function(newCharId) {
            var currCharId = newCharId || state.characterId || "";
            // Stat inicial por espécie (achado médio, 27/08/2026, porte do mobile) em vez do
            // genérico {vit:1,agi:1,int:1,pow:1,mag:1} pra qualquer fantasma.
            var base = getGhostBaseStats(currCharId);
            var oldInventory = state.inventory || [];
            var oldEquipment = state.equipment || { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
            if (oldEquipment.helmet || oldEquipment.spell) {
                oldEquipment = { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
            }
            state = {
                level: 1, xp: 0, xpRequired: 100, pointsToDistribute: 0, vit: base.vit, agi: base.agi, int: base.int, pow: base.pow, mag: base.mag, characterId: currCharId,
                equippedSkills: [0, 1, 2, 3], equippedRunes: [0, 0, 0, 0], equippedPassives: [-1, -1],
                weapon: { name: 'Starter Dirk', damage: 10, tier: 0 },
                inventory: oldInventory,
                equipment: oldEquipment
            };
            refreshWeaponDamage();
            updateIntegrityHash(); this.saveLocalStorage();
        },

        addXp: function(amount) {
            if (!verifyIntegrity()) return;
            
            var maxLevel = 100000000000;
            if (state.level >= maxLevel) {
                state.level = maxLevel;
                state.xp = 0;
                state.xpRequired = calculateXpRequired(maxLevel);
                updateIntegrityHash(); this.saveLocalStorage();
                return;
            }
            // Sanitização da entrada (17/09/2026). Antes NaN/undefined simplesmente falhavam a
            // comparação do while e vazavam pra state.xp (save com xp = NaN, silencioso). Com o
            // salto em forma fechada abaixo, um valor inválido viraria um NÍVEL inválido — então a
            // barreira passa a ser explícita aqui, na entrada.
            var gain = Number(amount);
            if (!isFinite(gain) || gain <= 0) gain = 0;

            if (!isFinite(state.xp)) state.xp = 0;
            state.xp += gain;
            var levelBefore = state.level;

            // PASSO EXATO, degrau a degrau — o caminho do jogo normal (uma kill = alguns níveis).
            // Aritmética idêntica à de sempre; é este ramo que preserva os valores conferidos à mão
            // contra o banco de produção (nível 10 / nível 300).
            var exactSteps = 0;
            while (state.xp >= state.xpRequired && state.level < maxLevel && exactSteps < EXACT_LEVEL_STEP_BUDGET) {
                if (!state.xpRequired || state.xpRequired <= 0) state.xpRequired = 100;
                state.xp -= state.xpRequired;
                state.level++;
                // 5 pontos discricionários por nível, FIXO — decisão 16/09/2026: o que escala com
                // o nível é o crescimento passivo por espécie logo abaixo, não este número.
                state.pointsToDistribute += 5;
                state.xpRequired = calculateXpRequired(state.level);
                exactSteps++;
            }

            // SALTO EM FORMA FECHADA — o resto do passo exato, não um substituto dele. Só entra
            // quando o orçamento de degraus acabou e AINDA sobra XP pra subir, isto é: um prêmio
            // grande o bastante pra valer mais de mil níveis de uma vez. Era exatamente esse caso
            // que o antigo `loopSafeLevel++ < 50` descartava, deixando o XP excedente empoçado.
            if (state.xp >= state.xpRequired && state.level < maxLevel) {
                var absoluteXp = cumulativeXpToLevel(state.level) + state.xp;
                var jumpedLevel = levelFromCumulativeXp(absoluteXp, maxLevel);
                if (jumpedLevel > state.level) {
                    var leftover = absoluteXp - cumulativeXpToLevel(jumpedLevel);
                    // MESMOS 5 pontos por nível do laço acima, só que concedidos de uma vez pelos
                    // N níveis do salto — não 50 no máximo. Bate com expectedPoints = (L-1)*5 em
                    // reconcileAttributePoints(), que é o anti-cheat que confere isso no login
                    // seguinte; conceder menos faria o jogador receber os pontos faltantes lá de
                    // qualquer jeito, e conceder por um laço faria o cliente travar.
                    state.pointsToDistribute += 5 * (jumpedLevel - state.level);
                    state.level = jumpedLevel;
                    state.xpRequired = calculateXpRequired(state.level);
                    if (!isFinite(leftover) || leftover < 0) leftover = 0;
                    // O resto nunca pode ser >= o degrau atual (senão sobraria um nível por subir).
                    state.xp = Math.min(Math.floor(leftover), Math.max(0, state.xpRequired - 1));
                }
            }

            if (state.level >= maxLevel) {
                state.level = maxLevel;
                state.xp = 0;
                state.xpRequired = calculateXpRequired(maxLevel);
            }
            // "Subiu de nível?" agora é UMA pergunta só (comparar com levelBefore) em vez de uma
            // flag do laço + a mesma comparação: com dois caminhos possíveis de subida (degrau
            // exato e salto em forma fechada) a flag daria margem pra um deles esquecer de marcá-la.
            var leveledUp = (state.level !== levelBefore);
            if (leveledUp) {
                // Crescimento passivo por espécie: aplica só o DELTA entre o nível antigo e o novo,
                // pra fórmula continuar absoluta (A = semente + floor(rate * (level-1) * 0.6)) e o
                // anti-cheat em reconcileAttributePoints() bater exatamente com o valor guardado.
                var charIdForGrowth = state.characterId || (typeof window !== 'undefined' ? window.g_currentPlayerGhost : "");
                var growthBefore = getPassiveGrowth(charIdForGrowth, levelBefore);
                var growthAfter = getPassiveGrowth(charIdForGrowth, state.level);
                for (var gi = 0; gi < ATTR_KEYS.length; gi++) {
                    var gk = ATTR_KEYS[gi];
                    var delta = growthAfter[gk] - growthBefore[gk];
                    if (delta > 0) state[gk] += delta;
                }
                // Dano da arma é derivado de (nível, tier) — subir de nível fortalece o golpe.
                refreshWeaponDamage();
            }
            updateIntegrityHash(); this.saveLocalStorage();
            if (leveledUp) { this.triggerLevelUpEffect(); }
            if (typeof RenderRPGStatusDrawer === "function") { RenderRPGStatusDrawer(); }
        },
        allocateAttribute: function(attributeName) {
            if (!verifyIntegrity()) return false;
            if (state.pointsToDistribute <= 0) return false;
            var attr = attributeName.toLowerCase();
            if (state.hasOwnProperty(attr) && ['level', 'xp', 'xprequired', 'pointstodistribute', 'characterid'].indexOf(attr) === -1) {
                state[attr]++; state.pointsToDistribute--;
                updateIntegrityHash(); this.saveLocalStorage();
                return true;
            }
            return false;
        },
        // Alocação em massa (16/09/2026). Os pontos por nível continuam fixos em 5, mas com teto de
        // 100 bilhões de níveis um personagem acumula ~500 bilhões de pontos não gastos — clicar
        // "+1" 500 bilhões de vezes não é uma UI, é uma pegadinha. Convive com allocateAttribute
        // (o "+1" continua existindo), não substitui. amount = "all" gasta tudo de uma vez.
        allocateAttributeBulk: function(attributeName, amount) {
            if (!verifyIntegrity()) return 0;
            if (state.pointsToDistribute <= 0) return 0;
            var attr = (attributeName || "").toLowerCase();
            if (!state.hasOwnProperty(attr) || ['level', 'xp', 'xprequired', 'pointstodistribute', 'characterid'].indexOf(attr) !== -1) {
                return 0;
            }
            var qty;
            if (amount === "all" || amount === Infinity) {
                qty = state.pointsToDistribute;
            } else {
                qty = parseInt(amount, 10);
                if (isNaN(qty) || qty <= 0) return 0;
            }
            qty = Math.min(qty, state.pointsToDistribute);
            if (qty <= 0) return 0;
            state[attr] += qty;
            state.pointsToDistribute -= qty;
            updateIntegrityHash(); this.saveLocalStorage();
            return qty;
        },
        triggerLevelUpEffect: function() {
            if (typeof DeSoGhost !== "undefined") { DeSoGhost.isLevelingUpAnim = 60; }
            // ScoreGrant(L) = 200 * L^0.5 (16/09/2026). Era level * 200, linear — num teto de 100
            // bilhões de níveis isso despejaria 2e13 de score por level-up e destruiria a economia
            // de score (que é a moeda do upgrade de arma). A raiz quadrada mantém a recompensa
            // crescente, porém sublinear.
            var scoreGrant = Math.max(1, Math.floor(200 * Math.sqrt(state.level)));
            if (typeof window.AddScore === 'function') {
                window.AddScore(scoreGrant);
            } else if (typeof AddScore === 'function') {
                AddScore(scoreGrant);
            } else {
                console.error('[RPG] AddScore not ready');
            }
        },
        getModifiedSpeed: function(baseSpeed) {
            var stats = this.getStats();
            var bonus = Math.min(stats.agi * 0.04, 0.40);
            return baseSpeed * (1 + bonus);
        },
        getModifiedJumpAcceleration: function(baseAcc) {
            var stats = this.getStats();
            var bonus = Math.min(stats.agi * 0.015, 0.15);
            return baseAcc.map(function(val) { return val * (1 + bonus); });
        },
        getGhostDurationMultiplier: function() { 
            var stats = this.getStats();
            return 1 + (stats.int * 0.10); 
        },
        getBossJumpDamage: function() { 
            var stats = this.getStats();
            return 1 + Math.floor(stats.pow / 3); 
        },
        getMaxLivesCap: function() {
            if (!verifyIntegrity()) return 5;
            var stats = this.getStats();
            var helmetBonus = (state.equipment && state.equipment.head) ? 1 : 0;
            return 4 + stats.vit + helmetBonus;
        },
        getMaxMana: function() {
            if (!verifyIntegrity()) return 100;
            var stats = this.getStats();
            // manaRecoveryBonus (#2) engorda o teto de mana além de acelerar a regeneração
            // (getManaRegenBonus). São os dois lados da mesma promessa "seu gear te dá fôlego
            // de mana" — e o teto é a metade que funciona sem engine.js precisar mudar nada.
            return 100 + (stats.mag * 20) + (sumEquippedAffix('manaRecoveryBonus') * MANA_PER_RECOVERY_POINT);
        },
        // Barra de VITALIDADE do HUD (16/09/2026). Antes DeSoGhost.maxVitality era fixo em 3 e
        // nunca escalava com "vit" — o comentário original em engine.js justificava isso pra "vit"
        // não comprar dois bônus de uma vez (o outro sendo o teto de lives em getMaxLivesCap).
        // Decisão revertida de propósito: "vit" agora dá OS DOIS (barra maior E teto de lives
        // maior). Mesmo estilo/contrato de getMaxMana acima — recalculado todo frame em
        // DeSoGhost.move().
        getMaxVitality: function() {
            if (!verifyIntegrity()) return 3;
            var stats = this.getStats();
            // vitalityBonus (#2) entra AQUI, dividido: 5 pontos de affix = +1 barra. Sem o
            // divisor, um único "of the Titan" (5-20) dobraria ou quintuplicaria a barra base
            // de 3 — o affix tem que ser um upgrade, não uma troca de patamar.
            var affixVit = Math.floor(sumEquippedAffix('vitalityBonus') / VITALITY_BONUS_PER_POINT);
            return 3 + stats.vit + affixVit;
        },
        // Acessor leve pro nível: getStats() faz deep-copy do state inteiro (JSON round-trip) e o
        // HUD desenha todo frame — ler só o número não precisa pagar esse custo.
        getLevel: function() {
            return state.level || 1;
        },
        formatBigNumber: formatBigNumber,

        // ====================================================================
        // API DE EQUIPAMENTO exposta pro combate (16/09/2026). Nomes e assinaturas são
        // CONTRATO com o código de combate elemental em engine.js — não renomeie sem
        // avisar o outro lado. Todas são somente-leitura, exceto applyLifeLeech.
        // ====================================================================
        getTotalDefense: getTotalDefense,                             // ('player') -> número
        getDamageReduction: getDamageReduction,                       // ('player') -> 0..0.60
        getElementalDamageMultiplier: getElementalDamageMultiplier,   // ('fire'|'cold'|...) -> >=1
        getRingBonus: getRingBonus,                                   // ('ring1'|'ring2') -> >=1
        getPrecisionDamage: getPrecisionDamage,                       // -> bônus plano de dano
        getCooldownMultiplier: getCooldownMultiplier,                 // -> 0.60..1.00
        getManaRegenBonus: getManaRegenBonus,                         // -> mana/frame extra
        getModifiedManaRegen: function(baseRegen) {                   // espelha getModifiedSpeed
            return (Number(baseRegen) || 0) + getManaRegenBonus();
        },
        getLifeLeechPercent: getLifeLeechPercent,                     // -> 0..25
        applyLifeLeech: applyLifeLeech,                               // (dano) -> vitalidade curada
        getMainhandDamageMultiplier: getMainhandDamageMultiplier,
        getAffixTotal: function(stat) { return sumEquippedAffix(stat); },
        // Resumo pronto pra UI (painel EQUIP em js/ui/ui_manager.js) e pra depuração rápida
        // no console — um lugar só pra ver tudo que o gear está de fato concedendo agora.
        getGearSummary: function() {
            return {
                defense: getTotalDefense('player'),
                damageReduction: getDamageReduction('player'),
                fireBonus: sumEquippedAffix('fireDamageBonus'),
                coldBonus: sumEquippedAffix('coldDamageBonus'),
                tierElementalBonus: getTierElementalBonus(),
                precisionDamage: getPrecisionDamage(),
                cooldownReduction: 1 - getCooldownMultiplier(),
                manaRegenBonus: getManaRegenBonus(),
                manaCapBonus: sumEquippedAffix('manaRecoveryBonus') * MANA_PER_RECOVERY_POINT,
                lifeLeechPercent: getLifeLeechPercent(),
                vitalityBars: Math.floor(sumEquippedAffix('vitalityBonus') / VITALITY_BONUS_PER_POINT),
                mainhandMultiplier: getMainhandDamageMultiplier()
            };
        },
        getPassiveGrowth: function(charId, level) {
            return getPassiveGrowth(charId || state.characterId, level || state.level);
        },
        getWeaponUpgradeCost: function() {
            return calculateWeaponUpgradeCost(getWeaponTier());
        },
        getWeaponTier: function() {
            return getWeaponTier();
        },
        setSkill: function(slotIndex, skillId) {
            if (!verifyIntegrity()) return;
            state.equippedSkills[slotIndex] = parseInt(skillId, 10);
            updateIntegrityHash(); this.saveLocalStorage();
        },
        setRune: function(slotIndex, runeId) {
            if (!verifyIntegrity()) return;
            state.equippedRunes[slotIndex] = parseInt(runeId, 10);
            updateIntegrityHash(); this.saveLocalStorage();
        },
        upgradeWeapon: function() {
            if (!verifyIntegrity()) return false;
            // 16/09/2026: custo agora vem do TIER, não do dano cru (que virou um valor derivado de
            // 12+ dígitos e não serve mais como moeda de entrada).
            //   WeaponUpgradeCost(tier) = 100 * 1.15^tier   (moeda = score)
            //   WeaponDamage(L, tier)   = 10 * L^1.85 * 1.12^tier
            var currentTier = getWeaponTier();
            var upgradeCost = calculateWeaponUpgradeCost(currentTier);
            if (window.DeductScore && window.DeductScore(upgradeCost)) {
                var weaponNames = ["Starter Dirk", "Shadow Dirk", "Ghostblade", "Doom Splicer", "Soul Reaper", "Grandfather", "Doomcalibur", "Desolation Sword"];
                var nextTier = currentTier + 1;
                var nextName = weaponNames[nextTier] || ("Godly Blade +" + nextTier);
                state.weapon.tier = nextTier;
                state.weapon.name = nextName;
                refreshWeaponDamage();
                updateIntegrityHash(); this.saveLocalStorage();
                return true;
            }
            return false;
        },
        saveLocalStorage: function() {
            try {
                // Sincroniza a fase atual antes de salvar (30/08/2026, achado numa auditoria
                // pedida pelo usuário: "salvar a fase também"). window.g_currentLevel é a fase
                // que o engine está rodando agora, mas nada nunca gravava esse valor de volta em
                // state.worldLevel — getStats() já lia window.g_currentLevel pra mostrar na UI,
                // só nunca persistia. Sem isso, todo save mandava worldLevel undefined, e o banco
                // sempre gravava o valor padrão (1), não importa em qual fase o jogador estivesse.
                // Normaliza pra número (ver normalizeWorldLevel acima) — sem isso, "cave1" ia cru
                // pra state.worldLevel e quebrava a coluna INTEGER world_level no Postgres,
                // travando o save do personagem inteiro (achado crítico #4, 27/08/2026).
                if (typeof window.g_currentLevel !== 'undefined') {
                    state.worldLevel = normalizeWorldLevel(window.g_currentLevel, state.worldLevel);
                }

                var socketPayload = state;

                if (state.characterId && state.characterId !== 0 && state.characterId !== "0") {
                    // Usa o characterId cru, sem prefixar com "ghost_" — é o que TriggerCreateNewGhost,
                    // TriggerRPGSaveToDeSo e SelectCharacterToPlay já fazem em game_core.js. Prefixar
                    // aqui (como o código fazia antes de 20/08/2026) criava uma entrada duplicada
                    // ("ghost_dg_local_xxxx" para fantasmas forjados, por exemplo) toda vez que essa
                    // função rodava automaticamente durante o jogo, em vez de atualizar a entrada certa.
                    var targetCharId = state.characterId.toString();
                    var rawChars = localStorage.getItem("dg_local_characters");
                    var localChars = rawChars ? JSON.parse(rawChars) : [];

                    var stateToSave = JSON.parse(JSON.stringify(state));
                    stateToSave.characterId = targetCharId;

                    // Compatibilidade com saves antigos: um personagem pode já estar gravado sob o
                    // formato antigo ("ghost_" + preenchido com zeros) de antes dessa correção. Se achar
                    // por esse formato, atualiza a entrada existente em vez de criar uma nova ao lado.
                    var legacyCharId = "ghost_" + targetCharId.padStart(3, '0');
                    var existingIndex = localChars.findIndex(function(c) {
                        return c.characterId === targetCharId || c.characterId === legacyCharId;
                    });
                    if (existingIndex >= 0) {
                        localChars[existingIndex] = stateToSave;
                    } else {
                        localChars.push(stateToSave);
                    }
                    localStorage.setItem("dg_local_characters", JSON.stringify(localChars));

                    // Manda só o personagem que mudou pro banco (não a lista inteira, que pode ter
                    // dezenas de fantasmas) — assim toda ação automática de jogo (subir de nível,
                    // equipar item, distribuir ponto, etc.) já vai pro banco na hora, e não só nos
                    // pontos de checkpoint (login, forja, botão SAVE). Adicionado em 20/08/2026: o
                    // banco é a única fonte de verdade, então progresso feito sem apertar SAVE não
                    // pode ficar preso só no localStorage de um aparelho.
                    socketPayload = Object.assign({}, state, { characters: [stateToSave] });
                } else {
                    var dataToSave = JSON.stringify(state);
                    var encrypted = (window.SafeBtoa || btoa)(dataToSave + "||" + rpgAntiCheat.hash);
                    localStorage.setItem("DangerGhost_RPG_Save", encrypted);
                }

                // window.g_socket nunca existiu em lugar nenhum da página (bug achado hoje em
                // TriggerRPGSaveToDeSo, game_core.js) — o socket real vive em
                // window.NetworkState.socket. window.cloudSave também não é confiável (só é
                // setada quando GhostRPG.applyCloudSave não existe, que não é o caso aqui);
                // "dg_cloud_email" é gravado por completeCloudLogin em todo login bem-sucedido e
                // é o que o resto do código já usa pra saber se o jogador está logado.
                var activeSocket = window.NetworkState && window.NetworkState.socket;
                if (activeSocket && activeSocket.connected && localStorage.getItem("dg_cloud_email")) {
                    activeSocket.emit('save_game_state', socketPayload);
                }
            } catch (e) { console.error("Save falhou", e); }
        },
        loadLocalStorage: function(forceCharId) {
            try {
                // Ordem corrigida (achado médio, 27/08/2026, mesmo fix já aplicado no mobile): calcula
                // isGhost ANTES de decidir sobre window.cloudSave, não depois. Antes, a checagem de
                // cloudSave rodava primeiro incondicionalmente — se window.cloudSave estivesse setado
                // por resíduo de uma sessão anterior, um pedido explícito de trocar de personagem
                // (forceCharId) era ignorado e o cloud save genérico "vencia" por acidente de ordem.
                var charToLoad = forceCharId || state.characterId;
                var isGhost = charToLoad && charToLoad !== 0 && charToLoad !== "0";

                if (window.cloudSave && !isGhost) {
                    return this.applyCloudSave(window.cloudSave);
                }

                if (isGhost) {
                    // Busca pelo ID cru primeiro (formato usado desde 20/08/2026); cai pro formato
                    // antigo prefixado ("ghost_" + zeros) só pra não perder saves feitos antes dessa
                    // correção — ver o mesmo comentário em saveLocalStorage().
                    var rawCharId = charToLoad.toString();
                    var legacyCharId = "ghost_" + rawCharId.padStart(3, '0');
                    var rawChars = localStorage.getItem("dg_local_characters");
                    if (rawChars) {
                        var localChars = JSON.parse(rawChars);
                        var foundChar = localChars.find(function(c) { return c.characterId === rawCharId || c.characterId === legacyCharId; });
                        if (foundChar) {
                            state = foundChar;
                            state.characterId = charToLoad; // Keep internal state ID as "001" etc
                            var maxLevel = 100000000000;
                            if (state.level > maxLevel) {
                                state.level = maxLevel;
                                state.xp = 0;
                            }
                            if (!state.equippedSkills) state.equippedSkills = [0, 1, 2, 3];
                            if (!state.equippedRunes) state.equippedRunes = [0, 0, 0, 0];
                            if (!state.equippedPassives) state.equippedPassives = [-1, -1];
                            if (!state.weapon) state.weapon = { name: 'Starter Dirk', damage: 10 };
                            if (!state.inventory) state.inventory = [];
                            if (!state.equipment) {
                                state.equipment = { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
                            } else {
                                // Corrigido (achado crítico #3, 27/08/2026, porte do mobile): antes,
                                // achar QUALQUER chave legada (helmet/spell) reatribuía state.equipment
                                // inteiro, apagando itens válidos já equipados nos slots novos. Agora só
                                // remove as chaves legadas, preservando o resto do objeto.
                                delete state.equipment.helmet;
                                delete state.equipment.spell;
                                var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
                                slots.forEach(function(s) {
                                    if (typeof state.equipment[s] === 'undefined') state.equipment[s] = null;
                                });
                            }
                            if (typeof state.deaths === 'undefined') state.deaths = 0;

                            // Stat inicial por espécie (achado médio, 27/08/2026, porte do mobile) em
                            // vez de assumir sempre base 1 na fórmula de pontos usados/disponíveis.
                            var base = getGhostBaseStats(charToLoad);
                            if (state.level === 1) {
                                state.vit = base.vit;
                                state.agi = base.agi;
                                state.int = base.int;
                                state.pow = base.pow;
                                state.mag = base.mag;
                            }
                            // RECONCILIAÇÃO 1/4 (loadLocalStorage, ramo dg_local_characters).
                            // Agora considera o crescimento passivo por espécie, não só a semente.
                            reconcileAttributePoints(charToLoad);

                            state.xpRequired = calculateXpRequired(state.level);
                            refreshWeaponDamage();
                            updateIntegrityHash();
                            console.log("[RPG] Status carregado do dg_local_characters para ghost: " + state.characterId);
                            return;
                        }
                    }
                    console.log("[RPG] No save found for ghost " + charToLoad + " in dg_local_characters, starting fresh!");
                    this.resetStats(charToLoad);
                    return;
                }
                
                var saved = localStorage.getItem("DangerGhost_RPG_Save");
                if (saved) {
                    var decrypted = (window.SafeAtob || atob)(saved);
                    var parts = decrypted.split("||");
                    var data = JSON.parse(parts[0]);
                    state = data;
                    var maxLevel = 100000000000;
                    if (state.level > maxLevel) {
                        state.level = maxLevel;
                        state.xp = 0;
                    }
                    if (!state.equippedSkills) state.equippedSkills = [0, 1, 2, 3];
                    if (!state.equippedRunes) state.equippedRunes = [0, 0, 0, 0];
                    if (!state.equippedPassives) state.equippedPassives = [-1, -1];
                    if (!state.weapon) state.weapon = { name: 'Starter Dirk', damage: 10 };
                    if (!state.inventory) state.inventory = [];
                    
                    if (!state.equipment) {
                        state.equipment = { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
                    } else {
                        // Mesmo fix do achado crítico #3 aplicado acima: só remove as chaves legadas
                        // (helmet/spell), não reatribui state.equipment inteiro.
                        delete state.equipment.helmet;
                        delete state.equipment.spell;
                        var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
                        slots.forEach(function(s) {
                            if (typeof state.equipment[s] === 'undefined') state.equipment[s] = null;
                        });
                    }

                    if (charToLoad) state.characterId = charToLoad;
                    if (typeof state.deaths === 'undefined') state.deaths = 0;

                    // RECONCILIAÇÃO 2/4 (loadLocalStorage, ramo legado DangerGhost_RPG_Save).
                    // Esta cópia comparava contra a base fixa 1, ignorando até a semente da espécie
                    // que já existia — dava pontos a mais pra qualquer fantasma com stats_base alto.
                    reconcileAttributePoints(state.characterId);

                    state.xpRequired = calculateXpRequired(state.level);
                    refreshWeaponDamage();
                    updateIntegrityHash();
                }
                console.log("[RPG] Status carregado do LocalStorage para ghost: " + (state.characterId || "default"));
            } catch (e) {
                console.warn("[RPG] Nenhum save encontrado ou corrompido, usando default.");
                this.resetStats(forceCharId);
            }
        },

        applyCloudSave: function(cloudData) {
            try {
                // NÃO seta state.name aqui (20/08/2026) — cloudData.name é o nome da CONTA, não
                // de um personagem específico. Setar isso no state ativo vazava o nome da conta
                // pro campo "name" do personagem quando um save automático rodava logo depois
                // (ex: ao auto-selecionar o último fantasma jogado no login), sobrescrevendo o
                // nome real do fantasma. O nome de cada personagem vem de dg_local_characters,
                // já sincronizado corretamente pelo completeCloudLogin em auth.js.
                state.level = parseInt(cloudData.level) || 1;
                state.xp = parseFloat(cloudData.xp) || 0;
                state.mana = parseFloat(cloudData.mana) || 100;
                state.maxMana = parseFloat(cloudData.maxMana) || 100;
                state.lives = parseInt(cloudData.lives) || 3;
                state.equippedSkills = Array.isArray(cloudData.equippedSkills) ? cloudData.equippedSkills : [0,0,0,0];
                
                // Recalculates stats based on the new level
                state.xpRequired = calculateXpRequired(state.level);
                
                updateIntegrityHash();
                console.log("[RPG] Status carregado da Nuvem (Cloud Save)!");
            } catch (e) {
                console.error("[RPG] Erro ao aplicar Cloud Save", e);
            }
        },

        // loadBlockchainState nunca recebeu o nome do personagem (parâmetro nenhum pra isso) —
        // setName existe à parte pra suprir isso sem mexer na lista de parâmetros dessa função,
        // que já tem várias chamadas espalhadas por game_core.js. Chame logo depois de
        // loadBlockchainState com o char.name de verdade — ver SelectCharacterToPlay. Sem isso,
        // state.name ficava undefined (ou vazava o nome da conta via applyCloudSave, corrigido
        // em 20/08/2026) e saveLocalStorage() gravava esse valor errado de volta na entrada do
        // personagem.
        setName: function(name) {
            if (name) state.name = name;
        },
        loadBlockchainState: function(lvl, vit, agi, int, pow, characterId, xp, pointsToDistribute, mag, equippedSkills, equippedRunes, equippedPassives, weapon, inventory, equipment, name) {
            var maxLevel = 100000000000;
            
            var parsedLvl = parseInt(lvl, 10);
            state.level = (!isNaN(parsedLvl)) ? Math.min(parsedLvl, maxLevel) : 1;
            
            var parsedVit = parseInt(vit, 10);
            state.vit = (!isNaN(parsedVit)) ? parsedVit : 1;
            
            var parsedAgi = parseInt(agi, 10);
            state.agi = (!isNaN(parsedAgi)) ? parsedAgi : 1;
            
            var parsedInt = parseInt(int, 10);
            state.int = (!isNaN(parsedInt)) ? parsedInt : 1;
            
            var parsedPow = parseInt(pow, 10);
            state.pow = (!isNaN(parsedPow)) ? parsedPow : 1;
            
            var parsedMag = parseInt(mag, 10);
            state.mag = (!isNaN(parsedMag)) ? parsedMag : 1;
            
            state.characterId = characterId || "";

            // Nome tem que ser aplicado ANTES do saveLocalStorage() no fim desta função, não
            // depois por um setName() separado do chamador — essa função salva pro banco
            // incondicionalmente, e um setName() posterior chegava tarde demais: o save já tinha
            // ido pro Postgres com o nome do personagem ANTERIOR ainda em state.name, corrompendo
            // o nome do personagem recém-selecionado (achado 22/08/2026, auditoria de evolução —
            // trocar de fantasma via PLAY na Ghostdex vazava o nome de quem jogava antes).
            if (name) state.name = name;

            var parsedXp = parseInt(xp, 10);
            state.xp = (!isNaN(parsedXp)) ? parsedXp : 0;
            
            if (state.level >= maxLevel) {
                state.xp = 0;
            }
            
            var parsedPoints = parseInt(pointsToDistribute, 10);
            state.pointsToDistribute = (!isNaN(parsedPoints)) ? parsedPoints : 0;
            
            // RECONCILIAÇÃO 3/4 (loadBlockchainState). Mesma correção: base da espécie +
            // crescimento passivo, em vez da base fixa 1.
            reconcileAttributePoints(state.characterId);

            state.xpRequired = calculateXpRequired(state.level);
            state.equippedSkills = equippedSkills || [0, 1, 2, 3];
            state.equippedRunes = equippedRunes || [0, 0, 0, 0];
            state.equippedPassives = equippedPassives || [-1, -1];
            state.weapon = weapon || { name: 'Starter Dirk', damage: 10 };
            state.inventory = inventory || [];
            
            state.equipment = equipment || { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
            if (state.equipment) {
                var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
                slots.forEach(function(s) {
                    if (typeof state.equipment[s] === 'undefined') state.equipment[s] = null;
                });
                delete state.equipment.helmet;
                delete state.equipment.spell;
            }

            // state.weapon só é atribuído acima, então o dano derivado tem que ser recalculado aqui
            // (depois), não junto da reconciliação de pontos.
            refreshWeaponDamage();
            updateIntegrityHash(); this.saveLocalStorage();
            if (typeof RenderRPGStatusDrawer === "function") { RenderRPGStatusDrawer(); }
        },

        loadServerState: function(serverState) {
            if (!serverState || typeof serverState !== 'object') return;
            
            if (serverState.level) state.level = serverState.level;
            if (serverState.xp) state.xp = serverState.xp;
            if (serverState.xpRequired) state.xpRequired = serverState.xpRequired;
            if (serverState.pointsToDistribute !== undefined) state.pointsToDistribute = serverState.pointsToDistribute;
            
            if (serverState.vit) state.vit = serverState.vit;
            if (serverState.agi) state.agi = serverState.agi;
            if (serverState.int) state.int = serverState.int;
            if (serverState.pow) state.pow = serverState.pow;
            if (serverState.mag) state.mag = serverState.mag;
            if (serverState.characterId) state.characterId = serverState.characterId;
            
            if (Array.isArray(serverState.equippedSkills)) state.equippedSkills = serverState.equippedSkills;
            if (Array.isArray(serverState.equippedRunes)) state.equippedRunes = serverState.equippedRunes;
            if (Array.isArray(serverState.equippedPassives)) state.equippedPassives = serverState.equippedPassives;
            
            if (serverState.weapon) state.weapon = serverState.weapon;
            if (serverState.inventory) state.inventory = serverState.inventory;
            if (serverState.equipment) state.equipment = serverState.equipment;
            if (serverState.deaths !== undefined) state.deaths = serverState.deaths;
            
            // RECONCILIAÇÃO 4/4 (loadServerState). Mesma correção das outras três.
            reconcileAttributePoints(state.characterId);

            state.xpRequired = calculateXpRequired(state.level);
            refreshWeaponDamage();
            updateIntegrityHash();
            this.saveLocalStorage();
            if (typeof RenderRPGStatusDrawer === "function") { RenderRPGStatusDrawer(); }
        },

        addItem: function(item) {
            if (!verifyIntegrity()) return;
            if (!state.inventory) state.inventory = [];
            
            var isStackable = (item.id === "ghost_spell" || item.id === "elixir" || item.id === "deso_coin" || item.id === "blue_key" || !item.quality || item.quality === "Common");
            var existing = null;
            if (isStackable) {
                existing = state.inventory.find(function(i) { return i.id === item.id; });
            }
            
            if (existing) {
                existing.count = (existing.count || 1) + (item.count || 1);
            } else {
                if (state.inventory.length >= 100) {
                    if (typeof alert === "function") {
                        alert("Inventory full (Limit: 100 items)!");
                    }
                    return;
                }
                var newItem = {
                    id: item.id,
                    name: item.name,
                    icon: item.icon || "assets2/branch.png",
                    description: item.description || "",
                    count: item.count || 1
                };
                if (item.quality) newItem.quality = item.quality;
                if (item.slot) newItem.slot = item.slot;
                if (item.itemLevel) newItem.itemLevel = item.itemLevel;
                if (item.baseDamage !== undefined) newItem.baseDamage = item.baseDamage;
                if (item.baseDefense !== undefined) newItem.baseDefense = item.baseDefense;
                if (item.attributes) newItem.attributes = item.attributes;
                // Sem esta linha os affixes rolados em LootGenerator.generate() morriam no
                // caminho loot -> mochila: addItem() copia uma LISTA BRANCA de campos, e tudo
                // que não está nela é descartado silenciosamente.
                if (item.affixes) newItem.affixes = item.affixes;
                if (item.specialEffect) newItem.specialEffect = item.specialEffect;
                if (item.requiredStats) newItem.requiredStats = item.requiredStats;
                
                state.inventory.push(newItem);
            }
            updateIntegrityHash();
            this.saveLocalStorage();
            if (typeof UpdateNavbarBag === "function" && window.g_activeTab === 'bag') {
                UpdateNavbarBag();
            }
        },
        removeItem: function(itemId) {
            if (!verifyIntegrity()) return false;
            if (!state.inventory) return false;
            var idx = state.inventory.findIndex(function(i) { return i.id === itemId; });
            if (idx !== -1) {
                var item = state.inventory[idx];
                if (item.count > 1) {
                    item.count--;
                } else {
                    state.inventory.splice(idx, 1);
                }
                updateIntegrityHash();
                this.saveLocalStorage();
                if (typeof UpdateNavbarBag === "function" && window.g_activeTab === 'bag') {
                    UpdateNavbarBag();
                }
                return true;
            }
            return false;
        },
        discardItem: function(itemId) {
            if (!verifyIntegrity()) return false;
            if (!state.inventory) return false;
            var idx = state.inventory.findIndex(function(i) { return i.id === itemId; });
            if (idx !== -1) {
                state.inventory.splice(idx, 1);
                updateIntegrityHash();
                this.saveLocalStorage();
                if (typeof UpdateNavbarBag === "function" && window.g_activeTab === 'bag') {
                    UpdateNavbarBag();
                }
                return true;
            }
            return false;
        },
        hasItem: function(itemId) {
            if (!verifyIntegrity()) return false;
            if (!state.inventory) return false;
            return state.inventory.some(function(i) { return i.id === itemId; });
        },
        equipItem: function(itemId, targetSlot) {
            if (!verifyIntegrity()) return false;
            if (!state.inventory) return false;
            var idx = state.inventory.findIndex(function(i) { return i.id === itemId; });
            if (idx === -1) return false;
            var item = state.inventory[idx];

            if (!state.equipment) {
                state.equipment = { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
            }

            var itemSlot = item.slot || "";
            var normalizedSlot = "";
            if (targetSlot) {
                normalizedSlot = targetSlot;
            } else {
                var slotLower = itemSlot.toLowerCase();
                if (slotLower === 'head') normalizedSlot = 'head';
                else if (slotLower === 'chest') normalizedSlot = 'chest';
                else if (slotLower === 'mainhand') normalizedSlot = 'mainhand';
                else if (slotLower === 'offhand') normalizedSlot = 'offhand';
                else if (slotLower === 'amulet') normalizedSlot = 'amulet';
                else if (slotLower === 'ring1') normalizedSlot = 'ring1';
                else if (slotLower === 'ring2') normalizedSlot = 'ring2';
                else if (slotLower === 'ring') {
                    var itemNameLower = (item.name || "").toLowerCase();
                    if (itemNameLower.includes("ice") || itemNameLower.includes("cold") || itemNameLower.includes("winter")) {
                        normalizedSlot = 'ring1';
                    } else if (itemNameLower.includes("wood") || itemNameLower.includes("forest")) {
                        normalizedSlot = 'ring2';
                    } else if (!state.equipment.ring1) {
                        normalizedSlot = 'ring1';
                    } else {
                        normalizedSlot = 'ring2';
                    }
                } else {
                    if (item.id === "ghost_helmet") normalizedSlot = 'head';
                    else if (item.id === "ghost_spell") normalizedSlot = 'mainhand';
                    else normalizedSlot = 'mainhand';
                }
            }

            var validSlots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
            if (validSlots.indexOf(normalizedSlot) === -1) return false;

            if (item.requiredStats) {
                var reqStr = item.requiredStats.strength || 0;
                var reqInt = item.requiredStats.intelligence || 0;
                var reqAgi = item.requiredStats.agility || 0;
                
                var playerStr = state.pow || 1;
                var playerInt = state.int || 1;
                var playerAgi = state.agi || 1;
                
                if (playerStr < reqStr || playerInt < reqInt || playerAgi < reqAgi) {
                    if (typeof alert === "function") {
                        alert("Requirements not met!\n" +
                              "Required: POW: " + reqStr + ", INT: " + reqInt + ", AGI: " + reqAgi + "\n" +
                              "Current: POW: " + playerStr + ", INT: " + playerInt + ", AGI: " + playerAgi);
                    }
                    return false;
                }
            }

            if (state.equipment[normalizedSlot]) {
                this.unequipItem(normalizedSlot);
                idx = state.inventory.findIndex(function(i) { return i.id === itemId; });
                if (idx === -1) return false;
                item = state.inventory[idx];
            }

            state.equipment[normalizedSlot] = item;
            state.inventory.splice(idx, 1);

            // #5 — equipar/trocar mainhand muda o dano final da arma (multiplicador de loot) e
            // qualquer peça pode carregar accuracyRating (dano de precisão), então o dano
            // derivado tem que ser recalculado AQUI, antes do hash de integridade ser refeito.
            refreshWeaponDamage();
            updateIntegrityHash();
            this.saveLocalStorage();
            if (typeof UpdateNavbarBag === "function" && window.g_activeTab === 'bag') {
                UpdateNavbarBag();
            }
            if (typeof UpdateNavbarEquip === "function" && window.g_activeTab === 'equip') {
                UpdateNavbarEquip();
            }
            return true;
        },
        unequipItem: function(slotName) {
            if (!verifyIntegrity()) return false;
            if (!state.equipment) return false;
            var item = state.equipment[slotName];
            if (!item) return false;

            this.addItem(item);
            state.equipment[slotName] = null;

            // Mesmo motivo do equipItem(): tirar a arma (ou uma peça com precisão) tem que
            // devolver o dano pro valor da curva pura.
            refreshWeaponDamage();
            updateIntegrityHash();
            this.saveLocalStorage();
            if (typeof UpdateNavbarBag === "function" && window.g_activeTab === 'bag') {
                UpdateNavbarBag();
            }
            if (typeof UpdateNavbarEquip === "function" && window.g_activeTab === 'equip') {
                UpdateNavbarEquip();
            }
            return true;
        },
        consumeSpellUse: function() {
            if (!verifyIntegrity()) return false;
            if (!state.equipment) return false;
            
            var spellSlot = "";
            if (state.equipment.mainhand && state.equipment.mainhand.id === "ghost_spell") {
                spellSlot = "mainhand";
            } else if (state.equipment.offhand && state.equipment.offhand.id === "ghost_spell") {
                spellSlot = "offhand";
            }
            
            if (!spellSlot) return false;

            state.equipment[spellSlot].count--;
            if (state.equipment[spellSlot].count <= 0) {
                state.equipment[spellSlot] = null;
            }

            updateIntegrityHash();
            this.saveLocalStorage();
            if (typeof UpdateNavbarEquip === "function" && window.g_activeTab === 'equip') {
                UpdateNavbarEquip();
            }
            return true;
        },
        // Elixir (02/09/2026): mesmo padrão de consumeSpellUse acima, mas pro item "elixir"
        // equipado em vez de "ghost_spell" -- os dois disputam o mesmo slot mainhand/offhand
        // (equipItem() manda ambos pra mainhand por padrão, ver switch lá embaixo), então só um
        // dos dois fica equipado por vez. Quem decide "curar ou lançar fogo" ao apertar "1" é o
        // handler de teclado em engine.js, que chama ConsumeElixir() OU ConsumeSpellUse()
        // dependendo de qual item está de fato equipado.
        consumeElixir: function() {
            if (!verifyIntegrity()) return false;
            if (!state.equipment) return false;

            var elixirSlot = "";
            if (state.equipment.mainhand && state.equipment.mainhand.id === "elixir") {
                elixirSlot = "mainhand";
            } else if (state.equipment.offhand && state.equipment.offhand.id === "elixir") {
                elixirSlot = "offhand";
            }

            if (!elixirSlot) return false;

            state.equipment[elixirSlot].count--;
            if (state.equipment[elixirSlot].count <= 0) {
                state.equipment[elixirSlot] = null;
            }

            updateIntegrityHash();
            this.saveLocalStorage();
            if (typeof UpdateNavbarEquip === "function" && window.g_activeTab === 'equip') {
                UpdateNavbarEquip();
            }
            return true;
        },
        getEquipment: function() {
            if (!verifyIntegrity()) return { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
            if (!state.equipment) state.equipment = { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
            return state.equipment;
        },
        SwitchActiveGhost: function(ghostId) {
            this.saveLocalStorage();
            state.characterId = ghostId;
            this.loadLocalStorage(ghostId);
            if (typeof RenderRPGStatusDrawer === "function") RenderRPGStatusDrawer();
            if (typeof UpdateNavbarBag === "function" && window.g_activeTab === 'bag') UpdateNavbarBag();
            if (typeof UpdateNavbarEquip === "function" && window.g_activeTab === 'equip') UpdateNavbarEquip();
            if (typeof UpdateNavbarSpells === "function" && window.g_activeTab === 'spells') UpdateNavbarSpells();
        },
        LootGenerator: LootGenerator

    };
})();
GhostRPG.init();
window.LootGenerator = GhostRPG.LootGenerator;
window.RollEnemyDrop = function(levelNum) {
    return GhostRPG.LootGenerator.rollEnemyDrop(levelNum);
};

window.AddInventoryItem = function(id, name, icon, description, count) {
    GhostRPG.addItem({ id: id, name: name, icon: icon, description: description, count: count });
};
window.RemoveInventoryItem = function(id) {
    return GhostRPG.removeItem(id);
};
window.DiscardInventoryItem = function(id) {
    return GhostRPG.discardItem(id);
};
window.HasInventoryItem = function(id) {
    return GhostRPG.hasItem(id);
};
window.EquipInventoryItem = function(id, targetSlot) {
    return GhostRPG.equipItem(id, targetSlot);
};
window.UnequipEquipmentItem = function(slotName) {
    return GhostRPG.unequipItem(slotName);
};
window.ConsumeSpellUse = function() {
    return GhostRPG.consumeSpellUse();
};
window.ConsumeElixir = function() {
    return GhostRPG.consumeElixir();
};
window.GetEquipmentState = function() {
    return GhostRPG.getEquipment();
};

// ============================================================================
// 2026-09-04 (baú de conta / cemitério, plano crystalline-launching-goose.md) —
// transferência de item do BAÚ (window.g_chestItems, por CONTA — ver
// server/db.js:chest_items, Track A) pro inventário de um ghost específico,
// ativo ou não. Vive FORA do IIFE de GhostRPG de propósito: precisa mexer em
// `dg_local_characters` inteiro (todos os personagens), não só no `state`
// privado (só o personagem ativo) que o closure de GhostRPG enxerga — mesma
// razão pela qual window.UnlockGhostForPlayer (js/game/ghost_inventory.js)
// também edita esse localStorage direto em vez de passar por GhostRPG.
//
// normalizeCharId: dg_local_characters tem uma inconsistência de formato JÁ
// DOCUMENTADA neste mesmo arquivo (ver saveLocalStorage acima, "Compatibilidade
// com saves antigos") — um personagem pode estar salvo como "001" (cru, o que
// GhostRPG.saveLocalStorage grava) ou "ghost_001" (o que
// ghost_inventory.js:UnlockGhostForPlayer grava numa captura nova, antes desse
// personagem ser jogado/salvo pelo menos 1x via GhostRPG). Comparar só com
// "===" quebraria silenciosamente pra um ghost recém-capturado ainda não
// normalizado — esta função compara pela forma normalizada (sem prefixo, sem
// zeros à esquerda) nos dois lados, sem NUNCA reescrever o characterId
// armazenado (só usa a forma normalizada pra decidir "é o mesmo personagem?").
function normalizeCharId(id) {
    return String(id || '').replace(/^ghost_/, '').replace(/^0+(?=\d)/, '');
}

window.TransferChestItemToGhost = function(item, targetCharacterId) {
    if (!item || !targetCharacterId) {
        console.warn('[RPG] TransferChestItemToGhost: item ou targetCharacterId ausente.');
        return false;
    }

    var activeCharId = (window.GhostRPG && GhostRPG.getStats) ? GhostRPG.getStats().characterId : null;
    var isActiveGhost = activeCharId != null && normalizeCharId(activeCharId) === normalizeCharId(targetCharacterId);

    if (isActiveGhost) {
        // Ghost ATIVO — caminho direto, mesma função que qualquer loot novo usa
        // (AddInventoryItem já cuida de empilhamento/limite de 100 slots/persistência
        // local; GhostRPG.addItem() já dispara UpdateNavbarBag() se a aba Bag estiver
        // aberta, então o inventário do Bag reflete a transferência sem esta função
        // precisar saber nada de UI).
        // 16/09/2026: era window.AddInventoryItem(id, name, icon, description, count), que
        // reconstrói o item a partir de 5 campos soltos e PERDE quality/slot/itemLevel/
        // baseDamage/baseDefense/attributes/affixes/requiredStats no caminho — um épico
        // guardado no baú voltava pro ghost como item vazio. GhostRPG.addItem() recebe o
        // objeto inteiro e preserva a lista branca completa (mesmo empilhamento, mesmo
        // limite de 100 slots, mesmo refresh de UI).
        window.GhostRPG.addItem(item);
    } else {
        // Ghost NÃO-ativo — GhostRPG não enxerga esse personagem (só conhece o
        // `state` ativo), então edita dg_local_characters diretamente: acha o
        // registro pelo characterId normalizado, empurra o item no array
        // `inventory` dele (mesmo empilhamento simples de GhostRPG.addItem() acima
        // pra itens sem quality/Common — ghosts não-ativos não têm o limite de 100
        // slots reforçado aqui, documentado, não um bug novo desta função), grava
        // de volta em localStorage.dg_local_characters.
        var raw = localStorage.getItem('dg_local_characters');
        var localChars = raw ? JSON.parse(raw) : [];
        var targetChar = localChars.find(function (c) { return normalizeCharId(c.characterId) === normalizeCharId(targetCharacterId); });
        if (!targetChar) {
            console.warn('[RPG] TransferChestItemToGhost: personagem "' + targetCharacterId + '" não encontrado em dg_local_characters — transferência abortada, item permanece no baú.');
            return false;
        }
        if (!Array.isArray(targetChar.inventory)) targetChar.inventory = [];
        var isStackable = (item.id === "ghost_spell" || item.id === "elixir" || item.id === "deso_coin" || item.id === "blue_key" || !item.quality || item.quality === "Common");
        var existing = isStackable ? targetChar.inventory.find(function (i) { return i.id === item.id; }) : null;
        if (existing) {
            existing.count = (existing.count || 1) + (item.count || 1);
        } else {
            var newItem = Object.assign({}, item);
            newItem.count = item.count || 1;
            targetChar.inventory.push(newItem);
        }
        localStorage.setItem('dg_local_characters', JSON.stringify(localChars));

        // Sincroniza com o banco — mesmo evento/payload {characters:[...]} que
        // window.UnlockGhostForPlayer já usa (ghost_inventory.js ~linha 79). Diferente
        // daquela função, NÃO omite inventory/equipment do payload: lá o objetivo era
        // não sobrescrever progresso de OUTRO aparelho com um personagem RECÉM-CRIADO
        // (só campos vazios, ver comentário lá); aqui targetChar já É o registro
        // completo e atualizado deste aparelho (acabou de receber o item de verdade),
        // então mandar o objeto inteiro é o comportamento certo — o COALESCE do
        // servidor não teria nada melhor pra "preservar" no lugar disso.
        var xferSocket = window.NetworkState && window.NetworkState.socket;
        if (xferSocket && xferSocket.connected && localStorage.getItem('dg_cloud_email')) {
            xferSocket.emit('save_game_state', { characters: [targetChar] });
        }

        // window.g_ownedCharacters (cache em memória separado de dg_local_characters,
        // ver nota em js/game/ghostdex_ui.js) — mantém os dois em sincronia, mesmo
        // raciocínio já documentado lá ("sem isso, a tela de seleção de personagem
        // mostraria o inventário desatualizado até o próximo login").
        if (Array.isArray(window.g_ownedCharacters)) {
            var cachedChar = window.g_ownedCharacters.find(function (c) { return normalizeCharId(c.characterId) === normalizeCharId(targetCharacterId); });
            if (cachedChar) cachedChar.inventory = targetChar.inventory;
        }
    }

    // Em QUALQUER um dos dois ramos acima (ativo ou não), o item some do baú —
    // mesmo efeito colateral, um só lugar em vez de duplicado. Remove por
    // IDENTIDADE de objeto (indexOf), não por id: o baú pode ter várias entradas
    // com o mesmo `id` (itens não empilháveis com quality/attributes diferentes,
    // mesmo raciocínio de GhostRPG.addItem sobre só empilhar item Common/sem
    // quality) — remover a primeira ocorrência POR ID poderia apagar a entrada
    // ERRADA se o jogador tivesse duas cópias diferentes do mesmo item base.
    if (Array.isArray(window.g_chestItems)) {
        var chestIdx = window.g_chestItems.indexOf(item);
        if (chestIdx !== -1) window.g_chestItems.splice(chestIdx, 1);
    }
    if (window.SyncChestItemsToServer) window.SyncChestItemsToServer();
    return true;
};

// 2026-09-04 (baú de conta) — emite o estado atual de window.g_chestItems pro
// servidor (mesmo evento `save_game_state` que characters/favorites/etc já
// usam; contrato do plano — campo `chestItems`, camelCase, validado
// server-side em sanitizePlayerProgressPayload/MAX_CHEST_ITEMS, server/db.js,
// Track A). Função própria em vez de inline em cada call site porque TRÊS
// fluxos diferentes disparam exatamente o mesmo emit (GUARDAR/DESCARTAR em
// js/ui/ui_manager.js, TRANSFERIR acima) — um só lugar pro guard
// socket-conectado-e-logado, mesmo padrão já usado por
// UnlockGhostForPlayer/statsFixSocket.
window.SyncChestItemsToServer = function () {
    var socket = window.NetworkState && window.NetworkState.socket;
    if (socket && socket.connected && localStorage.getItem('dg_cloud_email')) {
        socket.emit('save_game_state', { chestItems: Array.isArray(window.g_chestItems) ? window.g_chestItems : [] });
    }
};
