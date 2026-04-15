import mongoose from "mongoose";
import env from "../config/env.js";

let isConnected = false;


const db = async () => {
  console.log("Trying to connect to db...")
  if (isConnected) {
    console.log("Already connected to db.");
    return;
  }
  await mongoose.connect(env.MONGO_URL, {
    dbName: "auth_user",
  });
  isConnected = true;
  console.log("Successfully connected to db...");
};

mongoose.connection.on("connected", () => {
  console.log("DB connected");
});
mongoose.connection.on("error", (err) => {
  console.log("DB error: ", err);
});
mongoose.connection.on("disconnected", () => {
  console.log("DB disconnected");
});

export default db;