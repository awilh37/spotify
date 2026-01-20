# 🎵 Spotify Web Controller

A modern web-based Spotify controller built with vanilla JavaScript and Node.js. Control your Spotify playback directly from your browser with a beautiful, responsive UI.

## ✨ Features

- **🔐 OAuth Authentication** - Secure login with Spotify
- **▶️ Playback Controls** - Play, pause, next, previous
- **🔊 Volume Control** - Adjust volume with slider
- **📱 Device Selection** - Switch between active Spotify devices
- **🔍 Search** - Find and play songs, artists, and more
- **📋 Playlists** - Browse and play your playlists
- **❤️ Like Tracks** - Add songs to your liked songs
- **🎚️ Progress Bar** - Seek through tracks
- **🔀 Shuffle & Repeat** - Toggle shuffle and repeat modes
- **👤 User Profile** - Display your Spotify profile
- **📱 Responsive Design** - Works on desktop and mobile
- **🌙 Dark Theme** - Beautiful dark UI with Spotify green accents

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Spotify Developer Account

### Step 1: Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in or create an account
3. Create a new app
4. Accept the terms and create
5. You'll see your **Client ID** and **Client Secret**
6. Click "Edit Settings"
7. Set Redirect URIs to: `http://localhost:3000/callback`
8. Save

### Step 2: Backend Setup

```bash
cd spotify/backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your credentials
# SPOTIFY_CLIENT_ID=your_client_id
# SPOTIFY_CLIENT_SECRET=your_client_secret
# SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
# FRONTEND_URL=http://localhost:5173

# Start the server
npm start
```

Server will run on `http://localhost:3000`

### Step 3: Frontend Setup (Local Development)

```bash
# From the spotify directory
# Update config.js to point to your backend
# Change: const backendUrl = 'http://localhost:3000';

# Option A: Use a simple HTTP server
python3 -m http.server 8000
# or
npx http-server

# Option B: Use Vite (if available)
npm install
npm run dev
```

Then open `http://localhost:8000` in your browser

### Step 4: Login & Use

1. Click "Login with Spotify"
2. Authorize the app
3. You'll be redirected to the controller
4. Start controlling your Spotify playback!

## 📦 Deployment

### Deploy Backend to Render (Free)

1. Push your code to GitHub
2. Go to [Render.com](https://render.com)
3. Create new Web Service
4. Connect your GitHub repo
5. Set environment variables in Render dashboard:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI=https://your-backend-url.onrender.com/callback`
   - `FRONTEND_URL=https://your-frontend-url`
6. Deploy

### Deploy Frontend to GitHub Pages

```bash
# Update config.js with production backend URL
const backendUrl = 'https://your-backend-url.onrender.com';

# Push to main branch
git add .
git commit -m "Deploy to production"
git push origin main
```

Then access at: `https://yourusername.github.io/spotify`

**Update Redirect URI in Spotify Dashboard** to match your production URLs!

## 🏗️ Project Structure

```
spotify/
├── index.html          # Main HTML file
├── script.js           # Frontend logic
├── style.css           # Styling
├── config.js           # Backend URL configuration
├── backend/
│   ├── server.js       # Express.js backend
│   ├── package.json    # Dependencies
│   ├── .env.example    # Environment variables template
│   └── .env            # Environment variables (create this)
```

## 🔌 API Endpoints

### Authentication
- `GET /login` - Redirect to Spotify login
- `GET /callback` - OAuth callback
- `GET /token` - Get current access token
- `POST /logout` - Logout user

### User
- `GET /me` - Get current user profile
- `GET /me/playlists` - Get user's playlists
- `GET /me/tracks` - Get liked songs

### Playback
- `GET /me/player` - Get current playback state
- `GET /me/player/currently-playing` - Get currently playing track
- `GET /me/player/devices` - Get available devices
- `POST /me/player/play` - Start playback
- `POST /me/player/pause` - Pause playback
- `POST /me/player/next` - Next track
- `POST /me/player/previous` - Previous track
- `POST /me/player/seek` - Seek to position
- `PUT /me/player/volume` - Set volume
- `PUT /me/player/shuffle` - Toggle shuffle

### Search
- `GET /search` - Search for tracks

## 🎨 Customization

### Change Theme Colors

Edit `style.css`:
```css
/* Change Spotify green to your color */
--primary-color: #1db954;  /* Current Spotify green */
```

### Change Backend URL

Edit `config.js`:
```javascript
const backendUrl = 'http://localhost:3000'; // Change this
```

### Add More Scopes

Edit `backend/server.js` in the `scopes` array to request more permissions from Spotify.

## 🐛 Troubleshooting

### "CORS not allowed" error
- Make sure your backend `allowedOrigins` includes your frontend URL
- Check that `FRONTEND_URL` environment variable is set correctly

### "Authorization code not found"
- Make sure your Spotify `REDIRECT_URI` matches exactly in:
  1. Spotify Developer Dashboard
  2. Backend `.env` file
  3. Backend `server.js`

### "Token expired" errors
- The backend automatically refreshes tokens before expiry
- If issues persist, try logging out and logging back in

### Can't find playlists
- Make sure you granted the app permission to access playlists
- Try logging out and logging back in with all permissions

## 📚 Dependencies

### Frontend
- Vanilla JavaScript (no frameworks required)

### Backend
- **express** - Web framework
- **spotify-web-api-node** - Spotify API wrapper
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Environment variables

## 📄 License

ISC

## 🤝 Contributing

Feel free to fork and submit pull requests for any improvements!

## 🎯 Future Features

- [ ] Queue management
- [ ] Recently played history
- [ ] Top tracks/artists
- [ ] Spotify Connect
- [ ] Dark/Light theme toggle
- [ ] Mini player widget
- [ ] Keyboard shortcuts

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review [Spotify API Documentation](https://developer.spotify.com/documentation)
3. Check [spotify-web-api-node](https://github.com/thelinmichael/spotify-web-api-node)

---

**Enjoy controlling your Spotify! 🎵**
