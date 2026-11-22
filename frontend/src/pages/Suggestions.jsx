import { API_BASE_URL } from "../config/api";

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Lightbulb,
  Send,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

import "./Suggestions.css";

const API_URL = API_BASE_URL;

const CATEGORIES = [
  "Village Development",
  "Drinking Water",
  "Roads and Transport",
  "Streetlights",
  "Sanitation",
  "Education",
  "Healthcare",
  "Agriculture",
  "Government Schemes",
  "Other"
];

function Suggestions() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess(null);

    if (!category) {
      setError("Please select a suggestion category.");
      return;
    }

    if (description.trim().length < 5) {
      setError("Please enter at least 5 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/suggestions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category,
          description: description.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to submit your suggestion."
        );
      }

      setSuccess(data);
      setCategory("");
      setDescription("");

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the server. Please try again later."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="suggestions-page">

      <header className="suggestions-header">

        <Link to="/" className="suggestions-back">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="suggestions-brand">
          <Lightbulb size={25} />
          <span>Mana Ooru</span>
        </div>

      </header>

      <main className="suggestions-container">

        <section className="suggestions-intro">

          <div className="suggestions-icon">
            <Lightbulb size={34} />
          </div>

          <span className="suggestions-eyebrow">
            YOUR VOICE MATTERS
          </span>

          <h1>
            Village Suggestions
          </h1>

          <h2>
            గ్రామ అభివృద్ధికి మీ సలహాలు
          </h2>

          <p>
            Share your ideas and suggestions to improve
            Kotha Idara village. Every suggestion can
            contribute to a better community.
          </p>

        </section>

        {success ? (

          <section className="suggestion-success">

            <CheckCircle size={55} />

            <h2>Suggestion Submitted!</h2>

            <p>
              Thank you for contributing to village development.
            </p>

            <div className="suggestion-id-box">
              <span>Your Suggestion ID</span>

              <strong>
                #{success.id}
              </strong>
            </div>

            <p className="suggestion-status">
              Status: {success.status}
            </p>

            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="suggestion-another-btn"
            >
              Submit Another Suggestion
            </button>

          </section>

        ) : (

          <section className="suggestion-form-card">

            <div className="suggestion-form-heading">
              <h2>Share Your Suggestion</h2>

              <p>
                మీ విలువైన సలహాను మాతో పంచుకోండి.
              </p>
            </div>

            {error && (
              <div className="suggestion-error" role="alert">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="suggestion-field">

                <label htmlFor="suggestion-category">
                  Suggestion Category
                </label>

                <select
                  id="suggestion-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="">
                    Select a category
                  </option>

                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}

                </select>

              </div>

              <div className="suggestion-field">

                <label htmlFor="suggestion-description">
                  Your Suggestion
                </label>

                <textarea
                  id="suggestion-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write your suggestion in Telugu or English..."
                  rows={7}
                  maxLength={3000}
                  required
                />

                <small>
                  {description.length}/3000 characters
                </small>

              </div>

              <div className="suggestion-privacy">
                <Lightbulb size={17} />

                <p>
                  No name, phone number or email is required.
                  Avoid including personal information in your suggestion.
                </p>
              </div>

              <button
                type="submit"
                className="suggestion-submit-btn"
                disabled={loading}
              >
                <Send size={18} />

                {loading
                  ? "Submitting..."
                  : "Submit Suggestion"}
              </button>

            </form>

          </section>

        )}

      </main>

      <footer className="suggestions-footer">
        Mana Ooru – Kotha Idara Village Digital Grievance Portal
      </footer>

    </div>
  );
}

export default Suggestions;
