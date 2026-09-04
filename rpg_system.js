var GhostRPG = (function() {
    var BASE_XP = 100;
    var XP_EXPONENT = 1.6;

    var state = {
        level: 1, xp: 0, xpRequired: 100, pointsToDistribute: 0,
        vit: 1, agi: 1, int: 1, pow: 1, mag: 1, characterId: "",
        equippedSkills: [0, 1, 2, 3],
        equippedRunes: [0, 0, 0, 0],
        equippedPassives: [-1, -1],
        weapon: { name: 'Starter Dirk', damage: 10 },
        inventory: [],
        equipment: { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null }
    };

    var rpgAntiCheat = {
        salt: Math.random().toString(36).substring(2, 15),
        hash: ""
    };

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
            if (slotLower === 'mainhand') {
                baseDamage = Math.round(15 * scale * (0.9 + Math.random() * 0.2));
            } else if (slotLower !== 'ring1' && slotLower !== 'ring2' && slotLower !== 'ring' && slotLower !== 'amulet') {
                baseDefense = Math.round(10 * scale * (0.9 + Math.random() * 0.2));
            }

            var attrPool = ['vit', 'agi', 'int', 'pow', 'mag'];
            var numAttrs = 1;
            var attrRange = { min: 1, max: 3 };

            if (quality === 'Rare') {
                numAttrs = 2;
                attrRange = { min: 4, max: 8 };
            } else if (quality === 'Epic') {
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
                } else {
                    finalName = "Eternal Winter Alliance";
                }
            } else if (slotLower === 'ring2') {
                if (quality === 'Common') {
                    finalName = "Rustic Wooden Ring";
                } else if (quality === 'Rare') {
                    finalName = "Runic Wood Rooted Ring";
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

            var reqStr = (slotLower === 'mainhand') ? Math.round(iLvl * 0.8) : Math.round(iLvl * 0.4);
            var reqInt = (slotLower === 'amulet' || slotLower === 'ring' || slotLower === 'ring1' || slotLower === 'ring2') ? Math.round(iLvl * 0.8) : 0;
            var reqAgi = (slotLower === 'head') ? Math.round(iLvl * 0.5) : 0;

            var icon = "assets/sprites/equip_amulet.png";
            if (slotLower === 'mainhand') icon = "assets/sprites/equip_weapon.png";
            else if (slotLower === 'offhand') icon = "assets/sprites/equip_shield.png";
            else if (slotLower === 'head') icon = "assets/sprites/equip_head.png";
            else if (slotLower === 'chest') icon = "assets/sprites/equip_chest.png";
            else if (slotLower === 'ring1' || (slotLower === 'ring' && (finalName.toLowerCase().includes("ice") || finalName.toLowerCase().includes("cold") || finalName.toLowerCase().includes("winter")))) icon = "assets/sprites/equip_ring_ice.png";
            else if (slotLower === 'ring2' || (slotLower === 'ring' && (finalName.toLowerCase().includes("wood") || finalName.toLowerCase().includes("forest")))) icon = "assets/sprites/equip_ring_wood.png";

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

            if (quality === 'Epic') {
                item.specialEffect = "Epic Power of Nowhere!";
            } else if (quality === 'Rare') {
                item.specialEffect = "Rare Guardian Effect.";
            }

            return item;
        },

        determineQuality: function() {
            var rand = Math.random();
            if (rand < 0.05) return 'Epic';
            if (rand < 0.25) return 'Rare';
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

                var quality = 'Common';
                if (isRareEligible && isEpicEligible) {
                    var r = Math.random();
                    if (r < 0.75) quality = 'Common';
                    else if (r < 0.95) quality = 'Rare';
                    else quality = 'Epic';
                } else if (isRareEligible) {
                    if (Math.random() < 0.15) quality = 'Rare';
                } else if (isEpicEligible) {
                    if (Math.random() < 0.20) quality = 'Epic';
                }

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
    function getGhostBaseStats(charId) {
        var res = { vit: 1, agi: 1, int: 1, pow: 1, mag: 1 };
        if (!charId || charId === 0 || charId === "0") return res;
        var ghostNum = charId.toString().replace("ghost_", "").padStart(3, "0");
        var dbGhost = window.g_ghostdexDB ? window.g_ghostdexDB.find(function(g) { return g.id === ghostNum; }) : null;
        if (dbGhost && dbGhost.stats_base) {
            res.vit = Math.ceil(dbGhost.stats_base.hp / 10) || 1;
            res.pow = Math.ceil(dbGhost.stats_base.ataque / 10) || 1;
            res.agi = Math.ceil(dbGhost.stats_base.velocidade / 10) || 1;
            res.int = Math.ceil(dbGhost.stats_base.atq_especial / 10) || 1;
            res.mag = Math.ceil(dbGhost.stats_base.def_especial / 10) || 1;
        }
        return res;
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
                weapon: { name: 'Starter Dirk', damage: 10 },
                inventory: oldInventory,
                equipment: oldEquipment
            };
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
            state.xp += amount;
            var leveledUp = false;
            var loopSafeLevel = 0;
            while (state.xp >= state.xpRequired && state.level < maxLevel && loopSafeLevel++ < 50) {
                if (!state.xpRequired || state.xpRequired <= 0) state.xpRequired = 100;
                state.xp -= state.xpRequired;
                state.level++;
                state.pointsToDistribute += 5;
                state.xpRequired = calculateXpRequired(state.level);
                leveledUp = true;
            }
            if (state.level >= maxLevel) {
                state.level = maxLevel;
                state.xp = 0;
                state.xpRequired = calculateXpRequired(maxLevel);
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
        triggerLevelUpEffect: function() {
            if (typeof DeSoGhost !== "undefined") { DeSoGhost.isLevelingUpAnim = 60; }
            if (typeof window.AddScore === 'function') {
                window.AddScore(state.level * 200);
            } else if (typeof AddScore === 'function') {
                AddScore(state.level * 200);
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
            return 100 + (stats.mag * 20);
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
            var currentDamage = state.weapon.damage;
            var upgradeCost = currentDamage * 100;
            if (window.DeductScore && window.DeductScore(upgradeCost)) {
                var weaponNames = ["Starter Dirk", "Shadow Dirk", "Ghostblade", "Doom Splicer", "Soul Reaper", "Grandfather", "Doomcalibur", "Desolation Sword"];
                var currentTier = Math.floor((currentDamage - 10) / 10);
                var nextTier = currentTier + 1;
                var nextName = weaponNames[nextTier] || ("Godly Blade +" + nextTier);
                state.weapon.damage += 10;
                state.weapon.name = nextName;
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
                            var expectedPoints = (state.level - 1) * 5;
                            var usedPoints = Math.max(0, (state.vit - base.vit) + (state.agi - base.agi) + (state.int - base.int) + (state.pow - base.pow) + (state.mag - base.mag));
                            var rightfulPoints = Math.max(0, expectedPoints - usedPoints);
                            if (typeof state.pointsToDistribute === 'undefined' || state.pointsToDistribute < rightfulPoints) {
                                state.pointsToDistribute = rightfulPoints;
                            }

                            state.xpRequired = calculateXpRequired(state.level);
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

                    var expectedPoints = (state.level - 1) * 5;
                    var usedPoints = (state.vit - 1) + (state.agi - 1) + (state.int - 1) + (state.pow - 1) + (state.mag - 1);
                    var rightfulPoints = Math.max(0, expectedPoints - usedPoints);
                    if (typeof state.pointsToDistribute === 'undefined' || state.pointsToDistribute < rightfulPoints) {
                        state.pointsToDistribute = rightfulPoints;
                    }

                    state.xpRequired = calculateXpRequired(state.level);
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
            
            var expectedPoints = (state.level - 1) * 5;
            var usedPoints = (state.vit - 1) + (state.agi - 1) + (state.int - 1) + (state.pow - 1) + (state.mag - 1);
            var rightfulPoints = Math.max(0, expectedPoints - usedPoints);
            if (state.pointsToDistribute < rightfulPoints) {
                state.pointsToDistribute = rightfulPoints;
            }
            
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
            
            var expectedPoints = (state.level - 1) * 5;
            var usedPoints = (state.vit - 1) + (state.agi - 1) + (state.int - 1) + (state.pow - 1) + (state.mag - 1);
            var rightfulPoints = Math.max(0, expectedPoints - usedPoints);
            if (typeof state.pointsToDistribute === 'undefined' || state.pointsToDistribute < rightfulPoints) {
                state.pointsToDistribute = rightfulPoints;
            }
            
            state.xpRequired = calculateXpRequired(state.level);
            updateIntegrityHash();
            this.saveLocalStorage();
            if (typeof RenderRPGStatusDrawer === "function") { RenderRPGStatusDrawer(); }
        },

        getDeSoMetadataString: function() {
            return " [RPG Level: " + state.level + " | VIT: " + state.vit + " | AGI: " + state.agi + " | INT: " + state.int + " | POW: " + state.pow + " | MAG: " + state.mag + " | CharID: " + state.characterId.substring(0,8) + "...]";
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
        window.AddInventoryItem(item.id, item.name, item.icon, item.description, item.count || 1);
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
