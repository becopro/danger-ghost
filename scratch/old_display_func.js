function DisplayCharacterSelectionScreen(characters) {
				window.g_ownedCharacters = characters;
				var overlay = document.getElementById("characterSelectionOverlay");
				overlay.style.display = "block";

				var container = document.getElementById("characterCardsContainer");
				container.innerHTML = "";

				var priceText = document.getElementById("newGhostPriceText");
				var priceDeSo = characters.length * 0.25;
				if (characters.length === 0) {
					priceText.innerHTML = "Your first Ghost is 100% free (only pay DeSo network fees).";
				} else {
					priceText.innerHTML = "You already own " + characters.length + " Ghost(s). Creating your " + (characters.length + 1) + "th Ghost will cost <b>" + priceDeSo.toFixed(2) + " DeSo</b> + network fees.";
				}

				if (characters.length === 0) {
					container.innerHTML = "<div style='color: #888; font-size: 15px; margin: 20px 0;'>You don't own any Ghosts. Create your first one below!</div>";
					return;
				}

				for (var i = 0; i < characters.length; i++) {
					var char = characters[i];
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
						imgHTML = "<img src='" + escapeHTML(char.imageUrl) + "' style='width: 100%; height: 140px; object-fit: contain; background: #0a0810; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);' />";
					} else {
						imgHTML = "<div style='width: 100%; height: 140px; background: #0a0810; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #555; border: 1px dashed rgba(255,255,255,0.1);'>No Image</div>";
					}

					card.innerHTML = 
						imgHTML +
						"<div style='font-size: 14px; font-weight: bold; color: #00FF00;'>���W% Ghost #" + (i + 1) + "</div>" +
						"<div style='font-size: 11px; color: #888;'>ID: " + escapeHTML(char.characterId.substring(0, 12)) + "...</div>" +
						"<hr style='border-color: rgba(255,255,255,0.1); margin: 4px 0;' />" +
						"<div style='font-size: 12px; color: #FFF; display: flex; flex-direction: column; gap: 3px;'>" +
						"<div><b>Level:</b> <span style='color: #00FFFF;'>" + escapeHTML(char.level) + "</span></div>" +
						"<div>������ VIT: " + escapeHTML(char.vit) + " | ��� AGI: " + escapeHTML(char.agi) + "</div>" +
						"<div>���� INT: " + escapeHTML(char.int) + " | ������ POW: " + escapeHTML(char.pow) + " | ���� MAG: " + escapeHTML(char.mag || 1) + "</div>" +
						"</div>";

					var playBtn = document.createElement("button");
					playBtn.innerText = "PLAY";
					playBtn.style.width = "100%";
					playBtn.style.padding = "6px";
					playBtn.style.background = "#00FFFF";
					playBtn.style.color = "#000";
					playBtn.style.border = "none";
					playBtn.style.fontWeight = "bold";
					playBtn.style.cursor = "pointer";
					playBtn.style.borderRadius = "4px";
					playBtn.style.fontFamily = "'Courier New'";
					playBtn.style.marginTop = "10px";
					
					(function(id) {
						playBtn.onclick = function() {
							SelectCharacterToPlay(id);
						};
					})(char.characterId);
					
					card.appendChild(playBtn);
					container.appendChild(card);
				}
			}