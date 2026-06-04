<p align="center">
  <img src="assets/icon.png" width="80" alt="YouTubeDream">
</p>

<h3 align="center">YouTubeDream ✦</h3>

<p align="center">
  <em>Ad-free YouTube experience with music mode, offline downloads, synced lyrics, and cross-app Picture-in-Picture.</em>
  <br>
  <b>3 modes.</b> One app. Yours.
</p>

<p align="center">
  <a href="https://github.com/ha-neko/YouTubeDream/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/ha-neko/YouTubeDream/build-apk.yml?branch=main&label=build&style=flat-square">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/ha-neko/YouTubeDream?style=flat-square">
  </a>
  <a href="https://github.com/ha-neko/YouTubeDream/releases">
    <img src="https://img.shields.io/github/v/release/ha-neko/YouTubeDream?style=flat-square">
  </a>
</p>

---

## ◆ Features

| Mode | What it does |
|------|-------------|
| **▶ Normal** | Browse and watch YouTube videos — no ads. Choose your video quality, PiP out to chat on Discord or Telegram. |
| **♪ Music** | Spotify-like audio mode. Background playback with screen off. Synced karaoke lyrics. Download for offline. |
| **▼ Offline** | Your downloaded library. Filter by audio/video. Play anytime, anywhere, zero data. |

✦ **Cross-app Picture-in-Picture** — video floats over other apps
✦ **Background audio** — keeps playing when you lock the phone
✦ **Synced lyrics** — real-time karaoke scrolling via LRCLIB
✦ **Quality picker** — choose resolution/bitrate before playing or downloading
✦ **Ad-free** — powered by Piped API, zero ads, zero Google tracking
✦ **Themeable** — customize every color (more below)

## ◆ Screenshots

> *(Screenshots coming soon — grab a debug build from Actions and send one!)*

## ◆ Download

### Latest release
[![Release](https://img.shields.io/github/v/release/ha-neko/YouTubeDream?style=for-the-badge)](https://github.com/ha-neko/YouTubeDream/releases/latest)

### Bleeding edge (debug APK)
Every push to `main` builds a debug APK you can sideload:

1. Go to the [Actions tab](https://github.com/ha-neko/YouTubeDream/actions)
2. Click the latest green workflow run
3. Download the **youtube-dream-debug** artifact
4. Install on your Android device (enable *Unknown sources*)

## ◆ Building yourself

```bash
git clone https://github.com/ha-neko/YouTubeDream.git
cd YouTubeDream
npm install
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

Requires Node.js 22+, Java 17+, and Android SDK.

## ◆ Themes

YouTubeDream has a Spicetify-inspired theme system. Every color is customizable.

### Built-in themes
- **Default** — dark with pink accents
- **Pastel Pink** — soft, warm, cozy *(coming soon)*

### Creating a theme
Create a `.json` file in the app's theme directory with color tokens:

```json
{
  "name": "My Theme",
  "author": "you",
  "colors": {
    "bg": "#0d0d0d",
    "bgCard": "#1a1a1a",
    "text": "#f0f0f0",
    "accent": "#ff6b9d"
  }
}
```

Drop it in the themes folder and select it from Settings. Share your themes with the community!

## ◆ Tech Stack

```
React Native  │  Expo  │  TypeScript
Piped API     │  LRCLIB  │  expo-av
expo-sqlite   │  expo-video  │  Zustand
```

## ◆ License

MIT — do what you want, just credit us.

---

<p align="center">
  Made with ❤ by <a href="https://github.com/ha-neko">ha-neko</a>
</p>
