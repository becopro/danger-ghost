const fs = require('fs');
let code = fs.readFileSync('../js/game/engine.js', 'utf8');

code = code.replace(
    /var p0 = f0\.players\[pid\];\s*if \(!p0 \|\| !p0\.position\) return;/,
    "var p0 = f0.players[pid];\n\t\t\t\t\t\t\tif (!p0 || !p0.position) return;\n\t\t\t\t\t\t\tvar pLevel = p0.position.level || 'level 1';\n\t\t\t\t\t\t\tif (typeof g_currentLevel !== 'undefined' && pLevel !== g_currentLevel) return;"
);

code = code.replace(
    /var pos = window\.NetworkState\.otherPlayers\[id\];\s*if \(pos\) \{/,
    "var pos = window.NetworkState.otherPlayers[id];\n\t\t\t\t\t\tif (pos) {\n\t\t\t\t\t\t\tvar pLevel = pos.level || 'level 1';\n\t\t\t\t\t\t\tif (typeof g_currentLevel !== 'undefined' && pLevel !== g_currentLevel) continue;"
);

fs.writeFileSync('../js/game/engine.js', code);
