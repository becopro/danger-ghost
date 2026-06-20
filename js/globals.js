
		// Secure HTML Escaping function to shield against stored XSS attacks
		function escapeHTML(str) {
			if (!str) return "";
			return str.toString()
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#039;");
		}
		window.escapeHTML = escapeHTML;

		function SafeBtoa(str) {
			try {
				return btoa(unescape(encodeURIComponent(str)));
			} catch (err) {
				console.error("SafeBtoa failed:", err);
				return btoa(str);
			}
		}
		function SafeAtob(str) {
			try {
				var raw = atob(str);
				try {
					return decodeURIComponent(escape(raw));
				} catch (e) {
					return raw;
				}
			} catch (err) {
				console.error("SafeAtob failed:", err);
				return atob(str);
			}
		}
		window.SafeBtoa = SafeBtoa;
		window.SafeAtob = SafeAtob;

		// --- Web3 DeSo NFT/Save Helpers ---
		async function CreateDeSoNFTForRPG(postHashHex, buttonId) {
			var bId = buttonId || "rpgSaveBtn";
			var btn = document.getElementById(bId);
			var maxAttempts = 4;
			var attempt = 0;
			
			async function attemptMint() {
				attempt++;
				if (btn) btn.innerText = "MINTING NFT... (" + attempt + "/" + maxAttempts + ")";
				try {
					var nftReq = {
						UpdaterPublicKeyBase58Check: window.g_desoPublicKey,
						NFTPostHashHex: postHashHex,
						NumCopies: 1,
						NFTRoyaltyToCreatorBasisPoints: 500,
						NFTRoyaltyToCoinBasisPoints: 500,
						HasUnlockable: false,
						IsForSale: false,
						MinFeeRateNanosPerKB: 1000
					};
					var res = await fetch("https://node.deso.org/api/v0/create-nft", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(nftReq)
					});
					var data = await res.json();
					if (data.TransactionHex) {
						if(btn) { 
							btn.innerText = bId === "createGhostBtn" ? "APPROVE NFT CREATION" : "APPROVE SAVE NFT"; 
							btn.disabled = false; 
							btn.onclick = function() {
								window.g_desoPendingTransactionType = bId === "createGhostBtn" ? "RPG_CHAR_NFT" : "RPG_NFT";
								window.g_desoIdentityWindow = window.open("https://identity.deso.org/approve?tx=" + data.TransactionHex, "deso_identity", "width=800,height=1000");
								if (!window.g_desoIdentityWindow) {
									alert("⚠️ POP-UP BLOCKED: Please enable pop-ups to authorize the NFT creation!");
									return;
								}
								btn.innerText = "WAITING FOR APPROVAL...";
								btn.disabled = true;
								window.WaitForWindowClose(window.g_desoIdentityWindow, function() {
									if (window.g_desoPendingTransactionType === "RPG_NFT" || window.g_desoPendingTransactionType === "RPG_CHAR_NFT") {
										btn.innerText = bId === "createGhostBtn" ? "APPROVE NFT CREATION" : "APPROVE SAVE NFT";
										btn.disabled = false;
									}
								});
							};
						}
					} else {
						var isIndexError = data.error && (data.error.includes("not found") || data.error.includes("mempool") || data.error.includes("find") || data.error.includes("index"));
						if (attempt < maxAttempts && isIndexError) {
							console.warn("NFT Minting indexing delay, retrying in 1.5s...", data.error);
							setTimeout(attemptMint, 1500);
						} else {
							console.error("NFT creation failed", data);
							alert("Error creating NFT: " + (data.error || "Unknown error"));
							if(btn) {
								btn.innerText = bId === "createGhostBtn" ? "RE-MINT GHOST" : "RE-MINT SAVE";
								btn.disabled = false;
								btn.onclick = function() {
									CreateDeSoNFTForRPG(postHashHex, bId);
								};
							}
						}
					}
				} catch(e) { 
					console.error("NFT Error", e); 
					if (attempt < maxAttempts) {
						setTimeout(attemptMint, 1500);
					} else {
						alert("Error creating NFT: " + e.message);
						if(btn) {
							btn.innerText = bId === "createGhostBtn" ? "RE-MINT GHOST" : "RE-MINT SAVE";
							btn.disabled = false;
							btn.onclick = function() {
								CreateDeSoNFTForRPG(postHashHex, bId);
							};
						}
					}
				}
			}
			
			attemptMint();
		}

		async function ExecuteDeSoRPGSaveWithImage(jwt, blob, saveObj) {
			var btn = document.getElementById("rpgSaveBtn");
			if(btn) { btn.innerText = "UPLOADING IMAGE..."; btn.disabled = true; }
			try {
				var formData = new FormData();
				formData.append("file", blob, "DangerGhost_Save_" + saveObj.characterId + ".jpg");
				formData.append("UserPublicKeyBase58Check", window.g_desoPublicKey);
				formData.append("JWT", jwt);

				var imageUrls = [];
				try {
					var uploadRes = await fetch("https://node.deso.org/api/v0/upload-image", {
						method: "POST",
						body: formData
					});
					if (uploadRes.ok) {
						var uploadData = await uploadRes.json();
						if (uploadData && uploadData.ImageURL) {
							imageUrls.push(uploadData.ImageURL);
						} else {
							console.warn("DeSo save image upload did not return ImageURL:", uploadData);
						}
					} else {
						console.warn("DeSo save image upload failed with status:", uploadRes.status);
					}
				} catch (uploadErr) {
					console.warn("DeSo save image upload failed, proceeding without image:", uploadErr);
				}

				if(btn) btn.innerText = "SUBMITTING SAVE...";
				var bodyText = "🎮 Danger Ghost - Saved Ghost Progress!\n\n" +
							   "ID: " + saveObj.characterId.substring(0,12) + "...\n" +
							   "Level: " + saveObj.level + "\n" +
							   "VIT: " + saveObj.vit + " | AGI: " + saveObj.agi + " | INT: " + saveObj.int + " | POW: " + saveObj.pow + "\n\n" +
							   "#DangerGhostSave #GhostEvolved #DeSo";

				var postReq = {
					UpdaterPublicKeyBase58Check: window.g_desoPublicKey,
					BodyObj: {
						Body: bodyText,
						ImageURLs: imageUrls
					},
					PostExtraData: {
						"DangerGhost_CharacterID": saveObj.characterId,
						"DangerGhost_SaveState": SafeBtoa(JSON.stringify(saveObj)),
						"DangerGhost_GameApp": "v1.0.0"
					},
					MinFeeRateNanosPerKB: 1000
				};

				var postRes = await fetch("https://node.deso.org/api/v0/submit-post", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(postReq)
				});
				var postData = await postRes.json();
				
				if (postData.TransactionHex && postData.PostHashHex) {
					window.g_desoPendingTransactionHex = postData.TransactionHex;
					window.g_desoLastPostHashHex = postData.PostHashHex;
					window.g_desoPendingTransactionType = "RPG_SAVE";
					
					window.g_desoIdentityWindow = window.open("https://identity.deso.org/approve?tx=" + postData.TransactionHex, "deso_identity", "width=800,height=1000");
					if (!window.g_desoIdentityWindow) {
						alert("⚠️ POP-UP BLOCKED: Please enable pop-ups to approve saving!");
						if(btn) { btn.innerText = "SAVE EVOLUTION (BLOCKCHAIN)"; btn.disabled = false; }
						return;
					}
					if(btn) btn.innerText = "APPROVE SAVE IN POP-UP...";
					
					window.WaitForWindowClose(window.g_desoIdentityWindow, function() {
						if (window.g_desoPendingTransactionType === "RPG_SAVE") {
							if(btn) { btn.innerText = "SAVE EVOLUTION (BLOCKCHAIN)"; btn.disabled = false; }
						}
					});
				} else {
					throw new Error(postData.error || "Error in submit-post from DeSo node.");
				}
			} catch(e) {
				console.error("Save RPG Error", e);
				if(btn) { btn.innerText = "SAVE EVOLUTION (BLOCKCHAIN)"; btn.disabled = false; }
				alert("Error saving Ghost: " + e.message);
			}
		}
		
		window.CreateDeSoNFTForRPG = CreateDeSoNFTForRPG;
		window.ExecuteDeSoRPGSaveWithImage = ExecuteDeSoRPGSaveWithImage;
	
	