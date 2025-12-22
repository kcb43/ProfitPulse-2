/**
 * Content Script for Profit Orbit Domain - ULTRA SIMPLE VERSION
 * Uses localStorage polling for communication (most reliable)
 */

// Prevent multiple initializations
if (window.__PROFIT_ORBIT_BRIDGE_INITIALIZED) {
  console.log('🔵 Bridge: Already initialized, skipping...');
} else {
  window.__PROFIT_ORBIT_BRIDGE_INITIALIZED = true;
  
  // CRITICAL: This log should appear in the PAGE CONSOLE (F12), not service worker console
  console.log('🔵🔵🔵 Profit Orbit Bridge: Content script loaded - CHECK PAGE CONSOLE (F12) 🔵🔵🔵');
  console.log('🔵 Bridge: Current URL:', window.location.href);
  
  // Store runtime ID when available (it can become undefined later)
  let storedRuntimeId = null;
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
    storedRuntimeId = chrome.runtime.id;
    console.log('🔵 Bridge: Chrome runtime ID:', storedRuntimeId);
  }
  
  // Make it VERY visible
  if (typeof window !== 'undefined') {
    window.__PROFIT_ORBIT_BRIDGE_LOADED = true;
    window.__PROFIT_ORBIT_RUNTIME_ID = storedRuntimeId;
    console.log('🔵 Bridge: Window flag set - window.__PROFIT_ORBIT_BRIDGE_LOADED = true');
  }
}

// Function to update localStorage with marketplace status
function updateLocalStorage(status) {
  if (!status) return;
  
  Object.entries(status).forEach(([marketplace, data]) => {
    if (data.loggedIn) {
      localStorage.setItem(`profit_orbit_${marketplace}_connected`, 'true');
      localStorage.setItem(`profit_orbit_${marketplace}_user`, JSON.stringify({
        userName: data.userName || data.name || 'User',
        marketplace: marketplace
      }));
      
      // Dispatch event
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

// Function to query status from background
function queryStatus() {
  // Check if we're in content script context (has chrome.runtime)
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('🔴 Bridge: chrome.runtime not available');
    return;
  }
  
  // Use stored runtime ID or try to get it fresh
  const runtimeId = chrome.runtime.id || window.__PROFIT_ORBIT_RUNTIME_ID;
  
  if (!runtimeId) {
    // Try to get it from chrome.runtime.getURL or sendMessage (which works even without id)
    console.log('🔵 Bridge: chrome.runtime.id not available, attempting sendMessage anyway...');
  } else {
    console.log('🔵 Bridge: Querying background for status...');
    console.log('🔵 Bridge: Using runtime ID:', runtimeId);
  }
  
  // sendMessage works even if chrome.runtime.id is undefined (it uses the extension context)
  chrome.runtime.sendMessage({ type: 'GET_ALL_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('🔴 Bridge: Error:', chrome.runtime.lastError.message);
      
      // If context invalidated, try to refresh
      if (chrome.runtime.lastError.message.includes('Extension context invalidated')) {
        console.error('🔴 Bridge: Extension context invalidated - please reload extension');
        window.__PROFIT_ORBIT_RUNTIME_ID = null;
      }
      return;
    }
    
    console.log('🔵 Bridge: Received status:', response);
    
    if (response?.status) {
      updateLocalStorage(response.status);
    }
  });
}

// Listen for background messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔵 Bridge: Received message:', message.type);
  
  if (message.type === 'MARKETPLACE_STATUS_UPDATE') {
    const { marketplace, data } = message;
    
    if (data.loggedIn) {
      localStorage.setItem(`profit_orbit_${marketplace}_connected`, 'true');
      localStorage.setItem(`profit_orbit_${marketplace}_user`, JSON.stringify(data));
      
      window.dispatchEvent(new CustomEvent('marketplaceStatusUpdate', {
        detail: { marketplace, status: data }
      }));
    }
    
    sendResponse({ received: true });
  }
  
  return true;
});

// Poll localStorage for status requests from React app
setInterval(() => {
  // Check if React app is requesting status
  const requestFlag = localStorage.getItem('profit_orbit_request_status');
  if (requestFlag === 'true') {
    console.log('🔵🔵🔵 Bridge: React app requested status, querying... 🔵🔵🔵');
    localStorage.removeItem('profit_orbit_request_status');
    queryStatus();
  }
}, 500); // Check every 500ms

// Wait for chrome.runtime to be available before setting up polling
function waitForChromeRuntime(callback, maxAttempts = 10) {
  let attempts = 0;
  const checkInterval = setInterval(() => {
    attempts++;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      clearInterval(checkInterval);
      console.log('🔵 Bridge: chrome.runtime is now available');
      callback();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.error('🔴 Bridge: chrome.runtime never became available after', maxAttempts, 'attempts');
    }
  }, 500);
}

// Query on load (wait for chrome.runtime first)
waitForChromeRuntime(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(queryStatus, 500);
    });
  } else {
    setTimeout(queryStatus, 500);
  }

  // Also poll every 2 seconds to keep status updated
  setInterval(queryStatus, 2000);
});

// Listen for manual checks
window.addEventListener('checkMercariStatus', queryStatus);

console.log('🔵 Profit Orbit Bridge: Initialized');
