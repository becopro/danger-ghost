const fs = require('fs');
const file = 'c:/Users/Klara/Desktop/dragaMP/danger_ghost_mobile/www/index.html';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\?v=29/g, '?v=30');

const oldModal = `    <!-- MOBILE NAME INPUT SCREEN -->\r
    <div id="mobileNameInputScreen" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background: url('assets/menu_bg.png') center/cover no-repeat #000; z-index: 10000; display: none; flex-direction: column; justify-content: center; align-items: center; gap: 20px;">\r
        <h2 style="color: #00FFFF; font-family: 'Courier New', monospace;">Ghost Name:</h2>\r
        <input type="text" id="mobileGhostNameInput" placeholder="Enter your name..." style="background: transparent; border: 2px solid #FF00FF; color: #FFF; padding: 15px; font-size: 18px; text-align: center; font-family: 'Courier New', monospace; outline: none; width: 80%; max-width: 300px;" />\r
        <div style="display: flex; gap: 20px; margin-top: 20px;">\r
            <button onclick="SaveMobileName()" style="background: #FF00FF; border: none; color: #000; padding: 10px 20px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace;">SAVE</button>\r
            <button onclick="StartMobileGame()" style="background: #00FFFF; border: none; color: #000; padding: 10px 20px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace;">GO</button>\r
        </div>\r
    </div>`;

const newModal = `    <!-- MOBILE NAME INPUT SCREEN -->\r
    <div id="mobileNameInputScreen" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background: rgba(0,0,0,0.85); z-index: 10000; display: none; flex-direction: column; justify-content: center; align-items: center;">\r
        <div style="background-image: url('assets/ui/ghost_name_bg.webp'); background-size: 100% 100%; background-repeat: no-repeat; width: 90vw; max-width: 600px; aspect-ratio: 1024 / 434; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box; padding: 5% 10%;">\r
            <h2 style="color: #00FFFF; font-family: 'Courier New', monospace; margin: 0 0 10px 0; text-shadow: 1px 1px 2px #000;">Ghost Name:</h2>\r
            <input type="text" id="mobileGhostNameInput" placeholder="Enter your name..." style="background: rgba(0,0,0,0.5); border: 1px solid #00FFFF; color: #FFF; padding: 10px; font-size: 16px; text-align: center; font-family: 'Courier New', monospace; outline: none; width: 80%; max-width: 280px; margin-bottom: 15px;" />\r
            <div style="display: flex; gap: 20px;">\r
                <button onclick="SaveMobileName()" style="background: #FF00FF; border: none; color: #000; padding: 8px 20px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace; border-radius: 4px; box-shadow: 0 0 5px #FF00FF;">SAVE</button>\r
                <button onclick="StartMobileGame()" style="background: #00FFFF; border: none; color: #000; padding: 8px 20px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace; border-radius: 4px; box-shadow: 0 0 5px #00FFFF;">GO</button>\r
            </div>\r
        </div>\r
    </div>`;

content = content.replace(oldModal, newModal);
if (!content.includes('ghost_name_bg.webp')) {
    console.error('Replacement failed. Old string might not match.');
    
    // Fallback: replace with regex if exact match failed
    const startIdx = content.indexOf('<!-- MOBILE NAME INPUT SCREEN -->');
    if (startIdx !== -1) {
        const endIdx = content.indexOf('<!-- IN-GAME MENU BUTTON', startIdx);
        if (endIdx !== -1) {
            content = content.slice(0, startIdx) + newModal + '\\r\\n\\r\\n    ' + content.slice(endIdx);
            console.log('Used fallback replacement');
        }
    }
} else {
    console.log('success');
}
fs.writeFileSync(file, content);
