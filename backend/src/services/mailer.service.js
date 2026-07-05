const { Resend } = require('resend');

const sendOtpEmail = async (to, otp, type) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    console.log(`\n[MAILER DEV MODE] OTP for ${to} (${type}): ${otp}\n`);
    console.log('To send real emails, set RESEND_API_KEY in your .env file.\n');
    return { success: true, dev: true };
  }

  const resend = new Resend(apiKey);

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
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:800;color:#6366f1;letter-spacing:-0.5px;">
                IntellMeet
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">
                ${heading}
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#4b5563;line-height:1.6;">
                ${subtext}
              </p>
              <!-- OTP Box -->
              <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#4f46e5;">
                  Verification Code
                </p>
                <p style="margin:0;font-size:42px;font-weight:700;letter-spacing:8px;color:#312e81;font-family:'Courier New',monospace;">
                  ${otp}
                </p>
                <p style="margin:16px 0 0;font-size:13px;color:#6366f1;">
                  Expires in 10 minutes
                </p>
              </div>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;background:#f9fafb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                © 2025 IntellMeet · All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: \`"IntellMeet" <\${fromEmail}>\`,
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('[Mailer] Resend API error:', error);
      throw new Error('Failed to send email');
    }

    return { success: true, id: data.id };
  } catch (error) {
    console.error('[Mailer] Error:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = { sendOtpEmail };
