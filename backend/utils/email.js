// backend/utils/email.js
// backend/utils/email.js
const { Resend } = require('resend');

// Initialize Resend with API Key from Environment Variables
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const SENDER_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'; // Default testing domain
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ultimate-social-app.onrender.com';

/**
 * Sends an OTP email using Resend API (HTTPS).
 * Includes a "Magic Link" for automated verification.
 * * @param {string} to - Recipient email
 * @param {string} otp - The 6-digit code
 * @param {string} subject - Email subject
 */
exports.sendOtpEmail = async (to, otp, subject = 'Your Verification Code') => {
  // 1. Dev Mode / Missing Key Fallback
  // If no API key is set, we log the OTP to the console so you can still test locally.
  if (process.env.NODE_ENV === 'development' || !resend) {
    console.log(`[📧 MOCK EMAIL] To: ${to} | OTP: ${otp}`);
    return true; // Return true so the app flow continues
  }

  try {
    // 2. Construct Magic Link 
    // This allows the user to verify just by clicking, without typing the code.
    const magicLink = `${FRONTEND_URL}/verify-account?email=${encodeURIComponent(to)}&code=${otp}`;

    const { data, error } = await resend.emails.send({
      from: 'Social App <' + SENDER_EMAIL + '>',
      to: [to], 
      subject: subject,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">SocialApp</h2>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
            Hello,
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
            Use the verification code below to access your account. This code is valid for 15 minutes.
          </p>

          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 30px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">${otp}</span>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${magicLink}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Verify Automatically</a>
          </div>

          <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            If you did not request this email, you can safely ignore it.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      return false;
    }

    console.log('✅ Email sent successfully via Resend. ID:', data.id);
    return true;

  } catch (err) {
    console.error('❌ Email System Critical Failure:', err.message);
    return false;
  }
};