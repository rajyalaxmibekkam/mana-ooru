
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Complaint from "./pages/Complaint";
import TrackComplaint from "./pages/TrackComplaint";
import Announcements from "./pages/Announcements";
import ManageAnnouncements from "./pages/ManageAnnouncements";
import Suggestions from "./pages/Suggestions";
import PresidentSuggestions from "./pages/PresidentSuggestions";
import PresidentPolls from "./pages/PresidentPolls";
import Polls from "./pages/Polls";
import PresidentReports from "./pages/PresidentReports";
import PublicStatistics from "./pages/PublicStatistics";

import {
  Menu,
  X,
  Globe,
  MessageSquare,
  Search,
  Lightbulb,
  Megaphone,
  ShieldCheck,
  ArrowRight,
  Droplets,
  Construction,
  Lightbulb as StreetLight,
  Trash2,
  HeartHandshake,
  Vote
} from "lucide-react";

import "./App.css";

function Home() {
  const [language, setLanguage] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);

  const content = {
    en: {
      home: "Home",
      complaints: "Complaints",
      track: "Track Complaint",
      suggestions: "Suggestions",
      announcements: "Announcements",
      polls: "Village Polls",

      title: "Your Village. Your Voice. Our Responsibility.",

      subtitle:
        "A digital platform for the people of Kotha Idara to share problems, suggest improvements, and build a better village together.",

      submit: "Submit a Complaint",
      explore: "Track Your Complaint",

      anonymous: "Your identity is not required",

      anonymousDesc:
        "Submit complaints without providing your name, phone number, or email.",

      services: "What can we help you with?",

      servicesDesc:
        "Choose a service to share your concern or idea.",

      complaintTitle: "Report a Problem",

      complaintDesc:
        "Tell us about drinking water, roads, sanitation, electricity, and other village issues.",

      trackTitle: "Track Your Complaint",

      trackDesc:
        "Check the progress of your submitted complaint using your tracking ID.",

      suggestionTitle: "Share Your Ideas",

      suggestionDesc:
        "Share your suggestions to improve facilities and development in Kotha Idara.",

      announcementTitle: "Village Announcements",

      announcementDesc:
        "Stay informed about important village news and updates.",

      pollTitle: "Village Polls",

      pollDesc:
        "Participate in village polls and share your opinion on development decisions.",

      privacy: "Your Voice Matters. Your Privacy Matters.",

      privacyDesc:
        "This portal is designed to make it easier for every villager to communicate with village leadership.",

      start: "Let's Build a Better Kotha Idara Together",

      startDesc:
        "Every complaint, suggestion, and idea can make a difference.",

      footer: "Kotha Idara Village Digital Grievance Portal",

      viewAnnouncements: "View Announcements",
      viewSuggestions: "Share a Suggestion",
      viewPolls: "Participate in Polls"
    },

    te: {
      home: "హోమ్",
      complaints: "ఫిర్యాదులు",
      track: "ఫిర్యాదు స్థితి",
      suggestions: "సూచనలు",
      announcements: "గ్రామ ప్రకటనలు",
      polls: "గ్రామ పోల్స్",

      title: "మీ గ్రామం. మీ గొంతు. మన బాధ్యత.",

      subtitle:
        "కొత్త ఇదార గ్రామ ప్రజలు సమస్యలను తెలియజేయడానికి, అభివృద్ధి సూచనలు అందించడానికి మరియు మెరుగైన గ్రామాన్ని నిర్మించడానికి ఒక డిజిటల్ వేదిక.",

      submit: "ఫిర్యాదు చేయండి",
      explore: "ఫిర్యాదు స్థితిని తెలుసుకోండి",

      anonymous: "మీ వ్యక్తిగత వివరాలు అవసరం లేదు",

      anonymousDesc:
        "మీ పేరు, ఫోన్ నంబర్ లేదా ఇమెయిల్ ఇవ్వకుండా ఫిర్యాదు చేయవచ్చు.",

      services: "మేము మీకు ఎలా సహాయపడగలం?",

      servicesDesc:
        "మీ సమస్య లేదా ఆలోచనను తెలియజేయడానికి ఒక సేవను ఎంచుకోండి.",

      complaintTitle: "సమస్యను తెలియజేయండి",

      complaintDesc:
        "తాగునీరు, రోడ్లు, పారిశుధ్యం, విద్యుత్ మరియు ఇతర గ్రామ సమస్యలను తెలియజేయండి.",

      trackTitle: "ఫిర్యాదు స్థితిని తెలుసుకోండి",

      trackDesc:
        "మీ ట్రాకింగ్ ఐడీ ద్వారా ఫిర్యాదు పురోగతిని తెలుసుకోండి.",

      suggestionTitle: "మీ ఆలోచనలను పంచుకోండి",

      suggestionDesc:
        "కొత్త ఇదార అభివృద్ధి కోసం మీ విలువైన సూచనలను తెలియజేయండి.",

      announcementTitle: "గ్రామ ప్రకటనలు",

      announcementDesc:
        "ముఖ్యమైన గ్రామ వార్తలు మరియు తాజా సమాచారాన్ని తెలుసుకోండి.",

      pollTitle: "గ్రామ పోల్స్",

      pollDesc:
        "గ్రామ అభివృద్ధి నిర్ణయాలపై మీ అభిప్రాయాన్ని పోల్స్ ద్వారా తెలియజేయండి.",

      privacy: "మీ గొంతు ముఖ్యం. మీ గోప్యత ముఖ్యం.",

      privacyDesc:
        "ప్రతి గ్రామస్థుడు గ్రామ నాయకత్వంతో సులభంగా మాట్లాడేందుకు ఈ పోర్టల్ రూపొందించబడింది.",

      start: "మన కొత్త ఇదారను కలిసి అభివృద్ధి చేద్దాం",

      startDesc:
        "ప్రతి ఫిర్యాదు, సూచన మరియు ఆలోచన మార్పును తీసుకురాగలదు.",

      footer: "కొత్త ఇదార గ్రామ డిజిటల్ ఫిర్యాదుల పోర్టల్",

      viewAnnouncements: "ప్రకటనలను చూడండి",
      viewSuggestions: "సూచనను అందించండి",
      viewPolls: "పోల్స్‌లో పాల్గొనండి"
    }
  };

  const t = content[language];

  const services = [
    {
      icon: Droplets,
      title: language === "en" ? "Drinking Water" : "తాగునీరు",
      color: "blue"
    },
    {
      icon: Construction,
      title: language === "en" ? "Roads" : "రోడ్లు",
      color: "orange"
    },
    {
      icon: StreetLight,
      title: language === "en" ? "Street Lights" : "వీధి దీపాలు",
      color: "yellow"
    },
    {
      icon: Trash2,
      title: language === "en" ? "Sanitation" : "పారిశుధ్యం",
      color: "green"
    },
    {
      icon: HeartHandshake,
      title: language === "en" ? "Government Schemes" : "ప్రభుత్వ పథకాలు",
      color: "purple"
    },
    {
      icon: Lightbulb,
      title: language === "en" ? "Other Issues" : "ఇతర సమస్యలు",
      color: "pink"
    }
  ];

  return (
    <div className="app">

      {/* Navigation */}
      <header className="navbar">

        <Link
          className="brand"
          to="/"
          onClick={() => setMenuOpen(false)}
        >
          <div className="brand-icon">మ</div>

          <div>
            <h2>Mana Ooru</h2>
            <span>KOTHA IDARA VILLAGE</span>
          </div>
        </Link>

        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "nav-links open" : "nav-links"}>

          <Link to="/" onClick={() => setMenuOpen(false)}>
            {t.home}
          </Link>

          <Link
            to="/complaint"
            onClick={() => setMenuOpen(false)}
          >
            {t.complaints}
          </Link>

          <Link
            to="/track"
            onClick={() => setMenuOpen(false)}
          >
            {t.track}
          </Link>

          <Link
            to="/suggestions"
            onClick={() => setMenuOpen(false)}
          >
            {t.suggestions}
          </Link>

          <Link
            to="/announcements"
            onClick={() => setMenuOpen(false)}
          >
            {t.announcements}
          </Link>

          <Link
            to="/polls"
            onClick={() => setMenuOpen(false)}
          >
            {t.polls}
          </Link>

          <Link
            to="/statistics"
            onClick={() => setMenuOpen(false)}
          >
            {language === "en" ? "Village Statistics" : "గ్రామ గణాంకాలు"}
          </Link>

        </nav>

        <button
          className="language-btn"
          onClick={() =>
            setLanguage(language === "en" ? "te" : "en")
          }
        >
          <Globe size={17} />
          {language === "en" ? "తెలుగు" : "English"}
        </button>

      </header>

      <main>

        {/* Hero Section */}
        <section className="hero" id="home">

          <div className="hero-overlay"></div>

          <div className="hero-content">

            <span className="welcome-tag">
              WELCOME TO KOTHA IDARA VILLAGE
            </span>

            <h1>{t.title}</h1>

            <p>{t.subtitle}</p>

            <div className="hero-actions">

              <Link
                to="/complaint"
                className="primary-btn"
              >
                {t.submit}
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/track"
                className="secondary-btn"
              >
                {t.explore}
              </Link>

            </div>

            <div className="hero-note">
              <ShieldCheck size={18} />
              {t.anonymous}
            </div>

          </div>

        </section>

        {/* Services Section */}
        <section className="services section" id="services">

          <div className="section-heading">

            <span className="eyebrow">
              OUR SERVICES
            </span>

            <h2>{t.services}</h2>

            <p>{t.servicesDesc}</p>

          </div>

          <div className="service-grid">

            {services.map((service, index) => {

              const Icon = service.icon;

              return (
                <Link
                  to="/complaint"
                  className="service-card"
                  key={index}
                >

                  <div className={`service-icon ${service.color}`}>
                    <Icon size={27} />
                  </div>

                  <h3>{service.title}</h3>

                  <ArrowRight
                    className="service-arrow"
                    size={19}
                  />

                </Link>
              );

            })}

          </div>

        </section>

        {/* Features Section */}
        <section className="feature-section section" id="features">

          <div className="section-heading">

            <span className="eyebrow">
              HOW IT WORKS
            </span>

            <h2>
              Simple. Transparent. Accessible.
            </h2>

          </div>

          <div className="feature-grid">

            <article className="feature-card">

              <div className="feature-icon">
                <MessageSquare />
              </div>

              <h3>{t.complaintTitle}</h3>

              <p>{t.complaintDesc}</p>

              <Link to="/complaint">
                Submit now <ArrowRight size={16} />
              </Link>

            </article>

            <article className="feature-card">

              <div className="feature-icon">
                <Search />
              </div>

              <h3>{t.trackTitle}</h3>

              <p>{t.trackDesc}</p>

              <Link to="/track">
                Track now <ArrowRight size={16} />
              </Link>

            </article>

            <article className="feature-card">

              <div className="feature-icon">
                <Lightbulb />
              </div>

              <h3>{t.suggestionTitle}</h3>

              <p>{t.suggestionDesc}</p>

              <Link to="/suggestions">
                {t.viewSuggestions}
                <ArrowRight size={16} />
              </Link>

            </article>

            <article className="feature-card">

              <div className="feature-icon">
                <Megaphone />
              </div>

              <h3>{t.announcementTitle}</h3>

              <p>{t.announcementDesc}</p>

              <Link to="/announcements">
                {t.viewAnnouncements}
                <ArrowRight size={16} />
              </Link>

            </article>

            <article className="feature-card">

              <div className="feature-icon">
                <Vote />
              </div>

              <h3>{t.pollTitle}</h3>

              <p>{t.pollDesc}</p>

              <Link to="/polls">
                {t.viewPolls}
                <ArrowRight size={16} />
              </Link>

            </article>

          </div>

        </section>

        {/* Privacy Section */}
        <section className="privacy-section section">

          <div className="privacy-icon">
            <ShieldCheck size={36} />
          </div>

          <div>

            <h2>{t.privacy}</h2>

            <p>{t.privacyDesc}</p>

            <small>
              Note: Anonymous submission does not guarantee anonymity
              from network or hosting logs.
            </small>

          </div>

        </section>

        {/* Call to Action */}
        <section className="cta-section">

          <span>
            KOTHA IDARA VILLAGE • ANDHRA PRADESH
          </span>

          <h2>{t.start}</h2>

          <p>{t.startDesc}</p>

          <Link
            to="/complaint"
            className="primary-btn"
          >
            {t.submit}
            <ArrowRight size={18} />
          </Link>

        </section>

      </main>

      {/* Footer */}
      <footer className="footer">

        <Link className="brand footer-brand" to="/">

          <div className="brand-icon">మ</div>

          <div>
            <h2>Mana Ooru</h2>
            <span>KOTHA IDARA VILLAGE</span>
          </div>

        </Link>

        <p>
          {t.footer} © {new Date().getFullYear()}
        </p>

        <p>
          Built for the people of Kotha Idara.
        </p>

        <Link to="/president/login">
          President Login
        </Link>

        <Link to="/polls">
          {t.polls}
        </Link>

      </footer>

    </div>
  );
}


// Main application with routing
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Village Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/complaint" element={<Complaint />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/suggestions" element={<Suggestions />} />
        <Route path="/polls" element={<Polls />} />
        <Route path="/statistics" element={<PublicStatistics />} />

        {/* President Admin Pages */}
        <Route
          path="/president/login"
          element={<AdminLogin />}
        />

        <Route
          path="/president/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/president/announcements"
          element={<ManageAnnouncements />}
        />

        <Route
          path="/president/suggestions"
          element={<PresidentSuggestions />}
        />

        <Route
          path="/president/polls"
          element={<PresidentPolls />}
        />

        <Route
          path="/president/reports"
          element={<PresidentReports />}
        />

        {/* Unknown URLs */}
        <Route path="*" element={<Home />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
