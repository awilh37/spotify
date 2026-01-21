# 🚀 Spotify Web Controller - Setup Guide

## Your Credentials (Already Added)
✅ Client ID: `ed72294b60eb42efb0f36c7d0d9ba761`
✅ Client Secret: `44d6db81708c4005ae78c04d51318c90`
✅ Redirect URL: `https://awilh37.github.io/spotify`

## Steps to Get Running

### 1. Update Spotify Developer Dashboard
Go to https://developer.spotify.com/dashboard
1. Select your app
2. Click "Edit Settings"
3. Update Redirect URIs to include:
   - For local: `http://localhost:3000/callback`
   - For production: `https://your-backend-url.onrender.com/callback`

### 2. Backend Installation & Setup

```bash
cd github/spotify/backend

# Install dependencies
npm install

# The .env file is already created with your credentials
# Start the backend server
npm start
```

You should see:
```
Server script starting...
Spotify controller listening on port 3000
```

### 3. Frontend Setup (Choose One)

**Option A: Quick Testing (Python)**
```bash
cd github/spotify

# Start a simple HTTP server
python3 -m http.server 8000

# Visit http://localhost:8000
```

**Option B: With Node.js**
```bash
cd github/spotify

# Use http-server if installed
npx http-server
```

### 4. Test the App

1. Open your browser to `http://localhost:8000`
2. Click "Login with Spotify"
3. Authorize the application
4. You should see your playlists and be able to control Spotify!

## Features You Now Have

✅ **Playback Control** - Play/Pause, Next, Previous  
✅ **Volume Control** - Adjust with slider  
✅ **Search** - Find and play any song  
✅ **Playlists** - See and play your playlists  
✅ **Device Selection** - Switch between devices  
✅ **Progress Bar** - See and seek through songs  
✅ **User Profile** - Shows your Spotify profile picture  
✅ **Beautiful UI** - Modern dark theme with Spotify green  

## Production Deployment

### Deploy Backend to Render

1. Push your repo to GitHub
2. Create account on https://render.com
3. Create "New Web Service"
4. Connect GitHub repo
5. Set environment variables:
   ```
   SPOTIFY_CLIENT_ID=ed72294b60eb42efb0f36c7d0d9ba761
   SPOTIFY_CLIENT_SECRET=44d6db81708c4005ae78c04d51318c90
   SPOTIFY_REDIRECT_URI=https://your-service-name.onrender.com/callback
   FRONTEND_URL=https://awilh37.github.io/spotify
   ```
6. Deploy

### Update Frontend Config

Edit `github/spotify/config.js`:
```javascript
const backendUrl = 'https://your-service-name.onrender.com';
```

### Update Spotify Dashboard

Go back to Spotify Developer Dashboard and add your production Redirect URI:
```
https://your-service-name.onrender.com/callback
```

### Deploy Frontend

```bash
cd github/spotify
git add -A
git commit -m "Update Spotify controller for production"
git push origin main
```

Access at: https://awilh37.github.io/spotify

## Troubleshooting

### "Cannot find module 'dotenv'"
```bash
cd backend
npm install
```

### CORS errors
- Make sure backend is running
- Check that `FRONTEND_URL` environment variable matches your frontend URL
- Verify `config.js` has correct backend URL

### Login doesn't work
- Check Redirect URI in Spotify Dashboard matches exactly
- Make sure Spotify credentials are correct in `.env`

### Can't see playlists
- Log out and log back in (permissions need to be re-granted)
- Check browser console for errors (F12)

## File Structure

```
spotify/
├── config.js              ← Update with backend URL
├── index.html             ← Beautiful UI
├── script.js              ← Main logic (400+ lines)
├── style.css              ← Professional styling
├── README.md              ← Full documentation
├── QUICKSTART.md           ← This file
└── backend/
    ├── server.js          ← Express backend (240+ lines)
    ├── package.json       ← Dependencies
    ├── .env               ← Your credentials (already filled)
    └── .env.example       ← Template
```

## What's New vs Old Version

### Old Version Issues ❌
- Incomplete backend
- Missing error handling
- No device selection
- No search functionality
- Poor UI/UX
- No user profile

### New Version Features ✅
- Complete working backend with all endpoints
- Comprehensive error handling & notifications
- Device switching
- Full search with UI preview
- Beautiful responsive design
- User profile display
- Progress bar with seeking
- Volume control
- Shuffle/Repeat toggles
- Like/Unlike songs
- Auto token refresh
- Mobile friendly

## Next Steps

1. ✅ Setup backend with `npm install` and `npm start`
2. ✅ Test locally at `http://localhost:8000`
3. ✅ Deploy backend to Render
4. ✅ Update config.js with production URL
5. ✅ Deploy frontend to GitHub Pages
6. ✅ Update Spotify Dashboard Redirect URI

## Questions?

Check the full README.md for more details!

---

Happy streaming! 🎵
