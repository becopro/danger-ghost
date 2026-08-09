(function() {
    function SaveScore(characterId, score, level, name) {
        if (typeof score !== "number" || isNaN(score)) {
            score = parseInt(score, 10) || 0;
        }
        
        var leaderboard = [];
        try {
            var raw = localStorage.getItem("dg_leaderboard");
            if (raw) leaderboard = JSON.parse(raw);
        } catch(e) {
            console.warn("Failed to load leaderboard:", e);
        }
        
        leaderboard.push({
            characterId: characterId || "GUEST",
            score: score,
            level: level || 1,
            name: name || "Ghost",
            timestamp: Date.now()
        });
        
        leaderboard.sort(function(a, b) {
            return b.score - a.score;
        });
        
        leaderboard = leaderboard.slice(0, 10);
        
        try {
            localStorage.setItem("dg_leaderboard", JSON.stringify(leaderboard));
        } catch(e) {
            console.error("Failed to save leaderboard:", e);
        }
        
        SyncScoreToServer(characterId, score, level, name);
    }
    window.SaveScore = SaveScore;

    function GetLeaderboard() {
        var leaderboard = [];
        try {
            var raw = localStorage.getItem("dg_leaderboard");
            if (raw) leaderboard = JSON.parse(raw);
        } catch(e) {
            console.warn("Failed to retrieve leaderboard:", e);
        }
        
        var socket = window.NetworkState && window.NetworkState.socket;
        if (socket) {
            socket.emit("get_leaderboard");
        }
        
        return leaderboard;
    }
    window.GetLeaderboard = GetLeaderboard;

    function SyncScoreToServer(characterId, score, level, name) {
        var socket = window.NetworkState && window.NetworkState.socket;
        if (socket) {
            socket.emit("save_progress", { score: score });
        }
    }
    window.SyncScoreToServer = SyncScoreToServer;

    function escapeHTML(str) {
        if (!str) return "";
        return str.replace(/[&<>'"]/g, function(tag) {
            var chars_to_replace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return chars_to_replace[tag] || tag;
        });
    }

    function OpenLeaderboardModal() {
        var leaderboard = GetLeaderboard();
        var content = document.getElementById("leaderboardContent");
        if (content) {
            content.innerHTML = "";
            if (leaderboard.length === 0) {
                content.innerHTML = "<div style='color: #888; text-align: center; padding: 20px 0;'>No high scores yet! Be the first!</div>";
            } else {
                var table = document.createElement("table");
                table.style.width = "100%";
                table.style.borderCollapse = "collapse";
                table.style.fontFamily = "'Courier New', monospace";
                table.style.fontSize = "13px";
                
                var header = document.createElement("tr");
                header.style.borderBottom = "1px solid rgba(255, 0, 255, 0.4)";
                header.style.color = "#FF00FF";
                header.style.textAlign = "left";
                header.innerHTML = "<th style='padding: 6px;'>Rank</th><th style='padding: 6px;'>Ghost</th><th style='padding: 6px;'>Lvl</th><th style='padding: 6px; text-align: right;'>Score</th>";
                table.appendChild(header);

                for (var i = 0; i < leaderboard.length; i++) {
                    var entry = leaderboard[i];
                    var row = document.createElement("tr");
                    row.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";
                    if (i === 0) row.style.color = "#00FF00";
                    else if (i === 1) row.style.color = "#00FFFF";
                    else if (i === 2) row.style.color = "#FFFF00";
                    else row.style.color = "#FFF";
                    
                    var rankSymbol = (i + 1);
                    if (i === 0) rankSymbol = "🏆 🥇";
                    else if (i === 1) rankSymbol = "🥈";
                    else if (i === 2) rankSymbol = "🥉";

                    var ghostName = entry.name ? entry.name.toUpperCase() : "GUEST";
                    row.innerHTML = 
                        "<td style='padding: 6px; font-weight: bold;'>" + rankSymbol + "</td>" +
                        "<td style='padding: 6px;'>" + escapeHTML(ghostName) + "</td>" +
                        "<td style='padding: 6px;'>" + entry.level + "</td>" +
                        "<td style='padding: 6px; text-align: right; font-weight: bold;'>" + entry.score.toLocaleString() + "</td>";
                    table.appendChild(row);
                }
                content.appendChild(table);
            }
        }
        var modal = document.getElementById("leaderboardModal");
        if (modal) modal.style.display = "flex";
    }
    window.OpenLeaderboardModal = OpenLeaderboardModal;

    function CloseLeaderboardModal() {
        var modal = document.getElementById("leaderboardModal");
        if (modal) modal.style.display = "none";
    }
    window.CloseLeaderboardModal = CloseLeaderboardModal;

    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            var socket = window.NetworkState && window.NetworkState.socket;
            if (socket) {
                socket.on("leaderboard_data", function(data) {
                    if (data && data.leaderboard) {
                        try {
                            localStorage.setItem("dg_leaderboard", JSON.stringify(data.leaderboard));
                            var modal = document.getElementById("leaderboardModal");
                            if (modal && modal.style.display === "flex") {
                                OpenLeaderboardModal();
                            }
                        } catch(e) {}
                    }
                });
            }
        }, 1000);
    });
})();
