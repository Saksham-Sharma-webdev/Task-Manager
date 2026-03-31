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