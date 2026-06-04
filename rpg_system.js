/**
 * ==========================================
 * Danger Ghost ARPG - Sistema de Atributos e Progresso
 * Concepção e Arquitetura por Senior RPG Designer (30+ Anos de Experiência)
 * ==========================================
 */
var GhostRPG = (function() {
    var BASE_XP = 100;
    var XP_EXPONENT = 1.6;

    // Configurações e Estado Inicial do RPG (Criptografado / Shadowed)
    var state = {
        level: 1,
        xp: 0,
        xpRequired: 100,
        pointsToDistribute: 0,
        vit: 1, // Vitalidade: Vida e Resistência Passiva
        agi: 1, // Agilidade: Velocidade e Altura do Pulo
        int: 1, // Inteligência: Regeneração e Duração do Ghost Mode
        pow: 1, // Poder: Dano causado ao pular no Boss
        mag: 1, // Magic: Aumenta a Mana máxima
        characterId: "" // Identificador único do Fantasma DeSo
    };

    // Assinatura de integridade (Anti-Cheat)
    var rpgAntiCheat = {
        salt: Math.random().toString(36).substring(2, 15),
        hash: ""
    };

    function updateIntegrityHash() {
        var dataStr = [
            state.level, state.xp, state.vit, state.agi, state.int, state.pow, state.mag, state.pointsToDistribute, state.characterId
        ].join("-");
        rpgAntiCheat.hash = btoa(dataStr + rpgAntiCheat.salt);
    }

    function verifyIntegrity() {
        var dataStr = [
            state.level, state.xp, state.vit, state.agi, state.int, state.pow, state.mag, state.pointsToDistribute, state.characterId
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
            if (!verifyIntegrity()) {
                console.warn("⚠️ RPG Integrity Compromised! Resetting to safe values.");
                this.resetStats();
            }
            return state;
        },

        resetStats: function() {
            state = { level: 1, xp: 0, xpRequired: 100, pointsToDistribute: 0, vit: 1, agi: 1, int: 1, pow: 1, mag: 1, characterId: "" };
            updateIntegrityHash();
            this.saveLocalStorage();
        },

        addXp: function(amount) {
            if (!verifyIntegrity()) return;
            
            state.xp += amount;
            var leveledUp = false;

            while (state.xp >= state.xpRequired) {
                state.xp -= state.xpRequired;
                state.level++;
                state.pointsToDistribute += 5; // 5 pontos por nível
                state.xpRequired = calculateXpRequired(state.level);
                leveledUp = true;
            }

            updateIntegrityHash();
            this.saveLocalStorage();

            if (leveledUp) {
                this.triggerLevelUpEffect();
            }

            if (typeof RenderRPGStatusDrawer === "function") {
                RenderRPGStatusDrawer();
            }
        },

        allocateAttribute: function(attributeName) {
            if (!verifyIntegrity()) return false;
            if (state.pointsToDistribute <= 0) return false;

            var attr = attributeName.toLowerCase();
            if (state.hasOwnProperty(attr) && attr !== 'level' && attr !== 'xp' && attr !== 'xprequired' && attr !== 'pointstodistribute' && attr !== 'characterid') {
                state[attr]++;
                state.pointsToDistribute--;
                updateIntegrityHash();
                this.saveLocalStorage();
                return true;
            }
            return false;
        },

        triggerLevelUpEffect: function() {
            if (typeof DeSoGhost !== "undefined") {
                DeSoGhost.isLevelingUpAnim = 60; // 60 frames (2s) de animação visual
            }
            if (typeof AddScore === "function") {
                AddScore(state.level * 200); // Bônus de score no Level Up
            }
        },

        getModifiedSpeed: function(baseSpeed) {
            // AGI aumenta velocidade física (+4% por ponto, teto de +40% para estabilidade)
            var bonus = Math.min(state.agi * 0.04, 0.40);
            return baseSpeed * (1 + bonus);
        },

        getModifiedJumpAcceleration: function(baseAcc) {
            // AGI melhora a aceleração de impulsão vertical (+1.5% por ponto, teto de 15%)
            var bonus = Math.min(state.agi * 0.015, 0.15);
            return baseAcc.map(function(val) {
                return val * (1 + bonus);
            });
        },

        getGhostDurationMultiplier: function() {
            // INT aumenta tempo total de tangibilidade (+10% por ponto)
            return 1 + (state.int * 0.10);
        },

        getBossJumpDamage: function() {
            // POW aumenta o dano causado à cabeça do boss
            return 1 + Math.floor(state.pow / 3);
        },

        getMaxLivesBonus: function() {
            // VIT adiciona vidas máximas passivas (1 vida a cada 5 pontos de VIT)
            return Math.floor(state.vit / 5);
        },

        getMaxMana: function() {
            // Cada ponto de MAG (Magic) aumenta a mana máxima (+20 de mana)
            if (!verifyIntegrity()) return 100;
            return 100 + (state.mag * 20);
        },

        saveLocalStorage: function() {
            try {
                var dataToSave = JSON.stringify(state);
                var encrypted = btoa(dataToSave + "||" + rpgAntiCheat.hash);
                localStorage.setItem("DangerGhost_RPG_Save", encrypted);
            } catch(e) {
                // Silencioso ou log
            }
        },

        loadLocalStorage: function() {
            try {
                var saved = localStorage.getItem("DangerGhost_RPG_Save");
                if (saved) {
                    var decrypted = atob(saved);
                    var parts = decrypted.split("||");
                    var data = JSON.parse(parts[0]);
                    
                    state = data;
                    state.xpRequired = calculateXpRequired(state.level);
                    updateIntegrityHash();
                }
            } catch(e) {
                this.resetStats();
            }
        },

        loadBlockchainState: function(lvl, vit, agi, int, pow, characterId, xp, pointsToDistribute, mag) {
            state.level = lvl;
            state.vit = vit;
            state.agi = agi;
            state.int = int;
            state.pow = pow;
            state.mag = typeof mag !== "undefined" ? mag : 1;
            state.characterId = characterId || "";
            state.xp = typeof xp !== "undefined" ? xp : 0;
            state.pointsToDistribute = typeof pointsToDistribute !== "undefined" ? pointsToDistribute : 0;
            state.xpRequired = calculateXpRequired(state.level);
            updateIntegrityHash();
            this.saveLocalStorage();
            if (typeof RenderRPGStatusDrawer === "function") {
                RenderRPGStatusDrawer();
            }
        },

        getDeSoMetadataString: function() {
            return " [RPG Level: " + state.level + " | VIT: " + state.vit + " | AGI: " + state.agi + " | INT: " + state.int + " | POW: " + state.pow + " | MAG: " + state.mag + " | CharID: " + state.characterId.substring(0,8) + "...]";
        }
    };
})();

// Inicializa o RPG local na carga do Script
GhostRPG.init();

// Status Drawer de Atributos RPG Integrado
function RenderRPGStatusDrawer() {
    var stats = GhostRPG.getStats();
    var panelContent = document.getElementById("rpgPanelContent") || document.getElementById("navbarPanelContent");
    if (!panelContent) return;

    var apHTML = "";
    if (stats.pointsToDistribute > 0) {
        apHTML = "<div style='color:#00FF00; font-weight:bold; text-align:center; margin-bottom: 12px; text-shadow: 0 0 5px #00FF00;'>" +
                 "⚡ " + stats.pointsToDistribute + " POINTS AVAILABLE!</div>";
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

    panelContent.innerHTML = 
        "<h3 style='margin: 0 0 12px 0; color: #00FF00; text-align: center; letter-spacing: 2px;'>🛡️ HERO STATUS</h3>" +
        apHTML +
        "<div style='display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: #FFF;'>" +
        "<div><b>LEVEL:</b> <span style='color:#00FFFF;'>" + stats.level + "</span></div>" +
        "<div><b>XP:</b> <span style='color:#00FFFF;'>" + stats.xp + " / " + stats.xpRequired + "</span></div>" +
        "<hr style='border-color: rgba(255,255,255,0.2); margin: 5px 0;'>" +
        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>❤️ <b>VIT:</b> " + stats.vit + "</span>" + makeButton('vit') + "</div>" +
        "<div style='font-size:10px; color:#888; margin-top:-6px;'>Increases max passive lives.</div>" +
        
        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>⚡ <b>AGI:</b> " + stats.agi + "</span>" + makeButton('agi') + "</div>" +
        "<div style='font-size:10px; color:#888; margin-top:-6px;'>Increases speed and acceleration.</div>" +
        
        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>🔮 <b>INT:</b> " + stats.int + "</span>" + makeButton('int') + "</div>" +
        "<div style='font-size:10px; color:#888; margin-top:-6px;'>Increases mana regeneration.</div>" +
        
        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>⚔️ <b>POW:</b> " + stats.pow + "</span>" + makeButton('pow') + "</div>" +
        "<div style='font-size:10px; color:#888; margin-top:-6px;'>Increases jump damage to bosses.</div>" +

        "<div style='display:flex; justify-content:space-between; align-items:center;'><span>🌀 <b>MAG:</b> " + stats.mag + "</span>" + makeButton('mag') + "</div>" +
        "<div style='font-size:10px; color:#888; margin-top:-6px;'>Increases maximum mana capacity.</div>" +
        "</div>" +
        saveButtonHTML;
}

// Exposição global segura para clicks do DOM
window.GhostRPG = GhostRPG;
window.RenderRPGStatusDrawer = RenderRPGStatusDrawer;
