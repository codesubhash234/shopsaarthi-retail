# Vercel Deployment Guide (SQLite Version)

This Flask application has been configured for deployment on Vercel using SQLite database. 

⚠️ **IMPORTANT DATA PERSISTENCE WARNING**: 
- On Vercel, SQLite data is stored in `/tmp/` directory
- **All data will be lost when the serverless function restarts** (typically every few hours or on new deployments)
- This setup is suitable for testing/demo purposes only
- For production with persistent data, consider using a cloud database

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Git repository with your code

## Deployment Steps

### 1. Environment Variables (Optional)

In your Vercel dashboard, you can optionally set these environment variables:

- `SECRET_KEY`: A secure random string for Flask sessions (optional, has default)
- `GEMINI_API_KEY`: Your Google Gemini API key (only if using AI features)
- `FLASK_ENV`: Set to `production`

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm i -g vercel
vercel --prod
```

#### Option B: Using Git Integration
1. Connect your GitHub/GitLab repository to Vercel
2. Vercel will automatically deploy on every push to main branch

### 4. Post-Deployment

After deployment:
1. Visit your Vercel app URL
2. Register a new admin user
3. The database tables will be created automatically on first access

## File Structure

```
├── api/
│   └── index.py          # Vercel entry point
├── static/               # CSS, JS, images
├── templates/            # HTML templates
├── app.py               # Main Flask application
├── models.py            # Database models
├── requirements.txt     # Python dependencies
├── vercel.json         # Vercel configuration
└── .env.example        # Environment variables template
```

## Important Notes

- SQLite is used for local development
- Production uses your configured DATABASE_URL
- Static files are served directly by Vercel
- Database migrations run automatically on startup
- Session data is stored in database, not filesystem

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Ensure database server allows connections from Vercel IPs

2. **Import Errors**
   - Check all dependencies are in requirements.txt
   - Verify Python version compatibility

3. **Static Files Not Loading**
   - Ensure static files are in the `static/` directory
   - Check file paths in templates

### Logs

View deployment logs in Vercel dashboard:
1. Go to your project dashboard
2. Click on "Functions" tab
3. View logs for debugging

## Local Development

To run locally:
```bash
pip install -r requirements.txt
python app.py
```

The app will run on `http://localhost:5004`

## Support

For issues specific to this retail management system, check the main README.md file.
For Vercel-specific issues, consult the [Vercel documentation](https://vercel.com/docs).
