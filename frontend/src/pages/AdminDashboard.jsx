
import { API_BASE_URL } from "../config/api";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Eye,
  X,
  Megaphone,
  Lightbulb,
  Vote,
  BarChart3
} from "lucide-react";

import "./Admin.css";

const API_URL = API_BASE_URL;

const STATUSES = [
  "Submitted",
  "Under Review",
  "In Progress",
  "Resolved",
  "Rejected"
];

function AdminDashboard() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Private complaint photo state
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const token = localStorage.getItem("president_token");

  const logout = useCallback(() => {
    localStorage.removeItem("president_token");
    navigate("/president/login", { replace: true });
  }, [navigate]);

  const loadDashboard = useCallback(async () => {
    if (!token) {
      logout();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const headers = {
        Authorization: `Bearer ${token}`
      };

      const [adminResponse, complaintsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/me`, { headers }),
        fetch(`${API_URL}/api/admin/complaints`, { headers })
      ]);

      if (
        adminResponse.status === 401 ||
        adminResponse.status === 403 ||
        complaintsResponse.status === 401 ||
        complaintsResponse.status === 403
      ) {
        logout();
        return;
      }

      if (!adminResponse.ok) {
        throw new Error("Unable to verify administrator account.");
      }

      if (!complaintsResponse.ok) {
        throw new Error("Unable to load complaints.");
      }

      const adminData = await adminResponse.json();
      const complaintData = await complaintsResponse.json();

      setAdmin(adminData);

      const complaintList = Array.isArray(complaintData)
        ? complaintData
        : complaintData.complaints || complaintData.items || [];

      setComplaints(complaintList);

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Make sure FastAPI is running."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Load complaint photos through the authenticated API.
  useEffect(() => {
    let objectUrl = "";
    const controller = new AbortController();

    const loadPrivatePhoto = async () => {
      if (
        !selectedComplaint?.has_photo ||
        !selectedComplaint?.tracking_id
      ) {
        setPhotoUrl("");
        setPhotoLoading(false);
        setPhotoError("");
        return;
      }

      setPhotoUrl("");
      setPhotoLoading(true);
      setPhotoError("");

      try {
        const response = await fetch(
          `${API_URL}/api/admin/complaints/${encodeURIComponent(
            selectedComplaint.tracking_id
          )}/photo`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }
        );

        if (response.status === 401 || response.status === 403) {
          logout();
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load complaint photo.");
        }

        const imageBlob = await response.blob();

        if (!imageBlob.type.startsWith("image/")) {
          throw new Error("The server returned an invalid image.");
        }

        objectUrl = URL.createObjectURL(imageBlob);
        setPhotoUrl(objectUrl);

      } catch (err) {
        if (err.name !== "AbortError") {
          setPhotoError(
            err.message || "Unable to load complaint photo."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setPhotoLoading(false);
        }
      }
    };

    loadPrivatePhoto();

    return () => {
      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    selectedComplaint?.tracking_id,
    selectedComplaint?.has_photo,
    token,
    logout
  ]);

  const stats = useMemo(() => ({
    total: complaints.length,
    submitted: complaints.filter(
      item => item.status === "Submitted"
    ).length,
    progress: complaints.filter(
      item => item.status === "In Progress"
    ).length,
    resolved: complaints.filter(
      item => item.status === "Resolved"
    ).length
  }), [complaints]);

  const categories = useMemo(() => [
    "All",
    ...new Set(
      complaints.map(item => item.category).filter(Boolean)
    )
  ], [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(item => {
      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      const searchText = search.toLowerCase();

      const matchesSearch = [
        item.tracking_id,
        item.category,
        item.description,
        item.location
      ].some(value =>
        String(value || "").toLowerCase().includes(searchText)
      );

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [complaints, statusFilter, categoryFilter, search]);

  const updateStatus = async (trackingId, newStatus) => {
    setUpdatingId(trackingId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/complaints/${encodeURIComponent(trackingId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.detail || "Could not update complaint status."
        );
      }

      setComplaints(previous =>
        previous.map(item =>
          item.tracking_id === trackingId
            ? { ...item, status: newStatus }
            : item
        )
      );

      setSelectedComplaint(previous =>
        previous?.tracking_id === trackingId
          ? { ...previous, status: newStatus }
          : previous
      );

    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId("");
    }
  };

  const viewComplaintDetails = async (trackingId) => {
    setDetailsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/complaints/${encodeURIComponent(trackingId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.status === 401 || response.status === 403) {
        logout();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.detail || "Unable to load complaint details."
        );
      }

      const data = await response.json();
      setSelectedComplaint(data);

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend."
          : err.message
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeComplaintDetails = () => {
    setSelectedComplaint(null);
    setPhotoUrl("");
    setPhotoError("");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <RefreshCw className="spin" size={30} />
        <p>Loading President Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      <header className="dashboard-header">

        <div className="dashboard-brand">
          <div className="dashboard-brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h2>Mana Ooru</h2>
            <p>Kotha Idara Administration</p>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <span className="admin-welcome">
            Welcome, {admin?.username || "President"}
          </span>

          <button
            className="dashboard-logout"
            onClick={logout}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>

      </header>

      <main className="dashboard-main">

        <div className="dashboard-title-row">

          <div>
            <span className="dashboard-eyebrow">
              VILLAGE ADMINISTRATION
            </span>

            <h1>President Dashboard</h1>

            <p>
              Manage and monitor complaints from Kotha Idara villagers.
            </p>
          </div>

          <div className="dashboard-title-actions">

            <button
              className="manage-announcements-button"
              onClick={() => navigate("/president/announcements")}
            >
              <Megaphone size={17} />
              Manage Announcements
            </button>

            <button
              className="manage-suggestions-button"
              onClick={() => navigate("/president/suggestions")}
            >
              <Lightbulb size={17} />
              Manage Village Suggestions
            </button>

            <button
              className="manage-polls-button"
              onClick={() => navigate("/president/polls")}
            >
              <Vote size={17} />
              Manage Village Polls
            </button>

            <button
              className="manage-reports-button"
              onClick={() => navigate("/president/reports")}
            >
              <BarChart3 size={17} />
              Reports & Analytics
            </button>

            <button
              className="refresh-button"
              onClick={loadDashboard}
            >
              <RefreshCw size={17} />
              Refresh
            </button>

          </div>

        </div>

        {error && (
          <div className="dashboard-error" role="alert">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <section className="dashboard-stats">

          <div className="stat-card">
            <div className="stat-icon stat-blue">
              <FileText />
            </div>
            <div>
              <p>Total Complaints</p>
              <h2>{stats.total}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-orange">
              <Clock />
            </div>
            <div>
              <p>Submitted</p>
              <h2>{stats.submitted}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-purple">
              <LayoutDashboard />
            </div>
            <div>
              <p>In Progress</p>
              <h2>{stats.progress}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-green">
              <CheckCircle />
            </div>
            <div>
              <p>Resolved</p>
              <h2>{stats.resolved}</h2>
            </div>
          </div>

        </section>

        <section className="complaints-panel">

          <div className="complaints-heading">
            <div>
              <h2>Village Complaints</h2>
              <p>Review complaints and update their status.</p>
            </div>

            <span className="complaint-count">
              {filteredComplaints.length} Records
            </span>
          </div>

          <div className="complaint-filters">

            <div className="search-box">
              <Search size={18} />

              <input
                type="search"
                placeholder="Search tracking ID, issue or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>

              {STATUSES.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "All" ? "All Categories" : category}
                </option>
              ))}
            </select>

          </div>

          <div className="complaint-table-wrapper">

            <table className="complaint-table">

              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredComplaints.map(item => (

                  <tr key={item.tracking_id}>

                    <td className="tracking-id">
                      {item.tracking_id}
                    </td>

                    <td>{item.category || "Other"}</td>

                    <td className="description-cell">
                      {item.description || "No description"}
                    </td>

                    <td>{item.location || "Not provided"}</td>

                    <td>{formatDate(item.created_at)}</td>

                    <td>
                      <select
                        className={`status-select status-${String(item.status || "Submitted").toLowerCase().replaceAll(" ", "-")}`}
                        value={item.status || "Submitted"}
                        disabled={updatingId === item.tracking_id}
                        onChange={e =>
                          updateStatus(item.tracking_id, e.target.value)
                        }
                      >
                        {STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <button
                        className="view-details-btn"
                        onClick={() =>
                          viewComplaintDetails(item.tracking_id)
                        }
                        disabled={detailsLoading}
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                    </td>

                  </tr>

                ))}

                {filteredComplaints.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-table">
                      No complaints found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

        {selectedComplaint && (

          <div
            className="details-modal-overlay"
            onClick={closeComplaintDetails}
          >

            <div
              className="details-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="complaint-details-title"
              onClick={e => e.stopPropagation()}
            >

              <div className="details-modal-header">

                <div>
                  <span>COMPLAINT INFORMATION</span>

                  <h2 id="complaint-details-title">
                    Complaint Details
                  </h2>
                </div>

                <button
                  className="details-close-btn"
                  onClick={closeComplaintDetails}
                  aria-label="Close complaint details"
                >
                  <X size={22} />
                </button>

              </div>

              <div className="details-modal-body">

                <div className="details-tracking">
                  <span>Tracking ID</span>
                  <strong>{selectedComplaint.tracking_id}</strong>
                </div>

                <div className="details-grid">

                  <div className="details-item">
                    <span>Category</span>
                    <strong>
                      {selectedComplaint.category || "Not provided"}
                    </strong>
                  </div>

                  <div className="details-item">
                    <span>Status</span>
                    <strong>
                      {selectedComplaint.status || "Submitted"}
                    </strong>
                  </div>

                  <div className="details-item">
                    <span>Location</span>
                    <strong>
                      {selectedComplaint.location || "Not provided"}
                    </strong>
                  </div>

                  <div className="details-item">
                    <span>Date Submitted</span>
                    <strong>
                      {formatDate(selectedComplaint.created_at)}
                    </strong>
                  </div>

                </div>

                <div className="details-description">
                  <span>Full Complaint Description</span>
                  <p>
                    {selectedComplaint.description ||
                      "No description provided."}
                  </p>
                </div>

                <div className="details-photo-section">
                  <span>Complaint Photo Evidence</span>

                  {selectedComplaint.has_photo ? (
                    <>
                      {photoLoading && (
                        <p>Loading complaint photo...</p>
                      )}

                      {photoError && (
                        <p
                          className="no-complaint-photo"
                          role="alert"
                        >
                          {photoError}
                        </p>
                      )}

                      {photoUrl && (
                        <a
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="complaint-photo-link"
                        >
                          <img
                            src={photoUrl}
                            alt="Uploaded complaint evidence"
                            className="complaint-photo"
                          />

                          <small>
                            Click image to view full size
                          </small>
                        </a>
                      )}
                    </>
                  ) : (
                    <p className="no-complaint-photo">
                      No photo uploaded for this complaint.
                    </p>
                  )}
                </div>

              </div>

              <div className="details-modal-footer">
                <button
                  onClick={closeComplaintDetails}
                >
                  Close
                </button>
              </div>

            </div>

          </div>

        )}

        <footer className="dashboard-footer">
          Mana Ooru – Kotha Idara Village Digital Grievance Portal
        </footer>

      </main>

    </div>
  );
}

export default AdminDashboard;
