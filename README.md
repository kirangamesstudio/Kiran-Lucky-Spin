# Kiran Lucky Spin 🎡

A premium virtual lucky spin wheel mobile game designed with smooth physics easing, dual-chime audio synthesis, simulated haptic vibrations, local check-in streaks, user statistic levels, global mock leaderboards, and simulated AdMob rewarded/banner ad configurations.

This project is built using **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**. It is fully pre-configured to be compiled and converted into a native Android application using **Capacitor** by Kiran Games Studio.

---

## 🚀 Key Features

- **Physically Eased Spin Wheel**: High-fidelity custom canvas renderer with real-time arrow/peg tick collision sounds and blinking light bulbs.
- **Durable Local Persistence**: Automated backup for virtual coins, daily login streaks, experience levels, and user settings using the browser's LocalStorage API.
- **Capacitor Mobile Optimized**: Pre-configured viewport ratios and metadata targeting mobile phone screen layouts perfectly.
- **Audio & Haptic Simulation**: Interactive Web Audio API dual-oscillator sound effects (clicks, spins, coin chimes, and trumpets) and device vibration patterns.
- **Interactive Daily Check-In**: 7-Day rewards calendar with progressive streak bonuses.
- **Simulated Ad Stations**: Banner ad footers and interactive Rewarded Ads offering free extra spins or virtual gold coins.
- **Global Standings**: Live mock leaderboard that sorts dynamically based on your offline coin score against challenging bot profiles.

---

## 🛠️ Local Development & Web Run

Follow these instructions to download and run the web build on your computer:

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) installed on your machine (v18 or higher recommended).

### 2. Install Dependencies
In your project root folder, execute:
```bash
npm install
```

### 3. Run Development Server
Start the local server with hot module replacement:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) or the port indicated in your console.

### 4. Build Static Web Assets
Compile and optimize TypeScript + React components into the production-ready static folder `dist`:
```bash
npm run build
```

---

## 🤖 Native Android Build Instructions (Capacitor)

Convert this codebase into a fully functional native Android app package (APK) using Capacitor:

### 1. Install Capacitor CLI & Core
Install the necessary Capacitor packages as dependencies:
```bash
npm install @capacitor/core @capacitor/cli
```

### 2. Initialize Capacitor Project
Initialize the configuration targeting our game app:
```bash
npx cap init "Kiran Lucky Spin" "com.kirangames.luckyspin" --web-dir=dist
```

### 3. Add Android Platform
Install the Android package and integrate the folder structures:
```bash
npm install @capacitor/android
npx cap add android
```

### 4. Build and Sync Files
Compile the React code and copy the assets straight into the Android project directory:
```bash
npm run build
npx cap sync android
```

### 5. Launch in Android Studio
Open the synchronized project inside Android Studio to run the emulation, debug, or sign and export your production-ready `.apk` / `.aab` file:
```bash
npx cap open android
```

---

## 🎨 Tech Stack
- **Framework**: React 18
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion (for smooth micro-interactions)
- **Audio Engine**: Native Web Audio API Synthesizer (No bulky assets needed!)
