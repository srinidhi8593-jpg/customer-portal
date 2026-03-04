import prisma from './src/db';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch'; // or use native fetch if Node 18+
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No users found in database");
        return;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'supersecret_jwt_key_123');

    console.log("Testing POST /api/ai/suggest...");

    try {
        const res = await fetch('http://localhost:4000/api/ai/suggest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: 'How to install the Echidna Simulator?',
                content: 'I recently purchased the Acron simulator but the installation manual is missing. Anyone know the basics?'
            })
        });

        const data = await res.json();
        console.log("Status Code:", res.status);
        if (res.ok) {
            console.log("SUCCESS:");
            console.log(data);
        } else {
            console.error("FAILED:");
            console.error(data);
        }
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
