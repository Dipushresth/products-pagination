import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from "../../utils/tokenUtils.js";
import { db } from "../../db.js";

export async function Refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log("refresh path identified");

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    const tokenHash = hashToken(refreshToken);
    const result = await db.query(
      "SELECT * FROM refresh_tokens WHERE token_hash=$1",
      [tokenHash],
    );

    if (result.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Refresh token not recognized, please log in again" });
    }

    const storedToken = result.rows[0];

    if (storedToken.revoked) {
      await db.query(
        "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1",
        [storedToken.user_id],
      );
      res.clearCookie("refreshToken");
      return res.status(401).json({
        message: "Refresh token has been revoked",
      });
    }
    if (new Date(storedToken.expires_at) < new Date()) {
      await db.query("DELETE FROM refresh_tokens WHERE id=$1", [
        storedToken.id,
      ]);
      return res
        .status(403)
        .json({ message: "Refresh token expired, please log in again" });
    }

    const userResult = await db.query("SELECT * FROM users WHERE id=$1", [
      storedToken.user_id,
    ]);
    if (userResult.rows.length === 0) {
      await db.query("DELETE FROM refresh_tokens WHERE id=$1", [
        storedToken.id,
      ]);

      res.clearCookie("refreshToken", {
        path: "/auth/refresh",
      });

      return res.status(403).json({
        message: "User no longer exists",
      });
    }

    const user = userResult.rows[0];

    await db.query("UPDATE refresh_tokens SET revoked = TRUE WHERE id=$1", [
      storedToken.id,
    ]);
    // 1. Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // 2. Hash new refresh token
    const newTokenHash = hashToken(newRefreshToken);

    // 3. Invalidate old token
    await db.query("UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1", [
      storedToken.id,
    ]);

    // 4. Store new refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO refresh_tokens
   (user_id, token_hash, expires_at, revoked)
   VALUES ($1, $2, $3, FALSE)`,
      [user.id, newTokenHash, expiresAt],
    );

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sasmeSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/auth/refresh",
    });

    return res.status(200).json({
      message: "Access token refreshed",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}
