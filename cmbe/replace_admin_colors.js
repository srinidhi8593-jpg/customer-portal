const fs = require('fs');

const targetFile = './public/admin/index.html';
let content = fs.readFileSync(targetFile, 'utf8');

const replacements = {
    '\\[#00E377\\]': 'acron-pitch',  // Just in case it was used in HTML classes (it's not, admin is vanilla CSS)
    '#00E377': '#02E68D', // Acron Pitch CTA
    '#0a2628': '#002B31', // Acron Yoke 500 (Header bg, main text)
    '#0d3d3f': '#00363D', // Acron Yoke 400
    '#062325': '#002B31', // Deep bg
    '#1a6b6e': '#015F5E', // Acron Thrust
    '#1a5558': '#015F5E', // Acron Thrust
    'Inter': 'Figtree'
};

for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, 'g');
    content = content.replace(regex, value);
}

fs.writeFileSync(targetFile, content);
console.log('Admin CSS updated!');
