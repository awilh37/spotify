const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const playlistList = document.getElementById('playlist-list');
const albumArt = document.getElementById('album-art');
const trackName = document.getElementById('track-name');
const artistName = document.getElementById('artist-name');
const prevButton = document.getElementById('prev-button');
const playPauseButton = document.getElementById('play-pause-button');
const nextButton = document.getElementById('next-button');
const volumeSlider = document.getElementById('volume-slider');
const deviceSelect = document.getElementById('device-select');

let accessToken = '';

// Helper function to make API requests
async function spotifyApi(endpoint, method = 'GET', body) {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method,
    body: JSON.stringify(body),
  });
  return await res.json();
}

// Get user's playlists
async function getPlaylists() {
  const playlists = await spotifyApi('/me/playlists');
  playlistList.innerHTML = '';
  playlists.items.forEach(playlist => {
    const li = document.createElement('li');
    li.textContent = playlist.name;
    li.addEventListener('click', () => {
      playPlaylist(playlist.uri);
    });
    playlistList.appendChild(li);
  });
}

// Play a playlist
async function playPlaylist(playlistUri) {
  await spotifyApi('/me/player/play', 'PUT', {
    context_uri: playlistUri,
  });
}

// Search for a song
searchButton.addEventListener('click', async () => {
  const query = searchInput.value;
  const results = await spotifyApi(`/search?q=${query}&type=track`);
  const trackUri = results.tracks.items[0].uri;
  await spotifyApi('/me/player/play', 'PUT', {
    uris: [trackUri],
  });
});

// Update player state
async function updatePlayer() {
  const currentlyPlaying = await spotifyApi('/me/player/currently-playing');
  if (currentlyPlaying && currentlyPlaying.item) {
    albumArt.src = currentlyPlaying.item.album.images[0].url;
    trackName.textContent = currentlyPlaying.item.name;
    artistName.textContent = currentlyPlaying.item.artists.map(artist => artist.name).join(', ');
  }

  const playbackState = await spotifyApi('/me/player');
  if (playbackState) {
    playPauseButton.textContent = playbackState.is_playing ? 'Pause' : 'Play';
    volumeSlider.value = playbackState.device.volume_percent;
  }
}

// Get available devices
async function getDevices() {
  const devices = await spotifyApi('/me/player/devices');
  deviceSelect.innerHTML = '';
  devices.devices.forEach(device => {
    const option = document.createElement('option');
    option.value = device.id;
    option.textContent = device.name;
    if (device.is_active) {
      option.selected = true;
    }
    deviceSelect.appendChild(option);
  });
}

// Event listeners
playPauseButton.addEventListener('click', async () => {
  const playbackState = await spotifyApi('/me/player');
  if (playbackState.is_playing) {
    await spotifyApi('/me/player/pause', 'PUT');
  } else {
    await spotifyApi('/me/player/play', 'PUT');
  }
});

nextButton.addEventListener('click', async () => {
  await spotifyApi('/me/player/next', 'POST');
});

prevButton.addEventListener('click', async () => {
  await spotifyApi('/me/player/previous', 'POST');
});

volumeSlider.addEventListener('input', async () => {
  await spotifyApi(`/me/player/volume?volume_percent=${volumeSlider.value}`, 'PUT');
});

deviceSelect.addEventListener('change', async () => {
  await spotifyApi('/me/player', 'PUT', {
    device_ids: [deviceSelect.value],
  });
});

// Initial load
window.addEventListener('load', async () => {
  const res = await fetch(`${backendUrl}/token`);
  const data = await res.json();
  accessToken = data.accessToken;

  if (accessToken) {
    await getPlaylists();
    await updatePlayer();
    await getDevices();

    setInterval(updatePlayer, 1000);
  } else {
    window.location = `${backendUrl}/login`;
  }
});
