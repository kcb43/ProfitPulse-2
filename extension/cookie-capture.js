/**
 * Cookie capture utilities for platform authentication
 * This file can be imported by background.js or used standalone
 */

/**
 * Export cookies for a specific domain
 * @param {string} domain - Domain to export cookies from (e.g., 'mercari.com', 'facebook.com')
 * @returns {Promise<Array>} - Array of cookie objects
 */
export async function exportCookies(domain) {
  try {
    // Get all cookies for the domain
    const cookies = await chrome.cookies.getAll({ domain });
    
    // Convert to format expected by API
    const cookieArray = cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      expirationDate: cookie.expirationDate,
    }));

    return cookieArray;
  } catch (error) {
    console.error(`Error exporting cookies for ${domain}:`, error);
    throw error;
  }
}

/**
 * Get user agent for current browser
 * @returns {Promise<string>} - User agent string
 */
export async function getUserAgent() {
  try {
    // Get user agent from a tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const tab = tabs[0];
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => navigator.userAgent,
      });
      return results[0].result;
    }
    // Fallback to default
    return navigator.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  } catch (error) {
    console.error('Error getting user agent:', error);
    return navigator.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }
}

/**
 * Send cookies to API for platform connection
 * @param {string} platform - Platform name ('mercari' or 'facebook')
 * @param {string} apiUrl - API base URL (e.g., 'https://your-api.render.com')
 * @param {string} authToken - Supabase JWT token
 * @returns {Promise<Object>} - API response
 */
export async function sendCookiesToAPI(platform, apiUrl, authToken) {
  try {
    // Map platform to domain
    const domainMap = {
      mercari: 'mercari.com',
      facebook: 'facebook.com',
    };

    const domain = domainMap[platform];
    if (!domain) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Export cookies
    const cookies = await exportCookies(domain);
    if (cookies.length === 0) {
      throw new Error(`No cookies found for ${domain}. Please log in to ${platform} first.`);
    }

    // Get user agent
    const userAgent = await getUserAgent();

    // Prepare payload
    const payload = {
      platform,
      cookies,
      userAgent,
      meta: {
        capturedAt: new Date().toISOString(),
        cookieCount: cookies.length,
      },
    };

    // Send to API
    const response = await fetch(`${apiUrl}/api/platform/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error sending cookies to API for ${platform}:`, error);
    throw error;
  }
}

/**
 * Handle platform connection from extension popup or content script
 * @param {string} platform - Platform name
 * @param {string} apiUrl - API base URL
 * @param {string} authToken - Supabase JWT token
 */
export async function connectPlatform(platform, apiUrl, authToken) {
  try {
    // First, ensure user is logged in to the platform
    const domainMap = {
      mercari: 'https://www.mercari.com',
      facebook: 'https://www.facebook.com',
    };

    const platformUrl = domainMap[platform];
    if (!platformUrl) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Check if user has cookies (is logged in)
    const cookies = await exportCookies(domainMap[platform].replace('https://www.', ''));
    if (cookies.length === 0) {
      // Open platform login page
      await chrome.tabs.create({
        url: platformUrl,
        active: true,
      });
      throw new Error(`Please log in to ${platform} first, then try connecting again.`);
    }

    // Send cookies to API
    const result = await sendCookiesToAPI(platform, apiUrl, authToken);
    return result;
  } catch (error) {
    console.error(`Error connecting platform ${platform}:`, error);
    throw error;
  }
}


