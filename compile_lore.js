const fs = require('fs');

const readMd = (path) => {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/^# (.*$)/gim, '<h2>$1</h2>');
    content = content.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    content = content.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    content = content.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    content = content.replace(/`/gim, '\\`');
    
    content = content.split('\n\n').map(p => {
        p = p.trim();
        if (p && !p.startsWith('<h')) return '<p>' + p + '</p>';
        return p;
    }).join('\n');
    return content;
};

const vol1_en = readMd('C:/Users/Klara/.gemini/antigravity/brain/3ae24c4e-e125-4be7-a198-f7b2ef8c1b32/expanded_volume_1.md');
const vol2_en = readMd('C:/Users/Klara/.gemini/antigravity/brain/3ae24c4e-e125-4be7-a198-f7b2ef8c1b32/expanded_volume_2.md');
const vol1_pt = readMd('C:/Users/Klara/.gemini/antigravity/brain/3ae24c4e-e125-4be7-a198-f7b2ef8c1b32/expanded_volume_1_pt.md');
const vol2_pt = readMd('C:/Users/Klara/.gemini/antigravity/brain/3ae24c4e-e125-4be7-a198-f7b2ef8c1b32/expanded_volume_2_pt.md');

let jsContent = 'const loreData = {\n' +
    '\'vol1_en\': `' + vol1_en + '`,\n' +
    '\'vol2_en\': `' + vol2_en + '`,\n' +
    '\'vol1_pt\': `' + vol1_pt + '`,\n' +
    '\'vol2_pt\': `' + vol2_pt + '`\n' +
'};\n';

fs.writeFileSync('js/lore_data.js', jsContent);
console.log('Done compiling lore data');
