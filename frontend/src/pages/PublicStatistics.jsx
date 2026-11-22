import { API_URL as API_ROOT } from "../config/api";

import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
  RefreshCw,
  AlertCircle,
  Globe,
  Loader2,
  XCircle,
} from "lucide-react";
import "./PublicStatistics.css";

const API_URL = `${API_ROOT}/public/statistics`;

export default function PublicStatistics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");

  const isTe = language === "te";

  const labels = {
    title: isTe ? "గ్రామ గణాంకాలు" : "Village Statistics",
    subtitle: isTe
      ? "మన కొత్త ఇదర గ్రామ అభివృద్ధి మరియు ఫిర్యాదుల వివరాలు"
      : "Complaint progress and development overview of Kotha Idara",
    total: isTe ? "మొత్తం ఫిర్యాదులు" : "Total Complaints",
    submitted: isTe ? "సమర్పించినవి" : "Submitted",
    review: isTe ? "పరిశీలనలో" : "Under Review",
    progress: isTe ? "పురోగతిలో" : "In Progress",
    resolved: isTe ? "పరిష్కరించినవి" : "Resolved",
    rejected: isTe ? "తిరస్కరించినవి" : "Rejected",
    categories: isTe ? "విభాగాల వారీగా ఫిర్యాదులు" : "Complaints by Category",
    refresh: isTe ? "రిఫ్రెష్ చేయండి" : "Refresh",
    loading: isTe ? "గణాంకాలు లోడ్ అవుతున్నాయి..." : "Loading statistics...",
    error: isTe ? "గణాంకాలను పొందలేకపోయాము." : "Unable to load statistics.",
    empty: isTe ? "ఇంకా ఫిర్యాదులు లేవు." : "No complaints recorded yet.",
    updated: isTe ? "తాజా వివరాలు" : "Latest available statistics",
    privacy: isTe
      ? "ప్రజల గోప్యత కోసం వ్యక్తిగత ఫిర్యాదు వివరాలు ఇక్కడ చూపించబడవు."
      : "Individual complaint details are not displayed here to protect residents' privacy.",
  };

  const categoryNames = {
    "Drinking Water": isTe ? "తాగునీరు" : "Drinking Water",
    Roads: isTe ? "రోడ్లు" : "Roads",
    "Roads and Transport": isTe ? "రోడ్లు మరియు రవాణా" : "Roads and Transport",
    Streetlights: isTe ? "వీధి దీపాలు" : "Streetlights",
    Sanitation: isTe ? "పారిశుధ్యం" : "Sanitation",
    Drainage: isTe ? "డ్రైనేజీ" : "Drainage",
    Electricity: isTe ? "విద్యుత్" : "Electricity",
    "Government Schemes": isTe ? "ప్రభుత్వ పథకాలు" : "Government Schemes",
    Other: isTe ? "ఇతరాలు" : "Other",
  };

  const fetchStatistics = async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Statistics request failed");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(labels.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const status = data?.status_statistics || {};

  const total = data?.total_complaints || 0;

  const cards = [
    {
      label: labels.total,
      value: total,
      icon: FileText,
      className: "stats-total",
    },
    {
      label: labels.submitted,
      value: status.submitted || 0,
      icon: AlertCircle,
      className: "stats-submitted",
    },
    {
      label: labels.review,
      value: status.under_review || 0,
      icon: Clock,
      className: "stats-review",
    },
    {
      label: labels.progress,
      value: status.in_progress || 0,
      icon: BarChart3,
      className: "stats-progress",
    },
    {
      label: labels.resolved,
      value: status.resolved || 0,
      icon: CheckCircle,
      className: "stats-resolved",
    },
    {
      label: labels.rejected,
      value: status.rejected || 0,
      icon: XCircle,
      className: "stats-rejected",
    },
  ];

  return (
    <main className="public-stats-page">
      <section className="public-stats-container">
        <header className="public-stats-header">
          <div>
            <p className="public-stats-village">
              {data?.village || "Kotha Idara"}
            </p>
            <h1>{labels.title}</h1>
            <p className="public-stats-subtitle">{labels.subtitle}</p>
          </div>

          <div className="public-stats-actions">
            <button
              type="button"
              className="stats-language-button"
              onClick={() =>
                setLanguage((previous) =>
                  previous === "en" ? "te" : "en"
                )
              }
            >
              <Globe size={18} />
              {isTe ? "English" : "తెలుగు"}
            </button>

            <button
              type="button"
              className="stats-refresh-button"
              onClick={() => fetchStatistics(true)}
              disabled={loading || refreshing}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "stats-spinning" : ""}
              />
              {labels.refresh}
            </button>
          </div>
        </header>

        {loading && (
          <div className="stats-message">
            <Loader2 className="stats-spinning" size={25} />
            <p>{labels.loading}</p>
          </div>
        )}

        {!loading && error && (
          <div className="stats-error">
            <AlertCircle size={22} />
            <p>{error}</p>
            <button onClick={() => fetchStatistics()}>
              {labels.refresh}
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <section className="stats-card-grid">
              {cards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    className={`stats-card ${card.className}`}
                    key={card.className}
                  >
                    <div className="stats-card-icon">
                      <Icon size={23} />
                    </div>

                    <div>
                      <p>{card.label}</p>
                      <h2>{card.value.toLocaleString("en-IN")}</h2>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="stats-category-section">
              <div className="stats-section-heading">
                <div>
                  <h2>{labels.categories}</h2>
                  <p>{labels.updated}</p>
                </div>
                <BarChart3 size={25} />
              </div>

              {data.category_statistics?.length > 0 ? (
                <div className="stats-category-list">
                  {data.category_statistics.map((item, index) => {
                    const percentage =
                      total > 0
                        ? Math.min((item.count / total) * 100, 100)
                        : 0;

                    return (
                      <div
                        className="stats-category-item"
                        key={`${item.category}-${index}`}
                      >
                        <div className="stats-category-info">
                          <span>
                            {categoryNames[item.category] || item.category}
                          </span>
                          <strong>{item.count}</strong>
                        </div>

                        <div className="stats-progress-track">
                          <div
                            className="stats-progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="stats-empty">{labels.empty}</p>
              )}
            </section>

            <p className="stats-privacy-note">{labels.privacy}</p>
          </>
        )}
      </section>
    </main>
  );
}
