/**
 * Vercel Serverless Function - eBay OAuth Authorization
 * 
 * This endpoint initiates the eBay OAuth flow by redirecting users to eBay's authorization page.
 * After authorization, eBay redirects back to the callback URL with an authorization code.
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
    const clientId = process.env.VITE_EBAY_CLIENT_ID || process.env.EBAY_CLIENT_ID;
    const ebayEnv = process.env.EBAY_ENV;
    const isProductionByEnv = ebayEnv === 'production' || ebayEnv?.trim() === 'production';
    const isProductionByClientId = clientId && (
      clientId.includes('-PRD-') || 
      clientId.includes('-PRD') || 
      clientId.startsWith('PRD-') ||
      /PRD/i.test(clientId)
    );
    const useProduction = isProductionByEnv || isProductionByClientId;

    if (!clientId) {
      return res.status(500).json({ 
        error: 'eBay Client ID not configured. Please set EBAY_CLIENT_ID environment variable.' 
      });
    }

    // Build callback URL - should match what's configured in eBay Developer Console
    // For OAuth 2.0, this must be YOUR application's callback URL, not eBay's signin page
    // Example: https://your-domain.vercel.app/api/ebay/callback
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : (req.headers.referer ? new URL(req.headers.referer).origin : req.headers.host ? `https://${req.headers.host}` : 'http://localhost:5173');
    
    const redirectUri = `${baseUrl}/api/ebay/callback`;
    
    console.log('OAuth Redirect URI:', redirectUri);
    
    // Get optional state parameter for CSRF protection
    const state = req.query.state || Math.random().toString(36).substring(7);
    
    // eBay OAuth authorization URL
    const authUrl = useProduction
      ? 'https://auth.ebay.com/oauth2/authorize'
      : 'https://auth.sandbox.ebay.com/oauth2/authorize';

    // Required OAuth scopes for Trading API
    // https://api.ebay.com/oauth/api_scope - Full API access including listing
    const scope = 'https://api.ebay.com/oauth/api_scope';

    // Build authorization URL with parameters
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      state: state,
    });

    const fullAuthUrl = `${authUrl}?${authParams.toString()}`;

    console.log('eBay OAuth authorization redirect:', {
      authUrl: fullAuthUrl,
      redirectUri,
      environment: useProduction ? 'production' : 'sandbox',
    });

    // Redirect user to eBay authorization page
    res.redirect(fullAuthUrl);

  } catch (error) {
    console.error('Error initiating eBay OAuth:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

