import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import Alert from "../components/Alert";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setStatus({ type: "error", msg: "Passwords don't match" });
      return;
    }
    if (form.password.length < 8) {
      setStatus({
        type: "error",
        msg: "Password must be at least 8 characters",
      });
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, password: form.password });
      setDone(true);
      setStatus({
        type: "success",
        msg: "Password reset! Redirecting to login...",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus({
        type: "error",
        msg:
          err.response?.data?.message || "Reset failed. Link may be expired.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center">
          <p className="text-red-600">Invalid reset link.</p>
          <Link
            to="/forgot-password"
            className="text-indigo-600 hover:underline text-sm mt-4 block"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-xl">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Set new password
          </h1>
          <Alert type={status.type || "error"} message={status.msg} />
          {!done && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="New password (min 8 chars)"
                className="input-field"
              />
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
                placeholder="Confirm new password"
                className="input-field"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default ResetPassword;
