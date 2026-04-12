const db = require("../config/db");

// ─── GET STATS ───────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [total] = await db.query(
      "SELECT COUNT(*) as count FROM items WHERE user_id = ?",
      [userId],
    );
    const [active] = await db.query(
      "SELECT COUNT(*) as count FROM items WHERE user_id = ? AND status = 'active'",
      [userId],
    );
    const [pending] = await db.query(
      "SELECT COUNT(*) as count FROM items WHERE user_id = ? AND status = 'pending'",
      [userId],
    );
    const [completed] = await db.query(
      "SELECT COUNT(*) as count FROM items WHERE user_id = ? AND status = 'completed'",
      [userId],
    );
    const [high] = await db.query(
      "SELECT COUNT(*) as count FROM items WHERE user_id = ? AND priority = 'high'",
      [userId],
    );

    return res.json({
      success: true,
      data: {
        total: total[0].count,
        active: active[0].count,
        pending: pending[0].count,
        completed: completed[0].count,
        high_priority: high[0].count,
      },
    });
  } catch (err) {
    console.error("STATS ERROR:", err.message);
    next(err);
  }
};

// ─── GET ALL ITEMS ───────────────────────────────────────────
exports.getItems = async (req, res, next) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;

    let query = "SELECT * FROM items WHERE user_id = ?";
    let params = [req.user.id];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (priority) {
      query += " AND priority = ?";
      params.push(priority);
    }
    if (search) {
      query += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Count total
    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    // Paginate
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [items] = await db.query(query, params);

    console.log(`GET ITEMS: user=${req.user.id} found=${items.length}`);

    return res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("GET ITEMS ERROR:", err.message);
    next(err);
  }
};

// ─── GET SINGLE ITEM ─────────────────────────────────────────
exports.getItem = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM items WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id],
    );
    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("GET ITEM ERROR:", err.message);
    next(err);
  }
};

// ─── CREATE ITEM ─────────────────────────────────────────────
exports.createItem = async (req, res, next) => {
  try {
    const {
      title,
      description = null,
      status = "active",
      priority = "medium",
      tags = null,
    } = req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    console.log("CREATE ITEM:", { title, status, priority, user: req.user.id });

    const [result] = await db.query(
      "INSERT INTO items (user_id, title, description, status, priority, tags) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, title.trim(), description, status, priority, tags],
    );

    const [newItem] = await db.query("SELECT * FROM items WHERE id = ?", [
      result.insertId,
    ]);
    return res.status(201).json({ success: true, data: newItem[0] });
  } catch (err) {
    console.error("CREATE ITEM ERROR:", err.message);
    next(err);
  }
};

// ─── UPDATE ITEM ─────────────────────────────────────────────
exports.updateItem = async (req, res, next) => {
  try {
    const [existing] = await db.query(
      "SELECT id FROM items WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id],
    );
    if (!existing.length) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    const {
      title,
      description = null,
      status = "active",
      priority = "medium",
      tags = null,
    } = req.body;

    await db.query(
      "UPDATE items SET title = ?, description = ?, status = ?, priority = ?, tags = ? WHERE id = ? AND user_id = ?",
      [title, description, status, priority, tags, req.params.id, req.user.id],
    );

    const [updated] = await db.query("SELECT * FROM items WHERE id = ?", [
      req.params.id,
    ]);
    return res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error("UPDATE ITEM ERROR:", err.message);
    next(err);
  }
};

// ─── DELETE ITEM ─────────────────────────────────────────────
exports.deleteItem = async (req, res, next) => {
  try {
    const [existing] = await db.query(
      "SELECT id FROM items WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id],
    );
    if (!existing.length) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }
    await db.query("DELETE FROM items WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.user.id,
    ]);
    return res.json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    console.error("DELETE ITEM ERROR:", err.message);
    next(err);
  }
};

// ─── EXPORT CSV ──────────────────────────────────────────────
exports.exportCSV = async (req, res, next) => {
  try {
    const [items] = await db.query(
      "SELECT id, title, description, status, priority, tags, created_at FROM items WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id],
    );

    const header = "ID,Title,Description,Status,Priority,Tags,Created At\n";
    const rows = items
      .map(
        (i) =>
          `${i.id},"${(i.title || "").replace(/"/g, '""')}","${(i.description || "").replace(/"/g, '""')}",${i.status},${i.priority},"${(i.tags || "").replace(/"/g, '""')}","${i.created_at}"`,
      )
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="items.csv"');
    return res.send(header + rows);
  } catch (err) {
    console.error("EXPORT ERROR:", err.message);
    next(err);
  }
};
