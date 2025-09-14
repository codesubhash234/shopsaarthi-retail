# Vercel API endpoint for Flask app
import sys
import os

# Add the parent directory to the Python path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set environment variable to indicate we're running on Vercel
os.environ['VERCEL'] = '1'

try:
    from app import app
    # If import succeeds, use the main app
    application = app
except Exception as e:
    print(f"Error importing main app: {e}")
    # Create a simple fallback app
    from flask import Flask
    application = Flask(__name__)
    
    @application.route('/')
    def health_check():
        return f"Flask app loading error: {str(e)}", 500

# For Vercel compatibility
app = application
