# 🔌 Spotify Web Controller - API Endpoints Reference

Complete list of all backend API endpoints with examples and descriptions.

## Authentication Endpoints

### `GET /login`
Redirects user to Spotify login page
- **Method:** GET
- **Auth Required:** No
- **Response:** Redirect to Spotify authorization page
- **Usage:** User clicks "Login with Spotify" button

```javascript
// Frontend usage
window.location.href = `${BACKEND_URL}/login`;
```

---

### `GET /callback`
OAuth callback from Spotify with authorization code
- **Method:** GET  
- **Auth Required:** No
- **Query Params:** 
  - `code` - Authorization code from Spotify
  - `state` - Anti-CSRF token
- **Response:** Redirects to frontend after successful auth
- **Usage:** Automatic (handled by OAuth flow)

```
Example URL:
http://localhost:3000/callback?code=AQDsx...&state=abc123
```

---

### `GET /token`
Get current access token (after authentication)
- **Method:** GET
- **Auth Required:** No (but must be authenticated)
- **Response:**
```json
{
  "accessToken": "BQDsx8h...",
  "expiresAt": 1642345600000
}
```
- **Usage:** Check if user is authenticated

```javascript
// Frontend usage
const tokenData = await backendApi('/token');
if (tokenData.accessToken) {
  // User is authenticated
}
```

---

### `POST /logout`
Logout current user and clear tokens
- **Method:** POST
- **Auth Required:** No
- **Response:**
```json
{
  "success": true
}
```
- **Usage:** User clicks logout button

```javascript
// Frontend usage
await backendApi('/logout', 'POST');
```

---

## User Endpoints

### `GET /me`
Get current user's profile information
- **Method:** GET
- **Auth Required:** Yes
- **Scopes:** `user-read-private`, `user-read-email`
- **Response:**
```json
{
  "id": "user_id",
  "display_name": "Your Name",
  "email": "user@example.com",
  "images": [
    {
      "url": "https://..."
    }
  ],
  "external_urls": {
    "spotify": "https://open.spotify.com/user/..."
  }
}
```

```javascript
// Frontend usage
const user = await backendApi('/me');
console.log(user.display_name);
```

---

### `GET /me/playlists`
Get user's playlists
- **Method:** GET
- **Auth Required:** Yes
- **Scopes:** `playlist-read-private`, `playlist-read-collaborative`
- **Query Params:** `limit`, `offset` (optional)
- **Response:**
```json
{
  "items": [
    {
      "id": "playlist_id",
      "name": "My Playlist",
      "uri": "spotify:playlist:...",
      "images": [
        {
          "url": "https://..."
        }
      ]
    }
  ],
  "total": 50,
  "next": "https://..."
}
```

```javascript
// Frontend usage
const playlists = await backendApi('/me/playlists');
playlists.items.forEach(p => console.log(p.name));
```

---

### `GET /me/tracks`
Get user's liked songs (saved tracks)
- **Method:** GET
- **Auth Required:** Yes
- **Scopes:** `user-library-read`
- **Query Params:** `limit`, `offset` (optional)
- **Response:**
```json
{
  "items": [
    {
      "track": {
        "id": "track_id",
        "name": "Song Name",
        "artists": [{ "name": "Artist" }],
        "uri": "spotify:track:..."
      }
    }
  ]
}
```

```javascript
// Frontend usage
const likedTracks = await backendApi('/me/tracks');
```

---

### `POST /me/tracks`
Add tracks to user's liked songs
- **Method:** POST
- **Auth Required:** Yes
- **Scopes:** `user-library-modify`
- **Body:**
```json
{
  "ids": ["track_id_1", "track_id_2"]
}
```
- **Response:**
```json
{
  "success": true
}
```

```javascript
// Frontend usage
await backendApi('/me/tracks', 'POST', {
  ids: ["123", "456"]
});
```

---

### `DELETE /me/tracks`
Remove tracks from user's liked songs
- **Method:** DELETE
- **Auth Required:** Yes
- **Scopes:** `user-library-modify`
- **Body:**
```json
{
  "ids": ["track_id_1", "track_id_2"]
}
```
- **Response:**
```json
{
  "success": true
}
```

```javascript
// Frontend usage
await backendApi('/me/tracks', 'DELETE', {
  ids: ["123"]
});
```

---

## Playback Endpoints

### `GET /me/player`
Get current playback state
- **Method:** GET
- **Auth Required:** Yes
- **Scopes:** `user-read-playback-state`
- **Response:**
```json
{
  "is_playing": true,
  "device": {
    "id": "device_id",
    "name": "Desktop",
    "volume_percent": 80,
    "is_active": true
  },
  "shuffle_state": false,
  "repeat_state": "off"
}
```

```javascript
// Frontend usage
const state = await backendApi('/me/player');
console.log(state.is_playing ? "Playing" : "Paused");
```

---

### `GET /me/player/currently-playing`
Get currently playing track
- **Method:** GET
- **Auth Required:** Yes
- **Scopes:** `user-read-currently-playing`
- **Response:**
```json
{
  "item": {
    "id": "track_id",
    "name": "Song Name",
    "album": {
      "images": [
        { "url": "https://..." }
      ]
    },
    "artists": [
      { "name": "Artist Name" }
    ],
    "duration_ms": 210000
  },
  "progress_ms": 45000,
  "is_playing": true
}
```

```javascript
// Frontend usage
const current = await backendApi('/me/player/currently-playing');
console.log(current.item.name);
```

---

### `GET /me/player/devices`
Get available devices
- **Method:** GET
- **Auth Required:** Yes
- **Scopes:** `user-read-playback-state`
- **Response:**
```json
{
  "devices": [
    {
      "id": "device_id",
      "name": "My iPhone",
      "type": "Smartphone",
      "volume_percent": 100,
      "is_active": true
    },
    {
      "id": "device_id_2",
      "name": "Desktop",
      "type": "Computer",
      "volume_percent": 80,
      "is_active": false
    }
  ]
}
```

```javascript
// Frontend usage
const devices = await backendApi('/me/player/devices');
devices.devices.forEach(d => console.log(d.name));
```

---

### `POST /me/player/play`
Start playback
- **Method:** POST
- **Auth Required:** Yes
- **Scopes:** `user-modify-playback-state`
- **Body (Option 1 - Resume):**
```json
{
  "deviceId": "device_id"
}
```
- **Body (Option 2 - Play Playlist):**
```json
{
  "context_uri": "spotify:playlist:...",
  "deviceId": "device_id"
}
```
- **Body (Option 3 - Play Track):**
```json
{
  "uris": ["spotify:track:..."],
  "deviceId": "device_id"
}
```
- **Response:**
```json
{
  "success": true
}
```

```javascript
// Frontend usage
// Play a track
await backendApi('/me/player/play', 'POST', {
  uris: ["spotify:track:123"],
  deviceId: "device_id"
});

// Resume playing
await backendApi('/me/player/play', 'POST', {
  deviceId: "device_id"
});
```

---

### `POST /me/player/pause`
Pause playback
- **Method:** POST
- **Auth Required:** Yes
- **Scopes:** `user-modify-playback-state`
- **Body:**
```json
{
  "deviceId": "device_id"
}
```
- **Response:**
```json
{
  "success": true
}
```

```javascript
// Frontend usage
await backendApi('/me/player/pause', 'POST', {
  deviceId: deviceId
});
```

---

### `POST /me/player/next`
Skip to next track
- **Method:** POST
- **Auth Required:** Yes
- **Scopes:** `user-modify-playback-state`
- **Body:**
```json
{
  "deviceId": "device_id"
}
```
- **Response:**
```json
{
  "success": true
}
```

```javascript
// Frontend usage
await backendApi('/me/player/next', 'POST', {
  deviceId: deviceId
});
```

---

### `POST /me/player/previous`
Skip to previous track
- **Method:** POST
- **Auth Required:** Yes
- **Scopes:** `user-modify-playback-state`
- **Body:**
```json
{
  "deviceId": "device_id"
}
```
- **Response:**
```json
{
  "success": true
}
```

```javascript
// Frontend usage
await backendApi('/me/player/previous', 'POST', {
  deviceId: deviceId
});
```

---

### `POST /me/player/seek`
Seek to a position in the current track
- **Method:** POST
- **Auth Required:** Yes
- **Scopes:** `user-modify-playback-state`
- **Body:**
```json
{
  "position_ms": 45000,
  "deviceId": "device_id"
}
```
- **Response:**
```json
{
  "success": true
}
```

```javascript
// Frontend usage
// Seek to 30 seconds
await backendApi('/me/player/seek', 'POST', {
  position_ms: 30000,
  deviceId: deviceId
});
```

---

### `PUT /me/player/volume`
Set device volume
- **Method:** PUT
- **Auth Required:** Yes
- **Scopes:** `user-modify-playback-state`
- **Body:**
```json
{
  "volume_percent": 75,
  "deviceId": "device_id"
}
```
- **Response:**
```json
{
  "success": true
}
```

```javascript
// Frontend usage
await backendApi('/me/player/volume', 'PUT', {
  volume_percent: 75,
  deviceId: deviceId
});
```

---

### `PUT /me/player/shuffle`
Toggle shuffle mode
- **Method:** PUT
- **Auth Required:** Yes
- **Scopes:** `user-modify-playback-state`
- **Body:**
```json
{
  "state": true,
  "deviceId": "device_id"
}
```
- **Response:**
```json
{
  "success": true
}
```

```javascript
// Frontend usage
await backendApi('/me/player/shuffle', 'PUT', {
  state: true,
  deviceId: deviceId
});
```

---

## Search Endpoint

### `GET /search`
Search for tracks, artists, albums, playlists
- **Method:** GET
- **Auth Required:** Yes
- **Scopes:** `user-read-private`
- **Query Params:**
  - `q` - Search query (required)
  - `type` - Search type: track, artist, album, playlist (default: track)
  - `limit` - Max results (default: 20)
- **Response:**
```json
{
  "tracks": {
    "items": [
      {
        "id": "track_id",
        "name": "Song Name",
        "uri": "spotify:track:...",
        "album": {
          "images": [{ "url": "https://..." }]
        },
        "artists": [{ "name": "Artist" }],
        "duration_ms": 210000
      }
    ]
  }
}
```

```javascript
// Frontend usage
const results = await backendApi(
  `/search?q=${encodeURIComponent('Blinding Lights')}&type=track`
);
console.log(results.tracks.items);
```

---

## Playlist Endpoint

### `GET /playlist/:id/tracks`
Get tracks from a specific playlist
- **Method:** GET
- **Auth Required:** Yes
- **Scopes:** `playlist-read-private`
- **URL Params:**
  - `id` - Playlist ID
- **Query Params:** `limit`, `offset` (optional)
- **Response:**
```json
{
  "items": [
    {
      "track": {
        "id": "track_id",
        "name": "Song Name",
        "uri": "spotify:track:...",
        "album": { "images": [...] },
        "artists": [...]
      }
    }
  ]
}
```

```javascript
// Frontend usage
const tracks = await backendApi('/playlist/123/tracks');
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required parameter: q"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
*Triggers automatic logout in frontend*

### 429 Too Many Requests
```json
{
  "error": "Rate limited by Spotify API"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Request/Response Examples

### Example 1: Search and Play
```javascript
// Step 1: Search for a song
const results = await backendApi(
  '/search?q=Blinding%20Lights&type=track'
);

// Step 2: Get the first result
const track = results.tracks.items[0];

// Step 3: Play the track
await backendApi('/me/player/play', 'POST', {
  uris: [track.uri],
  deviceId: currentDeviceId
});
```

### Example 2: Get and Display Current Track
```javascript
// Get currently playing
const current = await backendApi('/me/player/currently-playing');

// Display in UI
document.getElementById('track-name').textContent = current.item.name;
document.getElementById('album-art').src = 
  current.item.album.images[0].url;

// Show progress
const progress = (current.progress_ms / current.item.duration_ms) * 100;
document.getElementById('progress-bar').value = progress;
```

### Example 3: Volume Control
```javascript
// Set volume to 50%
await backendApi('/me/player/volume', 'PUT', {
  volume_percent: 50,
  deviceId: currentDeviceId
});
```

---

## Rate Limits

- Spotify API: 429 responses handled automatically
- Token refresh: 5 min before expiry
- Player state polling: 1 second (frontend)
- Search: No limit, but use debouncing

---

## Testing Endpoints

### Manual Testing with curl

```bash
# Get current track (after auth)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/me/player/currently-playing

# Search for a song
curl http://localhost:3000/search?q=blinding%20lights

# Get devices
curl http://localhost:3000/me/player/devices

# Test CORS
curl -H "Origin: http://localhost:8000" \
  -i http://localhost:3000/me
```

---

**For more details, see README.md or ARCHITECTURE.md**
