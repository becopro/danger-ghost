// --- Danger Ghost UI Manager ---
// This file handles DOM updates, overlays, and Menus

function ToggleNavbarTab(tab) {
    try {
        var now = Date.now();
        if (typeof g_lastTabClickTick === 'undefined') window.g_lastTabClickTick = 0;
        if (now - g_lastTabClickTick < 50) return;
        g_lastTabClickTick = now;

        var rightPanel = document.getElementById("navbarPanel");
        var leftPanel = document.getElementById("rpgPanel");
        var chatPanel = document.getElementById("chatPanel");
        var rightContent = document.getElementById("navbarPanelContent");
        
        var btnControls = document.getElementById("btnNavControls");
        var btnRPG = document.getElementById("btnNavRPG");
        var btnSpells = document.getElementById("btnNavSpells");
        var btnBag = document.getElementById("btnNavBag");
        var btnEquip = document.getElementById("btnNavEquip");
        var btnChat = document.getElementById("btnNavChat");
        
        [btnControls, btnRPG, btnSpells, btnBag, btnEquip, btnChat].forEach(function(btn) {
            if (btn) {
                btn.style.background = "transparent";
                btn.style.borderColor = "var(--border-light)";
                btn.style.boxShadow = "none";
            }
        });

        if (typeof g_activeTab === 'undefined') window.g_activeTab = null;

        if (g_activeTab === tab) {
            if(rightPanel) rightPanel.style.display = "none";
            if(leftPanel) leftPanel.style.display = "none";
            if(chatPanel) chatPanel.style.display = "none";
            g_activeTab = null;
            return;
        }

        if(rightPanel) rightPanel.style.display = "none";
        if(leftPanel) leftPanel.style.display = "none";
        if(chatPanel) chatPanel.style.display = "none";

        g_activeTab = tab;

        if (tab === 'rpg') {
            if(leftPanel) leftPanel.style.display = "flex";
            if (btnRPG) {
                btnRPG.style.background = "rgba(0,255,0,0.2)";
                btnRPG.style.borderColor = "var(--green-neon)";
                btnRPG.style.boxShadow = "0 0 15px var(--green-neon)";
            }
            if (typeof RenderRPGStatusDrawer === "function") RenderRPGStatusDrawer();
        } else if (tab === 'chat') {
            if(chatPanel) chatPanel.style.display = "flex";
            if (btnChat) {
                btnChat.style.background = "rgba(0,255,255,0.2)";
                btnChat.style.borderColor = "var(--cyan-neon)";
                btnChat.style.boxShadow = "0 0 15px var(--cyan-neon)";
            }
            if (typeof RenderChatHistory === "function") RenderChatHistory();
        } else {
            if(rightPanel) rightPanel.style.display = "flex";
            if (tab === 'controls') {
                if (btnControls) {
                    btnControls.style.background = "rgba(255,255,0,0.2)";
                    btnControls.style.borderColor = "var(--yellow-neon)";
                    btnControls.style.boxShadow = "0 0 12px var(--yellow-neon)";
                }
                if(rightContent) rightContent.innerHTML = "<h3 style='margin: 0 0 6px 0; color: var(--yellow-neon); text-align: center; font-family: var(--font-title); font-size: 16px; letter-spacing: 1px;'>🎮 CONTROLS</h3>" +
                    "<div style='display: flex; flex-direction: column; gap: 6px; font-size: 12px; line-height: 1.3; max-height: 220px; overflow-y: auto; padding-right: 4px;'>" +
                    "<div><b>A/D or &larr;/&rarr;</b><br><span style='color:var(--text-muted);'>Move Character</span></div>" +
                    "<div><b>W or &uarr;</b><br><span style='color:var(--text-muted);'>Jump / Dbl Jump</span></div>" +
                    "<div><b>W (Press 3x)</b><br><span style='color:var(--text-muted);'>Triple Jump!</span></div>" +
                    "<div><b>SPACE</b><br><span style='color:var(--text-muted);'>Start / Pause</span></div>" +
                    "<div><b>V, F, E, R</b><br><span style='color:var(--text-muted);'>Slot Skills</span></div>" +
                    "<div><b>1</b><br><span style='color:var(--text-muted);'>Cast Equipped Spell</span></div>" +
                    "<div><b>M</b><br><span style='color:var(--text-muted);'>Mute Music</span></div>" +
                    "</div>";
            } else if (tab === 'bag') {
                if (btnBag) {
                    btnBag.style.background = "rgba(255,0,255,0.2)";
                    btnBag.style.borderColor = "var(--magenta-neon)";
                    btnBag.style.boxShadow = "0 0 12px var(--magenta-neon)";
                }
                UpdateNavbarBag();
            } else if (tab === 'equip') {
                if (btnEquip) {
                    btnEquip.style.background = "rgba(255,170,0,0.2)";
                    btnEquip.style.borderColor = "#ffaa00";
                    btnEquip.style.boxShadow = "0 0 12px #ffaa00";
                }
                UpdateNavbarEquip();
            } else if (tab === 'spells') {
                if (btnSpells) {
                    btnSpells.style.background = "rgba(255,0,0,0.2)";
                    btnSpells.style.borderColor = "var(--red-neon)";
                    btnSpells.style.boxShadow = "0 0 12px var(--red-neon)";
                }
                if(rightPanel) rightPanel.style.display = "flex";
                UpdateNavbarSpells();
            }
        }
    } catch(err) {
        console.warn("ToggleNavbarTab Error", err);
    }
}

var g_selectedBagItemId = null;
window.g_multiDiscardMode = false;
window.g_selectedBagItemIds = [];

function ToggleMultiDiscardMode() {
    window.g_multiDiscardMode = !window.g_multiDiscardMode;
    window.g_selectedBagItemIds = [];
    UpdateNavbarBag();
}

function DiscardSelectedItems() {
    if (!window.g_selectedBagItemIds || window.g_selectedBagItemIds.length === 0) {
        alert("No items selected to discard!");
        return;
    }
    var count = window.g_selectedBagItemIds.length;
    var confirmMsg = "Are you sure you want to discard the " + count + " selected items? This action is permanent!";
    if (confirm(confirmMsg)) {
        window.g_selectedBagItemIds.forEach(function(id) {
            if (window.DiscardInventoryItem) {
                window.DiscardInventoryItem(id);
            }
        });
        window.g_selectedBagItemIds = [];
        window.g_multiDiscardMode = false;
        UpdateNavbarBag();
    }
}

function UpdateNavbarBag() {
    try {
        var panelContent = document.getElementById("navbarPanelContent");
        if (!panelContent) return;
        
        var stats = window.GhostRPG ? GhostRPG.getStats() : { inventory: [] };
        var items = stats.inventory || [];
        
        var gridHTML = "<div style='max-height: 180px; overflow-y: auto; padding-right: 4px; border: 1px solid rgba(255,255,255,0.1); padding: 4px; border-radius: 4px; margin-bottom: 8px;'>" +
                       "<div style='display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;'>";
        
        for (var i = 0; i < 100; i++) {
            if (i < items.length) {
                var item = items[i];
                var isSelected = window.g_multiDiscardMode ? 
                    (window.g_selectedBagItemIds.indexOf(item.id) !== -1) : 
                    (item.id === g_selectedBagItemId);
                var isSelectedStyle = isSelected ? "border: 2px solid var(--magenta-neon); box-shadow: 0 0 8px var(--magenta-neon);" : "";
                if (window.g_multiDiscardMode && isSelected) {
                    isSelectedStyle = "border: 2px dashed #FF3366; box-shadow: 0 0 8px #FF3366;";
                }
                var iconHtml = item.icon;
                if (item.id === "blue_key") {
                    iconHtml = "<img src='assets/sprites/Blue key (1).webp' style='width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;' />";
                } else if (iconHtml && iconHtml.indexOf("<img") === -1 && iconHtml.indexOf("/") !== -1) {
                    iconHtml = "<img src='" + escapeHTML(iconHtml) + "' style='width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;' />";
                }
                gridHTML += "<div onclick=\"SelectBagItem('" + escapeHTML(item.id) + "')\" class='bag-grid-slot' style='" + isSelectedStyle + "' title='" + escapeHTML(item.name) + "'>" +
                    iconHtml + 
                    (item.count > 1 ? "<span style='position: absolute; bottom: 1px; right: 2px; font-size: 9px; font-weight: bold; background: #000; color: #FFA500; padding: 0px 2px; border-radius: 2px; border: 1px solid #FFA500;'>x" + item.count + "</span>" : "") +
                    "</div>";
            } else {
                gridHTML += "<div class='bag-grid-slot' style='border: 1px dashed rgba(255, 0, 255, 0.2); color: rgba(255, 255, 255, 0.15); font-size: 11px; cursor: default;'>-</div>";
            }
        }
        gridHTML += "</div></div>";
        
        var detailsHTML = "<div id='bagDetailsBox' class='bag-details-container'>";
        
        if (window.g_multiDiscardMode) {
            var selectedCount = window.g_selectedBagItemIds.length;
            var itemsWord = selectedCount === 1 ? "item" : "items";
            detailsHTML += "<div style='text-align: center; color: #FFF; font-size: 12px; margin-top: 10px;'>" +
                "⚡ <b>MULTI-SELECTION MODE</b><br>" +
                "<span style='color: #FF3366; font-weight: bold;'>" + selectedCount + "</span> " + itemsWord + " selected.<br>" +
                "<button onclick='DiscardSelectedItems()' class='bag-discard-btn' style='padding: 8px 12px; margin-top: 10px; font-size: 12px; background: rgba(255, 51, 102, 0.2); border: 1.5px solid #FF3366; color: #FF3366; cursor: pointer; border-radius: 4px; font-family: var(--font-title); font-weight: bold; box-shadow: 0 0 10px rgba(255, 51, 102, 0.35); text-shadow: 0 0 5px #FF3366; transition: all 0.2s;' onmouseover=\"this.style.background='rgba(255, 51, 102, 0.4)'; this.style.boxShadow='0 0 15px #FF3366';\" onmouseout=\"this.style.background='rgba(255, 51, 102, 0.2)'; this.style.boxShadow='0 0 10px rgba(255, 51, 102, 0.35)';\">DISCARD SELECTED</button>" +
                "</div>";
        } else {
            var selectedItem = items.find(function(item) { return item.id === g_selectedBagItemId; });
            if (selectedItem) {
                var selectedIconHtml = selectedItem.icon;
                if (selectedItem.id === "blue_key") {
                    selectedIconHtml = "<img src='assets/sprites/Blue key (1).webp' style='width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;' />";
                } else if (selectedIconHtml && selectedIconHtml.indexOf("<img") === -1 && selectedIconHtml.indexOf("/") !== -1) {
                    selectedIconHtml = "<img src='" + escapeHTML(selectedIconHtml) + "' style='width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;' />";
                }
                
                var qualityColor = "#B0BEC5";
                if (selectedItem.quality === "Rare") qualityColor = "#00E5FF";
                else if (selectedItem.quality === "Epic") qualityColor = "#E040FB";
                
                var attrHTML = "";
                if (selectedItem.itemLevel) {
                    attrHTML += "<div style='color: #aaa;'>Level: " + selectedItem.itemLevel + "</div>";
                }
                if (selectedItem.baseDamage !== undefined) {
                    attrHTML += "<div>Base Damage: <span style='color: var(--yellow-neon);'>" + selectedItem.baseDamage + "</span></div>";
                }
                if (selectedItem.baseDefense !== undefined) {
                    attrHTML += "<div>Base Defense: <span style='color: var(--yellow-neon);'>" + selectedItem.baseDefense + "</span></div>";
                }
                if (selectedItem.attributes) {
                    for (var attrKey in selectedItem.attributes) {
                        var attrVal = selectedItem.attributes[attrKey];
                        attrHTML += "<div style='color: #00FFFF;'>+" + attrVal + " " + attrKey + "</div>";
                    }
                }
                if (selectedItem.requiredStats) {
                    var reqs = selectedItem.requiredStats;
                    attrHTML += "<div style='color: #FF5555; font-size: 11px; margin-top: 4px; font-weight: bold;'>" +
                                "Reqs - POW: " + (reqs.strength || 0) + 
                                " | INT: " + (reqs.intelligence || 0) + 
                                " | AGI: " + (reqs.agility || 0) + "</div>";
                }
                if (selectedItem.specialEffect) {
                    attrHTML += "<div style='color: #FF8C00; font-style: italic; margin-top: 4px; font-size: 11px;'>" + escapeHTML(selectedItem.specialEffect) + "</div>";
                }

                var actionBtn = "";
                if (selectedItem.slot || selectedItem.id === "ghost_helmet" || selectedItem.id === "ghost_spell") {
                    actionBtn = "<button onclick=\"EquipBagItem('" + escapeHTML(selectedItem.id) + "')\" class='bag-equip-btn' style='padding: 6px; margin-top: 6px; font-size: 11px; margin-right: 6px;'>EQUIP</button>";
                }
                actionBtn += "<button onclick=\"DiscardBagItem('" + escapeHTML(selectedItem.id) + "')\" class='bag-discard-btn' style='padding: 6px; margin-top: 6px; font-size: 11px; background: rgba(255, 51, 102, 0.2); border: 1.5px solid #FF3366; color: #FF3366; cursor: pointer; border-radius: 4px; font-family: var(--font-title); font-weight: bold; text-shadow: 0 0 4px #FF3366; box-shadow: 0 0 8px rgba(255, 51, 102, 0.25); transition: all 0.2s ease-in-out;' onmouseover=\"this.style.background='rgba(255, 51, 102, 0.4)'; this.style.boxShadow='0 0 12px #FF3366';\" onmouseout=\"this.style.background='rgba(255, 51, 102, 0.2)'; this.style.boxShadow='0 0 8px rgba(255, 51, 102, 0.25)';\">DISCARD</button>";

                detailsHTML += "<div style='color: " + qualityColor + "; font-weight: bold; font-size: 13px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;'><span>" + selectedIconHtml + "</span> " + escapeHTML(selectedItem.name) + "</div>" +
                    "<div style='margin-bottom: 4px; line-height: 1.35; color: var(--text-main); font-size: 11px;'>" + escapeHTML(selectedItem.description) + "</div>" +
                    "<div style='font-size: 11px; line-height: 1.3;'>" + attrHTML + "</div>" +
                    "<div style='display: flex; gap: 6px;'>" + actionBtn + "</div>";
            } else {
                detailsHTML += "<p style='text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 30px;'>SELECT AN ITEM FOR DETAILS</p>";
            }
        }
        detailsHTML += "</div>";
        
        var modeBtnText = window.g_multiDiscardMode ? "SELECTION: ON" : "SELECTION: OFF";
        var modeBtnColor = window.g_multiDiscardMode ? "#FF3366" : "var(--magenta-neon)";
        var modeBtnStyle = "font-size: 9px; padding: 3px 8px; background: rgba(255,0,255,0.05); border: 1px solid " + modeBtnColor + "; color: " + modeBtnColor + "; cursor: pointer; border-radius: 4px; font-family: var(--font-title); text-shadow: 0 0 2px " + modeBtnColor + "; box-shadow: 0 0 4px rgba(255,0,255,0.1);";
        
        var headerHTML = "<div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;'>" +
            "<h3 style='margin: 0; color: var(--magenta-neon); font-family: var(--font-title); font-size: 15px; letter-spacing: 1px;'>🎒 GHOST BAG</h3>" +
            "<button onclick='ToggleMultiDiscardMode()' style='" + modeBtnStyle + "'>" + modeBtnText + "</button>" +
            "</div>";
        
        panelContent.innerHTML = headerHTML + gridHTML + detailsHTML;
    } catch(err) {
        console.warn("UpdateNavbarBag Error", err);
    }
}

function SelectBagItem(itemId) {
    if (window.g_multiDiscardMode) {
        if (!window.g_selectedBagItemIds) window.g_selectedBagItemIds = [];
        var idx = window.g_selectedBagItemIds.indexOf(itemId);
        if (idx === -1) {
            window.g_selectedBagItemIds.push(itemId);
        } else {
            window.g_selectedBagItemIds.splice(idx, 1);
        }
        UpdateNavbarBag();
    } else {
        g_selectedBagItemId = itemId;
        UpdateNavbarBag();
    }
}

function EquipBagItem(itemId) {
    if (window.EquipInventoryItem && window.EquipInventoryItem(itemId)) {
        g_selectedBagItemId = null;
        UpdateNavbarBag();
    }
}

function DiscardBagItem(itemId) {
    if (confirm("Are you sure you want to discard this item? This action is permanent!")) {
        if (window.DiscardInventoryItem && window.DiscardInventoryItem(itemId)) {
            g_selectedBagItemId = null;
            UpdateNavbarBag();
        }
    }
}

function UpdateNavbarEquip() {
    try {
        var panelContent = document.getElementById("navbarPanelContent");
        if (!panelContent) return;

        var eq = window.GetEquipmentState ? window.GetEquipmentState() : { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };

        var slots = [
            { key: 'head', name: 'HEAD (HELMET)' },
            { key: 'chest', name: 'CHEST (CHESTPLATE)' },
            { key: 'mainhand', name: 'MAIN HAND (BLADE)' },
            { key: 'offhand', name: 'OFF-HAND (SHIELD)' },
            { key: 'ring1', name: 'RING 1 (RING)' },
            { key: 'ring2', name: 'RING 2 (RING)' },
            { key: 'amulet', name: 'AMULET (AMULET)' }
        ];

        var html = "<h3 style='margin: 0 0 8px 0; color: #ffaa00; text-align: center; font-family: var(--font-title); font-size: 16px; letter-spacing: 1px;'>🛡️ EQUIPMENT</h3>" +
            "<div class='equip-slots-container'>";

        slots.forEach(function(slot) {
            var item = eq[slot.key];
            if (item) {
                var qualityColor = "#B0BEC5";
                if (item.quality === "Rare") qualityColor = "#00E5FF";
                else if (item.quality === "Epic") qualityColor = "#E040FB";

                var iconHtml = item.icon || "⚙️";
                if (iconHtml.indexOf("<img") === -1 && iconHtml.indexOf("/") !== -1) {
                    iconHtml = "<img src='" + escapeHTML(iconHtml) + "' style='width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;' />";
                }

                var bonusText = "";
                if (item.baseDamage !== undefined) bonusText = "Dmg: " + item.baseDamage;
                else if (item.baseDefense !== undefined) bonusText = "Def: " + item.baseDefense;

                html += "<div class='equip-slot-row equipped' style='border-color: " + qualityColor + "; --quality-color: " + qualityColor + ";'>" +
                    "<div class='equip-slot-info'>" +
                    "<span class='equip-slot-icon'>" + iconHtml + "</span>" +
                    "<div class='equip-slot-text'>" +
                    "<div class='equip-slot-name' style='color: " + qualityColor + ";'>" + escapeHTML(item.name) + "</div>" +
                    "<div class='equip-slot-type'>" + slot.name + (bonusText ? " | <span class='equip-slot-bonus'>" + bonusText + "</span>" : "") + "</div>" +
                    "</div>" +
                    "</div>" +
                    "<button onclick=\"UnequipItemSlot('" + slot.key + "')\" class='equip-unequip-btn'>UNEQUIP</button>" +
                    "</div>";
            } else {
                html += "<div class='equip-slot-empty'>" +
                    "➕ " + slot.name + " EMPTY" +
                    "</div>";
            }
        });

        html += "</div>" +
            "<div style='background: rgba(7, 7, 8, 0.6); border: 1px solid rgba(255, 170, 0, 0.2); padding: 6px 8px; border-radius: 6px; font-size: 10px; line-height: 1.35; color: var(--text-muted);'>" +
            "ℹ️ <b>How to equip</b>: Go to the 🎒 BAG tab, click an item and choose 'EQUIP'." +
            "</div>";

        panelContent.innerHTML = html;
    } catch(err) {
        console.warn("UpdateNavbarEquip Error", err);
    }
}

function UnequipItemSlot(slotName) {
    if (window.UnequipEquipmentItem && window.UnequipEquipmentItem(slotName)) {
        UpdateNavbarEquip();
    }
}

window.EquipBagItem = EquipBagItem;
window.DiscardBagItem = DiscardBagItem;
window.ToggleMultiDiscardMode = ToggleMultiDiscardMode;
window.DiscardSelectedItems = DiscardSelectedItems;
window.UpdateNavbarEquip = UpdateNavbarEquip;
window.UnequipItemSlot = UnequipItemSlot;

// --- Live Global Chat System ---
var g_mqttClient = null;
var g_chatHistory = [];

function InitGlobalChat() {
    try {
        var savedNick = localStorage.getItem("dg_chat_nick");
        var nickInput = document.getElementById("chatNickInput");
        if (nickInput) {
            if (savedNick) {
                nickInput.value = savedNick;
            } else {
                var randomId = Math.floor(1000 + Math.random() * 9000);
                nickInput.value = "GUEST_" + randomId;
                localStorage.setItem("dg_chat_nick", nickInput.value);
            }
            nickInput.addEventListener("change", function() {
                var val = nickInput.value.trim().replace(/[^a-zA-Z0-9_]/g, "");
                if (!val) val = "GUEST_" + Math.floor(1000 + Math.random() * 9000);
                nickInput.value = val;
                localStorage.setItem("dg_chat_nick", val);
            });
        }

        var cached = sessionStorage.getItem("dg_chat_history_v1");
        if (cached) {
            try {
                g_chatHistory = JSON.parse(cached);
                RenderChatHistory();
            } catch(e) {
                g_chatHistory = [];
            }
        } else {
            AddChatMessage({ nick: "SYSTEM", msg: "Welcome to Danger Ghost Global Chat! Choose your name and start typing.", time: Date.now() });
        }

        g_mqttClient = mqtt.connect("wss://broker.emqx.io:8084/mqtt", {
            keepalive: 60,
            clientId: "dg_client_" + Math.random().toString(16).substring(2, 10),
            clean: true
        });

        g_mqttClient.on("connect", function() {
            g_mqttClient.subscribe("danger-ghost/global-chat-room-v1", function(err) {
                if (!err) console.log("Subscribed to global chat topic");
            });
        });

        g_mqttClient.on("message", function(topic, payload) {
            try {
                var data = JSON.parse(payload.toString());
                if (data && data.nick && data.msg) AddChatMessage(data);
            } catch(err) {}
        });

        var msgInput = document.getElementById("chatMsgInput");
        var sendBtn = document.getElementById("chatSendBtn");

        function doSend() {
            if (!msgInput || !g_mqttClient) return;
            var msgText = msgInput.value.trim();
            if (!msgText) return;
            var currentNick = (nickInput ? nickInput.value.trim() : "") || "GUEST_GHOST";
            var payload = { nick: currentNick, msg: msgText, time: Date.now() };
            g_mqttClient.publish("danger-ghost/global-chat-room-v1", JSON.stringify(payload));
            msgInput.value = "";
        }

        if (sendBtn) sendBtn.addEventListener("click", doSend);
        if (msgInput) {
            msgInput.addEventListener("keydown", function(e) {
                if (e.key === "Enter") doSend();
            });
        }
    } catch(e) {
        console.warn("Global chat initialization error", e);
    }
}

function AddChatMessage(msgObj) {
    g_chatHistory.push(msgObj);
    if (g_chatHistory.length > 50) g_chatHistory.shift();
    sessionStorage.setItem("dg_chat_history_v1", JSON.stringify(g_chatHistory));
    RenderChatHistory();
}

function RenderChatHistory() {
    var container = document.getElementById("chatMessages");
    if (!container) return;

    var html = "";
    g_chatHistory.forEach(function(item) {
        var date = new Date(item.time);
        var timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        var escapedNick = escapeHTML(item.nick);
        var escapedMsg = escapeHTML(item.msg);

        var nickColor = "var(--cyan-neon)";
        if (item.nick === "SYSTEM") nickColor = "var(--yellow-neon)";
        else if (item.nick === localStorage.getItem("dg_chat_nick")) nickColor = "var(--green-neon)";

        html += "<div style='margin-bottom: 6px; line-height: 1.5; font-size: 16px;'>" +
                    "<span style='color: var(--text-muted); font-size: 12px; margin-right: 6px;'>[" + timeStr + "]</span>" +
                    "<span style='color: " + nickColor + "; font-weight: bold; margin-right: 6px;'>&lt;" + escapedNick + "&gt;</span>" +
                    "<span style='color: #FFF;'>" + escapedMsg + "</span>" +
                "</div>";
    });

    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

window.ToggleNavbarTab = ToggleNavbarTab;

function RenderRPGStatusDrawer() {
    var stats = window.GhostRPG ? GhostRPG.getStats() : { pointsToDistribute: 0, level: 1, xp: 0, xpRequired: 100, vit: 1, agi: 1, int: 1, pow: 1, mag: 1, equippedSkills: [0,1,2,3], equippedRunes: [0,0,0,0] };
    var panelContent = document.getElementById("rpgPanelContent");
    if (!panelContent) return;

    var apHTML = "";
    if (stats.pointsToDistribute > 0) {
        apHTML = "<div style='color:var(--green-neon); font-weight:bold; font-size:11px; text-align:center; margin-bottom: 6px; text-shadow: 0 0 5px var(--green-neon);'>⚡ " + stats.pointsToDistribute + " AP AVAILABLE!</div>";
    }

    function makeButton(attr) {
        if (stats.pointsToDistribute > 0) {
            return "<button onclick=\"GhostRPG.allocateAttribute('" + attr + "'); RenderRPGStatusDrawer();\" class='rpg-stat-btn' style='padding: 2px 6px; font-size: 11px;'>+</button>";
        }
        return "";
    }

    var currentWeapon = stats.weapon || { name: 'Starter Dirk', damage: 10 };
    var currentDamage = currentWeapon.damage;
    var currentTier = Math.floor((currentDamage - 10) / 10);
    var upgradeCost = currentDamage * 100;
    var weaponNames = ["Starter Dirk", "Shadow Dirk", "Ghostblade", "Doom Splicer", "Soul Reaper", "Grandfather", "Doomcalibur", "Desolation Sword"];
    var nextName = weaponNames[currentTier + 1] || ("Godly Blade +" + (currentTier + 1));
    
    var economyHTML = 
        "<hr style='border-color: rgba(255,255,255,0.1); margin: 6px 0;'>" +
        "<div style='font-size: 12px; line-height: 1.35; color: #FFF;'>" +
        "<div style='margin-bottom:2px;'>⚔️ <b>WEAPON:</b> <span style='color:var(--yellow-neon);'>" + currentWeapon.name + "</span></div>" +
        "<div style='margin-bottom:4px;'><b>DAMAGE:</b> <span style='color:var(--yellow-neon);'>" + currentDamage + "</span></div>" +
        "<button onclick=\"if(GhostRPG.upgradeWeapon()) { RenderRPGStatusDrawer(); } else { alert('Insufficient Score or Cheat Detected!'); }\" style='width:100%; margin-top:4px; padding:6px; background:var(--yellow-neon); color:#000; font-weight:bold; border:none; cursor:pointer; font-family:var(--font-title); font-size:11px; border-radius:4px;'>UPGRADE TO " + nextName.toUpperCase() + " (" + upgradeCost + " PTS)</button>" +
        "</div>";

    panelContent.innerHTML = 
        "<h3 style='margin: 0 0 6px 0; color: var(--green-neon); text-align: center; letter-spacing: 1px; font-family: var(--font-title); font-size: 16px;'>🛡️ HERO STATUS</h3>" +
        apHTML +
        "<div style='display: flex; flex-direction: column; gap: 6px; max-height: 235px; overflow-y: auto; padding-right: 4px;'>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span><b>LEVEL:</b></span><span style='color:var(--cyan-neon); font-weight:bold;'>" + stats.level + "</span></div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span><b>XP:</b></span><span style='color:var(--cyan-neon); font-weight:bold;'>" + stats.xp + " / " + stats.xpRequired + "</span></div>" +
        "<hr style='border-color: rgba(255,255,255,0.1); margin: 4px 0;'>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>❤️ <b>VIT:</b> " + stats.baseVit + (stats.bonuses && stats.bonuses.vit > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.vit + ")</span>" : "") + "</span>" + makeButton('vit') + "</div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>⚡ <b>AGI:</b> " + stats.baseAgi + (stats.bonuses && stats.bonuses.agi > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.agi + ")</span>" : "") + "</span>" + makeButton('agi') + "</div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>🔮 <b>INT:</b> " + stats.baseInt + (stats.bonuses && stats.bonuses.int > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.int + ")</span>" : "") + "</span>" + makeButton('int') + "</div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>⚔️ <b>POW:</b> " + stats.basePow + (stats.bonuses && stats.bonuses.pow > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.pow + ")</span>" : "") + "</span>" + makeButton('pow') + "</div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>🌀 <b>MAG:</b> " + stats.baseMag + (stats.bonuses && stats.bonuses.mag > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.mag + ")</span>" : "") + "</span>" + makeButton('mag') + "</div>" +
        economyHTML +
        "</div>";
}

function UpdateNavbarSpells() {
    try {
        var panelContent = document.getElementById("navbarPanelContent");
        if (!panelContent) return;

        var stats = window.GhostRPG ? GhostRPG.getStats() : { equippedSkills: [0,1,2,3], equippedRunes: [0,0,0,0] };

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
            "<h4 style='color: var(--green-neon); margin: 0 0 6px 0; text-align: center; font-size: 13px; letter-spacing: 0.5px;'>🔮 ACTIVE SKILLS & RUNES</h4>" +
            "<div style='display:flex; flex-direction:column; gap:6px;'>";
        
        for (var i = 0; i < 4; i++) {
            var activeSkill = stats.equippedSkills[i];
            var activeRune = stats.equippedRunes[i];
            
            var skillSelect = "<select onchange='GhostRPG.setSkill(" + i + ", this.value); UpdateNavbarSpells();' class='rpg-select' style='width:145px; font-size:11px; padding: 2px 4px;'>";
            for (var s = 0; s < skillsList.length; s++) {
                skillSelect += "<option value='" + skillsList[s].id + "' " + (skillsList[s].id === activeSkill ? "selected" : "") + ">" + skillsList[s].name + "</option>";
            }
            skillSelect += "</select>";

            var runeSelect = "<select onchange='GhostRPG.setRune(" + i + ", this.value); UpdateNavbarSpells();' class='rpg-select' style='width:90px; font-size:11px; padding: 2px 4px;'>";
            for (var r = 0; r < runesList.length; r++) {
                runeSelect += "<option value='" + runesList[r].id + "' " + (runesList[r].id === activeRune ? "selected" : "") + ">" + runesList[r].name + "</option>";
            }
            runeSelect += "</select>";

            customizationHTML += "<div style='display:flex; justify-content:space-between; align-items:center; font-size:12px;'>" +
                                 "<span><b>[" + slotNames[i] + "]</b></span>" +
                                 "<div style='display:flex; gap:6px;'>" + skillSelect + runeSelect + "</div>" +
                                 "</div>";
        }
        customizationHTML += "</div>";

        var infoSectionHTML = 
            "<hr style='border-color: rgba(255,255,255,0.1); margin: 8px 0;'>" +
            "<h4 style='color: var(--cyan-neon); margin: 0 0 4px 0; text-align: center; font-size: 13px; letter-spacing: 0.5px;'>📖 RPG MANUAL</h4>" +
            "<div style='max-height: 105px; overflow-y: auto; padding-right: 4px; font-size: 11px; line-height: 1.35; color: var(--text-muted); display: flex; flex-direction: column; gap: 6px;'>" +
              "<div><strong style='color:#FFF;'>SPELLS:</strong><br>" +
              "• <b style='color:var(--magenta-neon);'>[V] Spectral Spark:</b> Fires a quick magic projectile.<br>" +
              "• <b style='color:var(--magenta-neon);'>[F] Ghost Mode:</b> Turn invisible to pass hazards & glide.<br>" +
              "• <b style='color:var(--magenta-neon);'>[E] Plasma Orb:</b> Spawn a floating orb that shocks nearby targets.<br>" +
              "• <b style='color:var(--magenta-neon);'>[R] Phantom Form:</b> Turn into a larger ghost with double blast power.</div>" +
              "<div><strong style='color:#FFF;'>ATTRIBUTES:</strong><br>" +
              "• <b style='color:var(--yellow-neon);'>VIT:</b> Boosts maximum health (HP) and recovery.<br>" +
              "• <b style='color:var(--yellow-neon);'>AGI:</b> Boosts movement speed and jumps.<br>" +
              "• <b style='color:var(--yellow-neon);'>INT:</b> Boosts maximum energy (MP) for spells.<br>" +
              "• <b style='color:var(--yellow-neon);'>POW:</b> Boosts weapon strike damage.<br>" +
              "• <b style='color:var(--yellow-neon);'>MAG:</b> Boosts magic spell/rune base damage.</div>" +
            "</div>";

        panelContent.innerHTML = customizationHTML + infoSectionHTML;
    } catch(err) {
        console.warn("UpdateNavbarSpells Error", err);
    }
}
window.UpdateNavbarSpells = UpdateNavbarSpells;

window.GhostRPG = window.GhostRPG || {};
window.RenderRPGStatusDrawer = RenderRPGStatusDrawer;

function StartGameFromMenu() {
    var overlay = document.getElementById('mainMenuOverlay');
    if (overlay) overlay.style.display = 'none';

    if (window.OpenCharacterSelection) {
        window.OpenCharacterSelection();
    }
}

function OpenCharacterSelection() {
    var overlay = document.getElementById('characterSelectionOverlay');
    if (overlay) overlay.style.display = 'flex';

    if (!window.g_desoPublicKey) {
        if (typeof window.DisplayCharacterSelectionScreen === "function") {
            window.DisplayCharacterSelectionScreen([]);
        }
    } else {
        if (typeof window.LoadRPGStateFromDeSo === "function") {
            window.LoadRPGStateFromDeSo(window.g_desoPublicKey, true);
        }
    }
}

function CancelCharacterSelection() {
    var overlay = document.getElementById('characterSelectionOverlay');
    if (overlay) overlay.style.display = 'none';
    var menu = document.getElementById('mainMenuOverlay');
    if (menu) menu.style.display = 'flex';
}

function CloseCharacterSelection() {
    var overlay = document.getElementById('characterSelectionOverlay');
    if (overlay) overlay.style.display = 'none';
}

function OpenCodexMenu() {
    window.open("codex.html", "_blank");
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, 
        function(tag) { return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]); });
}

window.StartGameFromMenu = StartGameFromMenu;
window.OpenCharacterSelection = OpenCharacterSelection;
window.CancelCharacterSelection = CancelCharacterSelection;
window.CloseCharacterSelection = CloseCharacterSelection;
window.OpenCodexMenu = OpenCodexMenu;
window.escapeHTML = escapeHTML;

window.ToggleFullscreen = function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function(err) {
            console.warn("Error attempting to enable fullscreen: " + err.message);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

// Intercept DisplayCharacterSelectionScreen to handle Guest -> Wallet transition
(function() {
    var originalDisplayCharScreen = window.DisplayCharacterSelectionScreen;
    window.DisplayCharacterSelectionScreen = function(characters) {
        if (window.g_justConnectedWallet) {
            window.g_justConnectedWallet = false; // Reset the flag
            
            var localLevel = 1;
            try {
                var saved = localStorage.getItem("DangerGhost_RPG_Save");
                if (saved) {
                    var decrypted = (window.SafeAtob || atob)(saved);
                    var parts = decrypted.split("||");
                    var localData = JSON.parse(parts[0]);
                    localLevel = parseInt(localData.level, 10) || 1;
                }
            } catch(e) {
                console.warn("Failed to read local save:", e);
            }

            var maxBlockchainLevel = 1;
            if (characters && characters.length > 0) {
                characters.forEach(function(char) {
                    var lvl = parseInt(char.level, 10) || 1;
                    if (lvl > maxBlockchainLevel) {
                        maxBlockchainLevel = lvl;
                    }
                });
            }

            if (localLevel > 1 && localLevel > maxBlockchainLevel) {
                var confirmMsg = "You have local progress (Level " + localLevel + ") higher than your wallet save (Level " + maxBlockchainLevel + "). Do you want to save your local progress to the blockchain? (OK = Sync local, Cancel = Load from blockchain)";
                if (confirm(confirmMsg)) {
                    if (typeof window.TriggerRPGSaveToDeSo === "function") {
                        window.TriggerRPGSaveToDeSo();
                    }
                    return; // Skip displaying selection screen to complete local sync
                }
            }
        }

        if (typeof originalDisplayCharScreen === "function") {
            originalDisplayCharScreen(characters);
        } else {
            console.warn("Original DisplayCharacterSelectionScreen not found");
        }
    };
})();

window.g_isGuestRun = false;

function StartDeSoPlayFlow() {
    window.g_isGuestRun = false;
    if (!window.g_desoPublicKey) {
        if (typeof window.LoginDeSo === "function") {
            window.LoginDeSo();
        }
    } else {
        var menu = document.getElementById("mainMenuOverlay");
        if (menu) menu.style.display = "none";
        if (typeof window.OpenCharacterSelection === "function") {
            window.OpenCharacterSelection();
        }
    }
}

function StartGuestPlayFlow() {
    window.g_isGuestRun = true;
    var menu = document.getElementById("mainMenuOverlay");
    if (menu) menu.style.display = "none";
    
    window.g_score = 0;
    if (window.GhostRPG && window.GhostRPG.resetStats) {
        window.GhostRPG.resetStats();
    }
    
    if (window.g_gameState === window.G_START) {
        if (typeof window.StartCutscene === "function") {
            window.StartCutscene();
        }
    } else {
        window.g_gamePaused = false;
        if (typeof window.PlayBGM === "function") {
            window.PlayBGM();
        }
    }
    
    if (typeof window.RequestGameFullscreen === "function") {
        window.RequestGameFullscreen();
    }
    var btn = document.getElementById("gameScreenModeBtn");
    if (btn) btn.style.display = "block";
}

function ToggleGameFullscreen() {
    var container = document.getElementById("fullscreenGameArea");
    if (!document.fullscreenElement) {
        if (container && container.requestFullscreen) {
            container.requestFullscreen().then(function() {
                var btn = document.getElementById("gameScreenModeBtn");
                if (btn) btn.innerText = "MINIMIZE 🗗";
            }).catch(function(err) {
                console.warn("Fullscreen request failed:", err);
            });
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(function() {
                var btn = document.getElementById("gameScreenModeBtn");
                if (btn) btn.innerText = "MAXIMIZE 🗖";
            }).catch(function(err) {
                console.warn("Exit fullscreen failed:", err);
            });
        }
    }
}

function RequestGameFullscreen() {
    var container = document.getElementById("fullscreenGameArea");
    if (container && container.requestFullscreen) {
        container.requestFullscreen().then(function() {
            var btn = document.getElementById("gameScreenModeBtn");
            if (btn) btn.innerText = "MINIMIZE 🗗";
        }).catch(function(err) {
            console.warn("Fullscreen request failed:", err);
        });
    }
}

window.StartDeSoPlayFlow = StartDeSoPlayFlow;
window.StartGuestPlayFlow = StartGuestPlayFlow;
window.ToggleGameFullscreen = ToggleGameFullscreen;
window.RequestGameFullscreen = RequestGameFullscreen;

document.addEventListener("fullscreenchange", function() {
    var btn = document.getElementById("gameScreenModeBtn");
    if (btn) {
        if (document.fullscreenElement) {
            btn.innerText = "MINIMIZE 🗗";
        } else {
            btn.innerText = "MAXIMIZE 🗖";
        }
    }
});
