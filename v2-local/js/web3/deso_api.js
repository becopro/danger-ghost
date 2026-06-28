// --- Danger Ghost Web3 DeSo API ---
// This file handles all communication with node.deso.org and identity.deso.org

window.addEventListener('message', function(event) {
				if (event.origin !== "https://identity.deso.org") return;
				var data = event.data;
				
				if (data.method === "initialize") {
					event.source.postMessage({ id: data.id, service: "identity" }, "https://identity.deso.org");
				}
				
				if (window.g_desoPendingAction === 'login' && data.method === "login") {
					for (var key in data.payload.users) {
						window.g_desoPublicKey = key; 
						window.g_desoUserObj = data.payload.users[key];
						try {
							localStorage.setItem("dg_deso_public_key", window.g_desoPublicKey);
							localStorage.setItem("dg_deso_user_obj", JSON.stringify(window.g_desoUserObj));
						} catch(e) {
							console.error("Failed to store DeSo session in localStorage", e);
						}
						break;
					}
					if (window.g_desoPublicKey) {
						window.g_justConnectedWallet = true;
						document.getElementById("desoBtn").innerText = "LOGGED IN: " + window.g_desoPublicKey.substring(0,8) + "...";

						document.getElementById("desoBtn").style.borderColor = "#00FF00";
						document.getElementById("desoBtn").style.color = "#00FF00";
						if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
						window.g_desoPendingAction = null;
						CheckVIPStatus(window.g_desoPublicKey);
						
						var overlay = document.getElementById('mainMenuOverlay');
						if (overlay) overlay.style.display = 'none';
						if (typeof window.OpenCharacterSelection === "function") {
							window.OpenCharacterSelection();
						}
					}
				}
				
				// O JWT payload tem formato diferente: payload.jwt
				if ((window.g_desoPendingAction === 'jwt' || window.g_desoPendingAction === 'char_creation_jwt' || window.g_desoPendingAction === 'char_save_jwt') && data.payload && (typeof data.payload === "string" || data.payload.jwt)) {
					var jwt = typeof data.payload === "string" ? data.payload : data.payload.jwt;
					// Keep window open for redirection to transaction approval
					
					var action = window.g_desoPendingAction;
					window.g_desoPendingAction = null;
					
					if (typeof g_rpgSavePending !== "undefined" && g_rpgSavePending) {
						g_rpgSavePending = false;
						ExecuteDeSoRPGSave(jwt);
					} else if (action === 'char_creation_jwt') {
						ExecuteCharacterPostSubmit(jwt, window.g_pendingCharBlob);
					} else if (action === 'char_save_jwt') {
						ExecuteDeSoRPGSaveWithImage(jwt, window.g_pendingCharSaveBlob, window.g_pendingCharSaveObj);
					} else {
						ExecuteDeSoPost(jwt);
					}
				}
				
				if (data.payload && data.payload.signedTransactionHex) {
					// Se o DeSo Identity já efetuou o broadcast automático com sucesso e retornou o hash,
					// nós consumimos diretamente para evitar colisões redundantes de mempool!
					if (data.payload.txnHashHex) {
						var txHash = data.payload.txnHashHex;
						if (window.g_desoPendingTransactionType === "POST" || window.g_desoPendingTransactionType === "SUBMITTING_POST") {
							window.g_desoPendingTransactionType = null;
							window.g_desoLastPostHashHex = txHash;
							if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
							
							var btn = document.getElementById("desoPostBtn");
							if (btn) {
								btn.innerText = "MINT NFT";
								btn.disabled = false;
								btn.onclick = function() {
									btn.innerText = "MINTING... PLEASE WAIT";
									btn.disabled = true;
									CreateDeSoNFT(window.g_desoLastPostHashHex);
								};
							}
						} else if (window.g_desoPendingTransactionType === "NFT" || window.g_desoPendingTransactionType === "SUBMITTING_NFT") {
							window.g_desoPendingTransactionType = null;
							if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
							
							var btn = document.getElementById("desoPostBtn");
							if (btn) {
								btn.innerText = "SUCCESS! POSTED & MINTED";
								btn.disabled = true;
							}
							alert("🏆 BINGO! Your Win Screenshot was MINTED as a unique NFT directly into your DeSo Wallet! Welcome to Web3.");
						} else if (window.g_desoPendingTransactionType === "RPG_SAVE" || window.g_desoPendingTransactionType === "SUBMITTING_RPG_SAVE") {
							window.g_desoPendingTransactionType = null;
							window.g_desoLastPostHashHex = txHash; // SALVA HASH DO POST REAL TRANSMITIDO
							if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
							
							var btn = document.getElementById("rpgSaveBtn");
							if (btn) {
								btn.innerText = "MINT SAVE NFT";
								btn.style.background = "#00FF00";
								btn.style.color = "#000";
								btn.disabled = false;
								btn.onclick = function() {
									btn.innerText = "STARTING MINT...";
									btn.disabled = true;
									CreateDeSoNFTForRPG(window.g_desoLastPostHashHex);
								};
							}
							alert("🎉 SUCCESS! Progress saved on DeSo.\n\nNow, click on 'MINT SAVE NFT' to generate an exclusive NFT of your save in your wallet!");
						} else if (window.g_desoPendingTransactionType === "RPG_NFT" || window.g_desoPendingTransactionType === "SUBMITTING_RPG_NFT") {
							window.g_desoPendingTransactionType = null;
							if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
							
							var btn = document.getElementById("rpgSaveBtn");
							if (btn) {
								btn.innerText = "NFT MINTED SUCCESSFULLY!";
								btn.style.background = "#00FFFF";
								btn.style.color = "#000";
								btn.disabled = true;
								setTimeout(RenderRPGStatusDrawer, 4000);
							}
							alert("🏆 CONGRATULATIONS! Your Ghost's save has been MINTED as an exclusive NFT in your DeSo wallet!");
						} else if (window.g_desoPendingTransactionType === "RPG_CHAR_PAYMENT" || window.g_desoPendingTransactionType === "SUBMITTING_RPG_CHAR_PAYMENT") {
							window.g_desoPendingTransactionType = null;
							if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
							ExecuteCharacterPostCreation();
						} else if (window.g_desoPendingTransactionType === "RPG_CHAR_POST" || window.g_desoPendingTransactionType === "SUBMITTING_RPG_CHAR_POST") {
							window.g_desoPendingTransactionType = null;
							window.g_desoLastPostHashHex = txHash; // SALVA HASH DO POST REAL TRANSMITIDO
							if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
							CreateDeSoNFTForRPG(window.g_desoLastPostHashHex, "createGhostBtn");
						} else if (window.g_desoPendingTransactionType === "RPG_CHAR_NFT" || window.g_desoPendingTransactionType === "SUBMITTING_RPG_CHAR_NFT") {
							window.g_desoPendingTransactionType = null;
							if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
							alert("🎉 SUCCESS! Your Ghost was minted as an NFT. Let's begin!");
							document.getElementById("characterSelectionOverlay").style.display = "none";
							GhostRPG.loadBlockchainState(1, 1, 1, 1, 1, g_characterCreationId, 0, 0, 1);
							g_score = 0; _antiCheat.hash = btoa("0" + _antiCheat.salt); g_globalTotalTime = 0;
							ResetGame(1);
						}
					} else {
						// Fallback resiliente: caso o Identity não tenha auto-transmitido,
						// nós enviamos a transação assinada manualmente pelo nó DeSo
						if (window.g_desoPendingTransactionType === "POST") window.g_desoPendingTransactionType = "SUBMITTING_POST";
						else if (window.g_desoPendingTransactionType === "NFT") window.g_desoPendingTransactionType = "SUBMITTING_NFT";
						else if (window.g_desoPendingTransactionType === "RPG_SAVE") window.g_desoPendingTransactionType = "SUBMITTING_RPG_SAVE";
						else if (window.g_desoPendingTransactionType === "RPG_CHAR_PAYMENT") window.g_desoPendingTransactionType = "SUBMITTING_RPG_CHAR_PAYMENT";
						else if (window.g_desoPendingTransactionType === "RPG_CHAR_POST") window.g_desoPendingTransactionType = "SUBMITTING_RPG_CHAR_POST";
						else if (window.g_desoPendingTransactionType === "RPG_CHAR_NFT") window.g_desoPendingTransactionType = "SUBMITTING_RPG_CHAR_NFT";
						SubmitSignedTransaction(data.payload.signedTransactionHex);
					}
				}
			});

			function LoginDeSo() {
				var btn = document.getElementById("desoBtn");
				if (btn) {
					btn.innerText = "AWAITING LOGIN...";
					btn.disabled = true;
				}
				window.g_desoPendingAction = 'login';
				window.g_desoIdentityWindow = window.open("https://identity.deso.org/log-in?accessLevelRequest=2", "deso_identity", "width=800,height=1000");
				if (!window.g_desoIdentityWindow) {
					alert("⚠️ POP-UP BLOCKED: Please enable pop-ups in your browser settings to log in to DeSo!");
					if (btn) {
						btn.innerText = "LOGIN DESO";
						btn.disabled = false;
					}
					window.g_desoPendingAction = null;
					return;
				}
				WaitForWindowClose(window.g_desoIdentityWindow, function() {
					if (!window.g_desoPublicKey && btn) {
						btn.innerText = "LOGIN DESO";
						btn.disabled = false;
					}
				});
			}
			window.LoginDeSo = LoginDeSo;

			function PostToDeSo() {
				if (!window.g_desoPublicKey) {
					alert("Please LOGIN TO DESO on the Start Screen before posting your score!");
					return;
				}
				var nameInput = document.getElementById("playerNameInput");
				var pName = nameInput.value.trim() || "UNKNOWN";
				DrawWinScreen(pName); // Estampa o nome
				
				var btn = document.getElementById("desoPostBtn");
				if(btn) { btn.innerText = "UPLOADING... PLEASE WAIT"; btn.disabled = true; }

				window.g_desoIdentityWindow = window.open("", "deso_identity", "width=800,height=1000");
				if (window.g_desoIdentityWindow) {
					window.g_desoIdentityWindow.document.write("<html><head><title>Danger Ghost - Connecting...</title></head><body style='background:#08060c;color:#00ff00;font-family:monospace;text-align:center;padding-top:100px;'><h2>🔮 DANGER GHOST</h2><p>Preparing DeSo transaction approval. Please wait...</p></body></html>");
				}
				
				window.g_desoPendingAction = 'jwt';
				var iframe = document.getElementById("identityIframe");
				var jwtPayload = {};
				if (window.g_desoUserObj) {
					jwtPayload = {
						accessLevel: window.g_desoUserObj.accessLevel,
						accessLevelHmac: window.g_desoUserObj.accessLevelHmac,
						encryptedSeedHex: window.g_desoUserObj.encryptedSeedHex
					};
				}
				iframe.contentWindow.postMessage({
					id: "get_jwt",
					service: "identity",
					method: "jwt",
					payload: jwtPayload
				}, "https://identity.deso.org");
			}
			window.PostToDeSo = PostToDeSo;

			async function ExecuteDeSoPost(jwt) {
				var btn = document.getElementById("desoPostBtn");
				// Validação Anti-Tamper de Memória (Shadow State Check)
				if (btoa(g_score + _antiCheat.salt) !== _antiCheat.hash) {
					alert("⚠️ SECURITY ALERT: Memory manipulation detected! Score has been tampered with.");
					if (btn) { btn.innerText = "SAVE TO DESO (BLOCKCHAIN)"; btn.disabled = false; }
					return;
				}
				
				// Validação Temporal (Sanity Check) - Margem temporal otimizada para acomodar itens e vidas extras na expansão
				var maxScore = (g_globalTotalTime * 250) + 95000; 
				if (g_score > maxScore) {
					alert("⚠️ SECURITY ALERT: Impossible Score/Time ratio! Speedhack detected.");
					if (btn) { btn.innerText = "SAVE TO DESO (BLOCKCHAIN)"; btn.disabled = false; }
					return;
				}
				
				g_canvas.toBlob(async function(blob) {
					try {
						var formData = new FormData();
						formData.append("file", blob, "DangerGhost_Clear.jpg");
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
									console.warn("DeSo image upload response did not contain ImageURL:", uploadData);
								}
							} else {
								console.warn("DeSo image upload failed with status:", uploadRes.status);
							}
						} catch (uploadErr) {
							console.warn("DeSo image upload failed, proceeding without image:", uploadErr);
						}

						var mins = Math.floor(g_globalTotalTime / 60);
						var secs = g_globalTotalTime % 60;
						var timeStr = mins + ":" + secs.toString().padStart(2, '0');
						
						var nameInput = document.getElementById("playerNameInput");
						var pName = nameInput.value.trim() || "UNKNOWN";
						var newPName = pName.substring(0, 15).trim();
						
						var eligibleForTime = true;
						for (var lvl = 1; lvl <= 33; lvl++) {
							if (!window.g_completedLevels || !window.g_completedLevels[lvl]) {
								eligibleForTime = false;
								break;
							}
						}
						if (window.g_hasUsedPassword) {
							eligibleForTime = false;
						}
						if (g_doorsUsed < 33) {
							eligibleForTime = false;
						}
						var postTimeStr = eligibleForTime ? timeStr : "N/A (Skipped Levels/Password Used)";
						var timeParamForScoreList = eligibleForTime ? timeStr : "";



						var rpgMetadata = GhostRPG.getDeSoMetadataString();
						var doorsStr = g_doorsUsed.toString().padStart(2, '0');
						var bodyText = "🎮 I just conquered DANGER GHOST!" + rpgMetadata + "\n\nGhost Hunter: " + pName + "\nScore: " + g_score + "\nTime: " + postTimeStr + "\nLevels Completed: " + doorsStr + " / 33\n#DangerGhost #Web3Gaming #DeSo";
						
						var stats = GhostRPG.getStats();
						var postReq = {
							UpdaterPublicKeyBase58Check: window.g_desoPublicKey,
							BodyObj: {
								Body: bodyText,
								ImageURLs: imageUrls
							},
							PostExtraData: {
								"DangerGhost_CharacterID": stats.characterId,
								"DangerGhost_SaveState": SafeBtoa(JSON.stringify(Object.assign({}, stats, { score: g_score, time: g_globalTotalTime }))),
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
							window.g_desoPendingTransactionType = "POST";

							var btn = document.getElementById("desoPostBtn");
							if (btn) {
								btn.innerText = "WAITING FOR APPROVAL...";
								btn.disabled = true;
							}

							if (window.g_desoIdentityWindow && !window.g_desoIdentityWindow.closed) {
								window.g_desoIdentityWindow.location.href = "https://identity.deso.org/approve?tx=" + postData.TransactionHex;
							} else {
								window.g_desoIdentityWindow = window.open("https://identity.deso.org/approve?tx=" + postData.TransactionHex, "deso_identity", "width=800,height=1000");
							}

							WaitForWindowClose(window.g_desoIdentityWindow, function() {
								if (window.g_desoPendingTransactionType === "POST") {
									var b = document.getElementById("desoPostBtn");
									if (b) {
										b.innerText = "SAVE TO DESO (BLOCKCHAIN)";
										b.disabled = false;
									}
								}
							});
							DrawWinScreen(); 
						} else {
							if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
							var btn = document.getElementById("desoPostBtn");
							if(btn) { btn.innerText = "SAVE TO DESO (BLOCKCHAIN)"; btn.disabled = false; }
							console.error("Unexpected DeSo response", postData);
							alert("Error: Unexpected DeSo response format. Check console.");
							DrawWinScreen(); 
						}
					} catch(e) {
						if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
						console.error("DeSo Error", e);
						alert("Error posting to DeSo. Check console.");
						var btn = document.getElementById("desoPostBtn");
						if(btn) { btn.innerText = "SAVE TO DESO (BLOCKCHAIN)"; btn.disabled = false; }
						DrawWinScreen(); 
					}
				}, "image/jpeg", 0.95);
			}

			var g_rpgSavePending = false;

			function TriggerRPGSaveToDeSo() {
				if (!window.g_desoPublicKey) {
					alert("Please LOG IN to DeSo before saving!");
					return;
				}
				
				var btn = document.getElementById("rpgSaveBtn");
				if(btn) { btn.innerText = "OBTAINING KEY..."; btn.disabled = true; }

				window.g_desoIdentityWindow = window.open("", "deso_identity", "width=800,height=1000");
				if (window.g_desoIdentityWindow) {
					window.g_desoIdentityWindow.document.write("<html><head><title>Danger Ghost - Connecting...</title></head><body style='background:#08060c;color:#00ff00;font-family:monospace;text-align:center;padding-top:100px;'><h2>🔮 DANGER GHOST</h2><p>Preparing DeSo transaction approval. Please wait...</p></body></html>");
				}
				
				window.g_desoPendingAction = 'jwt';
				g_rpgSavePending = true;
				
				var iframe = document.getElementById("identityIframe");
				var jwtPayload = {};
				if (window.g_desoUserObj) {
					jwtPayload = {
						accessLevel: window.g_desoUserObj.accessLevel,
						accessLevelHmac: window.g_desoUserObj.accessLevelHmac,
						encryptedSeedHex: window.g_desoUserObj.encryptedSeedHex
					};
				}
				iframe.contentWindow.postMessage({
					id: "get_jwt",
					service: "identity",
					method: "jwt",
					payload: jwtPayload
				}, "https://identity.deso.org");
			}
			window.TriggerRPGSaveToDeSo = TriggerRPGSaveToDeSo;

			async function ExecuteDeSoRPGSave(jwt) {
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
			async function TriggerCreateNewGhost() {
				var btn = document.getElementById("createGhostBtn");
				var status = document.getElementById("selectionStatusText");
				
				if (!window.g_desoPublicKey) {
					alert("Please connect your wallet first!");
					return;
				}

				if (btn) btn.disabled = true;
				if (status) status.innerText = "Starting creation of a new Ghost...";

				window.g_desoIdentityWindow = window.open("", "deso_identity", "width=800,height=1000");
				if (window.g_desoIdentityWindow) {
					window.g_desoIdentityWindow.document.write("<html><head><title>Danger Ghost - Connecting...</title></head><body style='background:#08060c;color:#00ff00;font-family:monospace;text-align:center;padding-top:100px;'><h2>🔮 DANGER GHOST</h2><p>Preparing DeSo transaction approval. Please wait...</p></body></html>");
				}

				var priceDeSo = window.g_ownedCharacters.length * 0.25;
				g_characterCreationId = "dg_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

				if (priceDeSo > 0) {
					if (status) status.innerText = "Preparing transaction of " + priceDeSo + " DeSo for the developer...";
					try {
						var sendReq = {
							SenderPublicKeyBase58Check: window.g_desoPublicKey,
							RecipientPublicKeyOrUsername: "BC1YLgwuSYXasawyfX5D8wiVSvC7qS1usfPA9QCnJ3ZRndyRcRmKdUG",
							AmountNanos: Math.floor(priceDeSo * 1e9),
							MinFeeRateNanosPerKB: 1000
						};
						var res = await fetch("https://node.deso.org/api/v0/send-deso", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(sendReq)
						});
						var data = await res.json();
						if (data.TransactionHex) {
							window.g_desoPendingTransactionHex = data.TransactionHex;
							window.g_desoPendingTransactionType = "RPG_CHAR_PAYMENT";
							g_characterCreationPending = true;
							
							if (window.g_desoIdentityWindow && !window.g_desoIdentityWindow.closed) {
								window.g_desoIdentityWindow.location.href = "https://identity.deso.org/approve?tx=" + data.TransactionHex;
							} else {
								window.g_desoIdentityWindow = window.open("https://identity.deso.org/approve?tx=" + data.TransactionHex, "deso_identity", "width=800,height=1000");
							}
							if (status) status.innerText = "Waiting for payment approval in the pop-up...";
						} else {
							throw new Error(data.error || "Error generating payment transaction.");
						}
					} catch(e) {
						console.error("Payment Error", e);
						alert("DeSo Payment Error: " + e.message);
						if (btn) btn.disabled = false;
						if (status) status.innerText = "Creation failed: " + e.message;
					}
				} else {
					if (status) status.innerText = "Generating Ghost data and image...";
					ExecuteCharacterPostCreation();
				}
			}
			window.TriggerCreateNewGhost = TriggerCreateNewGhost;

			async function ExecuteCharacterPostCreation() {
				var status = document.getElementById("selectionStatusText");
				if (status) status.innerText = "Rendering Ghost NFT image...";

				var defaultStats = {
					level: 1,
					xp: 0,
					xpRequired: 100,
					vit: 1,
					agi: 1,
					int: 1,
					pow: 1,
					mag: 1,
					characterId: g_characterCreationId,
					score: 0,
					time: 0
				};

				RenderCharacterNFTBlob(defaultStats, async function(blob) {
					if (status) status.innerText = "Uploading NFT image...";
					try {
						window.g_desoPendingAction = 'char_creation_jwt';
						
						var iframe = document.getElementById("identityIframe");
						var jwtPayload = {};
						if (window.g_desoUserObj) {
							jwtPayload = {
								accessLevel: window.g_desoUserObj.accessLevel,
								accessLevelHmac: window.g_desoUserObj.accessLevelHmac,
								encryptedSeedHex: window.g_desoUserObj.encryptedSeedHex
							};
						}
						window.g_pendingCharBlob = blob;
						iframe.contentWindow.postMessage({
							id: "get_jwt",
							service: "identity",
							method: "jwt",
							payload: jwtPayload
						}, "https://identity.deso.org");
					} catch(err) {
						console.error("Blob upload prep error", err);
						if (status) status.innerText = "Error preparing upload.";
						var btn = document.getElementById("createGhostBtn");
						if (btn) btn.disabled = false;
					}
				});
			}

			async function ExecuteCharacterPostSubmit(jwt, blob) {
				var status = document.getElementById("selectionStatusText");
				if (status) status.innerText = "Uploading image to the DeSo node...";
				try {
					var formData = new FormData();
					formData.append("file", blob, "DangerGhost_Char_" + g_characterCreationId + ".jpg");
					formData.append("UserPublicKeyBase58Check", window.g_desoPublicKey);
					formData.append("JWT", jwt);

					var uploadRes = await fetch("https://node.deso.org/api/v0/upload-image", {
						method: "POST",
						body: formData
					});
					var uploadData = await uploadRes.json();
					var imageUrl = uploadData.ImageURL;

					if (status) status.innerText = "Creating Ghost post transaction...";
					var defaultStats = {
						level: 1,
						vit: 1,
						agi: 1,
						int: 1,
						pow: 1,
						mag: 1,
						characterId: g_characterCreationId,
						score: 0,
						time: 0
					};

					var bodyText = "🔮 Danger Ghost - New Ghost Initiated!\n\n" +
								   "ID: " + g_characterCreationId.substring(0,12) + "...\n" +
								   "Level: 1\n" +
								   "VIT: 1 | AGI: 1 | INT: 1 | POW: 1 | MAG: 1\n\n" +
								   "#DangerGhostCharacter #NewGhost #DeSo";

					var postReq = {
						UpdaterPublicKeyBase58Check: window.g_desoPublicKey,
						BodyObj: {
							Body: bodyText,
							ImageURLs: [imageUrl]
						},
						PostExtraData: {
							"DangerGhost_CharacterID": g_characterCreationId,
							"DangerGhost_SaveState": SafeBtoa(JSON.stringify(defaultStats)),
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
						window.g_desoPendingTransactionType = "RPG_CHAR_POST";
						
						if (window.g_desoIdentityWindow && !window.g_desoIdentityWindow.closed) {
							window.g_desoIdentityWindow.location.href = "https://identity.deso.org/approve?tx=" + postData.TransactionHex;
						} else {
							window.g_desoIdentityWindow = window.open("https://identity.deso.org/approve?tx=" + postData.TransactionHex, "deso_identity", "width=800,height=1000");
						}
						if (status) status.innerText = "Approve Ghost post creation in the pop-up...";
					} else {
						throw new Error(postData.error || "Error in submit-post from DeSo node.");
					}
				} catch(e) {
					if (window.g_desoIdentityWindow) window.g_desoIdentityWindow.close();
					console.error("Post Submission Error", e);
					if (status) status.innerText = "Error sending post: " + e.message;
					var btn = document.getElementById("createGhostBtn");
					if (btn) btn.disabled = false;
				}
			}

			async function LoadRPGStateFromDeSo(publicKey, forceShowOverlay) {
    if (window.g_desoCharactersLoading) {
        console.log('[DeSo Sync] Already loading characters, skipping duplicate request.');
        return;
    }
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
            var postsRes = await fetch("https://node.deso.org/api/v0/get-posts-for-public-key", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ PublicKeyBase58Check: publicKey, NumToFetch: 1000 })
            });
            if (postsRes.ok) {
                var postsData = await postsRes.json();
                if (postsData.Posts) {
                    for (var i = 0; i < postsData.Posts.length; i++) {
                        var p = postsData.Posts[i];
                        if (p && p.PostExtraData && p.PostExtraData["DangerGhost_SaveState"]) {
                            var charId = p.PostExtraData["DangerGhost_CharacterID"] || "legacy_char";
                            var baseStats = {};
                            try {
                                var baseDec = window.SafeAtob ? window.SafeAtob(p.PostExtraData["DangerGhost_SaveState"]) : atob(p.PostExtraData["DangerGhost_SaveState"]);
                                baseStats = JSON.parse(baseDec);
                            } catch(e) {}
                            
                            var existing = charactersMap.get(charId);
                            var finalStats = baseStats;
                            if (existing && (parseInt(existing.level, 10) || 0) > (parseInt(finalStats.level, 10) || 0)) {
                                finalStats = existing;
                            }
                            if (saves[charId] && (parseInt(saves[charId].level, 10) || 0) > (parseInt(finalStats.level, 10) || 0)) {
                                finalStats = saves[charId];
                            }
                            
                            finalStats.characterId = charId;
                            if (p.ImageURLs && p.ImageURLs[0]) {
                                finalStats.imageUrl = p.ImageURLs[0];
                            }
                            if (p.PostHashHex) {
                                finalStats.postHashHex = p.PostHashHex;
                            }
                            
                            charactersMap.set(charId, finalStats);
                        }
                    }
                }
            }
        } catch(e) { console.warn("Failed fetching Posts", e); }

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
                            var charId = p.PostExtraData["DangerGhost_CharacterID"] || "legacy_char";
                            var baseStats = {};
                            try {
                                var baseDec = window.SafeAtob ? window.SafeAtob(p.PostExtraData["DangerGhost_SaveState"]) : atob(p.PostExtraData["DangerGhost_SaveState"]);
                                baseStats = JSON.parse(baseDec);
                            } catch(e) {}
                            
                            var existing = charactersMap.get(charId);
                            var finalStats = baseStats;
                            if (existing && (parseInt(existing.level, 10) || 0) > (parseInt(finalStats.level, 10) || 0)) {
                                finalStats = existing;
                            }
                            if (saves[charId] && (parseInt(saves[charId].level, 10) || 0) > (parseInt(finalStats.level, 10) || 0)) {
                                finalStats = saves[charId];
                            }
                            
                            finalStats.characterId = charId;
                            if (p.ImageURLs && p.ImageURLs[0]) {
                                finalStats.imageUrl = p.ImageURLs[0];
                            }
                            if (p.PostHashHex) {
                                finalStats.postHashHex = p.PostHashHex;
                            }
                            
                            charactersMap.set(charId, finalStats);
                        }
                    }
                }
            }
        } catch(e) { console.warn("Failed fetching NFTs", e); }

        var uniqueMap = new Map();
        Array.from(charactersMap.values()).forEach(function(char) {
            if (char && char.characterId) {
                var normId = String(char.characterId).toLowerCase().trim();
                if (!uniqueMap.has(normId)) {
                    uniqueMap.set(normId, char);
                } else {
                    var existing = uniqueMap.get(normId);
                    if ((parseInt(char.level, 10) || 0) > (parseInt(existing.level, 10) || 0)) {
                        uniqueMap.set(normId, char);
                    }
                }
            }
        });
        var uniqueCharacters = Array.from(uniqueMap.values());
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
window.LoadRPGStateFromDeSo = LoadRPGStateFromDeSo;
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
									alert("POP-UP BLOCKED: Please enable pop-ups to authorize the NFT creation!");
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
				var bodyText = "Danger Ghost - Saved Ghost Progress!\n\n" +
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
						alert("POP-UP BLOCKED: Please enable pop-ups to approve saving!");
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

        window.g_ownedCharacters = [];

        function DisplayCharacterSelectionScreen(characters) {
            window.g_ownedCharacters = characters || [];
            var overlay = document.getElementById("characterSelectionOverlay");
            if (overlay) overlay.style.display = "flex";

            var container = document.getElementById("characterCardsContainer");
            var mintBox = document.querySelector(".new-ghost-box");
            
            if (!window.g_desoUserObj) {
                if (container) {
                    container.innerHTML = "<div style='text-align:center; color: var(--yellow-neon); font-size: 20px; font-family: var(--font-title); letter-spacing: 1px;'>GUEST MODE ACTIVE</div>" +
                        "<div style='text-align:center; color: var(--text-muted); font-size: 16px; line-height: 1.5; margin-top: 8px;'>You cannot save or load progress without a Wallet.</div>" +
                        "<div style='display:flex; flex-direction:column; gap:15px; align-items:center; margin-top:20px;'>" +
                        "<button onclick='window.LoginDeSo()' class='cyber-btn primary' style='width:280px;'><span class='btn-content' style='justify-content: center;'><span class='btn-text'>CONNECT WALLET</span></span></button>" +
                        "<button onclick='window.g_score=0; GhostRPG.resetStats(); document.getElementById(\"characterSelectionOverlay\").style.display=\"none\"; if(window.g_gameState===window.G_START){StartCutscene();}else{window.g_gamePaused=false;if(window.PlayBGM)window.PlayBGM();}' class='cyber-btn tertiary' style='width:280px;'><span class='btn-content' style='justify-content: center;'><span class='btn-text'>START GUEST RUN</span></span></button>" +
                        "</div>";
                }
                if (mintBox) mintBox.style.display = "none";
                return;
            }

            if (mintBox) mintBox.style.display = "block";
            
            if (container) container.innerHTML = "";

            var priceText = document.getElementById("newGhostPriceText");
            var priceDeSo = characters.length * 0.25;
            if (priceText) {
                if (characters.length === 0) {
                    priceText.innerHTML = "Your first Ghost is 100% free (only pay DeSo network fees).";
                } else {
                    priceText.innerHTML = "You already own " + characters.length + " Ghost(s). Creating your " + (characters.length + 1) + "th Ghost will cost <b style='color: var(--yellow-neon);'>" + priceDeSo.toFixed(2) + " DeSo</b> + network fees.";
                }
            }

            if (characters.length === 0) {
                if (container) container.innerHTML = "<div style='color: var(--text-muted); font-size: 16px; line-height: 1.5; margin: 40px auto; text-align: center; width: 100%;'>You don't own any Ghosts yet. Initialize your first Vessel below!</div>";
                return;
            }

            for (var i = 0; i < characters.length; i++) {
                var char = characters[i];
                var card = document.createElement("div");
                card.className = "character-card";

                var imgHTML = "";
                if (char.imageUrl) {
                    imgHTML = "<img src='" + escapeHTML(char.imageUrl) + "' />";
                } else {
                    imgHTML = "<div style='color: var(--text-muted); font-family: var(--font-mono); font-size: 14px;'>NO VISUAL DATA</div>";
                }

                card.innerHTML = 
                    "<div class='character-img-box'>" + imgHTML + "</div>" +
                    "<div class='character-name'>GHOST #" + (i + 1) + "</div>" +
                    "<div class='character-id'>ID: " + escapeHTML(char.characterId.substring(0, 12)) + "...</div>" +
                    "<div class='character-stats'>" +
                    "<div><b>LEVEL:</b> <span class='highlight'>" + escapeHTML(char.level) + "</span></div>" +
                    "<div>VIT: " + escapeHTML(char.vit) + " | AGI: " + escapeHTML(char.agi) + "</div>" +
                    "<div>INT: " + escapeHTML(char.int) + " | POW: " + escapeHTML(char.pow) + " | MAG: " + escapeHTML(char.mag || 1) + "</div>" +
                    "</div>";

                var playBtn = document.createElement("button");
                playBtn.className = "cyber-btn primary";
                playBtn.style.marginTop = "auto";
                playBtn.style.width = "100%";
                playBtn.style.textAlign = "center";
                playBtn.style.padding = "12px";
                playBtn.innerHTML = "<span class='btn-content' style='justify-content: center;'><span class='btn-icon' style='color: var(--cyan-neon);'>▶</span><span class='btn-text'>SYNCHRONIZE</span></span>";
                
                (function(id) {
                    playBtn.onclick = function() {
                        SelectCharacterToPlay(id);
                    };
                })(char.characterId);
                
                card.appendChild(playBtn);
                if (container) container.appendChild(card);
            }
        }
        window.DisplayCharacterSelectionScreen = DisplayCharacterSelectionScreen;

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
                
                if (window.g_gameState === window.G_START) {
                    if (typeof window.StartCutscene === "function") window.StartCutscene();
                } else {
                    // Se o jogo já passou da Cutscene ou estava pausado:
                    window.g_gamePaused = false;
                    if (typeof window.PlayBGM === "function") window.PlayBGM();
                }
            }
        }
        window.SelectCharacterToPlay = SelectCharacterToPlay;

        // --- Character NFT Rendering Helper ---
        var characterGhostBase = new Image();
        characterGhostBase.src = 'assets/sprites/character_ghost_base.webp';

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

            ctx.strokeStyle = "#00FF00";
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
                    ctx.fillText("[DESO GHOST]", 150, 200);
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
                ctx.strokeStyle = "rgba(0, 255, 255, 0.3)";
                ctx.lineWidth = 1;
                ctx.strokeRect(320, 20, 260, 360);

                ctx.fillStyle = "#00FF00";
                ctx.font = "bold 18px 'Courier New'";
                ctx.textAlign = "center";
                ctx.fillText("🛡️ HERO STATUS", 450, 50);
                ctx.textAlign = "start";

                ctx.strokeStyle = "rgba(0,255,255,0.2)";
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
                ctx.fillStyle = "#FF00FF";
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
                var shortId = stats.characterId ? stats.characterId.substring(0, 16) + "..." : "MINTING ON-CHAIN...";
                ctx.fillText("CHAR ID: " + shortId, 340, startAttrY + gap * 4 + 35);
                ctx.fillText("POWERED BY DESO BLOCKCHAIN", 340, startAttrY + gap * 4 + 47);

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

if (window.gameEventBus) {
    window.gameEventBus.on('level_completed', function(data) {
        if (window.g_desoUserObj) {
            console.log("[DeSo Auto-Save] Level completed event received. Saving progress to DeSo blockchain...");
            TriggerRPGSaveToDeSo();
        }
    });
}
