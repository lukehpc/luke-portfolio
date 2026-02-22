# TransFlow | Minimalist CAT Tool Prototype

TransFlow is a web-based **Computer-Assisted Translation (CAT)** tool prototype designed to demonstrate modern translation workflow logic, including Translation Memory (TM), Fuzzy Matching, and Term Base management.

## 🚀 Technical Features

- **Translation Memory (TM):** Automatically stores translations in `localStorage`. Confirmed translations are reused for identical segments to ensure consistency.
- **Levenshtein Fuzzy Matching:** Implements a similarity algorithm to suggest translations for near-matches (e.g., segments with >70% similarity).
- **Quality Assurance (QA) Engine:** Real-time checks for punctuation mismatches and empty segments to prevent errors.
- **Term Base (Glossary):** Allows users to define "must-use" terms. The tool automatically scans and highlights these terms within the source text.
- **Professional UX:** - Discreet progress tracking.
  - Power-user keyboard shortcuts (`Ctrl+Enter`, `Alt+Arrows`, `Ctrl+Insert`).
  - Dark/Light mode dashboard aesthetic.

## 🛠️ Built With

- **HTML5 / CSS3:** Custom neon-on-dark dashboard styling.
- **JavaScript (Vanilla):** Custom segmentation logic and similarity algorithms.
- **LocalStorage API:** For stateless data persistence across sessions.

## ⌨️ Keyboard Shortcuts

- `Ctrl + Enter`: Confirm translation and move to next segment.
- `Ctrl + Insert`: Copy source text directly to target input.
- `Alt + Up/Down`: Navigate through translation segments.
- `Ctrl + S`: Manual project save.
- `Ctrl + 1`: Apply the highest-scoring fuzzy match.

---
Built by Luke Cairncross | 2026 Portfolio Project