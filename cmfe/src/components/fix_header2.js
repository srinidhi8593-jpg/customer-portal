const fs = require('fs');
const targetFile = '/Users/srinidhi.bk/WS/cmfe/src/components/GlobalHeader.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// The user's new CSS states the top nav has a specific shade of green
// and the logged out links should be hidden entirely in some states,
// but let's make sure the background colors and letter-spacing match the provided CSS.

// "background: #00363D;" for L3-CAS-CSR-Portal-Header
// Top bar uses #007878 & #02D280

content = content.replace(
    /className="bg-acron-yoke-500 border-b border-acron-yoke-400"/,
    'className="bg-acron-yoke-500 border-b border-acron-yoke-500"'
);

content = content.replace(
    /bg-gradient-to-r from-acron-yoke-500 to-acron-yoke-400/,
    'bg-[#00363D]'
);

content = content.replace(
    /<div className="bg-acron-yoke-500 border-t border-acron-thrust">/,
    '<div className="bg-acron-yoke-500 border-t border-acron-thrust hidden md:block">'
);

fs.writeFileSync(targetFile, content);
console.log("Successfully adjusted colors.");
