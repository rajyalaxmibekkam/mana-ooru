import { API_URL as API_ROOT } from "../config/api";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  RefreshCw,
  Megaphone
} from "lucide-react";

import "./Announcements.css";

const API_URL = `${API_ROOT}/announcements/`;

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load announcements.");
      }

      const data = await response.json();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="announcements-page">
      <header className="announcements-header">
        <Link to="/" className="announcement-back">
          <ArrowLeft size={19} />
          Back to Home
        </Link>

        <div className="announcement-brand">
          <span className="announcement-brand-icon">
            <Megaphone size={25} />
          </span>
          <div>
            <h2>Mana Ooru</h2>
            <p>Kotha Idara Village Portal</p>
          </div>
        </div>
      </header>

      <main className="announcements-container">
        <section className="announcements-heading">
          <div className="announcements-heading-icon">
            <Bell size={28} />
          </div>

          <h1>Village Announcements</h1>

          <p>
            Stay updated with the latest news, notices and important
            information from Kotha Idara village.
          </p>

          <button
            className="announcement-refresh"
            onClick={fetchAnnouncements}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </section>

        {loading && (
          <div className="announcement-message">
            Loading announcements...
          </div>
        )}

        {error && (
          <div className="announcement-error">
            {error}
            <button onClick={fetchAnnouncements}>Try Again</button>
          </div>
        )}

        {!loading && !error && announcements.length === 0 && (
          <div className="announcement-empty">
            <Bell size={38} />
            <h3>No announcements yet</h3>
            <p>New village announcements will appear here.</p>
          </div>
        )}

        {!loading && !error && announcements.length > 0 && (
          <section className="announcement-list">
            {announcements.map((item) => (
              <article className="announcement-card" key={item.id}>
                <div className="announcement-card-top">
                  <span className="announcement-category">
                    {item.category}
                  </span>

                  <span className="announcement-date">
                    <CalendarDays size={15} />
                    {formatDate(item.created_at)}
                  </span>
                </div>

                <h2>{item.title}</h2>
                <p className="announcement-content">{item.content}</p>
              </article>
            ))}
          </section>
        )}
      </main>

      <footer className="announcements-footer">
        Mana Ooru – Kotha Idara Village Digital Portal
      </footer>
    </div>
  );
}

export default Announcements;
