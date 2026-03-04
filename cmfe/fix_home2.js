const fs = require('fs');

const targetFile = '/Users/srinidhi.bk/WS/cmfe/src/app/HomeClient.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// The A-Spot provided by the user is a dark teal fading into a lighter, muted grey-teal color.
// The image has a very specific gradient. Let's use #012D32 to #6E8F91. Or we can just use the exact image provided as the background!
// The user attached `Acron A-Spot.png`. I will apply it to the section. First I'll copy the background gradient colors just in case we don't use the raw image.
// But better yet, let's use the actual exact image provided `Users/srinidhi.bk/WS/cmfe/public/a-spot.png` if it exists.
// Wait, the user didn't name the file, they attached an image. We can just use the colors.
// Left color: #01282D, Right color: #7F9394.

content = content.replace(
    /bg-gradient-to-r from-\[#00363D\] to-\[#517a7e\]/,
    'bg-gradient-to-r from-[#01282D] to-[#7F9394]'
);

// We need to remove the "Welcome to Acron Aviation Community Portal" hero block for unauthenticated users entirely according to the figma.
// The figma shows the A-Spot banner "Cutting-edge pilot training systems" taking up the main hero section!
// Let me look at the figma screenshot again.
// The figma has "Cutting-edge pilot training systems" taking up the huge main hero section (A-Spot) with a "Request Info" button.
// Ah, the user's prompt specifically said: "for non-logged-in user, use this a-spot banner with register now, clicking on it navigates to organization registration form page" AND they attached "a-spot.png" which has the dark gradient.
// Let's modify the A-spot banner to be much bigger and replace the main hero section for unauthenticated users.

const oldHeroStart = content.indexOf('{/* Hero Section */}');
const aSpotStart = content.indexOf('{/* A-Spot Banner for Unauthenticated Users */}');

if (oldHeroStart > -1 && aSpotStart > -1) {
    // Both exist, I will restructure to make them mutually exclusive
    
    // We already have user ? (...) : null in the button for Hero Section, but the whole hero section should prob be conditionally rendered
    content = content.replace(
    /\{\/\* Hero Section \*\/\}\n\s*<section className="relative overflow-hidden/,
    `{/* Hero Section */}
      {user ? (
        <section className="relative overflow-hidden`
    );
    
    content = content.replace(
    /<\/section>\n\n\s*\{\/\* A-Spot Banner for Unauthenticated Users \*\/\}/,
    `</section>
      ) : (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#01282D] to-[#7F9394] text-white px-10 py-20 flex flex-col justify-center min-h-[400px]">
             <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/3" />
            </div>
            <div className="relative z-10 max-w-3xl">
                <h2 className="text-5xl font-extrabold mb-6 leading-tight">Join the Acron Aviation Network</h2>
                <p className="text-xl text-gray-200 mb-8 leading-relaxed">Register your organization to access exclusive training systems, flight data intelligence, and our premier pilot academy.</p>
                <Link href="/auth/register/organization" className="inline-block bg-acron-pitch hover:bg-[#00c97a] text-acron-yoke-500 font-bold py-4 px-10 rounded-xl shadow-xl transition-all hover:-translate-y-1 text-lg">
                    Register Now
                </Link>
            </div>
        </section>
      )}

      {/* Remove the old small A-spot */}
      {/* A-Spot Banner for Unauthenticated Users */}`
    );
    
    // Now remove the small banner
    content = content.replace(/\{\/\* Remove the old small A-spot \*\/\}\n\s*\{\/\* A-Spot Banner for Unauthenticated Users \*\/\}\n\s*\{\!user && \([\s\S]+?<\/section>\n\s*\)\}/, '');
}

fs.writeFileSync(targetFile, content);
console.log("Successfully restyled the A-Spot banner as the primary hero block.");
