import { hashToken } from "../../utils/tokenUtils.js";
import { db } from "../../db.js";

export async function Logout(req, res, next) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        message: "No refresh token provided",
      });
    }

    const tokenHash = hashToken(refreshToken);
    //marking as revoked
    await db.query(
      `UPDATE FROM refresh_tokens
       SET revoked = TRUE
       WHERE token_hash=$1 AND revoked = FALSE
       RETURNING id`,
      [tokenHash],
    );

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/auth/refresh",
    });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}
