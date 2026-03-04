const fs = require('fs');

const targetFile = '/Users/srinidhi.bk/WS/cmfe/src/components/GlobalHeader.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

content = content.replace(/<\/header>\s+<\/header>/, '</header>');

fs.writeFileSync(targetFile, content);
console.log("Successfully fixed syntax error.");
