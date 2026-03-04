const fs = require('fs');
const path = require('path');

const replacements = {
  '\\[#00E377\\]': 'acron-pitch',
  '\\[#0a2628\\]': 'acron-yoke-500',
  '\\[#062325\\]': 'acron-yoke-500',
  '\\[#0a2e30\\]': 'acron-yoke-500',
  '\\[#0d3d3f\\]': 'acron-yoke-400',
  '\\[#0d4a4e\\]': 'acron-yoke-400',
  '\\[#1a6b6e\\]': 'acron-thrust',
  '\\[#1a5558\\]': 'acron-thrust',
  '\\[#00c968\\]': 'acron-pitch'
};

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [key, value] of Object.entries(replacements)) {
         const regex = new RegExp(key, 'g');
         if (regex.test(content)) {
            content = content.replace(regex, value);
            changed = true;
         }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

walkDir('./src');
console.log('Done!');
