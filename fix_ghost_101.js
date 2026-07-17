const sharp = require('sharp');
const path = require('path');

async function processImage() {
  const inputPath = 'C:/Users/Klara/.gemini/antigravity/brain/83265516-01ae-4c63-a602-e41483943921/media__1784316036574.png';
  const outL = path.join(__dirname, 'www/assets/sprites/ghost_101_l.webp');
  const outR = path.join(__dirname, 'www/assets/sprites/ghost_101_r.webp');

  console.log('Processing left...');
  await sharp(inputPath)
    .resize(597, 417, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile(outL);

  console.log('Processing right (flipped)...');
  await sharp(outL)
    .flop()
    .toFile(outR);

  console.log('Done!');
}

processImage().catch(console.error);
