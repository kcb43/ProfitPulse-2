/**
 * Content Script for Profit Orbit Domain
 * SIMPLIFIED - Direct communication with background
 */

// IMMEDIATE LOG - Should appear FIRST
// Using try-catch to prevent any parse errors from silently failing
try {
  console.log('🔵🔵🔵 PROFIT ORBIT BRIDGE SCRIPT STARTING 🔵🔵🔵');
  console.log('🔵 Bridge: Script file loaded at:', new Date().toISOString());
  console.log('🔵 Bridge: URL:', window.location.href);
  console.log('🔵 Bridge: Document ready state:', document.readyState);
  console.log('🔵 Bridge: Content script context - window exists:', typeof window !== 'undefined');
  console.log('🔵 Bridge: Content script context - document exists:', typeof document !== 'undefined');
  console.log('🔵 Bridge: Content script context - chrome exists:', typeof chrome !== 'undefined');
} catch (e) {
  console.error('🔴 Bridge: ERROR in initial logging:', e);
}

// Prevent multiple initializations (using content script's isolated window)
// Note: This is the content script's window, NOT the page's window
if (typeof window !== 'undefined' && window.__PROFIT_ORBIT_BRIDGE_INITIALIZED) {
  console.log('⚠️ Bridge: Already initialized, skipping duplicate load');
  // Don't throw - just return to avoid breaking injection
  // throw new Error('Bridge script already initialized');
} else {
  if (typeof window !== 'undefined') {
    window.__PROFIT_ORBIT_BRIDGE_INITIALIZED = true;
  }
}

// Check chrome availability immediately
console.log('🔵 Bridge: typeof chrome:', typeof chrome);
if (typeof chrome !== 'undefined') {
  console.log('🔵 Bridge: chrome.runtime exists:', !!chrome.runtime);
  if (chrome.runtime) {
    console.log('🔵 Bridge: chrome.runtime.id:', chrome.runtime.id);
    console.log('🔵 Bridge: chrome.runtime.sendMessage exists:', typeof chrome.runtime.sendMessage);
  }
} else {
  console.error('🔴 Bridge: chrome is undefined - this is a content script, chrome should exist!');
}

// Function to update localStorage with marketplace status
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
        updateLocalStorage(response.status);
      } else {
        console.warn('⚠️ Bridge: Response has no status field:', response);
      }
    });
  } catch (error) {
    console.error('🔴 Bridge: Exception sending message:', error);
  }
}

// Listen for background messages
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('🔵 Bridge: Received message from background:', message.type);
    
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
  console.log('🔵 Bridge: Message listener registered');
} else {
  console.error('🔴 Bridge: Cannot register message listener - chrome.runtime not available');
}

// Poll localStorage for status requests from React app
setInterval(() => {
  const requestFlag = localStorage.getItem('profit_orbit_request_status');
  if (requestFlag === 'true') {
    console.log('🔵🔵🔵 Bridge: React app requested status via localStorage flag 🔵🔵🔵');
    localStorage.removeItem('profit_orbit_request_status');
    queryStatus();
  }
}, 500);

// Query status on load
function initializePolling() {
  console.log('🔵 Bridge: Initializing polling...');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🔵 Bridge: DOMContentLoaded fired, querying status...');
      setTimeout(queryStatus, 500);
    });
  } else {
    console.log('🔵 Bridge: Document already loaded, querying status immediately...');
    setTimeout(queryStatus, 500);
  }

  // Poll every 2 seconds
  setInterval(() => {
    queryStatus();
  }, 2000);
  
  console.log('🔵 Bridge: Polling initialized');
}

// Start initialization
initializePolling();

// Listen for manual checks
window.addEventListener('checkMercariStatus', () => {
  console.log('🔵 Bridge: Manual check requested via event');
  queryStatus();
});

// Inject bridge detection flag into page context (so React app can see it)
function injectBridgeFlag() {
  try {
    // Create a script element that runs in page context
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        if (typeof window !== 'undefined') {
          window.__PROFIT_ORBIT_BRIDGE_LOADED = true;
          console.log('🔵 Bridge: Window flag set in PAGE CONTEXT - window.__PROFIT_ORBIT_BRIDGE_LOADED = true');
          // Dispatch event so React app knows bridge is ready
          try {
            window.dispatchEvent(new CustomEvent('profitOrbitBridgeLoaded'));
          } catch (e) {
            console.warn('🔵 Bridge: Could not dispatch event:', e);
          }
        }
      })();
    `;
    
    // Find injection target - try multiple methods
    // Note: We can't append directly to document, must use head or documentElement
    let target = null;
    
    // Method 1: Try document.head (preferred)
    if (document.head) {
      target = document.head;
    }
    // Method 2: Try document.documentElement (HTML element)
    else if (document.documentElement) {
      target = document.documentElement;
    }
    // Method 3: Try document.body (might exist at document_start in some cases)
    else if (document.body) {
      target = document.body;
    }
    
    if (target) {
      try {
        // Use insertBefore to ensure script executes immediately
        // Insert at the beginning to ensure it runs before other scripts
        if (target.firstChild) {
          target.insertBefore(script, target.firstChild);
        } else {
          target.appendChild(script);
        }
        console.log('🔵 Bridge: Bridge flag injected into page context via', target.tagName || 'unknown');
        // Remove script tag after execution
        setTimeout(() => {
          try {
            if (script.parentNode) {
              script.parentNode.removeChild(script);
            }
          } catch (e) {
            // Ignore removal errors
          }
        }, 100);
      } catch (error) {
        console.error('🔴 Bridge: Failed to inject script:', error);
        console.error('🔴 Bridge: Error details:', error.message, error.stack);
        // Retry with delay
        setTimeout(() => {
          try {
            injectBridgeFlag();
          } catch (e) {
            console.error('🔴 Bridge: Retry also failed:', e);
          }
        }, 100);
      }
    } else {
      // DOM not ready yet, wait for it
      console.log('🔵 Bridge: DOM not ready, waiting... (readyState:', document.readyState, ')');
      const tryInject = () => {
        const target = document.head || document.documentElement || document.body;
        if (target) {
          try {
            // Use insertBefore to ensure script executes immediately
            if (target.firstChild) {
              target.insertBefore(script, target.firstChild);
            } else {
              target.appendChild(script);
            }
            console.log('🔵 Bridge: Bridge flag injected into page context (delayed) via', target.tagName);
            // Remove script tag after execution
            setTimeout(() => {
              try {
                if (script.parentNode) {
                  script.parentNode.removeChild(script);
                }
              } catch (e) {
                // Ignore removal errors
              }
            }, 100);
          } catch (e) {
            console.error('🔴 Bridge: Failed delayed injection:', e);
            setTimeout(tryInject, 50);
          }
        } else {
          setTimeout(tryInject, 50);
        }
      };
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInject, { once: true });
        // Also try after a timeout as backup
        setTimeout(tryInject, 1000);
      } else {
        setTimeout(tryInject, 50);
      }
    }
  } catch (error) {
    console.error('🔴 Bridge: Exception injecting bridge flag:', error);
    // Retry after delay
    setTimeout(() => {
      try {
        injectBridgeFlag();
      } catch (e) {
        console.error('🔴 Bridge: Retry also failed:', e);
      }
    }, 200);
  }
}

// Inject bridge flag - try multiple times to ensure it works
injectBridgeFlag();
// Also try after a short delay in case DOM isn't ready
setTimeout(injectBridgeFlag, 100);
setTimeout(injectBridgeFlag, 500);

// Inject page API script into page context
function injectPageAPI() {
  // Check if already injected
  if (window.ProfitOrbitExtension) {
    console.log('🔵 Bridge: Page API already exists, skipping injection');
    dispatchBridgeReady();
    return;
  }

  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('🔴 Bridge: Cannot inject page API - chrome.runtime not available');
    return;
  }

  try {
    const scriptUrl = chrome.runtime.getURL('profit-orbit-page-api.js');
    console.log('🔵 Bridge: Injecting page API script:', scriptUrl);

    const script = document.createElement('script');
    script.src = scriptUrl;
    
    script.onload = function() {
      console.log('🔵 Bridge: Page API script loaded successfully');
      console.log('🔵 Bridge: window.ProfitOrbitExtension exists:', typeof window.ProfitOrbitExtension !== 'undefined');
      dispatchBridgeReady();
    };
    
    script.onerror = function(error) {
      console.error('🔴 Bridge: Failed to load page API script:', error);
      console.error('🔴 Bridge: Check Network tab for profit-orbit-page-api.js');
    };
    
    // Inject into page context
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(script);
      console.log('🔵 Bridge: Page API script tag appended to', target.tagName);
    } else {
      console.error('🔴 Bridge: No injection target available');
      // Try again when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectPageAPI);
      } else {
        setTimeout(injectPageAPI, 100);
      }
    }
  } catch (error) {
    console.error('🔴 Bridge: Exception injecting page API:', error);
  }
}

// Dispatch bridge ready event
function dispatchBridgeReady() {
  console.log('🔵 Bridge: Dispatching profitOrbitBridgeReady event');
  window.dispatchEvent(new CustomEvent('profitOrbitBridgeReady'));
}

// Inject page API script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectPageAPI);
} else {
  // DOM already loaded, inject immediately
  injectPageAPI();
}

console.log('🔵🔵🔵 PROFIT ORBIT BRIDGE SCRIPT INITIALIZED 🔵🔵🔵');
