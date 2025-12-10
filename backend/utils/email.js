// backend/utils/email.js
const nodemailer = require('nodemailer');

const HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const PORT = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
const USER = process.env.EMAIL_USER;
const PASS = process.env.EMAIL_PASS;
const FROM = process.env.EMAIL_FROM || USER;

/**
 * If EMAIL_USER / EMAIL_PASS are not provided we avoid creating a real transporter
 * and instead return a stub that resolves immediately. This prevents connection
 * timeouts in environments where SMTP is blocked/unavailable (like some free hosts).
 */
let transporter = null;

if (!USER || !PASS) {
  console.warn('⚠️ Email disabled: EMAIL_USER or EMAIL_PASS not configured. OTP emails will be skipped.');
  transporter = {
    sendMail: async (opts) => {
      // log for debugging, but do not throw
      console.log('Email disabled - skipping send. Mail payload:', { to: opts.to, subject: opts.subject });
      return Promise.resolve({ ok: true, skipped: true });
    }
  };
} else {
  transporter = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465, // true for port 465, false for 587
    auth: { user: USER, pass: PASS },
    // timeouts to avoid long blocking
    connectionTimeout: 10_000, // 10s
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
    tls: {
      // accept self-signed certs if needed (optional)
      rejectUnauthorized: process.env.EMAIL_TLS_REJECT === 'true' ? true : false,
    },
  });

  // Verify once on startup (non-fatal)
  transporter.verify()
    .then(() => console.log('Email transporter ready'))
    .catch(err => console.warn('Email transporter verify failed (non-fatal):', err.message || err));
}

exports.sendOtpEmail = async (to, otp, subject = 'Your verification code') => {
  try {
    const html = `<p>Your verification OTP is: <b>${otp}</b></p><p>This code is valid for 15 minutes.</p>`;
    await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('sendOtpEmail err', err && err.message ? err.message : err);
    // non-fatal: return false so callers can decide what to do
    return false;
  }
};
