var GhostRPG = (function() {
    var BASE_XP = 100;
    var XP_EXPONENT = 1.6;

    var state = {
        level: 1, xp: 0, xpRequired: 100, pointsToDistribute: 0,
        vit: 1, agi: 1, int: 1, pow: 1, mag: 1, characterId: "",
        equippedSkills: [0, 1, 2, 3],
        equippedRunes: [0, 0, 0, 0],
        equippedPassives: [-1, -1],
        weapon: { name: 'Starter Dirk', damage: 10 }
    };

    var rpgAntiCheat = {
        salt: Math.random().toString(36).substring(2, 15),
        hash: ""
    };

    function updateIntegrityHash() {
        var dataStr = [
            state.level, state.xp, state.vit, state.agi, state.int, state.pow, state.mag, state.pointsToDistribute, state.characterId,
            state.equippedSkills.join(","), state.equippedRunes.join(","), state.equippedPassives.join(","),
            state.weapon.name, state.weapon.damage
        ].join("-");
        rpgAntiCheat.hash = btoa(dataStr + rpgAntiCheat.salt);
    }

    function verifyIntegrity() {
        var dataStr = [
            state.level, state.xp, state.vit, state.agi, state.int, state.pow, state.mag, state.pointsToDistribute, state.characterId,
            state.equippedSkills.join(","), state.equippedRunes.join(","), state.equippedPassives.join(","),
            state.weapon.name, state.weapon.damage
        ].join("-");
        return btoa(dataStr + rpgAntiCheat.salt) === rpgAntiCheat.hash;
    }

    function calculateXpRequired(lvl) {
        return Math.floor(BASE_XP * Math.pow(lvl, XP_EXPONENT));
    }

    return {
        init: function() { this.loadLocalStorage(); updateIntegrityHash(); },
        getStats: function() {
            if (!verifyIntegrity()) { this.resetStats(); }
            return state;
        },
        resetStats: function() {
            state = { 
                level: 1, xp: 0, xpRequired: 100, pointsToDistribute: 0, vit: 1, agi: 1, int: 1, pow: 1, mag: 1, characterId: "",
                equippedSkills: [0, 1, 2, 3], equippedRunes: [0, 0, 0, 0], equippedPassives: [-1, -1],
                weapon: { name: 'Starter Dirk', damage: 10 }
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
            while (state.xp >= state.xpRequired && state.level < maxLevel) {
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
            if (typeof AddScore === "function") { AddScore(state.level * 200); }
        },
        getModifiedSpeed: function(baseSpeed) {
            var bonus = Math.min(state.agi * 0.04, 0.40);
            return baseSpeed * (1 + bonus);
        },
        getModifiedJumpAcceleration: function(baseAcc) {
            var bonus = Math.min(state.agi * 0.015, 0.15);
            return baseAcc.map(function(val) { return val * (1 + bonus); });
        },
        getGhostDurationMultiplier: function() { return 1 + (state.int * 0.10); },
        getBossJumpDamage: function() { return 1 + Math.floor(state.pow / 3); },
        getMaxLivesBonus: function() { return Math.floor(state.vit / 5); },
        getMaxLivesCap: function() {
            if (!verifyIntegrity()) return 5;
            return 4 + state.vit;
        },
        getMaxMana: function() {
            if (!verifyIntegrity()) return 100;
            return 100 + (state.mag * 20);
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
                var dataToSave = JSON.stringify(state);
                var encrypted = btoa(dataToSave + "||" + rpgAntiCheat.hash);
                localStorage.setItem("DangerGhost_RPG_Save", encrypted);
            } catch(e) {}
        },
        loadLocalStorage: function() {
            try {
                var saved = localStorage.getItem("DangerGhost_RPG_Save");
                if (saved) {
                    var decrypted = atob(saved);
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
                    state.xpRequired = calculateXpRequired(state.level);
                    updateIntegrityHash();
                }
            } catch(e) { this.resetStats(); }
        },
        loadBlockchainState: function(lvl, vit, agi, int, pow, characterId, xp, pointsToDistribute, mag, equippedSkills, equippedRunes, equippedPassives, weapon) {
            var maxLevel = 100000000000;
            state.level = Math.min(lvl, maxLevel);
            state.vit = vit; state.agi = agi; state.int = int; state.pow = pow;
            state.mag = typeof mag !== "undefined" ? mag : 1; state.characterId = characterId || "";
            state.xp = typeof xp !== "undefined" ? xp : 0;
            if (state.level >= maxLevel) {
                state.xp = 0;
            }
            state.pointsToDistribute = typeof pointsToDistribute !== "undefined" ? pointsToDistribute : 0;
            state.xpRequired = calculateXpRequired(state.level);
            state.equippedSkills = equippedSkills || [0, 1, 2, 3];
            state.equippedRunes = equippedRunes || [0, 0, 0, 0];
            state.equippedPassives = equippedPassives || [-1, -1];
            state.weapon = weapon || { name: 'Starter Dirk', damage: 10 };
            updateIntegrityHash(); this.saveLocalStorage();
            if (typeof RenderRPGStatusDrawer === "function") { RenderRPGStatusDrawer(); }
        },
        getDeSoMetadataString: function() {
            return " [RPG Level: " + state.level + " | VIT: " + state.vit + " | AGI: " + state.agi + " | INT: " + state.int + " | POW: " + state.pow + " | MAG: " + state.mag + " | CharID: " + state.characterId.substring(0,8) + "...]";
        }
    };
})();
GhostRPG.init();

function RenderRPGStatusDrawer() {
    var stats = GhostRPG.getStats();
    var panelContent = document.getElementById("rpgPanelContent") || document.getElementById("navbarPanelContent");
    if (!panelContent) return;

    var apHTML = "";
    if (stats.pointsToDistribute > 0) {
        apHTML = "<div style='color:#00FF00; font-weight:bold; text-align:center; margin-bottom: 12px; text-shadow: 0 0 5px #00FF00;'>⚡ " + stats.pointsToDistribute + " POINTS AVAILABLE!</div>";
    }

    function makeButton(attr) {
        if (stats.pointsToDistribute > 0) {
            return "<button onclick=\"GhostRPG.allocateAttribute('" + attr + "'); RenderRPGStatusDrawer();\" style='background:#00FF00; border:1px solid #FFF; color:#000; font-weight:bold; cursor:pointer; padding:2px 8px; border-radius:3px; font-family:\"Courier New\"; outline:none;'>+</button>";
        }
        return "";
    }

    var saveButtonHTML = "";
    if (typeof window.g_desoPublicKey !== "undefined" && window.g_desoPublicKey) {
        if (stats.characterId) {
            saveButtonHTML = "<button id='rpgSaveBtn' onclick='window.TriggerRPGSaveToDeSo()' style='width:100%; margin-top:10px; padding:6px; background:#00FF00; color:#000; font-weight:bold; border:none; cursor:pointer; border-radius:3px; font-family:\"Courier New\"; outline:none;'>SAVE EVOLUTION (BLOCKCHAIN)</button>";
        } else {
            saveButtonHTML = "<button onclick='window.LoadRPGStateFromDeSo(window.g_desoPublicKey)' style='width:100%; margin-top:10px; padding:6px; background:#00FFFF; color:#000; font-weight:bold; border:none; cursor:pointer; border-radius:3px; font-family:\"Courier New\"; outline:none;'>SELECT GHOST</button>";
        }
    } else {
        saveButtonHTML = "<button onclick='window.LoginDeSo()' style='width:100%; margin-top:10px; padding:6px; background:#444; color:#AAA; font-weight:bold; border:1px dashed #AAA; cursor:pointer; border-radius:3px; font-family:\"Courier New\"; outline:none;'>CONNECT DESO WALLET</button>";
    }

    var currentWeapon = stats.weapon || { name: 'Starter Dirk', damage: 10 };
    var currentDamage = currentWeapon.damage;
    var currentTier = Math.floor((currentDamage - 10) / 10);
    var upgradeCost = currentDamage * 100;
    var weaponNames = ["Starter Dirk", "Shadow Dirk", "Ghostblade", "Doom Splicer", "Soul Reaper", "Grandfather", "Doomcalibur", "Desolation Sword"];
    var nextName = weaponNames[currentTier + 1] || ("Godly Blade +" + (currentTier + 1));
    
    var economyHTML = 
        "<hr style='border-color: rgba(255,255,255,0.2); margin: 8px 0;'>" +
        "<div style='font-size: 13px; color: #FFF;'>" +
        "<div>⚔️ <b>WEAPON:</b> <span style='color:#FFD700;'>" + currentWeapon.name + "</span></div>" +
        "<div><b>DAMAGE:</b> <span style='color:#FFD700;'>" + currentDamage + "</span></div>" +
        "<button onclick=\"if(GhostRPG.upgradeWeapon()) { RenderRPGStatusDrawer(); } else { alert('Insufficient Score or Cheat Detected!'); }\" style='width:100%; margin-top:6px; padding:4px; background:#FFD700; color:#000; font-weight:bold; border:none; cursor:pointer; border-radius:3px; font-family:\"Courier New\"; font-size:11px;'>UPGRADE TO " + nextName.toUpperCase() + " (" + upgradeCost + " PTS)</button>" +
        "</div>";

    var skillsList = [
        { id: 0, name: "Spectral Spark (V)" }, { id: 1, name: "Ghost Mode (F)" },
        { id: 2, name: "Plasma Orb (E)" }, { id: 3, name: "Phantom Form (R)" }
    ];
    var runesList = [
        { id: 0, name: "None (Arc)" }, { id: 1, name: "Fire" }, { id: 2, name: "Cold" },
        { id: 3, name: "Lightning" }, { id: 4, name: "Poison" }, { id: 5, name: "Arcane" }
    ];

    var slotNames = ["V", "F", "E", "R"];
    var customizationHTML = 
        "<hr style='border-color: rgba(255,255,255,0.2); margin: 8px 0;'>" +
        "<h4 style='color: #00FF00; margin: 0 0 6px 0; text-align: center; font-size: 12px; letter-spacing: 1px;'>🔮 ACTIVE SKILLS & RUNES</h4>" +
        "<div style='display:flex; flex-direction:column; gap:8px;'>";
    
    for (var i = 0; i < 4; i++) {
        var activeSkill = stats.equippedSkills[i];
        var activeRune = stats.equippedRunes[i];
        var skillSelect = "<select onchange='GhostRPG.setSkill(" + i + ", this.value); RenderRPGStatusDrawer();' style='background:#222; color:#FFF; border:1px solid #555; font-family:\"Courier New\"; font-size:10px; padding:1px; width:100px;'>";
        for (var s = 0; s < skillsList.length; s++) {
            skillSelect += "<option value='" + skillsList[s].id + "' " + (skillsList[s].id === activeSkill ? "selected" : "") + ">" + skillsList[s].name + "</option>";
        }
        skillSelect += "</select>";

        var runeSelect = "<select onchange='GhostRPG.setRune(" + i + ", this.value); RenderRPGStatusDrawer();' style='background:#222; color:#FFF; border:1px solid #555; font-family:\"Courier New\"; font-size:10px; padding:1px; width:70px;'>";
        for (var r = 0; r < runesList.length; r++) {
            runeSelect += "<option value='" + runesList[r].id + "' " + (runesList[r].id === activeRune ? "selected" : "") + ">" + runesList[r].name + "</option>";
        }
        runeSelect += "</select>";

        customizationHTML += "<div style='display:flex; justify-content:space-between; align-items:center; font-size:11px;'>" +
                             "<span><b>[" + slotNames[i] + "]</b></span>" +
                             "<div style='display:flex; gap:3px;'>" + skillSelect + runeSelect + "</div>" +
                             "</div>";
    }
    customizationHTML += "</div>";

    panelContent.innerHTML = 
        "<h3 style='margin: 0 0 12px 0; color: #00FF00; text-align: center; letter-spacing: 2px;'>🛡️ HERO STATUS</h3>" +
        apHTML +
        "<div style='display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: #FFF;'>" +
        "<div><b>LEVEL:</b> <span style='color:#00FFFF;'>" + stats.level + "</span></div>" +
        "<div><b>XP:</b> <span style='color:#00FFFF;'>" + stats.xp + " / " + stats.xpRequired + "</span></div>" +
        "<hr style='border-color: rgba(255,255,255,0.2); margin: 5px 0;'>" +
        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>❤️ <b>VIT:</b> " + stats.vit + "</span>" + makeButton('vit') + "</div>" +
        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>⚡ <b>AGI:</b> " + stats.agi + "</span>" + makeButton('agi') + "</div>" +
        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>🔮 <b>INT:</b> " + stats.int + "</span>" + makeButton('int') + "</div>" +
        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>⚔️ <b>POW:</b> " + stats.pow + "</span>" + makeButton('pow') + "</div>" +
        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>🌀 <b>MAG:</b> " + stats.mag + "</span>" + makeButton('mag') + "</div>" +
        "</div>" +
        economyHTML +
        customizationHTML +
        saveButtonHTML;
}

window.GhostRPG = GhostRPG;
window.RenderRPGStatusDrawer = RenderRPGStatusDrawer;
