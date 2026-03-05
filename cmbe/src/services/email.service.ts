import nodemailer from 'nodemailer';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const BRAND_COLOR = '#002B31';
const ACCENT_COLOR = '#02E68D';
const PORTAL_URL = process.env.FRONTEND_URL || 'https://debathub.vercel.app';

function baseLayout(title: string, body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f7f6; font-family: 'Segoe UI', Arial, sans-serif; color: #333; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: ${BRAND_COLOR}; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: ${ACCENT_COLOR}; font-size: 22px; letter-spacing: 1px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.55); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
    .content { padding: 36px 32px; }
    .content h2 { font-size: 20px; color: ${BRAND_COLOR}; margin-top: 0; }
    .content p { font-size: 15px; line-height: 1.7; color: #555; }
    .badge { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    .badge-pending { background: #FEF3C7; color: #92400E; }
    .badge-approved { background: #D1FAE5; color: #065F46; }
    .badge-rejected { background: #FEE2E2; color: #991B1B; }
    .post-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .post-card .post-title { font-size: 16px; font-weight: 700; color: ${BRAND_COLOR}; margin: 0 0 4px; }
    .post-card .post-meta { font-size: 12px; color: #94a3b8; margin: 0; }
    .btn { display: inline-block; margin-top: 24px; padding: 13px 28px; background: ${ACCENT_COLOR}; color: ${BRAND_COLOR}; font-weight: 800; font-size: 14px; text-decoration: none; border-radius: 8px; }
    .reason-box { background: #FEF2F2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px 18px; margin: 20px 0; font-size: 14px; color: #7f1d1d; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>DebatHub</h1>
      <p>Debate Forum Platform</p>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>You are receiving this email because you are a member of DebatHub.</p>
      <p>© 2026 DebatHub. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────
// Email Templates
// ──────────────────────────────────────────────

function postSubmittedTemplate(userName: string, postTitle: string): { subject: string; html: string } {
    return {
        subject: `✅ Post Submitted for Review — "${postTitle}"`,
        html: baseLayout('Post Submitted', `
            <span class="badge badge-pending">Pending Review</span>
            <h2>Your post has been submitted!</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Thank you for contributing to the DebatHub debate forum. Your post has been received and is now under review by our moderation team.</p>
            <div class="post-card">
              <p class="post-title">${postTitle}</p>
              <p class="post-meta">Status: Pending Approval</p>
            </div>
            <p>You will receive another email once your post has been reviewed. This usually takes up to 24 hours.</p>
            <hr class="divider"/>
            <p style="font-size:13px;color:#94a3b8;">In the meantime, feel free to browse other debates on the platform.</p>
            <a href="${PORTAL_URL}/forum" class="btn">Browse Debate Forum</a>
        `)
    };
}

function postApprovedTemplate(userName: string, postTitle: string, postId: string): { subject: string; html: string } {
    return {
        subject: `🎉 Your post is now live — "${postTitle}"`,
        html: baseLayout('Post Approved', `
            <span class="badge badge-approved">✓ Approved & Published</span>
            <h2>Your post is now live!</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Great news! Your post has been reviewed and approved by our moderation team. It is now publicly visible on the DebatHub debate forum.</p>
            <div class="post-card">
              <p class="post-title">${postTitle}</p>
              <p class="post-meta">Status: Published ✓</p>
            </div>
            <p>The debate community can now read, comment on, and engage with your post. We encourage you to stay active and respond to comments!</p>
            <a href="${PORTAL_URL}/forum/${postId}" class="btn">View Your Post</a>
        `)
    };
}

function postRejectedTemplate(userName: string, postTitle: string, reason: string): { subject: string; html: string } {
    return {
        subject: `❌ Post Not Approved — "${postTitle}"`,
        html: baseLayout('Post Not Approved', `
            <span class="badge badge-rejected">Not Approved</span>
            <h2>Your post was not approved</h2>
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Unfortunately, your post did not meet our community guidelines and has not been approved for publication. Here's the feedback from our moderation team:</p>
            <div class="post-card">
              <p class="post-title">${postTitle}</p>
              <p class="post-meta">Status: Rejected</p>
            </div>
            <div class="reason-box">
              <strong>Reason:</strong> ${reason || 'The post did not meet our community standards. Please review our guidelines and try again.'}
            </div>
            <p>You are welcome to revise your content and submit a new post that complies with our debate guidelines. If you believe this decision was made in error, please contact our support team.</p>
            <a href="${PORTAL_URL}/forum/create" class="btn">Submit a New Post</a>
        `)
    };
}

// ──────────────────────────────────────────────
// Transport factory
// ──────────────────────────────────────────────

function createTransport() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!host || !user || !pass) {
        return null; // SMTP not configured — emails are skipped gracefully
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
    });
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

async function sendRaw(to: string, subject: string, html: string): Promise<void> {
    const transporter = createTransport();
    if (!transporter) {
        console.warn(`[Email] SMTP not configured — skipped sending to ${to}: ${subject}`);
        return;
    }
    try {
        await transporter.sendMail({
            from: '"DebatHub" <no-reply@debathub.com>',
            to,
            subject,
            html,
        });
        console.log(`[Email] Sent to ${to}: ${subject}`);
    } catch (err) {
        // Never crash the request — just log the error
        console.error('[Email] Failed to send:', err);
    }
}

export async function sendPostSubmittedEmail(to: string, userName: string, postTitle: string): Promise<void> {
    const { subject, html } = postSubmittedTemplate(userName, postTitle);
    await sendRaw(to, subject, html);
}

export async function sendPostApprovedEmail(to: string, userName: string, postTitle: string, postId: string): Promise<void> {
    const { subject, html } = postApprovedTemplate(userName, postTitle, postId);
    await sendRaw(to, subject, html);
}

export async function sendPostRejectedEmail(to: string, userName: string, postTitle: string, reason: string): Promise<void> {
    const { subject, html } = postRejectedTemplate(userName, postTitle, reason);
    await sendRaw(to, subject, html);
}

// Legacy generic send (kept for backward compat with org/user approval emails)
export const sendEmail = async (to: string, templateKey: string, variables: Record<string, any>): Promise<void> => {
    const transporter = createTransport();
    if (!transporter) {
        console.warn(`[Email] SMTP not configured — skipped template ${templateKey} to ${to}`);
        return;
    }
    try {
        await transporter.sendMail({
            from: '"DebatHub" <no-reply@debathub.com>',
            to,
            subject: `DebatHub: ${templateKey.replace(/_/g, ' ')}`,
            text: Object.entries(variables).reduce((msg, [k, v]) => msg.replace(new RegExp(`{{${k}}}`, 'g'), String(v)), `Notification: ${templateKey}`),
        });
        console.log(`[Email] Sent template ${templateKey} to ${to}`);
    } catch (err) {
        console.error('[Email] Failed to send:', err);
    }
};
