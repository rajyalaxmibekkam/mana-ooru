import { API_URL as API_ROOT } from "../config/api";

import { useCallback, useEffect, useState } from "react";
import {
  Vote,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Lock,
  Send,
  Globe
} from "lucide-react";

import "./Polls.css";

const API_URL = `${API_ROOT}/polls`;
const VOTER_KEY_NAME = "mana_ooru_voter_key";

function getVoterKey() {
  let key = localStorage.getItem(VOTER_KEY_NAME);

  if (!key) {
    key = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(VOTER_KEY_NAME, key);
  }

  return key;
}

const translations = {
  en: {
    refresh: "Refresh Polls",
    eyebrow: "YOUR VOICE MATTERS",
    heroTitle: "Village Polls & Voting",
    heroDescription:
      "Participate in village development decisions. Choose your preferred option and submit your vote.",
    available: "Available Village Polls",
    availableDescription: "Polls published by the village administration.",
    polls: "Polls",
    loading: "Loading village polls...",
    noPolls: "No polls available",
    noPollsDescription:
      "The village administration has not published any polls yet. Please visit again later.",
    votingOpen: "Voting Open",
    votingClosed: "Voting Closed",
    poll: "VILLAGE POLL",
    published: "Published poll",
    dateUnavailable: "Date unavailable",
    recorded: "Your vote has been recorded",
    selectOption: "Select one option",
    votingIsClosed: "Voting is closed",
    alreadyVoted: "Already voted on this browser",
    closedMessage: "Voting has been closed",
    submit: "Submit Vote",
    submitting: "Submitting...",
    results: "View Results",
    refreshResults: "Refresh Results",
    votingResults: "Voting Results",
    totalVotes: "Total Votes",
    votes: "votes",
    privacy: "Voting privacy",
    privacyDescription:
      "This portal uses a browser-generated identifier to help prevent repeated votes. It does not verify a person's identity. Clearing browser data or using another device may bypass this restriction.",
    footer: "Mana Ooru – Kotha Idara Village Digital Grievance Portal",
    footerDescription: "Participate in village development.",
    requiredOption: "Please select an option before voting.",
    alreadyVotedError: "You have already voted in this poll on this browser.",
    voteSuccess: "Your vote has been submitted successfully.",
    loadError: "Unable to load village polls.",
    resultsError: "Unable to load poll results.",
    voteError: "Unable to submit your vote.",
    connectionError:
      "Cannot connect to the village portal. Please try again later.",
    serverError: "Cannot connect to the server. Please try again.",
    error: "Something went wrong. Please try again."
  },

  te: {
    refresh: "పోల్స్‌ను రిఫ్రెష్ చేయండి",
    eyebrow: "మీ గొంతు ముఖ్యం",
    heroTitle: "గ్రామ పోల్స్ మరియు ఓటింగ్",
    heroDescription:
      "గ్రామ అభివృద్ధి నిర్ణయాలలో పాల్గొనండి. మీకు నచ్చిన ఎంపికను ఎంచుకుని మీ ఓటును నమోదు చేయండి.",
    available: "అందుబాటులో ఉన్న గ్రామ పోల్స్",
    availableDescription: "గ్రామ పరిపాలన ప్రచురించిన పోల్స్.",
    polls: "పోల్స్",
    loading: "గ్రామ పోల్స్ లోడ్ అవుతున్నాయి...",
    noPolls: "ప్రస్తుతం పోల్స్ అందుబాటులో లేవు",
    noPollsDescription:
      "గ్రామ పరిపాలన ఇంకా ఎలాంటి పోల్స్‌ను ప్రచురించలేదు. దయచేసి తర్వాత మళ్లీ సందర్శించండి.",
    votingOpen: "ఓటింగ్ ప్రారంభమైంది",
    votingClosed: "ఓటింగ్ ముగిసింది",
    poll: "గ్రామ పోల్",
    published: "ప్రచురించిన తేదీ",
    dateUnavailable: "తేదీ అందుబాటులో లేదు",
    recorded: "మీ ఓటు నమోదు చేయబడింది",
    selectOption: "ఒక ఎంపికను ఎంచుకోండి",
    votingIsClosed: "ఓటింగ్ ముగిసింది",
    alreadyVoted: "ఈ బ్రౌజర్‌లో ఇప్పటికే ఓటు వేశారు",
    closedMessage: "ఓటింగ్ ముగిసింది",
    submit: "ఓటు నమోదు చేయండి",
    submitting: "నమోదు అవుతోంది...",
    results: "ఫలితాలను చూడండి",
    refreshResults: "ఫలితాలను రిఫ్రెష్ చేయండి",
    votingResults: "ఓటింగ్ ఫలితాలు",
    totalVotes: "మొత్తం ఓట్లు",
    votes: "ఓట్లు",
    privacy: "ఓటింగ్ గోప్యత",
    privacyDescription:
      "మళ్లీ మళ్లీ ఓటు వేయడాన్ని నిరోధించడానికి ఈ పోర్టల్ బ్రౌజర్ ద్వారా రూపొందించిన గుర్తింపును ఉపయోగిస్తుంది. ఇది వ్యక్తి యొక్క నిజమైన గుర్తింపును నిర్ధారించదు. బ్రౌజర్ డేటాను తొలగించడం లేదా మరొక పరికరాన్ని ఉపయోగించడం ద్వారా ఈ పరిమితిని దాటవేయవచ్చు.",
    footer: "మన ఊరు – కొత్త ఇదార గ్రామ డిజిటల్ ఫిర్యాదుల పోర్టల్",
    footerDescription: "గ్రామ అభివృద్ధిలో పాల్గొనండి.",
    requiredOption: "ఓటు వేయడానికి ముందుగా ఒక ఎంపికను ఎంచుకోండి.",
    alreadyVotedError:
      "ఈ బ్రౌజర్ ద్వారా మీరు ఇప్పటికే ఈ పోల్‌లో ఓటు వేశారు.",
    voteSuccess: "మీ ఓటు విజయవంతంగా నమోదు చేయబడింది.",
    loadError: "గ్రామ పోల్స్‌ను లోడ్ చేయలేకపోయాము.",
    resultsError: "పోల్ ఫలితాలను లోడ్ చేయలేకపోయాము.",
    voteError: "మీ ఓటును నమోదు చేయలేకపోయాము.",
    connectionError:
      "గ్రామ పోర్టల్‌తో కనెక్ట్ కాలేకపోయాము. దయచేసి తర్వాత ప్రయత్నించండి.",
    serverError: "సర్వర్‌తో కనెక్ట్ కాలేకపోయాము. మళ్లీ ప్రయత్నించండి.",
    error: "ఏదో సమస్య ఏర్పడింది. దయచేసి మళ్లీ ప్రయత్నించండి."
  }
};

function Polls() {
  const [language, setLanguage] = useState("en");

  const [polls, setPolls] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [votedPolls, setVotedPolls] = useState({});
  const [results, setResults] = useState({});

  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const t = translations[language];

  const loadPolls = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/`);

      if (!response.ok) {
        throw new Error("loadError");
      }

      const data = await response.json();
      const pollList = Array.isArray(data) ? data : [];

      setPolls(pollList);

      const savedVotes = {};

      pollList.forEach(poll => {
        const saved = localStorage.getItem(
          `mana_ooru_voted_${poll.id}`
        );

        if (saved) {
          savedVotes[poll.id] = true;
        }
      });

      setVotedPolls(savedVotes);

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "connectionError"
          : err.message === "loadError"
            ? "loadError"
            : "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const selectOption = (pollId, optionId) => {
    setSelectedOptions(previous => ({
      ...previous,
      [pollId]: optionId
    }));

    setError("");
    setSuccess("");
  };

  const loadResults = async (pollId) => {
    setError("");

    try {
      const response = await fetch(`${API_URL}/${pollId}/results`);

      if (!response.ok) {
        throw new Error("resultsError");
      }

      const data = await response.json();

      setResults(previous => ({
        ...previous,
        [pollId]: data
      }));

      return data;

    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "connectionError"
          : err.message === "resultsError"
            ? "resultsError"
            : "error"
      );

      return null;
    }
  };

  const submitVote = async (poll) => {
    const optionId = selectedOptions[poll.id];

    if (!optionId) {
      setError("requiredOption");
      return;
    }

    if (votedPolls[poll.id]) {
      setError("alreadyVotedError");
      return;
    }

    if (!poll.is_active) {
      setError("votingIsClosed");
      return;
    }

    if (votingId !== null) {
      return;
    }

    setVotingId(poll.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/${poll.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          option_id: Number(optionId),
          voter_key: getVoterKey()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409) {
          localStorage.setItem(
            `mana_ooru_voted_${poll.id}`,
            "true"
          );

          setVotedPolls(previous => ({
            ...previous,
            [poll.id]: true
          }));

          throw new Error("alreadyVotedError");
        }

        throw new Error(
          data.detail || "voteError"
        );
      }

      localStorage.setItem(
        `mana_ooru_voted_${poll.id}`,
        "true"
      );

      setVotedPolls(previous => ({
        ...previous,
        [poll.id]: true
      }));

      setSuccess("voteSuccess");

      await loadResults(poll.id);

    } catch (err) {
      const message = err.message;

      setError(
        message === "Failed to fetch"
          ? "serverError"
          : message === "alreadyVotedError"
            ? "alreadyVotedError"
            : message === "voteError"
              ? "voteError"
              : message
      );

    } finally {
      setVotingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return t.dateUnavailable;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t.dateUnavailable;
    }

    return date.toLocaleDateString(
      language === "te" ? "te-IN" : "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  const displayMessage = (message) => {
    if (!message) return "";

    const knownMessage = t[message];

    return knownMessage || message;
  };

  return (
    <div className="public-polls-page">

      {/* Header */}
      <header className="public-polls-header">

        <div className="public-polls-brand">

          <div className="public-polls-logo">
            <Vote size={26} />
          </div>

          <div>
            <h1>Mana Ooru</h1>
            <p>Kotha Idara Village Portal</p>
          </div>

        </div>

        <div className="public-polls-header-actions">

          <button
            className="public-polls-language"
            onClick={() =>
              setLanguage(language === "en" ? "te" : "en")
            }
          >
            <Globe size={17} />
            {language === "en" ? "తెలుగు" : "English"}
          </button>

          <button
            className="public-polls-refresh"
            onClick={loadPolls}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={loading ? "spin" : ""}
            />
            {t.refresh}
          </button>

        </div>

      </header>

      <main className="public-polls-main">

        {/* Hero */}
        <section className="public-polls-hero">

          <span className="public-polls-eyebrow">
            {t.eyebrow}
          </span>

          <h2>{t.heroTitle}</h2>

          <p>{t.heroDescription}</p>

          <div className="public-polls-language">
            <span>మన ఊరు</span>
            <span>మన అభివృద్ధి</span>
            <span>మన ఓటు</span>
          </div>

        </section>

        {/* Error */}
        {error && (
          <div
            className="public-poll-alert public-poll-error"
            role="alert"
          >
            <AlertCircle size={18} />
            <span>{displayMessage(error)}</span>
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            className="public-poll-alert public-poll-success"
            role="status"
          >
            <CheckCircle size={18} />
            <span>{displayMessage(success)}</span>
          </div>
        )}

        {/* Poll heading */}
        <div className="public-polls-heading">

          <div>
            <h2>{t.available}</h2>
            <p>{t.availableDescription}</p>
          </div>

          <span>
            {polls.length} {t.polls}
          </span>

        </div>

        {/* Loading */}
        {loading ? (

          <div className="public-polls-empty">

            <RefreshCw className="spin" size={30} />

            <p>{t.loading}</p>

          </div>

        ) : polls.length === 0 ? (

          /* Empty state */
          <div className="public-polls-empty">

            <Vote size={42} />

            <h3>{t.noPolls}</h3>

            <p>{t.noPollsDescription}</p>

          </div>

        ) : (

          /* Poll cards */
          <div className="public-poll-list">

            {polls.map(poll => {

              const pollResults = results[poll.id];

              const alreadyVoted = Boolean(
                votedPolls[poll.id]
              );

              const isOpen = Boolean(poll.is_active);

              const totalVotes = Number(
                pollResults?.total_votes || 0
              );

              return (

                <article
                  className="public-poll-card"
                  key={poll.id}
                >

                  {/* Poll heading */}
                  <div className="public-poll-card-header">

                    <div>

                      <span className="public-poll-id">
                        {t.poll} #{poll.id}
                      </span>

                      <h3>{poll.question}</h3>

                    </div>

                    <span
                      className={
                        isOpen
                          ? "public-poll-open"
                          : "public-poll-closed"
                      }
                    >
                      {isOpen
                        ? t.votingOpen
                        : t.votingClosed}
                    </span>

                  </div>

                  {/* Description */}
                  {poll.description && (
                    <p className="public-poll-description">
                      {poll.description}
                    </p>
                  )}

                  {/* Date */}
                  <div className="public-poll-date">
                    {t.published} · {formatDate(poll.created_at)}
                  </div>

                  {/* Options */}
                  <div className="public-poll-options">

                    <h4>
                      {alreadyVoted
                        ? t.recorded
                        : isOpen
                          ? t.selectOption
                          : t.votingIsClosed}
                    </h4>

                    {poll.options?.map(option => {

                      const selected =
                        Number(selectedOptions[poll.id]) ===
                        Number(option.id);

                      return (

                        <label
                          key={option.id}
                          className={`public-poll-option ${
                            selected ? "selected" : ""
                          }`}
                        >

                          <input
                            type="radio"
                            name={`poll-${poll.id}`}
                            value={option.id}
                            checked={selected}
                            disabled={
                              !isOpen ||
                              alreadyVoted ||
                              votingId === poll.id
                            }
                            onChange={() =>
                              selectOption(poll.id, option.id)
                            }
                          />

                          <span className="public-poll-radio" />

                          <span className="public-poll-option-text">
                            {option.option_text}
                          </span>

                        </label>

                      );

                    })}

                  </div>

                  {/* Actions */}
                  <div className="public-poll-actions">

                    {!alreadyVoted && isOpen && (

                      <button
                        className="public-poll-vote-button"
                        onClick={() => submitVote(poll)}
                        disabled={votingId !== null}
                      >

                        <Send size={17} />

                        {votingId === poll.id
                          ? t.submitting
                          : t.submit}

                      </button>

                    )}

                    {(alreadyVoted || !isOpen) && (

                      <div className="public-poll-info">

                        {alreadyVoted ? (
                          <>
                            <CheckCircle size={17} />
                            {t.alreadyVoted}
                          </>
                        ) : (
                          <>
                            <Lock size={17} />
                            {t.closedMessage}
                          </>
                        )}

                      </div>

                    )}

                    <button
                      className="public-poll-results-button"
                      onClick={() => loadResults(poll.id)}
                    >

                      <BarChart3 size={17} />

                      {pollResults
                        ? t.refreshResults
                        : t.results}

                    </button>

                  </div>

                  {/* Results */}
                  {pollResults && (

                    <div className="public-poll-results">

                      <div className="public-results-heading">

                        <h4>{t.votingResults}</h4>

                        <strong>
                          {totalVotes} {t.totalVotes}
                        </strong>

                      </div>

                      {pollResults.options?.map(option => {

                        const votes = Number(option.votes || 0);

                        const percentage = totalVotes > 0
                          ? (votes / totalVotes) * 100
                          : 0;

                        return (

                          <div
                            className="public-result-item"
                            key={option.id}
                          >

                            <div className="public-result-label">

                              <span>
                                {option.option_text}
                              </span>

                              <strong>
                                {votes} {t.votes} · {percentage.toFixed(1)}%
                              </strong>

                            </div>

                            <div className="public-result-track">

                              <div
                                className="public-result-fill"
                                style={{
                                  width: `${percentage}%`
                                }}
                              />

                            </div>

                          </div>

                        );

                      })}

                    </div>

                  )}

                </article>

              );

            })}

          </div>

        )}

        {/* Privacy */}
        <section className="public-polls-note">

          <Lock size={19} />

          <div>

            <strong>{t.privacy}</strong>

            <p>{t.privacyDescription}</p>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="public-polls-footer">

        <p>{t.footer}</p>

        <span>{t.footerDescription}</span>

      </footer>

    </div>
  );
}

export default Polls;
