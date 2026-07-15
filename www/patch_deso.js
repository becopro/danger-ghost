const fs = require('fs');

const path = 'js/web3/deso_api.js';
let content = fs.readFileSync(path, 'utf8');

// Replace LoadRPGStateFromDeSo
const loadStart = content.indexOf('async function LoadRPGStateFromDeSo(publicKey, forceShowOverlay) {');
const loadEndMarker = 'window.LoadRPGStateFromDeSo = LoadRPGStateFromDeSo;';
const loadEnd = content.indexOf(loadEndMarker, loadStart) + loadEndMarker.length;

const newLoad = `async function LoadRPGStateFromDeSo(publicKey, forceShowOverlay) {
    window.g_desoCharactersLoading = true;
    var panelContent = document.getElementById("rpgPanelContent") || document.getElementById("navbarPanelContent");
    if (panelContent) {
        panelContent.innerHTML = "<h3 style='margin: 0 0 12px 0; color: #00FF00; text-align: center; letter-spacing: 2px;'>💀 HERO STATUS</h3>" +
                                 "<div style='color:#00FF00; font-weight:bold; text-align:center; margin-bottom: 12px; text-shadow: 0 0 5px #00FF00;'>" +
                                 "👻 LOADING GHOSTS FROM DESO BLOCKCHAIN...</div>";
    }

    try {
        var charactersMap = new Map();
        var saves = {};

        try {
            var profileRes = await fetch("https://node.deso.org/api/v0/get-single-profile", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ PublicKeyBase58Check: publicKey })
            });
            if (profileRes.ok) {
                var profileData = await profileRes.json();
                if (profileData.Profile && profileData.Profile.ExtraData) {
                    var ed = profileData.Profile.ExtraData;
                    for (var key in ed) {
                        if (key.startsWith("DangerGhost_SaveState_") || key === "DangerGhost_SaveState") {
                            try {
                                var decrypted = window.SafeAtob ? window.SafeAtob(ed[key]) : atob(ed[key]);
                                var stats = JSON.parse(decrypted);
                                if (stats && stats.characterId) {
                                    saves[stats.characterId] = stats;
                                }
                            } catch(e) {}
                        }
                    }
                }
            }
        } catch(e) { console.warn("Failed fetching profile saves", e); }

        try {
            var nftRes = await fetch("https://node.deso.org/api/v0/get-nfts-for-user", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ UserPublicKeyBase58Check: publicKey })
            });
            if (nftRes.ok) {
                var nftData = await nftRes.json();
                if (nftData && nftData.NFTsMap) {
                    var nftPosts = Object.values(nftData.NFTsMap);
                    for (var i = 0; i < nftPosts.length; i++) {
                        var p = nftPosts[i].PostEntryResponse;
                        if (p && p.PostExtraData && p.PostExtraData["DangerGhost_CharacterID"]) {
                            var charId = p.PostExtraData["DangerGhost_CharacterID"];
                            var baseStats = {};
                            try {
                                var baseDec = window.SafeAtob ? window.SafeAtob(p.PostExtraData["DangerGhost_SaveState"]) : atob(p.PostExtraData["DangerGhost_SaveState"]);
                                baseStats = JSON.parse(baseDec);
                            } catch(e) {}
                            
                            var finalStats = saves[charId] || baseStats;
                            finalStats.characterId = charId;
                            finalStats.imageUrl = p.ImageURLs && p.ImageURLs[0] ? p.ImageURLs[0] : "";
                            finalStats.postHashHex = p.PostHashHex;
                            
                            charactersMap.set(charId, finalStats);
                        }
                    }
                }
            }
        } catch(e) { console.warn("Failed fetching NFTs", e); }

        var uniqueCharacters = Array.from(charactersMap.values());
        console.log('[DeSo Sync] Characters loaded:', uniqueCharacters.length);

        var autoSelected = false;
        if (!forceShowOverlay && uniqueCharacters.length > 0) {
            try {
                var savedCharId = localStorage.getItem('dg_deso_character_id');
                if (savedCharId) {
                    var savedChar = uniqueCharacters.find(function(c) { return c.characterId === savedCharId; });
                    if (savedChar) {
                        window.g_ownedCharacters = uniqueCharacters;
                        SelectCharacterToPlay(savedCharId);
                        autoSelected = true;
                    }
                }
            } catch(lsErr) {}
        }

        if (!autoSelected) {
            DisplayCharacterSelectionScreen(uniqueCharacters);
        }
        if (uniqueCharacters.length === 0) {
            GhostRPG.resetStats();
        }
        RenderRPGStatusDrawer();

    } catch(e) {
        console.error("Load RPG DeSo Error", e);
        GhostRPG.resetStats();
        RenderRPGStatusDrawer();
        alert("Error reading Ghosts from Blockchain. Please check your connection and try again.");
    } finally {
        window.g_desoCharactersLoading = false;
    }
}
window.LoadRPGStateFromDeSo = LoadRPGStateFromDeSo;`;

content = content.substring(0, loadStart) + newLoad + content.substring(loadEnd);

// Replace ExecuteDeSoRPGSave
const saveStart = content.indexOf('async function ExecuteDeSoRPGSave(jwt) {');
const saveEndMarker = 'window.ExecuteDeSoRPGSave = ExecuteDeSoRPGSave;';
const saveEnd = content.indexOf(saveEndMarker, saveStart) + saveEndMarker.length;

const newSave = `async function ExecuteDeSoRPGSave(jwt) {
    var btn = document.getElementById("rpgSaveBtn");
    try {
        if(btn) { btn.innerText = "SAVING TO PROFILE..."; btn.disabled = true; }

        var stats = GhostRPG.getStats();
        var saveObj = Object.assign({}, stats, { score: window.g_score, time: window.g_globalTotalTime });
        var extraDataKey = "DangerGhost_SaveState_" + saveObj.characterId;
        
        var profileRes = await fetch("https://node.deso.org/api/v0/get-single-profile", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ PublicKeyBase58Check: window.g_desoPublicKey })
        });
        var profileData = await profileRes.json();
        var profile = profileData.Profile || {};

        var extraDataObj = {};
        extraDataObj[extraDataKey] = window.SafeBtoa ? window.SafeBtoa(JSON.stringify(saveObj)) : btoa(JSON.stringify(saveObj));

        var postReq = {
            UpdaterPublicKeyBase58Check: window.g_desoPublicKey,
            ProfilePublicKeyBase58Check: window.g_desoPublicKey,
            NewUsername: profile.Username || "",
            NewDescription: profile.Description || "",
            NewProfilePic: profile.ProfilePic || "",
            NewCreatorBasisPoints: profile.CoinEntry ? profile.CoinEntry.CreatorBasisPoints : 10000,
            NewStakeMultipleBasisPoints: profile.CoinEntry ? profile.CoinEntry.DeSoLockedNanos : 12500,
            IsHidden: profile.IsHidden || false,
            MinFeeRateNanosPerKB: 1000,
            ExtraData: extraDataObj
        };

        var postRes = await fetch("https://node.deso.org/api/v0/update-profile", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postReq)
        });
        var postData = await postRes.json();
        
        if (postData.TransactionHex) {
            window.g_desoPendingTransactionType = "RPG_SAVE";
            window.g_desoIdentityWindow = window.open("https://identity.deso.org/approve?tx=" + postData.TransactionHex, "deso_identity", "width=800,height=1000");
            
            if(btn) btn.innerText = "APPROVE SAVE IN POP-UP...";
            
            window.WaitForWindowClose(window.g_desoIdentityWindow, function() {
                if (window.g_desoPendingTransactionType === "RPG_SAVE") {
                    if(btn) { btn.innerText = "SAVE EVOLUTION (BLOCKCHAIN)"; btn.disabled = false; }
                }
            });
        } else {
            throw new Error(postData.error || "Error updating profile on DeSo node.");
        }
    } catch(e) {
        console.error("Save RPG Error", e);
        if(btn) { btn.innerText = "SAVE EVOLUTION (BLOCKCHAIN)"; btn.disabled = false; }
        alert("Error saving Ghost: " + e.message);
    }
}
window.ExecuteDeSoRPGSave = ExecuteDeSoRPGSave;`;

content = content.substring(0, saveStart) + newSave + content.substring(saveEnd);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched Load and Save functions to use UpdateProfile ExtraData");
