import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import env from "./config/env.js"
import authRouter from "./routes/auth.routes.js"
import ApiResponse from "./utils/api-response.js"
import globalErrorHandler from "./middlewares/error.middleware.js"

const app = express()


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

app.get("/api/v1/healthcheck",(req,res)=>{
  console.log("Server is in good health.")
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        message: "Server is in good health."
      }
    )
  )
})

app.use("/api/v1/auth",authRouter)


app.use(globalErrorHandler)

export default app