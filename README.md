# TrackBuddy 🎯

A blazing-fast, beautiful, and native macOS habit tracking application built to help you stay consistent. Inspired by the simplicity of Loop Habit Tracker and the detailed analytics of GitHub contributions, TrackBuddy serves as your personal productivity companion.

<div align="center">
  <img src="https://img.shields.io/badge/Tauri-24C8DB?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
</div>

## ✨ Features

- **Matrix UI Grid:** A beautiful, horizontally scrolling calendar matrix that allows you to log your daily habits with satisfying one-click tick/cross toggles.
- **Deep Analytics Dashboard:** Click on any habit to dive into detailed performance metrics powered by interactive charts.
- **Global Activity Calendar:** A GitHub-style contribution graph (heatmap) covering a 1.5-year span to visualize your consistency over time.
- **Drag & Drop Sorting:** Reorder your habits effortlessly with a smooth drag-and-drop experience powered by `@dnd-kit`.
- **Inline Operations:** Click the drag handle to open inline options to edit habit names or delete them safely.
- **Native Confirmation Dialogs:** Uses native macOS dialog alerts for sensitive operations like deleting habits.
- **Persistent Local Storage:** Migrated from fragile browser storage to Tauri's official JSON Store. Your data is saved securely in your system's `Application Support` folder, making it App Store ready.
- **Seamless Dark Mode:** A gorgeous, true-black dark theme that respects your macOS system preferences.

## 🛠️ Tech Stack

- **Frontend Framework:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4 (with native glassmorphism and smooth micro-animations)
- **Native Desktop Core:** Tauri v2 (Rust)
- **Charts & Visualization:** Chart.js, React-Chartjs-2
- **Data & Date Manipulation:** date-fns
- **UI Interactions:** @dnd-kit (Sortable lists), Lucide-React (Icons)
- **Native Plugins:** `@tauri-apps/plugin-store` (Secure file-based JSON persistence), `@tauri-apps/plugin-dialog` (Native system dialogs)

## 🚀 Getting Started (Run on your Mac)

### Prerequisites
Make sure you have the following installed on your machine:
1. **Node.js** (v18+ recommended) -> [Download here](https://nodejs.org/)
2. **Rust** (Required for Tauri to compile the native app) -> Run `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` in terminal.
3. **Xcode Command Line Tools** (For macOS compilation) -> Run `xcode-select --install` in terminal.

### Installation & Local Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ZainDhariwal/TrackBuddy.git
   cd TrackBuddy
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run tauri dev
   ```
   *Note: On the first run, Tauri will take a few minutes to download Rust crates and compile the backend. Subsequent launches will be near-instantaneous!*

## 📦 Building for Production

To generate a standalone `.app` or `.dmg` installer for your macOS:
```bash
npm run tauri build
```
Once the build is complete, you will find the compiled `.dmg` or `.app` in the following directory:
`src-tauri/target/release/bundle/dmg/`

Move the file to your **Applications** folder and you are good to go!

---
*Built with ❤️ for better daily habits.*
