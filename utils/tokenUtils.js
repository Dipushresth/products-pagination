import jwt from "jsonwebtoken";
import crypto from "crypto";

export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" },
  );
}

export function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

// Turns the raw refresh token into a fixed-length, irreversible fingerprint.
// We store this in the DB instead of the raw token, so a DB leak alone
// doesn't hand out usable refresh tokens.
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Verifies the JWT signature + expiry. Throws if invalid/expired/tampered —
// callers are expected to catch it (see Refresh() below).
export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
