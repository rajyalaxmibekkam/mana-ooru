
import { API_BASE_URL } from "../config/api";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  ImagePlus,
  X,
  Mic,
  MicOff
} from "lucide-react";

import "./Complaint.css";

const API_URL = `${API_BASE_URL}/api/complaints/`;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function Complaint() {
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    location: ""
  });

  // Photo states
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("te-IN");
  const [voiceError, setVoiceError] = useState("");

  // Form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // Generate and clean up photo preview URL
  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [photo]);

  // Handle text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Handle photo selection
  const handlePhotoChange = (e) => {
    const selectedFile = e.target.files?.[0];

    setPhotoError("");
    setError("");

    if (!selectedFile) {
      setPhoto(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setPhoto(null);
      setPhotoError(
        "Please select a JPG, PNG, or WebP image."
      );
      e.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setPhoto(null);
      setPhotoError(
        "Image size must be less than 5 MB."
      );
      e.target.value = "";
      return;
    }

    setPhoto(selectedFile);
  };

  // Remove selected photo
  const removePhoto = () => {
    setPhoto(null);
    setPhotoError("");

    const fileInput = document.getElementById(
      "complaint-photo"
    );

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Telugu and English voice recognition
  const handleVoiceInput = () => {
    setVoiceError("");

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        "Voice input is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = voiceLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setFormData((previous) => ({
        ...previous,
        description: previous.description
          ? `${previous.description} ${transcript}`
          : transcript
      }));
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        setVoiceError(
          "Microphone permission denied. Please allow microphone access in your browser."
        );
      } else {
        setVoiceError(
          "Unable to recognize your voice. Please try again."
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceError(
        "Could not start voice recognition. Please try again."
      );
    }
  };

  // Submit complaint and upload photo
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setPhotoError("");
    setSuccess(null);

    if (
      !formData.category ||
      !formData.description.trim()
    ) {
      setError(
        "Please select a category and enter your complaint."
      );
      return;
    }

    if (formData.description.trim().length < 5) {
      setError(
        "Please enter at least 5 characters in your complaint."
      );
      return;
    }

    try {
      setLoading(true);

      // STEP 1: Submit complaint
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: formData.category,
          description: formData.description.trim(),
          location: formData.location.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to submit your complaint."
        );
      }

      // STEP 2: Upload photo if selected
      let photoUploaded = null;
      let uploadWarning = "";

      // Keep the upload token in memory only.
      const {
        photo_upload_token: photoUploadToken,
        ...complaintResult
      } = data;

      if (photo && data.tracking_id) {
        photoUploaded = false;

        try {
          if (!photoUploadToken) {
            throw new Error(
              "Photo upload authorization was not received. Your complaint was submitted, but the photo could not be uploaded."
            );
          }

          const uploadData = new FormData();
          uploadData.append("file", photo);

          const uploadResponse = await fetch(
            `${API_BASE_URL}/api/complaints/${encodeURIComponent(
              data.tracking_id
            )}/photo`,
            {
              method: "POST",
              headers: {
                "X-Photo-Upload-Token": photoUploadToken
              },
              body: uploadData
            }
          );

          const uploadResult =
            await uploadResponse.json();

          if (!uploadResponse.ok) {
            throw new Error(
              uploadResult.detail ||
              "Photo upload failed."
            );
          }

          photoUploaded = true;

        } catch (uploadError) {
          uploadWarning =
            uploadError.message ||
            "Photo upload failed.";
        }
      }

      // STEP 3: Display success and tracking ID
      setSuccess({
        ...complaintResult,
        photoUploaded,
        uploadWarning
      });

      setFormData({
        category: "",
        description: "",
        location: ""
      });

      setPhoto(null);

      const fileInput = document.getElementById(
        "complaint-photo"
      );

      if (fileInput) {
        fileInput.value = "";
      }

    } catch (err) {
      setError(
        err.message ||
        "Cannot connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complaint-page">

      {/* HEADER */}
      <header className="complaint-header">

        <Link to="/" className="back-link">
          <ArrowLeft size={19} />
          Back to Home
        </Link>

        <div className="complaint-brand">
          <div className="brand-icon">మ</div>

          <div>
            <h2>Mana Ooru</h2>
            <span>KOTHA IDARA VILLAGE</span>
          </div>
        </div>

      </header>

      <main className="complaint-container">

        {/* PAGE HEADING */}
        <div className="complaint-heading">

          <span className="complaint-tag">
            VILLAGE GRIEVANCE PORTAL
          </span>

          <h1>Submit Your Complaint</h1>

          <p>
            Tell us about the problem in your village.
            Your complaint will be recorded and given a tracking ID.
          </p>

        </div>

        {/* PRIVACY NOTICE */}
        <div className="privacy-notice">

          <ShieldCheck size={25} />

          <div>
            <strong>Your identity is not requested</strong>

            <p>
              You do not need to enter your name, phone number,
              or email address.
            </p>
          </div>

        </div>

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="success-message">

            <CheckCircle size={30} />

            <div>

              <h3>
                Complaint submitted successfully!
              </h3>

              <p>Your tracking ID is:</p>

              <div className="tracking-number">
                {success.tracking_id}
              </div>

              <p>
                Please save this tracking ID to check your
                complaint status later.
              </p>

              {success.photoUploaded === true && (
                <p className="photo-upload-success">
                  Your selected photo was uploaded successfully.
                </p>
              )}

              {success.photoUploaded === false && (
                <p className="photo-upload-warning">
                  Your complaint was submitted, but the photo
                  could not be uploaded: {success.uploadWarning}
                </p>
              )}

              <Link
                to="/track"
                className="track-button"
              >
                Track Your Complaint
              </Link>

            </div>

          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-message">

            <AlertCircle size={21} />

            <span>{error}</span>

          </div>
        )}

        {/* COMPLAINT FORM */}
        <form
          className="complaint-form"
          onSubmit={handleSubmit}
        >

          {/* CATEGORY */}
          <div className="form-group">

            <label htmlFor="category">
              Complaint Category *
            </label>

            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">
                Select a category
              </option>

              <option value="Drinking Water">
                Drinking Water
              </option>

              <option value="Roads">
                Roads
              </option>

              <option value="Street Lights">
                Street Lights
              </option>

              <option value="Sanitation">
                Sanitation
              </option>

              <option value="Drainage">
                Drainage
              </option>

              <option value="Electricity">
                Electricity
              </option>

              <option value="Government Schemes">
                Government Schemes
              </option>

              <option value="Other Issues">
                Other Issues
              </option>

            </select>

          </div>

          {/* LOCATION */}
          <div className="form-group">

            <label htmlFor="location">
              Problem Location
            </label>

            <input
              id="location"
              type="text"
              name="location"
              placeholder="Example: Near village water tank"
              value={formData.location}
              onChange={handleChange}
              maxLength={255}
            />

          </div>

          {/* DESCRIPTION AND VOICE INPUT */}
          <div className="form-group">

            <label htmlFor="description">
              Describe Your Problem *
            </label>

            {/* VOICE CONTROLS */}
            <div className="voice-controls">

              <select
                value={voiceLanguage}
                onChange={(e) =>
                  setVoiceLanguage(e.target.value)
                }
                disabled={isListening || loading}
                aria-label="Voice input language"
              >
                <option value="te-IN">
                  తెలుగు (Telugu)
                </option>

                <option value="en-IN">
                  English
                </option>

              </select>

              <button
                type="button"
                className="voice-input-btn"
                onClick={handleVoiceInput}
                disabled={isListening || loading}
              >

                {isListening ? (
                  <>
                    <MicOff size={18} />
                    Listening...
                  </>
                ) : (
                  <>
                    <Mic size={18} />
                    Speak Your Complaint
                  </>
                )}

              </button>

            </div>

            {voiceError && (
              <p className="voice-error">
                {voiceError}
              </p>
            )}

            {/* TEXTAREA */}
            <textarea
              id="description"
              name="description"
              placeholder="Explain your problem clearly or use the microphone..."
              value={formData.description}
              onChange={handleChange}
              minLength={5}
              maxLength={5000}
              rows={6}
              required
            />

            <small>
              {formData.description.length}/5000 characters
            </small>

          </div>

          {/* PHOTO UPLOAD */}
          <div className="form-group photo-upload-group">

            <label htmlFor="complaint-photo">
              Attach Problem Photo (Optional)
            </label>

            <div className="photo-upload-box">

              <ImagePlus size={28} />

              <p>
                Upload a photo showing the village problem
              </p>

              <input
                id="complaint-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={loading}
              />

              <small>
                JPG, PNG or WebP. Maximum size: 5 MB.
              </small>

            </div>

            {photoError && (
              <p className="photo-error">
                {photoError}
              </p>
            )}

            {/* PHOTO PREVIEW */}
            {photoPreview && (
              <div className="photo-preview-container">

                <img
                  src={photoPreview}
                  alt="Selected complaint"
                  className="photo-preview"
                />

                <div className="photo-preview-actions">

                  <span>{photo.name}</span>

                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={removePhoto}
                    disabled={loading}
                  >
                    <X size={16} />
                    Remove Photo
                  </button>

                </div>

              </div>
            )}

          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="submit-complaint-btn"
            disabled={loading || isListening}
          >

            {loading ? (
              "Submitting..."
            ) : (
              <>
                Submit Complaint
                <Send size={18} />
              </>
            )}

          </button>

          <p className="form-footer">
            Fields marked with * are required.
          </p>

        </form>

      </main>

    </div>
  );
}

export default Complaint;
