const fs = require('fs');
const oldIndex = fs.readFileSync('scratch/pre_refactor_index.html', 'utf8').replace(/\0/g, ''); 
const curIndex = fs.readFileSync('v2-local/index.html', 'utf8');

const oldOverlayStart = oldIndex.indexOf('<!-- Character Selection Overlay -->');
const oldOverlayEnd = oldIndex.indexOf('<!-- FIM DA UI DO JOGO -->');
const oldOverlay = oldIndex.substring(oldOverlayStart, oldOverlayEnd);

const curOverlayStart = curIndex.indexOf('<!-- Overlay de Seleção de Personagem -->');
const curOverlayEnd = curIndex.indexOf('<div id="winPanel"');

if (oldOverlayStart !== -1 && curOverlayStart !== -1) {
    let newContent = curIndex.substring(0, curOverlayStart) + oldOverlay + '        ' + curIndex.substring(curOverlayEnd);
    // Remove guest button
    newContent = newContent.replace(/<button id="guestBtn"[^>]*>PLAY NOW AS GUEST<\/button>\r?\n?\s*/, '');
    fs.writeFileSync('v2-local/index.html', newContent);
    console.log('Successfully reverted overlay HTML');
} else {
    console.log('Could not find overlay bounds.');
}
