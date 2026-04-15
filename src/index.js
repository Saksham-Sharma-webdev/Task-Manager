
import app from "./app.js"
import env from "./config/env.js"
import db from "./db/index.js"


const port = Number(env.PORT) || 3000


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