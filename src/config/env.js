import {z} from "zod";
import AppError from "../utils/app-error.js";
import dotenv from 'dotenv'

dotenv.config()
 
const envSchema = z.object({
  PORT: z.string().optional().default('3000'),
  BASE_URL: z.url(),
  MONGO_URL: z.url(),
  NODE_ENV: z.string().trim().toLowerCase().refine((val)=>["development","production","test"].includes(val),{
    error: "Environment must be production, development or test"
  }),
  SMTP_HOST: z.string().trim(),
  SMTP_PORT: z
    .string()
    .transform(Number)
    .refine(val => !isNaN(val), {
      message: "SMTP_PORT must be a number"
    }),
  SMTP_USER: z.string().trim(),
  SMTP_PASS: z.string().trim(),
  SMTP_SEND: z.email(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string().optional()
});
 
function createEnv(env){
  const validationResult  = envSchema.safeParse(env) // { success: false/true, error: ZodError }
  if(!validationResult.success){
    const message = validationResult.error.issues.map((e)=>e.message)
    throw new AppError(404,message)
  }
  return validationResult.data //{success: true,data: {// validated + parsed data}}
}

export const env = createEnv(process.env)