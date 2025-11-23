# eBay OAuth 2.0 Setup Guide

## Important: OAuth 2.0 vs Auth'n'Auth

eBay has two authentication systems:
1. **Auth'n'Auth** (Legacy) - Uses URLs like `https://signin.ebay.com/ws/eBayISAPI.dll?ThirdPartyAuthSucessFailure`
2. **OAuth 2.0** (Modern) - Uses your application's callback URL

**This application uses OAuth 2.0**, so you need to configure the redirect URI in the OAuth 2.0 section, NOT the Auth'n'Auth section.

## Setting Up OAuth 2.0 Redirect URI

### Step 1: Find Your Application's Callback URL

Your callback URL will be:
- **Production**: `https://your-vercel-domain.vercel.app/api/ebay/callback`
- **Local Development**: `http://localhost:5173/api/ebay/callback`

Replace `your-vercel-domain` with your actual Vercel deployment domain.

### Step 2: Configure in eBay Developer Console

1. Go to [eBay Developer Console](https://developer.ebay.com/)
2. Navigate to your application
3. Look for **"OAuth Redirect URIs"** or **"OAuth Settings"** section
   - This is different from "Auth'n'Auth" section
   - If you only see "Auth'n'Auth", you may need to enable OAuth 2.0 for your app
4. Add your callback URL:
   - For Production: `https://your-vercel-domain.vercel.app/api/ebay/callback`
   - For Sandbox: `https://your-vercel-domain.vercel.app/api/ebay/callback` (can be same)

### Step 3: Verify Environment Variables

Make sure these are set in Vercel:
- `EBAY_CLIENT_ID` - Your Production App ID
- `EBAY_CLIENT_SECRET` - Your Production Client Secret
- `EBAY_DEV_ID` - Your Developer ID
- `EBAY_ENV` - Set to `production`

### Step 4: Test the Flow

1. Click "Connect eBay Account" in your app
2. You'll be redirected to eBay's authorization page
3. After authorizing, eBay will redirect to: `https://your-vercel-domain.vercel.app/api/ebay/callback?code=...`
4. The callback handler will exchange the code for tokens
5. You'll be redirected back to your app with tokens stored

## Troubleshooting

### If you see "ThirdPartyAuthSucessFailure" error:
- You're likely using Auth'n'Auth URLs instead of OAuth 2.0
- Make sure you're configuring the **OAuth Redirect URI**, not the Auth'n'Auth URLs
- The redirect URI must match exactly (including https/http, domain, and path)

### If redirect URI doesn't match:
- The redirect URI in your code (`api/ebay/auth.js` and `api/ebay/callback.js`) must exactly match what's configured in eBay Developer Console
- Check for trailing slashes, http vs https, etc.

### Finding Your Vercel Domain:
- Go to Vercel Dashboard → Your Project → Settings → Domains
- Use your production domain (e.g., `your-app.vercel.app`)

## Notes

- The callback URL must be accessible via HTTPS in production
- You can add multiple redirect URIs for different environments (production, staging, local)
- The redirect URI is validated by eBay, so it must match exactly

