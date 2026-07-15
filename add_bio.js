const fs = require('fs');
let html = fs.readFileSync('www/index.html', 'utf8');

// 1. Translate texts
html = html.replace('Nome do Fantasma:', 'Ghost Name:');
html = html.replace('Digite seu nome...', 'Enter your name...');
html = html.replace('alert("O recurso de fechar o app s funciona no dispositivo real.");', 'alert("The exit app feature only works on a real device.");');

// 2. Add Bio button
const exitBtnHTML = `<button onclick="ExitMobileApp()" style="background: transparent; border: 2px solid #FF00FF; color: #FF00FF; padding: 12px 30px; font-size: 16px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(255,0,255,0.5);">Exit</button>`;
const newButtonsHTML = `<button onclick="document.getElementById('founderBioModal').style.display='flex'" style="background: transparent; border: 2px solid #00FF00; color: #00FF00; padding: 12px 30px; font-size: 16px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(0,255,0,0.5);">Bio</button>
            ` + exitBtnHTML;
html = html.replace(exitBtnHTML, newButtonsHTML);

// 3. Add Bio Modal
const bioModalHTML = `
    <!-- FOUNDER BIO MODAL -->
    <div id="founderBioModal" style="position: fixed; top:0; left:0; width:100vw; height:100vh; background: rgba(0,0,0,0.95); z-index: 15000; display: none; flex-direction: column; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
        <div style="background: #111; border: 2px solid #00FFFF; border-radius: 10px; padding: 25px; max-width: 90%; max-height: 80vh; overflow-y: auto; color: #FFF; font-family: 'Courier New', monospace; box-shadow: 0 0 20px rgba(0,255,255,0.5);">
            <h2 style="color: #FF00FF; margin-top: 0; text-align: center; font-family: 'Orbitron', sans-serif;">FOUNDER BIO: BecoPro</h2>
            <p style="line-height: 1.6; font-size: 15px;">BecoPro is a graffiti artist with a degree in Fashion. He began writing graffiti in 2012 and has held various art exhibitions around the world.</p>
            <p style="line-height: 1.6; font-size: 15px;">He joined Web3 in 2020 and has created several NFT collections, but the one he is most passionate about is DeSoGhost on the DeSo Blockchain.</p>
            <p style="line-height: 1.6; font-size: 15px;">Currently, he is developing the game Danger Ghost, which is the first game of an NFT gaming ecosystem called Ghost Games.</p>
            <div style="text-align: center; margin-top: 25px;">
                <button onclick="document.getElementById('founderBioModal').style.display='none'" style="background: #00FFFF; border: none; color: #000; padding: 10px 40px; font-weight: bold; font-size: 18px; cursor: pointer; font-family: 'Orbitron', sans-serif; text-transform: uppercase;">CLOSE</button>
            </div>
        </div>
    </div>
    
    <!-- MOBILE NAME INPUT SCREEN -->`;

html = html.replace('<!-- MOBILE NAME INPUT SCREEN -->', bioModalHTML);

fs.writeFileSync('www/index.html', html, 'utf8');
console.log("Bio Modal added and translations applied successfully!");
