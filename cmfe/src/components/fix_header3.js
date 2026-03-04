const fs = require('fs');

const targetFile = '/Users/srinidhi.bk/WS/cmfe/src/components/GlobalHeader.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// The user's figma screenshot clearly shows that for "non-logged-in" users, 
// the navigation block itself should be completely hidden and the links are only on the top right
// However, since we already did the `user ? ( ... ) : ( ... )` replacement, let's fix the logic
// so the secondary navigation bar is ONLY visible if `user` is present, OR if it has the new links

const blockStart = '<div className="bg-acron-yoke-500 border-t border-acron-thrust hidden md:block">';
const blockEnd = '</div>\n            </div>\n        </header>';

const startIndex = content.indexOf(blockStart);
const endIndex = content.indexOf(blockEnd) + blockEnd.length;

if (startIndex === -1 || content.indexOf(blockEnd) === -1) {
    console.error("Could not find nav block!");
    process.exit(1);
}

const navBlock = content.substring(startIndex, endIndex);

const newNavBlock = `{user && (
            ${navBlock.replace('</div>\\n            </div>\\n        </header>', '</div>\\n            </div>\\n            )}').trim().split('\\n').join('\\n            ')}
        </header>`;

content = content.substring(0, startIndex) + newNavBlock + content.substring(endIndex);

// Also need to put the non-logged in links from the Figma into the top utility bar / header row
// The figma shows: About | Newsroom | Support
// Which is already in our Top Utility Bar!
// Wait, the figma has the top utility bar as Green (#007878 & #02D280)

content = content.replace(
    /<div className="bg-acron-yoke-500 border-b border-acron-yoke-500">/g,
    '<div className="bg-gradient-to-r from-[#007878] to-[#02D280]">'
);

// We should also remove the custom logged out nav we added previously, because the figma
// only has the login/register buttons in the main header, and no secondary nav!
// Let's replace the nav inside Main Header Row

const headerStart = '<div className="bg-[#00363D]">';
const headerEnd = '{/* Navigation Bar */}';

const hStartIndex = content.indexOf(headerStart);
const hEndIndex = content.indexOf(headerEnd);

let headerBlock = content.substring(hStartIndex, hEndIndex);
headerBlock = headerBlock.replace(
    /<>[\s\S]*?<a href="https:\/\/acronaviation\.com\/avionics"[\s\S]*?<\/a>[\s\S]*?<\/>/g,
    ''
);

content = content.substring(0, hStartIndex) + headerBlock + content.substring(hEndIndex);

fs.writeFileSync(targetFile, content);
console.log("Successfully adjusted the header to match Figma.");
