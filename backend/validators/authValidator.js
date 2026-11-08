const { z } = require("zod");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100)
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number");

exports.registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name too short")
      .max(50, "Name too long"),

    email: z
      .string()
      .email("Invalid email"),

    password: passwordSchema,

    referralCode: z
      .string()
      .optional(),
  }),
});

exports.loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email"),

    password: z
      .string()
      .min(1, "Password required"),
  }),
});

exports.verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email(),

    otp: z
      .string()
      .length(6, "OTP must be 6 digits"),
  }),
});

exports.requestResetSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email(),
  }),
});

exports.resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email(),

    otp: z
      .string()
      .length(6),

    newPassword: passwordSchema,
  }),
});
exports.googleLoginSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(10, "Invalid Google token"),
  }),
});