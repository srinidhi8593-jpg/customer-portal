import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const orgs = await prisma.organization.findMany();
    console.log('--- ORGANIZATIONS ---');
    console.log(JSON.stringify(orgs, null, 2));

    const reqs = await prisma.orgRegistrationRequest.findMany();
    console.log('--- ORG REQUESTS ---');
    console.log(JSON.stringify(reqs, null, 2));

    await prisma.$disconnect();
}

check();
