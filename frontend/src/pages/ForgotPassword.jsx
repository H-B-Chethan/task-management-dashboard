import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import Alert from "../components/Alert";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      setStatus({
        type: "success",
        msg: "Reset link sent! Check your email inbox.",
      });
    } catch {
      setStatus({
        type: "error",
        msg: "Failed to send reset email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-xl">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Reset your password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter your email and we'll send a reset link.
            </p>
          </div>

          <Alert type={status.type || "error"} message={status.msg} />

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input-field"
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-5"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;
