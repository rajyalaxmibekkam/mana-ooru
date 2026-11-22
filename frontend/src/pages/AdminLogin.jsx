import { API_URL as API_ROOT } from "../config/api";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, User, ArrowLeft, ShieldCheck } from "lucide-react";
import "./Admin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("president");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_ROOT}/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid username or password");
      }

      if (!data.access_token) {
        throw new Error("Login response did not contain an access token.");
      }

      localStorage.setItem("president_token", data.access_token);

      navigate("/president/dashboard", { replace: true });

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please check whether the backend is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">

      <div className="admin-login-card">

        <Link to="/" className="admin-back-link">
          <ArrowLeft size={18} />
          Back to Village Home
        </Link>

        <div className="admin-login-icon">
          <ShieldCheck size={34} />
        </div>

        <h1>President Login</h1>

        <p>
          Mana Ooru – Kotha Idara Village Administration
        </p>

        <form onSubmit={handleLogin}>

          <label htmlFor="username">Username</label>

          <div className="admin-input-group">
            <User size={18} />

            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <label htmlFor="password">Password</label>

          <div className="admin-input-group">
            <Lock size={18} />

            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="admin-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Secure Login"}
          </button>

        </form>

        <div className="admin-security-note">
          <Lock size={15} />
          Authorized village administration only
        </div>

      </div>

    </div>
  );
}

export default AdminLogin;
