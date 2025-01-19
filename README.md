# Women Safety Emergency App

A Progressive Web App (PWA) for women's safety with emergency SOS and complaint filing features.

## Live Demo

Visit the app: [Women Safety App](https://21pk.github.io/Women_safety/)

To install on your phone:
1. Open the link in Chrome (Android) or Safari (iOS)
2. For Android: Click "Add to Home Screen" when prompted
3. For iOS: Click share button and select "Add to Home Screen"

## Features

- One-tap Emergency SOS button with 1090 helpline
- Live location and audio sharing during emergency
- Location tracking and sharing
- Complaint filing system with audio recording
- Offline support
- Installable on mobile devices

## Installation Instructions for Users

1. Open [https://21pk.github.io/Women_safety/](https://21pk.github.io/Women_safety/) in your mobile browser
2. For Android:
   - You'll see a "Add to Home Screen" prompt
   - Click "Install" to add the app to your home screen
3. For iOS:
   - Click the share button
   - Select "Add to Home Screen"
   - Click "Add" to install the app

## Deployment Instructions

1. **Using GitHub Pages:**
   - Create a new GitHub repository
   - Push all the code to the repository
   - Go to repository Settings > Pages
   - Enable GitHub Pages and select your main branch
   - Your app will be available at `https://[username].github.io/[repository-name]`

2. **Using Netlify:**
   - Create a Netlify account
   - Connect your GitHub repository
   - Deploy from the repository
   - Your app will be available at `https://[your-site-name].netlify.app`

3. **Using Vercel:**
   - Create a Vercel account
   - Import your GitHub repository
   - Deploy from the repository
   - Your app will be available at `https://[your-site-name].vercel.app`

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/21pk/Women_safety.git
   ```
2. Run a local server:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser

## Security Considerations

- The app requires HTTPS for PWA features
- Location permissions are required for emergency features
- Microphone permissions are needed for audio recording
