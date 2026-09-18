// --- Danger Ghost UI Manager ---
// This file handles DOM updates, overlays, and Menus

function ToggleNavbarTab(tab) {
    try {
        var now = Date.now();
        if (typeof g_lastTabClickTick === 'undefined') window.g_lastTabClickTick = 0;
        if (now - g_lastTabClickTick < 50) return;
        g_lastTabClickTick = now;

        // 16/09/2026 — BAG/EQUIP/SPELLS/STATUS saíram do .overlay-panel (300x300px
        // travado com !important, e compartilhado com chat/controles/Ghostdex) e
        // viraram uma modal só, no mesmo shell do baú. Estas 4 abas são
        // interceptadas aqui; 'controls', 'chat' e 'ghostdex' seguem no painel
        // lateral de sempre, intocados. Ver bloco "MODAL DE INVENTÁRIO" no fim
        // deste arquivo.
        if (DG_INV_TABS.indexOf(tab) !== -1) {
            var legacyRight = document.getElementById("navbarPanel");
            var legacyLeft = document.getElementById("rpgPanel");
            var legacyChat = document.getElementById("chatPanel");
            if (legacyRight) legacyRight.style.display = "none";
            if (legacyLeft) legacyLeft.style.display = "none";
            if (legacyChat) legacyChat.style.display = "none";
            ToggleInventoryModal(tab);
            return;
        }

        // Indo pra uma aba de painel lateral com a modal aberta: fecha a modal
        // antes, senão o overlay (z-index 2000) fica por cima do painel que o
        // jogador acabou de pedir.
        if (g_dgInvOpen) CloseInventoryModal();

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
        var btnGhostdex = document.getElementById("btnNavGhostdex");
        
        [btnControls, btnRPG, btnSpells, btnBag, btnEquip, btnChat, btnGhostdex].forEach(function(btn) {
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
        } else if (tab === 'ghostdex') {
            if (rightPanel) rightPanel.style.display = "flex";
            if (btnGhostdex) {
                btnGhostdex.style.background = "rgba(153,50,204,0.2)";
                btnGhostdex.style.borderColor = "#9932CC";
                btnGhostdex.style.boxShadow = "0 0 12px #9932CC";
            }
            if (typeof window.InitializeGhostdex === 'function') {
                window.InitializeGhostdex();
            }
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
        // A Bag agora vive na modal (ver "MODAL DE INVENTÁRIO" no fim do arquivo).
        // Este guard existe porque rpg_system.js chama UpdateNavbarBag() sempre que
        // o inventário muda (addItem/discardItem/equipItem) — redirecionar aqui
        // mantém aquele contrato funcionando SEM editar rpg_system.js.
        if (g_dgInvOpen) { RenderInventoryModal(); return; }

        var panelContent = document.getElementById("navbarPanelContent");
        if (!panelContent) return;
        
        var stats = window.GhostRPG ? GhostRPG.getStats() : { inventory: [] };
        var items = stats.inventory || [];
        
        var gridHTML = "<div style='max-height: 120px; overflow-y: auto; padding-right: 4px; border: 1px solid rgba(255,255,255,0.1); padding: 4px; border-radius: 4px; margin-bottom: 8px;'>" +
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
                gridHTML += "<div onclick=\"SelectBagItem('" + escapeHTML(item.id) + "')\" class='bag-grid-slot' style='position: relative; " + isSelectedStyle + "' title='" + escapeHTML(item.name) + "'>" +
                    iconHtml + 
                    (item.count > 1 ? "<span style='position: absolute; bottom: 1px; right: 2px; font-size: 9px; font-weight: bold; background: #000; color: #FFA500; padding: 0px 2px; border-radius: 2px; border: 1px solid #FFA500;'>x" + item.count + "</span>" : "") +
                    "<span onclick=\"event.stopPropagation(); DeleteItem(" + i + ")\" style='position: absolute; top: -5px; right: -5px; cursor: pointer; font-size: 11px; z-index: 10; background: rgba(0,0,0,0.6); border-radius: 50%; padding: 2px;' title='Delete'>🗑️</span>" +
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
                
                var qualityColor = ItemQualityColor(selectedItem.quality);

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
                // Affixes (prefixo/sufixo, 16/09/2026) — o Bag já mostrava `attributes`, mas os
                // affixes novos ficariam invisíveis aqui se não fossem listados à parte.
                var affixLines = FormatItemAffixLines(selectedItem);
                if (affixLines) attrHTML += affixLines;
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
                if (selectedItem.slot || selectedItem.id === "ghost_helmet" || selectedItem.id === "ghost_spell" || selectedItem.id === "elixir") {
                    actionBtn = "<button onclick=\"EquipBagItem('" + escapeHTML(selectedItem.id) + "')\" class='bag-equip-btn' style='padding: 6px; margin: 0; font-size: 11px; flex: 1;'>EQUIP</button>";
                }
                actionBtn += "<button onclick=\"DiscardBagItem('" + escapeHTML(selectedItem.id) + "')\" class='bag-discard-btn' style='padding: 6px; margin: 0; font-size: 11px; background: rgba(255, 51, 102, 0.2); border: 1.5px solid #FF3366; color: #FF3366; cursor: pointer; border-radius: 4px; font-family: var(--font-title); font-weight: bold; text-shadow: 0 0 4px #FF3366; box-shadow: 0 0 8px rgba(255, 51, 102, 0.25); transition: all 0.2s ease-in-out; flex: 1;' onmouseover=\"this.style.background='rgba(255, 51, 102, 0.4)'; this.style.boxShadow='0 0 12px #FF3366';\" onmouseout=\"this.style.background='rgba(255, 51, 102, 0.2)'; this.style.boxShadow='0 0 8px rgba(255, 51, 102, 0.25)';\">DISCARD</button>";

                detailsHTML += "<div class='bag-details-info'>" +
                    "<div style='color: " + qualityColor + "; font-weight: bold; font-size: 13px; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;'><span>" + selectedIconHtml + "</span> " + escapeHTML(selectedItem.name) + "</div>" +
                    "<div style='margin-bottom: 4px; line-height: 1.35; color: var(--text-main); font-size: 11px;'>" + escapeHTML(selectedItem.description) + "</div>" +
                    "<div style='font-size: 11px; line-height: 1.3;'>" + attrHTML + "</div>" +
                    "</div>" +
                    "<div class='bag-details-actions'>" + actionBtn + "</div>";
            } else {
                detailsHTML += "<div class='bag-details-info' style='display: flex; align-items: center; justify-content: center; min-height: 110px;'>" +
                    "<p style='text-align: center; color: var(--text-muted); font-size: 12px; margin: 0;'>SELECT AN ITEM FOR DETAILS</p>" +
                    "</div>";
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

function DeleteItem(index) {
    var stats = window.GhostRPG ? GhostRPG.getStats() : { inventory: [] };
    var items = stats.inventory || [];
    if (index >= 0 && index < items.length) {
        var item = items[index];
        if (confirm("Are you sure you want to delete this item? This action is permanent!")) {
            if (window.DiscardInventoryItem && window.DiscardInventoryItem(item.id)) {
                if (g_selectedBagItemId === item.id) g_selectedBagItemId = null;
                UpdateNavbarBag();
            }
        }
    }
}

// ============================================================================
// 2026-09-04 (baú de conta / cemitério, plano crystalline-launching-goose.md) —
// Modal do baú, 1000 slots por CONTA (window.g_chestItems, ver
// js/game/engine.js:loadChestItemsFromCloudProfile e
// server/db.js:chest_items — Track A, não tocado aqui). Reaproveita a MESMA
// estrutura visual de UpdateNavbarBag() acima (.bag-grid-slot 6 colunas,
// seleção com borda magenta, painel de detalhes .bag-details-*), mas dentro do
// shell de modal já usado por loreModal/interactiveTutorialModal
// (.tutorial-modal-overlay/-container/-header/-close-btn, ver css/style.css) —
// o painel da navbar é pequeno demais pra até 1000 itens, e o pedido do
// usuário foi explícito: modal PRÓPRIA, maior, centralizada, overlay escuro.
//
// PAGINAÇÃO (diferença central pro Bag, que usa um loop fixo de 100 divs
// porque o inventário do ghost tem teto de 100): renderizar até 1000 divs de
// uma vez travaria a UI (pedido explícito do usuário) — CHEST_MODAL_PAGE_SIZE
// fatia window.g_chestItems em páginas de 60 (múltiplo de 6, enche a grade
// sem sobra visual na maioria das páginas).
//
// DUAS fontes de item na mesma modal, não uma só: o inventário do ghost ATIVO
// (coluna esquerda, pra poder GUARDAR algo nele) e o próprio baú da conta
// (coluna central, paginada, pra DESCARTAR/TRANSFERIR) — um pedido do usuário
// só faz sentido lendo os 3 botões juntos ("GUARDAR: remove do inventário do
// ghost ATIVO... DESCARTAR/TRANSFERIR: [do baú]") se as duas listas convivem
// na mesma tela; um item só fica selecionado por vez (g_chestSelection, com
// `source` marcando de qual lista veio), porque os botões disponíveis
// dependem de qual das duas é a origem.
// ============================================================================
var CHEST_MODAL_PAGE_SIZE = 60;
var g_chestPage = 0;
var g_chestSelection = null;            // null | {source:'bag', id} | {source:'chest', index}
var g_chestTransferOpenForIndex = null; // index em window.g_chestItems cujo submenu TRANSFERIR está aberto, ou null

// Mesma lógica de ícone que UpdateNavbarBag() já tinha inline (2x, pro grid e
// pro painel de detalhes) — extraída aqui pra não triplicar (o baú soma mais
// dois lugares: grid do baú e grid do inventário-na-modal).
function chestIconHtml(item) {
    var iconHtml = item && item.icon;
    if (item && item.id === "blue_key") {
        return "<img src='assets/sprites/Blue key (1).webp' style='width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;' />";
    } else if (iconHtml && iconHtml.indexOf("<img") === -1 && iconHtml.indexOf("/") !== -1) {
        return "<img src='" + escapeHTML(iconHtml) + "' style='width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;' />";
    }
    return iconHtml || '';
}

function OpenChestModal() {
    try {
        // Re-sincroniza window.g_chestItems com dg_cloud_profile antes de renderizar —
        // cobre o caso de o login ter terminado DEPOIS do boot de engine.js (ver
        // comentário completo em js/game/engine.js:loadChestItemsFromCloudProfile).
        if (typeof window.LoadChestItemsFromCloudProfile === 'function') {
            window.LoadChestItemsFromCloudProfile();
        }
        if (!Array.isArray(window.g_chestItems)) window.g_chestItems = [];

        g_chestPage = 0;
        g_chestSelection = null;
        g_chestTransferOpenForIndex = null;

        // 04/09/2026 (bug real reportado: baú "trava o jogo mas não aparece" em
        // fullscreen) — a Fullscreen API do navegador só renderiza o elemento que
        // está de fato em fullscreen E seus DESCENDENTES; qualquer nó fora dessa
        // subárvore (mesmo com position:fixed/z-index alto) some da tela sem sumir
        // do DOM. O botão de fullscreen do JOGO (ToggleGameFullscreen(), ~linha 1062
        // abaixo) coloca em fullscreen #fullscreenGameArea, não document.documentElement
        // — então um overlay preso em document.body (ancestral de #fullscreenGameArea,
        // não descendente) fica invisível, mas OverworldSetInputLocked(true) já rodou:
        // o jogador vê o jogo "travado" com o input preso e nenhum modal na tela.
        // Resolve escolhendo o alvo dinamicamente: se ALGUM elemento estiver em
        // fullscreen agora (document.fullscreenElement — cobre tanto o fullscreen do
        // jogo quanto o fullscreen genérico do navegador via ToggleFullscreen()),
        // anexa o overlay DENTRO dele; senão, comportamento antigo (document.body).
        // Sem hardcode de #fullscreenGameArea de propósito — funciona pra qualquer
        // elemento que esteja realmente em fullscreen no momento em que o baú abre.
        var chestModalMountTarget = document.fullscreenElement || document.body;
        var overlay = document.getElementById('chestModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'chestModalOverlay';
            overlay.className = 'tutorial-modal-overlay';
            chestModalMountTarget.appendChild(overlay);
        } else if (overlay.parentElement !== chestModalMountTarget) {
            // Baú já existia no DOM de uma abertura anterior, mas o contexto de
            // fullscreen mudou desde então (ex.: abriu fora, entrou em fullscreen,
            // abriu de novo) — parentElement antigo pode estar fora da subárvore
            // visível agora. appendChild() de um nó que já existe no documento MOVE
            // o nó (não duplica, não recria listeners inline via onclick="..."),
            // então isso realoca o overlay pro lugar certo sem perder estado.
            chestModalMountTarget.appendChild(overlay);
        }
        overlay.style.display = 'block'; // mesma convenção de display já usada por interactiveTutorialModal (js/game/engine.js)
        RenderChestModal();

        // Trigger de entrada no overworld já chamou isto ANTES de disparar
        // chest_entry (ver POI_INTERACTION_HANDLERS.chest_entry, overworld.js) — mas
        // OpenChestModal() também pode ser aberto de outros pontos futuros, então
        // garante a trava aqui também (idempotente, sem custo chamar 2x).
        if (typeof window.OverworldSetInputLocked === 'function') window.OverworldSetInputLocked(true);
    } catch (err) {
        console.warn('OpenChestModal Error', err);
    }
}

function CloseChestModal() {
    try {
        var overlay = document.getElementById('chestModalOverlay');
        if (overlay) overlay.style.display = 'none';
        g_chestTransferOpenForIndex = null;
        if (typeof window.OverworldSetInputLocked === 'function') window.OverworldSetInputLocked(false);
    } catch (err) {
        console.warn('CloseChestModal Error', err);
    }
}
window.OpenChestModal = OpenChestModal;
window.CloseChestModal = CloseChestModal;

function RenderChestModal() {
    try {
        var overlay = document.getElementById('chestModalOverlay');
        if (!overlay) return;

        var bagStats = window.GhostRPG ? GhostRPG.getStats() : { inventory: [] };
        var bagItems = bagStats.inventory || [];
        var chestItems = Array.isArray(window.g_chestItems) ? window.g_chestItems : [];

        // ---- coluna esquerda: inventário do ghost ATIVO (fonte do GUARDAR) --------
        var bagGridHTML = "<div style='display:grid; grid-template-columns:repeat(4,1fr); gap:6px; max-height:380px; overflow-y:auto; padding-right:4px;'>";
        if (bagItems.length === 0) {
            bagGridHTML += "<div style='grid-column:1/-1; text-align:center; color:var(--text-muted); font-size:11px; padding:10px 0;'>Empty inventory</div>";
        }
        for (var bi = 0; bi < bagItems.length; bi++) {
            var bItem = bagItems[bi];
            var bSel = g_chestSelection && g_chestSelection.source === 'bag' && g_chestSelection.id === bItem.id;
            bagGridHTML += "<div onclick=\"SelectChestBagItem('" + escapeHTML(bItem.id) + "')\" class='bag-grid-slot' style='position:relative;" + (bSel ? "border:2px solid var(--magenta-neon); box-shadow:0 0 8px var(--magenta-neon);" : "") + "' title='" + escapeHTML(bItem.name || '') + "'>" +
                chestIconHtml(bItem) +
                (bItem.count > 1 ? "<span style='position:absolute; bottom:1px; right:2px; font-size:9px; font-weight:bold; background:#000; color:#FFA500; padding:0px 2px; border-radius:2px; border:1px solid #FFA500;'>x" + bItem.count + "</span>" : "") +
                "</div>";
        }
        bagGridHTML += "</div>";

        // ---- coluna central: baú da conta, PAGINADO (nunca os 1000 de uma vez) ----
        var totalPages = Math.max(1, Math.ceil(chestItems.length / CHEST_MODAL_PAGE_SIZE));
        if (g_chestPage >= totalPages) g_chestPage = totalPages - 1;
        if (g_chestPage < 0) g_chestPage = 0;
        var pageStart = g_chestPage * CHEST_MODAL_PAGE_SIZE;
        var pageItems = chestItems.slice(pageStart, pageStart + CHEST_MODAL_PAGE_SIZE);

        var chestGridHTML = "<div style='display:grid; grid-template-columns:repeat(6,1fr); gap:6px;'>";
        if (chestItems.length === 0) {
            chestGridHTML += "<div style='grid-column:1/-1; text-align:center; color:var(--text-muted); font-size:12px; padding:24px 0;'>The chest is empty.</div>";
        }
        for (var ci = 0; ci < pageItems.length; ci++) {
            var globalIdx = pageStart + ci;
            var cItem = pageItems[ci];
            var cSel = g_chestSelection && g_chestSelection.source === 'chest' && g_chestSelection.index === globalIdx;
            chestGridHTML += "<div onclick=\"SelectChestItem(" + globalIdx + ")\" class='bag-grid-slot' style='position:relative;" + (cSel ? "border:2px solid var(--magenta-neon); box-shadow:0 0 8px var(--magenta-neon);" : "") + "' title='" + escapeHTML(cItem.name || '') + "'>" +
                chestIconHtml(cItem) +
                (cItem.count > 1 ? "<span style='position:absolute; bottom:1px; right:2px; font-size:9px; font-weight:bold; background:#000; color:#FFA500; padding:0px 2px; border-radius:2px; border:1px solid #FFA500;'>x" + cItem.count + "</span>" : "") +
                "</div>";
        }
        // Preenche até múltiplo de 6 só com slots vazios DESTA página (nunca mais que
        // 5 sobrando — page size é múltiplo de 6), mesmo visual do Bag.
        var remainder = pageItems.length % 6;
        if (pageItems.length > 0 && remainder !== 0) {
            for (var pad = remainder; pad < 6; pad++) {
                chestGridHTML += "<div class='bag-grid-slot' style='border:1px dashed rgba(255, 0, 255, 0.2); color:rgba(255,255,255,0.15); cursor:default;'>-</div>";
            }
        }
        chestGridHTML += "</div>";

        var pagerHTML = "<div style='display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:11px; color:var(--text-muted); gap:8px;'>" +
            "<button onclick='ChestModalPrevPage()'" + (g_chestPage <= 0 ? " disabled" : "") + " class='bag-equip-btn' style='width:auto; margin:0; padding:4px 10px; font-size:10px;'>&larr; PREVIOUS</button>" +
            "<span>Page " + (g_chestPage + 1) + "/" + totalPages + " — " + chestItems.length + "/1000 items</span>" +
            "<button onclick='ChestModalNextPage()'" + (g_chestPage >= totalPages - 1 ? " disabled" : "") + " class='bag-equip-btn' style='width:auto; margin:0; padding:4px 10px; font-size:10px;'>NEXT &rarr;</button>" +
            "</div>";

        var detailsHTML = RenderChestDetailsPanel(bagItems, chestItems);

        var bodyHTML =
            "<div style='display:flex; gap:16px; padding:16px; flex-wrap:wrap; align-items:flex-start;'>" +
            "<div style='flex:0 0 210px;'>" +
            "<h3 style='margin:0 0 8px 0; color:var(--cyan-neon); font-size:13px; font-family:var(--font-title); letter-spacing:1px;'>YOUR INVENTORY</h3>" +
            bagGridHTML +
            "</div>" +
            "<div style='flex:1 1 380px; min-width:300px;'>" +
            "<h3 style='margin:0 0 8px 0; color:var(--magenta-neon); font-size:13px; font-family:var(--font-title); letter-spacing:1px;'>🪦 GRAVEYARD CHEST</h3>" +
            chestGridHTML +
            pagerHTML +
            "</div>" +
            "<div style='flex:0 0 240px;'>" +
            detailsHTML +
            "</div>" +
            "</div>";

        overlay.innerHTML =
            "<div class='tutorial-modal-container' style='max-width:920px; height:auto; max-height:88vh; margin:30px auto;'>" +
            "<div class='tutorial-modal-header'>" +
            "<h2>🪦 Account Chest</h2>" +
            "<button class='tutorial-close-btn' onclick='CloseChestModal()'>Close [X]</button>" +
            "</div>" +
            "<div class='tutorial-modal-body' style='display:block; overflow-y:auto;'>" + bodyHTML + "</div>" +
            "</div>";
    } catch (err) {
        console.warn('RenderChestModal Error', err);
    }
}

// Painel de detalhes/ações compartilhado — o que aparece nele depende de QUAL
// das duas listas (bag/chest) tem o item selecionado agora (g_chestSelection),
// ou do submenu de transferência (g_chestTransferOpenForIndex) por cima disso.
function RenderChestDetailsPanel(bagItems, chestItems) {
    if (g_chestTransferOpenForIndex !== null) {
        var xferItem = chestItems[g_chestTransferOpenForIndex];
        if (!xferItem) {
            g_chestTransferOpenForIndex = null;
            return RenderChestDetailsPanel(bagItems, chestItems);
        }
        var roster = GetOwnedCharactersRoster();
        var html = "<div class='bag-details-container'><div class='bag-details-info'>" +
            "<div style='color:var(--yellow-neon); font-weight:bold; font-size:12px; margin-bottom:8px;'>Transfer<br>\"" + escapeHTML(xferItem.name || '') + "\"<br>to:</div>";
        if (roster.length === 0) {
            html += "<div style='color:var(--text-muted); font-size:11px;'>No ghosts found on this account.</div>";
        } else {
            html += "<div style='display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto;'>";
            for (var ri = 0; ri < roster.length; ri++) {
                var g = roster[ri];
                if (!g || !g.characterId) continue;
                // 04/09/2026 (pedido do usuário): antes cada linha era só o NOME em texto puro,
                // sem nenhuma relação visual com o resto do jogo. Agora cada card usa a mesma
                // thumbnail + cadeia de fallback de sprite que a Ghostdex já usa em
                // RenderGhostdexInNavbar() (js/game/ghostdex_ui.js) — mesmo padrão de 3 caminhos
                // que overworld.js:ghostSpritePaths() também replica — pra manter consistência
                // de identidade visual entre as telas onde um ghost aparece.
                // g.characterId só carrega um ID de espécie real do catálogo quando tem o
                // prefixo "ghost_" (ex. "ghost_002" -> ID "002" pro sprite). Um fantasma FORJADO
                // ("dg_local_...", ver game_core.js) não tem espécie de catálogo nenhuma, então
                // não existe sprite pra buscar — cai no emoji genérico 👻, o mesmo fallback que
                // friends.js:BuildFriendAvatarNode() já usa pra avatar sem imagem, em vez de
                // inventar um placeholder novo pro jogo.
                var thumbHtml;
                if (g.characterId.indexOf('ghost_') === 0) {
                    var speciesId = escapeHTML(g.characterId.replace('ghost_', ''));
                    thumbHtml = "<img src='Ghosts/%23" + speciesId + ".png' onerror='this.onerror=null;this.src=\"Ghosts/" + speciesId + ".png\";this.onerror=function(){this.onerror=null;this.src=\"assets/sprites/ghost_" + speciesId + "_r.webp\";};' style='width:24px;height:24px;image-rendering:pixelated;filter:drop-shadow(0 0 5px #00FFFF);flex-shrink:0;' />";
                } else {
                    thumbHtml = "<span style='width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;'>&#128123;</span>";
                }
                // Cor do nome segue a paleta já usada no baú (var(--yellow-neon)), não a verde
                // da Ghostdex — o baú reaproveita classes visuais da Bag/Ghostdex por
                // conveniência, mas tem identidade de cor própria (magenta/amarelo neon).
                html += "<button onclick=\"ConfirmTransferChestItem('" + escapeHTML(g.characterId) + "')\" style='display:flex; align-items:center; gap:8px; text-align:left; padding:6px 8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.15); color:var(--text-main); border-radius:4px; cursor:pointer; font-size:11px;'>" + thumbHtml + "<span style='color:var(--yellow-neon); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;'>" + escapeHTML(g.name || g.characterId) + "</span></button>";
            }
            html += "</div>";
        }
        html += "</div><div class='bag-details-actions'><button onclick='CancelTransferChestItem()' class='bag-discard-btn' style='flex:1;'>CANCEL</button></div></div>";
        return html;
    }

    if (!g_chestSelection) {
        return "<div class='bag-details-container'><div class='bag-details-info' style='display:flex; align-items:center; justify-content:center; min-height:220px;'>" +
            "<p style='text-align:center; color:var(--text-muted); font-size:12px; margin:0;'>SELECT AN ITEM</p></div></div>";
    }

    var item, actionsHTML;
    if (g_chestSelection.source === 'bag') {
        item = bagItems.find(function (i) { return i.id === g_chestSelection.id; });
        if (!item) { g_chestSelection = null; return RenderChestDetailsPanel(bagItems, chestItems); }
        actionsHTML = "<button onclick=\"StoreActiveGhostItemInChest('" + escapeHTML(item.id) + "')\" class='bag-equip-btn' style='flex:1;'>STORE IN CHEST</button>";
    } else {
        item = chestItems[g_chestSelection.index];
        if (!item) { g_chestSelection = null; return RenderChestDetailsPanel(bagItems, chestItems); }
        actionsHTML =
            "<button onclick='OpenTransferChestSubmenu(" + g_chestSelection.index + ")' class='bag-equip-btn' style='flex:1;'>TRANSFER</button>" +
            "<button onclick=\"DiscardChestItem(" + g_chestSelection.index + ")\" class='bag-discard-btn' style='flex:1;'>DISCARD</button>";
    }

    return "<div class='bag-details-container'><div class='bag-details-info'>" +
        "<div style='color:#fff; font-weight:bold; font-size:13px; margin-bottom:4px; display:flex; align-items:center; gap:6px;'><span>" + chestIconHtml(item) + "</span> " + escapeHTML(item.name || '') + "</div>" +
        "<div style='margin-bottom:4px; line-height:1.35; color:var(--text-main); font-size:11px;'>" + escapeHTML(item.description || '') + "</div>" +
        "</div><div class='bag-details-actions'>" + actionsHTML + "</div></div>";
}

function SelectChestBagItem(itemId) {
    g_chestSelection = { source: 'bag', id: itemId };
    g_chestTransferOpenForIndex = null;
    RenderChestModal();
}

function SelectChestItem(globalIndex) {
    g_chestSelection = { source: 'chest', index: globalIndex };
    g_chestTransferOpenForIndex = null;
    RenderChestModal();
}

function ChestModalPrevPage() {
    if (g_chestPage > 0) { g_chestPage--; g_chestSelection = null; RenderChestModal(); }
}

function ChestModalNextPage() {
    g_chestPage++; g_chestSelection = null; RenderChestModal();
}

// GUARDAR — move o item selecionado do inventário do ghost ATIVO pro baú da
// conta. window.DiscardInventoryItem() remove a stack INTEIRA do ghost (mesma
// função que DiscardBagItem já usa) — mover parcialmente (só parte de um
// stack) não foi pedido, mesma granularidade de "guardar" que o resto do jogo
// usa pra mover item inteiro entre listas.
function StoreActiveGhostItemInChest(itemId) {
    if (!Array.isArray(window.g_chestItems)) window.g_chestItems = [];
    if (window.g_chestItems.length >= 1000) {
        alert('The chest is full (limit: 1000 items)!');
        return;
    }
    var stats = window.GhostRPG ? GhostRPG.getStats() : { inventory: [] };
    // GhostRPG.getStats() já devolve uma CÓPIA (JSON.parse(JSON.stringify(state)),
    // ver rpg_system.js) — `item` aqui já é independente do state.inventory
    // privado, não precisa clonar de novo antes do discardItem() abaixo mexer
    // no original.
    var item = (stats.inventory || []).find(function (i) { return i.id === itemId; });
    if (!item) return;
    if (!window.DiscardInventoryItem || !window.DiscardInventoryItem(itemId)) return;
    window.g_chestItems.push(item);
    if (window.SyncChestItemsToServer) window.SyncChestItemsToServer();
    g_chestSelection = null;
    RenderChestModal();
}

// DESCARTAR — remove permanentemente do baú, mesmo confirm() de segurança que
// DiscardBagItem() já usa pro Bag normal.
function DiscardChestItem(globalIndex) {
    if (!Array.isArray(window.g_chestItems) || !window.g_chestItems[globalIndex]) return;
    var item = window.g_chestItems[globalIndex];
    if (!confirm("Are you sure you want to discard \"" + (item.name || item.id) + "\" from the chest? This action is permanent!")) return;
    window.g_chestItems.splice(globalIndex, 1);
    if (window.SyncChestItemsToServer) window.SyncChestItemsToServer();
    g_chestSelection = null;
    RenderChestModal();
}

function OpenTransferChestSubmenu(globalIndex) {
    g_chestTransferOpenForIndex = globalIndex;
    RenderChestModal();
}

function CancelTransferChestItem() {
    g_chestTransferOpenForIndex = null;
    RenderChestModal();
}

function ConfirmTransferChestItem(targetCharacterId) {
    if (g_chestTransferOpenForIndex === null || !Array.isArray(window.g_chestItems)) return;
    var item = window.g_chestItems[g_chestTransferOpenForIndex];
    if (item && window.TransferChestItemToGhost) {
        window.TransferChestItemToGhost(item, targetCharacterId); // já remove do baú e sincroniza — ver rpg_system.js
    }
    g_chestTransferOpenForIndex = null;
    g_chestSelection = null;
    RenderChestModal();
}

// Lista de ghosts da conta pro submenu de TRANSFERIR — window.g_ownedCharacters
// (cache em memória, ver js/game/ghostdex_ui.js) com fallback pra
// localStorage.dg_local_characters direto se o cache ainda não foi populado
// nesta sessão (mesmo padrão defensivo já usado em outros pontos deste jogo).
function GetOwnedCharactersRoster() {
    if (Array.isArray(window.g_ownedCharacters) && window.g_ownedCharacters.length > 0) {
        return window.g_ownedCharacters;
    }
    try {
        var raw = localStorage.getItem('dg_local_characters');
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

// ============================================================================
// 16/09/2026 — superfície MÍNIMA da itemização nova (affixes, tier Legendary,
// defesa real). O redesenho visual completo do painel é uma onda separada; aqui
// só entra o necessário pra nenhuma mecânica nova ficar invisível pro jogador.
// ============================================================================
var AFFIX_LABELS = {
    defenseBonus:      { label: "DEF",       unit: "" },
    vitalityBonus:     { label: "VITALITY",  unit: "" },
    fireDamageBonus:   { label: "FIRE DMG",  unit: "%" },
    coldDamageBonus:   { label: "COLD DMG",  unit: "%" },
    manaRecoveryBonus: { label: "MANA",      unit: "" },
    lifeLeechPercent:  { label: "LIFE LEECH", unit: "%" },
    // Os dois abaixo são REFRAMES conscientes: o combate é de projétil, não tem rolagem de
    // acerto nem velocidade de ataque. O rótulo mostrado é o efeito REAL, não o nome do stat.
    accuracyRating:    { label: "PRECISION DMG", unit: "" },
    attackSpeedBonus:  { label: "CDR",       unit: "%" }
};

// 16/09/2026 — a paleta de raridade passou a ser a MESMA do resto do jogo, em
// vez de 4 hexes só dela: Common cinza apagado, Rare cyan, Epic magenta,
// Legendary amarelo (que no grid ainda ganha o pulso de .dg-rarity-legendary).
// Retorna var(--*) de propósito: essas cores entram tanto em style inline
// quanto em CSS, e assim um ajuste na paleta do :root chega aqui sozinho.
function ItemQualityColor(quality) {
    if (quality === "Rare") return "var(--cyan-neon)";
    if (quality === "Epic") return "var(--magenta-neon)";
    if (quality === "Legendary") return "var(--yellow-neon)";
    return "var(--text-muted)";
}

function FormatAffixText(affix) {
    if (!affix || !affix.stat) return "";
    var meta = AFFIX_LABELS[affix.stat] || { label: affix.stat, unit: "" };
    return "+" + (affix.value || 0) + meta.unit + " " + meta.label;
}

// Bloco <div> por affix (usado na ficha do Bag).
function FormatItemAffixLines(item) {
    if (!item || !item.affixes || !item.affixes.length) return "";
    var out = "";
    for (var i = 0; i < item.affixes.length; i++) {
        var txt = FormatAffixText(item.affixes[i]);
        if (txt) out += "<div style='color: #FFD54F;'>" + escapeHTML(txt) + "</div>";
    }
    return out;
}

// Linha única e curta (usada na lista do painel EQUIP, onde só cabe uma linha).
function FormatItemStatsInline(item) {
    if (!item) return "";
    var parts = [];
    if (item.baseDamage) parts.push("DMG " + item.baseDamage);
    if (item.baseDefense) parts.push("DEF " + item.baseDefense);
    if (item.attributes) {
        for (var k in item.attributes) {
            if (item.attributes[k]) parts.push("+" + item.attributes[k] + " " + k.toUpperCase());
        }
    }
    if (item.affixes) {
        for (var i = 0; i < item.affixes.length; i++) {
            var txt = FormatAffixText(item.affixes[i]);
            if (txt) parts.push(txt);
        }
    }
    return parts.join(" · ");
}

// Resumo do que o conjunto equipado concede AGORA (GhostRPG.getGearSummary()).
// É a única representação visível hoje de defesa/leech/CDR/regen — sem isso o jogador
// não teria como saber que esses números existem.
function FormatGearSummary() {
    if (!window.GhostRPG || typeof window.GhostRPG.getGearSummary !== "function") return "";
    var s;
    try { s = window.GhostRPG.getGearSummary(); } catch (e) { return ""; }
    if (!s) return "";
    var bits = [];
    bits.push("DEF " + s.defense + " (-" + Math.round((s.damageReduction || 0) * 100) + "% dmg)");
    if (s.fireBonus) bits.push("FIRE +" + s.fireBonus + "%");
    if (s.coldBonus) bits.push("COLD +" + s.coldBonus + "%");
    if (s.tierElementalBonus) bits.push("RARITY AURA +" + Math.round(s.tierElementalBonus * 100) + "% elem");
    if (s.mainhandMultiplier > 1) bits.push("WEAPON x" + s.mainhandMultiplier.toFixed(2));
    if (s.precisionDamage) bits.push("PRECISION +" + s.precisionDamage);
    if (s.lifeLeechPercent) bits.push("LEECH " + s.lifeLeechPercent + "%");
    if (s.cooldownReduction) bits.push("CDR " + Math.round(s.cooldownReduction * 100) + "%");
    if (s.manaCapBonus) bits.push("MANA +" + s.manaCapBonus);
    if (s.vitalityBars) bits.push("VITALITY +" + s.vitalityBars);
    return bits.join(" | ");
}

function UpdateNavbarEquip() {
    try {
        if (g_dgInvOpen) { RenderInventoryModal(); return; }

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
                var qualityColor = ItemQualityColor(item.quality);

                var iconHtml = item.icon || "⚙️";
                if (iconHtml.indexOf("<img") === -1 && iconHtml.indexOf("/") !== -1) {
                    iconHtml = "<img src='" + escapeHTML(iconHtml) + "' style='width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;' />";
                }

                // 16/09/2026: mostrava "Dmg:"/"Def:" — o primeiro campo que existisse no item e
                // só ele, ignorando atributos e affixes (a ficha do Bag já mostrava tudo, o
                // painel EQUIP não). Agora mostra os stats REAIS da peça, na mesma ordem.
                var bonusText = FormatItemStatsInline(item);

                html += "<div class='equip-slot-row equipped' style='border-color: " + qualityColor + "; --quality-color: " + qualityColor + ";'>" +
                    "<div class='equip-slot-info'>" +
                    "<span class='equip-slot-icon'>" + iconHtml + "</span>" +
                    "<div class='equip-slot-text'>" +
                    "<div class='equip-slot-name' style='color: " + qualityColor + ";'>" + escapeHTML(item.name) + "</div>" +
                    "<div class='equip-slot-type'>" + slot.name + (bonusText ? " | <span class='equip-slot-bonus'>" + escapeHTML(bonusText) + "</span>" : "") + "</div>" +
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

        html += "</div>";

        var gearSummary = FormatGearSummary();
        if (gearSummary) {
            html += "<div style='background: rgba(7, 7, 8, 0.6); border: 1px solid rgba(0, 229, 255, 0.25); padding: 6px 8px; border-radius: 6px; font-size: 10px; line-height: 1.4; color: #00E5FF; margin-bottom: 6px;'>" +
                "⚔️ <b>SET BONUS</b><br>" + escapeHTML(gearSummary) +
                "</div>";
        }

        // 16/09/2026: aqui ficava um aviso mandando o jogador "ir até a aba BAG pra
        // equipar" — instrução de um fluxo de mão única que não existe mais. Agora
        // clicar no slot (no paperdoll da modal) abre a Bag já filtrada pra ele.
        html += "<div style='background: rgba(7, 7, 8, 0.6); border: 1px solid rgba(255, 170, 0, 0.2); padding: 6px 8px; border-radius: 6px; font-size: 10px; line-height: 1.35; color: var(--text-muted);'>" +
            "ℹ️ <b>How to equip</b>: click an equipment slot &mdash; the bag opens filtered to what fits there." +
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
window.DeleteItem = DeleteItem;

// --- Egregora (POI social do overworld, 10/09/2026) ---
// Modal com link do Instagram + mural de mensagens compartilhado entre
// jogadores. Overlay/mount fullscreen-safe = mesmo padrão de OpenChestModal()/
// CloseChestModal() acima (ver comentário longo em OpenChestModal sobre por que
// não pode ser só document.body). Request/resposta via emitProfileRequest()
// (js/web2/profile.js:259), mesmo helper que get_diary_entries/post_diary_entry
// já usam. escapeHTML() (mais abaixo neste arquivo) em playerName/content de
// TODA mensagem antes de innerHTML — vem de outro jogador, é a superfície de
// XSS mais óbvia deste recurso. Contrato de rede com o servidor (Track A,
// server/index.js): post_egregora_message({content}) -> egregora_message_posted
// / egregora_error; get_egregora_messages({limit?, beforeId?}) ->
// egregora_messages_loaded({messages, hasMore}) / egregora_error.
var g_egregoraMessages = []; // cache local da última leitura, pra não precisar refazer get_egregora_messages a cada render

function OpenEgregoraModal() {
    try {
        var mountTarget = document.fullscreenElement || document.body;
        var overlay = document.getElementById('egregoraModalOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'egregoraModalOverlay';
            overlay.className = 'tutorial-modal-overlay';
            mountTarget.appendChild(overlay);
        } else if (overlay.parentElement !== mountTarget) {
            mountTarget.appendChild(overlay);
        }
        overlay.style.display = 'block';
        RenderEgregoraModal(); // mostra estado de "carregando" ou o cache antigo primeiro
        LoadEgregoraMessages(); // busca a lista fresca do servidor
        if (typeof window.OverworldSetInputLocked === 'function') window.OverworldSetInputLocked(true);
    } catch (err) {
        console.warn('OpenEgregoraModal Error', err);
    }
}

function CloseEgregoraModal() {
    try {
        var overlay = document.getElementById('egregoraModalOverlay');
        if (overlay) overlay.style.display = 'none';
        if (typeof window.OverworldSetInputLocked === 'function') window.OverworldSetInputLocked(false);
    } catch (err) {
        console.warn('CloseEgregoraModal Error', err);
    }
}
window.OpenEgregoraModal = OpenEgregoraModal;
window.CloseEgregoraModal = CloseEgregoraModal;

function LoadEgregoraMessages() {
    if (typeof window.emitProfileRequest !== 'function') return;
    window.emitProfileRequest('get_egregora_messages', {}, 'egregora_messages_loaded', 'egregora_error',
        function (result) {
            g_egregoraMessages = (result && Array.isArray(result.messages)) ? result.messages : [];
            RenderEgregoraModal();
        },
        function (err) {
            console.warn('LoadEgregoraMessages error', err);
        }
    );
}

function PostEgregoraMessage() {
    var input = document.getElementById('egregoraMessageInput');
    var content = input ? input.value.trim() : '';
    if (!content) return;
    if (typeof window.emitProfileRequest !== 'function') return;
    window.emitProfileRequest('post_egregora_message', { content: content }, 'egregora_message_posted', 'egregora_error',
        function (entry) {
            if (entry) g_egregoraMessages.unshift(entry); // nova mensagem no topo, sem esperar um get novo
            if (input) input.value = '';
            RenderEgregoraModal();
        },
        function (err) {
            alert((err && err.message) || 'Failed to send message.');
        }
    );
}
window.PostEgregoraMessage = PostEgregoraMessage;

// Mesmo formato de FormatDiaryDate() (js/web2/profile.js:861).
function formatEgregoraTimestamp(raw) {
    if (!raw) return '';
    var d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    try {
        return d.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return d.toLocaleString();
    }
}

function RenderEgregoraModal() {
    try {
        var overlay = document.getElementById('egregoraModalOverlay');
        if (!overlay) return;

        var messages = Array.isArray(g_egregoraMessages) ? g_egregoraMessages : [];

        var instagramHTML =
            "<a href='https://www.instagram.com/egregorarj?stkn=NjVtYjN0YTh4ejR3' target='_blank' rel='noopener' " +
            "class='bag-equip-btn' style='display:block; box-sizing:border-box; text-align:center; text-decoration:none; " +
            "background:var(--magenta-neon); margin:0 0 16px 0;'>@egregorarj — FOLLOW ON INSTAGRAM</a>";

        var messagesHTML;
        if (messages.length === 0) {
            messagesHTML = "<div style='text-align:center; color:var(--text-muted); font-size:12px; padding:20px 0;'>No messages yet — be the first!</div>";
        } else {
            messagesHTML = "<div style='display:flex; flex-direction:column; gap:10px; max-height:260px; overflow-y:auto; padding-right:4px; margin-bottom:16px;'>";
            for (var mi = 0; mi < messages.length; mi++) {
                var msg = messages[mi] || {};
                messagesHTML +=
                    "<div style='border:1px solid rgba(255,0,255,0.25); border-radius:4px; padding:8px 10px; background:rgba(0,0,0,0.3);'>" +
                    "<div style='display:flex; justify-content:space-between; align-items:baseline; gap:8px; margin-bottom:4px;'>" +
                    "<span style='color:var(--cyan-neon); font-weight:bold; font-size:12px; font-family:var(--font-title); letter-spacing:0.5px;'>" + escapeHTML(msg.playerName || 'Ghost') + "</span>" +
                    "<span style='color:var(--text-muted); font-size:10px; font-family:\"Courier New\", monospace; white-space:nowrap;'>" + formatEgregoraTimestamp(msg.createdAt) + "</span>" +
                    "</div>" +
                    "<div style='color:#FFF; font-size:13px; font-family:\"Courier New\", monospace; line-height:1.4; word-break:break-word; white-space:pre-wrap;'>" + escapeHTML(msg.content || '') + "</div>" +
                    "</div>";
            }
            messagesHTML += "</div>";
        }

        var formHTML =
            "<textarea id='egregoraMessageInput' maxlength='300' placeholder='Leave a message for the community...' " +
            "style='width:100%; min-height:60px; resize:vertical; background:rgba(0,0,0,0.4); border:1px solid var(--cyan-neon); " +
            "border-radius:4px; color:#FFF; font-family:\"Courier New\", monospace; font-size:13px; padding:8px; box-sizing:border-box;'></textarea>" +
            "<button class='bag-equip-btn' onclick='PostEgregoraMessage()'>SEND</button>";

        var bodyHTML =
            "<div style='padding:16px;'>" +
            instagramHTML +
            "<h3 style='margin:0 0 8px 0; color:var(--yellow-neon); font-size:13px; font-family:var(--font-title); letter-spacing:1px;'>MESSAGE BOARD</h3>" +
            messagesHTML +
            formHTML +
            "</div>";

        overlay.innerHTML =
            "<div class='tutorial-modal-container' style='max-width:560px; height:auto; max-height:88vh; margin:30px auto;'>" +
            "<div class='tutorial-modal-header'>" +
            "<h2>Egregora</h2>" +
            "<button class='tutorial-close-btn' onclick='CloseEgregoraModal()'>Close [X]</button>" +
            "</div>" +
            "<div class='tutorial-modal-body' style='display:block; overflow-y:auto;'>" + bodyHTML + "</div>" +
            "</div>";
    } catch (err) {
        console.warn('RenderEgregoraModal Error', err);
    }
}

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
    // Mesmo guard das outras três (ver UpdateNavbarBag): rpg_system.js chama esta
    // função em ganho de XP/level-up/alocação de ponto. Com a modal aberta, o
    // destino do render é a modal, não o #rpgPanelContent escondido.
    if (g_dgInvOpen) { RenderInventoryModal(); return; }

    var stats = window.GhostRPG ? GhostRPG.getStats() : { pointsToDistribute: 0, level: 1, xp: 0, xpRequired: 100, vit: 1, agi: 1, int: 1, pow: 1, mag: 1, equippedSkills: [0,1,2,3], equippedRunes: [0,0,0,0] };
    var panelContent = document.getElementById("rpgPanelContent");
    if (!panelContent) return;

    var apHTML = "";
    if (stats.pointsToDistribute > 0) {
        apHTML = "<div style='color:var(--green-neon); font-weight:bold; font-size:11px; text-align:center; margin-bottom: 6px; text-shadow: 0 0 5px var(--green-neon);'>⚡ " + ((typeof window.formatBigNumber === 'function') ? window.formatBigNumber(stats.pointsToDistribute) : stats.pointsToDistribute) + " AP AVAILABLE!</div>";
    }

    // Alocação de pontos (16/09/2026): o "+1" de sempre CONTINUA existindo — ganhou companhia.
    // Com nível máximo de 100 bilhões e 5 pontos por nível, dá ~500 bilhões de pontos acumuláveis;
    // "+1000" e "ALL" existem pra isso não virar uma vida inteira de cliques. Os três compartilham
    // o mesmo caminho de estado (GhostRPG), então o anti-cheat e o auto-save valem igual.
    function makeButton(attr) {
        if (stats.pointsToDistribute > 0) {
            var btn = "<button onclick=\"GhostRPG.allocateAttribute('" + attr + "'); RenderRPGStatusDrawer();\" class='rpg-stat-btn' style='padding: 2px 6px; font-size: 11px;' title='Add 1 point'>+</button>";
            if (stats.pointsToDistribute >= 1000) {
                btn += "<button onclick=\"GhostRPG.allocateAttributeBulk('" + attr + "', 1000); RenderRPGStatusDrawer();\" class='rpg-stat-btn' style='padding: 2px 5px; font-size: 10px; margin-left:3px;' title='Add 1000 points'>+1K</button>";
            }
            btn += "<button onclick=\"GhostRPG.allocateAttributeBulk('" + attr + "', 'all'); RenderRPGStatusDrawer();\" class='rpg-stat-btn' style='padding: 2px 5px; font-size: 10px; margin-left:3px;' title='Spend every available point here'>ALL</button>";
            return btn;
        }
        return "";
    }

    // Abreviação de número grande — a mesma função de rpg_system.js (window.formatBigNumber).
    // Fallback só pra ordem de carregamento; não duplique a fórmula aqui.
    var fmt = (typeof window.formatBigNumber === 'function') ? window.formatBigNumber : function(n) { return String(n); };

    // 16/09/2026: o tier virou um contador próprio (state.weapon.tier) e o custo saiu do dano cru.
    //   WeaponDamage(L, tier) = 10 * L^1.85 * 1.12^tier
    //   WeaponUpgradeCost(tier) = 100 * 1.15^tier      (moeda = score)
    // GhostRPG é a autoridade sobre os dois; a UI só lê (não recalcula a fórmula por conta própria).
    var currentWeapon = stats.weapon || { name: 'Starter Dirk', damage: 10, tier: 0 };
    var currentDamage = currentWeapon.damage;
    var currentTier = (window.GhostRPG && GhostRPG.getWeaponTier) ? GhostRPG.getWeaponTier()
        : (typeof currentWeapon.tier === 'number' ? currentWeapon.tier : Math.max(0, Math.floor((currentDamage - 10) / 10)));
    var upgradeCost = (window.GhostRPG && GhostRPG.getWeaponUpgradeCost) ? GhostRPG.getWeaponUpgradeCost()
        : Math.floor(100 * Math.pow(1.15, currentTier));
    var weaponNames = ["Starter Dirk", "Shadow Dirk", "Ghostblade", "Doom Splicer", "Soul Reaper", "Grandfather", "Doomcalibur", "Desolation Sword"];
    var nextName = weaponNames[currentTier + 1] || ("Godly Blade +" + (currentTier + 1));
    // Tier de exibição sugerido ~60: acima disso o nome vira só "Godly Blade +N" e o número deixa
    // de significar alguma coisa visualmente. NÃO bloqueia a compra — é rótulo, não regra.
    var tierLabel = (currentTier > 60) ? ("60+ (" + fmt(currentTier) + ")") : String(currentTier);
    
    var economyHTML = 
        "<hr style='border-color: rgba(255,255,255,0.1); margin: 6px 0;'>" +
        "<div style='font-size: 12px; line-height: 1.35; color: #FFF;'>" +
        "<div style='margin-bottom:2px;'>⚔️ <b>WEAPON:</b> <span style='color:var(--yellow-neon);'>" + currentWeapon.name + "</span> <span style='opacity:0.6; font-size:11px;'>T" + tierLabel + "</span></div>" +
        "<div style='margin-bottom:4px;'><b>DAMAGE:</b> <span style='color:var(--yellow-neon);'>" + fmt(currentDamage) + "</span></div>" +
        "<button onclick=\"if(GhostRPG.upgradeWeapon()) { RenderRPGStatusDrawer(); } else { alert('Insufficient Score or Cheat Detected!'); }\" style='width:100%; margin-top:4px; padding:6px; background:var(--yellow-neon); color:#000; font-weight:bold; border:none; cursor:pointer; font-family:var(--font-title); font-size:11px; border-radius:4px;'>UPGRADE TO " + nextName.toUpperCase() + " (" + fmt(upgradeCost) + " PTS)</button>" +
        "</div>";

    panelContent.innerHTML = 
        "<h3 style='margin: 0 0 6px 0; color: var(--green-neon); text-align: center; letter-spacing: 1px; font-family: var(--font-title); font-size: 16px;'>🛡️ HERO STATUS</h3>" +
        apHTML +
        "<div style='display: flex; flex-direction: column; gap: 6px; max-height: 235px; overflow-y: auto; padding-right: 4px;'>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span><b>LEVEL:</b></span><span style='color:var(--cyan-neon); font-weight:bold;' title='" + stats.level + "'>" + fmt(stats.level) + "</span></div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span><b>XP:</b></span><span style='color:var(--cyan-neon); font-weight:bold;'>" + fmt(stats.xp) + " / " + fmt(stats.xpRequired) + "</span></div>" +
        "<hr style='border-color: rgba(255,255,255,0.1); margin: 4px 0;'>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>❤️ <b>VIT:</b> " + fmt(stats.baseVit) + (stats.bonuses && stats.bonuses.vit > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.vit + ")</span>" : "") + "</span>" + makeButton('vit') + "</div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>⚡ <b>AGI:</b> " + fmt(stats.baseAgi) + (stats.bonuses && stats.bonuses.agi > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.agi + ")</span>" : "") + "</span>" + makeButton('agi') + "</div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>🔮 <b>INT:</b> " + fmt(stats.baseInt) + (stats.bonuses && stats.bonuses.int > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.int + ")</span>" : "") + "</span>" + makeButton('int') + "</div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>⚔️ <b>POW:</b> " + fmt(stats.basePow) + (stats.bonuses && stats.bonuses.pow > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.pow + ")</span>" : "") + "</span>" + makeButton('pow') + "</div>" +
        "<div class='rpg-stat-row' style='padding: 3px 0; font-size: 12px;'><span class='rpg-stat-label'>🌀 <b>MAG:</b> " + fmt(stats.baseMag) + (stats.bonuses && stats.bonuses.mag > 0 ? " <span style='color:#00FFFF;'>(+" + stats.bonuses.mag + ")</span>" : "") + "</span>" + makeButton('mag') + "</div>" +
        economyHTML +
        "</div>";
}

function UpdateNavbarSpells() {
    try {
        if (g_dgInvOpen) { RenderInventoryModal(); return; }

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
    // Login obrigatório pra jogar (22/08/2026, achado numa auditoria pedida pelo usuário —
    // mesmo padrão já aplicado em SPACE/P/PlayAsGhost/TriggerCreateNewGhost): essa função não
    // está amarrada a nenhum botão visível hoje, mas escondia loginButtonsContainer e abria a
    // seleção de personagem incondicionalmente, sem checar sessão — um caminho pronto pra
    // pular o login inteiro se algum botão futuro for amarrado a ela sem lembrar desse check.
    // Mesmo dia: checa g_hasAuthenticatedThisPageLoad (memória, js/web2/auth.js), não
    // dg_cloud_email (localStorage, persiste entre reloads e pularia o login sozinho).
    if (!window.g_hasAuthenticatedThisPageLoad) {
        if (typeof window.OpenLoginModal === 'function') window.OpenLoginModal();
        return;
    }

    var overlay = document.getElementById('loginButtonsContainer');
    if (overlay) overlay.style.display = 'none';

    if (window.OpenCharacterSelection) {
        window.OpenCharacterSelection();
    }
}

function OpenCharacterSelection() {
    var overlay = document.getElementById('characterSelectionOverlay');
    if (overlay) overlay.style.display = 'flex';

    if (typeof window.LoadRPGStateFromDeSo === "function") {
        window.LoadRPGStateFromDeSo(window.g_desoPublicKey || "LOCAL_PLAYER_KEY", true);
    }
}

function CancelCharacterSelection() {
    var overlay = document.getElementById('characterSelectionOverlay');
    if (overlay) overlay.style.display = 'none';
    var loginBtns = document.getElementById('loginButtonsContainer');
    if (loginBtns) loginBtns.style.display = 'flex';
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

// Modo convidado removido por completo (30/08/2026, pedido explícito do usuário: sem save
// local, login vira obrigatório pra jogar). StartGuestPlayFlow()/StartDeSoPlayFlow() e
// window.g_isGuestRun apagados — nenhum botão do HTML chamava essas duas funções (confirmado
// antes de apagar), já eram código morto da era de transição DeSo → Web2.

function ToggleGameFullscreen() {
    var container = document.getElementById("fullscreenGameArea");
    if (!document.fullscreenElement) {
        if (container && container.requestFullscreen) {
            container.requestFullscreen().then(function() {
                var btn = document.getElementById("gameScreenModeBtn");
                if (btn) btn.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4'/></svg>";
            }).catch(function(err) {
                console.warn("Fullscreen request failed:", err);
            });
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(function() {
                var btn = document.getElementById("gameScreenModeBtn");
                if (btn) btn.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3'/></svg>";
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
            if (btn) btn.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4'/></svg>";
        }).catch(function(err) {
            console.warn("Fullscreen request failed:", err);
        });
    }
}

window.ToggleGameFullscreen = ToggleGameFullscreen;
window.RequestGameFullscreen = RequestGameFullscreen;

document.addEventListener("fullscreenchange", function() {
    var btn = document.getElementById("gameScreenModeBtn");
    if (btn) {
        if (document.fullscreenElement) {
            btn.innerHTML = "<img src='assets/sprites/exit_fullscreen_icon.jpg' style='width: 20px; height: 20px; border-radius: 2px;' alt='Exit Fullscreen' />";
        } else {
            btn.innerHTML = "<img src='assets/sprites/fullscreen_icon.jpg' style='width: 20px; height: 20px; border-radius: 2px;' alt='Fullscreen' />";
        }
    }
});

// ============================================================================
// MODAL DE INVENTÁRIO — BAG / EQUIP / SPELLS / STATUS (16/09/2026)
// ============================================================================
// POR QUE UMA MODAL, e não o painel de sempre: as quatro abas viviam dentro de
// .overlay-panel, que css/style.css trava em 300x300px com !important e que é
// COMPARTILHADO com chat/controles/Ghostdex — afrouxar o tamanho lá quebraria
// os três de uma vez. Em vez de brigar com essa classe, esta tela reaproveita o
// MESMO shell de modal que OpenChestModal() já usa e que já resolveu, neste
// codebase, o problema chato de montar overlay durante fullscreen
// (.tutorial-modal-overlay/-container/-header/-close-btn + o mount dinâmico em
// document.fullscreenElement, ver comentário longo em OpenChestModal acima).
//
// ÍCONES SEM ALPHA: os 11 .webp de equipamento/magia são quadrados OPACOS (o
// JPEG de origem tinha fundo pintado; chroma-key destruiria a arte). Então a
// raridade nunca é um brilho em torno da silhueta — é a MOLDURA (border 3px +
// box-shadow, classes .dg-rarity-*) desenhada em volta do quadrado, visível em
// REPOUSO, não só no hover/seleção.
//
// TOUCH: o tooltip de hover é aditivo, nunca o único caminho. Toda informação
// que ele mostra (stats completos + comparação com o que está equipado) também
// aparece no painel de detalhes por CLIQUE, que já era o padrão do Bag antigo —
// o CSS esconde o tooltip inteiro em (hover: none).
//
// Nada aqui recalcula fórmula de gear: defesa/elemental/precisão/CDR saem de
// GhostRPG.getGearSummary()/getAffixTotal(); equipar/desequipar continua sendo
// window.EquipInventoryItem()/UnequipEquipmentItem(). A UI só lê e desenha.
// ============================================================================

var DG_INV_TABS = ['bag', 'equip', 'spells', 'rpg'];
var g_dgInvOpen = false;
var g_dgInvTab = 'bag';
var g_dgBagSlotFilter = null;   // null | 'head' | 'chest' | ... — filtro vindo do paperdoll
var g_dgSpellFlyout = null;     // null | 0..3 — índice do slot V/F/E/R com flyout aberto

var DG_SLOT_META = {
    head:     { label: 'HEAD',      icon: 'assets/sprites/equip_head.webp' },
    chest:    { label: 'CHEST',     icon: 'assets/sprites/equip_chest.webp' },
    mainhand: { label: 'MAIN HAND', icon: 'assets/sprites/equip_weapon.webp' },
    offhand:  { label: 'OFF-HAND',  icon: 'assets/sprites/equip_shield.webp' },
    ring1:    { label: 'RING I',    icon: 'assets/sprites/equip_ring_ice.webp' },
    ring2:    { label: 'RING II',   icon: 'assets/sprites/equip_ring_wood.webp' },
    amulet:   { label: 'AMULET',    icon: 'assets/sprites/equip_amulet.webp' }
};
var DG_SLOT_ORDER = ['head', 'amulet', 'chest', 'mainhand', 'offhand', 'ring1', 'ring2'];

// Ícone por HABILIDADE (skill id), não por slot de tecla: o jogador pode pôr
// qualquer uma das 4 magias em qualquer um dos 4 slots V/F/E/R.
var DG_SPELLS = [
    { id: 0, name: 'Spectral Spark', icon: 'assets/sprites/spell_spark.webp',   desc: 'Fires a quick magic projectile.' },
    { id: 1, name: 'Ghost Mode',     icon: 'assets/sprites/spell_ghost.webp',   desc: 'Turn invisible to pass hazards & glide.' },
    { id: 2, name: 'Plasma Orb',     icon: 'assets/sprites/spell_orb.webp',     desc: 'Spawn a floating orb that shocks nearby targets.' },
    { id: 3, name: 'Phantom Form',   icon: 'assets/sprites/spell_phantom.webp', desc: 'Turn into a larger ghost with double blast power.' }
];
var DG_RUNES = [
    { id: 0, name: 'None (Arc)', color: '#00FFFF' },
    { id: 1, name: 'Fire',       color: '#FF5522' },
    { id: 2, name: 'Cold',       color: '#00CCFF' },
    { id: 3, name: 'Lightning',  color: '#FFD500' },
    { id: 4, name: 'Poison',     color: '#66FF33' },
    { id: 5, name: 'Arcane',     color: '#CC66FF' }
];
var DG_SLOT_KEYS = ['V', 'F', 'E', 'R'];

var DG_NAV_BTN_ID = { rpg: 'btnNavRPG', spells: 'btnNavSpells', bag: 'btnNavBag', equip: 'btnNavEquip' };
var DG_NAV_COLOR = { rpg: 'var(--green-neon)', spells: 'var(--red-neon)', bag: 'var(--magenta-neon)', equip: '#ffaa00' };

// ---------------------------------------------------------------------------
// Helpers pequenos
// ---------------------------------------------------------------------------
function DGFmt(n) {
    if (typeof window.formatBigNumber === 'function') return window.formatBigNumber(n);
    return String(n);
}

function DGRarityClass(quality) {
    if (quality === 'Legendary') return 'dg-rarity-legendary';
    if (quality === 'Epic') return 'dg-rarity-epic';
    if (quality === 'Rare') return 'dg-rarity-rare';
    return 'dg-rarity-common';
}

function DGEquipment() {
    var eq = window.GetEquipmentState ? window.GetEquipmentState() : null;
    return eq || { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null };
}

function DGInventory() {
    var stats = window.GhostRPG ? GhostRPG.getStats() : { inventory: [] };
    return stats.inventory || [];
}

function DGFindBagItem(itemId) {
    var items = DGInventory();
    for (var i = 0; i < items.length; i++) {
        if (items[i].id === itemId) return items[i];
    }
    return null;
}

// Só o <img>/emoji cru — a moldura de raridade é desenhada por quem chama.
//
// onerror em 2 degraus, não por capricho: item JÁ SALVO no inventário de um
// jogador guarda o CAMINHO do ícone junto com o item, e os 11 ícones viraram
// .webp depois disso — quem tem loot antigo tem ".png" gravado no save, um
// arquivo que não existe mais. Degrau 1 tenta o mesmo nome em .webp; degrau 2
// esconde a imagem e deixa aparecer o glifo de fallback que já está desenhado
// atrás dela (.dg-icon-fallback), em vez do ícone de imagem quebrada.
var DG_ICON_ONERROR = " onerror=\"if(!this.getAttribute('data-r')&&/\\.png$/i.test(this.src)){this.setAttribute('data-r','1');this.src=this.src.replace(/\\.png$/i,'.webp');}else{this.onerror=null;this.style.display='none';}\"";

function DGIconMarkup(item) {
    if (!item) return '';
    var icon = item.icon;
    if (item.id === 'blue_key') icon = 'assets/sprites/Blue key (1).webp';
    if (!icon) return "<span>🎁</span>";
    if (icon.indexOf('<img') !== -1) return icon;
    if (icon.indexOf('/') !== -1) {
        return "<span class='dg-icon-fallback'>⚙️</span>" +
            "<img src='" + escapeHTML(icon) + "' alt=''" + DG_ICON_ONERROR + " />";
    }
    return "<span>" + escapeHTML(icon) + "</span>";
}

// Em qual slot ESTE item entraria. Espelha a resolução de GhostRPG.equipItem()
// (rpg_system.js) — inclusive o desempate de anel por nome (ice/cold/winter ->
// ring1, wood/forest -> ring2) — mas sem alert() e sem tocar em estado: aqui é
// só pra saber contra QUEM comparar e o que mostrar num filtro de slot.
function DGItemTargetSlot(item) {
    if (!item) return null;
    var s = (item.slot || '').toLowerCase();
    if (DG_SLOT_META[s]) return s;
    if (s === 'ring') {
        var n = (item.name || '').toLowerCase();
        if (n.indexOf('ice') !== -1 || n.indexOf('cold') !== -1 || n.indexOf('winter') !== -1) return 'ring1';
        if (n.indexOf('wood') !== -1 || n.indexOf('forest') !== -1) return 'ring2';
        return DGEquipment().ring1 ? 'ring2' : 'ring1';
    }
    if (item.id === 'ghost_helmet') return 'head';
    if (item.id === 'ghost_spell') return 'mainhand';
    return null;
}

// Mesmo critério que o Bag antigo já usava pra decidir se mostra o botão EQUIP
// (inclui os ids legados que não têm campo `slot`).
function DGIsEquippable(item) {
    if (!item) return false;
    return !!(item.slot || item.id === 'ghost_helmet' || item.id === 'ghost_spell' || item.id === 'elixir');
}

// Um item SERVE no slot pedido? Usado pelo filtro "equipar direto do paperdoll".
function DGItemFitsSlot(item, slot) {
    if (!item || !slot) return false;
    var s = (item.slot || '').toLowerCase();
    if (s === slot) return true;
    if (s === 'ring' && (slot === 'ring1' || slot === 'ring2')) return true;
    if (!s && item.id === 'ghost_helmet' && slot === 'head') return true;
    if (!s && item.id === 'ghost_spell' && slot === 'mainhand') return true;
    return false;
}

// ---------------------------------------------------------------------------
// Comparação de item — NÃO reimplementa fórmula de gear.
// GhostRPG.getGearSummary()/getAffixTotal() dão o TOTAL do conjunto equipado;
// nenhuma API do GhostRPG compara duas peças entre si (não existe "e se eu
// equipasse isto?"). Então o diff aqui é puramente a subtração dos campos que o
// próprio item carrega (attributes/baseDamage/baseDefense/affixes) — os mesmos
// campos que LootGenerator.generate() escreve.
// ---------------------------------------------------------------------------
function DGStatMap(item) {
    var map = {};
    if (!item) return map;
    function add(label, value, unit) {
        if (!value) return;
        if (!map[label]) map[label] = { v: 0, u: unit || '' };
        map[label].v += value;
    }
    add('DMG', item.baseDamage, '');
    add('DEF', item.baseDefense, '');
    if (item.attributes) {
        for (var k in item.attributes) {
            if (item.attributes[k]) add(k.toUpperCase(), item.attributes[k], '');
        }
    }
    if (item.affixes && item.affixes.length) {
        for (var i = 0; i < item.affixes.length; i++) {
            var a = item.affixes[i];
            if (!a || !a.stat) continue;
            var meta = AFFIX_LABELS[a.stat] || { label: a.stat, unit: '' };
            add(meta.label, a.value || 0, meta.unit);
        }
    }
    return map;
}

function DGCompareHtml(candidate, equipped, slot) {
    if (!slot) return '';
    var a = DGStatMap(candidate);
    var b = DGStatMap(equipped);
    var keys = [];
    var k;
    for (k in a) keys.push(k);
    for (k in b) { if (keys.indexOf(k) === -1) keys.push(k); }
    if (keys.length === 0) return '';

    var slotLabel = (DG_SLOT_META[slot] && DG_SLOT_META[slot].label) || slot.toUpperCase();
    var rows = '';
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var av = a[key] ? a[key].v : 0;
        var bv = b[key] ? b[key].v : 0;
        var unit = (a[key] && a[key].u) || (b[key] && b[key].u) || '';
        var delta = av - bv;
        var cls = delta > 0 ? 'dg-up' : (delta < 0 ? 'dg-down' : 'dg-same');
        var arrow = delta > 0 ? '▲ +' : (delta < 0 ? '▼ -' : '= ');
        rows += "<div><span style='color:var(--text-muted);'>" + escapeHTML(key) + "</span> " +
            "<span class='" + cls + "'>" + arrow + DGFmt(Math.abs(delta)) + unit + "</span> " +
            "<span style='color:var(--text-muted); font-size:10px;'>(" + DGFmt(av) + unit + " vs " + DGFmt(bv) + unit + ")</span></div>";
    }
    var head = equipped
        ? "Vs. equipped in " + escapeHTML(slotLabel) + ": " + escapeHTML(equipped.name || '')
        : escapeHTML(slotLabel) + " is empty — all gain";
    return "<div class='dg-tip-compare'><div class='dg-tip-compare-title'>" + head + "</div>" + rows + "</div>";
}

// ---------------------------------------------------------------------------
// Tooltip de hover (desktop). Um único nó reaproveitado, montado no MESMO alvo
// de fullscreen da modal — senão ele some quando o jogo está em fullscreen,
// exatamente o bug que OpenChestModal() já documentou pro overlay do baú.
// ---------------------------------------------------------------------------
function DGCanHover() {
    try {
        return !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
    } catch (e) {
        return true;
    }
}

function DGTooltipNode() {
    var target = document.fullscreenElement || document.body;
    var tip = document.getElementById('dgItemTooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'dgItemTooltip';
        target.appendChild(tip);
    } else if (tip.parentElement !== target) {
        target.appendChild(tip);
    }
    return tip;
}

function DGItemTooltipHtml(item, compareSlot) {
    if (!item) return '';
    var color = ItemQualityColor(item.quality);
    var html = "<div class='dg-tip-name' style='color:" + color + ";'>" + escapeHTML(item.name || '') + "</div>";
    var sub = [];
    if (item.quality) sub.push(item.quality);
    var natural = DGItemTargetSlot(item);
    if (natural && DG_SLOT_META[natural]) sub.push(DG_SLOT_META[natural].label);
    if (item.itemLevel) sub.push('iLvl ' + DGFmt(item.itemLevel));
    if (sub.length) html += "<div class='dg-tip-sub'>" + escapeHTML(sub.join(' · ')) + "</div>";
    if (item.description) html += "<div class='dg-tip-desc'>" + escapeHTML(item.description) + "</div>";

    var statMap = DGStatMap(item);
    var statRows = '';
    for (var key in statMap) {
        var isAffix = (key !== 'DMG' && key !== 'DEF' && ['VIT', 'AGI', 'INT', 'POW', 'MAG'].indexOf(key) === -1);
        statRows += "<div class='" + (isAffix ? 'dg-tip-affix' : 'dg-tip-stat') + "'>+" +
            DGFmt(statMap[key].v) + statMap[key].u + " " + escapeHTML(key) + "</div>";
    }
    if (statRows) html += statRows;

    if (item.requiredStats) {
        var r = item.requiredStats;
        html += "<div class='dg-tip-req'>REQ &mdash; POW " + DGFmt(r.strength || 0) +
            " | INT " + DGFmt(r.intelligence || 0) + " | AGI " + DGFmt(r.agility || 0) + "</div>";
    }
    if (item.specialEffect) {
        html += "<div class='dg-tip-effect'>" + escapeHTML(item.specialEffect) + "</div>";
    }
    if (compareSlot) {
        html += DGCompareHtml(item, DGEquipment()[compareSlot], compareSlot);
    }
    return html;
}

// kind: 'bag' (key = id do item no inventário) | 'equip' (key = nome do slot)
function DGShowTip(evt, kind, key) {
    try {
        if (!DGCanHover()) return;
        var item, compareSlot = null;
        if (kind === 'equip') {
            item = DGEquipment()[key];
        } else {
            item = DGFindBagItem(key);
            compareSlot = DGItemTargetSlot(item);
        }
        if (!item) return;
        var tip = DGTooltipNode();
        tip.innerHTML = DGItemTooltipHtml(item, compareSlot);
        tip.style.display = 'block';
        DGMoveTip(evt);
    } catch (e) {
        console.warn('DGShowTip Error', e);
    }
}

function DGMoveTip(evt) {
    var tip = document.getElementById('dgItemTooltip');
    if (!tip || tip.style.display === 'none') return;
    var pad = 14;
    var w = tip.offsetWidth || 280;
    var h = tip.offsetHeight || 160;
    var x = (evt && evt.clientX ? evt.clientX : 0) + pad;
    var y = (evt && evt.clientY ? evt.clientY : 0) + pad;
    if (x + w > window.innerWidth - 8) x = Math.max(8, (evt.clientX || 0) - w - pad);
    if (y + h > window.innerHeight - 8) y = Math.max(8, window.innerHeight - h - 8);
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
}

function DGHideTip() {
    var tip = document.getElementById('dgItemTooltip');
    if (tip) tip.style.display = 'none';
}

// Atributos de hover reaproveitados por Bag e paperdoll.
function DGHoverAttrs(kind, key) {
    return " onmouseenter=\"DGShowTip(event,'" + kind + "','" + escapeHTML(String(key)) + "')\"" +
        " onmousemove='DGMoveTip(event)' onmouseleave='DGHideTip()'";
}

// ---------------------------------------------------------------------------
// Abrir / fechar / trocar de aba
// ---------------------------------------------------------------------------
function DGSyncNavButtons(activeTab) {
    var ids = ['btnNavControls', 'btnNavRPG', 'btnNavSpells', 'btnNavBag', 'btnNavEquip', 'btnNavChat', 'btnNavGhostdex'];
    for (var i = 0; i < ids.length; i++) {
        var btn = document.getElementById(ids[i]);
        if (!btn) continue;
        btn.style.background = 'transparent';
        btn.style.borderColor = 'var(--border-light)';
        btn.style.boxShadow = 'none';
    }
    if (!activeTab || !DG_NAV_BTN_ID[activeTab]) return;
    var active = document.getElementById(DG_NAV_BTN_ID[activeTab]);
    if (!active) return;
    var color = DG_NAV_COLOR[activeTab] || 'var(--cyan-neon)';
    active.style.borderColor = color;
    active.style.boxShadow = '0 0 14px ' + color;
    active.style.background = 'rgba(255,255,255,0.08)';
}

function OpenInventoryModal(tab) {
    try {
        if (DG_INV_TABS.indexOf(tab) === -1) tab = 'bag';
        g_dgInvTab = tab;
        g_dgSpellFlyout = null;

        // Mesmo alvo dinâmico de OpenChestModal(): em fullscreen, só a subárvore
        // do elemento em fullscreen é renderizada — um overlay preso em
        // document.body simplesmente não aparece.
        var target = document.fullscreenElement || document.body;
        var overlay = document.getElementById('dgInventoryOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'dgInventoryOverlay';
            overlay.className = 'tutorial-modal-overlay';
            target.appendChild(overlay);
        } else if (overlay.parentElement !== target) {
            target.appendChild(overlay);
        }
        overlay.style.display = 'block';
        DGTooltipNode();

        g_dgInvOpen = true;
        window.g_activeTab = tab;
        DGSyncNavButtons(tab);
        RenderInventoryModal();
        if (typeof window.OverworldSetInputLocked === 'function') window.OverworldSetInputLocked(true);
    } catch (err) {
        console.warn('OpenInventoryModal Error', err);
    }
}

function CloseInventoryModal() {
    try {
        var overlay = document.getElementById('dgInventoryOverlay');
        if (overlay) overlay.style.display = 'none';
        DGHideTip();
        g_dgInvOpen = false;
        g_dgSpellFlyout = null;
        g_dgBagSlotFilter = null;
        window.g_activeTab = null;
        DGSyncNavButtons(null);
        if (typeof window.OverworldSetInputLocked === 'function') window.OverworldSetInputLocked(false);
    } catch (err) {
        console.warn('CloseInventoryModal Error', err);
    }
}

function ToggleInventoryModal(tab) {
    if (g_dgInvOpen && g_dgInvTab === tab) {
        CloseInventoryModal();
        return;
    }
    OpenInventoryModal(tab);
}

function DGSwitchInvTab(tab) {
    if (DG_INV_TABS.indexOf(tab) === -1) return;
    g_dgInvTab = tab;
    g_dgSpellFlyout = null;
    if (tab !== 'bag') g_dgBagSlotFilter = null;
    window.g_activeTab = tab;
    DGSyncNavButtons(tab);
    DGHideTip();
    RenderInventoryModal();
}

// ---------------------------------------------------------------------------
// Render da modal
// ---------------------------------------------------------------------------
// `title` é o cabeçalho da modal; `short` é o rótulo da aba — com o nome longo
// nas 4 abas, a tira de abas virava 3 linhas em tela de 375px e empurrava a
// grade pra fora da primeira dobra. Os curtos são as MESMAS palavras da navbar
// que o jogador já usa (BAG/EQUIP/SPELLS/STATUS).
var DG_TAB_TITLES = {
    bag:    { icon: '🎒', title: 'GHOST BAG',      short: 'BAG' },
    equip:  { icon: '🛡️', title: 'EQUIPMENT', short: 'EQUIP' },
    spells: { icon: '🔮', title: 'SPELLS & RUNES', short: 'SPELLS' },
    rpg:    { icon: '⚔️', title: 'HERO STATUS',     short: 'STATUS' }
};

function RenderInventoryModal() {
    try {
        var overlay = document.getElementById('dgInventoryOverlay');
        if (!overlay) return;

        // innerHTML abaixo destrói o nó que estava com o mouse em cima, então o
        // mouseleave dele NUNCA dispara — sem isto o tooltip fica preso na tela
        // depois de qualquer clique que re-renderize (equipar, selecionar...).
        DGHideTip();

        var body = '';
        if (g_dgInvTab === 'bag') body = DGRenderBagTab();
        else if (g_dgInvTab === 'equip') body = DGRenderEquipTab();
        else if (g_dgInvTab === 'spells') body = DGRenderSpellsTab();
        else body = DGRenderStatusTab();

        var tabsHTML = "<div class='dg-inv-tabs'>";
        for (var i = 0; i < DG_INV_TABS.length; i++) {
            var t = DG_INV_TABS[i];
            var meta = DG_TAB_TITLES[t];
            tabsHTML += "<button class='dg-inv-tab" + (t === g_dgInvTab ? " active" : "") +
                "' onclick=\"DGSwitchInvTab('" + t + "')\">" + meta.icon + " " + meta.short + "</button>";
        }
        tabsHTML += "</div>";

        var header = DG_TAB_TITLES[g_dgInvTab];
        overlay.innerHTML =
            "<div class='tutorial-modal-container dg-inv-container'>" +
            "<div class='tutorial-modal-header'>" +
            "<h2>" + header.icon + " " + header.title + "</h2>" +
            "<button class='tutorial-close-btn' onclick='CloseInventoryModal()'>Close [X]</button>" +
            "</div>" +
            tabsHTML +
            "<div class='tutorial-modal-body' style='display:block; overflow-y:auto;'>" + body + "</div>" +
            "</div>";
    } catch (err) {
        console.warn('RenderInventoryModal Error', err);
    }
}

// ---------------------------------------------------------------------------
// ABA BAG
// ---------------------------------------------------------------------------
function DGRenderBagTab() {
    var items = DGInventory();
    var filtering = !!g_dgBagSlotFilter;
    var shown = [];
    var i;
    for (i = 0; i < items.length; i++) {
        if (!filtering || DGItemFitsSlot(items[i], g_dgBagSlotFilter)) shown.push(items[i]);
    }

    var modeBtnText = window.g_multiDiscardMode ? 'SELECTION: ON' : 'SELECTION: OFF';
    var modeBtnColor = window.g_multiDiscardMode ? '#FF3366' : 'var(--magenta-neon)';
    var toolbar = "<div class='dg-bag-toolbar'>";
    if (filtering) {
        var fLabel = (DG_SLOT_META[g_dgBagSlotFilter] && DG_SLOT_META[g_dgBagSlotFilter].label) || g_dgBagSlotFilter;
        toolbar += "<span class='dg-filter-pill'>Showing gear for: " + escapeHTML(fLabel) +
            " <button onclick='DGClearBagFilter()' title='Clear filter'>&#10005;</button></span>";
    } else {
        toolbar += "<span style='font-family:var(--font-title); font-size:11px; color:var(--text-muted); letter-spacing:0.06em;'>" +
            DGFmt(items.length) + " / 100 SLOTS</span>";
    }
    toolbar += "<button onclick='ToggleMultiDiscardMode()' style='font-size:10px; padding:4px 10px; background:rgba(255,0,255,0.05); border:1px solid " +
        modeBtnColor + "; color:" + modeBtnColor + "; cursor:pointer; border-radius:4px; font-family:var(--font-title);'>" + modeBtnText + "</button>";
    toolbar += "</div>";

    // Células vazias só até fechar a grade (mínimo 5 linhas) — a grade antiga
    // desenhava 100 divs fixos, o que com slot grande viraria rolagem infinita
    // de nada. A contagem real de capacidade está na toolbar acima.
    var minCells = filtering ? shown.length : Math.max(30, Math.ceil((shown.length + 1) / 6) * 6);
    var totalCells = Math.max(shown.length, minCells);
    if (!filtering && totalCells % 6 !== 0) totalCells += 6 - (totalCells % 6);

    var grid = "<div class='dg-bag-grid'>";
    if (filtering && shown.length === 0) {
        grid += "<div style='grid-column:1/-1; text-align:center; color:var(--text-muted); font-size:12px; padding:22px 6px; font-family:var(--font-title);'>" +
            "NO ITEM IN THE BAG FITS THIS SLOT</div>";
    }
    for (i = 0; i < totalCells; i++) {
        if (i < shown.length) {
            var item = shown[i];
            var selected = window.g_multiDiscardMode
                ? (window.g_selectedBagItemIds && window.g_selectedBagItemIds.indexOf(item.id) !== -1)
                : (item.id === g_selectedBagItemId);
            var click = filtering
                ? "DGEquipToSlot('" + escapeHTML(item.id) + "','" + g_dgBagSlotFilter + "')"
                : "SelectBagItem('" + escapeHTML(item.id) + "')";
            grid += "<div class='dg-item-frame " + DGRarityClass(item.quality) + (selected ? " dg-selected" : "") +
                "' onclick=\"" + click + "\"" + DGHoverAttrs('bag', item.id) + " title='" + escapeHTML(item.name || '') + "'>" +
                DGIconMarkup(item) +
                (item.count > 1 ? "<span class='dg-item-count'>x" + item.count + "</span>" : "") +
                "</div>";
        } else {
            grid += "<div class='dg-item-frame dg-empty'></div>";
        }
    }
    grid += "</div>";

    return "<div class='dg-inv-body'>" +
        "<div class='dg-inv-col-main'>" + toolbar + grid + "</div>" +
        "<div class='dg-inv-col-side'>" + DGRenderBagDetails() + "</div>" +
        "</div>";
}

// Painel de detalhes por CLIQUE — o caminho de touch (onde não há hover) e o
// lugar dos botões de ação. Mostra o mesmo conteúdo do tooltip, comparação
// inclusa.
function DGRenderBagDetails() {
    if (window.g_multiDiscardMode) {
        var count = (window.g_selectedBagItemIds || []).length;
        return "<div class='bag-details-container'><div class='bag-details-info' style='text-align:center;'>" +
            "<div style='color:#FFF; font-size:12px; margin-top:6px;'>⚡ <b>MULTI-SELECTION MODE</b><br>" +
            "<span style='color:#FF3366; font-weight:bold;'>" + count + "</span> " + (count === 1 ? 'item' : 'items') + " selected.</div>" +
            "</div><div class='bag-details-actions'>" +
            "<button onclick='DiscardSelectedItems()' class='bag-discard-btn' style='flex:1; padding:8px; font-size:11px; background:rgba(255,51,102,0.2); border:1.5px solid #FF3366; color:#FF3366; cursor:pointer; border-radius:4px; font-family:var(--font-title); font-weight:bold;'>DISCARD SELECTED</button>" +
            "</div></div>";
    }

    var item = DGFindBagItem(g_selectedBagItemId);
    if (!item) {
        return "<div class='bag-details-container'><div class='bag-details-info' style='display:flex; align-items:center; justify-content:center; min-height:160px;'>" +
            "<p style='text-align:center; color:var(--text-muted); font-size:12px; margin:0;'>SELECT AN ITEM FOR DETAILS<br><span class='dg-hover-hint' style='font-size:10px;'>(hover it for a quick compare)</span></p>" +
            "</div></div>";
    }

    var color = ItemQualityColor(item.quality);
    var slot = DGItemTargetSlot(item);
    var body =
        "<div style='display:flex; gap:10px; align-items:flex-start; margin-bottom:8px;'>" +
        "<div class='dg-item-frame " + DGRarityClass(item.quality) + "' style='width:56px; height:56px; flex:0 0 56px; cursor:default;'>" + DGIconMarkup(item) + "</div>" +
        "<div style='min-width:0;'>" +
        "<div style='color:" + color + "; font-weight:bold; font-size:12px; font-family:var(--font-title); line-height:1.3;'>" + escapeHTML(item.name || '') + "</div>" +
        "<div style='color:var(--text-muted); font-size:10px; font-family:var(--font-title); letter-spacing:0.05em; margin-top:3px;'>" +
        escapeHTML((item.quality || 'Common').toUpperCase()) + (item.itemLevel ? " · ILVL " + DGFmt(item.itemLevel) : '') + "</div>" +
        "</div></div>";

    if (item.description) {
        body += "<div style='font-size:11px; line-height:1.35; color:#d7d7e0; font-style:italic; margin-bottom:6px;'>" + escapeHTML(item.description) + "</div>";
    }

    var statMap = DGStatMap(item);
    for (var key in statMap) {
        var isAffix = (key !== 'DMG' && key !== 'DEF' && ['VIT', 'AGI', 'INT', 'POW', 'MAG'].indexOf(key) === -1);
        body += "<div style='font-size:11px; color:" + (isAffix ? '#FFD54F' : 'var(--cyan-neon)') + ";'>+" +
            DGFmt(statMap[key].v) + statMap[key].u + " " + escapeHTML(key) + "</div>";
    }
    if (item.requiredStats) {
        var r = item.requiredStats;
        body += "<div style='color:#FF5555; font-size:10px; margin-top:5px; font-weight:bold;'>REQS &mdash; POW " + DGFmt(r.strength || 0) +
            " | INT " + DGFmt(r.intelligence || 0) + " | AGI " + DGFmt(r.agility || 0) + "</div>";
    }
    if (item.specialEffect) {
        body += "<div style='color:#FF8C00; font-size:10px; font-style:italic; margin-top:5px;'>" + escapeHTML(item.specialEffect) + "</div>";
    }
    if (slot) body += DGCompareHtml(item, DGEquipment()[slot], slot);

    var actions = '';
    if (DGIsEquippable(item)) {
        actions += "<button onclick=\"EquipBagItem('" + escapeHTML(item.id) + "')\" class='bag-equip-btn' style='flex:1; margin:0; padding:7px; font-size:11px;'>EQUIP</button>";
    }
    actions += "<button onclick=\"DiscardBagItem('" + escapeHTML(item.id) + "')\" class='bag-discard-btn' style='flex:1; margin:0; padding:7px; font-size:11px; background:rgba(255,51,102,0.2); border:1.5px solid #FF3366; color:#FF3366; cursor:pointer; border-radius:4px; font-family:var(--font-title); font-weight:bold;'>DISCARD</button>";

    return "<div class='bag-details-container'><div class='bag-details-info' style='max-height:none;'>" + body + "</div>" +
        "<div class='bag-details-actions'>" + actions + "</div></div>";
}

function DGClearBagFilter() {
    g_dgBagSlotFilter = null;
    RenderInventoryModal();
}

// Equipar DIRETO no slot escolhido no paperdoll — o caminho novo (antes só
// existia Bag -> EQUIP, que resolvia o slot sozinho). GhostRPG.equipItem()
// aceita targetSlot justamente pra isso e continua sendo quem valida requisito
// de atributo (e quem alerta o jogador se faltar).
function DGEquipToSlot(itemId, slot) {
    if (!window.EquipInventoryItem) return;
    if (window.EquipInventoryItem(itemId, slot)) {
        g_selectedBagItemId = null;
        g_dgBagSlotFilter = null;
        g_dgInvTab = 'equip';
        window.g_activeTab = 'equip';
        DGSyncNavButtons('equip');
        DGHideTip();
    }
    RenderInventoryModal();
}

function DGOpenBagForSlot(slot) {
    g_dgBagSlotFilter = slot;
    g_dgInvTab = 'bag';
    window.g_activeTab = 'bag';
    DGSyncNavButtons('bag');
    DGHideTip();
    RenderInventoryModal();
}

function DGUnequipSlot(slot) {
    if (window.UnequipEquipmentItem) window.UnequipEquipmentItem(slot);
    DGHideTip();
    RenderInventoryModal();
}

// ---------------------------------------------------------------------------
// ABA EQUIP — paperdoll
// ---------------------------------------------------------------------------
// Silhueta: em vez de um boneco humanoide generico, e a silhueta REAL do
// Ghost #001 (Polterstalk) — o ghost padrao de todo jogador novo, entao e
// literalmente o personagem que a maioria vai ver aqui primeiro. Reaproveita
// o sprite ja existente (assets/sprites/ghost_001_r.webp, mesmo arquivo usado
// no Ghostdex/overworld) como CSS mask-image tingida no mesmo gradiente
// cyan->magenta de antes (ver .dg-paperdoll-svg em css/style.css) — continua
// deliberadamente barata: nenhum arquivo novo de arte, nenhum request extra
// (o sprite ja esta carregado), so uma div mascarada. O protagonista visual
// seguem sendo as molduras de raridade em volta dos icones.
function DGPaperdollSvg() {
    return "<div class='dg-paperdoll-svg' aria-hidden='true'></div>";
}

function DGRenderEquipTab() {
    var eq = DGEquipment();
    var doll = "<div class='dg-paperdoll'>" + DGPaperdollSvg();

    for (var i = 0; i < DG_SLOT_ORDER.length; i++) {
        var slot = DG_SLOT_ORDER[i];
        var meta = DG_SLOT_META[slot];
        var item = eq[slot];
        doll += "<div class='dg-doll-slot dg-slot-" + slot + "'>";
        if (item) {
            doll += "<div class='dg-item-frame " + DGRarityClass(item.quality) + "' style='width:100%; height:100%;'" +
                " onclick=\"DGOpenBagForSlot('" + slot + "')\"" + DGHoverAttrs('equip', slot) +
                " title='" + escapeHTML(item.name || '') + " — click to swap'>" +
                DGIconMarkup(item) +
                "<span onclick=\"event.stopPropagation(); DGUnequipSlot('" + slot + "')\" title='Unequip' " +
                "style='position:absolute; top:-6px; right:-6px; width:18px; height:18px; line-height:16px; text-align:center; " +
                "background:rgba(0,0,0,0.9); border:1px solid #FF3366; color:#FF3366; border-radius:50%; font-size:11px; font-weight:bold; cursor:pointer; z-index:4;'>&#10005;</span>" +
                "</div>";
        } else {
            doll += "<div class='dg-item-frame dg-empty' style='width:100%; height:100%;' onclick=\"DGOpenBagForSlot('" + slot + "')\" " +
                "title='Empty " + escapeHTML(meta.label) + " — click to equip'>+</div>";
        }
        doll += "<span class='dg-doll-label'>" + escapeHTML(meta.label) + "</span></div>";
    }
    doll += "</div>";

    // Lista compacta ao lado: é o caminho de TOUCH pra ler o que cada peça dá
    // (no celular não existe hover pra abrir o tooltip) e o lugar do UNEQUIP
    // com rótulo escrito, não só o "x" pequeno do paperdoll.
    var list = "<h4 class='dg-inv-section-title'>Equipped</h4><div class='equip-slots-container' style='max-height:none;'>";
    for (i = 0; i < DG_SLOT_ORDER.length; i++) {
        var s = DG_SLOT_ORDER[i];
        var it = eq[s];
        var lbl = DG_SLOT_META[s].label;
        if (it) {
            var qc = ItemQualityColor(it.quality);
            list += "<div class='equip-slot-row equipped' style='border-color:" + qc + ";'>" +
                "<div class='equip-slot-info'><div class='equip-slot-text'>" +
                "<div class='equip-slot-name' style='color:" + qc + ";'>" + escapeHTML(it.name || '') + "</div>" +
                "<div class='equip-slot-type'>" + escapeHTML(lbl) + (FormatItemStatsInline(it) ? " | <span class='equip-slot-bonus'>" + escapeHTML(FormatItemStatsInline(it)) + "</span>" : '') + "</div>" +
                "</div></div>" +
                "<button onclick=\"DGUnequipSlot('" + s + "')\" class='equip-unequip-btn'>UNEQUIP</button></div>";
        } else {
            list += "<div class='equip-slot-empty' style='cursor:pointer;' onclick=\"DGOpenBagForSlot('" + s + "')\">" +
                "&#10133; " + escapeHTML(lbl) + " &mdash; TAP TO EQUIP</div>";
        }
    }
    list += "</div>" + DGGearSummaryBox();

    return "<div class='dg-inv-body'>" +
        "<div class='dg-inv-col-main' style='padding-bottom:20px;'>" +
        "<h4 class='dg-inv-section-title' style='text-align:center;'>Click any slot to equip from the bag</h4>" +
        doll + "</div>" +
        "<div class='dg-inv-col-side'>" + list + "</div>" +
        "</div>";
}

// ---------------------------------------------------------------------------
// Totais derivados — tudo vem de GhostRPG.getGearSummary(), nada é recalculado.
// ---------------------------------------------------------------------------
function DGGearSummaryBox() {
    if (!window.GhostRPG || typeof window.GhostRPG.getGearSummary !== 'function') return '';
    var s;
    try { s = window.GhostRPG.getGearSummary(); } catch (e) { return ''; }
    if (!s) return '';

    function row(label, value, extra) {
        return "<div class='dg-derived-row'><span class='dg-derived-label'>" + label + "</span>" +
            "<span class='dg-derived-value'>" + value +
            (extra ? " <span class='dg-derived-split'>" + extra + "</span>" : '') + "</span></div>";
    }

    var elemental = Math.round(((s.tierElementalBonus || 0) * 100));
    var html = "<h4 class='dg-inv-section-title' style='margin-top:14px;'>Gear Totals</h4><div class='dg-derived-box'>";
    html += row('Defense', DGFmt(s.defense || 0), '(' + Math.round((s.damageReduction || 0) * 100) + '% dmg taken cut)');
    html += row('Elemental dmg', '+' + elemental + '%', 'rarity aura');
    if (s.fireBonus) html += row('Fire dmg', '+' + DGFmt(s.fireBonus) + '%', '');
    if (s.coldBonus) html += row('Cold dmg', '+' + DGFmt(s.coldBonus) + '%', '');
    if (s.mainhandMultiplier && s.mainhandMultiplier > 1) html += row('Weapon mult', 'x' + s.mainhandMultiplier.toFixed(2), 'mainhand');
    if (s.precisionDamage) html += row('Precision dmg', '+' + DGFmt(s.precisionDamage), '');
    if (s.cooldownReduction) html += row('Cooldown', '-' + Math.round(s.cooldownReduction * 100) + '%', '');
    if (s.lifeLeechPercent) html += row('Life leech', s.lifeLeechPercent + '%', '');
    if (s.manaCapBonus) html += row('Mana cap', '+' + DGFmt(s.manaCapBonus), '');
    if (s.vitalityBars) html += row('Vitality', '+' + DGFmt(s.vitalityBars), 'bars');
    html += "</div>";
    return html;
}

// ---------------------------------------------------------------------------
// ABA SPELLS — tiles no lugar dos <select>
// ---------------------------------------------------------------------------
function DGRenderSpellsTab() {
    var stats = window.GhostRPG ? GhostRPG.getStats() : { equippedSkills: [0, 1, 2, 3], equippedRunes: [0, 0, 0, 0] };
    var skills = stats.equippedSkills || [0, 1, 2, 3];
    var runes = stats.equippedRunes || [0, 0, 0, 0];

    var row = "<div class='dg-spell-row'>";
    for (var i = 0; i < 4; i++) {
        var skill = DG_SPELLS[skills[i]] || DG_SPELLS[0];
        var rune = DG_RUNES[runes[i]] || DG_RUNES[0];
        var open = (g_dgSpellFlyout === i);
        row += "<div class='dg-spell-tile" + (open ? " dg-open" : "") + "' onclick='DGToggleSpellFlyout(" + i + ")'>" +
            "<div class='dg-spell-icon-wrap' style='border-color:" + rune.color + "; box-shadow:0 0 12px " + rune.color + "55;'>" +
            "<span class='dg-spell-key'>" + DG_SLOT_KEYS[i] + "</span>" +
            "<img class='dg-rune-" + rune.id + "' src='" + skill.icon + "' alt='' />" +
            "</div>" +
            "<div class='dg-spell-name'>" + escapeHTML(skill.name) + "</div>" +
            "<div class='dg-spell-rune' style='color:" + rune.color + ";'>" + escapeHTML(rune.name) + "</div>";
        if (open) row += DGSpellFlyoutHtml(i, skills[i], runes[i]);
        row += "</div>";
    }
    row += "</div>";

    var manual =
        "<h4 class='dg-inv-section-title' style='margin-top:18px;'>📖 Spell Manual</h4>" +
        "<div style='font-size:11px; line-height:1.45; color:var(--text-muted); display:flex; flex-direction:column; gap:5px;'>";
    for (var s = 0; s < DG_SPELLS.length; s++) {
        manual += "<div><b style='color:var(--magenta-neon);'>" + escapeHTML(DG_SPELLS[s].name) + ":</b> " + escapeHTML(DG_SPELLS[s].desc) + "</div>";
    }
    manual += "<div style='margin-top:4px; color:var(--text-muted);'>Runes recolor and re-element the same spell &mdash; tap a tile to change the spell or its rune.</div></div>";

    // Com um flyout aberto, o corpo da modal precisa de fôlego embaixo: o flyout
    // é absolute e o .tutorial-modal-body tem overflow auto, então sem esta folga
    // as últimas runas da lista ficavam cortadas pela borda inferior.
    var pad = (g_dgSpellFlyout !== null) ? " style='display:block; padding-bottom:240px;'" : " style='display:block;'";
    return "<div class='dg-inv-body'" + pad + ">" +
        "<h4 class='dg-inv-section-title' style='text-align:center;'>Active skills &mdash; keys V / F / E / R</h4>" +
        row + manual + "</div>";
}

// Duas colunas (magia | runa) de propósito: empilhado, o flyout passava da
// borda inferior do corpo da modal e a lista de runas ficava fora de alcance.
function DGSpellFlyoutHtml(slotIndex, currentSkill, currentRune) {
    var html = "<div class='dg-spell-flyout' onclick='event.stopPropagation()'><div class='dg-flyout-cols'>";

    html += "<div><div class='dg-flyout-title'>Spell</div>";
    for (var i = 0; i < DG_SPELLS.length; i++) {
        var sp = DG_SPELLS[i];
        html += "<button class='dg-flyout-opt" + (sp.id === currentSkill ? " dg-current" : "") +
            "' onclick='DGSetSpell(" + slotIndex + "," + sp.id + ")'>" +
            "<img src='" + sp.icon + "' style='width:20px; height:20px; border-radius:3px; object-fit:cover; flex-shrink:0;' alt='' />" +
            "<span style='overflow:hidden; text-overflow:ellipsis; white-space:nowrap;'>" + escapeHTML(sp.name) + "</span></button>";
    }
    html += "</div>";

    html += "<div><div class='dg-flyout-title'>Rune</div>";
    for (var r = 0; r < DG_RUNES.length; r++) {
        var ru = DG_RUNES[r];
        html += "<button class='dg-flyout-opt" + (ru.id === currentRune ? " dg-current" : "") +
            "' onclick='DGSetRune(" + slotIndex + "," + ru.id + ")'>" +
            "<span class='dg-rune-dot' style='background:" + ru.color + "; box-shadow:0 0 7px " + ru.color + ";'></span>" +
            "<span style='overflow:hidden; text-overflow:ellipsis; white-space:nowrap;'>" + escapeHTML(ru.name) + "</span></button>";
    }
    html += "</div>";

    html += "</div></div>";
    return html;
}

function DGToggleSpellFlyout(slotIndex) {
    g_dgSpellFlyout = (g_dgSpellFlyout === slotIndex) ? null : slotIndex;
    RenderInventoryModal();
}

function DGSetSpell(slotIndex, skillId) {
    if (window.GhostRPG && typeof GhostRPG.setSkill === 'function') GhostRPG.setSkill(slotIndex, skillId);
    g_dgSpellFlyout = null;
    RenderInventoryModal();
}

function DGSetRune(slotIndex, runeId) {
    if (window.GhostRPG && typeof GhostRPG.setRune === 'function') GhostRPG.setRune(slotIndex, runeId);
    g_dgSpellFlyout = null;
    RenderInventoryModal();
}

// ---------------------------------------------------------------------------
// ABA STATUS — a lista VIT/AGI/INT/POW/MAG e os botões +1/+1K/ALL são os MESMOS
// de RenderRPGStatusDrawer() (mesma chamada GhostRPG.allocateAttribute /
// allocateAttributeBulk, mesma re-renderização). O que entra de novo é só o
// bloco de totais derivados do gear, pra equipar uma peça mexer num número
// visível aqui.
// ---------------------------------------------------------------------------
function DGRenderStatusTab() {
    var stats = window.GhostRPG ? GhostRPG.getStats() : {
        pointsToDistribute: 0, level: 1, xp: 0, xpRequired: 100,
        baseVit: 1, baseAgi: 1, baseInt: 1, basePow: 1, baseMag: 1, bonuses: {}
    };

    function makeButton(attr) {
        if (!(stats.pointsToDistribute > 0)) return '';
        var btn = "<button onclick=\"GhostRPG.allocateAttribute('" + attr + "'); RenderRPGStatusDrawer();\" class='rpg-stat-btn' style='padding:2px 8px; font-size:12px;' title='Add 1 point'>+</button>";
        if (stats.pointsToDistribute >= 1000) {
            btn += "<button onclick=\"GhostRPG.allocateAttributeBulk('" + attr + "', 1000); RenderRPGStatusDrawer();\" class='rpg-stat-btn' style='padding:2px 6px; font-size:11px; margin-left:4px;' title='Add 1000 points'>+1K</button>";
        }
        btn += "<button onclick=\"GhostRPG.allocateAttributeBulk('" + attr + "', 'all'); RenderRPGStatusDrawer();\" class='rpg-stat-btn' style='padding:2px 6px; font-size:11px; margin-left:4px;' title='Spend every available point here'>ALL</button>";
        return btn;
    }

    function statRow(icon, label, base, bonus) {
        // Os botões vão num wrapper próprio: soltos, o space-between da
        // .rpg-stat-row espalhava "+" e "ALL" por toda a linha em vez de mantê-los
        // juntos na direita.
        return "<div class='rpg-stat-row' style='font-size:13px; padding:5px 0;'>" +
            "<span class='rpg-stat-label'>" + icon + " <b>" + label + ":</b> " + DGFmt(base || 0) +
            (bonus > 0 ? " <span style='color:#00FFFF;'>(+" + DGFmt(bonus) + ")</span>" : '') + "</span>" +
            "<span style='display:flex; gap:4px; flex-shrink:0;'>" + makeButton(label.toLowerCase()) + "</span></div>";
    }

    var bonuses = stats.bonuses || {};
    var apHTML = '';
    if (stats.pointsToDistribute > 0) {
        apHTML = "<div style='color:var(--green-neon); font-weight:bold; font-size:12px; text-align:center; margin-bottom:8px; text-shadow:0 0 6px var(--green-neon); font-family:var(--font-title);'>⚡ " +
            DGFmt(stats.pointsToDistribute) + " AP AVAILABLE!</div>";
    }

    var weapon = stats.weapon || { name: 'Starter Dirk', damage: 10, tier: 0 };
    var tier = (window.GhostRPG && GhostRPG.getWeaponTier) ? GhostRPG.getWeaponTier() : (weapon.tier || 0);
    var cost = (window.GhostRPG && GhostRPG.getWeaponUpgradeCost) ? GhostRPG.getWeaponUpgradeCost() : Math.floor(100 * Math.pow(1.15, tier));
    var weaponNames = ['Starter Dirk', 'Shadow Dirk', 'Ghostblade', 'Doom Splicer', 'Soul Reaper', 'Grandfather', 'Doomcalibur', 'Desolation Sword'];
    var nextName = weaponNames[tier + 1] || ('Godly Blade +' + (tier + 1));
    var tierLabel = (tier > 60) ? ('60+ (' + DGFmt(tier) + ')') : String(tier);

    var left =
        apHTML +
        "<div class='rpg-stat-row' style='font-size:13px; padding:5px 0;'><span><b>LEVEL:</b></span><span style='color:var(--cyan-neon); font-weight:bold;' title='" + stats.level + "'>" + DGFmt(stats.level) + "</span></div>" +
        "<div class='rpg-stat-row' style='font-size:13px; padding:5px 0;'><span><b>XP:</b></span><span style='color:var(--cyan-neon); font-weight:bold;'>" + DGFmt(stats.xp) + " / " + DGFmt(stats.xpRequired) + "</span></div>" +
        "<hr style='border-color:rgba(255,255,255,0.1); margin:6px 0;'>" +
        statRow('❤️', 'VIT', stats.baseVit, bonuses.vit) +
        statRow('⚡', 'AGI', stats.baseAgi, bonuses.agi) +
        statRow('🔮', 'INT', stats.baseInt, bonuses.int) +
        statRow('⚔️', 'POW', stats.basePow, bonuses.pow) +
        statRow('🌀', 'MAG', stats.baseMag, bonuses.mag) +
        "<hr style='border-color:rgba(255,255,255,0.1); margin:8px 0;'>" +
        "<div style='font-size:12px; line-height:1.4; color:#FFF;'>" +
        "<div>⚔️ <b>WEAPON:</b> <span style='color:var(--yellow-neon);'>" + escapeHTML(weapon.name) + "</span> <span style='opacity:0.6; font-size:11px;'>T" + tierLabel + "</span></div>" +
        "<div style='margin-bottom:6px;'><b>DAMAGE:</b> <span style='color:var(--yellow-neon);'>" + DGFmt(weapon.damage) + "</span></div>" +
        "<button onclick=\"if(GhostRPG.upgradeWeapon()) { RenderRPGStatusDrawer(); } else { alert('Insufficient Score or Cheat Detected!'); }\" style='width:100%; padding:8px; background:var(--yellow-neon); color:#000; font-weight:bold; border:none; cursor:pointer; font-family:var(--font-title); font-size:11px; border-radius:4px;'>UPGRADE TO " +
        escapeHTML(nextName.toUpperCase()) + " (" + DGFmt(cost) + " PTS)</button></div>";

    return "<div class='dg-inv-body'>" +
        "<div class='dg-inv-col-main'><h4 class='dg-inv-section-title'>Attributes</h4>" + left + "</div>" +
        "<div class='dg-inv-col-side'>" + DGStatusDerivedBox(stats) + "</div>" +
        "</div>";
}

// Aqui mora o "equipar mexeu num número": defesa total, corte de dano, aura
// elemental, etc. Tudo lido de GhostRPG.getGearSummary().
function DGStatusDerivedBox(stats) {
    var html = "<h4 class='dg-inv-section-title'>Derived Totals</h4>";
    if (!window.GhostRPG || typeof window.GhostRPG.getGearSummary !== 'function') {
        return html + "<div class='dg-derived-box'><div style='color:var(--text-muted); font-size:11px;'>Gear data unavailable.</div></div>";
    }
    var s;
    try { s = window.GhostRPG.getGearSummary(); } catch (e) { s = null; }
    if (!s) return html + "<div class='dg-derived-box'><div style='color:var(--text-muted); font-size:11px;'>Gear data unavailable.</div></div>";

    function row(label, value, extra) {
        return "<div class='dg-derived-row'><span class='dg-derived-label'>" + label + "</span>" +
            "<span class='dg-derived-value'>" + value + (extra ? " <span class='dg-derived-split'>" + extra + "</span>" : '') + "</span></div>";
    }

    // O personagem não tem defesa "de base" própria hoje: os 100% da defesa vêm
    // do gear (ver getTotalDefense em rpg_system.js). Mostrar o split deixa isso
    // explícito em vez de o jogador ter que adivinhar de onde veio o número.
    var def = s.defense || 0;
    var html2 = "<div class='dg-derived-box'>";
    html2 += row('Defense', DGFmt(def), '(0 base + ' + DGFmt(def) + ' gear)');
    html2 += row('Damage taken', '-' + Math.round((s.damageReduction || 0) * 100) + '%', '');
    html2 += row('Elemental dmg', '+' + Math.round((s.tierElementalBonus || 0) * 100) + '%', '');
    html2 += row('Fire / Cold', '+' + DGFmt(s.fireBonus || 0) + '% / +' + DGFmt(s.coldBonus || 0) + '%', '');
    html2 += row('Weapon dmg', DGFmt((stats && stats.weapon && stats.weapon.damage) || 0),
        (s.mainhandMultiplier && s.mainhandMultiplier > 1) ? '(x' + s.mainhandMultiplier.toFixed(2) + ' mainhand)' : '');
    html2 += row('Precision dmg', '+' + DGFmt(s.precisionDamage || 0), '');
    html2 += row('Cooldown', '-' + Math.round((s.cooldownReduction || 0) * 100) + '%', '');
    html2 += row('Life leech', DGFmt(s.lifeLeechPercent || 0) + '%', '');
    html2 += row('Mana cap', '+' + DGFmt(s.manaCapBonus || 0), '');
    html2 += row('Vitality bars', '+' + DGFmt(s.vitalityBars || 0), '');
    html2 += "</div>";
    html2 += "<div style='font-size:10px; color:var(--text-muted); margin-top:7px; line-height:1.4;'>These move when you change gear in the EQUIP tab.</div>";
    return html + html2;
}

// ---------------------------------------------------------------------------
window.OpenInventoryModal = OpenInventoryModal;
window.CloseInventoryModal = CloseInventoryModal;
window.ToggleInventoryModal = ToggleInventoryModal;
window.RenderInventoryModal = RenderInventoryModal;
window.DGSwitchInvTab = DGSwitchInvTab;
window.DGShowTip = DGShowTip;
window.DGMoveTip = DGMoveTip;
window.DGHideTip = DGHideTip;
window.DGOpenBagForSlot = DGOpenBagForSlot;
window.DGEquipToSlot = DGEquipToSlot;
window.DGUnequipSlot = DGUnequipSlot;
window.DGClearBagFilter = DGClearBagFilter;
window.DGToggleSpellFlyout = DGToggleSpellFlyout;
window.DGSetSpell = DGSetSpell;
window.DGSetRune = DGSetRune;
