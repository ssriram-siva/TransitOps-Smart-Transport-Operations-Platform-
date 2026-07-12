const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"RouteMind" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

const welcomeEmail = (name, email) => ({
  to: email,
  subject: "Welcome to RouteMind — Your Fleet Control Platform",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;color:#fff;">🚛</div>
      </div>
      <h2 style="color:#0f172a;text-align:center;margin:0 0 8px;">Welcome to RouteMind!</h2>
      <p style="color:#64748b;text-align:center;margin:0 0 24px;">Your fleet management account is ready.</p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0;color:#334155;font-size:14px;">Hi <strong>${name}</strong>,</p>
        <p style="margin:8px 0 0;color:#64748b;font-size:14px;">You can now log in to manage vehicles, drivers, trips, and expenses from your dashboard.</p>
      </div>
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login" style="display:block;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Go to Dashboard →</a>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:24px 0 0;">This account was created with this email address. If this wasn't you, please ignore this email.</p>
    </div>
  `,
});

const loginNotificationEmail = (name, email, ip, userAgent) => ({
  to: email,
  subject: "New Login to Your RouteMind Account",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;color:#fff;">✓</div>
      </div>
      <h2 style="color:#0f172a;text-align:center;margin:0 0 8px;">New Login Detected</h2>
      <p style="color:#64748b;text-align:center;margin:0 0 24px;">Someone signed in to your RouteMind account.</p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#334155;font-size:14px;"><strong>Name:</strong> ${name}</p>
        <p style="margin:0 0 8px;color:#334155;font-size:14px;"><strong>Email:</strong> ${email}</p>
        <p style="margin:0 0 8px;color:#334155;font-size:14px;"><strong>Time:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
        ${ip ? `<p style="margin:0 0 8px;color:#334155;font-size:14px;"><strong>IP:</strong> ${ip}</p>` : ""}
        ${userAgent ? `<p style="margin:0;color:#334155;font-size:14px;"><strong>Browser:</strong> ${userAgent}</p>` : ""}
      </div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">If this was you, no action is needed. If you don't recognize this login, change your password immediately.</p>
    </div>
  `,
});

const passwordResetEmail = (name, email, resetUrl) => ({
  to: email,
  subject: "Reset Your RouteMind Password",
  html: `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);width:48px;height:48px;border-radius:12px;line-height:48px;font-size:24px;color:#fff;">🔑</div>
      </div>
      <h2 style="color:#0f172a;text-align:center;margin:0 0 8px;">Password Reset Request</h2>
      <p style="color:#64748b;text-align:center;margin:0 0 24px;">We received a request to reset your password.</p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;color:#334155;font-size:14px;">Hi <strong>${name}</strong>,</p>
        <p style="margin:0;color:#64748b;font-size:14px;">Click the button below to set a new password. This link expires in 15 minutes.</p>
      </div>
      <a href="${resetUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Reset Password →</a>
      <div style="background:#fef2f2;border-radius:8px;padding:12px;margin-top:24px;">
        <p style="margin:0;color:#b91c1c;font-size:12px;text-align:center;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
    </div>
  `,
});

module.exports = {
  sendEmail,
  welcomeEmail,
  loginNotificationEmail,
  passwordResetEmail,
};
