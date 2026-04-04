import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { env } from "./config/env.js"
import authRouter from "./routes/auth.routes.js"

const app = express.Router()


// middlewares
app.use(
  cors({
    origin: env.BASE_URL,
    methods: ["GET","POST","PUT"],
    allowedHeaders: ["Content-Type","Authentication"]
  })
)

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())


// routes

app.get('/', (req, res) => {
  res.send('Welcome to Task Manager !')
})

app.use("api/v1/helathcheck",(req,res)=>{
  console.log("Server is in good health.")
})

app.use("api/v1/auth",authRouter)
