/**
 * Background Service Worker
 * Manages state for all marketplace connections
 */

console.log('Profit Orbit Extension: Background script loaded');

// Store login status for all marketplaces
let marketplaceStatus = {
  mercari: { loggedIn: false, userName: null, lastChecked: null },
  facebook: { loggedIn: false, userName: null, lastChecked: null },
  poshmark: { loggedIn: false, userName: null, lastChecked: null },
  ebay: { loggedIn: false, userName: null, lastChecked: null },
  etsy: { loggedIn: false, userName: null, lastChecked: null }
};

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message, 'from sender:', sender);
  
  // Handle login status updates from any marketplace
  if (message.type?.endsWith('_LOGIN_STATUS')) {
    const marketplace = message.marketplace;
    
    if (marketplace && marketplaceStatus[marketplace] !== undefined) {
      // Update status
      marketplaceStatus[marketplace] = {
        ...message.data,
        lastChecked: Date.now()
      };
      
      // Persist to storage
      chrome.storage.local.set({ marketplaceStatus }, () => {
        console.log(`${marketplace} status saved:`, marketplaceStatus[marketplace]);
      });
      
      // Notify Profit Orbit web app
      notifyProfitOrbit({
        type: 'MARKETPLACE_STATUS_UPDATE',
        marketplace: marketplace,
        data: marketplaceStatus[marketplace]
      });
      
      sendResponse({ success: true, marketplace });
    }
    return true;
  }
  
  if (message.type === 'GET_ALL_STATUS') {
    sendResponse({ status: marketplaceStatus });
    return true;
  }
  
  if (message.type === 'GET_MARKETPLACE_STATUS') {
    const marketplace = message.marketplace;
    sendResponse({ 
      status: marketplaceStatus[marketplace] || { loggedIn: false }
    });
    return true;
  }
  
  // Handle Mercari listing request from bridge script
  if (message.type === 'CREATE_MERCARI_LISTING') {
    console.log('✅ Background received CREATE_MERCARI_LISTING request');
    console.log('Listing data:', message.listingData);
    const listingData = message.listingData;
    
    // Handle async response - Manifest V3 pattern
    (async () => {
      try {
        // Helper function to check if content script is ready
        const isContentScriptReady = async (tabId, maxRetries = 5) => {
          for (let i = 0; i < maxRetries; i++) {
            try {
              // Try to ping the content script
              const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
              // Check if we got a valid response
              if (response && response.pong) {
                return true;
              }
            } catch (error) {
              // If it's not a connection error, don't retry
              if (!error.message?.includes('Receiving end does not exist') && 
                  !error.message?.includes('Could not establish connection')) {
                return false;
              }
            }
            
            if (i < maxRetries - 1) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            }
          }
          return false;
        };
        
        // Helper function to send message with retry
        const sendMessageWithRetry = async (tabId, message, maxRetries = 3) => {
          for (let i = 0; i < maxRetries; i++) {
            try {
              const response = await chrome.tabs.sendMessage(tabId, message);
              return { success: true, response };
            } catch (error) {
              const isLastRetry = i === maxRetries - 1;
              const isConnectionError = error.message?.includes('Receiving end does not exist') ||
                                       error.message?.includes('Could not establish connection');
              
              if (isLastRetry || !isConnectionError) {
                return { success: false, error: error.message };
              }
              
              // Wait before retrying
              console.log(`⏳ Retry ${i + 1}/${maxRetries} - waiting for content script...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
          }
        };
        
        // Find Mercari tab or create new one
        console.log('Querying for Mercari tabs...');
        const tabs = await chrome.tabs.query({ url: 'https://www.mercari.com/*' });
        console.log('Found Mercari tabs:', tabs.length);
        
        let targetTab = null;
        
        if (tabs.length > 0) {
          // Try to use existing Mercari tab
          console.log('✅ Found existing Mercari tab:', tabs[0].id);
          const mercariTab = tabs[0];
          
          // Check if tab is in a valid state
          const tabInfo = await chrome.tabs.get(mercariTab.id);
          if (tabInfo.status === 'complete' && tabInfo.url?.startsWith('https://www.mercari.com')) {
            console.log('✅ Tab is ready, checking if content script is loaded...');
            
            // Check if content script is ready
            const isReady = await isContentScriptReady(mercariTab.id);
            if (isReady) {
              console.log('✅ Content script is ready');
              targetTab = mercariTab;
            } else {
              console.log('⚠️ Content script not ready, will create new tab');
            }
          } else {
            console.log('⚠️ Tab not in valid state, will create new tab');
          }
        }
        
        // If no valid tab found, create a new one
        if (!targetTab) {
          console.log('📂 Opening new Mercari sell page...');
          targetTab = await chrome.tabs.create({
            url: 'https://www.mercari.com/sell/',
            active: false
          });
          
          console.log('✅ Opened new Mercari tab:', targetTab.id);
          
          // Wait for page to load
          await new Promise((resolve) => {
            const listener = (tabId, info) => {
              if (tabId === targetTab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                console.log('✅ Mercari page loaded');
                resolve();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });
          
          // Give Mercari extra time to initialize and content script to load
          console.log('⏳ Waiting 3s for Mercari to initialize...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Send listing data with retry logic
        console.log('📤 Sending listing data to Mercari content script...');
        const result = await sendMessageWithRetry(targetTab.id, {
          type: 'CREATE_LISTING',
          listingData: listingData
        });
        
        if (result.success) {
          console.log('✅ Mercari content script response:', result.response);
          sendResponse(result.response || { success: false, error: 'No response from Mercari content script' });
        } else {
          console.error('❌ Failed to communicate with Mercari tab after retries:', result.error);
          sendResponse({ 
            success: false, 
            error: 'Failed to communicate with Mercari tab. Please ensure you have a Mercari tab open and try again. Error: ' + result.error 
          });
        }
      } catch (error) {
        console.error('❌ Error in Mercari listing flow:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // Keep channel open for async response
  }
});

// Notify Profit Orbit web app
async function notifyProfitOrbit(message) {
  try {
    const tabs = await chrome.tabs.query({
      url: ['https://profitorbit.io/*', 'http://localhost:5173/*']
    });
    
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {
        // Tab not ready
      });
    }
  } catch (error) {
    console.error('Error notifying Profit Orbit:', error);
  }
}

// Listen for external messages from Profit Orbit web app
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('External message:', message, 'from:', sender.url);
  
  if (message.type === 'CHECK_EXTENSION_INSTALLED') {
    sendResponse({ 
      installed: true, 
      version: chrome.runtime.getManifest().version,
      name: 'Profit Orbit Crosslisting Assistant'
    });
    return true;
  }
  
  if (message.type === 'GET_ALL_MARKETPLACE_STATUS') {
    sendResponse({ status: marketplaceStatus });
    return true;
  }
  
  if (message.type === 'GET_MARKETPLACE_STATUS') {
    const marketplace = message.marketplace;
    sendResponse({ 
      status: marketplaceStatus[marketplace] || { loggedIn: false }
    });
    return true;
  }
  
  if (message.type === 'CREATE_LISTING') {
    const marketplace = message.marketplace;
    const listingData = message.listingData;
    
    // Find or open marketplace tab
    chrome.tabs.query({ url: getMarketplaceUrl(marketplace) }, (tabs) => {
      if (tabs.length > 0) {
        // Send to existing tab
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'CREATE_LISTING',
          listingData: listingData
        });
        sendResponse({ success: true, message: 'Listing creation started' });
      } else {
        // Open new tab for listing
        chrome.tabs.create({
          url: getSellPageUrl(marketplace),
          active: false
        }, (tab) => {
          // Wait for load, then send listing data
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'CREATE_LISTING',
                  listingData: listingData
                });
              }, 1000);
            }
          });
        });
        sendResponse({ success: true, message: `Opening ${marketplace} to create listing` });
      }
    });
    return true;
  }
});

// Helper functions
function getMarketplaceUrl(marketplace) {
  const urls = {
    mercari: 'https://www.mercari.com/*',
    facebook: 'https://www.facebook.com/*',
    poshmark: 'https://www.poshmark.com/*',
    ebay: 'https://www.ebay.com/*',
    etsy: 'https://www.etsy.com/*'
  };
  return urls[marketplace] || 'https://www.mercari.com/*';
}

function getSellPageUrl(marketplace) {
  const urls = {
    mercari: 'https://www.mercari.com/sell/',
    facebook: 'https://www.facebook.com/marketplace/create',
    poshmark: 'https://poshmark.com/create-listing',
    ebay: 'https://www.ebay.com/sl/sell',
    etsy: 'https://www.etsy.com/your/shops/me/tools/listings/create'
  };
  return urls[marketplace] || '';
}

// Load saved status on startup
chrome.storage.local.get(['marketplaceStatus'], (result) => {
  if (result.marketplaceStatus) {
    marketplaceStatus = result.marketplaceStatus;
    console.log('Loaded saved marketplace status:', marketplaceStatus);
  }
});

// Periodically check active marketplace tabs
setInterval(async () => {
  for (const marketplace of ['mercari', 'facebook', 'poshmark', 'ebay', 'etsy']) {
    const tabs = await chrome.tabs.query({ url: getMarketplaceUrl(marketplace) });
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'CHECK_LOGIN' }).catch(() => {
        // Tab not ready
      });
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

console.log('Profit Orbit Extension: Background initialized');
