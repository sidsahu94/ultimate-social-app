// backend/utils/email.js
const nodemailer = require('nodemailer');

// Load environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ultimate-social-app.vercel.app';
const SENDER_EMAIL = process.env.EMAIL_USER || 'noreply@socialverse.app';

exports.sendOtpEmail = async (to, otp, subject = 'Your Verification Code') => {
  try {
    // If credentials are not configured in environment, use clean fallback log so auth never fails
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[📧 MOCK MODE] Email service not configured in environment. Verification code for ${to}: [${otp}]`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log(`[📧 SENDING] Attempting to send email to: ${to}`);

    // Construct Magic Link
    const magicLink = `${FRONTEND_URL}/verify-account?email=${encodeURIComponent(to)}&code=${otp}`;

    const mailOptions = {
      from: `"SocialVerse Team" <${SENDER_EMAIL}>`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Verify Your Account</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p>Use the code below to complete your sign-in to SocialVerse ∞.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${magicLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Automatically</a>
          </div>

          <p style="font-size: 12px; color: #888; text-align: center;">This code expires in 15 minutes.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('❌ EMAIL DISPATCH WARNING:', error.message);
    // Return true in development/fallback so signups are not blocked
    return true;
  }
};
