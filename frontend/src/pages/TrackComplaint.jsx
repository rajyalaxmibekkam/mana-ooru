import { API_URL as API_ROOT } from "../config/api";

import { useState } from "react";
import {
  Search,
  FileText,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Globe,
  Loader2,
  History,
  ArrowRight,
} from "lucide-react";

import "./TrackComplaint.css";

const API_URL = `${API_ROOT}/public/track`;

const STATUS_STEPS = [
  "Submitted",
  "Under Review",
  "In Progress",
  "Resolved",
];

export default function TrackComplaint() {
  const [trackingId, setTrackingId] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");

  const isTe = language === "te";

  const text = {
    title: isTe ? "ఫిర్యాదు స్థితిని తెలుసుకోండి" : "Track Your Complaint",
    subtitle: isTe
      ? "మీ ట్రాకింగ్ ID నమోదు చేసి ఫిర్యాదు స్థితిని తెలుసుకోండి."
      : "Enter your tracking ID to check the latest complaint status.",
    placeholder: isTe ? "ట్రాకింగ్ ID నమోదు చేయండి" : "Enter your tracking ID",
    search: isTe ? "వెతకండి" : "Track Complaint",
    searching: isTe ? "వెతుకుతున్నాం..." : "Searching...",
    category: isTe ? "ఫిర్యాదు విభాగం" : "Complaint Category",
    tracking: isTe ? "ట్రాకింగ్ ID" : "Tracking ID",
    date: isTe ? "సమర్పించిన తేదీ" : "Submission Date",
    status: isTe ? "ప్రస్తుత స్థితి" : "Current Status",
    progress: isTe ? "ఫిర్యాదు పురోగతి" : "Complaint Progress",
    history: isTe ? "ఫిర్యాదు చరిత్ర" : "Complaint Status History",
    oldStatus: isTe ? "మునుపటి స్థితి" : "Previous Status",
    newStatus: isTe ? "కొత్త స్థితి" : "New Status",
    initialSubmission: isTe ? "ప్రారంభ సమర్పణ" : "Initial Submission",
    noHistory: isTe
      ? "ఇప్పటివరకు స్థితి మార్పుల చరిత్ర అందుబాటులో లేదు."
      : "No status history is available yet.",
    historyUnavailable: isTe
      ? "స్థితి చరిత్రను ప్రస్తుతం పొందలేకపోయాము."
      : "Status history is currently unavailable.",
    notFound: isTe
      ? "ఈ ట్రాకింగ్ IDతో ఫిర్యాదు కనుగొనబడలేదు."
      : "No complaint found with this tracking ID.",
    genericError: isTe
      ? "ఫిర్యాదు వివరాలను పొందలేకపోయాము. మళ్లీ ప్రయత్నించండి."
      : "Unable to retrieve complaint details. Please try again.",
    invalid: isTe
      ? "దయచేసి సరైన ట్రాకింగ్ ID నమోదు చేయండి."
      : "Please enter a valid tracking ID.",
    privacy: isTe
      ? "మీ గోప్యత కోసం ఫిర్యాదు వివరణ, చిరునామా మరియు ఫోటోలు ఇక్కడ చూపించబడవు."
      : "For privacy, complaint descriptions, addresses and photos are not displayed here.",
    noResult: isTe
      ? "మీ ఫిర్యాదు వివరాలు ఇక్కడ కనిపిస్తాయి."
      : "Your complaint details will appear here.",
    rejected: isTe ? "తిరస్కరించబడింది" : "Rejected",
    steps: isTe
      ? ["సమర్పించారు", "పరిశీలనలో", "పురోగతిలో", "పరిష్కరించారు"]
      : STATUS_STEPS,
  };

  const categoryNames = {
    "Drinking Water": "తాగునీరు",
    Roads: "రోడ్లు",
    "Roads and Transport": "రోడ్లు మరియు రవాణా",
    Streetlights: "వీధి దీపాలు",
    Sanitation: "పారిశుధ్యం",
    Drainage: "డ్రైనేజీ",
    Electricity: "విద్యుత్",
    "Government Schemes": "ప్రభుత్వ పథకాలు",
    Other: "ఇతరాలు",
  };

  const getCategoryLabel = (category) => {
    if (!isTe) return category;
    return categoryNames[category] || category;
  };

  const getStatusLabel = (status) => {
    if (!status) return "—";

    if (isTe) {
      const translations = {
        Submitted: "సమర్పించారు",
        "Under Review": "పరిశీలనలో",
        "In Progress": "పురోగతిలో",
        Resolved: "పరిష్కరించారు",
        Rejected: "తిరస్కరించబడింది",
      };

      return translations[status] || status;
    }

    return status;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString(isTe ? "te-IN" : "en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleTrack = async (event) => {
    event.preventDefault();

    const cleanId = trackingId.trim();

    if (!cleanId) {
      setError(text.invalid);
      setComplaint(null);
      setHistory([]);
      return;
    }

    setLoading(true);
    setError("");
    setComplaint(null);
    setHistory([]);
    setHistoryError(false);

    try {
      // Fetch current complaint details.
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(cleanId)}`
      );

      if (response.status === 404) {
        throw new Error("NOT_FOUND");
      }

      if (!response.ok) {
        throw new Error("REQUEST_FAILED");
      }

      const result = await response.json();

      setComplaint(result);

      // Fetch complaint status history separately.
      try {
        const historyResponse = await fetch(
          `${API_URL}/${encodeURIComponent(cleanId)}/history`
        );

        if (!historyResponse.ok) {
          throw new Error("HISTORY_FAILED");
        }

        const historyResult = await historyResponse.json();

        setHistory(
          Array.isArray(historyResult.history)
            ? historyResult.history
            : []
        );
      } catch {
        // Keep complaint details visible even if history fails.
        setHistoryError(true);
      }
    } catch (err) {
      if (err.message === "NOT_FOUND") {
        setError(text.notFound);
      } else {
        setError(text.genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStep = complaint
    ? STATUS_STEPS.indexOf(complaint.status)
    : -1;

  const isRejected = complaint?.status === "Rejected";

  return (
    <main className="track-page">
      <div className="track-container">

        {/* Page Header */}
        <header className="track-header">
          <div className="track-header-icon">
            <FileText size={30} />
          </div>

          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>

          <button
            type="button"
            className="track-language-button"
            onClick={() =>
              setLanguage((previous) =>
                previous === "en" ? "te" : "en"
              )
            }
          >
            <Globe size={17} />
            {isTe ? "English" : "తెలుగు"}
          </button>
        </header>

        {/* Search Section */}
        <section className="track-search-card">
          <form onSubmit={handleTrack}>
            <label htmlFor="trackingId">
              {text.tracking}
            </label>

            <div className="track-input-row">
              <input
                id="trackingId"
                type="text"
                value={trackingId}
                onChange={(event) =>
                  setTrackingId(event.target.value)
                }
                placeholder={text.placeholder}
                maxLength={100}
                autoComplete="off"
              />

              <button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2
                    className="track-spinner"
                    size={19}
                  />
                ) : (
                  <Search size={19} />
                )}

                {loading ? text.searching : text.search}
              </button>
            </div>
          </form>

          {error && (
            <div className="track-error" role="alert">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Complaint Result */}
        {complaint && (
          <section className="track-result-card">

            {/* Complaint Header */}
            <div className="track-result-heading">
              <div>
                <span className="track-result-eyebrow">
                  {text.tracking}
                </span>

                <h2>{complaint.tracking_id}</h2>
              </div>

              <span
                className={`track-status-badge ${
                  isRejected ? "track-status-rejected" : ""
                }`}
              >
                {isRejected ? (
                  <XCircle size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}

                {getStatusLabel(complaint.status)}
              </span>
            </div>

            {/* Complaint Information */}
            <div className="track-details-grid">
              <div className="track-detail">
                <FileText size={20} />

                <div>
                  <span>{text.category}</span>
                  <strong>
                    {getCategoryLabel(complaint.category)}
                  </strong>
                </div>
              </div>

              <div className="track-detail">
                <CalendarDays size={20} />

                <div>
                  <span>{text.date}</span>
                  <strong>
                    {formatDate(complaint.created_at)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Current Progress */}
            <div className="track-progress-section">
              <h3>{text.progress}</h3>

              {isRejected ? (
                <div className="track-rejected-message">
                  <XCircle size={24} />

                  <div>
                    <strong>{text.rejected}</strong>
                    <p>{getStatusLabel(complaint.status)}</p>
                  </div>
                </div>
              ) : (
                <div className="track-timeline">
                  {STATUS_STEPS.map((step, index) => {
                    const completed = currentStep >= index;
                    const active = currentStep === index;

                    return (
                      <div
                        className={`track-timeline-step ${
                          completed ? "completed" : ""
                        } ${active ? "active" : ""}`}
                        key={step}
                      >
                        <div className="track-timeline-marker">
                          {completed ? (
                            <CheckCircle2 size={21} />
                          ) : (
                            <Clock size={20} />
                          )}
                        </div>

                        <span>{text.steps[index]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Full Status History */}
            <div className="track-history-section">
              <div className="track-history-heading">
                <History size={22} />
                <h3>{text.history}</h3>
              </div>

              {historyError ? (
                <div className="track-history-message">
                  <AlertCircle size={19} />
                  <span>{text.historyUnavailable}</span>
                </div>
              ) : history.length === 0 ? (
                <div className="track-history-message">
                  <Clock size={19} />
                  <span>{text.noHistory}</span>
                </div>
              ) : (
                <div className="track-history-list">
                  {history.map((item, index) => {
                    const isInitial = !item.old_status;

                    return (
                      <article
                        className="track-history-item"
                        key={`${item.changed_at}-${index}`}
                      >
                        <div className="track-history-indicator">
                          <div className="track-history-dot">
                            <CheckCircle2 size={18} />
                          </div>

                          {index !== history.length - 1 && (
                            <div className="track-history-line" />
                          )}
                        </div>

                        <div className="track-history-content">
                          <div className="track-history-top">
                            <strong>
                              {isInitial
                                ? text.initialSubmission
                                : getStatusLabel(item.new_status)}
                            </strong>

                            <span>
                              {formatDate(item.changed_at)}
                            </span>
                          </div>

                          {isInitial ? (
                            <div className="track-history-status">
                              <span>
                                {getStatusLabel(item.new_status)}
                              </span>
                            </div>
                          ) : (
                            <div className="track-history-status">
                              <span>
                                {getStatusLabel(item.old_status)}
                              </span>

                              <ArrowRight size={15} />

                              <span className="track-history-new-status">
                                {getStatusLabel(item.new_status)}
                              </span>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Privacy Notice */}
            <p className="track-privacy-note">
              {text.privacy}
            </p>
          </section>
        )}

        {/* Empty State */}
        {!complaint && !loading && !error && (
          <div className="track-empty-state">
            <Search size={34} />
            <p>{text.noResult}</p>
          </div>
        )}
      </div>
    </main>
  );
}
