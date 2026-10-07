export function errorHandler(err, req, res, next) {
  console.log("Error handler caught:", err);
  res.status(500).json({ message: err.message || "Something went wrong" });
}
