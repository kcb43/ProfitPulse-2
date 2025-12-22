# Import Your Data to Supabase - Step by Step

## ✅ You Have:
- ✅ `inventory-export.json` - Your inventory data
- ✅ `sales-export.json` - Your sales data
- ✅ Signed in with Google OAuth (bellevuecasey54@gmail.com)

## 🚀 Import Steps:

### Step 1: Make Sure You're Signed In

1. Go to: http://localhost:5173/login
2. Sign in with Google (bellevuecasey54@gmail.com)
3. You should be redirected to the dashboard

### Step 2: Open Browser Console

1. Press **F12** to open Developer Tools
2. Click the **Console** tab

### Step 3: Load the Import Script

1. **Copy the entire contents** of `IMPORT_TO_SUPABASE.js`
2. **Paste it into the console**
3. **Press Enter**

You should see:
```
🚀 Starting Data Import to Supabase...
📋 Step 1: Getting your Supabase user ID...
✅ Signed in as: bellevuecasey54@gmail.com
✅ Your new Supabase User ID: [some-uuid]
```

### Step 4: Load Your Inventory Data

1. **Open** `inventory-export.json` from your Downloads folder in a text editor (Notepad, VS Code, etc.)
2. **Select ALL** the content (Ctrl+A)
3. **Copy** it (Ctrl+C)
4. **Go back to browser console**
5. **Type**: `const inventoryData = `
6. **Paste** the JSON content
7. **Press Enter**

You should see: `undefined` (that's normal)

### Step 5: Load Your Sales Data

1. **Open** `sales-export.json` from your Downloads folder
2. **Select ALL** the content (Ctrl+A)
3. **Copy** it (Ctrl+C)
4. **Go back to browser console**
5. **Type**: `const salesData = `
6. **Paste** the JSON content
7. **Press Enter**

You should see: `undefined` (that's normal)

### Step 6: Run the Import

In the console, you should see a message with your user ID. Copy that user ID, then type:

```javascript
await importInventoryAndSales(inventoryData, salesData, "your-user-id-here");
```

**OR** if the script already showed your user ID, just type:

```javascript
await importInventoryAndSales(inventoryData, salesData);
```

And press Enter.

### Step 7: Wait for Import

You'll see progress messages like:
```
📦 Importing 50 inventory items...
  ✅ Imported 10/50 items...
  ✅ Imported 20/50 items...
✅ Imported 50 inventory items

💰 Importing 30 sales...
  ✅ Imported 10/30 sales...
✅ Imported 30 sales

✨ Import Complete!
```

### Step 8: Verify Your Data

1. **Refresh your browser** (F5)
2. **Go to Inventory page** - You should see all your items!
3. **Go to Sales History** - You should see all your sales!

## 🎉 Done!

Your data is now in Supabase with your new user ID!

## Troubleshooting

### "You must be signed in!"
- Make sure you're signed in at `/login`
- Check that you see your email in the console

### "inventoryData is not defined"
- Make sure you loaded the inventory data (Step 4)
- Check that you copied the ENTIRE JSON file

### "salesData is not defined"
- Make sure you loaded the sales data (Step 5)
- Check that you copied the ENTIRE JSON file

### Import errors
- Some items might fail if they have invalid data
- Check the error messages in console
- Most items should still import successfully

### Still don't see data after import?
- Refresh the page (F5)
- Check browser console for errors
- Verify you're signed in with the same account

## Need Help?

If you get stuck, share:
1. What step you're on
2. Any error messages from the console
3. Screenshot if helpful

Let's get your data back! 🚀


