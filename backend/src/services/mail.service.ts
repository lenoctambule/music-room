import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 2525,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const FROM = '"Music Room" <noreply@musicroom.app>';

export async function sendVerificationCode(to: string, code: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Your verification code — Music Room',
    html: `
      <h2>Welcome to Music Room!</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center;">${code}</h1>
      <p>This code expires in 15 minutes.</p>
      <p>If you didn't create an account, you can ignore this email.</p>
    `,
  });
}

export async function sendPasswordResetCode(to: string, code: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Reset your password — Music Room',
    html: `
      <h2>Password Reset</h2>
      <p>Your reset code is:</p>
      <h1 style="letter-spacing: 8px; font-size: 36px; text-align: center;">${code}</h1>
      <p>This code expires in 1 hour.</p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}
