# 🏗️ Spotify Web Controller - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPOTIFY WEB CONTROLLER                       │
└─────────────────────────────────────────────────────────────────┘

                         BROWSER (Frontend)
┌─────────────────────────────────────────────────────────┐
│                     HTML/CSS/JavaScript                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  index.html  - Beautiful UI Layout               │  │
│  │  script.js   - 400+ lines of logic               │  │
│  │  style.css   - Professional styling              │  │
│  │  config.js   - Backend URL configuration         │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                HTTP/CORS │ (JSON)                       │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         │  OAUTH REDIRECT FLOW              │
         │                                   │
         ▼                                   ▼
    ┌─────────────────┐             ┌─────────────────┐
    │  Node.js Server │             │  Spotify API    │
    │  (Backend)      │◄────────────┤  Authorization  │
    │  240+ lines     │  Auth Code  │  Server         │
    │                 │──────────────                  │
    └─────────────────┘             └─────────────────┘
         │  │
         │  └─────────────────────────────────────────┐
         │                                            │
         ▼ Access Token (Stored)                      │
    ┌─────────────────┐                              │
    │  Token Storage  │                              │
    │  - Access Token │                              │
    │  - Refresh Token│                              │
    │  - Expiry Time  │                              │
    └─────────────────┘                              │
         │                                            │
         │ Proxy Requests with Token                 │
         │                                            │
         ▼                                            ▼
    ┌─────────────────────────┐          ┌─────────────────┐
    │  Express.js Routes      │          │ Spotify Web API │
    │ ───────────────────────  │◄────────┤   v1            │
    │ /login                  │          │                 │
    │ /callback               │ Access   │ - /me           │
    │ /token                  │ Token    │ - /me/player    │
    │ /me (user profile)      │          │ - /me/playlists │
    │ /me/player (playback)   │          │ - /search       │
    │ /me/player/play         │          │ - /devices      │
    │ /me/player/pause        │          │ and more...     │
    │ /me/player/next         │          │                 │
    │ /me/playlists           │          └─────────────────┘
    │ /search                 │
    │ /me/tracks (liked)      │
    └─────────────────────────┘
```

## Data Flow

### 1. Authentication Flow
```
User Clicks Login
        │
        ▼
Browser redirects to Backend /login
        │
        ▼
Backend generates Spotify OAuth URL
        │
        ▼
User redirected to Spotify (authorize.spotify.com)
        │
        ▼
User logs in & authorizes (gives permissions)
        │
        ▼
Spotify redirects to /callback with auth code
        │
        ▼
Backend exchanges code for access token
        │
        ▼
Backend stores token (in memory/session)
        │
        ▼
Backend redirects frontend to main app
        │
        ▼
Frontend requests /token endpoint
        │
        ▼
Logged in!
```

### 2. Playback Control Flow
```
User clicks "Play"
        │
        ▼
Frontend calls backendApi('/me/player/play', 'POST', {...})
        │
        ▼
Backend receives request with access token
        │
        ▼
Backend forwards request to Spotify API
        │
        ▼
Spotify executes playback command
        │
        ▼
Spotify returns 204 (no content)
        │
        ▼
Frontend updates UI
        │
        ▼
Frontend polls /me/player/currently-playing
        │
        ▼
Display updated player state
```

## File Relationships

```
index.html
    │
    ├─→ includes config.js
    │       │
    │       └─→ Sets BACKEND_URL variable
    │
    ├─→ includes script.js
    │       │
    │       ├─→ Uses backendUrl from config.js
    │       │
    │       ├─→ Makes HTTP requests to backend
    │       │
    │       └─→ Updates DOM elements from index.html
    │
    └─→ includes style.css
            │
            └─→ Styles all HTML elements


Backend Structure:
server.js
    │
    ├─→ Reads .env file (using dotenv)
    │       │
    │       ├─→ SPOTIFY_CLIENT_ID
    │       ├─→ SPOTIFY_CLIENT_SECRET
    │       └─→ SPOTIFY_REDIRECT_URI
    │
    ├─→ Express routes
    │       │
    │       ├─→ /login
    │       ├─→ /callback
    │       ├─→ /token
    │       ├─→ /me/*
    │       ├─→ /search
    │       └─→ ...20 more endpoints
    │
    └─→ Spotify API calls (via spotify-web-api-node)
            │
            └─→ spotify.com API
```

## Request/Response Examples

### Example 1: Get Current Playing Track
```
REQUEST:
  Frontend -> Backend
  GET /me/player/currently-playing

PROCESSING:
  Backend reads stored access_token
  Backend calls: spotify.getMyCurrentPlayingTrack()

RESPONSE:
  {
    "item": {
      "id": "11dFghVte2yq7D5PNeSvvi",
      "name": "Blinding Lights",
      "album": {
        "images": [{
          "url": "https://i.scdn.co/image/..."
        }]
      },
      "artists": [{ "name": "The Weeknd" }],
      "duration_ms": 200040
    },
    "progress_ms": 45000,
    "is_playing": true
  }

FRONTEND:
  Updates album art image
  Updates track name
  Updates artist name
  Updates progress bar
```

### Example 2: Search for a Track
```
REQUEST:
  Frontend -> Backend
  GET /search?q=Blinding%20Lights&type=track

PROCESSING:
  Backend extracts query parameter
  Backend calls: spotify.search('Blinding Lights', ['track'])

RESPONSE:
  {
    "tracks": {
      "items": [
        {
          "name": "Blinding Lights",
          "uri": "spotify:track:11dFghVte2yq7D5PNeSvvi",
          "album": { "images": [...] },
          "artists": [...]
        },
        ... more results ...
      ]
    }
  }

FRONTEND:
  Displays search results in grid
  User can click to play
```

## Environment Variables (.env)

```
SPOTIFY_CLIENT_ID
  └─ Identifies your application to Spotify
  
SPOTIFY_CLIENT_SECRET
  └─ Secret key for your app (KEEP SECRET!)
  
SPOTIFY_REDIRECT_URI
  └─ Where user is sent after auth
  └─ Must match Spotify Dashboard setting
  
PORT
  └─ Server port (default 3000)
  
FRONTEND_URL
  └─ Where frontend is hosted
  └─ Used for CORS configuration
```

## Security Flow

```
SENSITIVE DATA PROTECTION:
  
Client Secret
  └─ Stored ONLY on backend (.env)
  └─ Never sent to frontend
  └─ Never exposed in HTTP responses
  
Access Token
  └─ Generated on backend
  └─ Stored on backend
  └─ Frontend doesn't touch it
  └─ Frontend makes requests TO backend, backend forwards to Spotify
  
Frontend Role
  └─ Makes requests to backend only
  └─ Backend acts as secure proxy
  └─ Never has direct access to Spotify API
  
CORS
  └─ Frontend can only request from backend
  └─ Backend controls who can access it
  └─ Protects against unauthorized requests
```

## Deployment Architecture

### Local Development
```
Your Computer
├── Frontend (localhost:8000)
│   └─ index.html, script.js, style.css
│
├── Backend (localhost:3000)
│   └─ Node.js server with .env
│
└── Spotify API (spotify.com)
```

### Production
```
GitHub Pages
├── Frontend (awilh37.github.io/spotify)
│   └─ index.html, script.js, style.css
│
Render Cloud
├── Backend (your-app.onrender.com)
│   └─ Node.js server with environment variables
│
└── Spotify API (spotify.com)
```

## Performance Considerations

1. **Token Refresh**
   - Refreshed 5 minutes before expiry
   - Prevents mid-session token expiration
   - Automatic, no user action needed

2. **Player State Polling**
   - Updates every 1 second
   - Shows real-time progress
   - Keeps UI in sync with actual playback

3. **Search Results**
   - Cached in frontend
   - Clear on new search
   - Prevents stale results

4. **CORS Optimization**
   - Pre-flight requests cached by browser
   - Subsequent requests faster
   - Reduces latency

## Error Handling

```
Frontend Error Handling:
  └─ API request fails
     ├─ 401 Unauthorized → Logout user
     ├─ Other errors → Show toast notification
     └─ Log to console for debugging

Backend Error Handling:
  └─ Spotify API error
     ├─ 401 → Token refresh
     ├─ 429 → Rate limited (wait)
     ├─ 4xx → Client error
     └─ 5xx → Server error

User Experience:
  └─ Smooth error messages
  └─ Never crashes
  └─ Graceful fallbacks
  └─ Clear error notifications
```

---

**This architecture ensures security, reliability, and great UX!** 🎵
