# Authentication Setup Guide

## Problem

After migrating from Base44 to Supabase, users need to sign in to access their data. The app previously used Base44's authentication (Gmail sign-in), but now needs Supabase Auth.

## Solution: Set Up Supabase Auth with Google OAuth

### Step 1: Enable Google Provider in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list
5. Click **Enable**
6. You'll need to configure Google OAuth credentials:

### Step 2: Get Google OAuth Credentials

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://hlcwhpajorzbleabavcr.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (for local development)
7. Copy the **Client ID** and **Client Secret**

### Step 3: Configure Google in Supabase

1. Back in Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Paste your **Client ID** and **Client Secret**
3. Click **Save**

### Step 4: Update Supabase RLS Policies

The RLS policies currently use `auth.uid()`, which requires users to be authenticated. We need to make sure users can access their own data.

The policies should already be set up correctly in the migration SQL, but verify:

1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Check that policies exist for:
   - `inventory_items` - Users can view/insert/update/delete their own items
   - `sales` - Users can view/insert/update/delete their own sales
   - `crosslistings` - Users can view/insert/update/delete their own crosslistings
   - `image_editor_templates` - Users can view/insert/update/delete their own templates

### Step 5: Add Login Route

I've created a login page at `src/pages/Login.jsx`. Now add it to your routes:

**File: `src/pages/index.jsx`** (or wherever your routes are)

Add:
```javascript
import Login from './Login';

// In your routes:
<Route path="/login" element={<Login />} />
```

### Step 6: Protect Routes (Optional but Recommended)

Create an auth guard component:

**File: `src/components/AuthGuard.jsx`**
```javascript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

export default function AuthGuard({ children }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Sign in required',
          description: 'Please sign in to access this page',
        });
        navigate('/login');
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  return children;
}
```

Wrap protected routes:
```javascript
<Route path="/inventory" element={<AuthGuard><Inventory /></AuthGuard>} />
```

### Step 7: Update API Client to Use Auth User ID

The `newApiClient.js` currently gets user ID from localStorage. Update it to use Supabase auth:

**File: `src/api/newApiClient.js`**

Update the `getUserId()` function:
```javascript
import { supabase } from './supabaseClient';

// Helper function to get user ID from Supabase auth
async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}
```

### Step 8: Update API Routes to Use Auth Token

The API routes currently use `x-user-id` header. Update them to use Supabase auth token:

**Example for `api/inventory/index.js`:**
```javascript
import { createClient } from '@supabase/supabase-js';

function getUserId(req) {
  // Try to get from auth token first
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    // Verify token and extract user ID
    // This requires Supabase JWT verification
  }
  
  // Fallback to header (for backward compatibility)
  return req.headers['x-user-id'] || null;
}
```

**Better approach:** Use Supabase's built-in RLS by passing the auth token:

```javascript
// In frontend API calls, add auth header:
const { data: { session } } = await supabase.auth.getSession();
const headers = {
  'Authorization': `Bearer ${session?.access_token}`,
  'x-user-id': session?.user?.id,
};
```

## Quick Start (Simplified)

For now, to get your data back:

1. **Set up Google OAuth in Supabase** (Steps 1-3 above)
2. **Sign in** using the new Login page
3. **Your user ID will be different** - you'll need to migrate your data

## Data Migration

Since your user ID from Base44 won't match Supabase's user ID, you have two options:

### Option 1: Manual Data Migration
1. Export your data from Base44
2. Sign in to Supabase
3. Get your new Supabase user ID
4. Import data with the new user ID

### Option 2: Email-Based Matching
1. Match users by email address
2. Update `user_id` in Supabase tables to match the new Supabase user ID

## Testing

1. Start dev server: `npm run dev`
2. Go to `/login`
3. Click "Sign in with Google"
4. After signing in, you should be redirected to the app
5. Check that you can see/create inventory items

## Troubleshooting

### "No user found"
- Make sure Google OAuth is enabled in Supabase
- Check that redirect URI matches exactly

### "RLS policy violation"
- Verify RLS policies are set up correctly
- Check that user is authenticated (has session)

### "User ID mismatch"
- Your old Base44 user ID won't match Supabase user ID
- You'll need to migrate data (see Data Migration above)


