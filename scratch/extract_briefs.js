const fs = require('fs');
const path = require('path');

const planPath = 'C:/Users/Klara/.gemini/antigravity/brain/73128005-d441-4e6b-a882-d75f3c121e0c/implementation_plan.md';
const outputDir = 'c:/Users/Klara/Desktop/dragaMP/.superpowers/sdd';

if (!fs.existsSync(planPath)) {
    console.error('Plan not found at ' + planPath);
    process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, '.gitignore'), '*\n');

const content = fs.readFileSync(planPath, 'utf8');
const lines = content.split('\n');

let currentTaskNum = null;
let currentTaskLines = [];
let infence = false;

lines.forEach(line => {
    if (line.startsWith('```')) {
        infence = !infence;
    }
    if (!infence && line.match(/^### Task\s+(\d+)/i)) {
        if (currentTaskNum !== null) {
            fs.writeFileSync(path.join(outputDir, `task-${currentTaskNum}-brief.md`), currentTaskLines.join('\n'));
            console.log(`Wrote task-${currentTaskNum}-brief.md`);
        }
        const m = line.match(/^### Task\s+(\d+)/i);
        currentTaskNum = parseInt(m[1], 10);
        currentTaskLines = [line];
    } else if (currentTaskNum !== null) {
        // If we hit another major section header that is not a task, stop capturing
        if (!infence && line.startsWith('##') && !line.match(/^##\s+Proposed/i) && !line.match(/^###\s+Task/i)) {
            fs.writeFileSync(path.join(outputDir, `task-${currentTaskNum}-brief.md`), currentTaskLines.join('\n'));
            console.log(`Wrote task-${currentTaskNum}-brief.md (final)`);
            currentTaskNum = null;
            currentTaskLines = [];
        } else {
            currentTaskLines.push(line);
        }
    }
});

if (currentTaskNum !== null) {
    fs.writeFileSync(path.join(outputDir, `task-${currentTaskNum}-brief.md`), currentTaskLines.join('\n'));
    console.log(`Wrote task-${currentTaskNum}-brief.md (EOF)`);
}
