const jwt = require("jsonwebtoken");
const db = require("../config/db");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in DB
    const [rows] = await db.query(
      "SELECT id, name, email, phone, avatar, is_verified FROM users WHERE id = ?",
      [decoded.id],
    );

    if (!rows.length) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Token invalid or expired" });
  }
};

module.exports = { protect };
