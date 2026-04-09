import {z} from "zod";
import AppError from "../utils/app-error.js";
import dotenv from 'dotenv'

dotenv.config()
 
const envSchema = z.object({
  PORT: z.string().optional().default('3000'),
  BASE_URL: z.url(),
  MONGO_URL: z.url(),
  NODE_ENV: z.string().trim().toLowerCase().refine((val)=>["development","production","test"].includes(val),{
    error: "NODE_ENV must be production, development or test"
  }),
  MAILTRAP_HOST: z.string().trim(),
  MAILTRAP_PORT: z
    .string()
    .transform(Number)
    .refine(val => !isNaN(val), {
      message: "MAILTRAP_PORT must be a number"
    }),
  MAILTRAP_USERNAME: z.string().trim(),
  MAILTRAP_PASSWORD: z.string().trim(),
  MAILTRAP_SENDERMAIL: z.email() 

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