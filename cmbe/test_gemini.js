const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

async function main() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
        });
        console.log("SUCCESS");
        console.log(response.text);
    } catch (err) {
        console.error("FAIL:", err.message);
        console.error(err);
    }
}
main();
