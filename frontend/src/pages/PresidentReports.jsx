import { API_URL as API_ROOT } from "../config/api";

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  Vote,
  BarChart3,
  CalendarDays,
  AlertCircle
} from "lucide-react";

import "./PresidentReports.css";

const API_URL = API_ROOT;

function PresidentReports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("president_token");

  const fetchReports = async (isRefresh = false) => {
    if (!token) {
      navigate("/president/login");
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(`${API_URL}/reports/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("president_token");
        navigate("/president/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load reports. Please try again.");
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // Load reports when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const complaintCards = useMemo(() => {
    if (!reports) return [];

    const data = reports.complaints || {};

    return [
      {
        title: "Total Complaints",
        value: data.total ?? 0,
        icon: FileText,
        color: "blue"
      },
      {
        title: "Pending",
        value: data.pending ?? 0,
        icon: Clock,
        color: "orange"
      },
      {
        title: "In Progress",
        value: data.in_progress ?? 0,
        icon: Activity,
        color: "purple"
      },
      {
        title: "Resolved",
        value: data.resolved ?? 0,
        icon: CheckCircle,
        color: "green"
      },
      {
        title: "Rejected",
        value: data.rejected ?? 0,
        icon: XCircle,
        color: "red"
      }
    ];
  }, [reports]);

  const categoryStatistics = reports?.category_statistics || [];
  const monthlyStatistics = reports?.monthly_statistics || [];
  const pollStatistics = reports?.polls || {};

  const maximumCategoryCount = Math.max(
    1,
    ...categoryStatistics.map((item) => Number(item.count) || 0)
  );

  const maximumMonthlyCount = Math.max(
    1,
    ...monthlyStatistics.map((item) => Number(item.count) || 0)
  );

  const formatMonth = (month) => {
    if (!month) return "Unknown";

    const [year, monthNumber] = month.split("-");
    const date = new Date(Number(year), Number(monthNumber) - 1);

    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <RefreshCw className="spin" size={30} />
          <p>Loading village reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">

      <header className="reports-header">
        <div>
          <Link to="/president/dashboard" className="reports-back">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>

          <h1>
            <BarChart3 size={28} />
            Village Reports & Analytics
          </h1>

          <p>
            Kotha Idara Village – Complaint and Poll Statistics
          </p>
        </div>

        <button
          className="reports-refresh"
          onClick={() => fetchReports(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh Reports"}
        </button>
      </header>

      {error && (
        <div className="reports-error">
          <AlertCircle size={19} />
          <span>{error}</span>
          <button onClick={() => fetchReports()}>
            Retry
          </button>
        </div>
      )}

      {reports && (
        <>
          <section className="reports-section">
            <div className="reports-section-heading">
              <div>
                <h2>Complaint Overview</h2>
                <p>Current status of village complaints</p>
              </div>
            </div>

            <div className="reports-stat-grid">
              {complaintCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    className="reports-stat-card"
                    key={card.title}
                  >
                    <div className={`reports-stat-icon ${card.color}`}>
                      <Icon size={23} />
                    </div>

                    <div>
                      <p>{card.title}</p>
                      <h3>{card.value}</h3>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-section-heading">
              <div>
                <h2>Category-wise Complaints</h2>
                <p>Number of complaints received in each category</p>
              </div>
            </div>

            <div className="reports-chart-card">
              {categoryStatistics.length === 0 ? (
                <p className="reports-empty">
                  No category data available yet.
                </p>
              ) : (
                categoryStatistics.map((item) => {
                  const count = Number(item.count) || 0;
                  const percentage =
                    (count / maximumCategoryCount) * 100;

                  return (
                    <div
                      className="category-bar-row"
                      key={item.category}
                    >
                      <div className="category-bar-label">
                        <span>{item.category || "Other"}</span>
                        <strong>{count}</strong>
                      </div>

                      <div className="category-bar-track">
                        <div
                          className="category-bar-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-section-heading">
              <div>
                <h2>
                  <CalendarDays size={22} />
                  Monthly Complaint Trends
                </h2>
                <p>Complaint totals during the last six months</p>
              </div>
            </div>

            <div className="reports-chart-card monthly-chart">
              {monthlyStatistics.length === 0 ? (
                <p className="reports-empty">
                  No monthly complaint data available yet.
                </p>
              ) : (
                monthlyStatistics.map((item) => {
                  const count = Number(item.count) || 0;
                  const percentage =
                    (count / maximumMonthlyCount) * 100;

                  return (
                    <div
                      className="monthly-bar-item"
                      key={item.month}
                    >
                      <strong>{count}</strong>

                      <div className="monthly-bar-track">
                        <div
                          className="monthly-bar-fill"
                          style={{ height: `${percentage}%` }}
                        />
                      </div>

                      <span>{formatMonth(item.month)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-section-heading">
              <div>
                <h2>
                  <Vote size={22} />
                  Village Poll Statistics
                </h2>
                <p>Participation in village development polls</p>
              </div>
            </div>

            <div className="reports-stat-grid poll-stat-grid">
              <article className="reports-stat-card">
                <div className="reports-stat-icon blue">
                  <Vote size={23} />
                </div>
                <div>
                  <p>Total Polls</p>
                  <h3>{pollStatistics.total ?? 0}</h3>
                </div>
              </article>

              <article className="reports-stat-card">
                <div className="reports-stat-icon green">
                  <CheckCircle size={23} />
                </div>
                <div>
                  <p>Published Polls</p>
                  <h3>{pollStatistics.published ?? 0}</h3>
                </div>
              </article>

              <article className="reports-stat-card">
                <div className="reports-stat-icon orange">
                  <Activity size={23} />
                </div>
                <div>
                  <p>Active Polls</p>
                  <h3>{pollStatistics.active ?? 0}</h3>
                </div>
              </article>

              <article className="reports-stat-card">
                <div className="reports-stat-icon purple">
                  <BarChart3 size={23} />
                </div>
                <div>
                  <p>Total Votes</p>
                  <h3>{pollStatistics.total_votes ?? 0}</h3>
                </div>
              </article>
            </div>
          </section>

          <footer className="reports-footer">
            <p>
              Mana Ooru – Kotha Idara Village Digital Grievance Portal
            </p>

            {reports.generated_at && (
              <small>
                Report generated:{" "}
                {new Date(reports.generated_at).toLocaleString("en-IN")}
              </small>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

export default PresidentReports;
