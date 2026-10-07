import bcrypt from "bcrypt";
import { db } from "../../db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../utils/tokenUtils.js";

export async function Login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    console.log("email", email);
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "email and password are required" });
    }

    const result = await db.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const foundUser = result.rows[0];
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(foundUser);
    const refreshToken = generateRefreshToken(foundUser);

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [foundUser.id, tokenHash, expiresAt],
    );
    console.log("refreshToken on cookie", refreshToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // cannot acess cookie by js
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/auth/refresh",
    });

    res.status(200).json({
      message: "Login Successful",
      data: {
        user: {
          id: foundUser.id,
          email: foundUser.email,
          role: foundUser.role,
        },
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}
