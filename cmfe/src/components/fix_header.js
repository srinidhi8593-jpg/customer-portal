const fs = require('fs');

const targetFile = '/Users/srinidhi.bk/WS/cmfe/src/components/GlobalHeader.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Hide search bar if not logged in
content = content.replace(
    /<div className="hidden md:flex flex-1 max-w-md mx-8">\s*<ForumSearchBar \/>\s*<\/div>/,
    `{user && (
                        <div className="hidden md:flex flex-1 max-w-md mx-8">
                            <ForumSearchBar />
                        </div>
                    )}`
);

// 2. Navigation changes
const loggedOutNav = `                            <>
                                <a href="https://acronaviation.com/avionics" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider px-4 py-2 border-r border-acron-thrust">Avionics</a>
                                <a href="https://acronaviation.com/flight-data-intelligence" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider px-4 py-2 border-r border-acron-thrust">Flight Data Intelligence</a>
                                <a href="https://acronaviation.com/training-services" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider px-4 py-2 border-r border-acron-thrust">Training Services</a>
                                <a href="https://acronaviation.com/training-systems" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider px-4 py-2 border-r border-acron-thrust">Training Systems</a>
                                <a href="https://acronaviation.com/driver-training-solutions" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider px-4 py-2">Driver Training</a>
                            </>
`;

// Extract the nav inner content
// Starting from `<Link href="/forum" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider px-4 py-2 border-r border-acron-thrust">`
// Ending at `                        </Link>\n                    </nav>`

const navStartStr = '<Link href="/forum" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider px-4 py-2 border-r border-acron-thrust">\n                            Training Systems\n                        </Link>';

const navEndStr = '                        <Link href="/forum" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider px-4 py-2">\n                            Pilot Academy\n                        </Link>';

const startIndex = content.indexOf(navStartStr);
const endIndex = content.indexOf(navEndStr) + navEndStr.length;

if (startIndex === -1 || content.indexOf(navEndStr) === -1) {
    console.error("Could not find nav tags!");
    process.exit(1);
}

const existingNav = content.substring(startIndex, endIndex);

const newNav = `{user ? (
                            <>
                                ${existingNav.trim().split('\\n').join('\\n                                ')}
                            </>
                        ) : (
${loggedOutNav}                        )}`;

content = content.substring(0, startIndex) + newNav + content.substring(endIndex);

fs.writeFileSync(targetFile, content);
console.log("Successfully updated GlobalHeader.tsx");
