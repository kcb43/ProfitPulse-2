# Your Supabase Credentials

## ✅ Your Supabase Configuration

### Project URL (Cannot be changed - this is correct!)
```
https://hlcwhpajorzbleabavcr.supabase.co
```

### API Keys

#### 1. Publishable Key (Anon/Public Key)
**Use for:** Frontend/client-side code
**Safe to expose:** ✅ Yes (it's public)
```
sb_publishable_AmJEyN9K_q2OJAUCGiO3eA_NZYf6rXm
```

#### 2. Secret Key (Service Role Key)
**Use for:** Backend/server-side API routes only
**Safe to expose:** ❌ NO - Keep this secret!
```
sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-
```

---

## 🔧 How to Use These

### For Local Development (.env.local)

Create a file called `.env.local` in your project root:

```env
VITE_SUPABASE_URL=https://hlcwhpajorzbleabavcr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_AmJEyN9K_q2OJAUCGiO3eA_NZYf6rXm
SUPABASE_SERVICE_ROLE_KEY=sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-
```

### For Vercel Deployment

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://hlcwhpajorzbleabavcr.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_AmJEyN9K_q2OJAUCGiO3eA_NZYf6rXm` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-` | Production, Preview, Development |

**Important:** After adding variables, redeploy your Vercel project!

---

## 📝 What Each Key Does

### Publishable Key (Anon Key)
- Used in **frontend** code (`src/` folder)
- Safe to expose in browser
- Respects Row Level Security (RLS) policies
- Limited permissions (can only access data user is allowed to see)

### Secret Key (Service Role Key)
- Used in **backend** API routes (`api/` folder)
- ⚠️ **NEVER expose this in frontend code!**
- Bypasses RLS policies (has admin access)
- Only use in server-side code (Vercel functions)

---

## ✅ Next Steps

1. ✅ You have your credentials
2. ⏭️ Set up environment variables (see above)
3. ⏭️ Run database migrations (see `SUPABASE_SETUP_GUIDE.md`)
4. ⏭️ Create storage bucket (see `SUPABASE_SETUP_GUIDE.md`)
5. ⏭️ Test the connection

---

## 🔒 Security Notes

- ✅ The **publishable key** is safe to commit to Git (it's public)
- ❌ The **secret key** should NEVER be committed to Git
- ✅ Use `.env.local` for local development (already in `.gitignore`)
- ✅ Set secrets in Vercel dashboard (not in code)


