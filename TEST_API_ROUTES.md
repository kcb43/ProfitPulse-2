# Testing Crosslistings API Routes

## Prerequisites

1. ✅ Supabase setup complete
2. ✅ Environment variables configured
3. ✅ Database migrations run
4. ✅ Dev server running OR production URL available

## Quick Test Options

### Option 1: Using the Test Script (Recommended)

1. **Start your dev server** (if testing locally):
   ```bash
   npm run dev
   ```

2. **Run the test script**:
   ```bash
   node test-crosslistings-api.js
   ```

3. **Or test against production**:
   ```bash
   API_BASE=https://profitorbit.io node test-crosslistings-api.js
   ```

4. **With custom user ID**:
   ```bash
   TEST_USER_ID=your-actual-user-id node test-crosslistings-api.js
   ```

### Option 2: Manual Testing with curl

#### 1. Create a Crosslisting
```bash
curl -X POST http://localhost:5173/api/crosslistings \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "title": "Test Item",
    "description": "Test description",
    "price": "29.99",
    "images": ["https://example.com/image.jpg"],
    "category": "Electronics",
    "condition": "New"
  }'
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "title": "Test Item",
  "description": "Test description",
  "price": "29.99",
  "images": ["https://example.com/image.jpg"],
  "category": "Electronics",
  "condition": "New",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### 2. List All Crosslistings
```bash
curl -X GET "http://localhost:5173/api/crosslistings?userId=test-user-123" \
  -H "x-user-id: test-user-123"
```

**Expected Response:**
```json
[
  {
    "id": "uuid-here",
    "title": "Test Item",
    ...
  }
]
```

#### 3. Get Single Crosslisting
```bash
curl -X GET "http://localhost:5173/api/crosslistings/YOUR_ID_HERE"
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "title": "Test Item",
  "description": "Test description",
  "price": "29.99",
  "images": ["https://example.com/image.jpg"],
  "category": "Electronics",
  "condition": "New"
}
```

#### 4. Update Crosslisting
```bash
curl -X PUT "http://localhost:5173/api/crosslistings/YOUR_ID_HERE" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{
    "title": "Updated Title",
    "price": "39.99"
  }'
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "title": "Updated Title",
  "price": "39.99",
  ...
}
```

#### 5. Delete Crosslisting
```bash
curl -X DELETE "http://localhost:5173/api/crosslistings/YOUR_ID_HERE" \
  -H "x-user-id: test-user-123"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Crosslisting deleted successfully."
}
```

### Option 3: Using Browser/Postman

1. **Start dev server**: `npm run dev`
2. **Open browser console** or use Postman
3. **Test each endpoint**:

#### Create (POST)
```javascript
fetch('http://localhost:5173/api/crosslistings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'test-user-123'
  },
  body: JSON.stringify({
    title: 'Test Item',
    description: 'Test description',
    price: '29.99',
    images: ['https://example.com/image.jpg'],
    category: 'Electronics',
    condition: 'New'
  })
})
.then(r => r.json())
.then(console.log);
```

#### List (GET)
```javascript
fetch('http://localhost:5173/api/crosslistings?userId=test-user-123', {
  headers: { 'x-user-id': 'test-user-123' }
})
.then(r => r.json())
.then(console.log);
```

#### Get Single (GET)
```javascript
fetch('http://localhost:5173/api/crosslistings/YOUR_ID_HERE')
.then(r => r.json())
.then(console.log);
```

#### Update (PUT)
```javascript
fetch('http://localhost:5173/api/crosslistings/YOUR_ID_HERE', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': 'test-user-123'
  },
  body: JSON.stringify({
    title: 'Updated Title',
    price: '39.99'
  })
})
.then(r => r.json())
.then(console.log);
```

#### Delete (DELETE)
```javascript
fetch('http://localhost:5173/api/crosslistings/YOUR_ID_HERE', {
  method: 'DELETE',
  headers: { 'x-user-id': 'test-user-123' }
})
.then(r => r.json())
.then(console.log);
```

## Common Issues & Solutions

### Issue: "Supabase environment variables not configured"
**Solution:** Make sure `.env.local` exists with:
```env
VITE_SUPABASE_URL=https://hlcwhpajorzbleabavcr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_AmJEyN9K_q2OJAUCGiO3eA_NZYf6rXm
SUPABASE_SERVICE_ROLE_KEY=sb_secret_jfF_FPZMZNXkJcAp8da0SA_UcqFHU4-
```

### Issue: "Crosslisting not found"
**Solution:** 
- Make sure the `crosslistings` table exists in Supabase
- Run the migration SQL from `supabase/migrations/001_initial_schema.sql`
- Check that the ID you're using is correct

### Issue: "Authentication required"
**Solution:** Make sure you're sending the `x-user-id` header:
```bash
-H "x-user-id: your-user-id"
```

### Issue: "Failed to create crosslisting"
**Solution:**
- Check that all required fields are provided (title, description, price, images)
- Verify images is an array with at least one item
- Check Supabase logs for detailed error messages

### Issue: CORS errors
**Solution:** 
- Make sure your dev server is running
- Check that the API route is being proxied correctly
- Verify CORS headers are set in the API route

## Verification Checklist

- [ ] Create crosslisting works
- [ ] List crosslistings works
- [ ] Get single crosslisting works
- [ ] Update crosslisting works
- [ ] Delete crosslisting works
- [ ] Error handling works (404, 401, 400)
- [ ] User isolation works (users can only see their own crosslistings)
- [ ] Data persists in Supabase database

## Next Steps

Once all tests pass:
1. ✅ Phase 2 complete - API routes migrated
2. ⏭️ Move to Phase 3 - Frontend migration (update 27 files)


