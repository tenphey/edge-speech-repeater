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

  // Floating button position relative to mouse release
  const BUTTON_OFFSET_X = -12;
  const BUTTON_OFFSET_Y = 8;

  const synth = window.speechSynthesis;

  let selectedText = "";
  let currentToken = 0;

  // ========================================
  // Floating Button
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
  // Detect Text Selection
  // ========================================

  document.addEventListener("mouseup", (event) => {
    // Ignore clicks on the floating button
    if (event.target === button) return;

    // Capture mouse position when released
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || selection.rangeCount === 0) {
        button.style.display = "none";
        return;
      }

      selectedText = text;

      // Position button near mouse release point
      button.style.left =
        `${mouseX + window.scrollX + BUTTON_OFFSET_X}px`;

      button.style.top =
        `${mouseY + window.scrollY + BUTTON_OFFSET_Y}px`;

      button.style.display = "block";
    }, 0);
  });

  // ========================================
  // Hide Button When Clicking Elsewhere
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
      await new Promise(resolve =>
        setTimeout(resolve, 200)
      );

      voices = synth.getVoices();
    }

    return voices;
  }

  // ========================================
  // Speech Helper
  // ========================================

  function speak(text, voice) {
    return new Promise(resolve => {
      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.voice = voice;
      utterance.lang = "en-US";
      utterance.rate = RATE;

      utterance.onend = resolve;
      utterance.onerror = resolve;

      synth.speak(utterance);
    });
  }

  // ========================================
  // Start Reading
  // ========================================

  button.addEventListener("click", async () => {
    button.style.display = "none";

    const token = ++currentToken;

    // Stop previous speech
    synth.cancel();

    // Capture selected text for this task
    const text = selectedText;

    // Find voices
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
      return;
    }

    // ========================================
    // Calculate Pause Duration
    // ========================================

    const spaceCount =
      (text.match(/ /g) || []).length;

    const pauseDuration =
      spaceCount * PAUSE_PER_SPACE;

    // ========================================
    // Repeat Reading 10 Times
    // ========================================

    for (let i = 0; i < REPEAT_COUNT; i++) {
      if (token !== currentToken) return;

      // Alternate Andrew and Ava
      const voice =
        i % 2 === 0 ? andrew : ava;

      await speak(text, voice);

      if (token !== currentToken) return;

      // Pause after EVERY repetition,
      // including the 10th repetition
      await new Promise(resolve =>
        setTimeout(resolve, pauseDuration)
      );
    }

    // ========================================
    // Final "Good!" Using Emma
    // ========================================

    if (token !== currentToken) return;

    await speak("Good!", emma);
  });

})();