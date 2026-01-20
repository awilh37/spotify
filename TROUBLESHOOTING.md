# 🔧 Spotify Web Controller - Troubleshooting Guide

## Common Issues & Solutions

### 🔴 Backend Issues

#### ❌ "Cannot find module 'express'" or other dependencies
**Problem:** Dependencies not installed
```bash
# Solution:
cd backend
npm install

# Verify installation:
ls node_modules
```

#### ❌ "EADDRINUSE: address already in use :::3000"
**Problem:** Port 3000 already in use (another app is running)
```bash
# Solution Option 1: Stop the other app
# Check what's using port 3000:
lsof -i :3000

# Kill the process:
kill -9 <PID>

# Solution Option 2: Use different port
# Edit .env:
PORT=3001
```

#### ❌ "Cannot find .env file"
**Problem:** .env not created
```bash
# Solution:
# Make sure you're in github/spotify/backend/
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your editor
```

#### ❌ "Invalid SPOTIFY_CLIENT_ID or CLIENT_SECRET"
**Problem:** Credentials are wrong in .env
```bash
# Solution:
# Double-check your credentials:
# 1. Go to https://developer.spotify.com/dashboard
# 2. Copy exact values
# 3. Update .env
# 4. Restart server: npm start
```

#### ❌ Server starts but no requests work
**Problem:** Probably CORS issue
```bash
# Solution:
# Check that FRONTEND_URL in .env matches your frontend location
# Examples:
# Local: FRONTEND_URL=http://localhost:8000
# GitHub Pages: FRONTEND_URL=https://awilh37.github.io/spotify

# Restart server after changing:
npm start
```

---

### 🔴 Frontend Issues

#### ❌ "backendUrl is not defined"
**Problem:** config.js not loaded before script.js
```javascript
// Solution: Make sure index.html has in correct order:
<script src="config.js"></script>    <!-- FIRST -->
<script src="script.js"></script>    <!-- SECOND -->
```

#### ❌ "Cannot reach backend" / "Failed to fetch"
**Problem:** Backend not running or wrong URL
```bash
# Solution 1: Start backend
cd backend
npm start

# Solution 2: Check config.js has correct URL
# If localhost: const backendUrl = 'http://localhost:3000';
# If production: const backendUrl = 'https://your-render-url.onrender.com';

# Solution 3: Check backend is actually running
curl http://localhost:3000/login
# Should return redirect
```

#### ❌ "Login button does nothing"
**Problem:** config.js not loading or backend wrong
```bash
# Debug steps:
# 1. Open browser console (F12)
# 2. Check for errors
# 3. Type: console.log(backendUrl)
# 4. Should show correct URL
# 5. If undefined, config.js not loaded
```

#### ❌ Redirects to login page in loop
**Problem:** Token not being stored or retrieved
```bash
# Debug:
# 1. Open DevTools (F12)
# 2. Application/Storage tab
# 3. Check localStorage is working
# 4. Check /token endpoint returns a token

# Test in console:
fetch('http://localhost:3000/token')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

### 🔴 OAuth/Authentication Issues

#### ❌ "Invalid redirect_uri"
**Problem:** Redirect URI doesn't match Spotify Dashboard settings
```bash
# Solution:
# 1. Go to https://developer.spotify.com/dashboard
# 2. Click your app
# 3. Click "Edit Settings"
# 4. Check Redirect URIs section
# 5. Make sure it includes your SPOTIFY_REDIRECT_URI
#    For local: http://localhost:3000/callback
#    For production: https://your-backend-url.onrender.com/callback
# 6. Click "Save"
# 7. Restart backend: npm start
```

#### ❌ "Authorization failed" or "Invalid code"
**Problem:** Spotify auth returned an error
```bash
# Solution:
# 1. Check browser console for error message
# 2. Verify client credentials are correct
# 3. Try logging in again
# 4. Check that app is authorized in Spotify

# In Spotify Account Settings:
# 1. Go to https://www.spotify.com/us/account/apps/
# 2. Find your app
# 3. Click "Remove" and re-authorize
# 4. Try login again
```

#### ❌ "No playlists showing" or "Empty list"
**Problem:** Permissions not granted
```bash
# Solution:
# 1. Go to https://www.spotify.com/us/account/apps/
# 2. Find your app
# 3. Click "Remove"
# 4. Go back to controller
# 5. Log in again
# 6. Authorize WITH all permissions
# 7. Should see playlists now
```

#### ❌ "Token expired" or "401 Unauthorized"
**Problem:** Token not refreshing properly
```bash
# Solution:
# 1. Logout from app
# 2. Login again
# 3. Token should refresh automatically now

# If still failing:
# 1. Check backend logs for refresh errors
# 2. Verify SPOTIFY_CLIENT_SECRET is correct
# 3. Restart backend
```

---

### 🔴 Playback Issues

#### ❌ "Cannot play music" or "Play button does nothing"
**Problem:** No active Spotify device
```bash
# Solution:
# 1. Open Spotify app on your computer/phone
# 2. Play something to activate device
# 3. Go back to controller
# 4. Device dropdown should show your device
# 5. Select it if not selected
# 6. Try playing now
```

#### ❌ "No devices available" in dropdown
**Problem:** No Spotify devices active
```bash
# Solution:
# 1. Open Spotify on your computer
# 2. Or open Spotify on phone/tablet
# 3. Start playing ANY song to activate
# 4. Refresh web controller
# 5. Device should appear in dropdown
```

#### ❌ "Device not responding" or "Music stops"
**Problem:** Device lost connection or became inactive
```bash
# Solution:
# 1. Open Spotify app
# 2. Make sure it's playing or paused (not closed)
# 3. Select device again in dropdown
# 4. Try playing
# 5. If still issues, restart Spotify app
```

#### ❌ "Search results not showing"
**Problem:** Search API failing or slow network
```bash
# Debug:
# 1. Open console (F12)
# 2. Try searching
# 3. Check for errors
# 4. Look at Network tab
# 5. See if /search request completes

# Solution:
# 1. Make sure you typed something
# 2. Press Enter or click Search button
# 3. Wait for results to load
# 4. Check backend is running
```

---

### 🔴 CORS & Network Issues

#### ❌ "CORS error" or "Cross-Origin Request Blocked"
**Problem:** Frontend and backend URLs don't match CORS config
```bash
# Solution:
# In backend server.js, check allowedOrigins:
# It should include your frontend URL

# For local development:
allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8000',
  'http://localhost:5173',
]

# For production:
allowedOrigins = [
  'https://awilh37.github.io',
  'https://your-backend-url.onrender.com',
]

# After updating, restart backend:
npm start
```

#### ❌ "Network tab shows 0 bytes response"
**Problem:** Server didn't respond or crashed
```bash
# Debug steps:
# 1. Check backend console for errors
# 2. Verify backend is running
# 3. Check logs in terminal
# 4. Restart backend if needed

# Restart backend:
npm start
```

---

### 🟡 Performance Issues

#### ⚠️ Player updates slow or laggy
**Problem:** Polling interval too fast or network slow
```javascript
// In script.js, current polling:
const POLLING_INTERVAL = 1000; // 1 second

// If slow, increase to:
const POLLING_INTERVAL = 2000; // 2 seconds

// Save and refresh browser
```

#### ⚠️ High memory usage
**Problem:** Too many requests or intervals not clearing
```bash
# Solution:
# 1. Make sure browser is up to date
# 2. Close extra tabs
# 3. Refresh the page
# 4. Check that timers are cleared on logout
```

---

### 🟡 Display/UI Issues

#### ⚠️ UI looks broken or misaligned
**Problem:** CSS not loaded
```bash
# Solution:
# 1. Hard refresh browser (Ctrl+Shift+R)
# 2. Clear browser cache
# 3. Check style.css is in spotify folder
# 4. Check HTML links to style.css:
#    <link rel="stylesheet" href="style.css">
```

#### ⚠️ Buttons not clickable or not responding
**Problem:** JavaScript error or elements not loaded
```bash
# Debug:
# 1. Open console (F12)
# 2. Look for red errors
# 3. Fix any errors shown
# 4. Refresh page

# Check elements exist:
console.log(document.getElementById('play-pause-button'))
# Should show the button element
```

#### ⚠️ Images not loading (album art stays blank)
**Problem:** Network error or Spotify image URL broken
```bash
# Debug:
# 1. Check Network tab in DevTools
# 2. See if image requests succeed
# 3. If 403, Spotify might be blocking
# 4. Try other image size
```

---

### 🟢 Debugging Checklist

Before asking for help, check:

- [ ] Backend is running (`npm start`)
- [ ] Node modules installed (`npm install`)
- [ ] .env file created and filled
- [ ] config.js points to correct backend URL
- [ ] Spotify credentials are correct
- [ ] Redirect URI matches Spotify Dashboard
- [ ] Browser console open (F12) - no red errors
- [ ] Network tab shows successful requests
- [ ] Spotify app is open and playing
- [ ] Using correct port (3000 for backend, 8000 for frontend)

---

### 🔍 Advanced Debugging

#### Enable verbose logging:
```javascript
// In script.js, add this to debug API calls:
async function backendApi(endpoint, method = 'GET', body = null) {
  console.log(`[API] ${method} ${endpoint}`);
  // ... rest of function
  console.log(`[API] Response:`, result);
  return result;
}
```

#### Check what backend is receiving:
```bash
# Add this to server.js
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

#### Test endpoints manually:
```bash
# Test backend is running
curl http://localhost:3000/login

# Test you can get a token (after authenticating)
curl http://localhost:3000/token

# Test CORS
curl -H "Origin: http://localhost:8000" http://localhost:3000/me
```

---

### 📞 If All Else Fails

1. **Clear everything and restart:**
   ```bash
   # Stop backend (Ctrl+C)
   # Close browser
   # Delete node_modules
   rm -rf backend/node_modules
   # Start fresh
   npm install
   npm start
   ```

2. **Check the logs:**
   - Backend console output
   - Browser console (F12)
   - Network tab (F12)
   - Look for the actual error message

3. **Verify credentials:**
   - Go to https://developer.spotify.com/dashboard
   - Copy exact client ID and secret
   - Update .env
   - Restart backend

4. **Check environment URLs:**
   - Frontend URL correct in config.js?
   - Backend URL correct in config.js?
   - Redirect URI correct in Spotify Dashboard?
   - Redirect URI correct in .env?

---

**Most issues fall into one of these categories:**
1. ❌ Backend not running
2. ❌ Wrong URL in config.js
3. ❌ Wrong credentials in .env
4. ❌ Redirect URI mismatch
5. ❌ No active Spotify device

**Fix these 5 things first, and 90% of issues are resolved!** ✅
