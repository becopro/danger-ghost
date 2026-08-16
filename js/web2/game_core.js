(function() {
    var characterGhostBase = new Image();
    characterGhostBase.src = 'assets/sprites/character_ghost_base.webp';

    // Globals
    window.g_desoPublicKey = null;
    window.g_ownedCharacters = [];
    window.g_desoCharactersLoading = false;
    window.g_desoLastPostHashHex = null;
    window.g_desoPendingTransactionType = null;
    window.g_isEvolvedMintActive = false;

    // Overwrite CheckVIPStatus to bypass network requests in Web2 mode
    window.CheckVIPStatus = async function(pubKey) {
        window.g_hasCreatorCoin = true;
        console.log("[Web2 Mock] VIP Access Granted locally!");
    };

    // Load local public key to simulate wallet login
    try {
        var savedKey = localStorage.getItem("dg_deso_public_key");
        if (savedKey) {
            window.g_desoPublicKey = savedKey;
        }
    } catch(e) {}

    // Mock Login
    function SavePlayerName(event) {
        var nameInput = document.getElementById("startNameInput");
        if (nameInput) {
            var chosenName = nameInput.value.trim();
            if (chosenName !== "") {
                localStorage.setItem("playerName", chosenName);
                if (event && event.target) {
                    var btn = event.target;
                    var oldText = btn.innerText;
                    btn.innerText = "SAVED!";
                    btn.style.backgroundColor = "#00FFCC";
                    btn.style.color = "#000";
                    setTimeout(function() {
                        btn.innerText = oldText;
                        btn.style.backgroundColor = "#000";
                        btn.style.color = "#00FFCC";
                    }, 1000);
                }
            }
        }
    }
    window.SavePlayerName = SavePlayerName;

    // TODO: Replace with your actual Firebase config
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    try {
        if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
            firebase.initializeApp(firebaseConfig);
        } else {
            console.warn("[Firebase] Config is missing, running in MOCK mode.");
        }
    } catch (e) {
        console.warn("[Firebase] Initialization skipped.");
    }

    function LoginGoogle() {
        var btn = document.getElementById("btnNavLogin");
        var nameInput = document.getElementById("startNameInput");
        
        if (nameInput) {
            var chosenName = nameInput.value.trim();
            if (chosenName !== "") {
                localStorage.setItem("playerName", chosenName);
            }
        }
        
        if (btn) {
            btn.innerText = "CONNECTING...";
            btn.disabled = true;
        }

        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).then((result) => {
                return result.user.getIdToken();
            }).then((idToken) => {
                var menu = document.getElementById("loginButtonsContainer");
                if (menu) menu.style.display = "none";
                
                localStorage.setItem("google_token", idToken);
                
                if (window.JoinGameServer) {
                    window.JoinGameServer(idToken);
                }
            }).catch((error) => {
                console.error("Firebase Login Error", error);
                if (btn) {
                    btn.innerText = "🔑 LOGIN";
                    btn.disabled = false;
                }
                alert("Erro no login: " + error.message);
            });
        } else {
            console.warn("Using Mock Login fallback (Firebase disabled/unconfigured)!");
            setTimeout(function() {
                var menu = document.getElementById("loginButtonsContainer");
                if (menu) menu.style.display = "none";
                
                var mockToken = "mock_" + (localStorage.getItem("playerName") || "user");
                localStorage.setItem("google_token", mockToken);
                
                if (window.JoinGameServer) {
                    window.JoinGameServer(mockToken);
                }
            }, 800);
        }
    }
    window.LoginGoogle = LoginGoogle;

    // Mock Post
    function PostToDeSo() {
        console.log("[Web2 Mock] PostToDeSo called");
        alert("[Web2 Mode] Social posting is disabled.");
    }
    window.PostToDeSo = PostToDeSo;

    // Mock Save
    function TriggerRPGSaveToDeSo() {
        var btn = document.getElementById("rpgSaveBtn") || document.getElementById("btnNavSave");
        if (btn) {
            btn.innerText = "SAVING...";
            btn.disabled = true;
        }
        
        setTimeout(function() {
            try {
                if (window.GhostRPG && window.GhostRPG.getStats) {
                    var stats = window.GhostRPG.getStats();
                    stats.score = window.g_score;
                    stats.time = window.g_globalTotalTime;
                    
                    if (typeof window.g_currentLevel !== 'undefined') {
                        localStorage.setItem("dg_saved_level", window.g_currentLevel);
                    }
                    var localChars = [];
                    var raw = localStorage.getItem("dg_local_characters");
                    if (raw) localChars = JSON.parse(raw);
                    
                    var charIdx = localChars.findIndex(function(c) { return c.characterId === stats.characterId; });
                    if (charIdx !== -1) {
                        localChars[charIdx] = Object.assign({}, localChars[charIdx], stats);
                    } else {
                        localChars.push(stats);
                    }
                    localStorage.setItem("dg_local_characters", JSON.stringify(localChars));
                    window.g_ownedCharacters = localChars;
                }
                alert("🎉 SUCCESS! Progress saved locally.");
            } catch(e) {
                console.error(e);
                alert("Error saving game: " + e.message);
            }
            if (btn) {
                btn.innerText = "SAVE GAME";
                btn.disabled = false;
            }
        }, 500);
    }
    window.TriggerRPGSaveToDeSo = TriggerRPGSaveToDeSo;

    window.OpenNewGhostModal = function() {
        var localChars = [];
        try {
            var raw = localStorage.getItem("dg_local_characters");
            if (raw) localChars = JSON.parse(raw);
        } catch(e) {}
        
        if (localChars.length >= 5) {
            alert("Maximum of 5 Ghosts reached. Delete an existing Ghost to create a new one.");
            return;
        }
        
        var modal = document.getElementById("newGhostModal");
        if (modal) modal.style.display = "flex";
    };

    window.CloseNewGhostModal = function() {
        var modal = document.getElementById("newGhostModal");
        if (modal) modal.style.display = "none";
    };

    // Mock Character Creation (Local Generation)
    async function TriggerCreateNewGhost() {
        var btn = document.getElementById("confirmForgeBtn");
        var status = document.getElementById("selectionStatusText");
        var nameInput = document.getElementById("newGhostNameInput");
        
        var ghostName = nameInput && nameInput.value.trim() !== "" ? nameInput.value.trim() : "Ghost";

        if (btn) btn.disabled = true;
        if (status) status.innerText = "Forging a new Ghost locally...";

        var g_characterCreationId = "dg_local_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        
        var soulEssence = 0;
        try { soulEssence = parseInt(localStorage.getItem("dg_soul_essence")) || 0; } catch(e) {}
        var isEvolvedMint = false;
        
        if (soulEssence >= 100) {
            isEvolvedMint = true;
            try { localStorage.setItem("dg_soul_essence", (soulEssence - 100).toString()); } catch(e) {}
        }

        // Random stats generation
        var baseStats = [1, 1, 1, 1, 1];
        var pointsToDistribute = 5;
        for (var i = 0; i < pointsToDistribute; i++) {
            var randIndex = Math.floor(Math.random() * 5);
            baseStats[randIndex]++;
        }

        if (isEvolvedMint) {
            for (var i = 0; i < 5; i++) baseStats[i] += 2;
        }

        var defaultStats = {
            name: ghostName,
            level: isEvolvedMint ? 5 : 1,
            xp: 0,
            xpRequired: 100,
            vit: baseStats[0],
            agi: baseStats[1],
            int: baseStats[2],
            pow: baseStats[3],
            mag: baseStats[4],
            characterId: g_characterCreationId,
            score: 0,
            time: 0,
            worldLevel: 1,
            equippedSkills: [0, 1, 2, 3],
            equippedRunes: [0, 0, 0, 0],
            equippedPassives: [-1, -1],
            weapon: { name: 'Starter Dirk', damage: 10 },
            inventory: [],
            equipment: { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null }
        };

        RenderCharacterNFTBlob(defaultStats, function(blob) {
            var reader = new FileReader();
            reader.readAsDataURL(blob); 
            reader.onloadend = function() {
                var base64data = reader.result;                
                defaultStats.imageUrl = base64data;
                
                var localChars = [];
                var raw = localStorage.getItem("dg_local_characters");
                if (raw) localChars = JSON.parse(raw);
                
                localChars.push(defaultStats);
                localStorage.setItem("dg_local_characters", JSON.stringify(localChars));
                window.g_ownedCharacters = localChars;

                if (status) status.innerText = "Ghost forged successfully!";
                if (btn) btn.disabled = false;
                
                if (nameInput) nameInput.value = "";
                CloseNewGhostModal();
                DisplayCharacterSelectionScreen(window.g_ownedCharacters);
            };
        });
    }
    window.TriggerCreateNewGhost = TriggerCreateNewGhost;

    // Load Local Characters
    async function LoadRPGStateFromDeSo(publicKey, forceShowOverlay) {
        if (window.g_desoCharactersLoading) return;
        window.g_desoCharactersLoading = true;
        
        var status = document.getElementById("selectionStatusText");
        if (status) status.innerText = "Loading local Ghosts...";

        setTimeout(function() {
            var localChars = [];
            try {
                var raw = localStorage.getItem("dg_local_characters");
                if (raw) localChars = JSON.parse(raw);
            } catch(e) {}

            window.g_ownedCharacters = localChars;
            window.g_desoCharactersLoading = false;
            if (status) status.innerText = "";

            var autoSelected = false;
            if (!forceShowOverlay && localChars.length > 0) {
                try {
                    var savedCharId = localStorage.getItem('dg_deso_character_id');
                    if (!savedCharId) savedCharId = localChars[0].characterId; // Auto-pick first if none selected
                    if (savedCharId) {
                        var savedChar = localChars.find(function(c) { return c.characterId === savedCharId; });
                        if (savedChar) {
                            SelectCharacterToPlay(savedCharId);
                            autoSelected = true;
                        }
                    }
                } catch(e) {}
            }

            if (!autoSelected) {
                DisplayCharacterSelectionScreen(localChars);
            }
        }, 400);
    }
    window.LoadRPGStateFromDeSo = LoadRPGStateFromDeSo;

    // Mock NFT creation
    function CreateDeSoNFTForRPG(postHashHex, buttonId) {
        console.log("[Web2 Mock] CreateDeSoNFTForRPG called");
        var btn = document.getElementById("rpgSaveBtn") || document.getElementById("btnNavSave");
        if (btn) {
            btn.innerText = "NFT MINTED SUCCESSFULLY (LOCAL)";
            btn.style.background = "#00FFFF";
            btn.style.color = "#000";
            btn.disabled = true;
            setTimeout(function() {
                if (window.UpdateNavbarEquip) window.UpdateNavbarEquip();
            }, 2000);
        }
    }
    window.CreateDeSoNFTForRPG = CreateDeSoNFTForRPG;

    // Mock save with image
    function ExecuteDeSoRPGSaveWithImage(jwt, blob, saveObj) {
        console.log("[Web2 Mock] ExecuteDeSoRPGSaveWithImage called");
    }
    window.ExecuteDeSoRPGSaveWithImage = ExecuteDeSoRPGSaveWithImage;

    // Mock Character deletion
    function BurnGhostNFT(postHashHex) {
        var res = confirm("[Web2 Mode] Are you sure you want to delete this Ghost locally?");
        if (res) {
            var localChars = [];
            var raw = localStorage.getItem("dg_local_characters");
            if (raw) localChars = JSON.parse(raw);
            
            localChars = localChars.filter(function(c) { return c.characterId !== postHashHex; });
            localStorage.setItem("dg_local_characters", JSON.stringify(localChars));
            window.g_ownedCharacters = localChars;
            
            alert("Ghost deleted.");
            window.location.reload();
        }
    }
    window.BurnGhostNFT = BurnGhostNFT;

    // Render HTML Character Selection Cards
    function DisplayCharacterSelectionScreen(characters) {
        window.g_ownedCharacters = characters;
        var overlay = document.getElementById("characterSelectionOverlay");
        if (overlay) overlay.style.display = "block";

        var container = document.getElementById("characterCardsContainer");
        if (container) {
            container.innerHTML = "";

            var priceText = document.getElementById("newGhostPriceText");
            if (priceText) {
                priceText.innerHTML = "Forge a new unique Ghost card for free using local generator.";
            }

            if (characters.length === 0) {
                var defaultGhost = {
                    characterId: "001",
                    displayName: "Ghost #001",
                    level: 1, xp: 0, pointsToDistribute: 0,
                    vit: 1, agi: 1, int: 1, pow: 1, mag: 1,
                    equippedSkills: [0, 1, 2, 3], equippedRunes: [0, 0, 0, 0], equippedPassives: [-1, -1],
                    weapon: { name: 'Starter Dirk', damage: 10 }
                };
                characters.push(defaultGhost);
                window.g_ownedCharacters = characters;
                try { localStorage.setItem("dg_local_characters", JSON.stringify(characters)); } catch(e) {}
                
                // Unlock in Ghostdex safely, even if script isn't loaded yet
                try {
                    var p = JSON.parse(localStorage.getItem('ghostdex_progress') || '{}');
                    p["001"] = 2;
                    localStorage.setItem('ghostdex_progress', JSON.stringify(p));
                } catch(e) {}

                if (typeof window.UpdateGhostdex === 'function') {
                    window.UpdateGhostdex("001", 2);
                }
                // Auto-select, hide overlay
                if (typeof window.SelectCharacterToPlay === 'function') {
                    window.SelectCharacterToPlay("001");
                }
                return; // Don't show the selection overlay, ghost was auto-assigned
            }

            for (var i = 0; i < characters.length; i++) {
                var char = characters[i];
                
                // Unlock in Ghostdex safely, even if script isn't loaded yet
                try {
                    var p = JSON.parse(localStorage.getItem('ghostdex_progress') || '{}');
                    p[char.characterId] = 2;
                    localStorage.setItem('ghostdex_progress', JSON.stringify(p));
                } catch(e) {}

                // Unlock every owned character in the Ghostdex
                if (typeof window.UpdateGhostdex === 'function') {
                    window.UpdateGhostdex(char.characterId, 2);
                }

                var card = document.createElement("div");
                card.style.width = "230px";
                card.style.background = "#181224";
                card.style.border = "2px solid #FF00FF";
                card.style.borderRadius = "8px";
                card.style.padding = "15px";
                card.style.boxShadow = "0 0 10px rgba(255, 0, 255, 0.2)";
                card.style.display = "flex";
                card.style.flexDirection = "column";
                card.style.gap = "8px";
                card.style.textAlign = "left";

                var imgHTML = "";
                if (char.imageUrl) {
                    imgHTML = "<img src='" + char.imageUrl + "' style='width: 100%; height: 140px; object-fit: contain; background: #0a0810; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);' />";
                } else {
                    imgHTML = "<div style='width: 100%; height: 140px; background: #0a0810; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #555; border: 1px dashed rgba(255,255,255,0.1);'>No Image</div>";
                }

                var ghostDisplayName = char.name && char.name !== "Ghost" ? char.name : "GHOST #" + (i + 1);

                card.innerHTML = 
                    imgHTML +
                    "<div style='font-size: 14px; font-weight: bold; color: #00FF00;'>👻 " + escapeHTML(ghostDisplayName).toUpperCase() + "</div>" +
                    "<div style='font-size: 11px; color: #888;'>ID: " + char.characterId.substring(0, 12) + "...</div>" +
                    "<hr style='border-color: rgba(255,255,255,0.1); margin: 4px 0;' />" +
                    "<div style='font-size: 12px; color: #FFF; display: flex; flex-direction: column; gap: 3px;'>" +
                    "<div><b>Level:</b> <span style='color: #00FFFF;'>" + char.level + "</span></div>" +
                    "<div>VIT: " + char.vit + " | AGI: " + char.agi + "</div>" +
                    "<div>INT: " + char.int + " | POW: " + char.pow + " | MAG: " + (char.mag || 1) + "</div>" +
                    "</div>";

                var btnContainer = document.createElement("div");
                btnContainer.style.display = "flex";
                btnContainer.style.gap = "6px";
                btnContainer.style.marginTop = "10px";

                var playBtn = document.createElement("button");
                playBtn.innerText = "PLAY";
                playBtn.style.flex = "1";
                playBtn.style.padding = "6px";
                playBtn.style.background = "#00FFFF";
                playBtn.style.color = "#000";
                playBtn.style.border = "none";
                playBtn.style.fontWeight = "bold";
                playBtn.style.cursor = "pointer";
                playBtn.style.borderRadius = "4px";
                playBtn.style.fontFamily = "'Courier New'";
                
                (function(id) {
                    playBtn.onclick = function() {
                        SelectCharacterToPlay(id);
                    };
                })(char.characterId);

                var deleteBtn = document.createElement("button");
                deleteBtn.innerText = "🗑️";
                deleteBtn.style.padding = "6px 10px";
                deleteBtn.style.background = "rgba(255, 51, 102, 0.2)";
                deleteBtn.style.border = "1.5px solid #FF3366";
                deleteBtn.style.color = "#FF3366";
                deleteBtn.style.cursor = "pointer";
                deleteBtn.style.borderRadius = "4px";
                
                (function(id) {
                    deleteBtn.onclick = function() {
                        BurnGhostNFT(id);
                    };
                })(char.characterId);

                btnContainer.appendChild(playBtn);
                btnContainer.appendChild(deleteBtn);
                card.appendChild(btnContainer);
                container.appendChild(card);
            }
        }
    }
    window.DisplayCharacterSelectionScreen = DisplayCharacterSelectionScreen;

    // Load stats and state on game start
    function SelectCharacterToPlay(charId) {
        var char = window.g_ownedCharacters.find(function(c) { return c.characterId === charId; });
        if (char) {
            try { localStorage.setItem('dg_deso_character_id', charId); } catch(e) {}
            
            if (window.GhostRPG && window.GhostRPG.loadBlockchainState) {
                GhostRPG.loadBlockchainState(
                    parseInt(char.level, 10),
                    parseInt(char.vit, 10),
                    parseInt(char.agi, 10),
                    parseInt(char.int, 10),
                    parseInt(char.pow, 10),
                    char.characterId,
                    parseInt(char.xp, 10) || 0,
                    parseInt(char.pointsToDistribute, 10) || 0,
                    parseInt(char.mag, 10) || 1,
                    char.equippedSkills,
                    char.equippedRunes,
                    char.equippedPassives,
                    char.weapon,
                    char.inventory,
                    char.equipment
                );
            }
            
            if (typeof char.score !== "undefined") {
                window.g_score = parseInt(char.score, 10);
                if (window._antiCheat) window._antiCheat.hash = btoa(window.g_score + window._antiCheat.salt);
            } else {
                window.g_score = 0;
                if (window._antiCheat) window._antiCheat.hash = btoa("0" + window._antiCheat.salt);
            }
            
            if (typeof char.time !== "undefined") {
                window.g_globalTotalTime = parseInt(char.time, 10);
            } else {
                window.g_globalTotalTime = 0;
            }

            var overlay = document.getElementById("characterSelectionOverlay");
            if (overlay) overlay.style.display = "none";
            
            var btn = document.getElementById("gameScreenModeBtn");
            if (btn) btn.style.display = "block";
            
            if (window.g_gameState === window.G_START) {
                if (typeof window.StartCutscene === "function") window.StartCutscene(char.worldLevel, true);
            } else {
                if (typeof window.ResetGame === "function") window.ResetGame(char.worldLevel || 1, true);
                window.g_gamePaused = false;
                if (typeof window.PlayBGM === "function") window.PlayBGM();
            }
        }
    }
    window.SelectCharacterToPlay = SelectCharacterToPlay;

    // Generative local status renderer
    function RenderCharacterNFTBlob(stats, callback) {
        var canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 400;
        var ctx = canvas.getContext("2d");

        var grad = ctx.createLinearGradient(0, 0, 600, 400);
        grad.addColorStop(0, "#120e1a");
        grad.addColorStop(1, "#08060c");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 400);

        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 594, 394);

        function drawGhost() {
            if (characterGhostBase.complete && characterGhostBase.naturalWidth > 0) {
                var aspect = characterGhostBase.naturalWidth / characterGhostBase.naturalHeight;
                var dw = 260;
                var dh = 260 / aspect;
                if (dh > 340) { dh = 340; dw = 340 * aspect; }
                var dx = 150 - dw / 2;
                var dy = 200 - dh / 2;
                ctx.drawImage(characterGhostBase, dx, dy, dw, dh);
            } else {
                ctx.fillStyle = "#FF00FF";
                ctx.font = "bold 20px 'Courier New'";
                ctx.textAlign = "center";
                ctx.fillText("[LOCAL GHOST]", 150, 200);
                ctx.textAlign = "start";
            }

            ctx.strokeStyle = "rgba(255,255,255,0.15)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(300, 10);
            ctx.lineTo(300, 390);
            ctx.stroke();

            ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
            ctx.fillRect(320, 20, 260, 360);
            ctx.strokeStyle = "rgba(255, 0, 255, 0.3)";
            ctx.lineWidth = 1;
            ctx.strokeRect(320, 20, 260, 360);

            ctx.fillStyle = "#FF00FF";
            ctx.font = "bold 18px 'Courier New'";
            ctx.textAlign = "center";
            var displayName = stats.name && stats.name !== "Ghost" ? stats.name.toUpperCase() : "HERO STATUS";
            ctx.fillText("🛡️ " + displayName, 450, 50);
            ctx.textAlign = "start";

            ctx.strokeStyle = "rgba(255,0,255,0.2)";
            ctx.beginPath();
            ctx.moveTo(330, 65);
            ctx.lineTo(570, 65);
            ctx.stroke();

            ctx.font = "bold 14px 'Courier New'";
            ctx.fillStyle = "#FFF";
            
            var startY = 95;
            var gap = 30;
            
            ctx.fillText("LEVEL: " + stats.level, 340, startY);
            ctx.fillText("XP   : " + stats.xp + " / " + (stats.xpRequired || 100), 340, startY + gap);
            
            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.beginPath();
            ctx.moveTo(330, startY + gap + 15);
            ctx.lineTo(570, startY + gap + 15);
            ctx.stroke();

            var startAttrY = startY + gap + 35;
            ctx.fillStyle = "#00FFFF";
            ctx.fillText("❤️ VIT (VITALITY)    : " + stats.vit, 340, startAttrY);
            ctx.fillText("⚡ AGI (AGILITY)     : " + stats.agi, 340, startAttrY + gap);
            ctx.fillText("🔮 INT (INTELLIGENCE): " + stats.int, 340, startAttrY + gap * 2);
            ctx.fillText("⚔️ POW (POWER)       : " + stats.pow, 340, startAttrY + gap * 3);
            ctx.fillText("🌀 MAG (MAGIC)       : " + (stats.mag || 1), 340, startAttrY + gap * 4);

            ctx.strokeStyle = "rgba(255,255,255,0.1)";
            ctx.beginPath();
            ctx.moveTo(330, startAttrY + gap * 4 + 15);
            ctx.lineTo(570, startAttrY + gap * 4 + 15);
            ctx.stroke();

            ctx.font = "bold 9px 'Courier New'";
            ctx.fillStyle = "#888";
            var shortId = stats.characterId ? stats.characterId.substring(0, 16) + "..." : "GENERATING...";
            ctx.fillText("CHAR ID: " + shortId, 340, startAttrY + gap * 4 + 35);
            ctx.fillText("PLAY LOCAL - WEB2 MODE", 340, startAttrY + gap * 4 + 47);

            canvas.toBlob(callback, "image/jpeg", 0.95);
        }

        if (!characterGhostBase.complete) {
            characterGhostBase.onload = drawGhost;
            characterGhostBase.onerror = drawGhost;
        } else {
            drawGhost();
        }
    }
    window.RenderCharacterNFTBlob = RenderCharacterNFTBlob;

    function escapeHTML(str) {
        if (!str) return "";
        return str.replace(/[&<>'"]/g, 
            function(tag) {
                var chars_to_replace = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    "'": '&#39;',
                    '"': '&quot;'
                };
                return chars_to_replace[tag] || tag;
            }
        );
    }
})();
