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
  const PAUSE_PER_SPACE = 300;

  const BUTTON_OFFSET_X = -12;
  const BUTTON_OFFSET_Y = 8;

  const START_TIMEOUT_MS = 5000;
  const END_TIMEOUT_BASE_MS = 10000;
  const END_TIMEOUT_PER_CHARACTER_MS = 500;

  const synth = window.speechSynthesis;

  let selectedText = "";
  let currentToken = 0;
  let activePass = null;

  const wait = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  const engineBusy = () =>
    synth.speaking || synth.pending;

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
    fontSize: "18px",
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
    fontSize: "14px",
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
    fontSize: "18px",
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
    fontSize: "14px",
    cursor: "pointer"
  });

  // ========================================
  // Assemble Playback Bar
  // ========================================

  playbackBar.append(
    repeatCounter,
    playbackText,
    stopButton
  );

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

    if (activePass) {
      activePass.abort();
    }

    synth.cancel();
    hidePlaybackBar();
  }

  stopButton.addEventListener("click", stopPlayback);

  // ========================================
  // Detect Text Selection
  // ========================================

  document.addEventListener("mouseup", event => {
    if (
      event.target === button ||
      event.target === stopButton ||
      event.target === repeatCounter ||
      event.target === playbackText ||
      playbackBar.contains(event.target)
    ) {
      return;
    }

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString();

      if (
        !text ||
        !text.trim() ||
        selection.rangeCount === 0
      ) {
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

  document.addEventListener("mousedown", event => {
    if (event.target !== button) {
      button.style.display = "none";
    }
  });

  // ========================================
  // Get Microsoft Voices
  // ========================================

  async function getVoices() {
    let voices = synth.getVoices();

    for (
      let i = 0;
      i < 20 && voices.length === 0;
      i++
    ) {
      await wait(200);
      voices = synth.getVoices();
    }

    return voices;
  }

  // ========================================
  // Wait for Speech Engine
  // ========================================

  async function settleEngine(token) {
    for (
      let i = 0;
      i < 10 && engineBusy();
      i++
    ) {
      if (token !== currentToken) {
        return false;
      }

      await wait(50);
    }

    return token === currentToken;
  }

  // ========================================
  // Speech Helper with Timeout Protection
  // ========================================

  function speakPass(text, voice, token) {
    let resolvePass;
    let finished = false;
    let started = false;
    let attempts = 0;
    let utterance = null;
    let timer = null;
    let sentAt = 0;

    const promise = new Promise(resolve => {
      resolvePass = resolve;
    });

    function finish(status) {
      if (finished) return;

      finished = true;
      clearInterval(timer);

      if (activePass?.abort === abort) {
        activePass = null;
      }

      if (
        status !== "ok" &&
        status !== "aborted"
      ) {
        console.warn(
          "[Speech Repeater]",
          status,
          { text }
        );
      }

      resolvePass(status);
    }

    function abort() {
      finish("aborted");
    }

    function send() {
      if (
        finished ||
        token !== currentToken
      ) {
        return finish("aborted");
      }

      attempts++;
      started = false;
      sentAt = performance.now();

      const thisAttempt = attempts;

      const item =
        new SpeechSynthesisUtterance(text);

      utterance = item;

      item.voice = voice;
      item.lang = "en-US";
      item.rate = RATE;

      item.onstart = () => {
        if (
          finished ||
          thisAttempt !== attempts ||
          token !== currentToken
        ) {
          return;
        }

        started = true;
      };

      item.onend = () => {
        if (
          finished ||
          thisAttempt !== attempts ||
          token !== currentToken
        ) {
          return;
        }

        finish("ok");
      };

      item.onerror = event => {
        if (
          finished ||
          thisAttempt !== attempts ||
          token !== currentToken
        ) {
          return;
        }

        finish(`error: ${event.error}`);
      };

      synth.speak(item);
    }

    activePass = { abort };

    send();

    timer = setInterval(() => {
      if (finished) return;

      if (token !== currentToken) {
        return finish("aborted");
      }

      const elapsed =
        performance.now() - sentAt;

      // Speech has not started
      if (!started) {
        if (
          !engineBusy() &&
          elapsed >= 1500 &&
          attempts < 2
        ) {
          send();
          return;
        }

        if (elapsed >= START_TIMEOUT_MS) {
          synth.cancel();
          finish("start timeout");
        }

        return;
      }

      // Speech started but may not have ended
      if (!engineBusy()) {
        finish("ok");
      } else if (
        elapsed >=
        END_TIMEOUT_BASE_MS +
        text.length *
        END_TIMEOUT_PER_CHARACTER_MS
      ) {
        synth.cancel();
        finish("completion timeout");
      }
    }, 250);

    return promise;
  }

  // ========================================
  // Start Reading and Copy Text
  // ========================================

  button.addEventListener("click", async () => {
    button.style.display = "none";

    // Preserve complete selection
    const fullText = selectedText;

    // Read only the first line
    const text = fullText
      .split(/\r\n|\r|\n/)[0]
      .trim();

    // Force-stop previous playback
    const wasBusy =
      engineBusy() ||
      activePass !== null;

    stopPlayback();

    const token = currentToken;

    // Copy complete selected text
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(fullText)
        .catch(error => {
          console.error(
            "Failed to copy selected text:",
            error
          );
        });
    } else {
      console.warn(
        "Clipboard API is not available on this page."
      );
    }

    if (!text) return;

    // Show playback bar
    showPlaybackBar(text);

    // Allow previous cancellation to settle
    if (wasBusy) {
      await wait(150);
    }

    if (!(await settleEngine(token))) {
      return;
    }

    // Get voices
    const voices = await getVoices();

    if (token !== currentToken) {
      return;
    }

    const andrew = voices.find(v =>
      v.name === ANDREW &&
      v.lang === "en-US"
    );

    const ava = voices.find(v =>
      v.name === AVA &&
      v.lang === "en-US"
    );

    const emma = voices.find(v =>
      v.name === EMMA &&
      v.lang === "en-US"
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

    // Calculate pause duration
    const spaceCount =
      (text.match(/ /g) || []).length;

    const pauseDuration =
      spaceCount * PAUSE_PER_SPACE;

    // ========================================
    // Repeat Reading
    // ========================================

    for (
      let i = 0;
      i < REPEAT_COUNT;
      i++
    ) {
      if (token !== currentToken) {
        return;
      }

      if (!(await settleEngine(token))) {
        return;
      }

      // Update repetition counter
      repeatCounter.textContent =
        String(i + 1);

      // Alternate Andrew and Ava
      const voice =
        i % 2 === 0 ? andrew : ava;

      const status =
        await speakPass(text, voice, token);

      if (token !== currentToken) {
        return;
      }

      if (status !== "ok") {
        stopPlayback();
        return;
      }

      // Pause after every repetition
      await wait(pauseDuration);
    }

    if (token !== currentToken) {
      return;
    }

    // ========================================
    // Final Encouragement
    // ========================================

    // Hide bar before Emma says Good!
    hidePlaybackBar();

    if (!(await settleEngine(token))) {
      return;
    }

    await speakPass("Good!", emma, token);
  });

  // ========================================
  // Cleanup
  // ========================================

  window.addEventListener(
    "pagehide",
    stopPlayback
  );
})();