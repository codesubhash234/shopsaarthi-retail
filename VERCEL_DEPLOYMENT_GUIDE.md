# Vercel Deployment Guide for ShopSaarthi

## Current Status
✅ **Partially Deployed**: Your application was successfully built and deployed to Vercel, but encountered a size limit issue.

**Deployment URL**: https://sih-main-3-9g08xwibg-subhash-guptas-projects-1d588113.vercel.app

## Issues Encountered

### 1. Size Limit Exceeded
- **Error**: "A Serverless Function has exceeded the unzipped maximum size of 250 MB"
- **Cause**: The application bundle is too large for Vercel's serverless function limits
- **Status**: Needs optimization

### 2. SQLite Database Limitations on Vercel

⚠️ **CRITICAL LIMITATION**: SQLite databases on Vercel are **ephemeral** and will be reset on every function restart.

#### Why SQLite is problematic on Vercel:
- Vercel uses serverless functions that are stateless
- Each function invocation gets a fresh `/tmp` directory
- Database files are lost when the function goes idle (typically after 15 minutes)
- No persistent storage for SQLite files

#### What this means for your app:
- ❌ User registrations will be lost
- ❌ Product data will disappear
- ❌ Sales records won't persist
- ❌ All data resets frequently

## Recommended Solutions

### Option 1: Use a Cloud Database (Recommended)
Replace SQLite with a persistent cloud database:

#### PostgreSQL Options:
- **Neon** (Free tier available): https://neon.tech/
- **Supabase** (Free tier): https://supabase.com/
- **Railway** (Free tier): https://railway.app/
- **PlanetScale** (MySQL-compatible): https://planetscale.com/

#### Setup Steps:
1. Create a database on one of the above platforms
2. Get the connection URL
3. Update your `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```
4. Update `app.py` to use the DATABASE_URL instead of SQLite

### Option 2: Use Vercel KV (Redis-based)
For simple key-value storage:
- Good for session data, caching
- Not ideal for complex relational data
- Requires code restructuring

### Option 3: Deploy to a Different Platform
Consider platforms that support persistent storage:
- **Railway**: Supports SQLite with persistent volumes
- **Render**: Free tier with persistent disks
- **Fly.io**: Supports persistent volumes
- **DigitalOcean App Platform**: Has persistent storage options

## Quick Fix for Current Deployment

### Reduce Bundle Size:
1. **Clean up unnecessary files**:
   ```bash
   # Remove any large files, logs, or temporary data
   find . -name "*.log" -delete
   find . -name "*.tmp" -delete
   find . -name "__pycache__" -type d -exec rm -rf {} +
   ```

2. **Update .gitignore** (already done):
   - Excludes database files, logs, cache files

3. **Optimize dependencies**:
   - Review `requirements.txt` for unused packages
   - Consider using lighter alternatives

## Current Configuration Status

✅ **Fixed Issues**:
- Flask app initialization for Vercel compatibility
- Database initialization handling
- Vercel configuration (`vercel.json`)
- Environment variable setup
- Authentication with Vercel CLI

⚠️ **Remaining Issues**:
- Bundle size optimization needed
- Database persistence solution required

## Next Steps

### Immediate (to get a working deployment):
1. **Choose a cloud database** from Option 1 above
2. **Update database configuration** in `app.py`
3. **Redeploy** with persistent database

### Alternative (quick test):
1. **Accept data loss limitation** for testing purposes
2. **Optimize bundle size** and redeploy
3. **Note**: All data will reset periodically

## Environment Variables for Production

Add these to your Vercel project settings:

```bash
# Required
SECRET_KEY=your-production-secret-key-here
DATABASE_URL=your-database-connection-string
FLASK_ENV=production
VERCEL=1

# Optional (if using AI features)
GEMINI_API_KEY=your-gemini-api-key
```

## Testing Your Deployment

Once deployed successfully:
1. Visit your Vercel URL
2. Register a new account
3. Add some test products
4. Create a test sale
5. **Important**: Check back after 30 minutes to see if data persists

## Support

If you need help with:
- Setting up a cloud database
- Migrating from SQLite
- Optimizing the deployment
- Alternative hosting platforms

Let me know which option you'd prefer to pursue!
