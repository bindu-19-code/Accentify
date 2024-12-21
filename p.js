// Example functionality for Speak and Pause buttons
let isSpeaking = false;
let speechSynthesisInstance = null;
let currentUtterance = null; // Track the current utterance for pause/resume
let uploadedFile = null; // Store uploaded image file
let capturedImageDataUrl = null; // Store captured image data URL

// HTML Elements
const imageUpload = document.getElementById("imageUpload");
const textOutput = document.getElementById("textOutput");
const extractButton = document.getElementById("extractButton");
const speakButton = document.getElementById("speakButton");
const pauseResumeButton = document.getElementById("pauseResumeButton");
const accentSelect = document.getElementById("accentSelect");
const cameraPreview = document.getElementById("cameraPreview");
const captureButton = document.getElementById("captureButton");
const capturedImagePreview = document.getElementById("capturedImagePreview");
const snapshotCanvas = document.createElement("canvas");
const snapshotContext = snapshotCanvas.getContext("2d");
const pitchControl = document.getElementById("pitchControl");
const rateControl = document.getElementById("rateControl");
const pitchValue = document.getElementById("pitchValue");
const rateValue = document.getElementById("rateValue");

// Update Pitch and Rate display values
pitchControl.addEventListener("input", () => {
  pitchValue.textContent = pitchControl.value;
});

rateControl.addEventListener("input", () => {
  rateValue.textContent = rateControl.value;
});

// Start Camera Stream
function startCamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        cameraPreview.srcObject = stream;
      })
      .catch((error) => {
        console.error("Camera access denied:", error);
        alert(
          "Unable to access camera. Please allow camera access or try a different device."
        );
      });
  } else {
    alert("Camera not supported in your browser.");
  }
}

// Capture Image and Display Preview
captureButton.addEventListener("click", () => {
  snapshotCanvas.width = cameraPreview.videoWidth;
  snapshotCanvas.height = cameraPreview.videoHeight;

  snapshotContext.drawImage(
    cameraPreview,
    0,
    0,
    snapshotCanvas.width,
    snapshotCanvas.height
  );

  capturedImageDataUrl = snapshotCanvas.toDataURL("image/png");
  capturedImagePreview.src = capturedImageDataUrl;
  capturedImagePreview.style.display = "block";

  textOutput.value = "Image captured. Click 'Extract Text' to process.";
});

// Handle Image Upload
imageUpload.addEventListener("change", (event) => {
  uploadedFile = event.target.files[0];
  if (uploadedFile) {
    textOutput.value = "Image uploaded. Click 'Extract Text' to process.";
  }
});

// Handle Text Extraction
extractButton.addEventListener("click", () => {
  if (!capturedImageDataUrl && !uploadedFile) {
    alert("Please capture or upload an image first!");
    return;
  }

  textOutput.value = "Processing...";
  let imageForTextExtraction;

  if (capturedImageDataUrl) {
    imageForTextExtraction = capturedImageDataUrl;
  } else if (uploadedFile) {
    imageForTextExtraction = URL.createObjectURL(uploadedFile);
  }

  Tesseract.recognize(imageForTextExtraction, "eng")
    .then(({ data: { text } }) => {
      textOutput.value = text.trim();
    })
    .catch((error) => {
      console.error("Error:", error);
      textOutput.value = "Error extracting text.";
    });
});

// Populate Available Voices Dynamically
function populateVoices() {
  const voices = window.speechSynthesis.getVoices();

  accentSelect.innerHTML = ""; // Clear previous options

  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    accentSelect.appendChild(option);
  });

  if (voices.length === 0) {
    const option = document.createElement("option");
    option.textContent = "No voices available. Please reload.";
    accentSelect.appendChild(option);
  }
}

if (window.speechSynthesis.onvoiceschanged !== undefined) {
  window.speechSynthesis.onvoiceschanged = populateVoices;
} else {
  populateVoices();
}

// Text-to-Speech Functionality (Browser-based)
speakButton.addEventListener("click", () => {
  const text = textOutput.value;
  const selectedVoiceName = accentSelect.value;

  if (!text) {
    alert("Please extract text first.");
    return;
  }

  currentUtterance = new SpeechSynthesisUtterance(text);

  window.speechSynthesis.cancel(); // Cancel ongoing speech

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(
    (voice) => voice.name === selectedVoiceName
  );

  if (selectedVoice) {
    currentUtterance.voice = selectedVoice;
    currentUtterance.lang = selectedVoice.lang;
  }

  // Set pitch and rate from controls
  currentUtterance.pitch = parseFloat(pitchControl.value);
  currentUtterance.rate = parseFloat(rateControl.value);

  window.speechSynthesis.speak(currentUtterance);

  pauseResumeButton.textContent = "Pause";
  document.getElementById("pauseIcon").style.display = "block"; // Show Pause icon
  document.getElementById("playIcon").style.display = "none"; // Hide Play icon
});

// Pause/Resume Speech Functionality
pauseResumeButton.addEventListener("click", () => {
  if (window.speechSynthesis.speaking) {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      pauseResumeButton.textContent = "Pause"; // Update text to "Pause"
      document.getElementById("pauseIcon").style.display = "block"; // Show Pause icon
      document.getElementById("playIcon").style.display = "none"; // Hide Play icon
    } else {
      window.speechSynthesis.pause();
      pauseResumeButton.textContent = "Resume"; // Update text to "Resume"
      document.getElementById("pauseIcon").style.display = "none"; // Hide Pause icon
      document.getElementById("playIcon").style.display = "block"; // Show Play icon
    }
  }
});

// Copy Button Functionality
document.getElementById("copyButton").addEventListener("click", function () {
  const textOutput = document.getElementById("textOutput");
  textOutput.select();
  textOutput.setSelectionRange(0, 99999); // For mobile devices
  navigator.clipboard
    .writeText(textOutput.value)
    .then(() => alert("Text copied to clipboard!"))
    .catch((err) => console.error("Failed to copy text: ", err));
});

// Initialize Camera on Page Load
startCamera();
