const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', '.system_generated', 'logs', 'transcript.jsonl');
if (fs.existsSync(logFile)) {
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n');
    console.log(`Searching generate_image calls in all ${lines.length} lines...`);
    let count = 0;
    lines.forEach((line, idx) => {
        if (line.includes('generate_image')) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.tool_calls) {
                    parsed.tool_calls.forEach(tc => {
                        if (tc.name === 'generate_image') {
                            count++;
                            console.log(`Call #${count} at Line ${idx+1}:`);
                            console.log(JSON.stringify(tc.args, null, 2));
                        }
                    });
                }
            } catch (e) {
                console.log(`Line ${idx+1} (not JSON): ${line.substring(0, 300)}`);
            }
        }
    });
} else {
    console.log(`Log file not found!`);
}
