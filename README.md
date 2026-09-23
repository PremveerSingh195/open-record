# Screen & Camera Recorder (Chrome Extension Manifest V3)

A lightweight, modern, production-ready Google Chrome extension for screen, camera, and audio recording. Built with TypeScript, React, Vite, and Tailwind CSS, following Chrome Manifest V3 guidelines.

---

## 1. Project Overview

Screen & Camera Recorder is designed with a minimal, intuitive user interface and zero external dependencies. All video encoding, audio mixing, and canvas composition execute 100% locally in-memory on the user's computer.

### Key Highlights
- **3 Recording Modes**: Screen only, Screen + Camera (picture-in-picture overlay), and Camera only.
- **4 Audio Options**: None (Muted), Microphone, System Audio, and System + Microphone (mixed with Web Audio API).
- **Zero Server Overhead**: 100% private and offline-capable. No analytics, tracking, or cloud uploads.
- **Native Video Preview**: Built-in HTML5 player, instant MP4/WebM download, and one-click reset for new recordings.
- **Chrome Storage Integration**: Automatically remembers user mode and audio preferences across sessions.
- **Dual Form Factor**: Runs directly in the Chrome extension popup and supports instant expansion to a dedicated standalone tab or window.

---

## 2. Tech Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing, zero `any`)
- **UI Framework**: [React 18](https://react.dev/) (Hooks: `useState`, `useEffect`, `useRef`, `useCallback`)
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/) with relative asset paths for Chrome extensions
- **Extension Platform**: Chrome Extension Manifest V3 (`manifest_version: 3`)
- **Web Media APIs**:
  - `navigator.mediaDevices.getDisplayMedia` (Screen capture)
  - `navigator.mediaDevices.getUserMedia` (Camera & Microphone capture)
  - `MediaRecorder` (Dynamic VP9/VP8/H.264/WebM negotiation)
  - `HTMLCanvasElement.captureStream` (Screen + Camera real-time compositor)
  - `AudioContext` & `MediaStreamAudioDestinationNode` (Audio mixing)
  - `chrome.storage.local` (Persistent user preferences)

---

## 3. Installation

Clone or open the project folder in your terminal:

```bash
cd /Users/prem/Documents/coding/PersonalProjects
npm install
```

---

## 4. Development

To start the Vite local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open the printed localhost URL (e.g. `http://localhost:5173`) in Google Chrome. In development mode outside the Chrome extension environment, `chrome.storage.local` automatically falls back to `localStorage`.

---

## 5. Production Build

To compile TypeScript and produce the optimized Chrome Extension bundle:

```bash
npm run build
```

This outputs production-ready assets to the `dist/` directory:

```text
dist/
├── assets/
│   ├── main-[hash].js
│   └── main-[hash].css
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── index.html
└── manifest.json
```

---

## 6. How to Load the Extension into Chrome

1. Open Google Chrome.
2. In the address bar, navigate to:
   ```text
   chrome://extensions
   ```
3. In the top right corner, enable **Developer mode** toggle.
4. Click the **Load unpacked** button in the top left.
5. In the file picker dialog, select the `dist` folder:
   ```text
   /Users/prem/Documents/coding/PersonalProjects/dist
   ```
6. The **Screen & Camera Recorder** extension is now installed. Pin it to your Chrome toolbar for quick access!

---

## 7. How Screen Recording Works

1. **User Action**: The user selects **Screen** mode and clicks **Start Recording**.
2. **Permission Prompt**: Chrome invokes `navigator.mediaDevices.getDisplayMedia({ video: true, audio: needAudio })`.
3. **Stream Handling**: The browser's native screen picker allows the user to choose an entire monitor, application window, or browser tab.
4. **Encoding**: The screen video track is attached to a native `MediaRecorder` instance using the highest available codec (e.g., `video/webm;codecs=vp9,opus`).
5. **Auto-Stop Detection**: If the user clicks the floating "Stop sharing" bar displayed by Chrome at the bottom of the screen, the extension detects the track's `ended` event and automatically transitions to the Preview screen.

---

## 8. How Screen + Camera Works (Compositor)

1. **Simultaneous Capture**:
   - Screen capture is acquired via `getDisplayMedia()`.
   - Camera video is acquired via `getUserMedia({ video: { width: 1280, height: 720 } })`.
2. **Canvas Rendering Loop**:
   - An offscreen `<canvas>` is initialized matching the native resolution of the screen stream (e.g., 1920x1080).
   - An optimized `requestAnimationFrame` loop draws the screen frame as the background.
   - The camera stream is rendered as an overlay avatar in the bottom-right corner (occupying ~22% of recording width) with a circular crop, crisp border, and drop shadow.
3. **Capture Stream**:
   - `canvas.captureStream(30)` extracts the combined 30fps composite video track.
4. **Recording**:
   - The composite video track is combined with the selected audio tracks and passed to `MediaRecorder`.
5. **Clean Teardown**:
   - When recording stops, the animation loop is cancelled, and both the screen and camera hardware streams are immediately stopped.

---

## 9. Audio Options & Limitations

| Option | Audio Source | How It Works |
| :--- | :--- | :--- |
| **None** | No audio | Video track only; muted recording. |
| **Microphone** | User's voice | Captured via `getUserMedia({ audio: true })`. |
| **System Audio** | Tab / OS audio | Extracted from `getDisplayMedia({ audio: true })`. |
| **System + Mic** | Combined | System track & Mic track are mixed into a single destination using the Web Audio API (`AudioContext`). |

### Audio Limitations & Edge Cases
- **Chrome Tab vs. Full Screen on macOS**: On macOS, Chrome only supports capturing system audio when sharing a **Chrome Tab**. If the user shares an entire screen on macOS, the operating system does not provide a system audio track.
- **Graceful Fallback**: The extension never crashes if system audio is unavailable. If "System + Microphone" is selected but system audio is not provided by the OS, it logs a clear notification and continues recording microphone audio seamlessly.

---

## 10. Known Chrome & Browser Limitations & Camera Permission Fix

### Why "Camera Access Denied" Happens in Chrome Extensions
In Google Chrome, **extension popups cannot display origin permission prompt banners** (such as *"Screen Recorder wants to use your camera [Allow] [Block]"*). When an extension popup calls `getUserMedia()` before permissions have been granted, Chrome automatically denies the request with `NotAllowedError: Permission denied`.

### How to Fix Camera Access:
1. **Click "Grant Permission in Tab"** in the camera preview card inside the popup.
2. A new browser tab opens at `chrome-extension://<id>/index.html?request=camera`.
3. In that tab, click **Grant Camera & Mic Access**.
4. Chrome will now display the native prompt under the address bar. Click **"Allow"**.
5. Once granted for `chrome-extension://<id>`, the permission is permanently saved for the extension origin in Chrome! You can now close the tab and use the extension popup normally.

### macOS Camera Permission Requirement
On macOS, Google Chrome itself must have system-level camera and microphone permissions:
1. Open **Apple menu  → System Settings**.
2. Navigate to **Privacy & Security → Camera**.
3. Ensure the toggle for **Google Chrome** is turned **ON** (if it was already ON, turn it OFF and back ON).
4. Do the same under **Privacy & Security → Microphone**.
5. Restart Chrome if prompted.

---

## 11. Project Architecture

```text
src/
├── components/
│   ├── Header.tsx                 # Branding, status badge, expand-to-tab button
│   ├── RecordingModeSelector.tsx  # Mode selector cards (Screen, Screen+Camera, Camera)
│   ├── AudioSelector.tsx          # Audio source selector (None, Mic, System+Mic, System)
│   ├── StartRecordingButton.tsx   # Primary start recording button with loading state
│   ├── RecordingControls.tsx      # Timer (MM:SS), pulsing indicator, stop button
│   ├── CameraPreview.tsx          # Live camera feed, layout preview, error banners
│   └── VideoPreview.tsx           # Native HTML5 player, save download, new recording reset
│
├── hooks/
│   ├── useCamera.ts               # Camera stream acquisition and preview lifecycle
│   ├── useScreenCapture.ts        # Display media stream helper
│   └── useRecorder.ts             # Central recording controller, timer, and cleanup
│
├── services/
│   ├── media.ts                   # Media capture functions & friendly error parser
│   ├── audio.ts                   # Web Audio API mixer for dual-track audio
│   ├── compositor.ts              # High-performance 2D canvas compositor
│   ├── recorder.ts                # MediaRecorder wrapper with dynamic MIME types
│   └── storage.ts                 # chrome.storage.local wrapper with localStorage fallback
│
├── types/
│   └── recording.ts               # Strict TypeScript definitions
│
├── utils/
│   ├── mimeType.ts                # Dynamic codec support detection
│   ├── filename.ts                # Timestamped filename generator
│   └── formatTime.ts              # Seconds to MM:SS formatter
│
├── pages/
│   ├── Recorder.tsx               # Configuration & active recording page
│   └── Preview.tsx                # Video playback & export page
│
├── App.tsx                        # Root application container & page switcher
├── main.tsx                       # React DOM entry point
└── index.css                      # Tailwind directives & layout reset
```

---

## 12. Verification & Testing Checklist

- [x] **TypeScript compilation**: Strict typing, no errors (`tsc --noEmit`).
- [x] **Vite production build**: Bundles `dist/` with relative asset links (`./assets/...`).
- [x] **Manifest V3 compliance**: Valid permissions (`storage`), action popup, and icons.
- [x] **Screen recording**: Display media selection, track stop handling, blob generation.
- [x] **Screen + Camera**: Canvas 2D overlay at 30fps with center-crop avatar.
- [x] **Camera Only**: Live preview, audio capture, clean teardown.
- [x] **Audio mixing**: Web Audio API mixer combining system and mic streams without crash.
- [x] **Hardware cleanup**: Explicit `track.stop()`, `cancelAnimationFrame()`, `audioContext.close()`.
- [x] **Object URL safety**: Proper `URL.revokeObjectURL()` preventing memory leaks.
