import { z } from 'zod';

// Username validation
export const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters.")
  .max(50, "Username must be less than 50 characters.")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens.");

// Wallet address validation (basic BEP-20 format)
export const walletAddressSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid BEP-20 wallet address format.");

// CAPTCHA validation
export const captchaSchema = z.string()
  .min(1, "CAPTCHA verification is required.");

// Social media task verification
export const taskVerificationSchema = z.object({
  taskName: z.string(),
  verificationData: z.string().optional()
});

// Registration schema
export const registrationSchema = z.object({
  username: usernameSchema,
  walletAddress: walletAddressSchema.optional(),
  referredBy: z.string().optional(),
  captchaToken: captchaSchema
});

// Wallet submission schema
export const walletSubmissionSchema = z.object({
  walletAddress: walletAddressSchema,
  captchaToken: captchaSchema
});
