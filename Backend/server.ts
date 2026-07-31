import mongoose from "mongoose"
import app from "./src/app.js"
import env from "./src/config/config.js"

const PORT = 3000

mongoose.connect(env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully!")
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("Database connection failed:", err)
    // Fallback: Start the server anyway so the client still gets offline status flags
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (Database Offline)`)
    })
  })
