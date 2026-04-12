import { useState, useEffect, useCallback } from "react";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getStats,
  exportCSV,
} from "../api/itemApi";
import Navbar from "../components/Navbar";
import StatsCard from "../components/StatsCard";
import ItemModal from "../components/ItemModal";
import DeleteConfirm from "../components/DeleteConfirm";
import Alert from "../components/Alert";

const STATUS_BADGES = {
  active: "badge-active",
  pending: "badge-pending",
  completed: "badge-completed",
};
const PRIORITY_BADGES = {
  high: "badge-high",
  medium: "badge-medium",
  low: "badge-low",
};

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modal, setModal] = useState(null); // null | { mode: 'create'|'edit', item: {} }
  const [toDelete, setToDelete] = useState(null);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 8 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;

      // Fetch items and stats separately so one failure doesn't kill both
      try {
        const itemsRes = await getItems(params);
        console.log("Items response:", itemsRes.data);
        setItems(itemsRes.data.data || []);
        setPagination(itemsRes.data.pagination || {});
      } catch (err) {
        console.error("Items fetch error:", err.response?.data);
        setError("Failed to load items.");
      }

      try {
        const statsRes = await getStats();
        console.log("Stats response:", statsRes.data);
        setStats(statsRes.data.data || {});
      } catch (err) {
        console.error("Stats fetch error:", err.response?.data);
        // Don't block items display if stats fail
      }
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((prev) => !prev);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (modal.item?.id) {
        await updateItem(modal.item.id, formData);
        setSuccess("Item updated successfully");
      } else {
        await createItem(formData);
        setSuccess("Item created successfully");
      }
      setModal(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteItem(toDelete.id);
      setSuccess("Item deleted");
      setToDelete(null);
      fetchAll();
    } catch {
      setError("Delete failed");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const { data } = await exportCSV();
      const url = URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "items.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed");
    }
  };

  const handleFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar onDarkToggle={toggleDark} isDark={isDark} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        <div className="space-y-2 mb-6">
          <Alert type="error" message={error} onClose={() => setError("")} />
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess("")}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatsCard
            label="Total Items"
            value={stats.total}
            icon="📋"
            color="indigo"
          />
          <StatsCard
            label="Active"
            value={stats.active}
            icon="✅"
            color="green"
          />
          <StatsCard
            label="Pending"
            value={stats.pending}
            icon="⏳"
            color="yellow"
          />
          <StatsCard
            label="Completed"
            value={stats.completed}
            icon="🏁"
            color="blue"
          />
          <StatsCard
            label="High Priority"
            value={stats.high_priority}
            icon="🔴"
            color="red"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            placeholder="Search items..."
            value={filters.search}
            onChange={(e) => handleFilter("search", e.target.value)}
            className="input-field sm:w-72"
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilter("status", e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => handleFilter("priority", e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="flex gap-2 sm:ml-auto">
            <button onClick={handleExport} className="btn-secondary px-4">
              ⬇ CSV
            </button>
            <button
              onClick={() => setModal({ mode: "create", item: {} })}
              className="btn-primary px-5"
            >
              + New Item
            </button>
          </div>
        </div>

        {/* Items Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm mt-1">
                Create your first item or adjust your filters
              </p>
              <button
                onClick={() => setModal({ mode: "create", item: {} })}
                className="btn-primary mt-4"
              >
                + Create item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    {[
                      "Title",
                      "Description",
                      "Status",
                      "Priority",
                      "Tags",
                      "Created",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[180px] truncate">
                        {item.title}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {item.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={STATUS_BADGES[item.status]}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={PRIORITY_BADGES[item.priority]}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-500 max-w-[120px] truncate text-xs">
                        {item.tags || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModal({ mode: "edit", item })}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setToDelete(item)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} items
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {modal && (
        <ItemModal
          item={modal.item}
          onSave={handleSave}
          onClose={() => setModal(null)}
          loading={saving}
        />
      )}
      {toDelete && (
        <DeleteConfirm
          item={toDelete}
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
          loading={saving}
        />
      )}
    </div>
  );
};
export default Dashboard;
