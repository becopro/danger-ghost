const fs = require('fs');

const readMd = (path) => {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(/^# (.*$)/gim, '<h2>$1</h2>');
    content = content.replace(/^## (.*$)/gim, '<h3>$1</h3>');
    content = content.replace(/^### (.*$)/gim, '<h4>$1</h4>');
    content = content.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    content = content.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    content = content.replace(/`/gim, '\\`'); // escape backticks for JS literal
    
    content = content.split('\n\n').map(p => {
        p = p.trim();
        if (p && !p.startsWith('<h')) return '<p>' + p + '</p>';
        return p;
    }).join('\n');
    return content;
};

const vol1 = readMd('C:/Users/Klara/.gemini/antigravity/brain/3ae24c4e-e125-4be7-a198-f7b2ef8c1b32/expanded_volume_1.md');
const vol2 = readMd('C:/Users/Klara/.gemini/antigravity/brain/3ae24c4e-e125-4be7-a198-f7b2ef8c1b32/expanded_volume_2.md');

let jsContent = 'const loreData = {\n' +
    '\'vol1\': `' + vol1 + '`,\n' +
    '\'vol2\': `' + vol2 + '`\n' +
'};\n';

fs.writeFileSync('js/lore_data.js', jsContent);
console.log('Done compiling lore');
