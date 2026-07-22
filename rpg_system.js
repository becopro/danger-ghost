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

    return {
        init: function() { 
            this.loadLocalStorage(); 
            updateIntegrityHash(); 
        },
        getStats: function() {
            if (!verifyIntegrity()) { this.resetStats(); }
            
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
            statsCopy.worldLevel = typeof window.g_currentLevel !== 'undefined' ? window.g_currentLevel : 1;
            
            return statsCopy;
        },
        resetStats: function(newCharId) {
            var currCharId = newCharId || state.characterId || "";
            var oldInventory = state.inventory || [];
            var oldEquipment = state.equipment || { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
            if (oldEquipment.helmet || oldEquipment.spell) {
                oldEquipment = { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
            }
            state = { 
                level: 1, xp: 0, xpRequired: 100, pointsToDistribute: 0, vit: 1, agi: 1, int: 1, pow: 1, mag: 1, characterId: currCharId,
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
            while (state.xp >= state.xpRequired && state.level < maxLevel && loopSafeLevel++ < 1000) {
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
                if (window.g_socket && window.g_socket.connected && window.cloudSave) {
                    window.g_socket.emit('save_game_state', state);
                }

                if (state.characterId && state.characterId !== 0 && state.characterId !== "0") {
                    var targetCharId = "ghost_" + state.characterId.toString().padStart(3, '0');
                    var rawChars = localStorage.getItem("dg_local_characters");
                    var localChars = rawChars ? JSON.parse(rawChars) : [];
                    
                    var stateToSave = JSON.parse(JSON.stringify(state));
                    stateToSave.characterId = targetCharId;
                    
                    var existingIndex = localChars.findIndex(function(c) { return c.characterId === targetCharId; });
                    if (existingIndex >= 0) {
                        localChars[existingIndex] = stateToSave;
                    } else {
                        localChars.push(stateToSave);
                    }
                    localStorage.setItem("dg_local_characters", JSON.stringify(localChars));
                } else {
                    var dataToSave = JSON.stringify(state);
                    var encrypted = (window.SafeBtoa || btoa)(dataToSave + "||" + rpgAntiCheat.hash);
                    localStorage.setItem("DangerGhost_RPG_Save", encrypted);
                }
            } catch (e) { console.error("Save falhou", e); }
        },
        loadLocalStorage: function(forceCharId) {
            try {
                if (window.cloudSave) {
                    return this.applyCloudSave(window.cloudSave);
                }
                
                var charToLoad = forceCharId || state.characterId;
                var isGhost = charToLoad && charToLoad !== 0 && charToLoad !== "0";
                
                if (isGhost) {
                    var targetCharId = "ghost_" + charToLoad.toString().padStart(3, '0');
                    var rawChars = localStorage.getItem("dg_local_characters");
                    if (rawChars) {
                        var localChars = JSON.parse(rawChars);
                        var foundChar = localChars.find(function(c) { return c.characterId === targetCharId; });
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
                            if (!state.equipment || typeof state.equipment.helmet !== 'undefined' || typeof state.equipment.spell !== 'undefined') {
                                state.equipment = { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
                            } else {
                                var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
                                slots.forEach(function(s) {
                                    if (typeof state.equipment[s] === 'undefined') state.equipment[s] = null;
                                });
                            }
                            if (typeof state.deaths === 'undefined') state.deaths = 0;
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
                    
                    if (!state.equipment || typeof state.equipment.helmet !== 'undefined' || typeof state.equipment.spell !== 'undefined') {
                        state.equipment = { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
                    } else {
                        var slots = ['head', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2', 'amulet'];
                        slots.forEach(function(s) {
                            if (typeof state.equipment[s] === 'undefined') state.equipment[s] = null;
                        });
                    }
                    
                    if (charToLoad) state.characterId = charToLoad;
                    if (typeof state.deaths === 'undefined') state.deaths = 0;
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
                state.name = cloudData.name || "Ghost";
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

        loadBlockchainState: function(lvl, vit, agi, int, pow, characterId, xp, pointsToDistribute, mag, equippedSkills, equippedRunes, equippedPassives, weapon, inventory, equipment) {
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
            
            var parsedXp = parseInt(xp, 10);
            state.xp = (!isNaN(parsedXp)) ? parsedXp : 0;
            
            if (state.level >= maxLevel) {
                state.xp = 0;
            }
            
            var parsedPoints = parseInt(pointsToDistribute, 10);
            state.pointsToDistribute = (!isNaN(parsedPoints)) ? parsedPoints : 0;
            
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
            if (Array.isArray(serverState.inventory)) state.inventory = serverState.inventory;
            if (serverState.equipment) state.equipment = serverState.equipment;
            
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
            
            var isStackable = (item.id === "ghost_spell" || item.id === "deso_coin" || item.id === "blue_key" || !item.quality || item.quality === "Common");
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
window.GetEquipmentState = function() {
    return GhostRPG.getEquipment();
};
