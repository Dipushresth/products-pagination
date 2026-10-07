import express from "express";
import bcrypt from "bcrypt";
import { db } from "../../db.js";

// const SignUp = express.Router({ mergeParams: true });

export async function Register(req, res, next) {
  try {
    const { name, age, email, phone, address, password } = req.body || {};
    console.log("register name", name);

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    }

    // check if email is already registered
    const existing = await db.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, age, email, phone, address, password, role)
            VALUES ($1, $2, $3, $4, $5, $6, 'customer')
            RETURNING id, name, age, email, phone, address, role`,
      [name, age, email, phone, address, hashedPassword],
    );
    res
      .status(201)
      .json({ message: "User registered successfully", data: result.rows[0] });
  } catch (err) {
    console.log("error", err);
    next(err);
  }
}
