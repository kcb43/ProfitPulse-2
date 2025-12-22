/**
 * Page Context API - SIMPLIFIED
 * Uses localStorage polling instead of complex postMessage
 */

(function() {
  'use strict';
  
  console.log('🟢 Profit Orbit Page API: Loading...');
  
  // Set bridge loaded flag in page context (for React app detection)
  window.__PROFIT_ORBIT_BRIDGE_LOADED = true;
  console.log('🟢 Page API: Bridge flag set - window.__PROFIT_ORBIT_BRIDGE_LOADED = true');
  
  // Simple API that uses localStorage polling
  window.ProfitOrbitExtension = {
    queryStatus: function() {
      console.log('🟢 Page API: queryStatus() called - setting request flag');
      localStorage.setItem('profit_orbit_request_status', 'true');
    },
    
    isAvailable: function() {
      return true;
    },
    
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
  
  window.dispatchEvent(new CustomEvent('profitOrbitBridgeReady', {
    detail: { api: window.ProfitOrbitExtension }
  }));
  
  console.log('🟢 Profit Orbit Page API: Ready!');
})();
