# TrackBuddy 🎯

A blazing-fast, beautiful, and native macOS habit tracking application built to help you stay consistent. Inspired by the simplicity of Loop Habit Tracker and the detailed analytics of GitHub contributions, TrackBuddy serves as your personal productivity companion.

<div align="center">
  <img src="https://img.shields.io/badge/Tauri-24C8DB?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
</div>

## ✨ Features

- **Matrix UI:** A horizontal scrolling calendar matrix that allows you to log your daily habits with satisfying one-click tick/cross toggles.
- **Deep Analytics Dashboard:** Click on any habit to dive into detailed performance metrics.
- **GitHub-Style Heatmap:** A beautiful 1.5-year activity calendar to visualize your consistency over time.
- **Frequency Analysis:** Stacked bar charts providing both Weekly and Monthly breakdowns of your completed vs. missed days.
- **Streak Tracking:** Automatically calculates your *Current Streak*, *Best Streak*, and your *30-Day Completion Score*.
- **Native Performance:** Built with Tauri & Rust, providing an ultra-lightweight and fast native macOS experience.
- **Seamless Dark Mode:** A gorgeous, true-black dark theme built-in.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS v4
- **Backend/Native Core:** Tauri, Rust
- **Charts & Data:** Recharts, date-fns
- **Icons:** Lucide-React

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16+)
- [Rust](https://www.rust-lang.org/tools/install)
- Xcode Command Line Tools (for macOS native build)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trackbuddy.git
   cd trackbuddy
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Run the development server (This will compile the Rust backend and open the native window):
   ```bash
   npm run tauri dev
   ```

## 📦 Building for Production

To build a standalone `.app` or `.dmg` for macOS:
```bash
npm run tauri build
```
You will find the compiled binary in `src-tauri/target/release/bundle/`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/trackbuddy/issues).

---
*Built with ❤️ for better daily habits.*
