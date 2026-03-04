import nodemailer from 'nodemailer';
import prisma from '../db';

export const sendEmail = async (to: string, templateKey: string, variables: Record<string, any>) => {
    try {
        const template = await prisma.emailTemplate.findUnique({ where: { key: templateKey } });

        // Fallback if template is not defined in DB
        const subject = template?.subject || `Notification: ${templateKey}`;
        let bodyText = template?.bodyText || `Please check your account for updates.`;

        // Basic variable replacement {{varName}}
        for (const [key, value] of Object.entries(variables)) {
            bodyText = bodyText.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }

        // In a real app we configure the SMTP transport from Env or DB Strategy
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: Number(process.env.SMTP_PORT) || 1025, // Mock SMTP port
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: '"Echidna Portal" <no-reply@echidna.com>',
            to,
            subject,
            text: bodyText,
        });
        console.log(`Email sent to ${to} - Template: ${templateKey}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
