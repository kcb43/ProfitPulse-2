# Migration Guide: Moving Codebase to SSD (F: Drive)

## Overview
Moving your codebase from `C:\Users\casey\Documents\GitHub\bareretail` to `F:\bareretail` (or your preferred location on the SSD).

## ✅ What You DON'T Need to Update

### GitHub
- **No changes needed** - Git tracks files by content, not absolute paths
- Your repository URL stays the same: `https://github.com/kcb43/profitorbit.io.git`
- All commits, branches, and history remain intact

### Vercel
- **No changes needed** - Vercel deploys directly from GitHub
- Your deployment settings remain the same
- Just push code from the new location and Vercel will pick it up automatically

### Base44
- **No changes needed** - Base44 is a cloud service accessed via API
- No local paths are stored in Base44
- Your API keys and configuration remain the same

## 📋 Step-by-Step Migration Process

### Step 1: Stop All Running Processes
1. **Stop your dev server** (if running)
   - Press `Ctrl+C` in the terminal running `npm run dev`
2. **Close your IDE** (VS Code, Cursor, etc.)
3. **Close Chrome** (if extension is loaded)
4. **Stop any other processes** using the project

### Step 2: Copy the Project Folder
1. **Open File Explorer**
2. Navigate to: `C:\Users\casey\Documents\GitHub\`
3. **Copy** the `bareretail` folder (Ctrl+C)
4. Navigate to your SSD: `F:\`
5. **Paste** the folder (Ctrl+V)
   - New location: `F:\bareretail`

**OR** use Command Prompt/PowerShell:
```powershell
# Open PowerShell as Administrator
xcopy "C:\Users\casey\Documents\GitHub\bareretail" "F:\bareretail" /E /I /H /Y
```

### Step 3: Update Git Remote (if needed)
Git should work automatically, but verify:
```bash
cd F:\bareretail
git remote -v
# Should show: https://github.com/kcb43/profitorbit.io.git
```

### Step 4: Update Extension Installation Path
Update `extension/INSTALL.md`:
- Change line 14 from:
  ```
  C:\Users\casey\Documents\GitHub\bareretail\extension
  ```
- To:
  ```
  F:\bareretail\extension
  ```

### Step 5: Reinstall Node Modules (Optional but Recommended)
```bash
cd F:\bareretail
# Remove old node_modules (optional - saves space)
rmdir /s /q node_modules
# Reinstall dependencies
npm install
```

### Step 6: Reload Chrome Extension
1. Open Chrome: `chrome://extensions/`
2. Find "Profit Orbit - Crosslisting Assistant"
3. Click the **reload icon** (circular arrow)
4. If needed, click "Remove" and reload from new location:
   - Click "Load unpacked"
   - Navigate to: `F:\bareretail\extension`
   - Select the `extension` folder

### Step 7: Update IDE Workspace
1. **Open your IDE** (VS Code/Cursor)
2. **File → Open Folder**
3. Navigate to: `F:\bareretail`
4. Select the folder
5. Your IDE will remember this location

### Step 8: Test Everything
```bash
cd F:\bareretail
npm run dev
```

Verify:
- ✅ Dev server starts on `http://localhost:5173`
- ✅ Extension works on Mercari
- ✅ Git commands work (`git status`, `git push`)
- ✅ No errors in console

### Step 9: Delete Old Location (After Verification)
**ONLY after confirming everything works:**
1. Test for at least 1-2 days from new location
2. Make sure all commits are pushed to GitHub
3. Then delete: `C:\Users\casey\Documents\GitHub\bareretail`

## 🔌 When Can You Disconnect the SSD?

### Safe to Disconnect When:
- ✅ **No processes running**:
  - Dev server stopped (`npm run dev` not running)
  - IDE closed
  - Chrome closed (or extension unloaded)
  - No terminal windows open in that directory
- ✅ **No file operations**:
  - No file copying/moving in progress
  - No Git operations running
  - No npm install/build running

### Quick Check Before Disconnecting:
```powershell
# Check if any processes are using files in F:\bareretail
# Open PowerShell and run:
Get-Process | Where-Object {$_.Path -like "F:\bareretail*"}
```

If this returns nothing, it's safe to disconnect.

### Best Practice:
1. **Close all applications** using the project
2. **Wait 5-10 seconds** for file handles to release
3. **Eject safely** using Windows:
   - Right-click SSD drive in File Explorer
   - Click "Eject" or "Safely Remove Hardware"
   - Wait for confirmation before unplugging

## ⚠️ Important Notes

### Portable SSD Considerations:
- **Always eject safely** - Don't just unplug
- **Keep backups** - Portable drives can fail
- **Git is your backup** - All code is in GitHub
- **Consider cloud sync** - Use GitHub Desktop or Git to sync regularly

### If Something Goes Wrong:
1. **Don't panic** - Your code is in GitHub
2. **Clone fresh** from GitHub:
   ```bash
   cd F:\
   git clone https://github.com/kcb43/profitorbit.io.git bareretail
   cd bareretail
   npm install
   ```
3. **Reinstall extension** from new location

## 📝 Checklist

- [ ] Stop all running processes
- [ ] Copy folder to F:\bareretail
- [ ] Update INSTALL.md path
- [ ] Reinstall node_modules (optional)
- [ ] Reload Chrome extension
- [ ] Update IDE workspace
- [ ] Test dev server
- [ ] Test extension
- [ ] Test git push/pull
- [ ] Verify Vercel still deploys (automatic)
- [ ] Delete old location (after verification)

## 🚀 After Migration

Everything should work exactly the same:
- ✅ `npm run dev` - Works from F: drive
- ✅ `git push` - Works from F: drive
- ✅ Vercel deployments - Automatic from GitHub
- ✅ Base44 API - No changes needed
- ✅ Chrome Extension - Works from F: drive

The only difference is the file path - everything else remains identical!

