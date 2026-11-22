import { API_URL as API_ROOT } from "../config/api";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import "./PresidentSuggestions.css";

const API_URL = `${API_ROOT}/suggestions`;

const STATUSES = [
  "Pending",
  "Under Review",
  "Accepted",
  "Implemented",
  "Rejected",
];

function PresidentSuggestions() {
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("president_token");

  const fetchSuggestions = async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        navigate("/president/login");
        return;
      }

      const response = await fetch(`${API_URL}/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("president_token");
        navigate("/president/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load suggestions.");
      }

      const data = await response.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const updateStatus = async (suggestionId, status) => {
    setUpdatingId(suggestionId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/${suggestionId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Unable to update suggestion status.");
      }

      await fetchSuggestions();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteSuggestion = async (suggestionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this suggestion?"
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/${suggestionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to delete suggestion.");
      }

      setSuggestions((previous) =>
        previous.filter((item) => item.id !== suggestionId)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusClass = (status) => {
    return (status || "Pending")
      .toLowerCase()
      .replaceAll(" ", "-");
  };

  const pendingCount = suggestions.filter(
    (item) => item.status === "Pending"
  ).length;

  const implementedCount = suggestions.filter(
    (item) => item.status === "Implemented"
  ).length;

  return (
    <div className="president-suggestions-page">
      <header className="suggestions-header">
        <button
          className="suggestions-back-button"
          onClick={() => navigate("/president/dashboard")}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="suggestions-header-title">
          <div className="suggestions-heading-icon">
            <Lightbulb size={25} />
          </div>
          <div>
            <h1>Village Suggestions</h1>
            <p>Manage suggestions submitted by Kotha Idara residents</p>
          </div>
        </div>

        <button
          className="suggestions-refresh-button"
          onClick={fetchSuggestions}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      <main className="president-suggestions-content">
        <section className="suggestions-summary">
          <div className="suggestion-summary-card">
            <Lightbulb size={23} />
            <div>
              <span>Total Suggestions</span>
              <strong>{suggestions.length}</strong>
            </div>
          </div>

          <div className="suggestion-summary-card">
            <Clock size={23} />
            <div>
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </div>
          </div>

          <div className="suggestion-summary-card">
            <CheckCircle size={23} />
            <div>
              <span>Implemented</span>
              <strong>{implementedCount}</strong>
            </div>
          </div>
        </section>

        {error && (
          <div className="suggestions-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="suggestions-list-section">
          <div className="suggestions-list-heading">
            <div>
              <h2>All Suggestions</h2>
              <p>Review and update village development ideas.</p>
            </div>
            <span>{suggestions.length} records</span>
          </div>

          {loading ? (
            <div className="suggestions-message">
              Loading suggestions...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="suggestions-empty">
              <Lightbulb size={38} />
              <h3>No suggestions available</h3>
              <p>New suggestions from villagers will appear here.</p>
            </div>
          ) : (
            <div className="president-suggestions-list">
              {suggestions.map((item) => (
                <article
                  className="president-suggestion-card"
                  key={item.id}
                >
                  <div className="president-suggestion-top">
                    <div>
                      <span className="suggestion-category">
                        {item.category}
                      </span>
                      <h3>Suggestion #{item.id}</h3>
                    </div>

                    <button
                      className="suggestion-delete-button"
                      onClick={() => deleteSuggestion(item.id)}
                      title="Delete suggestion"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <p className="president-suggestion-description">
                    {item.description}
                  </p>

                  <div className="president-suggestion-bottom">
                    <span className="suggestion-date">
                      {formatDate(item.created_at)}
                    </span>

                    <div className="suggestion-status-control">
                      <span
                        className={`suggestion-status ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status || "Pending"}
                      </span>

                      <select
                        value={item.status || "Pending"}
                        disabled={updatingId === item.id}
                        onChange={(event) =>
                          updateStatus(item.id, event.target.value)
                        }
                        aria-label={`Update status for suggestion ${item.id}`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PresidentSuggestions;