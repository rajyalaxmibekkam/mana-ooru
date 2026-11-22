import { API_URL as API_ROOT } from "../config/api";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Megaphone,
  Eye,
  EyeOff,
  RefreshCw,
  X
} from "lucide-react";

import "./ManageAnnouncements.css";

const API_URL = `${API_ROOT}/announcements`;

const categories = [
  "General",
  "Water Supply",
  "Electricity",
  "Village Meeting",
  "Road Work",
  "Government Schemes",
  "Other"
];

function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "General",
    is_published: true
  });

  const token = localStorage.getItem("president_token");

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const loadAnnouncements = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/admin`, {
        headers: authHeaders
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Your login session is invalid or expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error("Unable to load announcements.");
      }

      const data = await response.json();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      category: "General",
      is_published: true
    });

    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const url = editingId
      ? `${API_URL}/${editingId}`
      : `${API_URL}/`;

    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Your login session has expired. Please log in again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to save announcement.");
      }

      setMessage(
        editingId
          ? "Announcement updated successfully."
          : "Announcement created successfully."
      );

      resetForm();
      await loadAnnouncements();

    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);

    setForm({
      title: item.title,
      content: item.content,
      category: item.category,
      is_published: item.is_published
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const deleteAnnouncement = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: authHeaders
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Your login session has expired. Please log in again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to delete announcement.");
      }

      setMessage("Announcement deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadAnnouncements();

    } catch (err) {
      setError(err.message);
    }
  };

  const togglePublish = async (item) => {
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/${item.id}`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          is_published: !item.is_published
        })
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error("Your login session has expired. Please log in again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to change publication status.");
      }

      setMessage(
        item.is_published
          ? "Announcement unpublished."
          : "Announcement published."
      );

      await loadAnnouncements();

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="manage-announcements-page">

      <header className="manage-announcements-header">
        <Link to="/president/dashboard" className="manage-back-link">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="manage-brand">
          <Megaphone size={25} />
          <div>
            <h2>Mana Ooru</h2>
            <p>Announcement Management</p>
          </div>
        </div>
      </header>

      <main className="manage-announcements-container">

        <div className="manage-page-heading">
          <div>
            <h1>Village Announcements</h1>
            <p>Create and manage important village notices.</p>
          </div>

          <button
            className="manage-refresh-btn"
            onClick={loadAnnouncements}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="manage-alert error">
            {error}
          </div>
        )}

        {message && (
          <div className="manage-alert success">
            {message}
          </div>
        )}

        <section className="announcement-form-card">

          <div className="manage-form-heading">
            <h2>
              {editingId ? "Edit Announcement" : "Create Announcement"}
            </h2>

            {editingId && (
              <button
                type="button"
                className="manage-cancel-btn"
                onClick={resetForm}
              >
                <X size={17} />
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>

            <label htmlFor="announcement-title">
              Announcement Title
            </label>

            <input
              id="announcement-title"
              type="text"
              name="title"
              placeholder="Enter announcement title"
              value={form.title}
              onChange={handleChange}
              minLength={3}
              maxLength={200}
              required
            />

            <label htmlFor="announcement-category">
              Category
            </label>

            <select
              id="announcement-category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <label htmlFor="announcement-content">
              Announcement Details
            </label>

            <textarea
              id="announcement-content"
              name="content"
              placeholder="Write the announcement details..."
              value={form.content}
              onChange={handleChange}
              minLength={5}
              rows={5}
              required
            />

            <label className="publish-checkbox">
              <input
                type="checkbox"
                name="is_published"
                checked={form.is_published}
                onChange={handleChange}
              />

              Publish immediately
            </label>

            <button type="submit" className="manage-submit-btn">
              <Plus size={18} />
              {editingId ? "Update Announcement" : "Create Announcement"}
            </button>

          </form>
        </section>

        <section className="manage-announcement-list">

          <div className="manage-list-heading">
            <h2>All Announcements</h2>
            <span>{announcements.length} total</span>
          </div>

          {loading && (
            <p className="manage-loading">Loading announcements...</p>
          )}

          {!loading && !error && announcements.length === 0 && (
            <div className="manage-empty">
              <Megaphone size={35} />
              <h3>No announcements found</h3>
              <p>Create your first village announcement above.</p>
            </div>
          )}

          {!loading && announcements.map((item) => (
            <article className="manage-announcement-card" key={item.id}>

              <div className="manage-announcement-info">

                <div className="manage-announcement-meta">
                  <span className="manage-category">
                    {item.category}
                  </span>

                  <span className={
                    item.is_published
                      ? "published-status"
                      : "unpublished-status"
                  }>
                    {item.is_published ? "Published" : "Unpublished"}
                  </span>
                </div>

                <h3>{item.title}</h3>
                <p>{item.content}</p>

                <small>
                  Created: {new Date(item.created_at).toLocaleString("en-IN")}
                </small>

              </div>

              <div className="manage-announcement-actions">

                <button
                  onClick={() => togglePublish(item)}
                  className="manage-action-btn"
                  title={item.is_published ? "Unpublish" : "Publish"}
                >
                  {item.is_published ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                  {item.is_published ? "Unpublish" : "Publish"}
                </button>

                <button
                  onClick={() => startEditing(item)}
                  className="manage-action-btn edit"
                >
                  <Edit size={17} />
                  Edit
                </button>

                <button
                  onClick={() => deleteAnnouncement(item.id)}
                  className="manage-action-btn delete"
                >
                  <Trash2 size={17} />
                  Delete
                </button>

              </div>

            </article>
          ))}

        </section>

      </main>
    </div>
  );
}

export default ManageAnnouncements;
