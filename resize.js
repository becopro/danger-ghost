const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const spritesToResize = [
    "Brd esquerda.png", "Brd direita.png",
    "demon fly direita.png", "demon fly esquerda.png",
    "Slime esquerda.png", "Slime direita.png",
    "spells_icons_pixel_art.png",
    "Skull-esquerda.png", "Skull-direita.png"
];

const basePath = path.join(__dirname, 'assets', 'sprites');

async function processImages() {
    for (const sprite of spritesToResize) {
        const filePath = path.join(basePath, sprite);
        const tempPath = path.join(basePath, 'temp_' + sprite);
        if (fs.existsSync(filePath)) {
            try {
                const metadata = await sharp(filePath).metadata();
                const newWidth = Math.max(Math.round(metadata.width / 4), 1);
                
                await sharp(filePath)
                    .resize(newWidth, null, {
                        kernel: sharp.kernel.nearest
                    })
                    .toFile(tempPath);
                
                fs.unlinkSync(filePath);
                fs.renameSync(tempPath, filePath);
                console.log(`Resized ${sprite} to width ${newWidth}`);
            } catch (e) {
                console.error(`Failed to resize ${sprite}:`, e);
            }
        }
    }
}

processImages();
