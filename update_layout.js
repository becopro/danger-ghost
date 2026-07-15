const fs = require('fs');

try {
    let content = fs.readFileSync('www/index.html', 'utf8');

    // 1. Extract panels
    function extractTag(html, startPattern) {
        const match = html.match(startPattern);
        if (!match) return [null, html];
        
        let startIdx = match.index;
        let idx = startIdx + 1;
        let depth = 0;
        
        while (idx < html.length) {
            if (html.substr(idx, 4) === '<div') {
                depth++;
                idx += 4;
            } else if (html.substr(idx, 5) === '</div') {
                depth--;
                idx += 5;
                if (depth === 0) {
                    let endIdx = html.indexOf('>', idx) + 1;
                    return [html.substring(startIdx, endIdx), html.substring(0, startIdx) + html.substring(endIdx)];
                }
            } else {
                idx++;
            }
        }
        return [null, html];
    }

    let rpgPanel, chatPanel, navbarPanel;
    
    let res = extractTag(content, /<div\s+id="rpgPanel"[^>]*>/);
    rpgPanel = res[0]; content = res[1];
    
    res = extractTag(content, /<div\s+id="chatPanel"[^>]*>/);
    chatPanel = res[0]; content = res[1];
    
    res = extractTag(content, /<div\s+id="navbarPanel"[^>]*>/);
    navbarPanel = res[0]; content = res[1];

    // Remove the preceding comments for cleanliness if they are there
    content = content.replace(/\s*<!-- Painel Esquerdo \(RPG & Status\) -->/g, '');
    content = content.replace(/\s*<!-- Painel de Chat \(Esquerda\) -->/g, '');
    content = content.replace(/\s*<!-- Painel Direito \(Bag, Equipamentos, Controles, Leaderboard\) -->/g, '');

    // 2. Modify mobileMainMenu
    content = content.replace(
        '<div id="mobileMainMenu" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background: #000; z-index: 9999; display: none; flex-direction: column; justify-content: center; align-items: center; gap: 20px;">', 
        '<div id="mobileMainMenu" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background: #000; z-index: 9999; display: none; flex-direction: column; justify-content: flex-start; align-items: center; gap: 15px; padding-top: 20px; box-sizing: border-box;">'
    );

    // 3. Regex replace the old buttons area
    // Use regex to replace everything from <div id="mobileMainMenuGameBtns" to </button>\s+</div> where ExitMobileApp is
    const regex = /<div id="mobileMainMenuGameBtns"[\s\S]*?<button onclick="ExitMobileApp\(\)"[^>]*>Exit<\/button>/;
    
    const newBtns = `<div id="mobileMainMenuGameBtns" style="display: none; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 5px; max-width: 95%;">
            <button onclick="LoginGoogle();" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🔑 LOGIN</button>
            <button onclick="ToggleNavbarTab('controls');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🎮 CTRL</button>
            <button onclick="ToggleNavbarTab('rpg');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">👤 STAT</button>
            <button onclick="ToggleNavbarTab('spells');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">⚡ SPL</button>
            <button onclick="ToggleNavbarTab('bag');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🎒 BAG</button>
            <button onclick="ToggleNavbarTab('equip');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">⚔️ EQP</button>
            <button onclick="ToggleNavbarTab('chat');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">💬 CHT</button>
        </div>

        <div id="mobilePanelsContainer" style="flex: 1; width: 100%; display: flex; justify-content: center; overflow-y: auto; overflow-x: hidden; position: relative;">
            ${rpgPanel || ''}
            ${chatPanel || ''}
            ${navbarPanel || ''}
        </div>

        <div id="mobileActionBtns" style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: auto; padding-bottom: 20px; width: 100%;">
            <button onclick="window.TriggerRPGSaveToDeSo();" id="mobileSaveBtn" style="background: #001100; border: 3px solid #00FF00; color: #00FF00; padding: 15px 40px; font-size: 20px; font-weight: bold; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 20px rgba(0,255,0,0.8); display: none;">💾 SAVE</button>
            <button onclick="ShowMobileNameInput()" id="mobileEpisode1Btn" style="background: transparent; border: 2px solid #00FFFF; color: #00FFFF; padding: 12px 30px; font-size: 16px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(0,255,255,0.5);">Episode 1</button>
            <button onclick="ResumeMobileGame()" id="mobileResumeBtn" style="background: transparent; border: 2px solid #FFFF00; color: #FFFF00; padding: 12px 30px; font-size: 16px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(255,255,0,0.5); display: none;">Resume Game</button>
            <button onclick="ExitMobileApp()" style="background: transparent; border: 2px solid #FF00FF; color: #FF00FF; padding: 12px 30px; font-size: 16px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(255,0,255,0.5);">Exit</button>
        </div>`;

    if (regex.test(content)) {
        content = content.replace(regex, newBtns);
        fs.writeFileSync('www/index.html', content, 'utf8');
        console.log('Updated index.html successfully');
    } else {
        console.log('COULD NOT FIND REGEX MATCH');
    }
} catch (err) {
    console.error(err);
}
