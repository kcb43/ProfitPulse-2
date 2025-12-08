/**
 * Content Script for All Marketplaces
 * Detects login and automates listings across multiple platforms
 */

console.log('Profit Orbit Extension: Content script loaded');

// Detect which marketplace we're on
const MARKETPLACE = (() => {
  const hostname = window.location.hostname;
  if (hostname.includes('mercari.com')) return 'mercari';
  if (hostname.includes('facebook.com')) return 'facebook';
  if (hostname.includes('poshmark.com')) return 'poshmark';
  if (hostname.includes('ebay.com')) return 'ebay';
  if (hostname.includes('etsy.com')) return 'etsy';
  return null;
})();

console.log(`Profit Orbit Extension: Running on ${MARKETPLACE}`);

// Marketplace-specific login detection
const LOGIN_DETECTORS = {
  mercari: () => {
    return !!(
      document.querySelector('[data-testid="UserMenuButton"]') ||
      document.querySelector('.merUserMenu') ||
      document.querySelector('[aria-label*="Account"]') ||
      document.querySelector('a[href*="/mypage"]')
    );
  },
  
  facebook: () => {
    return !!(
      document.querySelector('[data-pagelet="TopNavBar"]') ||
      document.querySelector('[aria-label="Account"]') ||
      document.cookie.includes('c_user=')
    );
  },
  
  poshmark: () => {
    return !!(
      document.querySelector('.user__details') ||
      document.querySelector('[data-test="header-user-menu"]') ||
      document.querySelector('a[href*="/closet/"]')
    );
  },
  
  ebay: () => {
    // Debug: log what we find
    const debugSelectors = {
      'gh-ug': document.querySelector('#gh-ug'),
      'gh-eb-My': document.querySelector('[id="gh-eb-My"]'),
      'myebay-link': document.querySelector('a[href*="/mye/myebay"]'),
      'signin-link': document.querySelector('a[href*="/signin"]'),
      'watchlist': document.querySelector('a[href*="/mye/myebay/watchlist"]'),
      'account-button': document.querySelector('button[aria-label*="Account"]'),
      'user-menu': document.querySelector('[data-test="user-menu"]')
    };
    
    console.log('eBay selectors found:', debugSelectors);
    
    // Check multiple eBay login indicators
    const hasUserGreeting = !!document.querySelector('#gh-ug');
    const hasMyEbay = !!document.querySelector('[id*="gh-eb-My"]') || !!document.querySelector('a[href*="/mye/myebay"]');
    const hasWatchlist = !!document.querySelector('a[href*="watchlist"]');
    const noSignInLink = !document.querySelector('a[href="/signin/"]');
    const hasAccountMenu = !!document.querySelector('button[aria-label*="Account"]');
    
    const isLoggedIn = hasUserGreeting || hasMyEbay || hasWatchlist || (noSignInLink && hasAccountMenu);
    
    console.log('eBay login indicators:', {
      hasUserGreeting,
      hasMyEbay,
      hasWatchlist,
      noSignInLink,
      hasAccountMenu,
      result: isLoggedIn
    });
    
    return isLoggedIn;
  },
  
  etsy: () => {
    return !!(
      document.querySelector('[data-account-nav]') ||
      document.querySelector('[data-ui="user-nav"]') ||
      document.querySelector('button[aria-label*="Account"]')
    );
  }
};

// Get user info for each marketplace
const USER_INFO_GETTERS = {
  mercari: () => {
    const userMenu = document.querySelector('[data-testid="UserMenuButton"]');
    return {
      userName: userMenu?.getAttribute('aria-label') || 'Mercari User',
      marketplace: 'mercari'
    };
  },
  
  facebook: () => {
    const profileLink = document.querySelector('[aria-label="Account"]') || 
                       document.querySelector('a[href*="/profile/"]');
    return {
      userName: profileLink?.textContent?.trim() || 'Facebook User',
      marketplace: 'facebook'
    };
  },
  
  poshmark: () => {
    const userDetails = document.querySelector('.user__details');
    return {
      userName: userDetails?.textContent?.trim() || 'Poshmark User',
      marketplace: 'poshmark'
    };
  },
  
  ebay: () => {
    const userGreeting = document.querySelector('#gh-ug');
    const userName = userGreeting?.textContent?.replace('Hi', '').trim() || 'eBay User';
    return {
      userName,
      marketplace: 'ebay'
    };
  },
  
  etsy: () => {
    const accountNav = document.querySelector('[data-account-nav]');
    return {
      userName: accountNav?.getAttribute('aria-label') || 'Etsy User',
      marketplace: 'etsy'
    };
  }
};

// Check if user is logged in
function checkLogin() {
  if (!MARKETPLACE || !LOGIN_DETECTORS[MARKETPLACE]) {
    return false;
  }
  
  const isLoggedIn = LOGIN_DETECTORS[MARKETPLACE]();
  console.log(`${MARKETPLACE} login check:`, isLoggedIn ? 'Logged in' : 'Not logged in');
  
  return isLoggedIn;
}

// Get user info
function getUserInfo() {
  if (!MARKETPLACE || !checkLogin()) {
    return { loggedIn: false, marketplace: MARKETPLACE };
  }
  
  const getter = USER_INFO_GETTERS[MARKETPLACE];
  const info = getter ? getter() : { userName: 'User' };
  
  return {
    loggedIn: true,
    ...info,
    timestamp: Date.now()
  };
}

// Send login status to background script AND update localStorage for web app
function updateLoginStatus() {
  try {
    const userInfo = getUserInfo();
    
    // Update localStorage so Profit Orbit web app can read it
    if (userInfo.loggedIn) {
      localStorage.setItem(`${MARKETPLACE}_session_detected`, 'true');
      localStorage.setItem(`${MARKETPLACE}_user_info`, JSON.stringify(userInfo));
    } else {
      localStorage.removeItem(`${MARKETPLACE}_session_detected`);
      localStorage.removeItem(`${MARKETPLACE}_user_info`);
    }
    
    // Check if extension context is still valid before sending message
    if (!chrome.runtime?.id) {
      console.log('Extension context invalidated - please refresh the page');
      return;
    }
    
    // Send to background script
    chrome.runtime.sendMessage({
      type: `${MARKETPLACE?.toUpperCase()}_LOGIN_STATUS`,
      marketplace: MARKETPLACE,
      data: userInfo
    }, (response) => {
      if (chrome.runtime.lastError) {
        // Extension was reloaded or context invalidated - this is normal
        console.log('Extension context changed - page needs refresh');
      } else {
        console.log('Login status sent:', response);
      }
    });
  } catch (error) {
    // Gracefully handle any errors
    console.log('Extension communication error (page may need refresh):', error.message);
  }
}

// Check login on page load
if (MARKETPLACE) {
  window.addEventListener('load', () => {
    setTimeout(updateLoginStatus, 1500);
  });

  // Watch for login changes (SPA navigation)
  const observer = new MutationObserver(() => {
    clearTimeout(window.loginCheckTimeout);
    window.loginCheckTimeout = setTimeout(updateLoginStatus, 2000);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHECK_LOGIN') {
      const userInfo = getUserInfo();
      sendResponse({ status: userInfo });
      return true;
    }
    
    if (message.type === 'CREATE_LISTING') {
      // TODO: Implement listing creation for this marketplace
      console.log(`Creating ${MARKETPLACE} listing with data:`, message.listingData);
      createListing(message.listingData);
      sendResponse({ success: true });
      return true;
    }
  });

  // Initial check
  updateLoginStatus();
  
  console.log(`Profit Orbit Extension: Initialized for ${MARKETPLACE}`);
}

// Create listing on current marketplace
async function createListing(listingData) {
  console.log(`Creating ${MARKETPLACE} listing:`, listingData);
  
  if (MARKETPLACE === 'mercari') {
    return await createMercariListing(listingData);
  }
  
  // Other marketplaces to be implemented
  console.log(`Listing automation for ${MARKETPLACE} coming soon`);
  window.postMessage({
    type: 'MERCARI_LISTING_COMPLETE',
    success: false,
    error: `${MARKETPLACE} listing automation not yet implemented`
  }, '*');
}

// Mercari-specific listing automation
async function createMercariListing(listingData) {
  try {
    console.log('Starting Mercari listing automation...', listingData);
    
    // Navigate to sell page if not already there
    if (!window.location.href.includes('/sell')) {
      window.location.href = 'https://www.mercari.com/sell/';
      
      // Wait for page to load, then retry
      window.addEventListener('load', () => {
        setTimeout(() => createMercariListing(listingData), 2000);
      }, { once: true });
      return;
    }
    
    // Wait for form to be ready
    await waitForElement('[name="title"], input[placeholder*="title"]', 10000);
    
    // Fill in form fields
    await fillMercariForm(listingData);
    
    // Submit the form
    const submitResult = await submitMercariForm();
    
    // Notify web app of success
    window.postMessage({
      type: 'MERCARI_LISTING_COMPLETE',
      success: submitResult.success,
      listingId: submitResult.listingId,
      listingUrl: submitResult.listingUrl,
      error: submitResult.error
    }, '*');
    
    return submitResult;
    
  } catch (error) {
    console.error('Error in Mercari listing automation:', error);
    
    window.postMessage({
      type: 'MERCARI_LISTING_COMPLETE',
      success: false,
      error: error.message
    }, '*');
    
    return { success: false, error: error.message };
  }
}

// Fill Mercari form fields
async function fillMercariForm(data) {
  console.log('Filling Mercari form with data:', data);
  
  // Title - using actual Mercari selectors
  const titleInput = document.querySelector('[data-testid="Title"]') || 
                    document.querySelector('#sellName');
  if (titleInput && data.title) {
    titleInput.value = data.title;
    titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
    console.log('✓ Title set:', data.title);
  }
  
  // Description
  const descInput = document.querySelector('[data-testid="Description"]') ||
                   document.querySelector('#sellDescription');
  if (descInput && data.description) {
    descInput.value = data.description;
    descInput.dispatchEvent(new Event('input', { bubbles: true }));
    descInput.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
    console.log('✓ Description set');
  }
  
  // Price
  const priceInput = document.querySelector('[data-testid="Price"]') ||
                    document.querySelector('#Price') ||
                    document.querySelector('[name="sellPrice"]');
  if (priceInput && data.price) {
    priceInput.value = String(data.price);
    priceInput.dispatchEvent(new Event('input', { bubbles: true }));
    priceInput.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
    console.log('✓ Price set:', data.price);
  }
  
  // Category - Mercari uses custom dropdown, need to click and select
  // TODO: Implement category selection
  console.log('⚠️ Category selection needs implementation (custom dropdown)');
  
  // Condition - Custom dropdown
  // TODO: Implement condition selection
  console.log('⚠️ Condition selection needs implementation (custom dropdown)');
  
  // Brand - Custom dropdown  
  // TODO: Implement brand selection
  console.log('⚠️ Brand selection needs implementation (custom dropdown)');
  
  // Photos upload would go here
  // TODO: Implement photo uploads
  console.log('⚠️ Photo upload needs implementation');
  
  console.log('✓ Basic form fields filled (dropdowns and photos still TODO)');
  
  return true;
}

// Helper: Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Submit Mercari form
async function submitMercariForm() {
  // Find the List button using actual Mercari selector
  const submitBtn = document.querySelector('[data-testid="ListButton"]') ||
                   document.querySelector('button[type="submit"]');
  
  if (!submitBtn) {
    console.error('Submit button not found');
    return {
      success: false,
      error: 'List button not found on page'
    };
  }
  
  // Check if button is enabled (Mercari disables it if form is invalid)
  if (submitBtn.disabled) {
    console.error('Submit button is disabled - form may be incomplete');
    return {
      success: false,
      error: 'Form incomplete - please fill in required fields (Category, Condition, etc.)'
    };
  }
  
  console.log('Clicking List button...');
  submitBtn.click();
  
  // Wait for navigation/success page
  await sleep(3000);
  
  // Try to detect success and extract listing URL
  // After successful listing, Mercari usually redirects to the item page
  // or shows a success message
  const currentUrl = window.location.href;
  
  if (currentUrl.includes('/item/')) {
    // Successfully created - URL contains item ID
    const listingId = currentUrl.split('/item/')[1]?.split('/')[0] || '';
    
    return {
      success: true,
      listingId: listingId,
      listingUrl: currentUrl
    };
  } else if (currentUrl.includes('/sell')) {
    // Still on sell page - might have failed or validation error
    return {
      success: false,
      error: 'Listing may have failed - still on sell page. Check for validation errors.'
    };
  }
  
  // Unknown state
  return {
    success: false,
    error: 'Unable to determine listing status'
  };
}

// Helper: Wait for element to appear
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found after ${timeout}ms`));
    }, timeout);
  });
}
