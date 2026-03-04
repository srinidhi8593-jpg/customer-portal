import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRequests() {
    try {
        // 1. Create a mock Org Request
        await prisma.orgRegistrationRequest.create({
            data: {
                soldToCompany: 'Acme Corp',
                soldToAddress: '123 Acme Way',
                soldToCity: 'Metropolis',
                soldToState: 'NY',
                soldToPostalCode: '10001',
                soldToCountry: 'US',
                soldToPhone: '555-1111',

                billToCompany: 'Acme Corp Billing',
                billToAddress: '124 Acme Way',
                billToCity: 'Metropolis',
                billToState: 'NY',
                billToPostalCode: '10001',
                billToCountry: 'US',
                billToPhone: '555-2222',

                shipToCompany: 'Acme Corp Warehouse',
                shipToAddress: '125 Acme Way',
                shipToCity: 'Metropolis',
                shipToState: 'NY',
                shipToPostalCode: '10001',
                shipToCountry: 'US',
                shipToPhone: '555-3333',

                carrier: 'FedEx',
                carrierAccountNumber: 'FDX-999-000',

                authorityAdminName: 'John Doe',
                authorityAdminPhone: '555-4444',
                authorityAdminEmail: 'john_doe_acme@acme.com',
                authorityAdminPosition: 'Director of Procurement',

                status: 'PENDING'
            }
        });

        // 2. Create a mock User Request
        await prisma.userRegistrationRequest.create({
            data: {
                company: 'Globex Corporation',
                industry: 'Tech',
                simulator: 'Boeing 737',
                firstName: 'Jane',
                lastName: 'Smith',
                name: 'Jane Smith',
                title: 'Engineer',
                email: 'jane_globex_new@globex.com',
                phone: '555-9876',
                phoneCountry: 'US',
                location: 'New York',
                status: 'PENDING'
            }
        });

        console.log('Successfully seeded mock org and user requests for testing.');
    } catch (error) {
        console.error('Error seeding requests:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedRequests();
