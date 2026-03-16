// ============================================================================
// SPOTIFY WEB CONTROLLER - Frontend
// ============================================================================

// Configuration
const BACKEND_URL = backendUrl || 'https://rand0m.tplinkdns.com/spotify';
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
const browserTitle = document.getElementById('browser-title');
const browserContent = document.getElementById('browser-content');
const btnPlaylists = document.getElementById('btn-playlists');
const btnSavedAlbums = document.getElementById('btn-saved-albums');
const btnFollowedArtists = document.getElementById('btn-followed-artists');
const btnSavedTracks = document.getElementById('btn-saved-tracks');
const pipToggle = document.getElementById('pip-toggle');
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
let pipWindow = null;
let pipEnabled = false;

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

async function loadPlaylists(showInBrowser = false) {
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
        li.addEventListener('click', () => viewPlaylist(playlist.id));
        playlistList.appendChild(li);
      });

      if (showInBrowser) {
        renderPlaylistBrowse(data.items);
      }
    } else {
      playlistList.innerHTML = '<li>No playlists found</li>';
      if (showInBrowser) {
        browserContent.innerHTML = '<div class="search-result-item">No playlists found</div>';
      }
    }
  } catch (error) {
    console.error('Error loading playlists:', error);
    showNotification('Error loading playlists', 'error');
  }
}

function clearBrowser() {
  browserContent.innerHTML = '<div class="search-result-item">Select a library tab or search result</div>';
}

function createMediaCard(title, subtitle, imageUrl, actionText, onAction, onClickPrimary) {
  const card = document.createElement('div');
  card.className = 'search-result-item';

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    card.appendChild(img);
  }

  const info = document.createElement('div');
  info.className = 'track-info';

  const titleEl = document.createElement('div');
  titleEl.className = 'track-title';
  titleEl.textContent = title;

  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'track-artist';
  subtitleEl.textContent = subtitle;

  info.appendChild(titleEl);
  info.appendChild(subtitleEl);

  const actionContainer = document.createElement('div');
  actionContainer.style.display = 'flex';
  actionContainer.style.gap = '8px';
  actionContainer.style.marginTop = '8px';

  const primaryButton = document.createElement('button');
  primaryButton.textContent = 'View';
  primaryButton.style.flex = '1';
  primaryButton.style.padding = '6px 8px';
  primaryButton.style.borderRadius = '10px';
  primaryButton.style.border = '1px solid rgba(255,255,255,.2)';
  primaryButton.style.background = 'rgba(0,0,0,.35)';
  primaryButton.style.color = '#fff';
  primaryButton.style.cursor = 'pointer';
  primaryButton.addEventListener('click', (e) => { e.stopPropagation(); if (onClickPrimary) onClickPrimary(); });

  actionContainer.appendChild(primaryButton);

  if (actionText && onAction) {
    const playBtn = document.createElement('button');
    playBtn.textContent = actionText;
    playBtn.style.flex = '1';
    playBtn.style.padding = '6px 8px';
    playBtn.style.borderRadius = '10px';
    playBtn.style.border = '1px solid rgba(29,185,84,0.8)';
    playBtn.style.background = 'rgba(29,185,84,0.2)';
    playBtn.style.color = '#000';
    playBtn.style.cursor = 'pointer';
    playBtn.addEventListener('click', (e) => { e.stopPropagation(); onAction(); });
    actionContainer.appendChild(playBtn);
  }

  info.appendChild(actionContainer);
  card.appendChild(info);

  if (onClickPrimary) {
    card.addEventListener('click', onClickPrimary);
  }

  return card;
}

function renderPlaylistBrowse(playlists) {
  browserTitle.textContent = 'Your Playlists';
  browserContent.innerHTML = '';
  if (!playlists || playlists.length === 0) {
    browserContent.innerHTML = '<div class="search-result-item">No playlists available</div>';
    return;
  }
  playlists.forEach(pl => {
    const imageUrl = pl.images && pl.images[0] ? pl.images[0].url : '';
    const card = createMediaCard(pl.name, pl.owner?.display_name || 'Playlist', imageUrl,
      'Play', () => playPlaylist(pl.uri), () => viewPlaylist(pl.id));
    browserContent.appendChild(card);
  });
}

function renderAlbumBrowse(albums) {
  browserTitle.textContent = 'Saved Albums';
  browserContent.innerHTML = '';
  if (!albums || albums.length === 0) {
    browserContent.innerHTML = '<div class="search-result-item">No saved albums found</div>';
    return;
  }
  albums.forEach(entry => {
    const album = entry.album || entry;
    const imageUrl = album.images && album.images.length ? album.images[0].url : '';
    const card = createMediaCard(album.name, (album.artists || []).map(a => a.name).join(', '), imageUrl,
      'Play', () => playPlaylist(album.uri), () => viewAlbum(album.id));
    browserContent.appendChild(card);
  });
}

function renderArtistBrowse(artists) {
  browserTitle.textContent = 'Followed Artists';
  browserContent.innerHTML = '';
  if (!artists || artists.length === 0) {
    browserContent.innerHTML = '<div class="search-result-item">No followed artists found</div>';
    return;
  }
  artists.forEach(artist => {
    const imageUrl = artist.images && artist.images.length ? artist.images[0].url : '';
    const card = createMediaCard(artist.name, `${artist.followers?.total || 0} followers`, imageUrl,
      'Top', () => viewArtist(artist.id), () => viewArtist(artist.id));
    browserContent.appendChild(card);
  });
}

function renderTrackBrowse(tracks) {
  browserTitle.textContent = 'Saved Tracks';
  browserContent.innerHTML = '';
  if (!tracks || tracks.length === 0) {
    browserContent.innerHTML = '<div class="search-result-item">No saved tracks found</div>';
    return;
  }
  tracks.forEach(item => {
    const track = item.track || item;
    const imageUrl = track.album?.images && track.album.images.length ? track.album.images[0].url : '';
    const card = createMediaCard(track.name, (track.artists || []).map(a => a.name).join(', '), imageUrl,
      'Play', () => playTrack(track.uri), () => playTrack(track.uri));
    browserContent.appendChild(card);
  });
}

async function viewPlaylist(id) {
  try {
    const data = await backendApi(`/playlist/${id}/tracks`);
    if (data.items && data.items.length) {
      renderTrackBrowse(data.items.map(item => item.track));
      browserTitle.textContent = 'Playlist contents';
    } else {
      browserContent.innerHTML = '<div class="search-result-item">No tracks in playlist</div>';
    }
  } catch (err) {
    console.error('Error viewing playlist:', err);
    showNotification('Unable to load playlist tracks', 'error');
  }
}

async function viewAlbum(id) {
  try {
    const data = await backendApi(`/album/${id}/tracks`);
    if (data.items && data.items.length) {
      // Convert album track items into standard track object so render function works
      const tracks = data.items.map(track => ({ track }));
      renderTrackBrowse(tracks);
      browserTitle.textContent = 'Album tracks';
    } else {
      browserContent.innerHTML = '<div class="search-result-item">No tracks in album</div>';
    }
  } catch (err) {
    console.error('Error viewing album:', err);
    showNotification('Unable to load album tracks', 'error');
  }
}

async function viewArtist(id) {
  try {
    const data = await backendApi(`/artist/${id}/top-tracks`);
    if (data.tracks && data.tracks.length) {
      const tracks = data.tracks.map(track => ({ track }));
      renderTrackBrowse(tracks);
      browserTitle.textContent = 'Artist top tracks';
    } else {
      browserContent.innerHTML = '<div class="search-result-item">No top tracks found for artist</div>';
    }
  } catch (err) {
    console.error('Error viewing artist:', err);
    showNotification('Unable to load artist tracks', 'error');
  }
}

async function loadSavedAlbums() {
  try {
    const data = await backendApi('/me/albums');
    renderAlbumBrowse(data.items || []);
  } catch (err) {
    console.error('Error loading saved albums:', err);
    showNotification('Error loading saved albums', 'error');
  }
}

async function loadFollowedArtists() {
  try {
    const data = await backendApi('/me/following/artists');
    renderArtistBrowse(data.artists?.items || []);
  } catch (err) {
    console.error('Error loading followed artists:', err);
    showNotification('Error loading followed artists', 'error');
  }
}

async function loadSavedTracks() {
  try {
    const data = await backendApi('/me/tracks');
    renderTrackBrowse(data.items || []);
  } catch (err) {
    console.error('Error loading saved tracks:', err);
    showNotification('Error loading saved tracks', 'error');
  }
}

function setActiveBrowseButton(activeBtn) {
  [btnPlaylists, btnSavedAlbums, btnFollowedArtists, btnSavedTracks].forEach(btn => {
    btn.classList.toggle('active', btn === activeBtn);
  });
}

async function togglePipWindow() {
  pipEnabled = !pipEnabled;
  if (!pipEnabled) {
    if (pipWindow) pipWindow.remove();
    pipWindow = null;
    pipToggle.textContent = 'Mini Player';
    return;
  }

  pipToggle.textContent = 'Close Mini Player';
  if (!pipWindow) {
    pipWindow = document.createElement('div');
    pipWindow.className = 'pip-window';
    pipWindow.innerHTML = `
      <button class="pip-close">×</button>
      <h4>Mini Spotify Remote</h4>
      <div id="pip-track" style="font-size:0.9rem; margin-bottom:8px;">No track loaded</div>
      <div id="pip-artist" style="font-size:0.8rem; color:#ccc; margin-bottom:12px;">-</div>
      <div class="pip-action-buttons">
        <button id="pip-prev">⏮</button>
        <button id="pip-play">⏯</button>
        <button id="pip-next">⏭</button>
      </div>
    `;
    document.body.appendChild(pipWindow);

    pipWindow.querySelector('.pip-close').addEventListener('click', togglePipWindow);
    pipWindow.querySelector('#pip-prev').addEventListener('click', previousTrack);
    pipWindow.querySelector('#pip-play').addEventListener('click', togglePlayPause);
    pipWindow.querySelector('#pip-next').addEventListener('click', nextTrack);
  }
  updatePipInfo();
}

function updatePipInfo() {
  if (!pipEnabled || !pipWindow) return;
  const trackText = trackName.textContent || 'No track playing';
  const artistText = artistName.textContent || '-';
  const pipTrack = pipWindow.querySelector('#pip-track');
  const pipArtist = pipWindow.querySelector('#pip-artist');
  pipTrack.textContent = trackText;
  pipArtist.textContent = artistText;
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
    if (!query || !query.trim()) {
      searchResults.innerHTML = '';
      return;
    }

    // Request multiple types from backend
    const data = await backendApi(`/search?q=${encodeURIComponent(query)}&type=track,album,artist,playlist`);
    searchResults.innerHTML = '';

    // Helper to create section headers
    function addSectionHeader(title) {
      const h = document.createElement('h3');
      h.className = 'search-section-header';
      h.textContent = title;
      searchResults.appendChild(h);
    }

    // Tracks
    if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
      addSectionHeader('Tracks');
      data.tracks.items.forEach(track => {
        const div = document.createElement('div');
        div.className = 'search-result-item';

        const img = document.createElement('img');
        if (track.album && track.album.images && track.album.images.length > 0) {
          img.src = track.album.images[Math.max(0, track.album.images.length - 1)].url;
        }

        const info = document.createElement('div');
        info.className = 'track-info';

        const trackTitle = document.createElement('div');
        trackTitle.className = 'track-title';
        trackTitle.textContent = track.name;

        const artist = document.createElement('div');
        artist.className = 'track-artist';
        artist.textContent = (track.artists || []).map(a => a.name).join(', ');

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
    }

    // Albums
    if (data.albums && data.albums.items && data.albums.items.length > 0) {
      addSectionHeader('Albums');
      data.albums.items.forEach(album => {
        const div = document.createElement('div');
        div.className = 'search-result-item';

        const img = document.createElement('img');
        if (album.images && album.images.length > 0) img.src = album.images[Math.max(0, album.images.length - 1)].url;

        const info = document.createElement('div');
        info.className = 'track-info';

        const title = document.createElement('div');
        title.className = 'track-title';
        title.textContent = album.name;

        const artist = document.createElement('div');
        artist.className = 'track-artist';
        artist.textContent = (album.artists || []).map(a => a.name).join(', ');

        info.appendChild(title);
        info.appendChild(artist);

        div.appendChild(img);
        div.appendChild(info);
        // Play the album context when clicked
        div.addEventListener('click', () => {
          viewAlbum(album.id);
          searchResults.innerHTML = '';
          searchInput.value = '';
        });

        searchResults.appendChild(div);
      });
    }

    // Playlists
    if (data.playlists && data.playlists.items && data.playlists.items.length > 0) {
      addSectionHeader('Playlists');
      data.playlists.items.forEach(pl => {
        const div = document.createElement('div');
        div.className = 'search-result-item';

        const img = document.createElement('img');
        if (pl.images && pl.images.length > 0) img.src = pl.images[0].url;

        const info = document.createElement('div');
        info.className = 'track-info';

        const title = document.createElement('div');
        title.className = 'track-title';
        title.textContent = pl.name;

        const owner = document.createElement('div');
        owner.className = 'track-artist';
        owner.textContent = (pl.owner && pl.owner.display_name) || '';

        info.appendChild(title);
        info.appendChild(owner);

        div.appendChild(img);
        div.appendChild(info);
        div.addEventListener('click', () => {
          viewPlaylist(pl.id);
          searchResults.innerHTML = '';
          searchInput.value = '';
        });

        searchResults.appendChild(div);
      });
    }

    // Artists
    if (data.artists && data.artists.items && data.artists.items.length > 0) {
      addSectionHeader('Artists');
      data.artists.items.forEach(artist => {
        const div = document.createElement('div');
        div.className = 'search-result-item';

        const img = document.createElement('img');
        if (artist.images && artist.images.length > 0) img.src = artist.images[Math.max(0, artist.images.length - 1)].url;

        const info = document.createElement('div');
        info.className = 'track-info';

        const title = document.createElement('div');
        title.className = 'track-title';
        title.textContent = artist.name;

        const followers = document.createElement('div');
        followers.className = 'track-artist';
        followers.textContent = `${artist.followers ? artist.followers.total : 0} followers`;

        info.appendChild(title);
        info.appendChild(followers);

        div.appendChild(img);
        div.appendChild(info);
        // On artist click, fetch top tracks and play the first one
        div.addEventListener('click', () => {
          viewArtist(artist.id);
          searchResults.innerHTML = '';
          searchInput.value = '';
        });

        searchResults.appendChild(div);
      });
    }

    // If no results in any section, show not found
    const anyResults = (data.tracks && data.tracks.items && data.tracks.items.length) ||
      (data.albums && data.albums.items && data.albums.items.length) ||
      (data.playlists && data.playlists.items && data.playlists.items.length) ||
      (data.artists && data.artists.items && data.artists.items.length);

    if (!anyResults) {
      searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
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
    updatePipInfo();
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
    await loadPlaylists(true);
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

btnPlaylists?.addEventListener('click', async () => {
  setActiveBrowseButton(btnPlaylists);
  await loadPlaylists(true);
});

btnSavedAlbums?.addEventListener('click', async () => {
  setActiveBrowseButton(btnSavedAlbums);
  await loadSavedAlbums();
});

btnFollowedArtists?.addEventListener('click', async () => {
  setActiveBrowseButton(btnFollowedArtists);
  await loadFollowedArtists();
});

btnSavedTracks?.addEventListener('click', async () => {
  setActiveBrowseButton(btnSavedTracks);
  await loadSavedTracks();
});

pipToggle?.addEventListener('click', togglePipWindow);

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
