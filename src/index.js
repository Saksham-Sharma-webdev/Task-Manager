import express from "express"

import { env } from "./config/env.js"
import db from "./db/index.js"

const app = express()

const port = env.PORT || 3000
console.log(env)



const startServer = async()=>{
  try{
    await db()
    app.listen(port,()=>{
      console.log(`Server running on ${env.BASE_URL}`) 
    })
  }
  catch(err){
    console.log("Failed to connect to db.")
    console.log("Error: ",err.message)
    process.exit(1)
  }
}

startServer()