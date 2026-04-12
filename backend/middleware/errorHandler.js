const errorHandler = (err, req, res, next) => {
  console.error("[ERROR]", err.stack);

  // MySQL duplicate entry
  if (err.code === "ER_DUP_ENTRY") {
    return res
      .status(400)
      .json({ success: false, message: "Email already registered" });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
