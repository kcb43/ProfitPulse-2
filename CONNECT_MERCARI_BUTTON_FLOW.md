# Connect Mercari Button - Code Flow Documentation

## Overview

The "Connect Mercari" button uses a Chrome extension bridge to detect if the user is logged into Mercari.com. The flow involves:
1. React web app (Settings.jsx) - UI and button handler
2. Extension bridge script (profit-orbit-bridge.js) - Content script that communicates with extension
3. Extension background script - Checks Mercari login status
4. localStorage - Used for communication between extension and web app

## Button UI Component

```jsx
// src/pages/Settings.jsx (lines ~1100-1111)
{!mercariConnected ? (
  <>
    <Button
      variant="outline"
      size="sm"
      onClick={handleMercariLogin}
      className="flex-1 text-xs"
    >
      Open Login
    </Button>
    <Button
      variant="default"
      size="sm"
      onClick={handleMercariConnect}
      className="flex-1 text-xs"
    >
      <RefreshCw className="w-3 h-3 mr-1" />
      Connect
    </Button>
  </>
) : (
  // Connected state UI
)}
```

## Step 1: Open Login Popup (Optional)

```javascript
// src/pages/Settings.jsx (lines 496-514)
const handleMercariLogin = () => {
  // Open Mercari login in a small popup window (like Vendoo)
  const width = 500;
  const height = 650;
  const left = (window.screen.width / 2) - (width / 2);
  const top = (window.screen.height / 2) - (height / 2);
  
  window.open(
    'https://www.mercari.com/login/',
    'MercariLogin',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no`
  );
  
  toast({
    title: 'Mercari Login',
    description: 'Log into Mercari in the popup, then close it and click "Connect Mercari".',
    duration: 6000,
  });
};
```

## Step 2: Connect Button Handler

```javascript
// src/pages/Settings.jsx (lines 516-684)
const handleMercariConnect = async () => {
  try {
    console.log('🟢🟢🟢 Profit Orbit: Checking Mercari connection... 🟢🟢🟢');
    
    // STEP 1: Check if extension bridge is loaded
    const bridgeLoaded = window.__PROFIT_ORBIT_BRIDGE_LOADED === true;
    const apiAvailable = window.ProfitOrbitExtension && window.ProfitOrbitExtension.isAvailable();
    
    if (!bridgeLoaded && !apiAvailable) {
      // Extension not detected - show error and return
      console.warn('🔴 Profit Orbit: Bridge script NOT loaded!');
      toast({
        title: 'Extension Not Detected',
        description: 'Please ensure the Profit Orbit extension is installed, enabled, and refresh this page.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log('🟢 Profit Orbit: Bridge detected - loaded:', bridgeLoaded, 'API available:', apiAvailable);
    
    // STEP 2: Wait for page API if needed
    if (!window.ProfitOrbitExtension) {
      console.warn('⚠️ Profit Orbit: Page API not yet available, waiting...');
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!window.ProfitOrbitExtension) {
        console.warn('⚠️ Profit Orbit: Will use localStorage fallback method');
      }
    }
    
    // STEP 3: Show checking toast
    toast({
      title: 'Checking Connection...',
      description: 'Querying extension for Mercari login status...',
    });
    
    // STEP 4: Request status from extension via localStorage flag
    console.log('🟢 Profit Orbit: Setting localStorage request flag...');
    localStorage.setItem('profit_orbit_request_status', 'true');
    
    // STEP 5: Try direct API call if available
    if (window.ProfitOrbitExtension && window.ProfitOrbitExtension.isAvailable()) {
      console.log('🟢 Profit Orbit: Also using bridge API');
      window.ProfitOrbitExtension.getAllStatus((response) => {
        console.log('🟢 Profit Orbit: getAllStatus response:', response);
        
        const mercariStatus = response?.status?.mercari;
        if (mercariStatus?.loggedIn) {
          const userName = mercariStatus.userName || 'Mercari User';
          localStorage.setItem('profit_orbit_mercari_connected', 'true');
          localStorage.setItem('profit_orbit_mercari_user', JSON.stringify({
            userName: userName,
            marketplace: 'mercari'
          }));
          setMercariConnected(true);
          toast({
            title: 'Mercari Connected!',
            description: `Connected as ${userName}`,
          });
          return;
        }
      });
    }
    
    // STEP 6: Poll localStorage for response (fallback method)
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max
    
    const checkInterval = setInterval(() => {
      attempts++;
      const status = localStorage.getItem('profit_orbit_mercari_connected');
      
      console.log(`🟢 Profit Orbit: Polling attempt ${attempts}/${maxAttempts}, status:`, status);
      
      if (status === 'true' || attempts >= maxAttempts) {
        clearInterval(checkInterval);
        
        if (status === 'true') {
          console.log('🟢 Profit Orbit: Found connection in localStorage!');
          setMercariConnected(true);
          const userData = JSON.parse(localStorage.getItem('profit_orbit_mercari_user') || '{}');
          toast({
            title: 'Mercari Connected!',
            description: userData.userName ? `Connected as ${userData.userName}` : 'Your Mercari account is connected.',
          });
        } else {
          console.log('🔴 Profit Orbit: No connection found after polling');
          toast({
            title: 'Not Connected',
            description: 'Please log into Mercari first, then try again.',
            variant: 'destructive',
          });
        }
      }
    }, 500);
    
  } catch (error) {
    console.error('🔴 Profit Orbit: Error:', error);
    toast({
      title: 'Connection Error',
      description: error.message || 'Failed to check Mercari connection.',
      variant: 'destructive',
    });
  }
};
```

## Step 3: Extension Bridge Script (Content Script)

```javascript
// extension/profit-orbit-bridge.js (lines 121-129)
// Poll localStorage for status requests from React app
setInterval(() => {
  const requestFlag = localStorage.getItem('profit_orbit_request_status');
  if (requestFlag === 'true') {
    console.log('🔵🔵🔵 Bridge: React app requested status via localStorage flag 🔵🔵🔵');
    localStorage.removeItem('profit_orbit_request_status');
    queryStatus(); // Query background script for marketplace status
  }
}, 500);

// extension/profit-orbit-bridge.js (lines 64-92)
function queryStatus() {
  console.log('🔵 Bridge: queryStatus() called');
  
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('🔴 Bridge: chrome.runtime not available');
    return;
  }
  
  console.log('🔵 Bridge: Sending GET_ALL_STATUS message to background...');
  
  try {
    chrome.runtime.sendMessage({ type: 'GET_ALL_STATUS' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('🔴 Bridge: Error from background:', chrome.runtime.lastError.message);
        return;
      }
      
      console.log('🔵 Bridge: Received response from background:', response);
      
      if (response?.status) {
        updateLocalStorage(response.status); // Update localStorage with status
      } else {
        console.warn('⚠️ Bridge: Response has no status field:', response);
      }
    });
  } catch (error) {
    console.error('🔴 Bridge: Exception sending message:', error);
  }
}

// extension/profit-orbit-bridge.js (lines 32-61)
function updateLocalStorage(status) {
  if (!status) return;
  
  console.log('🔵 Bridge: Updating localStorage with status:', status);
  
  Object.entries(status).forEach(([marketplace, data]) => {
    if (data.loggedIn) {
      localStorage.setItem(`profit_orbit_${marketplace}_connected`, 'true');
      localStorage.setItem(`profit_orbit_${marketplace}_user`, JSON.stringify({
        userName: data.userName || data.name || 'User',
        marketplace: marketplace
      }));
      
      console.log(`🔵 Bridge: ${marketplace} marked as connected`);
      
      // Dispatch event for React app
      window.dispatchEvent(new CustomEvent('marketplaceStatusUpdate', {
        detail: { marketplace, status: data }
      }));
    } else {
      localStorage.removeItem(`profit_orbit_${marketplace}_connected`);
      localStorage.removeItem(`profit_orbit_${marketplace}_user`);
    }
  });
  
  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('extensionReady', {
    detail: { marketplaces: status }
  }));
}
```

## Step 4: Extension Background Script

```javascript
// extension/background.js (simplified - handles GET_ALL_STATUS message)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_ALL_STATUS') {
    // Check login status for all marketplaces
    // This queries the extension's stored marketplace status
    // Returns status object like:
    // {
    //   mercari: { loggedIn: true, userName: "John Doe", lastChecked: timestamp },
    //   facebook: { loggedIn: false, userName: null, lastChecked: null },
    //   ...
    // }
    
    sendResponse({ status: marketplaceStatus });
    return true; // Keep channel open for async response
  }
});
```

## Step 5: React App Listens for Updates

```javascript
// src/pages/Settings.jsx (lines 369-392)
// Poll for Mercari connection status every 500ms for faster updates
const pollInterval = setInterval(() => {
  const currentStatus = localStorage.getItem('profit_orbit_mercari_connected');
  const isConnected = currentStatus === 'true';
  
  // Always sync state with localStorage - force update if different
  if (isConnected !== mercariConnected) {
    console.log('🟢 Profit Orbit: State sync - updating from', mercariConnected, 'to', isConnected);
    setMercariConnected(isConnected);
    
    if (isConnected) {
      // Get user info
      const userData = localStorage.getItem('profit_orbit_mercari_user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          console.log('🟢 Profit Orbit: Mercari user:', parsed.userName);
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    }
  }
}, 500);

// Also listen for storage events (in case extension updates localStorage from another tab)
const handleStorageChange = (e) => {
  if (e.key === 'profit_orbit_mercari_connected') {
    const isConnected = e.newValue === 'true';
    if (isConnected !== mercariConnected) {
      setMercariConnected(isConnected);
      checkMercariStatus();
    }
  }
};
window.addEventListener('storage', handleStorageChange);

// Listen for custom events from extension
window.addEventListener('marketplaceStatusUpdate', (event) => {
  const { marketplace, status } = event.detail;
  if (marketplace === 'mercari' && status.loggedIn) {
    setMercariConnected(true);
    // ... update UI
  }
});
```

## Complete Flow Diagram

```
User clicks "Connect Mercari" button
    ↓
handleMercariConnect() called
    ↓
Check if extension bridge is loaded (window.__PROFIT_ORBIT_BRIDGE_LOADED)
    ↓
If not loaded → Show error toast, return
    ↓
If loaded → Set localStorage flag: 'profit_orbit_request_status' = 'true'
    ↓
Extension bridge script polls localStorage every 500ms
    ↓
Bridge detects flag → Calls queryStatus()
    ↓
queryStatus() sends message to background: { type: 'GET_ALL_STATUS' }
    ↓
Background script checks Mercari login status
    ↓
Background responds with marketplace status
    ↓
Bridge calls updateLocalStorage(status)
    ↓
Bridge sets localStorage:
  - 'profit_orbit_mercari_connected' = 'true'
  - 'profit_orbit_mercari_user' = JSON.stringify({ userName, marketplace })
    ↓
Bridge dispatches events:
  - 'marketplaceStatusUpdate' event
  - 'extensionReady' event
    ↓
React app polls localStorage OR listens to events
    ↓
React app updates state: setMercariConnected(true)
    ↓
UI updates to show "Connected" state
    ↓
Success toast shown: "Mercari Connected!"
```

## Key localStorage Keys Used

- `profit_orbit_request_status` - Flag set by React app to request status from extension
- `profit_orbit_mercari_connected` - Set to 'true' when Mercari is connected
- `profit_orbit_mercari_user` - JSON string with user info: `{ userName: "John Doe", marketplace: "mercari" }`

## Page API Script (Alternative Method)

```javascript
// extension/profit-orbit-page-api.js
window.ProfitOrbitExtension = {
  getAllStatus: function(callback) {
    console.log('🟢 Page API: getAllStatus() called');
    
    // Set request flag
    localStorage.setItem('profit_orbit_request_status', 'true');
    
    // Poll for response (content script will update localStorage)
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Check if we got a response
      const mercariStatus = localStorage.getItem('profit_orbit_mercari_connected');
      
      if (mercariStatus === 'true' || attempts >= maxAttempts) {
        clearInterval(checkInterval);
        
        // Build response from localStorage
        const status = {};
        const marketplaces = ['mercari', 'facebook', 'poshmark', 'ebay', 'etsy'];
        
        marketplaces.forEach(marketplace => {
          const connected = localStorage.getItem(`profit_orbit_${marketplace}_connected`) === 'true';
          const userData = localStorage.getItem(`profit_orbit_${marketplace}_user`);
          
          status[marketplace] = {
            loggedIn: connected,
            userName: userData ? JSON.parse(userData).userName : null
          };
        });
        
        if (callback) {
          callback({ status: status });
        }
      }
    }, 500);
  }
};
```

## Error Handling

The code handles several error scenarios:

1. **Extension not detected**: Shows error toast with installation instructions
2. **Bridge API not available**: Falls back to localStorage polling method
3. **No connection found**: Shows "Not Connected" toast after 10 seconds of polling
4. **Network/API errors**: Catches exceptions and shows error toast

## Notes

- The extension must be installed and enabled for this to work
- The content script (`profit-orbit-bridge.js`) must load on the page
- Communication uses localStorage as a bridge between extension content script and React app
- The extension background script checks Mercari login status by monitoring cookies/DOM on mercari.com tabs
- Status is cached and updated periodically by the extension

