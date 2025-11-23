# Git Workflow for Multiple Machines

## Pulling Latest Changes on Your Laptop

If you already have the repository cloned on your laptop:

1. **Navigate to your project directory:**
   ```bash
   cd path/to/bareretail
   ```

2. **Check your current branch:**
   ```bash
   git branch
   ```
   Make sure you're on the `main` branch. If not, switch to it:
   ```bash
   git checkout main
   ```

3. **Pull the latest changes from GitHub:**
   ```bash
   git pull origin main
   ```

4. **Install/update dependencies (if needed):**
   ```bash
   npm install
   ```
   Or if you're using pnpm:
   ```bash
   pnpm install
   ```

5. **Check that environment variables are set:**
   Make sure your `.env` file (or environment variables) are configured with:
   - `VITE_EBAY_CLIENT_ID`
   - `VITE_EBAY_CLIENT_SECRET`
   - `EBAY_DEV_ID`
   - `EBAY_ENV=production` (or `sandbox`)

## If You Don't Have the Repository Yet

If you need to clone it fresh on your laptop:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kcb43/ProfitPulse-2.git
   cd ProfitPulse-2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   Or:
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with your credentials (see `ENVIRONMENT_SETUP.md`)

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Or:
   ```bash
   pnpm dev
   ```

## Daily Workflow

### Starting Work (Pull Latest):
```bash
git pull origin main
npm install  # Only if package.json changed
```

### Making Changes:
```bash
# Make your changes...
git add .
git commit -m "Your commit message"
git push origin main
```

### If You Have Uncommitted Changes:
```bash
# Save your work first
git stash

# Pull latest changes
git pull origin main

# Restore your work
git stash pop
```

## Resolving Conflicts

If you get merge conflicts:

```bash
# Pull with rebase (cleaner history)
git pull --rebase origin main

# Or pull normally and resolve conflicts
git pull origin main

# After resolving conflicts:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

