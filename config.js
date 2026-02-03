// Spotify Web Controller - Backend URL Configuration
// ===================================================
// Update this URL to match your backend server

const backendUrl = (() => {
  // Local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // Production (GitHub Pages) - Using ngrok tunnel
  if (window.location.hostname === 'awilh37.github.io') {
    return 'https://rand0m.tplinkdns.com/spotify'; 
  }
  
  // Fallback
  return 'https://rand0m.tplinkdns.com/spotify';
})();
