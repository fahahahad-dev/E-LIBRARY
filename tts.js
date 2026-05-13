// tts.js
// Text-to-speech + language helpers (kept identical to original)

function readAloud(text) {
  if (typeof speechSynthesis === "undefined") {
    console.warn("Speech synthesis not available");
    return;
  }

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return;

  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 10;

    const tryVoices = () => {
      let voices = speechSynthesis.getVoices();
      console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));

      if (voices.length === 0 && attempts < maxAttempts) {
        attempts++;
        setTimeout(tryVoices, 250);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // pick language based on currentBookLang
      const lang = currentBookLang === "da-DK" ? "da-DK" : "en-US";
      utterance.lang = lang;

      let voice = voices.find(v => v.lang === lang);

      // fallback if not found
      if (!voice) {
        voice = voices.find(v => v.lang.startsWith(lang.split("-")[0]));
      }

      if (voice) {
        console.log(`Using voice: ${voice.name} (${voice.lang})`);
        utterance.voice = voice;
      } else {
        console.warn(`No ${lang} voice found, using default system voice`);
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        resolve();
      };

      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Speech synthesis error:", error);
        resolve();
      }
    };

    tryVoices();
  });
}

// Add a function to set the language
function setBookLanguage(lang) {
  currentBookLang = lang;
  console.log("Book language set to:", lang);
}

// Make the function available globally
window.setBookLanguage = setBookLanguage;

// Add this helper function to check voices
function checkVoices() {
  if (typeof speechSynthesis === "undefined") {
    console.warn("Speech synthesis not available for checkVoices");
    return;
  }
  const voices = speechSynthesis.getVoices();
  console.log("=== Available Voices ===");
  voices.forEach(voice => {
    console.log(`Name: ${voice.name}`);
    console.log(`Language: ${voice.lang}`);
    console.log(`Local service: ${voice.localService}`);
    console.log("---");
  });
}

// Call this when voices change
if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.onvoiceschanged = () => {
    console.log("Voices changed event triggered");
    checkVoices();
  };
}

// expose readAloud in case other modules want to call it directly
window.readAloud = readAloud;
window.checkVoices = checkVoices;
