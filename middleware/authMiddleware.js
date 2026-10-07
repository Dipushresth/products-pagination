import { verifyAccessToken } from "../utils/tokenUtils.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("Authorization header:", authHeader);
  console.log("Starts with Bearer:", authHeader?.startsWith("Bearer "));

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Bearer token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  console.log("Token:", token);

  try {
    const decoded = verifyAccessToken(token);

    console.log("Decoded:", decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.log("JWT ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
