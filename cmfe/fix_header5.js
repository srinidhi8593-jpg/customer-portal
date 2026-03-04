const fs = require('fs');

const targetFile = '/Users/srinidhi.bk/WS/cmfe/src/components/GlobalHeader.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Replace ForumSearchBar block with conditional block for unauthenticated links
content = content.replace(
    /\{user && \(\s*<div className="hidden md:flex flex-1 max-w-md mx-8">\s*<ForumSearchBar \/>\s*<\/div>\s*\)\}/,
`{user ? (
                        <div className="hidden md:flex flex-1 max-w-md mx-8">
                            <ForumSearchBar />
                        </div>
                    ) : (
                        <div className="hidden lg:flex flex-1 justify-center items-center space-x-8">
                            <a href="https://acronaviation.com/training-systems" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider">Training Systems</a>
                            <a href="https://acronaviation.com/flight-data-intelligence" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider">Flight Data Intelligence</a>
                            <a href="https://acronaviation.com/avionics" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider">Avionics</a>
                            <a href="https://acronaviation.com/training-services" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider">Training Services</a>
                            <a href="https://acronaviation.com/driver-training-solutions" className="text-white hover:text-acron-pitch transition-colors text-xs font-bold uppercase tracking-wider">Driver Training</a>
                        </div>
                    )}`
);

// Simplify the Navigation Bar block
// The navigation bar is already wrapped in `{user && (` so we just need to remove the `user ? ( ... ) : ( ... )` inside it.
content = content.replace(
    /\{user \? \(\s*<>\s*([\s\S]+?)\s*<\/>\s*\) : \(\s*<>[\s\S]*?<\/>\s*\)\}/,
    `$1`
);

fs.writeFileSync(targetFile, content);
console.log("Successfully shifted unauthenticated links to the main header.");
