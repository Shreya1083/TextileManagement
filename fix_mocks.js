const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');
const extractedExports = new Set();

function walkDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let match = content.match(/import\s+{([^}]+)}\s+from\s+['"](?:\.\.\/)+mocks\/data['"]/);
            if (match) {
                match[1].split(',').forEach(v => {
                    extractedExports.add(v.trim());
                });
            }
        }
    });
}

walkDir(srcDir);

let dataContent = ``;
extractedExports.forEach(exp => {
    if (exp) {
        if (exp.includes('Summary') || exp.includes('User') || exp.includes('Stats')) {
            dataContent += `export const ${exp} = {};\n`;
        } else {
            dataContent += `export const ${exp} = [];\n`;
        }
    }
});

fs.writeFileSync(path.join(srcDir, 'mocks', 'data.js'), dataContent);
console.log('Fixed data.js with:', Array.from(extractedExports));
