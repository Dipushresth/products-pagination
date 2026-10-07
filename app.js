import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";

import { db } from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

try {
  const client = await db.connect();
  console.log("connected successfully to the DB");
  client.release();
} catch (err) {
  console.log("Something went wrong", err);
}

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);

// must be the LAST app.use() — this only runs when next(err) is called
app.use(errorHandler);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
