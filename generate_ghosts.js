const fs = require('fs');
const sharp = require('sharp');

const dbContent = fs.readFileSync('www/js/game/ghostdex_data.js', 'utf8');
const match = dbContent.match(/\[.*\]/);
if (!match) throw new Error("Could not find array in ghostdex_data.js");
const ghosts = JSON.parse(match[0]);

const typeHues = {
    "Espectro": 0, 
    "Sombra": -100, 
    "Neon": 180, 
    "Urbano": 30, 
    "Cibernético": 120, 
    "Fogo-Fátuo": 15, 
    "Sombrio": 270, 
    "Cristal": 200, 
    "Tóxico": 90, 
    "Sucata": 45, 
    "Pixação": 300, 
    "Holográfico": 210, 
    "Virtual": 140, 
    "Caos": -20
};

async function generateGhosts() {
    console.log(`Generating ${ghosts.length} variants using sharp...`);
    
    for (const ghost of ghosts) {
        const type = ghost.tipos[0];
        let hueShift = typeHues[type] !== undefined ? typeHues[type] : 0;
        
        // Right
        const outNameR = `www/assets/sprites/ghost_${ghost.id}_r.webp`;
        let imgR = sharp('www/assets/sprites/Ftasma d.webp');
        if (hueShift !== 0) imgR = imgR.modulate({ hue: hueShift });
        await imgR.toFile(outNameR);
        
        // Left
        const outNameL = `www/assets/sprites/ghost_${ghost.id}_l.webp`;
        let imgL = sharp('www/assets/sprites/Ftasma e.webp');
        if (hueShift !== 0) imgL = imgL.modulate({ hue: hueShift });
        await imgL.toFile(outNameL);
        
        console.log(`Generated ${ghost.id} - ${ghost.nome} (${type})`);
    }
    
    console.log("All 101 ghosts generated!");
}

generateGhosts().catch(err => console.error(err));
