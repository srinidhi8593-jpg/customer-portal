const fs = require('fs');

const targetFile = '/Users/srinidhi.bk/WS/cmfe/src/app/auth/register/org/page.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

const regex = /const AddressSection = \({[\s\S]+?\}\) => \([\s\S]+?<\/section>\n\s*\);/;
const match = content.match(regex);

if (match) {
    const addressSectionCode = match[0];
    // Remove it from the current location
    content = content.replace(addressSectionCode, '');
    
    // Insert it right above the main component
    content = content.replace('export default function OrgRegisterPage() {', addressSectionCode + '\n\nexport default function OrgRegisterPage() {');
    
    fs.writeFileSync(targetFile, content);
    console.log("Successfully shifted AddressSection outside of the main component to prevent re-renders.");
} else {
    console.log("Could not find AddressSection block.");
}
