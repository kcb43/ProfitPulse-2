/**
 * Content Script for Profit Orbit Domain
 * Bridges communication between extension and Profit Orbit web app
 */

console.log('Profit Orbit Extension: Bridge script loaded on Profit Orbit domain');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Profit Orbit received message from extension:', message);
  
  if (message.type === 'MARKETPLACE_STATUS_UPDATE') {
    const marketplace = message.marketplace;
    const data = message.data;
    
    // Update localStorage so the web app can access it
    if (data.loggedIn) {
      localStorage.setItem(`profit_orbit_${marketplace}_connected`, 'true');
      localStorage.setItem(`profit_orbit_${marketplace}_user`, JSON.stringify(data));
      console.log(`${marketplace} connection saved to localStorage`);
      
      // Dispatch custom event that React can listen to
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

// On page load, query extension for all marketplace statuses
window.addEventListener('load', () => {
  setTimeout(() => {
    chrome.runtime.sendMessage(
      { type: 'GET_ALL_STATUS' },
      (response) => {
        if (response && response.status) {
          console.log('Initial marketplace statuses:', response.status);
          
          // Update localStorage for all marketplaces
          Object.entries(response.status).forEach(([marketplace, data]) => {
            if (data.loggedIn) {
              localStorage.setItem(`profit_orbit_${marketplace}_connected`, 'true');
              localStorage.setItem(`profit_orbit_${marketplace}_user`, JSON.stringify(data));
            }
          });
          
          // Trigger page update
          window.dispatchEvent(new CustomEvent('extensionReady', {
            detail: { marketplaces: response.status }
          }));
        }
      }
    );
  }, 1000);
});

console.log('Profit Orbit Extension: Bridge script initialized');

