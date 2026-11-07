(() => {
  "use strict";

  // ========================================
  // Configuration
  // ========================================

  const ANDREW =
    "Microsoft Andrew Multilingual Online (Natural) - English (United States)";

  const AVA =
    "Microsoft Ava Multilingual Online (Natural) - English (United States)";

  const EMMA =
    "Microsoft Emma Multilingual Online (Natural) - English (United States)";

  const REPEAT_COUNT = 10;
  const RATE = 0.8;
  const PAUSE_PER_SPACE = 250; // milliseconds

  const BUTTON_OFFSET_X = -12;
  const BUTTON_OFFSET_Y = 8;

  const synth = window.speechSynthesis;

  let selectedText = "";
  let currentToken = 0;

  // ========================================
  // Floating Play Button
  // ========================================

  const button = document.createElement("button");
  button.textContent = "▶";

  Object.assign(button.style, {
    position: "absolute",
    zIndex: "2147483647",
    width: "34px",
    height: "34px",
    border: "none",
    borderRadius: "50%",
    background: "#2563eb",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    display: "none"
  });

  document.documentElement.appendChild(button);

  // ========================================
  // Fixed Playback Bar
  // ========================================

  const playbackBar = document.createElement("div");

  Object.assign(playbackBar.style, {
    position: "fixed",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "max-content",
    maxWidth: "calc(100vw - 32px)",
    boxSizing: "border-box",
    zIndex: "2147483647",
    background: "#000000",
    color: "#ffff00",
    padding: "10px 14px",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    borderRadius: "6px",
    fontFamily: "Verdana, sans-serif",
    fontSize: "30px",
    lineHeight: "1.5",
    boxShadow: "0 2px 8px rgba(0,0,0,0.35)"
  });

  // ========================================
  // Repetition Counter
  // ========================================

  const repeatCounter = document.createElement("span");
  repeatCounter.textContent = "1";

  Object.assign(repeatCounter.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "30px",
    height: "30px",
    boxSizing: "border-box",
    background: "#333333",
    color: "#ffff00",
    border: "1px solid #ffff00",
    borderRadius: "4px",
    fontFamily: "Verdana, sans-serif",
    fontSize: "30px",
    fontWeight: "400",
    fontVariantNumeric: "tabular-nums"
  });

  // ========================================
  // Playback Text
  // ========================================

  const playbackText = document.createElement("span");

  Object.assign(playbackText.style, {
    minWidth: "0",
    overflowWrap: "anywhere",
    fontFamily: "Verdana, sans-serif",
    fontSize: "30px",
    fontWeight: "400"
  });

  // ========================================
  // Stop Button
  // ========================================

  const stopButton = document.createElement("button");
  stopButton.textContent = "■";
  stopButton.title = "Stop playback";
  stopButton.setAttribute("aria-label", "Stop playback");

  Object.assign(stopButton.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "30px",
    height: "30px",
    boxSizing: "border-box",
    background: "#333333",
    color: "#ffff00",
    border: "1px solid #ffff00",
    borderRadius: "4px",
    padding: "0",
    fontFamily: "Verdana, sans-serif",
    fontSize: "30px",
    cursor: "pointer"
  });

  // ========================================
  // Assemble Playback Bar
  // ========================================

  playbackBar.appendChild(repeatCounter);
  playbackBar.appendChild(playbackText);
  playbackBar.appendChild(stopButton);

  document.documentElement.appendChild(playbackBar);

  function showPlaybackBar(text) {
    repeatCounter.textContent = "1";
    playbackText.textContent = text;
    playbackBar.style.display = "flex";
  }

  function hidePlaybackBar() {
    playbackBar.style.display = "none";
  }

  // ========================================
  // Stop Playback
  // ========================================

  function stopPlayback() {
    currentToken++;
    synth.cancel();
    hidePlaybackBar();
  }

  stopButton.addEventListener("click", stopPlayback);

  // ========================================
  // Detect Text Selection
  // ========================================

  document.addEventListener("mouseup", (event) => {
    if (
      event.target === button ||
      event.target === stopButton ||
      event.target === repeatCounter ||
      event.target === playbackText
    ) {
      return;
    }

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString();

      if (!text || !text.trim() || selection.rangeCount === 0) {
        button.style.display = "none";
        return;
      }

      selectedText = text;

      button.style.left =
        `${mouseX + window.scrollX + BUTTON_OFFSET_X}px`;

      button.style.top =
        `${mouseY + window.scrollY + BUTTON_OFFSET_Y}px`;

      button.style.display = "block";
    }, 0);
  });

  // ========================================
  // Hide Floating Play Button
  // ========================================

  document.addEventListener("mousedown", (event) => {
    if (event.target !== button) {
      button.style.display = "none";
    }
  });

  // ========================================
  // Get Microsoft Voices
  // ========================================

  async function getVoices() {
    let voices = synth.getVoices();

    for (let i = 0; i < 20 && voices.length === 0; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      voices = synth.getVoices();
    }

    return voices;
  }

  // ========================================
  // Speech Helper
  // ========================================

  function speak(text, voice) {
    return new Promise(resolve => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.voice = voice;
      utterance.lang = "en-US";
      utterance.rate = RATE;

      utterance.onend = resolve;
      utterance.onerror = resolve;

      synth.speak(utterance);
    });
  }

  // ========================================
  // Start Reading and Copy Text
  // ========================================

  button.addEventListener("click", async () => {
    button.style.display = "none";

    const token = ++currentToken;

    synth.cancel();

    // Preserve the complete selection for clipboard
    const fullText = selectedText;

    // Read only the first line
    const text = fullText
      .split(/\r\n|\r|\n/)[0]
      .trim();

    // Copy the complete selected text
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullText).catch(error => {
        console.error("Failed to copy selected text:", error);
      });
    } else {
      console.warn("Clipboard API is not available on this page.");
    }

    if (!text) return;

    // Show playback bar
    showPlaybackBar(text);

    const voices = await getVoices();

    if (token !== currentToken) return;

    const andrew = voices.find(v =>
      v.name === ANDREW && v.lang === "en-US"
    );

    const ava = voices.find(v =>
      v.name === AVA && v.lang === "en-US"
    );

    const emma = voices.find(v =>
      v.name === EMMA && v.lang === "en-US"
    );

    if (!andrew || !ava || !emma) {
      console.error(
        "Required Microsoft voices not found:",
        {
          Andrew: !!andrew,
          Ava: !!ava,
          Emma: !!emma
        }
      );

      hidePlaybackBar();
      return;
    }

    // Calculate pause duration based on spaces
    const spaceCount = (text.match(/ /g) || []).length;
    const pauseDuration = spaceCount * PAUSE_PER_SPACE;

    // ========================================
    // Repeat Reading
    // ========================================

    for (let i = 0; i < REPEAT_COUNT; i++) {
      if (token !== currentToken) return;

      // Update only the repetition counter
      repeatCounter.textContent = String(i + 1);

      // Alternate Andrew and Ava
      const voice = i % 2 === 0 ? andrew : ava;

      await speak(text, voice);

      if (token !== currentToken) return;

      // Pause after every repetition, including the last
      await new Promise(resolve =>
        setTimeout(resolve, pauseDuration)
      );
    }

    if (token !== currentToken) return;

    // Hide playback bar after completion
    hidePlaybackBar();
    
    // Final encouragement
    await speak("Good!", emma);

    if (token !== currentToken) return;


  });
})();