const sharp = require('sharp');
const path = require('path');

const refImagePath = 'www/assets/sprites/ghost_001_r.webp';
const inputImagePath = 'C:/Users/Klara/.gemini/antigravity/brain/83265516-01ae-4c63-a602-e41483943921/media__1784316036574.png';
const outputLeftPath = 'www/assets/sprites/ghost_101_l.webp';
const outputRightPath = 'www/assets/sprites/ghost_101_r.webp';

async function processImage() {
  try {
    // Get dimensions of reference image
    const refMetadata = await sharp(refImagePath).metadata();
    const width = refMetadata.width;
    const height = refMetadata.height;

    console.log(`Reference dimensions: ${width}x${height}`);

    // The uploaded image is facing LEFT
    // Resize and save as left facing
    await sharp(inputImagePath)
      .resize(width, height)
      .webp({ quality: 80, effort: 6 }) 
      .toFile(outputLeftPath);
    console.log(`Saved left-facing image to ${outputLeftPath}`);

    // Flip horizontally and save as right facing
    await sharp(inputImagePath)
      .resize(width, height)
      .flop()
      .webp({ quality: 80, effort: 6 })
      .toFile(outputRightPath);
    console.log(`Saved right-facing image to ${outputRightPath}`);

  } catch (err) {
    console.error('Error processing image:', err);
  }
}

processImage();
