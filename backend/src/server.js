import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
// server.js or index.js
import './services/attendance.cron.js';
import './services/holiday.cron.js';
import { connectDB } from "./config/db.js";

connectDB();

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res.status(400).json({ message: err.message });
  }

  next();
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
