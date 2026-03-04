const fs = require('fs');

const targetFile = '/Users/srinidhi.bk/WS/cmfe/src/components/GlobalHeader.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// The login button matches the figma in the aspect of text. Let's make sure the background gradient for the utility bar runs the right colors

// The figma shows for the top utility bar: "background: #007878; " & "background: #02D280;"
// I'll make the utility bar font more white-ish to match the new gradient.

content = content.replace(
    /<nav className="flex items-center space-x-1 text-xs text-gray-300 uppercase tracking-wider font-medium">/,
    '<nav className="flex items-center space-x-1 text-xs text-white uppercase tracking-wider font-medium">'
);

content = content.replace(
    /<span className="text-gray-600">\|<\/span>/g,
    '<span className="text-white/40">|</span>'
);

content = content.replace(
    /hover:text-acron-pitch transition-colors px-3 py-1/g,
    'hover:text-white/80 transition-colors px-3 py-1'
);

// Update Auth Button styling per Figma. 
// "Desktop-Primary-Default-Btn" uses green for both login and register. Let's maintain a balance.
// In the figma, we don't clearly see login/register, only the layout of a non-logged in page (Avionics Landing Page). We'll assume the client wants login/register styled nicely in the main header.

fs.writeFileSync(targetFile, content);
console.log("Successfully adjusted the utility bar colors.");
