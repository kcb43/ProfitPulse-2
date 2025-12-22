/**
 * Content Script for Profit Orbit Domain
 * Bridges communication between extension and Profit Orbit web app
 * SIMPLIFIED VERSION - Direct communication
 */

console.log('🔵 Profit Orbit Bridge: Content script loaded');

// Immediately inject page script to expose API
(function injectPageAPI() {
  'use strict';
  
  // Create script element
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('profit-orbit-page-api.js');
  
  script.onload = function() {
    console.log('🔵 Profit Orbit Bridge: Page API script loaded');
    this.remove();
  };
  
  script.onerror = function() {
    console.error('🔴 Profit Orbit Bridge: Failed to load page API script');
    this.remove();
  };
  
  // Inject immediately
  (document.head || document.documentElement).appendChild(script);
})();

// Function to query background for all marketplace statuses
function queryAllStatus() {
  if (!chrome.runtime?.id) {
    console.warn('🔴 Profit Orbit Bridge: chrome.runtime not available');
    return;
  }
  
  console.log('🔵 Profit Orbit Bridge: Querying background for status...');
  
  chrome.runtime.sendMessage({ type: 'GET_ALL_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('🔴 Profit Orbit Bridge: Error:', chrome.runtime.lastError.message);
      return;
    }
    
    console.log('🔵 Profit Orbit Bridge: Received status:', response);
    
    if (response?.status) {
      // Update localStorage for each marketplace
      Object.entries(response.status).forEach(([marketplace, data]) => {
        if (data.loggedIn) {
          localStorage.setItem(`profit_orbit_${marketplace}_connected`, 'true');
          localStorage.setItem(`profit_orbit_${marketplace}_user`, JSON.stringify({
            userName: data.userName || data.name || 'User',
            marketplace: marketplace
          }));
          
          // Dispatch event to page
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
        detail: { marketplaces: response.status }
      }));
    }
  });
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔵 Profit Orbit Bridge: Received message:', message.type);
  
  if (message.type === 'MARKETPLACE_STATUS_UPDATE') {
    const { marketplace, data } = message;
    
    if (data.loggedIn) {
      localStorage.setItem(`profit_orbit_${marketplace}_connected`, 'true');
      localStorage.setItem(`profit_orbit_${marketplace}_user`, JSON.stringify(data));
      
      window.dispatchEvent(new CustomEvent('marketplaceStatusUpdate', {
        detail: { marketplace, status: data }
      }));
    } else {
      localStorage.removeItem(`profit_orbit_${marketplace}_connected`);
      localStorage.removeItem(`profit_orbit_${marketplace}_user`);
    }
    
    sendResponse({ received: true });
  }
  
  return true;
});

// Query status on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(queryAllStatus, 500);
  });
} else {
  setTimeout(queryAllStatus, 500);
}

// Poll every 2 seconds
setInterval(queryAllStatus, 2000);

// Listen for manual check requests
window.addEventListener('checkMercariStatus', queryAllStatus);

console.log('🔵 Profit Orbit Bridge: Initialized');
