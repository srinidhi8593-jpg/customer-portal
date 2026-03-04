import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'User is not active. Status: ' + user.status });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, role: user.role, orgId: user.orgId },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, title: user.title, phone: user.phone, businessUnit: user.businessUnit, orgId: user.orgId } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Org Registration Request
router.post('/register/org', async (req: Request, res: Response) => {
    const {
        soldToCompany, soldToAddress, soldToCity, soldToState, soldToPostalCode, soldToCountry, soldToPhone, soldToEmail, soldToSalesTaxExempt,
        billToCompany, billToAddress, billToCity, billToState, billToPostalCode, billToCountry, billToPhone, billToEmail,
        shipToCompany, shipToAddress, shipToCity, shipToState, shipToPostalCode, shipToCountry, shipToPhone, shipToEmail,
        carrier, carrierAccountNumber,
        authorityAdminName, authorityAdminPhone, authorityAdminEmail, authorityAdminPosition, authorityAdminFax
    } = req.body;

    // Validate required fields
    if (!soldToCompany || !billToCompany || !shipToCompany || !authorityAdminName || !authorityAdminEmail || !authorityAdminPhone) {
        return res.status(400).json({ error: 'All mandatory fields must be filled' });
    }

    try {
        const request = await prisma.orgRegistrationRequest.create({
            data: {
                soldToCompany, soldToAddress, soldToCity, soldToState, soldToPostalCode, soldToCountry, soldToPhone, soldToEmail, soldToSalesTaxExempt,
                billToCompany, billToAddress, billToCity, billToState, billToPostalCode, billToCountry, billToPhone, billToEmail,
                shipToCompany, shipToAddress, shipToCity, shipToState, shipToPostalCode, shipToCountry, shipToPhone, shipToEmail,
                carrier, carrierAccountNumber,
                authorityAdminName, authorityAdminPhone, authorityAdminEmail, authorityAdminPosition, authorityAdminFax
            }
        });
        res.status(201).json({ message: 'Organization registration request submitted successfully', request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Active Organizations (Used for dropdowns)
router.get('/organizations', async (req: Request, res: Response) => {
    try {
        const orgs = await prisma.organization.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true }
        });
        res.json(orgs);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// User Registration Request
router.post('/register/user', async (req: Request, res: Response) => {
    const { company, industry, simulator, firstName, lastName, title, email, phone, phoneCountry, location } = req.body;

    if (!firstName || !lastName || !email || !company) {
        return res.status(400).json({ error: 'First Name, Last Name, Email, and Company are required' });
    }

    try {
        const request = await prisma.userRegistrationRequest.create({
            data: {
                company,
                industry,
                simulator,
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                title,
                email,
                phone,
                phoneCountry,
                location
            }
        });
        res.status(201).json({ message: 'User registration request submitted successfully', request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Forgot Password -> Returns reset token for mock
router.post('/forgot-password', async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const token = jwt.sign({ id: user.id, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
        // Should send email here
        res.json({ message: 'If email exists, a reset link was sent.', mockToken: token });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/reset-password', async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'reset') return res.status(400).json({ error: 'Invalid token' });

        const hash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: decoded.id },
            data: { passwordHash: hash }
        });

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ error: 'Server error or invalid token' });
    }
});

export default router;
