# Edge Speech Repeater

**Listen. Repeat. Improve.**

Edge Speech Repeater is a lightweight Microsoft Edge extension for English listening and speaking practice. Select text on a webpage and click a floating play button to hear it repeated using Microsoft Edge's natural online voices.

## Features

- **Quick access:** Select text to show a floating **▶** button near the point where you release the mouse.
- **Ten readings:** Microsoft **Andrew** and **Ava** alternate, five readings each.
- **Length-based pauses:** After each reading, including the tenth, the extension pauses for **0.3 seconds per ordinary space** in the selected text.
- **Completion cue:** Microsoft **Emma** says **“Good!”** after the final pause.
- **Simple setup:** No account, API key, separate server, or settings page is required.

## How to use

1. Highlight an English word or sentence on a webpage in Microsoft Edge.
2. Release the mouse to reveal the floating **▶** button.
3. Click the button to start playback.
4. Listen as Andrew and Ava alternate for ten readings. Emma says **“Good!”** when the sequence finishes.

For example, `I love learning English.` contains three ordinary spaces. The pause after each reading is therefore **3 × 0.3 = 0.9 seconds**. A single word contains no spaces, so no additional pause is configured; a brief natural playback gap may still occur.

## Voices

| Reading | Voice | Spoken text |
| --- | --- | --- |
| 1, 3, 5, 7, 9 | Microsoft Andrew Multilingual Online (Natural) | Selected text |
| 2, 4, 6, 8, 10 | Microsoft Ava Multilingual Online (Natural) | Selected text |
| Completion | Microsoft Emma Multilingual Online (Natural) | `Good!` |

All three voices use **English (United States)** (`en-US`). The speech rate is set to `1.0`.

## Installation

1. Clone the repository or download its source files:

   ```bash
   git clone git@github.com:tenphey/edge-speech-repeater.git
   ```

2. Open `edge://extensions/` in Microsoft Edge.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose the folder containing `manifest.json`.
5. Open or refresh a regular webpage and select some English text.

The extension is intended for use in Microsoft Edge with the required online voices available. These voices require network access and may not be available in every environment.

## Configuration

The current version keeps its settings in `content.js`:

```javascript
const REPEAT_COUNT = 10;
const RATE = 1.0;
const PAUSE_PER_SPACE = 300; // milliseconds
const BUTTON_OFFSET_X = 8;
const BUTTON_OFFSET_Y = 8;
```

To change a value, edit `content.js`, reload the extension on `edge://extensions/`, and refresh the webpage.

## Project files

```text
edge-speech-repeater/
├── manifest.json
├── content.js
├── README.md
└── LICENSE
```

## Notes and limitations

- The extension uses Edge's Web Speech API (`window.speechSynthesis`) and the named Microsoft online voices.
- Each reading invokes `speechSynthesis.speak()`. The browser manages speech synthesis and any underlying network activity; the extension does not download or store audio files.
- A zero-length configured pause does not guarantee seamless audio between readings.
- Browser-protected pages may prevent extensions from injecting scripts. Text selections in input fields or frames may not work as expected.
- Starting another reading cancels the previous task. There is currently no separate stop or pause button.

## Privacy

The extension has no separate account system, analytics service, or application backend. It passes selected text to Edge's speech synthesis interface. Microsoft online voices may process text through Microsoft's services, so avoid using sensitive text unless you are comfortable with the applicable service and privacy terms.

## Contributing

Bug reports and pull requests are welcome. When reporting a problem, please include your Edge version, operating system, and steps to reproduce it.

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## Disclaimer

Edge Speech Repeater is an independent open-source project and is not affiliated with or endorsed by Microsoft. Microsoft Edge and the Microsoft voice names belong to their respective owners.
