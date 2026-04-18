import { z } from "zod";
import AppError from "../utils/app-error.js";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().optional().default("3000"),
  BASE_URL: z.string().url(),
  MONGO_URL: z.string().url(),
  NODE_ENV: z
    .string()
    .trim()
    .toLowerCase()
    .refine((val) => ["development", "production", "test"].includes(val), {
      message: "Environment must be production, development or test",
    }),
  ACCESS_TOKEN_SECRET: z.string(),
  ACCESS_TOKEN_EXPIRY: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_EXPIRY: z.string(),
  TEMP_TOKEN_EXPIRY: z.string(),
  SMTP_HOST: z.string().trim(),
  SMTP_PORT: z
    .string()
    .transform(Number)
    .refine((val) => !isNaN(val), {
      message: "SMTP_PORT must be a number",
    }),
  SMTP_USER: z.string().trim(),
  SMTP_PASS: z.string().trim(),
  SMTP_SEND: z.email(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
});

function createEnv(env) {
  const validationResult = envSchema.safeParse(env); // { success: false/true, error: ZodError }
  if (!validationResult.success) {
    const message = validationResult.error.issues.map((e) => e.message);
    console.log(validationResult.error.issues);
    throw new AppError(500, "Invalid environment variables", message);
  }
  return validationResult.data; //{success: true,data: {// validated + parsed data}}
}

const env = createEnv(process.env);

export default env;
