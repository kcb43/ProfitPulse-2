/**
 * Vercel Serverless Function - eBay OAuth Callback
 * 
 * This endpoint handles the OAuth callback from eBay after user authorization.
 * It exchanges the authorization code for an access token and refresh token.
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error, error_description } = req.query;

    // Build frontend URL for redirects
    let frontendUrl = null;
    
    // 1. Check for explicit BASE_URL environment variable (highest priority)
    if (process.env.BASE_URL) {
      frontendUrl = process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
    }
    // 2. Check for VERCEL_URL (provided by Vercel)
    else if (process.env.VERCEL_URL) {
      const vercelUrl = process.env.VERCEL_URL.replace(/^https?:\/\//, '');
      frontendUrl = `https://${vercelUrl}`;
    }
    // 3. Use request headers
    else if (req.headers.host) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      frontendUrl = `${protocol}://${req.headers.host}`;
    }
    // 4. Try referer header
    else if (req.headers.referer) {
      try {
        frontendUrl = new URL(req.headers.referer).origin;
      } catch (e) {
        console.error('Error parsing referer:', e);
      }
    }
    // 5. Last resort
    else {
      frontendUrl = 'http://localhost:5173';
    }
    
    const redirectPath = '/CrosslistComposer';

    // Check for errors from eBay
    if (error) {
      console.error('eBay OAuth error:', error, error_description);
      // Redirect back to app with error
      const errorMsg = error_description || error || 'Unknown OAuth error';
      return res.redirect(`${frontendUrl}${redirectPath}?ebay_auth_error=${encodeURIComponent(errorMsg)}`);
    }

    // Check for authorization code
    if (!code) {
      // This might be a direct access to the callback URL or an incomplete OAuth flow
      console.error('Callback accessed without authorization code. Query params:', req.query);
      console.error('Headers:', {
        referer: req.headers.referer,
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
      });
      
      // Redirect back to frontend with a helpful error instead of returning JSON
      return res.redirect(
        `${frontendUrl}${redirectPath}?ebay_auth_error=${encodeURIComponent('OAuth callback was accessed without authorization code. Please try connecting again.')}`
      );
    }

    const clientId = process.env.VITE_EBAY_CLIENT_ID || process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.VITE_EBAY_CLIENT_SECRET || process.env.EBAY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        error: 'eBay credentials not configured' 
      });
    }

    // Determine environment
    const ebayEnv = process.env.EBAY_ENV;
    const isProductionByEnv = ebayEnv === 'production' || ebayEnv?.trim() === 'production';
    const isProductionByClientId = clientId && (
      clientId.includes('-PRD-') || 
      clientId.includes('-PRD') || 
      clientId.startsWith('PRD-') ||
      /PRD/i.test(clientId)
    );
    const useProduction = isProductionByEnv || isProductionByClientId;

    // Build callback URL (must match the redirect_uri used in auth.js)
    // Use the same logic as auth.js for consistency
    let baseUrl = null;
    
    // 1. Check for explicit BASE_URL environment variable (highest priority)
    if (process.env.BASE_URL) {
      baseUrl = process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
    }
    // 2. Check for VERCEL_URL (provided by Vercel)
    else if (process.env.VERCEL_URL) {
      // VERCEL_URL is just the domain, add https://
      const vercelUrl = process.env.VERCEL_URL.replace(/^https?:\/\//, ''); // Remove protocol if present
      baseUrl = `https://${vercelUrl}`;
    }
    // 3. Use request headers to determine URL
    else if (req.headers.host) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      baseUrl = `${protocol}://${req.headers.host}`;
    }
    // 4. Try referer header as fallback
    else if (req.headers.referer) {
      try {
        baseUrl = new URL(req.headers.referer).origin;
      } catch (e) {
        console.error('Error parsing referer:', e);
      }
    }
    // 5. Last resort: localhost (for local development)
    else {
      baseUrl = 'http://localhost:5173';
    }
    
    const redirectUri = `${baseUrl}/api/ebay/callback`;

    // eBay OAuth token endpoint
    const tokenUrl = useProduction
      ? 'https://api.ebay.com/identity/v1/oauth2/token'
      : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

    // Create Basic Auth header
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Exchange authorization code for access token
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('eBay OAuth token exchange error:', tokenResponse.status, errorText);
      let errorMsg = 'Failed to exchange authorization code for access token';
      try {
        const errorData = JSON.parse(errorText);
        errorMsg = errorData.error_description || errorData.error || errorMsg;
      } catch (e) {
        // If errorText is not JSON, use it as-is
        errorMsg = errorText || errorMsg;
      }
      return res.redirect(`${frontendUrl}${redirectPath}?ebay_auth_error=${encodeURIComponent(errorMsg)}`);
    }

    const tokenData = await tokenResponse.json();

    // Token data includes:
    // - access_token: User token for API calls
    // - token_type: Usually "Bearer" or "User Access Token"
    // - expires_in: Token expiration time in seconds
    // - refresh_token: Token to refresh access token (if provided)
    // - refresh_token_expires_in: Refresh token expiration time

    console.log('eBay OAuth success:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      environment: useProduction ? 'production' : 'sandbox',
    });

    // Encode tokens to pass to frontend
    const tokenEncoded = encodeURIComponent(JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      refresh_token_expires_in: tokenData.refresh_token_expires_in,
      token_type: tokenData.token_type,
    }));

    // Redirect to frontend page that will handle token storage
    // Redirect to CrosslistComposer page (route is /CrosslistComposer)
    return res.redirect(`${frontendUrl}${redirectPath}?ebay_auth_success=1&token=${tokenEncoded}`);

  } catch (error) {
    console.error('Error in eBay OAuth callback:', error);
    
    // Build frontend URL for error redirect
    let frontendUrl = null;
    if (process.env.BASE_URL) {
      frontendUrl = process.env.BASE_URL.replace(/\/$/, '');
    } else if (process.env.VERCEL_URL) {
      const vercelUrl = process.env.VERCEL_URL.replace(/^https?:\/\//, '');
      frontendUrl = `https://${vercelUrl}`;
    } else if (req.headers.host) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      frontendUrl = `${protocol}://${req.headers.host}`;
    } else if (req.headers.referer) {
      try {
        frontendUrl = new URL(req.headers.referer).origin;
      } catch (e) {
        frontendUrl = 'http://localhost:5173';
      }
    } else {
      frontendUrl = 'http://localhost:5173';
    }
    
    return res.redirect(`${frontendUrl}/CrosslistComposer?ebay_auth_error=${encodeURIComponent(error.message)}`);
  }
}

