const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");

// Helper: generate JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user.id);
  const {
    password: _,
    reset_token: __,
    reset_token_expiry: ___,
    verify_token: ____,
    ...safeUser
  } = user;
  res.status(statusCode).json({ success: true, token, user: safeUser });
};

// ─── REGISTER ───────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check existing
    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const [result] = await db.query(
      "INSERT INTO users (name, email, phone, password, verify_token) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone || null, hashedPassword, verifyToken],
    );

    const userId = result.insertId;

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;
    await sendEmail({
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>Click the link below to verify your email address:</p>
        <a href="${verifyUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Verify Email</a>
        <p>Link expires in 24 hours.</p>
      `,
    }).catch(console.error); // Non-blocking

    const [newUser] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);
    sendTokenResponse(newUser[0], 201, res);
  } catch (err) {
    next(err);
  }
};

// ─── LOGIN ───────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!rows.length) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ─── GET ME ──────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    // Always respond the same to prevent email enumeration
    if (!rows.length) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link was sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?",
      [resetToken, tokenExpiry, email],
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click below (valid for 1 hour):</p>
        <a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });

    res.json({
      success: true,
      message: "If that email exists, a reset link was sent.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── RESET PASSWORD ──────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
      [token],
    );

    if (!rows.length) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    const hashed = await bcrypt.hash(password, 12);
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?",
      [hashed, rows[0].id],
    );

    res.json({
      success: true,
      message: "Password reset successful. Please log in.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE PROFILE ─────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    await db.query("UPDATE users SET name = ?, phone = ? WHERE id = ?", [
      name,
      phone,
      req.user.id,
    ]);
    const [updated] = await db.query(
      "SELECT id, name, email, phone, avatar, is_verified FROM users WHERE id = ?",
      [req.user.id],
    );
    res.json({ success: true, user: updated[0] });
  } catch (err) {
    next(err);
  }
};
