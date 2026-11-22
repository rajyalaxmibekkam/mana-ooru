import { API_URL as API_ROOT } from "../config/api";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  BarChart3,
  Send,
  X,
  Lock,
  Unlock,
  Vote,
  AlertCircle,
  CheckCircle,
  Globe
} from "lucide-react";

import "./PresidentPolls.css";

const API_URL = `${API_ROOT}/polls`;

const EMPTY_FORM = {
  question: "",
  description: "",
  options: ["", ""]
};

const translations = {
  en: {
    dashboard: "Dashboard",
    title: "Village Poll Management",
    subtitle: "Kotha Idara – President Administration",
    refresh: "Refresh",
    totalPolls: "Total Polls",
    publishedPolls: "Published Polls",
    activeVoting: "Active Voting",
    editPoll: "Edit Village Poll",
    createPoll: "Create New Poll",
    formDescription: "Ask villagers to vote on important development decisions.",
    question: "Poll Question",
    questionPlaceholder: "Example: Which road should be repaired first?",
    description: "Description",
    descriptionPlaceholder: "Provide additional information about this poll...",
    options: "Voting Options",
    addOption: "Add Option",
    removeOption: "Remove option",
    create: "Create Poll",
    update: "Update Poll",
    saving: "Saving...",
    cancel: "Cancel Editing",
    manage: "Manage Village Polls",
    manageDescription: "Publish polls, control voting and view results.",
    polls: "Polls",
    loading: "Loading polls...",
    noPolls: "No polls created yet",
    createFirst: "Create your first village poll above.",
    published: "Published",
    draft: "Draft",
    open: "Voting Open",
    closed: "Voting Closed",
    votes: "votes",
    totalVotes: "total votes",
    results: "Results",
    edit: "Edit",
    publish: "Publish",
    unpublish: "Unpublish",
    closeVoting: "Close Voting",
    reopenVoting: "Reopen Voting",
    dateUnavailable: "Date unavailable",
    resultsTitle: "VILLAGE POLL RESULTS",
    close: "Close",
    deleteConfirm: "Are you sure you want to delete this poll and all its votes?",
    questionRequired: "Please enter a question and complete every option.",
    duplicateOptions: "Duplicate options are not allowed.",
    loadError: "Unable to load polls.",
    backendError: "Cannot connect to the backend.",
    saveError: "Unable to save poll.",
    updateError: "Unable to update poll.",
    deleteError: "Unable to delete poll.",
    resultsError: "Unable to load poll results.",
    editVotesError: "Polls with existing votes cannot have their options edited.",
    created: "Poll created successfully. Publish it when ready.",
    updated: "Poll updated successfully.",
    statusUpdated: "Poll status updated successfully.",
    deleted: "Poll deleted successfully.",
    optionCount: "options",
    language: "తెలుగు"
  },
  te: {
    dashboard: "డాష్‌బోర్డ్",
    title: "గ్రామ పోల్స్ నిర్వహణ",
    subtitle: "కొత్త ఇడారా – అధ్యక్షుల నిర్వహణ",
    refresh: "రిఫ్రెష్",
    totalPolls: "మొత్తం పోల్స్",
    publishedPolls: "ప్రచురించిన పోల్స్",
    activeVoting: "ఓటింగ్ జరుగుతున్నవి",
    editPoll: "గ్రామ పోల్ సవరించండి",
    createPoll: "కొత్త పోల్ సృష్టించండి",
    formDescription: "గ్రామ అభివృద్ధి నిర్ణయాలపై గ్రామస్థుల అభిప్రాయాలను తెలుసుకోండి.",
    question: "పోల్ ప్రశ్న",
    questionPlaceholder: "ఉదాహరణ: ముందుగా ఏ రహదారిని మరమ్మతు చేయాలి?",
    description: "వివరణ",
    descriptionPlaceholder: "ఈ పోల్ గురించి అదనపు వివరాలు ఇవ్వండి...",
    options: "ఓటింగ్ ఎంపికలు",
    addOption: "ఎంపికను జోడించండి",
    removeOption: "ఎంపికను తొలగించండి",
    create: "పోల్ సృష్టించండి",
    update: "పోల్ నవీకరించండి",
    saving: "సేవ్ అవుతోంది...",
    cancel: "సవరణను రద్దు చేయండి",
    manage: "గ్రామ పోల్స్ నిర్వహించండి",
    manageDescription: "పోల్స్ ప్రచురించండి, ఓటింగ్ నియంత్రించండి మరియు ఫలితాలు చూడండి.",
    polls: "పోల్స్",
    loading: "పోల్స్ లోడ్ అవుతున్నాయి...",
    noPolls: "ఇంకా పోల్స్ సృష్టించలేదు",
    createFirst: "పైన మీ మొదటి గ్రామ పోల్‌ను సృష్టించండి.",
    published: "ప్రచురించబడింది",
    draft: "డ్రాఫ్ట్",
    open: "ఓటింగ్ ప్రారంభమైంది",
    closed: "ఓటింగ్ ముగిసింది",
    votes: "ఓట్లు",
    totalVotes: "మొత్తం ఓట్లు",
    results: "ఫలితాలు",
    edit: "సవరించండి",
    publish: "ప్రచురించండి",
    unpublish: "ప్రచురణ నిలిపివేయండి",
    closeVoting: "ఓటింగ్ ముగించండి",
    reopenVoting: "ఓటింగ్ తిరిగి ప్రారంభించండి",
    dateUnavailable: "తేదీ అందుబాటులో లేదు",
    resultsTitle: "గ్రామ పోల్ ఫలితాలు",
    close: "మూసివేయండి",
    deleteConfirm: "ఈ పోల్ మరియు దాని అన్ని ఓట్లను తొలగించాలనుకుంటున్నారా?",
    questionRequired: "దయచేసి ప్రశ్నను నమోదు చేసి, అన్ని ఎంపికలను పూర్తి చేయండి.",
    duplicateOptions: "ఒకే విధమైన ఎంపికలు అనుమతించబడవు.",
    loadError: "పోల్స్ లోడ్ చేయడం సాధ్యం కాలేదు.",
    backendError: "బ్యాకెండ్‌తో కనెక్షన్ సాధ్యం కాలేదు.",
    saveError: "పోల్ సేవ్ చేయడం సాధ్యం కాలేదు.",
    updateError: "పోల్ నవీకరించడం సాధ్యం కాలేదు.",
    deleteError: "పోల్ తొలగించడం సాధ్యం కాలేదు.",
    resultsError: "పోల్ ఫలితాలు లోడ్ చేయడం సాధ్యం కాలేదు.",
    editVotesError: "ఓట్లు నమోదైన పోల్స్ ఎంపికలను సవరించలేరు.",
    created: "పోల్ విజయవంతంగా సృష్టించబడింది. సిద్ధమైనప్పుడు ప్రచురించండి.",
    updated: "పోల్ విజయవంతంగా నవీకరించబడింది.",
    statusUpdated: "పోల్ స్థితి విజయవంతంగా నవీకరించబడింది.",
    deleted: "పోల్ విజయవంతంగా తొలగించబడింది.",
    optionCount: "ఎంపికలు",
    language: "English"
  }
};

function PresidentPolls() {
  const navigate = useNavigate();

  const token = localStorage.getItem("president_token");

  const [language, setLanguage] = useState("en");
  const t = translations[language];

  const [polls, setPolls] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resultsPoll, setResultsPoll] = useState(null);

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const handleUnauthorized = () => {
    localStorage.removeItem("president_token");
    navigate("/president/login", { replace: true });
  };

  const loadPolls = useCallback(async () => {
    if (!token) {
      navigate("/president/login", { replace: true });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(t.loadError);
      }

      const data = await response.json();
      setPolls(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? t.backendError
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, [token, navigate, language]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const resetForm = () => {
    setForm({
      question: "",
      description: "",
      options: ["", ""]
    });
    setEditingId(null);
  };

  const updateOption = (index, value) => {
    setForm(previous => ({
      ...previous,
      options: previous.options.map((option, i) =>
        i === index ? value : option
      )
    }));
  };

  const addOption = () => {
    if (form.options.length >= 10) return;

    setForm(previous => ({
      ...previous,
      options: [...previous.options, ""]
    }));
  };

  const removeOption = (index) => {
    if (form.options.length <= 2) return;

    setForm(previous => ({
      ...previous,
      options: previous.options.filter((_, i) => i !== index)
    }));
  };

  const savePoll = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanedOptions = form.options.map(option => option.trim());

    if (!form.question.trim() || cleanedOptions.some(option => !option)) {
      setError(t.questionRequired);
      return;
    }

    if (
      new Set(cleanedOptions.map(option => option.toLowerCase())).size !==
      cleanedOptions.length
    ) {
      setError(t.duplicateOptions);
      return;
    }

    setSaving(true);

    try {
      const url = editingId
        ? `${API_URL}/${editingId}`
        : `${API_URL}/`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: form.question.trim(),
          description: form.description.trim() || null,
          options: cleanedOptions
        })
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || t.saveError);
      }

      setSuccess(editingId ? t.updated : t.created);
      resetForm();
      await loadPolls();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const editPoll = (poll) => {
    if (Number(poll.total_votes || 0) > 0) {
      setError(t.editVotesError);
      return;
    }

    setEditingId(poll.id);

    setForm({
      question: poll.question,
      description: poll.description || "",
      options: poll.options.map(option => option.option_text)
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const togglePoll = async (pollId, action) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${pollId}/${action}`, {
        method: "PATCH",
        headers: authHeaders
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || t.updateError);
      }

      setSuccess(t.statusUpdated);
      await loadPolls();
    } catch (err) {
      setError(err.message);
    }
  };

  const deletePoll = async (pollId) => {
    const confirmed = window.confirm(t.deleteConfirm);

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${pollId}`, {
        method: "DELETE",
        headers: authHeaders
      });

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || t.deleteError);
      }

      setPolls(previous =>
        previous.filter(poll => poll.id !== pollId)
      );

      if (resultsPoll?.id === pollId) {
        setResultsPoll(null);
      }

      setSuccess(t.deleted);
    } catch (err) {
      setError(err.message);
    }
  };

  const showResults = async (poll) => {
    if (!poll.is_published) return;

    setError("");

    try {
      const response = await fetch(`${API_URL}/${poll.id}/results`);

      if (!response.ok) {
        throw new Error(t.resultsError);
      }

      const data = await response.json();
      setResultsPoll(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (value) => {
    if (!value) return t.dateUnavailable;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t.dateUnavailable;
    }

    return date.toLocaleString(language === "te" ? "te-IN" : "en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const totalPolls = polls.length;
  const publishedPolls = polls.filter(poll => poll.is_published).length;
  const activePolls = polls.filter(
    poll => poll.is_published && poll.is_active
  ).length;

  return (
    <div className="president-polls-page">

      <header className="president-polls-header">

        <button
          className="poll-back-button"
          onClick={() => navigate("/president/dashboard")}
        >
          <ArrowLeft size={18} />
          {t.dashboard}
        </button>

        <div className="poll-header-title">
          <div className="poll-header-icon">
            <Vote size={25} />
          </div>

          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>

        <div className="poll-header-actions">
          <button
            className="poll-language-button"
            onClick={() => setLanguage(previous => previous === "en" ? "te" : "en")}
            type="button"
          >
            <Globe size={17} />
            {t.language}
          </button>

          <button
            className="poll-refresh-button"
            onClick={loadPolls}
            disabled={loading}
          >
            <RefreshCw size={17} />
            {t.refresh}
          </button>
        </div>

      </header>

      <main className="president-polls-main">

        {error && (
          <div className="poll-alert poll-alert-error" role="alert">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="poll-alert poll-alert-success" role="status">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        <section className="poll-statistics">

          <div className="poll-stat-card">
            <Vote size={24} />
            <div>
              <span>{t.totalPolls}</span>
              <strong>{totalPolls}</strong>
            </div>
          </div>

          <div className="poll-stat-card">
            <Send size={24} />
            <div>
              <span>{t.publishedPolls}</span>
              <strong>{publishedPolls}</strong>
            </div>
          </div>

          <div className="poll-stat-card">
            <CheckCircle size={24} />
            <div>
              <span>{t.activeVoting}</span>
              <strong>{activePolls}</strong>
            </div>
          </div>

        </section>

        <section className="poll-create-section">

          <div className="poll-section-heading">
            <div>
              <h2>{editingId ? t.editPoll : t.createPoll}</h2>
              <p>{t.formDescription}</p>
            </div>
          </div>

          <form onSubmit={savePoll} className="poll-create-form">

            <label htmlFor="poll-question">
              {t.question} *
            </label>

            <input
              id="poll-question"
              type="text"
              maxLength={300}
              placeholder={t.questionPlaceholder}
              value={form.question}
              onChange={event =>
                setForm(previous => ({
                  ...previous,
                  question: event.target.value
                }))
              }
              required
            />

            <label htmlFor="poll-description">
              {t.description}
            </label>

            <textarea
              id="poll-description"
              rows="3"
              maxLength={3000}
              placeholder={t.descriptionPlaceholder}
              value={form.description}
              onChange={event =>
                setForm(previous => ({
                  ...previous,
                  description: event.target.value
                }))
              }
            />

            <div className="poll-options-heading">
              <label>{t.options} *</label>
              <span>{form.options.length}/10 {t.optionCount}</span>
            </div>

            <div className="poll-option-inputs">

              {form.options.map((option, index) => (
                <div className="poll-option-input-row" key={index}>

                  <span className="poll-option-number">
                    {index + 1}
                  </span>

                  <input
                    type="text"
                    maxLength={200}
                    placeholder={`${t.options} ${index + 1}`}
                    value={option}
                    onChange={event =>
                      updateOption(index, event.target.value)
                    }
                    required
                  />

                  <button
                    type="button"
                    className="poll-remove-option"
                    onClick={() => removeOption(index)}
                    disabled={form.options.length <= 2}
                    title={t.removeOption}
                    aria-label={t.removeOption}
                  >
                    <X size={17} />
                  </button>

                </div>
              ))}

            </div>

            <button
              type="button"
              className="poll-add-option"
              onClick={addOption}
              disabled={form.options.length >= 10}
            >
              <Plus size={17} />
              {t.addOption}
            </button>

            <div className="poll-form-actions">

              <button
                type="submit"
                className="poll-save-button"
                disabled={saving}
              >
                <CheckCircle size={17} />
                {saving
                  ? t.saving
                  : editingId
                    ? t.update
                    : t.create}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="poll-cancel-button"
                  onClick={resetForm}
                >
                  {t.cancel}
                </button>
              )}

            </div>

          </form>

        </section>

        <section className="poll-management-section">

          <div className="poll-section-heading">
            <div>
              <h2>{t.manage}</h2>
              <p>{t.manageDescription}</p>
            </div>

            <span className="poll-record-count">
              {polls.length} {t.polls}
            </span>
          </div>

          {loading ? (
            <div className="poll-empty-message">
              <RefreshCw className="spin" size={25} />
              <p>{t.loading}</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="poll-empty-message">
              <Vote size={38} />
              <h3>{t.noPolls}</h3>
              <p>{t.createFirst}</p>
            </div>
          ) : (

            <div className="president-poll-list">

              {polls.map(poll => (

                <article className="president-poll-card" key={poll.id}>

                  <div className="president-poll-top">

                    <div>
                      <span className="poll-id-label">
                        POLL #{poll.id}
                      </span>

                      <h3>{poll.question}</h3>
                    </div>

                    <button
                      className="poll-delete-button"
                      onClick={() => deletePoll(poll.id)}
                      title={t.deleteError}
                      aria-label={t.deleteError}
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                  {poll.description && (
                    <p className="president-poll-description">
                      {poll.description}
                    </p>
                  )}

                  <div className="poll-status-labels">

                    <span className={
                      poll.is_published
                        ? "poll-published"
                        : "poll-unpublished"
                    }>
                      {poll.is_published ? t.published : t.draft}
                    </span>

                    <span className={
                      poll.is_active
                        ? "poll-active"
                        : "poll-closed"
                    }>
                      {poll.is_active ? t.open : t.closed}
                    </span>

                  </div>

                  <div className="president-poll-options">

                    {poll.options?.map(option => (
                      <div className="president-poll-option" key={option.id}>
                        <span>{option.option_text}</span>
                        <strong>{option.votes ?? 0} {t.votes}</strong>
                      </div>
                    ))}

                  </div>

                  <div className="president-poll-meta">
                    <span>
                      <BarChart3 size={15} />
                      {poll.total_votes ?? 0} {t.totalVotes}
                    </span>

                    <span>{formatDate(poll.created_at)}</span>
                  </div>

                  <div className="president-poll-actions">

                    <button
                      className="poll-results-button"
                      onClick={() => showResults(poll)}
                      disabled={!poll.is_published}
                    >
                      <BarChart3 size={16} />
                      {t.results}
                    </button>

                    <button
                      className="poll-edit-button"
                      onClick={() => editPoll(poll)}
                      disabled={Number(poll.total_votes || 0) > 0}
                    >
                      <Edit size={16} />
                      {t.edit}
                    </button>

                    <button
                      className="poll-publish-button"
                      onClick={() => togglePoll(poll.id, "publish")}
                    >
                      <Send size={16} />
                      {poll.is_published ? t.unpublish : t.publish}
                    </button>

                    <button
                      className="poll-close-button"
                      onClick={() => togglePoll(poll.id, "close")}
                      disabled={!poll.is_published}
                    >
                      {poll.is_active ? (
                        <>
                          <Lock size={16} />
                          {t.closeVoting}
                        </>
                      ) : (
                        <>
                          <Unlock size={16} />
                          {t.reopenVoting}
                        </>
                      )}
                    </button>

                  </div>

                </article>

              ))}

            </div>
          )}

        </section>

        {resultsPoll && (
          <div
            className="poll-results-overlay"
            onClick={() => setResultsPoll(null)}
          >
            <div
              className="poll-results-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="poll-results-heading"
              onClick={event => event.stopPropagation()}
            >

              <div className="poll-results-header">
                <div>
                  <span>{t.resultsTitle}</span>
                  <h2 id="poll-results-heading">{resultsPoll.question}</h2>
                </div>

                <button
                  onClick={() => setResultsPoll(null)}
                  aria-label={t.close}
                >
                  <X size={22} />
                </button>
              </div>

              <p className="poll-results-total">
                {t.totalVotes}: {resultsPoll.total_votes ?? 0}
              </p>

              <div className="poll-results-options">

                {resultsPoll.options?.map(option => {
                  const total = Number(resultsPoll.total_votes || 0);
                  const votes = Number(option.votes || 0);
                  const percentage = total > 0
                    ? (votes / total) * 100
                    : 0;

                  return (
                    <div className="poll-result-row" key={option.id}>
                      <div className="poll-result-label">
                        <span>{option.option_text}</span>
                        <strong>
                          {votes} {t.votes} ({percentage.toFixed(1)}%)
                        </strong>
                      </div>

                      <div className="poll-result-track">
                        <div
                          className="poll-result-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

              </div>

              <button
                className="poll-results-close"
                onClick={() => setResultsPoll(null)}
              >
                {t.close}
              </button>

            </div>
          </div>
        )}

        <footer className="president-polls-footer">
          Mana Ooru – Kotha Idara Village Digital Grievance Portal
        </footer>

      </main>
    </div>
  );
}

export default PresidentPolls;
