console.log('Server script starting...');
require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

// Token persistence
const tokenFile = path.join(__dirname, '.token.json');

// CORS configuration
const allowedOrigins = [
  'https://awilh37.github.io',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow GitHub Pages and localhost
      const allowedOrigins = [
        'https://awilh37.github.io',
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:5173',
      ];
      
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

const port = process.env.PORT || 3000;
const frontendUrl = process.env.FRONTEND_URL || 'https://awilh37.github.io/spotify';

let tokenStore = {};

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback',
});

// Load saved refresh token on startup
if (fs.existsSync(tokenFile)) {
  try {
    const savedToken = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
    if (savedToken.refreshToken) {
      spotifyApi.setRefreshToken(savedToken.refreshToken);
      tokenStore = savedToken;
      console.log('Loaded stored refresh token from disk');
    }
  } catch (err) {
    console.error('Error loading stored token:', err);
  }
}

// OAuth Scopes
const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify',
];

// Login endpoint
app.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  res.redirect(spotifyApi.createAuthorizeURL(scopes, state));
});

// Callback endpoint
app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;

  if (error) {
    console.error('Callback Error:', error);
    return res.redirect(`${frontendUrl}?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    console.error('No authorization code received');
    return res.redirect(`${frontendUrl}?error=no_code`);
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      const accessToken = data.body['access_token'];
      const refreshToken = data.body['refresh_token'];
      const expiresIn = data.body['expires_in'];

      spotifyApi.setAccessToken(accessToken);
      spotifyApi.setRefreshToken(refreshToken);

      tokenStore = {
        accessToken,
        refreshToken,
        expiresIn,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      // Save refresh token to file for persistence
      fs.writeFile(tokenFile, JSON.stringify(tokenStore, null, 2), (err) => {
        if (err) console.error('Error saving token:', err);
        else console.log('Token saved to disk for persistence');
      });

      console.log('Successfully retrieved access token.');

      // Redirect to frontend with token in fragment (won't be sent to server)
      res.redirect(`${frontendUrl}?login=success`);

      // Auto-refresh token before expiry
      const refreshInterval = (expiresIn - 300) * 1000; // Refresh 5 minutes before expiry
      setInterval(async () => {
        try {
          const newData = await spotifyApi.refreshAccessToken();
          const newAccessToken = newData.body['access_token'];
          const newExpiresIn = newData.body['expires_in'];

          spotifyApi.setAccessToken(newAccessToken);

          tokenStore = {
            accessToken: newAccessToken,
            refreshToken: data.body['refresh_token'],
            expiresIn: newExpiresIn,
            expiresAt: Date.now() + newExpiresIn * 1000,
          };

          // Save updated token to file
          fs.writeFile(tokenFile, JSON.stringify(tokenStore, null, 2), (err) => {
            if (err) console.error('Error updating token file:', err);
          });

          console.log('Access token refreshed and saved');
        } catch (err) {
          console.error('Error refreshing token:', err);
        }
      }, refreshInterval);
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.redirect(`${frontendUrl}?error=${encodeURIComponent('Failed to get token')}`);
    });
});

// Get access token
app.get('/token', (req, res) => {
  console.log('Token endpoint called, tokenStore keys:', Object.keys(tokenStore));
  if (tokenStore.accessToken) {
    console.log('Returning access token');
    res.json({
      accessToken: tokenStore.accessToken,
      expiresAt: tokenStore.expiresAt,
    });
  } else {
    console.log('No access token in tokenStore');
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Logout endpoint
app.post('/logout', (req, res) => {
  tokenStore = {};
  spotifyApi.setAccessToken(null);
  spotifyApi.setRefreshToken(null);
  
  // Delete token file on logout
  fs.unlink(tokenFile, (err) => {
    if (err && err.code !== 'ENOENT') console.error('Error deleting token file:', err);
  });
  
  res.json({ success: true });
});

// Proxy endpoints for Spotify API
app.get('/me', async (req, res) => {
  try {
    const data = await spotifyApi.getMe();
    res.json(data.body);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/me/playlists', async (req, res) => {
  try {
    const data = await spotifyApi.getUserPlaylists();
    res.json(data.body);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/me/player', async (req, res) => {
  try {
    const data = await spotifyApi.getMyCurrentPlaybackState();
    res.json(data.body || {});
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/me/player/currently-playing', async (req, res) => {
  try {
    const data = await spotifyApi.getMyCurrentPlayingTrack();
    res.json(data.body || {});
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/me/player/devices', async (req, res) => {
  try {
    const data = await spotifyApi.getMyDevices();
    res.json(data.body);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/search', async (req, res) => {
  try {
    const { q, type = 'track' } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query parameter' });
    const data = await spotifyApi.search(q, [type], { limit: 20 });
    res.json(data.body);
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/playlist/:id/tracks', async (req, res) => {
  try {
    const data = await spotifyApi.getPlaylistTracks(req.params.id);
    res.json(data.body);
  } catch (err) {
    handleError(res, err);
  }
});

// Playback control endpoints
app.post('/me/player/play', async (req, res) => {
  try {
    const { deviceId, context_uri, uris, offset } = req.body;
    const options = {};
    if (context_uri) options.context_uri = context_uri;
    if (uris) options.uris = uris;
    if (offset !== undefined) options.offset = offset;
    if (deviceId) options.device_id = deviceId;

    await spotifyApi.play(options);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/me/player/pause', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const options = deviceId ? { device_id: deviceId } : {};
    await spotifyApi.pause(options);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/me/player/next', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const options = deviceId ? { device_id: deviceId } : {};
    await spotifyApi.skipToNext(options);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/me/player/previous', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const options = deviceId ? { device_id: deviceId } : {};
    await spotifyApi.skipToPrevious(options);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/me/player/seek', async (req, res) => {
  try {
    const { position_ms, deviceId } = req.body;
    const options = deviceId ? { device_id: deviceId } : {};
    await spotifyApi.seek(position_ms, options);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.put('/me/player/volume', async (req, res) => {
  try {
    const { volume_percent, deviceId } = req.body;
    const options = deviceId ? { device_id: deviceId } : {};
    await spotifyApi.setVolume(volume_percent, options);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.put('/me/player/shuffle', async (req, res) => {
  try {
    const { state, deviceId } = req.body;
    const options = deviceId ? { device_id: deviceId } : {};
    await spotifyApi.setShuffle(state, options);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.get('/me/tracks', async (req, res) => {
  try {
    const data = await spotifyApi.getMySavedTracks({ limit: 50 });
    res.json(data.body);
  } catch (err) {
    handleError(res, err);
  }
});

app.post('/me/tracks', async (req, res) => {
  try {
    const { ids } = req.body;
    await spotifyApi.addToMySavedTracks(ids);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

app.delete('/me/tracks', async (req, res) => {
  try {
    const { ids } = req.body;
    await spotifyApi.removeFromMySavedTracks(ids);
    res.json({ success: true });
  } catch (err) {
    handleError(res, err);
  }
});

// Error handler
function handleError(res, err) {
  console.error('API Error:', err.message);
  if (err.statusCode === 401) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
}

app.listen(port, () => {
  console.log(`Spotify controller listening on port ${port}`);
  console.log(`Frontend URL: ${frontendUrl}`);
});
