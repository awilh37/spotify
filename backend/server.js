require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Use a placeholder for the frontend URL
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

app.use(cors());

let accessToken = '';
let refreshToken = '';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

app.get('/login', (req, res) => {
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
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      accessToken = data.body['access_token'];
      refreshToken = data.body['refresh_token'];
      const expiresIn = data.body['expires_in'];

      spotifyApi.setAccessToken(accessToken);
      spotifyApi.setRefreshToken(refreshToken);

      console.log('Successfully retrieved access token.');

      // Redirect to the frontend
      res.redirect(frontendUrl);

      setInterval(async () => {
        const data = await spotifyApi.refreshAccessToken();
        accessToken = data.body['access_token'];
        spotifyApi.setAccessToken(accessToken);
        console.log('The access token has been refreshed!');
      }, expiresIn / 2 * 1000);
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

app.get('/token', (req, res) => {
  res.json({ accessToken });
});

app.listen(port, () => {
  console.log(`Spotify app listening at http://localhost:${port}`);
});
