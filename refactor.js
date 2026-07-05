const fs = require('fs');

let content = fs.readFileSync('c:/Users/Klara/Desktop/dragaMP/danger ghost/index.html', 'utf8');

// 1. Remove FetchLeaderboard function
content = content.replace(/async function FetchLeaderboard\(\) \{[\s\S]*?\/\/ --- PREMIUM HORIZONTAL NAVBAR CONTROLS BOOTSTRAP ---/m, '// --- PREMIUM HORIZONTAL NAVBAR CONTROLS BOOTSTRAP ---');

// 2. Remove FetchLeaderboard setInterval
content = content.replace(/\/\/ Lazy loaded: FetchLeaderboard is called when first opening score\/time tabs\.[\s\S]*?\}, 60000\);/m, '');

// 3. Remove ParentStakeID from ExecuteDeSoPost
content = content.replace(/ParentStakeID: "fd622ab4b7723a8a4d17fe0d7bd2bcc11e22832dde0a4a45ad637760ee89cd40",\s*\/\/\s*Link Permanente ao Post de Ranking Oficial/g, '');

// 4. Remove fallback in ExecuteDeSoPost
content = content.replace(/\/\/ FALLBACK: Se falhar ao comentar na thread principal[\s\S]*?postData = await postRes\.json\(\);\s*\}/g, '');

// 5. Remove ParentStakeID from ExecuteDeSoRPGSave
// (already covered by #3)

// 6. Remove thread fetching in LoadRPGStateFromDeSo
content = content.replace(/\/\/ 2\. Buscamos comentários da thread de ranking oficial[\s\S]*?\/\/ 3\. Buscamos todos os NFTs pertencentes ao usuário/m, '// 3. Buscamos todos os NFTs pertencentes ao usuário');

// 7. Remove leaderboard updating logic in ExecuteDeSoPost
const leaderboardLogicPattern = /if \(\!g_leaderboardList\) g_leaderboardList = \[\];[\s\S]*?levelTop10Text \+= \(i\+1\) \+ "\. " \+ item\.name \+ " \- Level " \+ \(item\.rpgLevel \|\| 1\) \+ "\\n";\s*\}/m;
content = content.replace(leaderboardLogicPattern, '');

// 8. Fix bodyText in ExecuteDeSoPost
content = content.replace(/var bodyText = "🎮 I just conquered DANGER GHOST!" \+ rpgMetadata \+ "\\n\\nGhost Hunter: " \+ pName \+ "\\nScore: " \+ g_score \+ "\\nTime: " \+ postTimeStr \+ "\\nLevels Completed: " \+ doorsStr \+ " \/ 33" \+ top10Text \+ levelTop10Text \+ "\\n#DangerGhost #Web3Gaming #DeSo";/g, 'var bodyText = "🎮 I just conquered DANGER GHOST!" + rpgMetadata + "\\n\\nGhost Hunter: " + pName + "\\nScore: " + g_score + "\\nTime: " + postTimeStr + "\\nLevels Completed: " + doorsStr + " / 33\\n#DangerGhost #Web3Gaming #DeSo";');

// Also remove calls to UpdateNavbarScore and UpdateNavbarTime if they exist in FetchLeaderboard (removed already)
// There might be buttons in HTML that call ToggleNavbarTab('score') or 'time'
// Let's remove tabs
content = content.replace(/<div class="navbar-tab" id="tabScore".*?<\/div>/g, '');
content = content.replace(/<div class="navbar-tab" id="tabTime".*?<\/div>/g, '');
content = content.replace(/<div id="panelScore".*?<\/div>/g, '');
content = content.replace(/<div id="panelTime".*?<\/div>/g, '');

// Any other references to Rank
// g_leaderboardList and g_timeLeaderboardList definitions
content = content.replace(/var g_leaderboardList = null;\s*var g_timeLeaderboardList = null;/g, '');

fs.writeFileSync('c:/Users/Klara/Desktop/dragaMP/danger ghost/index.html', content);
console.log("Refactoring complete");
