/**
 * Content Script for Profit Orbit Domain - ULTRA SIMPLE VERSION
 * Uses localStorage polling for communication (most reliable)
 */

console.log('🔵 Profit Orbit Bridge: Content script loaded');

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
  if (!chrome.runtime?.id) {
    console.warn('🔴 Bridge: chrome.runtime not available');
    return;
  }
  
  console.log('🔵 Bridge: Querying background for status...');
  
  chrome.runtime.sendMessage({ type: 'GET_ALL_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('🔴 Bridge: Error:', chrome.runtime.lastError.message);
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
    console.log('🔵 Bridge: React app requested status, querying...');
    localStorage.removeItem('profit_orbit_request_status');
    queryStatus();
  }
}, 500); // Check every 500ms

// Query on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(queryStatus, 500);
  });
} else {
  setTimeout(queryStatus, 500);
}

// Also poll every 2 seconds to keep status updated
setInterval(queryStatus, 2000);

// Listen for manual checks
window.addEventListener('checkMercariStatus', queryStatus);

console.log('🔵 Profit Orbit Bridge: Initialized');
