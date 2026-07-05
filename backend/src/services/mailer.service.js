const nodemailer = require('nodemailer');

const sendOtpEmail = async (to, otp, type) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  if (!smtpUser || !smtpPass) {
    console.log(`\n[MAILER DEV MODE] OTP for ${to} (${type}): ${otp}\n`);
    return { success: true, dev: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const subject =
    type === 'signup'
      ? 'Verify your IntellMeet account'
      : 'Your IntellMeet sign-in code';

  const heading =
    type === 'signup' ? 'Confirm your email' : 'Your sign-in code';

  const subtext =
    type === 'signup'
      ? 'Enter this code to verify your email and activate your account.'
      : 'Enter this code to sign in to IntellMeet. The code expires in 10 minutes.';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:800;color:#6366f1;letter-spacing:-0.5px;">IntellMeet</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">${heading}</h1>
              <p style="margin:0 0 32px;font-size:15px;color:#4b5563;line-height:1.6;">${subtext}</p>
              <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#4f46e5;">Verification Code</p>
                <p style="margin:0;font-size:42px;font-weight:700;letter-spacing:8px;color:#312e81;font-family:'Courier New',monospace;">${otp}</p>
                <p style="margin:16px 0 0;font-size:13px;color:#6366f1;">Expires in 10 minutes</p>
              </div>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">If you didn't request this code, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;background:#f9fafb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">© 2025 IntellMeet · All rights reserved</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    const info = await transporter.sendMail({
      from: `"IntellMeet" <${smtpUser}>`,
      to: to,
      subject: subject,
      html: html,
    });
    console.log('[Mailer] Email sent:', info.messageId);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error('[Mailer] SMTP error:', error.message);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendOtpEmail };
