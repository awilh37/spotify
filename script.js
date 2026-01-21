// ============================================================================
// SPOTIFY WEB CONTROLLER - Frontend
// ============================================================================

// Configuration
const BACKEND_URL = backendUrl || 'http://localhost:3000';
const POLLING_INTERVAL = 1000; // Update player state every 1 second

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
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
const volumeValue = document.getElementById('volume-value');
const deviceSelect = document.getElementById('device-select');
const searchResults = document.getElementById('search-results');
const progressBar = document.getElementById('progress-bar');
const progressTime = document.getElementById('progress-time');
const durationTime = document.getElementById('duration-time');
const likeBtn = document.getElementById('like-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const userProfile = document.getElementById('user-profile');

let accessToken = '';
let currentDeviceId = '';
let currentTrackId = '';
let playerUpdateInterval;
let isAuthenticated = false;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function backendApi(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies with cross-origin requests
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BACKEND_URL}${endpoint}`, options);

    if (response.status === 401) {
      handleLogout();
      throw new Error('Unauthorized - please log in again');
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

function formatTime(ms) {
  if (!ms) return '0:00';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function handleLogin() {
  window.location.href = `${BACKEND_URL}/login`;
}

async function handleLogout() {
  try {
    await backendApi('/logout', 'POST');
  } catch (error) {
    console.error('Logout error:', error);
  }

  accessToken = '';
  isAuthenticated = false;
  clearPlayerInterval();
  showAuthUI();
  showNotification('Logged out successfully');
}

async function checkAuthStatus() {
  try {
    console.log('Checking auth status with backend:', BACKEND_URL);
    const tokenData = await backendApi('/token');
    console.log('Token response:', tokenData);
    if (tokenData.accessToken) {
      accessToken = tokenData.accessToken;
      isAuthenticated = true;
      console.log('Authentication successful');
      showAppUI();
      await initializeApp();
    } else {
      console.log('No access token in response');
      showAuthUI();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    showAuthUI();
  }
}

function showAuthUI() {
  authContainer.style.display = 'flex';
  appContainer.style.display = 'none';
}

function showAppUI() {
  authContainer.style.display = 'none';
  appContainer.style.display = 'flex';
}

// ============================================================================
// USER DATA
// ============================================================================

async function loadUserProfile() {
  try {
    const user = await backendApi('/me');
    if (user.images && user.images.length > 0) {
      userProfile.innerHTML = `
        <img src="${user.images[0].url}" alt="${user.display_name}" class="user-avatar">
        <span>${user.display_name}</span>
      `;
    } else {
      userProfile.innerHTML = `<span>${user.display_name}</span>`;
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

async function loadPlaylists() {
  try {
    const data = await backendApi('/me/playlists');
    playlistList.innerHTML = '';

    if (data.items && data.items.length > 0) {
      data.items.forEach(playlist => {
        const li = document.createElement('li');
        li.className = 'playlist-item';

        const img = document.createElement('img');
        if (playlist.images && playlist.images.length > 0) {
          img.src = playlist.images[0].url;
        }

        const name = document.createElement('span');
        name.textContent = playlist.name;

        li.appendChild(img);
        li.appendChild(name);
        li.addEventListener('click', () => playPlaylist(playlist.uri));
        playlistList.appendChild(li);
      });
    } else {
      playlistList.innerHTML = '<li>No playlists found</li>';
    }
  } catch (error) {
    console.error('Error loading playlists:', error);
    showNotification('Error loading playlists', 'error');
  }
}

// ============================================================================
// PLAYBACK CONTROL
// ============================================================================

async function loadDevices() {
  try {
    const data = await backendApi('/me/player/devices');
    deviceSelect.innerHTML = '';

    if (data.devices && data.devices.length > 0) {
      data.devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        option.textContent = `${device.name} (${device.type})`;
        if (device.is_active) {
          option.selected = true;
          currentDeviceId = device.id;
        }
        deviceSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading devices:', error);
  }
}

async function playPlaylist(playlistUri) {
  try {
    await backendApi('/me/player/play', 'POST', {
      context_uri: playlistUri,
      deviceId: currentDeviceId,
    });
    showNotification('Playing playlist');
    updatePlayerState();
  } catch (error) {
    console.error('Error playing playlist:', error);
    showNotification('Error playing playlist', 'error');
  }
}

async function playTrack(trackUri) {
  try {
    await backendApi('/me/player/play', 'POST', {
      uris: [trackUri],
      deviceId: currentDeviceId,
    });
    currentTrackId = trackUri.split(':')[2];
    updatePlayerState();
  } catch (error) {
    console.error('Error playing track:', error);
    showNotification('Error playing track', 'error');
  }
}

async function togglePlayPause() {
  try {
    const state = await backendApi('/me/player');
    if (state.is_playing) {
      await backendApi('/me/player/pause', 'POST', { deviceId: currentDeviceId });
    } else {
      await backendApi('/me/player/play', 'POST', { deviceId: currentDeviceId });
    }
    updatePlayerState();
  } catch (error) {
    console.error('Error toggling play/pause:', error);
    showNotification('Error controlling playback', 'error');
  }
}

async function nextTrack() {
  try {
    await backendApi('/me/player/next', 'POST', { deviceId: currentDeviceId });
    updatePlayerState();
  } catch (error) {
    console.error('Error skipping to next:', error);
  }
}

async function previousTrack() {
  try {
    await backendApi('/me/player/previous', 'POST', { deviceId: currentDeviceId });
    updatePlayerState();
  } catch (error) {
    console.error('Error skipping to previous:', error);
  }
}

async function setVolume(percent) {
  try {
    await backendApi('/me/player/volume', 'PUT', {
      volume_percent: parseInt(percent),
      deviceId: currentDeviceId,
    });
    if (volumeValue) volumeValue.textContent = percent;
  } catch (error) {
    console.error('Error setting volume:', error);
  }
}

async function seekToPosition(ms) {
  try {
    await backendApi('/me/player/seek', 'POST', {
      position_ms: parseInt(ms),
      deviceId: currentDeviceId,
    });
    updatePlayerState();
  } catch (error) {
    console.error('Error seeking:', error);
  }
}

// ============================================================================
// SEARCH
// ============================================================================

async function searchTracks(query) {
  try {
    if (!query.trim()) {
      searchResults.innerHTML = '';
      return;
    }

    const data = await backendApi(`/search?q=${encodeURIComponent(query)}&type=track`);
    searchResults.innerHTML = '';

    if (data.tracks && data.tracks.items.length > 0) {
      data.tracks.items.forEach(track => {
        const div = document.createElement('div');
        div.className = 'search-result-item';

        const img = document.createElement('img');
        if (track.album.images && track.album.images.length > 0) {
          img.src = track.album.images[2].url; // smallest image
        }

        const info = document.createElement('div');
        info.className = 'track-info';

        const trackTitle = document.createElement('div');
        trackTitle.className = 'track-title';
        trackTitle.textContent = track.name;

        const artist = document.createElement('div');
        artist.className = 'track-artist';
        artist.textContent = track.artists.map(a => a.name).join(', ');

        info.appendChild(trackTitle);
        info.appendChild(artist);

        div.appendChild(img);
        div.appendChild(info);
        div.addEventListener('click', () => {
          playTrack(track.uri);
          searchResults.innerHTML = '';
          searchInput.value = '';
        });

        searchResults.appendChild(div);
      });
    } else {
      searchResults.innerHTML = '<div class="search-result-item">No tracks found</div>';
    }
  } catch (error) {
    console.error('Error searching:', error);
    showNotification('Error searching', 'error');
  }
}

// ============================================================================
// PLAYER STATE UPDATES
// ============================================================================

async function updatePlayerState() {
  try {
    const [currentTrack, playbackState] = await Promise.all([
      backendApi('/me/player/currently-playing'),
      backendApi('/me/player'),
    ]);

    // Update track info
    if (currentTrack && currentTrack.item) {
      const track = currentTrack.item;
      currentTrackId = track.id;

      if (track.album.images && track.album.images.length > 0) {
        albumArt.src = track.album.images[0].url;
      }

      trackName.textContent = track.name;
      artistName.textContent = track.artists.map(a => a.name).join(', ');

      // Update progress bar
      if (currentTrack.progress_ms !== null && track.duration_ms) {
        progressBar.max = track.duration_ms;
        progressBar.value = currentTrack.progress_ms;
        progressTime.textContent = formatTime(currentTrack.progress_ms);
        durationTime.textContent = formatTime(track.duration_ms);
      }
    }

    // Update playback controls
    if (playbackState) {
      playPauseButton.textContent = playbackState.is_playing ? '⏸' : '▶';
      playPauseButton.title = playbackState.is_playing ? 'Pause' : 'Play';

      if (playbackState.device && playbackState.device.volume_percent !== null) {
        volumeSlider.value = playbackState.device.volume_percent;
        if (volumeValue) volumeValue.textContent = playbackState.device.volume_percent;
      }

      // Update shuffle button
      if (playbackState.shuffle_state !== null) {
        shuffleBtn.classList.toggle('active', playbackState.shuffle_state);
      }

      // Update repeat button
      if (playbackState.repeat_state) {
        repeatBtn.classList.remove('active', 'repeat-one');
        if (playbackState.repeat_state !== 'off') {
          repeatBtn.classList.add('active');
          if (playbackState.repeat_state === 'track') {
            repeatBtn.classList.add('repeat-one');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating player state:', error);
  }
}

function clearPlayerInterval() {
  if (playerUpdateInterval) {
    clearInterval(playerUpdateInterval);
  }
}

async function initializeApp() {
  try {
    await loadUserProfile();
    await loadPlaylists();
    await loadDevices();
    await updatePlayerState();

    // Set up polling
    clearPlayerInterval();
    playerUpdateInterval = setInterval(updatePlayerState, POLLING_INTERVAL);
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error initializing app', 'error');
  }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

loginBtn?.addEventListener('click', handleLogin);
logoutBtn?.addEventListener('click', handleLogout);
playPauseButton?.addEventListener('click', togglePlayPause);
nextButton?.addEventListener('click', nextTrack);
prevButton?.addEventListener('click', previousTrack);

volumeSlider?.addEventListener('input', (e) => {
  setVolume(e.target.value);
});

progressBar?.addEventListener('change', (e) => {
  seekToPosition(e.target.value);
});

searchButton?.addEventListener('click', () => {
  searchTracks(searchInput.value);
});

searchInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchTracks(searchInput.value);
  }
});

deviceSelect?.addEventListener('change', (e) => {
  currentDeviceId = e.target.value;
});

shuffleBtn?.addEventListener('click', async () => {
  try {
    const state = await backendApi('/me/player');
    await backendApi('/me/player/shuffle', 'PUT', {
      state: !state.shuffle_state,
      deviceId: currentDeviceId,
    });
    updatePlayerState();
  } catch (error) {
    console.error('Error toggling shuffle:', error);
  }
});

repeatBtn?.addEventListener('click', async () => {
  try {
    const state = await backendApi('/me/player');
    let newState = 'off';
    if (state.repeat_state === 'off') newState = 'context';
    else if (state.repeat_state === 'context') newState = 'track';

    // Note: spotify-web-api-node doesn't have setRepeat, use generic endpoint
    // This would need to be added to backend
    updatePlayerState();
  } catch (error) {
    console.error('Error toggling repeat:', error);
  }
});

likeBtn?.addEventListener('click', async () => {
  try {
    if (currentTrackId) {
      await backendApi('/me/tracks', 'POST', {
        ids: [currentTrackId],
      });
      likeBtn.classList.add('liked');
      showNotification('Added to liked songs');
    }
  } catch (error) {
    console.error('Error liking track:', error);
  }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, checking params...');
  const urlParams = new URLSearchParams(window.location.search);
  const loginSuccess = urlParams.get('login');
  console.log('Login param:', loginSuccess);
  
  if (loginSuccess === 'success') {
    console.log('Detected login=success, clearing URL');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  console.log('Calling checkAuthStatus...');
  checkAuthStatus();
});
