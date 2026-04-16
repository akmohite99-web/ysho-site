const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVerificationEmail = async (toEmail, name, code) => {
  await transporter.sendMail({
    from:    `"Ysho" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: 'Verify your Ysho account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#5c3d1e;margin-bottom:8px;">Welcome to Ysho, ${name}!</h2>
        <p style="color:#555;margin-bottom:24px;">Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#fdf6ec;border:2px solid #5c3d1e;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#5c3d1e;">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;">If you did not create an account, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#5c3d1e;font-weight:bold;margin:0;">Ysho — Essence of Nature</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (toEmail, name, code) => {
  await transporter.sendMail({
    from:    `"Ysho" <${process.env.SMTP_USER}>`,
    to:      toEmail,
    subject: 'Reset your Ysho password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#5c3d1e;margin-bottom:8px;">Password Reset Request</h2>
        <p style="color:#555;margin-bottom:8px;">Hi ${name},</p>
        <p style="color:#555;margin-bottom:24px;">Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#fdf6ec;border:2px solid #5c3d1e;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#5c3d1e;">${code}</span>
        </div>
        <p style="color:#888;font-size:13px;">If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="color:#5c3d1e;font-weight:bold;margin:0;">Ysho — Essence of Nature</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
