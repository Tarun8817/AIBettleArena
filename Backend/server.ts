import mongoose from "mongoose"
import app from "./src/app.js"
import env from "./src/config/config.js"

const PORT = 3000

mongoose.connect(env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully!")
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
      setInterval(() => {
        fetch(`http://localhost:${PORT}/api/health`)
          .then(res => res.json())
          .then(data => console.log(`[Keep-Alive] Health check polling:`, data))
          .catch(err => console.error(`[Keep-Alive] Health check failed:`, err.message));
      }, 3 * 60 * 1000);
    })
  })
  .catch((err) => {
    console.error("Database connection failed:", err)
    // Fallback: Start the server anyway so the client still gets offline status flags
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (Database Offline)`)
      setInterval(() => {
        fetch(`http://localhost:${PORT}/api/health`)
          .then(res => res.json())
          .then(data => console.log(`[Keep-Alive] Health check polling:`, data))
          .catch(err => console.error(`[Keep-Alive] Health check failed:`, err.message));
      }, 3 * 60 * 1000);
    })
  })
