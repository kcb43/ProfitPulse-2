/**
 * Page Context API - Injected into page
 * Exposes ProfitOrbitExtension API to React app
 */

(function() {
  'use strict';
  
  console.log('🟢 Profit Orbit Page API: Loading...');
  
  // Expose API
  window.ProfitOrbitExtension = {
    queryStatus: function() {
      console.log('🟢 Profit Orbit Page API: queryStatus() called');
      window.postMessage({ type: 'PROFIT_ORBIT_QUERY_STATUS' }, '*');
    },
    
    isAvailable: function() {
      return true;
    },
    
    getAllStatus: function(callback) {
      console.log('🟢 Profit Orbit Page API: getAllStatus() called');
      const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      // Store callback
      window.__ProfitOrbitCallbacks = window.__ProfitOrbitCallbacks || {};
      window.__ProfitOrbitCallbacks[requestId] = callback;
      
      // Send request to content script
      window.postMessage({
        type: 'PROFIT_ORBIT_GET_ALL_STATUS',
        requestId: requestId
      }, '*');
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (window.__ProfitOrbitCallbacks[requestId]) {
          delete window.__ProfitOrbitCallbacks[requestId];
          if (callback) callback({ error: 'Timeout waiting for response' });
        }
      }, 5000);
    }
  };
  
  // Listen for responses from content script
  window.addEventListener('message', function(event) {
    if (event.data.type === 'PROFIT_ORBIT_STATUS_RESPONSE') {
      const callback = window.__ProfitOrbitCallbacks?.[event.data.requestId];
      if (callback) {
        delete window.__ProfitOrbitCallbacks[event.data.requestId];
        if (event.data.error) {
          callback({ error: event.data.error });
        } else {
          callback(event.data.data || {});
        }
      }
    }
  });
  
  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('profitOrbitBridgeReady', {
    detail: { api: window.ProfitOrbitExtension }
  }));
  
  console.log('🟢 Profit Orbit Page API: Ready!', window.ProfitOrbitExtension);
})();
