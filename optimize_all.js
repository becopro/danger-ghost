const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const spritesPath = path.join(__dirname, 'assets', 'sprites');

// 1. Rename User Uploaded WebPs to match original space-separated names
const renameMap = {
    'Brddireita.webp': 'Brd direita.webp',
    'Brdesquerda.webp': 'Brd esquerda.webp',
    'demonflydireita.webp': 'demon fly direita.webp',
    'demonflyesquerda.webp': 'demon fly esquerda.webp',
    'Slimedireita.webp': 'Slime direita.webp',
    'Slimeesquerda.webp': 'Slime esquerda.webp'
};

for (const [oldName, newName] of Object.entries(renameMap)) {
    const oldPath = path.join(spritesPath, oldName);
    const newPath = path.join(spritesPath, newName);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed ${oldName} to ${newName}`);
    }
}

// 2. Process all PNGs in the folder to WebP and resize if they are large
async function optimizeAll() {
    const files = fs.readdirSync(spritesPath);
    for (const file of files) {
        if (file.endsWith('.png') && !file.includes('Logo')) { // Ignore logos just in case
            const filePath = path.join(spritesPath, file);
            const webpName = file.replace('.png', '.webp');
            const webpPath = path.join(spritesPath, webpName);
            
            try {
                const metadata = await sharp(filePath).metadata();
                let newWidth = metadata.width;
                // If it's larger than 150px, shrink it to 25% to optimize
                if (metadata.width > 150 && !file.includes("character_ghost_base")) {
                    newWidth = Math.max(Math.round(metadata.width / 4), 1);
                }

                await sharp(filePath)
                    .resize(newWidth, null, { kernel: sharp.kernel.nearest })
                    .webp({ quality: 80 })
                    .toFile(webpPath);
                
                // Delete the original PNG after successful conversion
                fs.unlinkSync(filePath);
                console.log(`Converted and optimized ${file} -> ${webpName} (Width: ${newWidth})`);
            } catch (e) {
                console.error(`Error processing ${file}:`, e);
            }
        }
    }
}

optimizeAll();
